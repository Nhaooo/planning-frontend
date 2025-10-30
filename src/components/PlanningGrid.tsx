import { FC, useEffect, useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Clock, Edit, Trash2, Copy, Move, RotateCcw } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { weekService, slotService } from '../services/api'
import { generateTimeSlots, getDayNames, getWeekDates, getMondayOfWeek } from '../utils/timeUtils'
import SlotModal from './SlotModal'
import LoadingSpinner from './LoadingSpinner'
import { Slot, SlotFormData, WeekResponse, TimeSlot } from '../types'
import { getCategoryStyle } from '../utils/categoryUtils'

// Types pour le drag & drop
interface DragState {
  isDragging: boolean
  draggedSlot: Slot | null
  dragType: 'move' | 'resize' | 'duplicate' | null
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  originalSlot: Slot | null
  previewSlot: Partial<Slot> | null
}

const PlanningGrid: FC = () => {
  const {
    selectedEmployeeId,
    selectedWeekKind,
    selectedVacationPeriod,
    selectedWeekStart,
    currentWeek,
    setCurrentWeek,
    setSaveStatus
  } = usePlanningStore()

  const queryClient = useQueryClient()
  const gridRef = useRef<HTMLDivElement>(null)
  
  // États locaux
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<Partial<SlotFormData> | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedSlot: null,
    dragType: null,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    originalSlot: null,
    previewSlot: null
  })

  // Configuration de la grille
  const OPENING_HOUR = 9
  const CLOSING_HOUR = 22
  const CELL_HEIGHT = 64 // hauteur d'une cellule en px
  const TIME_COLUMN_WIDTH = 80 // largeur colonne des heures
  
  const timeSlots = generateTimeSlots(OPENING_HOUR, CLOSING_HOUR)
  const dayNames = getDayNames()
  const mondayDate = getMondayOfWeek(selectedWeekStart)
  const weekDates = getWeekDates(mondayDate)

  console.log('🔄 PlanningGrid render - Employé:', selectedEmployeeId, 'Semaine courante:', currentWeek?.week.id)

  // ==================== REQUÊTES ET MUTATIONS ====================

  // Charger les données de la semaine
  const { data: weekData, isLoading, error, refetch } = useQuery<WeekResponse[]>({
    queryKey: ['planning-week', selectedEmployeeId, selectedWeekKind, selectedVacationPeriod, selectedWeekStart],
    queryFn: async () => {
      if (!selectedEmployeeId) {
        console.log('❌ Pas d\'employé sélectionné')
        return []
      }
      
      console.log('📊 Chargement semaine...', {
        employeeId: selectedEmployeeId,
        kind: selectedWeekKind,
        vacation: selectedVacationPeriod,
        weekStart: selectedWeekStart
      })
      
      try {
        const result = await weekService.getWeeks({
          employeeId: selectedEmployeeId,
          kind: selectedWeekKind,
          vacation: selectedVacationPeriod,
          weekStart: selectedWeekStart
        })
        
        console.log('✅ Semaine chargée:', result)
        return result || []
      } catch (error) {
        console.error('❌ Erreur chargement semaine:', error)
        return []
      }
    },
    enabled: !!selectedEmployeeId,
    staleTime: 30000, // 30 secondes
    retry: 2
  })

  // Créer une semaine si elle n'existe pas
  const createWeekMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEmployeeId) throw new Error('Aucun employé sélectionné')
      
      console.log('🆕 Création nouvelle semaine...')
      return await weekService.createWeek(
        selectedEmployeeId,
        selectedWeekKind,
        selectedWeekStart,
        selectedVacationPeriod
      )
    },
    onSuccess: (newWeek) => {
      console.log('✅ Semaine créée:', newWeek)
      setCurrentWeek(newWeek)
      queryClient.invalidateQueries({ queryKey: ['planning-week'] })
    },
    onError: (error) => {
      console.error('❌ Erreur création semaine:', error)
      alert('Erreur lors de la création de la semaine')
    }
  })

  // Créer un créneau
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: SlotFormData) => {
      if (!currentWeek) throw new Error('Aucune semaine sélectionnée')
      
      console.log('🆕 Création créneau:', slotData)
      return await slotService.createSlot(currentWeek.week.id, slotData)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: (newSlot) => {
      console.log('✅ Créneau créé:', newSlot)
      setSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['planning-week'] })
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur création créneau:', error)
      setSaveStatus('error')
      alert('Erreur lors de la création du créneau')
    }
  })

  // Modifier un créneau
  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotId, slotData }: { slotId: number; slotData: Partial<SlotFormData> }) => {
      if (!currentWeek) throw new Error('Aucune semaine sélectionnée')
      
      console.log('🔄 Modification créneau:', slotId, slotData)
      return await slotService.updateSlot(currentWeek.week.id, slotId, slotData)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      console.log('✅ Créneau modifié')
      setSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['planning-week'] })
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur modification créneau:', error)
      setSaveStatus('error')
      alert('Erreur lors de la modification du créneau')
    }
  })

  // Supprimer un créneau
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      if (!currentWeek) throw new Error('Aucune semaine sélectionnée')
      
      console.log('🗑️ Suppression créneau:', slotId)
      return await slotService.deleteSlot(currentWeek.week.id, slotId)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      console.log('✅ Créneau supprimé')
      setSaveStatus('saved')
      queryClient.invalidateQueries({ queryKey: ['planning-week'] })
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur suppression créneau:', error)
      setSaveStatus('error')
      alert('Erreur lors de la suppression du créneau')
    }
  })

  // ==================== GESTION DES DONNÉES ====================

  // Mettre à jour la semaine courante
  useEffect(() => {
    if (weekData && weekData.length > 0) {
      console.log('📊 Mise à jour semaine courante:', weekData[0])
      setCurrentWeek(weekData[0])
    } else {
      console.log('📊 Aucune semaine trouvée')
      setCurrentWeek(undefined)
    }
  }, [weekData, setCurrentWeek])

  // ==================== FONCTIONS UTILITAIRES ====================

  // Calculer la position d'un créneau
  const getSlotPosition = useCallback((startMin: number, durationMin: number) => {
    const top = ((startMin - OPENING_HOUR * 60) / 60) * CELL_HEIGHT
    const height = Math.max((durationMin / 60) * CELL_HEIGHT, 32)
    return { top, height }
  }, [])

  // Formater l'heure
  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }, [])

  // Convertir coordonnées en position grille
  const getGridPosition = useCallback((clientX: number, clientY: number) => {
    if (!gridRef.current) return null

    const gridRect = gridRef.current.getBoundingClientRect()
    const dayWidth = (gridRect.width - TIME_COLUMN_WIDTH) / 7
    
    const dayIndex = Math.floor((clientX - gridRect.left - TIME_COLUMN_WIDTH) / dayWidth)
    const timeIndex = Math.floor((clientY - gridRect.top) / CELL_HEIGHT)
    
    if (dayIndex < 0 || dayIndex >= 7 || timeIndex < 0 || timeIndex >= timeSlots.length) {
      return null
    }

    return {
      dayIndex,
      timeIndex,
      startMin: timeSlots[timeIndex].totalMinutes
    }
  }, [timeSlots])

  // ==================== GESTIONNAIRES D'ÉVÉNEMENTS ====================

  // Clic sur cellule vide pour créer un créneau
  const handleCellClick = useCallback((dayIndex: number, timeSlot: TimeSlot) => {
    if (dragState.isDragging) return

    console.log('🎯 Clic cellule pour création:', { dayIndex, timeSlot: timeSlot.label })

    const slotData: Partial<SlotFormData> = {
      day_index: dayIndex,
      start_min: timeSlot.totalMinutes,
      duration_min: 60,
      title: '',
      category: 'a',
      comment: ''
    }

    setNewSlotData(slotData)
    setSelectedSlot(null)
    setIsModalOpen(true)
  }, [dragState.isDragging])

  // Clic sur créneau existant pour le modifier
  const handleSlotClick = useCallback((slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    if (dragState.isDragging) return

    console.log('✏️ Clic créneau pour modification:', slot)
    setSelectedSlot(slot)
    setNewSlotData(null)
    setIsModalOpen(true)
  }, [dragState.isDragging])

  // Supprimer un créneau
  const handleSlotDelete = useCallback(async (slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (window.confirm(`Supprimer le créneau "${slot.title}" ?`)) {
      await deleteSlotMutation.mutateAsync(slot.id)
    }
  }, [deleteSlotMutation])

  // Dupliquer un créneau
  const handleSlotDuplicate = useCallback(async (slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    
    const duplicateData: SlotFormData = {
      day_index: slot.day_index,
      start_min: slot.start_min + slot.duration_min, // Placer après le créneau original
      duration_min: slot.duration_min,
      title: `${slot.title} (copie)`,
      category: slot.category,
      comment: slot.comment || ''
    }
    
    await createSlotMutation.mutateAsync(duplicateData)
  }, [createSlotMutation])

  // Fermer le modal
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false)
    setSelectedSlot(null)
    setNewSlotData(null)
  }, [])

  // Sauvegarder depuis le modal
  const handleModalSave = useCallback(async (data: SlotFormData) => {
    console.log('💾 Sauvegarde depuis modal:', data)

    // S'assurer qu'on a une semaine
    if (!currentWeek) {
      console.log('⚠️ Pas de semaine, création automatique...')
      await createWeekMutation.mutateAsync()
      // Attendre que la semaine soit créée
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    try {
      if (selectedSlot) {
        // Modification
        await updateSlotMutation.mutateAsync({
          slotId: selectedSlot.id,
          slotData: data
        })
      } else {
        // Création
        await createSlotMutation.mutateAsync(data)
      }
      handleModalClose()
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error)
    }
  }, [selectedSlot, currentWeek, createWeekMutation, updateSlotMutation, createSlotMutation, handleModalClose])

  // ==================== DRAG & DROP ====================

  // Début du drag
  const handleMouseDown = useCallback((slot: Slot, e: React.MouseEvent, dragType: 'move' | 'resize' | 'duplicate') => {
    if (e.button !== 0) return // Seulement clic gauche

    console.log('🖱️ Début drag:', { slotId: slot.id, dragType })

    setDragState({
      isDragging: true,
      draggedSlot: slot,
      dragType,
      startPosition: { x: e.clientX, y: e.clientY },
      currentPosition: { x: e.clientX, y: e.clientY },
      originalSlot: { ...slot },
      previewSlot: null
    })

    e.preventDefault()
  }, [])

  // Mouvement pendant le drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedSlot) return

    const newPosition = getGridPosition(e.clientX, e.clientY)
    if (!newPosition) return

    setDragState(prev => ({
      ...prev,
      currentPosition: { x: e.clientX, y: e.clientY },
      previewSlot: {
        ...prev.draggedSlot,
        day_index: newPosition.dayIndex,
        start_min: newPosition.startMin
      }
    }))
  }, [dragState.isDragging, dragState.draggedSlot, getGridPosition])

  // Fin du drag
  const handleMouseUp = useCallback(async () => {
    if (!dragState.isDragging || !dragState.draggedSlot || !dragState.originalSlot) {
      setDragState({
        isDragging: false,
        draggedSlot: null,
        dragType: null,
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        originalSlot: null,
        previewSlot: null
      })
      return
    }

    const { draggedSlot, originalSlot, previewSlot, dragType } = dragState

    // Vérifier si la position a changé
    const hasChanged = previewSlot && (
      previewSlot.day_index !== originalSlot.day_index ||
      previewSlot.start_min !== originalSlot.start_min
    )

    if (hasChanged && previewSlot) {
      console.log('💾 Sauvegarde après drag:', { dragType, original: originalSlot, new: previewSlot })

      try {
        if (dragType === 'duplicate') {
           // Duplication
           await createSlotMutation.mutateAsync({
             day_index: previewSlot.day_index!,
             start_min: previewSlot.start_min!,
             duration_min: draggedSlot.duration_min,
             title: `${draggedSlot.title} (copie)`,
             category: draggedSlot.category,
             comment: draggedSlot.comment || ''
           })
         } else {
           // Déplacement
           await updateSlotMutation.mutateAsync({
             slotId: draggedSlot.id,
             slotData: {
               day_index: previewSlot.day_index!,
               start_min: previewSlot.start_min!,
               duration_min: draggedSlot.duration_min,
               title: draggedSlot.title,
               category: draggedSlot.category,
               comment: draggedSlot.comment
             }
           })
         }
      } catch (error) {
        console.error('❌ Erreur drag & drop:', error)
      }
    }

    // Reset du drag state
    setDragState({
      isDragging: false,
      draggedSlot: null,
      dragType: null,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      originalSlot: null,
      previewSlot: null
    })
  }, [dragState, createSlotMutation, updateSlotMutation])

  // Event listeners pour le drag & drop
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp])

  // ==================== RENDU ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
        <span className="ml-3 text-gray-600">Chargement du planning...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <Clock className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Erreur lors du chargement</p>
          <p className="text-sm">{error.message}</p>
        </div>
        <button onClick={() => refetch()} className="btn-primary">
          <RotateCcw className="h-4 w-4 mr-2" />
          Réessayer
        </button>
      </div>
    )
  }

  if (!selectedEmployeeId) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 text-lg">Sélectionnez un employé pour afficher le planning</p>
      </div>
    )
  }

  // Si pas de semaine, proposer d'en créer une
  if (!currentWeek) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <Clock className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune semaine de planning
          </h3>
          <p className="text-gray-600 mb-6">
            Créez une nouvelle semaine pour commencer à planifier les créneaux.
          </p>
          <button
            onClick={() => createWeekMutation.mutate()}
            disabled={createWeekMutation.isPending}
            className="btn-primary"
          >
            {createWeekMutation.isPending ? (
              <>
                <LoadingSpinner size="small" />
                <span className="ml-2">Création...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Créer une semaine de planning
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Barre de debug */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span><strong>Employé:</strong> {selectedEmployeeId}</span>
            <span><strong>Semaine:</strong> {currentWeek.week.id}</span>
            <span><strong>Créneaux:</strong> {currentWeek.slots.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            {createSlotMutation.isPending && <span className="text-blue-600">Création...</span>}
            {updateSlotMutation.isPending && <span className="text-orange-600">Modification...</span>}
            {deleteSlotMutation.isPending && <span className="text-red-600">Suppression...</span>}
          </div>
        </div>
      </div>

      {/* En-tête avec les jours */}
      <div className="grid grid-cols-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        <div className="p-4 border-r border-gray-200 flex items-center justify-center">
          <Clock className="h-5 w-5 text-gray-500" />
        </div>
        {dayNames.map((dayName, index) => (
          <div key={index} className="p-4 border-r border-gray-200 last:border-r-0 text-center">
            <div className="font-semibold text-gray-900 text-sm md:text-base">
              <span className="hidden md:inline">{dayName}</span>
              <span className="md:hidden">{dayName.slice(0, 3)}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {weekDates[index].toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Grille principale */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar" ref={gridRef}>
        <div className="grid grid-cols-8 min-h-full relative">
          {/* Colonne des heures */}
          <div className="border-r border-gray-200 bg-gray-50 sticky left-0 z-10">
            {timeSlots.map((timeSlot, index) => (
              <div 
                key={index} 
                className="h-16 border-b border-gray-200 flex items-center justify-center text-sm text-gray-600 font-medium"
              >
                {timeSlot.label}
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const daySlots = currentWeek.slots.filter(slot => slot.day_index === dayIndex)
            
            return (
              <div key={dayIndex} className="border-r border-gray-200 last:border-r-0 relative bg-white">
                {/* Cellules horaires */}
                {timeSlots.map((timeSlot, timeIndex) => (
                  <div
                    key={timeIndex}
                    className="h-16 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group relative"
                    onClick={() => handleCellClick(dayIndex, timeSlot)}
                    title={`Créer un créneau à ${timeSlot.label}`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ))}

                {/* Créneaux */}
                {daySlots.map((slot) => {
                  const position = getSlotPosition(slot.start_min, slot.duration_min)
                  const categoryStyle = getCategoryStyle(slot.category)
                  const isDragged = dragState.draggedSlot?.id === slot.id
                  
                  return (
                    <div
                      key={slot.id}
                      className={`absolute left-1 right-1 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-lg hover:scale-105 z-20 group ${
                        isDragged ? 'opacity-50 scale-110 shadow-xl' : ''
                      }`}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        ...categoryStyle
                      }}
                      onClick={(e) => handleSlotClick(slot, e)}
                    >
                      {/* Contenu du créneau */}
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div>
                          <div className="font-medium text-xs leading-tight truncate pr-6">
                            {slot.title}
                          </div>
                          <div className="text-xs opacity-75 mt-1">
                            {formatTime(slot.start_min)} - {formatTime(slot.start_min + slot.duration_min)}
                          </div>
                        </div>
                        {slot.comment && (
                          <div className="text-xs opacity-75 truncate">
                            {slot.comment}
                          </div>
                        )}
                      </div>

                      {/* Actions au hover */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex flex-col space-y-1">
                        <button
                          onClick={(e) => handleSlotClick(slot, e)}
                          className="p-1 bg-white bg-opacity-90 rounded shadow hover:bg-opacity-100 transition-all"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => handleSlotDuplicate(slot, e)}
                          className="p-1 bg-white bg-opacity-90 rounded shadow hover:bg-opacity-100 transition-all"
                          title="Dupliquer"
                        >
                          <Copy className="h-3 w-3 text-green-600" />
                        </button>
                        <button
                          onClick={(e) => handleSlotDelete(slot, e)}
                          className="p-1 bg-white bg-opacity-90 rounded shadow hover:bg-opacity-100 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>

                      {/* Poignées de drag */}
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100">
                        <button
                          onMouseDown={(e) => handleMouseDown(slot, e, 'move')}
                          className="p-1 bg-white bg-opacity-90 rounded shadow hover:bg-opacity-100 transition-all cursor-move"
                          title="Déplacer"
                        >
                          <Move className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>

                      {/* Poignée de redimensionnement */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-black bg-opacity-20 rounded-b-lg"
                        onMouseDown={(e) => handleMouseDown(slot, e, 'resize')}
                        title="Redimensionner"
                      />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal pour créer/éditer un créneau */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        slot={selectedSlot}
        initialData={newSlotData}
      />
    </div>
  )
}

export default PlanningGrid
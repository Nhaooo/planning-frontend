import { FC, useEffect, useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Clock, Edit, Trash2 } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { weekService, slotService } from '../services/api'
import { generateTimeSlots, getDayNames, getWeekDates, getMondayOfWeek } from '../utils/timeUtils'
import SlotModal from './SlotModal'
import LoadingSpinner from './LoadingSpinner'
import { Slot, SlotFormData, WeekResponse, TimeSlot } from '../types'
import { getCategoryStyle } from '../utils/categoryUtils'

interface DragState {
  isDragging: boolean
  draggedSlot: Slot | null
  dragOffset: { x: number; y: number }
  isResizing: boolean
  resizeDirection: 'top' | 'bottom' | null
  originalPosition: { dayIndex: number; startMin: number; durationMin: number } | null
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
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<Partial<SlotFormData> | null>(null)
  const [dragState] = useState<DragState>({
    isDragging: false,
    draggedSlot: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeDirection: null,
    originalPosition: null
  })

  // Configuration de la grille
  const openingHour = 9
  const closingHour = 22
  const timeSlots = generateTimeSlots(openingHour, closingHour)
  const dayNames = getDayNames()
  const mondayDate = getMondayOfWeek(selectedWeekStart)
  const weekDates = getWeekDates(mondayDate)

  // Charger les données de la semaine
  const { data, isLoading, error, refetch } = useQuery<WeekResponse[] | null>({
    queryKey: ['week', selectedEmployeeId, selectedWeekKind, selectedVacationPeriod, selectedWeekStart],
    queryFn: async () => {
      if (!selectedEmployeeId) {
        console.log('❌ Pas d\'employé sélectionné')
        return null
      }
      
      console.log('📊 Chargement semaine pour employé:', selectedEmployeeId)
      const result = await weekService.getWeeks({
        employeeId: selectedEmployeeId,
        kind: selectedWeekKind,
        vacation: selectedVacationPeriod,
        weekStart: selectedWeekStart
      })
      console.log('📊 Données semaine reçues:', result)
      return result
    },
    enabled: !!selectedEmployeeId
  })

  // Mutation pour créer un créneau - VERSION SIMPLE ET ROBUSTE
  const createSlotMutation = useMutation({
    mutationFn: async (slotData: SlotFormData) => {
      console.log('🚀 === DÉBUT CRÉATION CRÉNEAU ===')
      console.log('📝 Données à créer:', slotData)
      
      if (!currentWeek) {
        console.error('❌ Pas de semaine courante')
        throw new Error('Aucune semaine sélectionnée')
      }

      console.log('📅 Semaine courante:', currentWeek.week.id)
      console.log('🔗 URL API:', `${(import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/weeks/${currentWeek.week.id}/slots`)
      
      // Appel API direct avec logs détaillés
      const result = await slotService.createSlot(currentWeek.week.id, slotData)
      console.log('✅ Créneau créé avec succès:', result)
      console.log('🚀 === FIN CRÉATION CRÉNEAU ===')
      
      return result
    },
    onMutate: () => {
      console.log('⏳ Début mutation création...')
      setSaveStatus('saving')
    },
    onSuccess: (newSlot) => {
      console.log('🎉 Succès création, nouveau créneau:', newSlot)
      setSaveStatus('saved')
      
      // Forcer le rechargement des données
      console.log('🔄 Rechargement des données...')
      refetch()
      
      // Invalider le cache pour forcer un refresh
      queryClient.invalidateQueries({ queryKey: ['week'] })
      
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur création:', error)
      setSaveStatus('error')
      alert(`Erreur lors de la création: ${error.message}`)
    }
  })

  // Mutation pour modifier un créneau
  const updateSlotMutation = useMutation({
    mutationFn: async ({ slotId, slotData }: { slotId: number; slotData: Partial<SlotFormData> }) => {
      console.log('🔄 Modification créneau:', slotId, slotData)
      
      if (!currentWeek) {
        throw new Error('Aucune semaine sélectionnée')
      }

      return await slotService.updateSlot(currentWeek.week.id, slotId, slotData)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['week'] })
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur modification:', error)
      setSaveStatus('error')
    }
  })

  // Mutation pour supprimer un créneau
  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId: number) => {
      console.log('🗑️ Suppression créneau:', slotId)
      
      if (!currentWeek) {
        throw new Error('Aucune semaine sélectionnée')
      }

      return await slotService.deleteSlot(currentWeek.week.id, slotId)
    },
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      queryClient.invalidateQueries({ queryKey: ['week'] })
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: (error) => {
      console.error('❌ Erreur suppression:', error)
      setSaveStatus('error')
    }
  })

  // Gérer les données
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('📊 Mise à jour semaine courante:', data[0])
      setCurrentWeek(data[0])
    }
  }, [data, setCurrentWeek])

  // Gestionnaire de clic sur cellule vide - VERSION SIMPLIFIÉE
  const handleCellClick = useCallback((dayIndex: number, timeSlot: TimeSlot) => {
    if (dragState.isDragging) return

    console.log('🎯 === CLIC CELLULE POUR CRÉATION ===')
    console.log('📅 Jour:', dayIndex, '⏰ Heure:', timeSlot.label)
    console.log('🔢 Minutes totales:', timeSlot.totalMinutes)

    const slotData: Partial<SlotFormData> = {
      day_index: dayIndex,
      start_min: timeSlot.totalMinutes,
      duration_min: 60, // 1 heure par défaut
      title: '',
      category: 'a',
      comment: ''
    }

    console.log('📝 Données préparées pour modal:', slotData)
    
    setNewSlotData(slotData)
    setSelectedSlot(null)
    setIsModalOpen(true)
    
    console.log('🎯 === MODAL OUVERT POUR CRÉATION ===')
  }, [dragState.isDragging])

  // Gestionnaire de clic sur créneau existant
  const handleSlotClick = useCallback((slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    if (dragState.isDragging) return

    console.log('✏️ Clic créneau pour modification:', slot)
    setSelectedSlot(slot)
    setNewSlotData(null)
    setIsModalOpen(true)
  }, [dragState.isDragging])

  // Gestionnaire de suppression
  const handleSlotDelete = useCallback(async (slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()

    console.log('🗑️ Demande suppression:', slot)

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      try {
        await deleteSlotMutation.mutateAsync(slot.id)
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }, [deleteSlotMutation])

  // Gestionnaire de fermeture modal
  const handleModalClose = useCallback(() => {
    console.log('❌ Fermeture modal')
    setIsModalOpen(false)
    setSelectedSlot(null)
    setNewSlotData(null)
  }, [])

  // Gestionnaire de sauvegarde - VERSION ROBUSTE
  const handleModalSave = useCallback(async (data: SlotFormData) => {
    console.log('💾 === DÉBUT SAUVEGARDE ===')
    console.log('📝 Données reçues du modal:', data)

    try {
      if (selectedSlot) {
        // Modification d'un créneau existant
        console.log('🔄 Mode modification, créneau:', selectedSlot.id)
        await updateSlotMutation.mutateAsync({
          slotId: selectedSlot.id,
          slotData: data
        })
      } else {
        // Création d'un nouveau créneau
        console.log('🆕 Mode création')
        console.log('📊 Semaine courante disponible:', !!currentWeek)
        
        if (!currentWeek) {
          console.error('❌ Pas de semaine courante pour création')
          alert('Erreur: Aucune semaine sélectionnée')
          return
        }

        await createSlotMutation.mutateAsync(data)
      }
      
      handleModalClose()
      console.log('💾 === SAUVEGARDE TERMINÉE ===')
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde:', error)
    }
  }, [selectedSlot, currentWeek, updateSlotMutation, createSlotMutation, handleModalClose])

  // Fonctions utilitaires
  const getSlotPosition = useCallback((startMin: number, durationMin: number) => {
    const startHour = openingHour
    const cellHeight = 64 // hauteur d'une cellule en px (h-16 = 64px)
    
    const top = ((startMin - startHour * 60) / 60) * cellHeight
    const height = Math.max((durationMin / 60) * cellHeight, 32) // minimum 32px
    
    return { top, height }
  }, [openingHour])

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }, [])

  // Drag & Drop - simplifié pour l'instant
  const handleMouseDown = useCallback((slot: Slot, e: React.MouseEvent) => {
    console.log('🖱️ Début drag (simplifié):', slot.id)
    // TODO: Implémenter drag & drop complet plus tard
    e.preventDefault()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Erreur lors du chargement du planning</p>
        <button 
          onClick={() => refetch()} 
          className="btn-primary mt-4"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (!selectedEmployeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sélectionnez un employé pour afficher le planning</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Debug info */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-xs">
        <strong>Debug:</strong> Employé: {selectedEmployeeId} | Semaine: {currentWeek?.week.id || 'Aucune'} | 
        Créneaux: {currentWeek?.slots.length || 0} | 
        Status: {createSlotMutation.isPending ? 'Création...' : createSlotMutation.isError ? 'Erreur' : 'Prêt'}
      </div>

      {/* En-tête avec les jours */}
      <div className="grid grid-cols-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
        {/* Cellule vide pour l'alignement */}
        <div className="p-4 border-r border-gray-200 flex items-center justify-center">
          <Clock className="h-5 w-5 text-gray-500" />
        </div>
        
        {/* En-têtes des jours */}
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

      {/* Grille principale avec scroll */}
      <div className="overflow-auto max-h-[600px] custom-scrollbar" ref={gridRef}>
        <div className="grid grid-cols-8 min-h-full relative">
          {/* Colonne des heures */}
          <div className="border-r border-gray-200 bg-gray-50">
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
            const daySlots = currentWeek?.slots.filter(slot => slot.day_index === dayIndex) || []
            
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
                    {/* Indicateur d'ajout au hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ))}

                {/* Créneaux */}
                {daySlots.map((slot) => {
                  const position = getSlotPosition(slot.start_min, slot.duration_min)
                  const categoryStyle = getCategoryStyle(slot.category)
                  
                  return (
                    <div
                      key={slot.id}
                      className="absolute left-1 right-1 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md hover:scale-105 z-10 group"
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        ...categoryStyle
                      }}
                      onClick={(e) => handleSlotClick(slot, e)}
                      onMouseDown={(e) => handleMouseDown(slot, e)}
                    >
                      {/* Contenu du créneau */}
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div>
                          <div className="font-medium text-xs leading-tight truncate pr-4">
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
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 flex space-x-1">
                        <button
                          onClick={(e) => handleSlotClick(slot, e)}
                          className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100 transition-all"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => handleSlotDelete(slot, e)}
                          className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100 transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </button>
                      </div>
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
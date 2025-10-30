import { FC, useEffect, useState, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Clock, Edit, Trash2, GripVertical } from 'lucide-react'
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

  const gridRef = useRef<HTMLDivElement>(null)

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<Partial<SlotFormData> | null>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedSlot: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeDirection: null
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
    queryFn: () => {
      if (!selectedEmployeeId) return null
      
      return weekService.getWeeks({
        employeeId: selectedEmployeeId,
        kind: selectedWeekKind,
        vacation: selectedVacationPeriod,
        weekStart: selectedWeekStart
      })
    },
    enabled: !!selectedEmployeeId
  })

  // Mutations pour les créneaux
  const createSlotMutation = useMutation({
    mutationFn: ({ weekId, slot }: { weekId: number; slot: SlotFormData }) => 
      slotService.createSlot(weekId, slot),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => setSaveStatus('error')
  })

  const updateSlotMutation = useMutation({
    mutationFn: ({ weekId, slotId, slot }: { weekId: number; slotId: number; slot: Partial<SlotFormData> }) => 
      slotService.updateSlot(weekId, slotId, slot),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => setSaveStatus('error')
  })

  const deleteSlotMutation = useMutation({
    mutationFn: ({ weekId, slotId }: { weekId: number; slotId: number }) => 
      slotService.deleteSlot(weekId, slotId),
    onMutate: () => setSaveStatus('saving'),
    onSuccess: () => {
      setSaveStatus('saved')
      refetch()
      setTimeout(() => setSaveStatus('idle'), 2000)
    },
    onError: () => setSaveStatus('error')
  })

  // Gérer les données
  useEffect(() => {
    if (data && data.length > 0) {
      setCurrentWeek(data[0])
    }
  }, [data, setCurrentWeek])

  // Gestionnaires d'événements
  const handleCellClick = (dayIndex: number, timeSlot: TimeSlot) => {
    if (dragState.isDragging) return

    setNewSlotData({
      day_index: dayIndex,
      start_min: timeSlot.totalMinutes,
      duration_min: 60, // 1 heure par défaut
      title: '',
      category: 'a',
      comment: ''
    })
    setSelectedSlot(null)
    setIsModalOpen(true)
  }

  const handleSlotClick = (slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    if (dragState.isDragging) return

    setSelectedSlot(slot)
    setNewSlotData(null)
    setIsModalOpen(true)
  }

  const handleSlotDelete = async (slot: Slot, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!currentWeek) return

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      await deleteSlotMutation.mutateAsync({
        weekId: currentWeek.week.id,
        slotId: slot.id
      })
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSlot(null)
    setNewSlotData(null)
  }

  const handleModalSave = async (data: SlotFormData) => {
    if (!currentWeek) return

    try {
      if (selectedSlot) {
        // Modification d'un créneau existant
        await updateSlotMutation.mutateAsync({
          weekId: currentWeek.week.id,
          slotId: selectedSlot.id,
          slot: data
        })
      } else {
        // Création d'un nouveau créneau
        await createSlotMutation.mutateAsync({
          weekId: currentWeek.week.id,
          slot: data
        })
      }
      handleModalClose()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Fonctions utilitaires
  const getSlotPosition = (startMin: number, durationMin: number) => {
    const startHour = openingHour
    const cellHeight = 64 // hauteur d'une cellule en px (h-16 = 64px)
    
    const top = ((startMin - startHour * 60) / 60) * cellHeight
    const height = Math.max((durationMin / 60) * cellHeight, 32) // minimum 32px
    
    return { top, height }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Gestionnaires de drag & drop
  const handleMouseDown = (slot: Slot, e: React.MouseEvent) => {
    if (e.button !== 0) return // Seulement clic gauche

    const rect = e.currentTarget.getBoundingClientRect()
    const offsetY = e.clientY - rect.top

    // Déterminer si c'est un resize ou un drag
    const isResizeTop = offsetY < 8
    const isResizeBottom = offsetY > rect.height - 8

    setDragState({
      isDragging: true,
      draggedSlot: slot,
      dragOffset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
      isResizing: isResizeTop || isResizeBottom,
      resizeDirection: isResizeTop ? 'top' : isResizeBottom ? 'bottom' : null
    })

    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedSlot || !gridRef.current) return

    const gridRect = gridRef.current.getBoundingClientRect()
    const cellHeight = 64
    const cellWidth = gridRect.width / 8

    if (dragState.isResizing) {
        // Redimensionnement
        // const slot = dragState.draggedSlot
        // const position = getSlotPosition(slot.start_min, slot.duration_min)
        
        if (dragState.resizeDirection === 'bottom') {
          // const newHeight = Math.max(32, e.clientY - (gridRect.top + position.top))
          // const newDuration = Math.max(15, Math.round((newHeight / cellHeight) * 60 / 15) * 15)
          
          // Mettre à jour immédiatement visuellement (optimistic update)
          // TODO: Implémenter la mise à jour optimiste avec slot, position, newHeight et newDuration
        }
    } else {
      // Déplacement
      const dayIndex = Math.floor((e.clientX - gridRect.left - cellWidth) / cellWidth)
      const timeIndex = Math.floor((e.clientY - gridRect.top) / cellHeight)
      
      if (dayIndex >= 0 && dayIndex < 7 && timeIndex >= 0 && timeIndex < timeSlots.length) {
        // TODO: Mettre à jour la position visuellement
      }
    }
  }

  const handleMouseUp = async () => {
    if (!dragState.isDragging || !dragState.draggedSlot || !currentWeek) {
      setDragState({
        isDragging: false,
        draggedSlot: null,
        dragOffset: { x: 0, y: 0 },
        isResizing: false,
        resizeDirection: null
      })
      return
    }

    // TODO: Calculer la nouvelle position/durée et sauvegarder
    // Pour l'instant, on reset juste le drag state
    setDragState({
      isDragging: false,
      draggedSlot: null,
      dragOffset: { x: 0, y: 0 },
      isResizing: false,
      resizeDirection: null
    })
  }

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
  }, [dragState.isDragging])

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
                  const isDragged = dragState.draggedSlot?.id === slot.id
                  
                  return (
                    <div
                      key={slot.id}
                      className={`absolute left-1 right-1 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md hover:scale-105 z-10 group ${
                        isDragged ? 'opacity-75 scale-105' : ''
                      }`}
                      style={{
                        top: `${position.top}px`,
                        height: `${position.height}px`,
                        ...categoryStyle
                      }}
                      onClick={(e) => handleSlotClick(slot, e)}
                      onMouseDown={(e) => handleMouseDown(slot, e)}
                    >
                      {/* Poignées de redimensionnement */}
                      <div className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-black bg-opacity-20 rounded-t-lg" />
                      <div className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100 bg-black bg-opacity-20 rounded-b-lg" />
                      
                      {/* Poignée de déplacement */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100">
                        <GripVertical className="h-3 w-3 text-black text-opacity-40" />
                      </div>

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
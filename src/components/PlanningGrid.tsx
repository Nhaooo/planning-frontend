import { FC, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Clock } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { weekService } from '../services/api'
import { generateTimeSlots, getDayNames, getWeekDates, getMondayOfWeek } from '../utils/timeUtils'
import SlotModal from './SlotModal'
import LoadingSpinner from './LoadingSpinner'
import { Slot, SlotFormData, WeekResponse, TimeSlot } from '../types'
import { getCategoryStyle } from '../utils/categoryUtils'

const PlanningGrid: FC = () => {
  const {
    selectedEmployeeId,
    selectedWeekKind,
    selectedVacationPeriod,
    selectedWeekStart,
    currentWeek,
    setCurrentWeek
  } = usePlanningStore()

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<Partial<SlotFormData> | null>(null)

  // Configuration de la grille
  const openingHour = 9
  const closingHour = 22
  const timeSlots = generateTimeSlots(openingHour, closingHour)
  const dayNames = getDayNames()
  const mondayDate = getMondayOfWeek(selectedWeekStart)
  const weekDates = getWeekDates(mondayDate)

  // Charger les données de la semaine
  const { data, isLoading, error } = useQuery<WeekResponse[] | null>({
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

  // Gérer les données
  useEffect(() => {
    if (data && data.length > 0) {
      setCurrentWeek(data[0])
    }
  }, [data, setCurrentWeek])

  // Gestionnaires d'événements
  const handleCellClick = (dayIndex: number, timeSlot: TimeSlot) => {
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

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot)
    setNewSlotData(null)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSlot(null)
    setNewSlotData(null)
  }

  const handleModalSave = (data: SlotFormData) => {
    // TODO: Implémenter la sauvegarde
    console.log('Sauvegarder:', data)
    handleModalClose()
  }

  // Fonction pour convertir les minutes en position CSS
  const getSlotPosition = (startMin: number, durationMin: number) => {
    const startHour = openingHour
    const cellHeight = 60 // hauteur d'une cellule en px
    
    const top = ((startMin - startHour * 60) / 60) * cellHeight
    const height = (durationMin / 60) * cellHeight
    
    return { top, height }
  }

  // Fonction pour formater l'heure
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

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
      <div className="overflow-auto max-h-[600px] custom-scrollbar">
        <div className="grid grid-cols-8 min-h-full">
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
                  
                  return (
                    <div
                      key={slot.id}
                      className="absolute left-1 right-1 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md hover:scale-105 z-10"
                      style={{
                        top: `${position.top}px`,
                        height: `${Math.max(position.height - 2, 30)}px`,
                        ...categoryStyle
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSlotClick(slot)
                      }}
                    >
                      <div className="p-2 h-full flex flex-col justify-between">
                        <div>
                          <div className="font-medium text-xs leading-tight truncate">
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
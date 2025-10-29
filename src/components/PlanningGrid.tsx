import { FC, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePlanningStore } from '../store/planningStore'
import { weekService } from '../services/api'
import { generateTimeSlots, getDayNames, getWeekDates, getMondayOfWeek } from '../utils/timeUtils'
import TimeColumn from './TimeColumn'
import DayColumn from './DayColumn'
import SlotModal from './SlotModal'
import LoadingSpinner from './LoadingSpinner'
import { Slot, SlotFormData } from '../types'

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
  const { data: weekData, isLoading, error } = useQuery({
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
    enabled: !!selectedEmployeeId,
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setCurrentWeek(data[0])
      }
    }
  })

  // Gestionnaire de clic sur une cellule vide pour créer un nouveau créneau
  const handleCellClick = (dayIndex: number, timeSlot: number) => {
    setNewSlotData({
      day_index: dayIndex,
      start_min: timeSlot,
      duration_min: 60, // 1 heure par défaut
      title: '',
      category: 'o' // Ouverture par défaut
    })
    setIsModalOpen(true)
  }

  // Gestionnaire de double-clic sur un créneau existant
  const handleSlotDoubleClick = (slot: Slot) => {
    setSelectedSlot(slot)
    setIsModalOpen(true)
  }

  // Gestionnaire de fermeture du modal
  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedSlot(null)
    setNewSlotData(null)
  }

  // Gestionnaire de sauvegarde du modal
  const handleModalSave = (data: SlotFormData) => {
    // TODO: Implémenter la sauvegarde via l'API
    console.log('Save slot:', data)
    handleModalClose()
  }

  if (!selectedEmployeeId) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sélectionnez un employé pour afficher le planning</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* En-tête avec les jours */}
      <div className="planning-grid">
        {/* Cellule vide pour l'alignement */}
        <div className="time-header">
          <span className="text-xs">Heure</span>
        </div>
        
        {/* En-têtes des jours */}
        {dayNames.map((dayName, index) => (
          <div key={index} className="day-header">
            <div className="font-semibold">{dayName}</div>
            <div className="text-xs text-gray-500 mt-1">
              {weekDates[index].toLocaleDateString('fr-FR', { 
                day: '2-digit', 
                month: '2-digit' 
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Grille principale avec scroll */}
      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        <div className="planning-grid">
          {/* Colonne des heures */}
          <TimeColumn timeSlots={timeSlots} />
          
          {/* Colonnes des jours */}
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <DayColumn
              key={dayIndex}
              dayIndex={dayIndex}
              timeSlots={timeSlots}
              slots={currentWeek?.slots.filter(slot => slot.day_index === dayIndex) || []}
              onCellClick={handleCellClick}
              onSlotDoubleClick={handleSlotDoubleClick}
            />
          ))}
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
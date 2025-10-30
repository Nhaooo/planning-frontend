import { FC, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePlanningStore } from '../store/planningStore'
import { weekService } from '../services/api'
import { generateTimeSlots, getDayNames, getWeekDates, getMondayOfWeek } from '../utils/timeUtils'
import TimeColumn from './TimeColumn'
import DayColumn from './DayColumn'
import SlotModal from './SlotModal'
import LoadingSpinner from './LoadingSpinner'
import { Slot, SlotFormData, WeekResponse } from '../types'

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
    <div className="planning-container w-full">
      {/* Container avec scroll horizontal pour responsive */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* En-têtes de la grille */}
          <div className="planning-grid mb-0 border-b-0">
            {/* En-tête vide pour la colonne des heures */}
            <div className="time-header">
              <span className="hidden sm:inline">Heure</span>
              <span className="sm:hidden">H</span>
            </div>
            
            {/* En-têtes des jours */}
            {dayNames.map((dayName, index) => (
              <div key={index} className="day-header">
                <div className="font-semibold">
                  <span className="hidden md:inline">{dayName}</span>
                  <span className="md:hidden">{dayName.slice(0, 3)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {weekDates[index].toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Grille principale avec scroll vertical */}
          <div className="max-h-[500px] md:max-h-[600px] overflow-y-auto custom-scrollbar">
            <div className="planning-grid border-t-0">
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
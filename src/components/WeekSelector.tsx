import { FC } from 'react'
import { Calendar, Palmtree } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { WeekKind, VacationPeriod } from '../types'

const WeekSelector: FC = () => {
  const {
    selectedWeekKind,
    selectedVacationPeriod,
    selectedWeekStart,
    setSelectedWeekKind,
    setSelectedVacationPeriod,
    setSelectedWeekStart
  } = usePlanningStore()

  const weekKindOptions: { value: WeekKind; label: string }[] = [
    { value: 'type', label: 'Semaine type' },
    { value: 'current', label: 'Semaine actuelle' },
    { value: 'next', label: 'Semaine suivante' },
    { value: 'vacation', label: 'Semaine vacances' }
  ]

  const vacationOptions: { value: VacationPeriod; label: string }[] = [
    { value: 'Toussaint', label: 'Toussaint' },
    { value: 'Noel', label: 'Noël' },
    { value: 'Paques', label: 'Pâques' },
    { value: 'Ete', label: 'Été' }
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Sélecteur de type de semaine */}
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
        <select
          value={selectedWeekKind}
          onChange={(e) => setSelectedWeekKind(e.target.value as WeekKind)}
          className="form-select text-sm sm:text-base min-w-0 flex-1 sm:min-w-[150px] sm:flex-none"
        >
          {weekKindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              <span className="hidden sm:inline">{option.label}</span>
              <span className="sm:hidden">
                {option.value === 'type' && 'Type'}
                {option.value === 'current' && 'Actuelle'}
                {option.value === 'next' && 'Suivante'}
                {option.value === 'vacation' && 'Vacances'}
              </span>
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur de période de vacances (conditionnel) */}
      {selectedWeekKind === 'vacation' && (
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Palmtree className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
          <select
            value={selectedVacationPeriod || ''}
            onChange={(e) => setSelectedVacationPeriod(e.target.value as VacationPeriod)}
            className="form-select text-sm sm:text-base min-w-0 flex-1 sm:min-w-[120px] sm:flex-none"
          >
            <option value="">Période</option>
            {vacationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sélecteur de date (pour toutes les semaines sauf type) */}
      {selectedWeekKind !== 'type' && (
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline flex-shrink-0">Semaine du:</span>
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            className="form-input text-sm flex-1 sm:flex-none"
          />
        </div>
      )}
    </div>
  )
}

export default WeekSelector
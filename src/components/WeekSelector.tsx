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
    <div className="flex items-center space-x-3">
      {/* Sélecteur de type de semaine */}
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <select
          value={selectedWeekKind}
          onChange={(e) => setSelectedWeekKind(e.target.value as WeekKind)}
          className="form-select min-w-[150px]"
        >
          {weekKindOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur de période de vacances (conditionnel) */}
      {selectedWeekKind === 'vacation' && (
        <div className="flex items-center space-x-2">
          <Palmtree className="h-4 w-4 text-gray-500" />
          <select
            value={selectedVacationPeriod || ''}
            onChange={(e) => setSelectedVacationPeriod(e.target.value as VacationPeriod)}
            className="form-select min-w-[120px]"
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
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Semaine du:</span>
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            className="form-input text-sm"
          />
        </div>
      )}
    </div>
  )
}

export default WeekSelector
import { FC } from 'react'
import { Clock, Calendar, AlertTriangle } from 'lucide-react'
import { WeekTotals } from '../types'
import { formatHours } from '../utils/categoryUtils'
import { getDayNames } from '../utils/timeUtils'

interface WeekTotalsCardProps {
  totals: WeekTotals
  weekStartDate: string
}

const WeekTotalsCard: FC<WeekTotalsCardProps> = ({ totals, weekStartDate }) => {
  const dayNames = getDayNames()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Totaux</h3>
      </div>

      {/* Total de la semaine */}
      <div className="mb-6">
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Total semaine</span>
          </div>
          <span className="text-xl font-bold text-blue-900">
            {formatHours(totals.week_total)}
          </span>
        </div>
      </div>

      {/* Totaux par jour */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-medium text-gray-700">Par jour</h4>
        {dayNames.map((dayName, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{dayName}</span>
            <span className="text-sm font-medium text-gray-900">
              {formatHours(totals.per_day[index] || 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Indéterminé */}
      {totals.indetermine > 0 && (
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Indéterminé
            </span>
            <span className="text-sm font-bold text-yellow-900">
              {formatHours(totals.indetermine)}
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Temps de mise en place et rangement
          </p>
        </div>
      )}

      {/* Informations complémentaires */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>Semaine du {new Date(weekStartDate).toLocaleDateString('fr-FR')}</div>
          <div>Mise à jour automatique</div>
        </div>
      </div>
    </div>
  )
}

export default WeekTotalsCard
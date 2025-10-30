import { FC } from 'react'
import { usePlanningStore } from '../store/planningStore'
import WeekTotalsCard from './WeekTotalsCard'
import CategoryRepartitionCard from './CategoryRepartitionCard'
import WeekNotesCard from './WeekNotesCard'
import CategoryLegendCard from './CategoryLegendCard'

const Sidebar: FC = () => {
  const { currentWeek } = usePlanningStore()

  if (!currentWeek) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center">
            Aucune donnée de planning disponible
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Totaux de la semaine */}
      <WeekTotalsCard 
        totals={currentWeek.totals}
        weekStartDate={currentWeek.week.week_start_date}
      />

      {/* Répartition par catégories */}
      <CategoryRepartitionCard 
        repartition={currentWeek.repartition}
      />

      {/* Notes et commentaires */}
      <WeekNotesCard 
        notes={currentWeek.notes}
        weekId={currentWeek.week.id}
      />

      {/* Légende des catégories */}
      <CategoryLegendCard />
    </div>
  )
}

export default Sidebar
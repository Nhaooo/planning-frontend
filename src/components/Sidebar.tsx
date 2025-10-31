import { FC } from 'react'
import { usePlanningStore } from '../store/planningStore'
import WeekTotalsCard from './WeekTotalsCard'
import CategoryRepartitionCard from './CategoryRepartitionCard'
import WeekNotesCard from './WeekNotesCard'
import CategoryLegendCard from './CategoryLegendCard'
import BlockPalette from './BlockPalette'

const Sidebar: FC = () => {
  const { currentWeek } = usePlanningStore()

  if (!currentWeek) {
    return (
      <div className="space-y-2 sm:space-y-4 lg:space-y-6">
        {/* Layout mobile : palette et légende côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-2 sm:gap-4">
          {/* Palette de blocs drag & drop - toujours visible */}
          <div className="order-1">
            <BlockPalette />
          </div>
          
          {/* Légende des catégories - toujours visible */}
          <div className="order-2 lg:order-3">
            <CategoryLegendCard />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 order-3 lg:order-2">
          <p className="text-gray-500 text-center text-sm sm:text-base">
            Aucune donnée de planning disponible
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-4 lg:space-y-6">
      {/* Layout mobile optimisé */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-4 lg:gap-6">
        {/* Palette de blocs drag & drop */}
        <div className="order-1 sm:col-span-2 lg:col-span-1">
          <BlockPalette />
        </div>

        {/* Légende des catégories - en haut sur mobile */}
        <div className="order-2 sm:order-4 lg:order-6">
          <CategoryLegendCard />
        </div>

        {/* Totaux de la semaine */}
        {currentWeek && (
          <div className="order-3 sm:order-2 lg:order-3">
            <WeekTotalsCard 
              totals={currentWeek.totals}
              weekStartDate={currentWeek.week.week_start_date}
            />
          </div>
        )}

        {/* Répartition par catégories */}
        {currentWeek && (
          <div className="order-4 sm:order-3 lg:order-4">
            <CategoryRepartitionCard 
              repartition={currentWeek.repartition}
            />
          </div>
        )}

        {/* Notes et commentaires */}
        {currentWeek && (
          <div className="order-5 sm:col-span-2 lg:col-span-1 lg:order-5">
            <WeekNotesCard 
              notes={currentWeek.notes}
              weekId={currentWeek.week.id}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
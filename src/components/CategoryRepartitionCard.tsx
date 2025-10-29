import { FC } from 'react'
import { PieChart, BarChart3 } from 'lucide-react'
import { CategoryRepartition } from '../types'
import { 
  formatHours, 
  calculateRepartitionPercentages, 
  getSortedCategories,
  DEFAULT_CATEGORY_LEGEND 
} from '../utils/categoryUtils'

interface CategoryRepartitionCardProps {
  repartition: CategoryRepartition
}

const CategoryRepartitionCard: FC<CategoryRepartitionCardProps> = ({ repartition }) => {
  const percentages = calculateRepartitionPercentages(repartition)
  const sortedCategories = getSortedCategories(repartition, DEFAULT_CATEGORY_LEGEND)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <PieChart className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">Répartition</h3>
      </div>

      {/* Graphique en barres simple */}
      <div className="space-y-3 mb-6">
        {sortedCategories.map((category) => {
          const percentage = percentages[category.code as keyof CategoryRepartition]
          
          return (
            <div key={category.code} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-gray-700 truncate">{category.label}</span>
                </div>
                <div className="flex items-center space-x-2 text-right">
                  <span className="font-medium text-gray-900">
                    {formatHours(category.hours)}
                  </span>
                  <span className="text-gray-500 text-xs">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              
              {/* Barre de progression */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.color
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Résumé */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-gray-900">
              {sortedCategories.length}
            </div>
            <div className="text-xs text-gray-500">Catégories</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {formatHours(Object.values(repartition).reduce((sum, val) => sum + val, 0))}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Légende rapide */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <BarChart3 className="h-3 w-3" />
          <span>Répartition automatique par catégorie</span>
        </div>
      </div>
    </div>
  )
}

export default CategoryRepartitionCard
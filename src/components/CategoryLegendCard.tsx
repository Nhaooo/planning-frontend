import { FC } from 'react'
import { Palette } from 'lucide-react'
import { getAllCategories, DEFAULT_CATEGORY_LEGEND } from '../utils/categoryUtils'

const CategoryLegendCard: FC = () => {
  const categories = getAllCategories(DEFAULT_CATEGORY_LEGEND)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Palette className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Légende</h3>
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.code} className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-sm border border-gray-200"
              style={{ backgroundColor: category.color }}
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">
                {category.label}
              </div>
              <div className="text-xs text-gray-500 uppercase">
                Code: {category.code}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Palette className="h-3 w-3" />
            <span>Catégories de créneaux disponibles</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryLegendCard
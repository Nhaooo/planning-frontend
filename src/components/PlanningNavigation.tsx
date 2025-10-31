import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PlanningNavigationProps {
  onScrollLeft: () => void
  onScrollRight: () => void
  canScrollLeft: boolean
  canScrollRight: boolean
}

const PlanningNavigation: React.FC<PlanningNavigationProps> = ({
  onScrollLeft,
  onScrollRight,
  canScrollLeft,
  canScrollRight
}) => {
  return (
    <div className="xl:hidden bg-white border-t border-gray-200 p-2">
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={onScrollLeft}
          disabled={!canScrollLeft}
          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
            canScrollLeft
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Précédent</span>
        </button>
        
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <span className="text-xs text-gray-500">Glissez pour naviguer</span>
        </div>
        
        <button
          onClick={onScrollRight}
          disabled={!canScrollRight}
          className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
            canScrollRight
              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span className="text-sm font-medium">Suivant</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default PlanningNavigation
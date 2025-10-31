import React from 'react'
import { CATEGORY_COLORS, CategoryCode } from '../utils/categoryColors'

interface BlockTemplate {
  id: string
  title: string
  category: CategoryCode
  defaultDuration: number // en minutes
  description: string
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: 'admin-1h',
    title: 'Administratif',
    category: 'a',
    defaultDuration: 60,
    description: 'Tâches administratives'
  },
  {
    id: 'prestation-1h',
    title: 'Prestation',
    category: 'p',
    defaultDuration: 60,
    description: 'Événement/prestation'
  },
  {
    id: 'ecole-1h',
    title: 'École escalade',
    category: 'e',
    defaultDuration: 60,
    description: 'Cours d\'escalade'
  },
  {
    id: 'competition-1h',
    title: 'Compétition',
    category: 'c',
    defaultDuration: 60,
    description: 'Entraînement compétition'
  },
  {
    id: 'ouverture-1h',
    title: 'Ouverture',
    category: 'o',
    defaultDuration: 60,
    description: 'Ouverture salle'
  },
  {
    id: 'loisir-1h',
    title: 'Loisir',
    category: 'l',
    defaultDuration: 60,
    description: 'Activité loisir'
  },
  {
    id: 'rangement-1h',
    title: 'Rangement',
    category: 'm',
    defaultDuration: 60,
    description: 'Mise en place/rangement'
  },
  {
    id: 'sante-1h',
    title: 'Santé',
    category: 's',
    defaultDuration: 60,
    description: 'Santé adulte/enfant'
  }
]

const BlockPalette: React.FC = () => {
  const handleDragStart = (e: React.DragEvent, template: BlockTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify(template))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Ajouter une classe pour l'animation
    const target = e.target as HTMLElement
    target.classList.add('dragging')
  }

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    target.classList.remove('dragging')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4">
      <div className="flex items-center space-x-2 mb-2 sm:mb-4">
        <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
        <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
          <span className="hidden sm:inline">Palette de blocs</span>
          <span className="sm:hidden">Blocs</span>
        </h3>
      </div>
      
      {/* Layout responsive : horizontal sur mobile, vertical sur desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1 sm:gap-2 lg:space-y-2 lg:block">
        {BLOCK_TEMPLATES.map((template) => {
          const colors = CATEGORY_COLORS[template.category]
          
          return (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              onDragEnd={handleDragEnd}
              className="p-2 sm:p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-gray-400 hover:shadow-md transform hover:scale-105 lg:mb-2"
              style={{
                backgroundColor: colors.bgLight,
                borderColor: colors.color + '40'
              }}
            >
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: colors.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs sm:text-sm truncate" style={{ color: colors.textLight }}>
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {template.description} • {template.defaultDuration}min
                  </div>
                  <div className="text-xs text-gray-500 sm:hidden">
                    {template.defaultDuration}min
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-2 sm:mt-4 p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200 lg:block hidden sm:block">
        <div className="text-xs text-blue-700 font-medium mb-1">
          💡 Comment utiliser
        </div>
        <div className="text-xs text-blue-600">
          <span className="hidden lg:inline">Glissez-déposez les blocs dans le planning. Une fois placés, vous pourrez les redimensionner et les modifier.</span>
          <span className="lg:hidden">Glissez-déposez dans le planning</span>
        </div>
      </div>
    </div>
  )
}

export default BlockPalette
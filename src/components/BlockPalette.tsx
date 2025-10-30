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
    id: 'prestation-2h',
    title: 'Prestation',
    category: 'p',
    defaultDuration: 120,
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
    id: 'competition-3h',
    title: 'Compétition',
    category: 'c',
    defaultDuration: 180,
    description: 'Entraînement compétition'
  },
  {
    id: 'ouverture-8h',
    title: 'Ouverture',
    category: 'o',
    defaultDuration: 480,
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
    id: 'rangement-30min',
    title: 'Rangement',
    category: 'm',
    defaultDuration: 30,
    description: 'Mise en place/rangement'
  },
  {
    id: 'sante-45min',
    title: 'Santé',
    category: 's',
    defaultDuration: 45,
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
        <h3 className="text-lg font-semibold text-gray-900">Palette de blocs</h3>
      </div>
      
      <div className="space-y-2">
        {BLOCK_TEMPLATES.map((template) => {
          const colors = CATEGORY_COLORS[template.category]
          
          return (
            <div
              key={template.id}
              draggable
              onDragStart={(e) => handleDragStart(e, template)}
              onDragEnd={handleDragEnd}
              className="p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-gray-400 hover:shadow-md transform hover:scale-105"
              style={{
                backgroundColor: colors.bgLight,
                borderColor: colors.color + '40'
              }}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: colors.color }}
                ></div>
                <div className="flex-1">
                  <div className="font-medium text-sm" style={{ color: colors.textLight }}>
                    {template.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {template.description} • {template.defaultDuration}min
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-xs text-blue-700 font-medium mb-1">
          💡 Comment utiliser
        </div>
        <div className="text-xs text-blue-600">
          Glissez-déposez les blocs dans le planning. Une fois placés, vous pourrez les redimensionner et les modifier.
        </div>
      </div>
    </div>
  )
}

export default BlockPalette
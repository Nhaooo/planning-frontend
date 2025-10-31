import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
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

const CompactBlockPalette: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)

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
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Header cliquable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
          <span className="font-medium text-gray-900">Palette de blocs</span>
          <span className="text-xs text-gray-500">
            ({BLOCK_TEMPLATES.length} types)
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>

      {/* Contenu expansible */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Grille de blocs en mode compact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BLOCK_TEMPLATES.map((template) => {
              const colors = CATEGORY_COLORS[template.category]
              
              return (
                <div
                  key={template.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, template)}
                  onDragEnd={handleDragEnd}
                  className="p-2 rounded-lg border-2 border-dashed border-gray-300 cursor-grab active:cursor-grabbing transition-all duration-200 hover:border-gray-400 hover:shadow-md transform hover:scale-105"
                  style={{
                    backgroundColor: colors.bgLight,
                    borderColor: colors.color + '40'
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: colors.color }}
                    ></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate" style={{ color: colors.textLight }}>
                        {template.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {template.defaultDuration}min
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Aide compacte */}
          <div className="mt-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-xs text-blue-700 font-medium">
              💡 Glissez-déposez les blocs dans le planning
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompactBlockPalette
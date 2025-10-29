import { FC } from 'react'
import { useDrag } from 'react-dnd'
import { Trash2, MessageCircle } from 'lucide-react'
import { Slot } from '../types'
import { getSlotPosition, minutesToTime, formatDuration } from '../utils/timeUtils'
import { getCategoryClass, getCategoryStyle } from '../utils/categoryUtils'

interface PlanningSlotProps {
  slot: Slot
  onDoubleClick: () => void
  onDelete?: () => void
}

const PlanningSlot: FC<PlanningSlotProps> = ({ 
  slot, 
  onDoubleClick, 
  onDelete 
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'slot',
    item: { slot },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const position = getSlotPosition(slot.start_min, slot.duration_min)
  const categoryStyle = getCategoryStyle(slot.category)

  return (
    <div
      ref={drag}
      className={`planning-slot ${getCategoryClass(slot.category)} ${isDragging ? 'dragging' : ''}`}
      style={{
        top: `${position.top}px`,
        height: `${position.height}px`,
        ...categoryStyle
      }}
      onDoubleClick={onDoubleClick}
      title={`${slot.title} (${minutesToTime(slot.start_min)} - ${minutesToTime(slot.start_min + slot.duration_min)})`}
    >
      {/* En-tête du créneau */}
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs font-medium truncate flex-1">
          {minutesToTime(slot.start_min)}
        </div>
        <div className="flex items-center space-x-1">
          {slot.comment && (
            <MessageCircle className="h-3 w-3 text-gray-500" />
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Supprimer le créneau"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Titre du créneau */}
      <div className="text-sm font-medium truncate mb-1">
        {slot.title}
      </div>

      {/* Durée */}
      <div className="text-xs text-gray-600">
        {formatDuration(slot.duration_min)}
      </div>

      {/* Commentaire (si présent et si la hauteur le permet) */}
      {slot.comment && position.height > 80 && (
        <div className="text-xs text-gray-500 mt-1 truncate">
          {slot.comment}
        </div>
      )}

      {/* Indicateur de redimensionnement */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 cursor-ns-resize opacity-0 hover:opacity-100 transition-opacity" />
    </div>
  )
}

export default PlanningSlot
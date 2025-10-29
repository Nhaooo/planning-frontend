import { FC } from 'react'
import { useDrop } from 'react-dnd'
import { TimeSlot, Slot } from '../types'
import PlanningSlot from './PlanningSlot'

interface DayColumnProps {
  dayIndex: number
  timeSlots: TimeSlot[]
  slots: Slot[]
  onCellClick: (dayIndex: number, timeSlot: number) => void
  onSlotDoubleClick: (slot: Slot) => void
}

const DayColumn: FC<DayColumnProps> = ({
  dayIndex,
  timeSlots,
  slots,
  onCellClick,
  onSlotDoubleClick
}) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'slot',
    drop: (item: any) => {
      // TODO: Gérer le drop d'un créneau
      console.log('Dropped slot:', item)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div ref={drop} className={`relative ${isOver ? 'drop-zone' : ''}`}>
      {/* Cellules de temps */}
      {timeSlots.map((timeSlot, index) => (
        <div
          key={index}
          className="time-slot cursor-pointer"
          onClick={() => onCellClick(dayIndex, timeSlot.totalMinutes)}
          title={`Créer un créneau à ${timeSlot.label}`}
        >
          {/* Les créneaux seront positionnés absolument par-dessus */}
        </div>
      ))}

      {/* Créneaux existants */}
      {slots.map((slot) => (
        <PlanningSlot
          key={slot.id}
          slot={slot}
          onDoubleClick={() => onSlotDoubleClick(slot)}
        />
      ))}
    </div>
  )
}

export default DayColumn
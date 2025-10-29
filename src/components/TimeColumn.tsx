import { FC } from 'react'
import { TimeSlot } from '../types'

interface TimeColumnProps {
  timeSlots: TimeSlot[]
}

const TimeColumn: FC<TimeColumnProps> = ({ timeSlots }) => {
  return (
    <>
      {timeSlots.map((timeSlot, index) => (
        <div
          key={index}
          className="time-header flex items-center justify-center text-xs font-medium"
          style={{ minHeight: '60px' }}
        >
          {/* Afficher seulement les heures pleines */}
          {timeSlot.minute === 0 && (
            <span className="text-gray-700">
              {timeSlot.label}
            </span>
          )}
        </div>
      ))}
    </>
  )
}

export default TimeColumn
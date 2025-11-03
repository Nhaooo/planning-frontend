import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePlanningStore } from '../store/planningStore'
import { simplePlanningApi, SimpleSlot } from '../services/simplePlanningApi'
import { employeeService } from '../services/api'
import { Employee } from '../types'
import LoadingSpinner from './LoadingSpinner'

// Couleurs distinctes pour chaque employé
const EMPLOYEE_COLORS = [
  { bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  { bg: 'bg-green-500', border: 'border-green-600', text: 'text-white' },
  { bg: 'bg-purple-500', border: 'border-purple-600', text: 'text-white' },
  { bg: 'bg-red-500', border: 'border-red-600', text: 'text-white' },
  { bg: 'bg-yellow-500', border: 'border-yellow-600', text: 'text-black' },
  { bg: 'bg-indigo-500', border: 'border-indigo-600', text: 'text-white' },
  { bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  { bg: 'bg-teal-500', border: 'border-teal-600', text: 'text-white' },
  { bg: 'bg-orange-500', border: 'border-orange-600', text: 'text-white' },
  { bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white' },
]

const getEmployeeColor = (employeeId: number) => {
  return EMPLOYEE_COLORS[employeeId % EMPLOYEE_COLORS.length]
}

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7h à 20h

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const getWeekStart = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

const addDaysToDate = (dateStr: string, days: number): string => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const GlobalPlanningView: React.FC = () => {
  const { selectedWeekKind, selectedVacationPeriod, selectedWeekStart } = usePlanningStore()
  const [visibleEmployees, setVisibleEmployees] = useState<Set<number>>(new Set())

  // Récupérer tous les employés
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeService.getAll
  })

  // Initialiser tous les employés comme visibles
  React.useEffect(() => {
    if (employees && visibleEmployees.size === 0) {
      setVisibleEmployees(new Set(employees.map(emp => emp.id)))
    }
  }, [employees, visibleEmployees.size])

  // Calculer la semaine à afficher
  const getDisplayWeekStart = () => {
    switch (selectedWeekKind) {
      case 'type':
        return '2024-01-01' // Semaine type fixe
      case 'current':
        return selectedWeekStart || getWeekStart(new Date())
      case 'next':
        const nextWeek = new Date(selectedWeekStart || getWeekStart(new Date()))
        nextWeek.setDate(nextWeek.getDate() + 7)
        return getWeekStart(nextWeek)
      default:
        return selectedWeekStart || getWeekStart(new Date())
    }
  }

  const displayWeekStart = getDisplayWeekStart()

  // Récupérer les plannings de tous les employés visibles
  const employeeQueries = useQuery({
    queryKey: ['global-planning', Array.from(visibleEmployees), selectedWeekKind, selectedVacationPeriod, displayWeekStart],
    queryFn: async () => {
      if (!employees || visibleEmployees.size === 0) return []
      
      const promises = Array.from(visibleEmployees).map(async (employeeId) => {
        try {
          const planning = await simplePlanningApi.getWeekPlanning(employeeId, displayWeekStart)
          const employee = employees.find(emp => emp.id === employeeId)
          return {
            employee,
            slots: planning.slots || []
          }
        } catch (error) {
          console.error(`Erreur planning employé ${employeeId}:`, error)
          return {
            employee: employees.find(emp => emp.id === employeeId),
            slots: []
          }
        }
      })
      
      return Promise.all(promises)
    },
    enabled: employees && visibleEmployees.size > 0
  })

// Organiser les créneaux par jour et heure avec gestion anti-superposition
  const slotsByDayHour = useMemo(() => {
    if (!employeeQueries.data) return {}
    
    const organized: { [key: string]: (SimpleSlot & { employeeName: string; employeeId: number; columnIndex: number })[] } = {}
    
    // D'abord, collecter tous les créneaux par jour
    const slotsByDay: { [dayIndex: number]: (SimpleSlot & { employeeName: string; employeeId: number })[] } = {}
    
    employeeQueries.data.forEach(({ employee, slots }) => {
      if (!employee) return
      
      slots.forEach(slot => {
        const slotDate = new Date(slot.date)
        const weekStart = new Date(displayWeekStart)
        const dayIndex = Math.floor((slotDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayIndex >= 0 && dayIndex < 7) {
          if (!slotsByDay[dayIndex]) slotsByDay[dayIndex] = []
          
          const enrichedSlot = {
            ...slot,
            employeeName: employee.fullname,
            employeeId: employee.id
          }
          slotsByDay[dayIndex].push(enrichedSlot)
        }
      })
    })
    
    // Ensuite, organiser par heure avec colonnes pour éviter la superposition
    Object.entries(slotsByDay).forEach(([dayIndex, daySlots]) => {
      const day = parseInt(dayIndex)
      
      // Trier les créneaux par heure de début
      const sortedSlots = daySlots.sort((a, b) => a.start_time - b.start_time)
      
      // Assigner des colonnes pour éviter les chevauchements
      const columns: (SimpleSlot & { employeeName: string; employeeId: number })[][] = []
      
      sortedSlots.forEach(slot => {
        // Trouver la première colonne disponible
        let columnIndex = 0
        let placed = false
        
        while (!placed) {
          if (!columns[columnIndex]) {
            columns[columnIndex] = []
          }
          
          // Vérifier si ce créneau chevauche avec le dernier de cette colonne
          const lastSlotInColumn = columns[columnIndex][columns[columnIndex].length - 1]
          
          if (!lastSlotInColumn || lastSlotInColumn.end_time <= slot.start_time) {
            columns[columnIndex].push(slot)
            placed = true
          } else {
            columnIndex++
          }
        }
      })
      
      // Maintenant, organiser par heure avec les colonnes
      columns.forEach((column, colIndex) => {
        column.forEach(slot => {
          const startHour = Math.floor(slot.start_time / 60)
          const endHour = Math.ceil(slot.end_time / 60)
          
          for (let hour = startHour; hour < endHour; hour++) {
            if (hour >= 7 && hour < 21) {
              const key = `${day}-${hour}`
              if (!organized[key]) organized[key] = []
              
              const slotWithColumn = {
                ...slot,
                columnIndex: colIndex
              }
              
              // Ajouter seulement à l'heure de début pour éviter les doublons
              if (hour === startHour) {
                organized[key].push(slotWithColumn)
              }
            }
          }
        })
      })
    })
    
    return organized
  }, [employeeQueries.data, displayWeekStart])

  const toggleEmployee = (employeeId: number) => {
    const newVisible = new Set(visibleEmployees)
    if (newVisible.has(employeeId)) {
      newVisible.delete(employeeId)
    } else {
      newVisible.add(employeeId)
    }
    setVisibleEmployees(newVisible)
  }

  if (employeesLoading || employeeQueries.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (!employees || employees.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Aucun employé trouvé
        </h2>
        <p className="text-gray-500">
          Ajoutez des employés pour voir le planning global.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec filtres employés */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Planning Global - Filtrer les employés
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {employees.map(employee => (
            <label key={employee.id} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={visibleEmployees.has(employee.id)}
                onChange={() => toggleEmployee(employee.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 truncate">
                {employee.fullname}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-3 text-sm text-gray-500">
          {visibleEmployees.size} employé(s) affiché(s) sur {employees.length}
        </div>
      </div>

      {/* Grille de planning global */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-8 gap-0 min-w-full">
            {/* En-tête avec les jours */}
            <div className="bg-gray-50 p-3 font-medium text-center border-b">Heures</div>
            {DAYS.map((day, index) => (
              <div key={day} className="bg-gray-50 p-3 font-medium text-center border-b">
                {day}
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(addDaysToDate(displayWeekStart, index)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            ))}
            
            {/* Lignes d'heures */}
            {HOURS.map(hour => (
              <React.Fragment key={hour}>
                {/* Colonne des heures */}
                <div className="bg-gray-50 p-3 text-center font-medium border-b border-r">
                  {hour}:00
                </div>
                
                {/* Cellules pour chaque jour */}
                {DAYS.map((_, dayIndex) => {
                  const key = `${dayIndex}-${hour}`
                  const slots = slotsByDayHour[key] || []
                  
                  return (
                    <div
                      key={key}
                      className="relative h-16 border-b border-r bg-gray-50"
                    >
                      {slots.map((slot, slotIndex) => {
                        const isSlotStart = Math.floor(slot.start_time / 60) === hour
                        
                        if (!isSlotStart) return null
                        
                        const duration = slot.end_time - slot.start_time
                        const heightInCells = Math.ceil(duration / 60)
                        const height = heightInCells * 64 - 8 // 64px par cellule - 8px pour les marges
                        
                        const employeeColor = getEmployeeColor(slot.employeeId)
                        const columnWidth = 100 / Math.max(3, slots.length) // Largeur adaptative
                        const leftOffset = slot.columnIndex * columnWidth
                        
                        return (
                          <div
                            key={`${slot.id}-${slotIndex}`}
                            className={`absolute rounded p-1 text-xs overflow-hidden border-2 ${employeeColor.bg} ${employeeColor.border} ${employeeColor.text}`}
                            style={{
                              height: `${height}px`,
                              minHeight: '56px',
                              left: `${leftOffset}%`,
                              width: `${columnWidth - 2}%`, // -2% pour l'espacement
                              top: '4px',
                              zIndex: 10 + slot.columnIndex
                            }}
                            title={`${slot.employeeName} - ${slot.title} (${minutesToTime(slot.start_time)} - ${minutesToTime(slot.end_time)})`}
                          >
                            <div className="font-bold text-xs truncate">
                              {slot.employeeName}
                            </div>
                            <div className="text-xs opacity-90 truncate">
                              {slot.title}
                            </div>
                            <div className="text-xs opacity-75">
                              {minutesToTime(slot.start_time)} - {minutesToTime(slot.end_time)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalPlanningView
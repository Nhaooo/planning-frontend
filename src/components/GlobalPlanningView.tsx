import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePlanningStore } from '../store/planningStore'
import { simplePlanningApi, SimpleSlot } from '../services/simplePlanningApi'
import { employeeService } from '../services/api'
import { Employee } from '../types'
import { getSlotStyle } from '../utils/categoryColors'
import LoadingSpinner from './LoadingSpinner'

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

// Organiser les créneaux par jour et heure
  const slotsByDayHour = useMemo(() => {
    if (!employeeQueries.data) return {}
    
    const organized: { [key: string]: (SimpleSlot & { employeeName: string; employeeId: number })[] } = {}
    
    employeeQueries.data.forEach(({ employee, slots }) => {
      if (!employee) return
      
      slots.forEach(slot => {
        const slotDate = new Date(slot.date)
        const weekStart = new Date(displayWeekStart)
        const dayIndex = Math.floor((slotDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24))
        
        if (dayIndex >= 0 && dayIndex < 7) {
          const startHour = Math.floor(slot.start_time / 60)
          const endHour = Math.ceil(slot.end_time / 60)
          
          for (let hour = startHour; hour < endHour; hour++) {
            if (hour >= 7 && hour < 21) {
              const key = `${dayIndex}-${hour}`
              if (!organized[key]) organized[key] = []
              
              // Ajouter les infos employé au slot
              const enrichedSlot = {
                ...slot,
                employeeName: employee.fullname,
                employeeId: employee.id
              }
              organized[key].push(enrichedSlot)
            }
          }
        }
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
                        
                        return (
                          <div
                            key={`${slot.id}-${slotIndex}`}
                            className="absolute inset-1 text-white rounded p-1 text-xs overflow-hidden z-10"
                            style={{
                              ...getSlotStyle(slot.category),
                              height: `${height}px`,
                              minHeight: '56px',
                              left: `${slotIndex * 2}px`, // Décalage pour éviter la superposition
                              right: `${slotIndex * 2}px`,
                              zIndex: 10 + slotIndex
                            }}
                            title={`${slot.employeeName} - ${slot.title} (${minutesToTime(slot.start_time)} - ${minutesToTime(slot.end_time)})`}
                          >
                            <div className="font-medium text-xs truncate">
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
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { simplePlanningApi, SimpleSlot, SimpleSlotUpdate } from '../services/simplePlanningApi'
import SlotModal from './SlotModal'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7h à 20h

// Utilitaires de conversion
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
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

const PlanningGrid: React.FC = () => {
  const { selectedEmployeeId } = usePlanningStore()
  const queryClient = useQueryClient()
  
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()))
  const [selectedSlot, setSelectedSlot] = useState<SimpleSlot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<{ date: string; dayOfWeek: number; startTime: number } | null>(null)

  console.log('🔄 PlanningGrid render - Employé:', selectedEmployeeId, 'Semaine:', currentWeekStart)

  // Query pour récupérer le planning de la semaine
  const { data: weekPlanning, isLoading, error } = useQuery({
    queryKey: ['week-planning', selectedEmployeeId, currentWeekStart],
    queryFn: async () => {
      if (!selectedEmployeeId) {
        console.log('❌ Pas d\'employé sélectionné')
        return null
      }
      
      console.log('📡 Tentative de récupération planning:', { 
        employeeId: selectedEmployeeId, 
        weekStart: currentWeekStart 
      })
      
      try {
        const result = await simplePlanningApi.getWeekPlanning(selectedEmployeeId, currentWeekStart)
        console.log('✅ Planning récupéré avec succès:', result)
        return result
      } catch (err) {
         console.error('❌ Erreur lors de la récupération du planning:', err)
         console.error('❌ Détails de l\'erreur:', {
           message: err instanceof Error ? err.message : 'Erreur inconnue',
           status: (err as any)?.status,
           url: (err as any)?.url
         })
         throw err
       }
    },
    enabled: !!selectedEmployeeId,
    staleTime: 30000,
    retry: 1
  })

  console.log('📊 État de la query:', { 
    isLoading, 
    error: error?.message, 
    hasData: !!weekPlanning,
    dataLength: weekPlanning?.slots?.length 
  })

  // Mutations
  const createSlotMutation = useMutation({
    mutationFn: simplePlanningApi.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      setIsModalOpen(false)
      setNewSlotData(null)
      console.log('✅ Créneau créé avec succès')
    },
    onError: (error) => {
      console.error('❌ Erreur création créneau:', error)
      alert(`Erreur lors de la création: ${error.message}`)
    }
  })

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, slotData }: { slotId: number; slotData: SimpleSlotUpdate }) => 
      simplePlanningApi.updateSlot(slotId, slotData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      setIsModalOpen(false)
      setSelectedSlot(null)
      console.log('✅ Créneau modifié avec succès')
    },
    onError: (error) => {
      console.error('❌ Erreur modification créneau:', error)
      alert(`Erreur lors de la modification: ${error.message}`)
    }
  })

  const deleteSlotMutation = useMutation({
    mutationFn: simplePlanningApi.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      console.log('✅ Créneau supprimé avec succès')
    },
    onError: (error) => {
      console.error('❌ Erreur suppression créneau:', error)
      alert(`Erreur lors de la suppression: ${error.message}`)
    }
  })

  // Gestionnaires d'événements
  const handleCellClick = (dayIndex: number, hour: number) => {
    if (!selectedEmployeeId) return
    
    const date = addDaysToDate(currentWeekStart, dayIndex)
    const startTime = hour * 60 // Convertir l'heure en minutes
    
    console.log('🎯 Clic cellule:', { dayIndex, hour, date, startTime })
    
    setNewSlotData({ date, dayOfWeek: dayIndex, startTime })
    setSelectedSlot(null)
    setIsModalOpen(true)
  }

  const handleSlotClick = (slot: SimpleSlot) => {
    console.log('🎯 Clic créneau:', slot)
    setSelectedSlot(slot)
    setNewSlotData(null)
    setIsModalOpen(true)
  }

  const handleDeleteSlot = (slotId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      deleteSlotMutation.mutate(slotId)
    }
  }

  const handleSaveSlot = (slotData: any) => {
    if (!selectedEmployeeId) return

    if (selectedSlot) {
      // Modification
      updateSlotMutation.mutate({
        slotId: selectedSlot.id,
        slotData: {
          title: slotData.title,
          category: slotData.category,
          comment: slotData.comment,
          start_time: timeToMinutes(slotData.startTime),
          end_time: timeToMinutes(slotData.endTime)
        }
      })
    } else if (newSlotData) {
      // Création
      createSlotMutation.mutate({
        employee_id: selectedEmployeeId,
        date: newSlotData.date,
        day_of_week: newSlotData.dayOfWeek,
        start_time: timeToMinutes(slotData.startTime),
        end_time: timeToMinutes(slotData.endTime),
        title: slotData.title,
        category: slotData.category,
        comment: slotData.comment || ''
      })
    }
  }

  // Fonction pour obtenir les créneaux d'un jour spécifique
  const getSlotsForDay = (dayIndex: number): SimpleSlot[] => {
    if (!weekPlanning?.slots) return []
    
    const dayDate = addDaysToDate(currentWeekStart, dayIndex)
    return weekPlanning.slots.filter(slot => slot.date === dayDate)
  }

  // Fonction pour vérifier si une cellule a un créneau
  const getSlotAtTime = (dayIndex: number, hour: number): SimpleSlot | null => {
    const slots = getSlotsForDay(dayIndex)
    const timeInMinutes = hour * 60
    
    return slots.find(slot => 
      slot.start_time <= timeInMinutes && slot.end_time > timeInMinutes
    ) || null
  }

  // Navigation semaine
  const goToPreviousWeek = () => {
    const prevWeek = new Date(currentWeekStart)
    prevWeek.setDate(prevWeek.getDate() - 7)
    setCurrentWeekStart(getWeekStart(prevWeek))
  }

  const goToNextWeek = () => {
    const nextWeek = new Date(currentWeekStart)
    nextWeek.setDate(nextWeek.getDate() + 7)
    setCurrentWeekStart(getWeekStart(nextWeek))
  }

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()))
  }

  // Fonction de test API
  const testApi = async () => {
    if (!selectedEmployeeId) {
      alert('Sélectionnez d\'abord un employé')
      return
    }
    
    console.log('🧪 Test API manuel...')
    try {
      const result = await simplePlanningApi.getWeekPlanning(selectedEmployeeId, currentWeekStart)
      console.log('✅ Test API réussi:', result)
      alert('Test API réussi ! Voir la console pour les détails.')
    } catch (error) {
       console.error('❌ Test API échoué:', error)
       alert(`Test API échoué: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
     }
  }

  if (!selectedEmployeeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé sélectionné</h3>
          <p className="text-gray-500">Sélectionnez un employé pour voir son planning</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">Impossible de charger le planning</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['week-planning'] })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Panneau de debug visible */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg">
        <h3 className="font-bold text-yellow-800 mb-2">🔍 Debug Info</h3>
        <div className="text-sm space-y-1">
          <div><strong>Employé sélectionné:</strong> {selectedEmployeeId || 'Aucun'}</div>
          <div><strong>Semaine courante:</strong> {currentWeekStart}</div>
          <div><strong>État de chargement:</strong> {isLoading ? 'Chargement...' : 'Terminé'}</div>
          <div><strong>Erreur:</strong> {error ? ((error as any) instanceof Error ? (error as Error).message : String(error)) : 'Aucune'}</div>
          <div><strong>Données reçues:</strong> {weekPlanning ? `${weekPlanning.slots?.length || 0} créneaux` : 'Aucune'}</div>
          <div><strong>URL API:</strong> {selectedEmployeeId ? `/planning/week?employee_id=${selectedEmployeeId}&week_start=${currentWeekStart}` : 'N/A'}</div>
        </div>
        <div className="mt-3 space-x-2">
          <button 
            onClick={testApi}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            🧪 Tester API
          </button>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['week-planning'] })}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            🔄 Recharger
          </button>
        </div>
      </div>

      {/* Navigation semaine */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <button 
          onClick={goToPreviousWeek}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          ← Semaine précédente
        </button>
        
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Semaine du {new Date(currentWeekStart).toLocaleDateString('fr-FR')}
          </h2>
          <button 
            onClick={goToCurrentWeek}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Aller à cette semaine
          </button>
        </div>
        
        <button 
          onClick={goToNextWeek}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
        >
          Semaine suivante →
        </button>
      </div>

      {/* Grille de planning */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-8 gap-0">
          {/* En-tête avec les jours */}
          <div className="bg-gray-50 p-3 font-medium text-center border-b">Heures</div>
          {DAYS.map((day, index) => (
            <div key={day} className="bg-gray-50 p-3 font-medium text-center border-b">
              {day}
              <div className="text-xs text-gray-500 mt-1">
                {new Date(addDaysToDate(currentWeekStart, index)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
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
                const slot = getSlotAtTime(dayIndex, hour)
                
                return (
                  <div 
                    key={`${hour}-${dayIndex}`}
                    className={`
                      relative h-16 border-b border-r cursor-pointer transition-colors
                      ${slot ? 'bg-blue-100' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => slot ? handleSlotClick(slot) : handleCellClick(dayIndex, hour)}
                  >
                    {slot ? (
                      <div className="absolute inset-1 bg-blue-500 text-white rounded p-1 text-xs overflow-hidden">
                        <div className="font-medium truncate">{slot.title}</div>
                        <div className="text-blue-100">
                          {minutesToTime(slot.start_time)} - {minutesToTime(slot.end_time)}
                        </div>
                        <button
                          onClick={(e) => handleDeleteSlot(slot.id, e)}
                          className="absolute top-1 right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus size={16} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Debug info */}
      <div className="bg-yellow-50 p-3 rounded text-sm">
        <strong>Debug:</strong> Employé {selectedEmployeeId} | Semaine {currentWeekStart} | 
        {weekPlanning?.slots?.length || 0} créneaux
      </div>

      {/* Modal */}
      {isModalOpen && (
        <SlotModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSlot(null)
            setNewSlotData(null)
          }}
          onSave={handleSaveSlot}
          slot={selectedSlot}
          defaultStartTime={newSlotData ? minutesToTime(newSlotData.startTime) : undefined}
          isLoading={createSlotMutation.isPending || updateSlotMutation.isPending}
        />
      )}
    </div>
  )
}

export default PlanningGrid
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Move } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { slotApi, Slot, SlotUpdate } from '../services/slotApi'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7h à 20h

// Utilitaires
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
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<{ date: string; hour: number } | null>(null)
  const [draggedSlot, setDraggedSlot] = useState<Slot | null>(null)

  console.log('🔄 PlanningGrid render - Employé:', selectedEmployeeId, 'Semaine:', currentWeekStart)

  // Query pour récupérer le planning
  const { data: weekPlanning, isLoading, error } = useQuery({
    queryKey: ['week-planning', selectedEmployeeId, currentWeekStart],
    queryFn: () => selectedEmployeeId ? slotApi.getWeekPlanning(selectedEmployeeId, currentWeekStart) : null,
    enabled: !!selectedEmployeeId,
    staleTime: 30000,
    retry: 1
  })

  // Mutations
  const createSlotMutation = useMutation({
    mutationFn: slotApi.createSlot,
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
    mutationFn: ({ slotId, slotData }: { slotId: number; slotData: SlotUpdate }) => 
      slotApi.updateSlot(slotId, slotData),
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
    mutationFn: slotApi.deleteSlot,
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
    console.log('🎯 Clic cellule:', { dayIndex, hour, date })
    
    setNewSlotData({ date, hour })
    setSelectedSlot(null)
    setIsModalOpen(true)
  }

  const handleSlotClick = (slot: Slot) => {
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

  const handleSaveSlot = (formData: any) => {
    if (!selectedEmployeeId) return

    if (selectedSlot) {
      // Modification
      updateSlotMutation.mutate({
        slotId: selectedSlot.id,
        slotData: {
          title: formData.title,
          category: formData.category,
          comment: formData.comment,
          start_hour: parseInt(formData.startTime.split(':')[0]),
          start_minute: parseInt(formData.startTime.split(':')[1]),
          duration_hours: parseInt(formData.endTime.split(':')[0]) - parseInt(formData.startTime.split(':')[0]),
          duration_minutes: parseInt(formData.endTime.split(':')[1]) - parseInt(formData.startTime.split(':')[1])
        }
      })
    } else if (newSlotData) {
      // Création
      const startHour = parseInt(formData.startTime.split(':')[0])
      const startMinute = parseInt(formData.startTime.split(':')[1])
      const endHour = parseInt(formData.endTime.split(':')[0])
      const endMinute = parseInt(formData.endTime.split(':')[1])
      
      createSlotMutation.mutate({
        employee_id: selectedEmployeeId,
        date: newSlotData.date,
        start_hour: startHour,
        start_minute: startMinute,
        duration_hours: endHour - startHour,
        duration_minutes: endMinute - startMinute,
        title: formData.title,
        category: formData.category,
        comment: formData.comment || ''
      })
    }
  }

  // Fonction pour obtenir les créneaux d'un jour spécifique
  const getSlotsForDay = (dayIndex: number): Slot[] => {
    if (!weekPlanning?.slots) return []
    
    const dayDate = addDaysToDate(currentWeekStart, dayIndex)
    return weekPlanning.slots.filter(slot => slot.date === dayDate)
  }

  // Fonction pour vérifier si une cellule a un créneau
  const getSlotAtTime = (dayIndex: number, hour: number): Slot | null => {
    const slots = getSlotsForDay(dayIndex)
    
    return slots.find(slot => 
      slot.start_hour <= hour && (slot.start_hour + slot.duration_hours) > hour
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

  // Drag & Drop
  const handleDragStart = (slot: Slot) => {
    setDraggedSlot(slot)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (dayIndex: number, hour: number) => {
    if (!draggedSlot) return
    
    const newDate = addDaysToDate(currentWeekStart, dayIndex)
    
    updateSlotMutation.mutate({
      slotId: draggedSlot.id,
      slotData: {
        date: newDate,
        start_hour: hour,
        start_minute: 0
      }
    })
    
    setDraggedSlot(null)
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
      {/* Debug info */}
      <div className="bg-green-100 border border-green-400 p-3 rounded">
        <strong>✅ Planning Ultra-Simple:</strong> Employé {selectedEmployeeId} | Semaine {currentWeekStart} | 
        {weekPlanning?.slots?.length || 0} créneaux | API: /slots/week
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
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(dayIndex, hour)}
                  >
                    {slot ? (
                      <div 
                        className="absolute inset-1 bg-blue-500 text-white rounded p-1 text-xs overflow-hidden cursor-move"
                        draggable
                        onDragStart={() => handleDragStart(slot)}
                      >
                        <div className="font-medium truncate">{slot.title}</div>
                        <div className="text-blue-100">
                          {slot.start_time_str} - {slot.end_time_str}
                        </div>
                        <div className="absolute top-1 right-1 flex space-x-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSlotClick(slot) }}
                            className="w-4 h-4 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center"
                          >
                            <Edit size={8} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteSlot(slot.id, e)}
                            className="w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                          >
                            <Trash2 size={8} />
                          </button>
                        </div>
                        <div className="absolute top-1 left-1">
                          <Move size={8} className="text-white opacity-50" />
                        </div>
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

      {/* Modal simple */}
      {isModalOpen && (
        <SimpleSlotModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSlot(null)
            setNewSlotData(null)
          }}
          onSave={handleSaveSlot}
          slot={selectedSlot}
          defaultStartTime={newSlotData ? `${newSlotData.hour}:00` : undefined}
          isLoading={createSlotMutation.isPending || updateSlotMutation.isPending}
        />
      )}
    </div>
  )
}

// Modal ultra-simple
const SimpleSlotModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  slot?: Slot | null
  defaultStartTime?: string
  isLoading?: boolean
}> = ({ isOpen, onClose, onSave, slot, defaultStartTime, isLoading = false }) => {
  const [formData, setFormData] = useState({
    title: slot?.title || '',
    category: slot?.category || 'a',
    comment: slot?.comment || '',
    startTime: slot ? slot.start_time_str : (defaultStartTime || '09:00'),
    endTime: slot ? slot.end_time_str : '10:00'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      alert('Le titre est requis')
      return
    }
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {slot ? 'Modifier le créneau' : 'Nouveau créneau'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              <option value="a">Administratif/gestion</option>
              <option value="p">Prestation/événement</option>
              <option value="e">École d'escalade</option>
              <option value="c">Groupes compétition</option>
              <option value="o">Ouverture</option>
              <option value="l">Loisir</option>
              <option value="m">Mise en place / Rangement</option>
              <option value="s">Santé Adulte/Enfant</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Début *</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fin *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlanningGrid
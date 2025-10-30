import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy } from 'lucide-react'
import { usePlanningStore, SimpleSlot } from '../store/planningStore'

// Configuration
const HOURS = Array.from({ length: 14 }, (_, i) => i + 9) // 9h à 22h
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const CATEGORIES = [
  { id: 'admin', label: 'Administration', color: '#3B82F6' },
  { id: 'prestation', label: 'Prestation', color: '#10B981' },
  { id: 'ecole', label: 'École', color: '#F59E0B' },
  { id: 'competition', label: 'Compétition', color: '#EF4444' },
  { id: 'ouverture', label: 'Ouverture', color: '#8B5CF6' },
  { id: 'loisir', label: 'Loisir', color: '#06B6D4' },
  { id: 'rangement', label: 'Rangement', color: '#6B7280' },
  { id: 'sante', label: 'Santé', color: '#EC4899' }
]

// Modal pour créer/éditer un créneau
interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (slot: Omit<SimpleSlot, 'id' | 'color'>) => void
  slot?: SimpleSlot | null
  initialDay?: number
  initialHour?: number
}

const SlotModal: React.FC<SlotModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  slot, 
  initialDay = 0, 
  initialHour = 9 
}) => {
  const { selectedEmployeeId } = usePlanningStore()
  const [formData, setFormData] = useState({
    title: '',
    category: 'admin',
    comment: '',
    day: initialDay,
    startHour: initialHour,
    startMinute: 0,
    durationMinutes: 60
  })

  useEffect(() => {
    if (slot) {
      setFormData({
        title: slot.title,
        category: slot.category,
        comment: slot.comment || '',
        day: slot.day,
        startHour: slot.startHour,
        startMinute: slot.startMinute,
        durationMinutes: slot.durationMinutes
      })
    } else {
      setFormData({
        title: '',
        category: 'admin',
        comment: '',
        day: initialDay,
        startHour: initialHour,
        startMinute: 0,
        durationMinutes: 60
      })
    }
  }, [slot, initialDay, initialHour])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId || !formData.title.trim()) return

    onSave({
      employeeId: selectedEmployeeId,
      title: formData.title.trim(),
      category: formData.category,
      comment: formData.comment.trim(),
      day: formData.day,
      startHour: formData.startHour,
      startMinute: formData.startMinute,
      durationMinutes: formData.durationMinutes
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {slot ? 'Modifier le créneau' : 'Nouveau créneau'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Ex: Cours d'escalade"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jour</label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                {DAYS.map((day, index) => (
                  <option key={index} value={index}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Heure</label>
              <select
                value={formData.startHour}
                onChange={(e) => setFormData({ ...formData, startHour: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                {HOURS.map(hour => (
                  <option key={hour} value={hour}>{hour}:00</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Minutes</label>
              <select
                value={formData.startMinute}
                onChange={(e) => setFormData({ ...formData, startMinute: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={0}>:00</option>
                <option value={15}>:15</option>
                <option value={30}>:30</option>
                <option value={45}>:45</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Durée</label>
              <select
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                className="w-full border rounded px-3 py-2"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1h</option>
                <option value={90}>1h30</option>
                <option value={120}>2h</option>
                <option value={180}>3h</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Commentaire</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={2}
              placeholder="Commentaire optionnel..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {slot ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Composant principal
const PlanningGrid: React.FC = () => {
  const {
    employees,
    selectedEmployeeId,
    setSelectedEmployee,
    addSlot,
    updateSlot,
    removeSlot,
    getSlotsForEmployee,
    initializeDefaultData
  } = usePlanningStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<SimpleSlot | null>(null)
  const [modalInitialDay, setModalInitialDay] = useState(0)
  const [modalInitialHour, setModalInitialHour] = useState(9)

  // Initialiser les données au premier chargement
  useEffect(() => {
    initializeDefaultData()
  }, [initializeDefaultData])

  // Obtenir les créneaux de l'employé sélectionné
  const slots = selectedEmployeeId ? getSlotsForEmployee(selectedEmployeeId, '') : []

  // Ouvrir le modal pour créer un créneau
  const handleCellClick = (day: number, hour: number) => {
    if (!selectedEmployeeId) return
    setEditingSlot(null)
    setModalInitialDay(day)
    setModalInitialHour(hour)
    setIsModalOpen(true)
  }

  // Ouvrir le modal pour éditer un créneau
  const handleSlotEdit = (slot: SimpleSlot) => {
    setEditingSlot(slot)
    setIsModalOpen(true)
  }

  // Sauvegarder un créneau
  const handleSlotSave = (slotData: Omit<SimpleSlot, 'id' | 'color'>) => {
    if (editingSlot) {
      updateSlot(editingSlot.id, slotData)
    } else {
      addSlot(slotData)
    }
  }

  // Dupliquer un créneau
  const handleSlotDuplicate = (slot: SimpleSlot) => {
    addSlot({
      employeeId: slot.employeeId,
      title: `${slot.title} (copie)`,
      category: slot.category,
      comment: slot.comment,
      day: slot.day,
      startHour: slot.startHour + 1, // Décaler d'une heure
      startMinute: slot.startMinute,
      durationMinutes: slot.durationMinutes
    })
  }

  // Calculer la position d'un créneau
  const getSlotStyle = (slot: SimpleSlot) => {
    const top = (slot.startHour - 9) * 60 + slot.startMinute
    const height = slot.durationMinutes
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: slot.color,
      left: '2px',
      right: '2px'
    }
  }

  // Formater l'heure
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  if (!selectedEmployeeId) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h2 className="text-xl font-semibold mb-4">Planning Hebdomadaire</h2>
        <p className="text-gray-600 mb-6">Sélectionnez un employé pour voir son planning</p>
        
        <div className="space-y-2">
          {employees.map(employee => (
            <button
              key={employee.id}
              onClick={() => setSelectedEmployee(employee.id)}
              className="block w-full p-3 text-left border rounded hover:bg-blue-50 hover:border-blue-300"
            >
              {employee.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId)

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* En-tête */}
      <div className="bg-blue-50 p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            Planning de {selectedEmployee?.name}
          </h2>
          <div className="flex items-center space-x-2">
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployee(parseInt(e.target.value))}
              className="border rounded px-3 py-1"
            >
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">
              {slots.length} créneau{slots.length > 1 ? 'x' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Grille */}
      <div className="overflow-auto max-h-[600px]">
        <div className="grid grid-cols-8 min-h-full">
          {/* Colonne des heures */}
          <div className="bg-gray-50 border-r">
            <div className="h-12 border-b flex items-center justify-center font-medium text-sm">
              Heure
            </div>
            {HOURS.map(hour => (
              <div key={hour} className="h-[60px] border-b flex items-center justify-center text-sm">
                {hour}:00
              </div>
            ))}
          </div>

          {/* Colonnes des jours */}
          {DAYS.map((day, dayIndex) => (
            <div key={dayIndex} className="border-r last:border-r-0 relative">
              {/* En-tête du jour */}
              <div className="h-12 border-b bg-gray-50 flex items-center justify-center font-medium text-sm">
                {day}
              </div>

              {/* Cellules horaires */}
              <div className="relative">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-[60px] border-b hover:bg-blue-50 cursor-pointer group relative"
                    onClick={() => handleCellClick(dayIndex, hour)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Plus className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                ))}

                {/* Créneaux */}
                {slots
                  .filter(slot => slot.day === dayIndex)
                  .map(slot => (
                    <div
                      key={slot.id}
                      className="absolute rounded shadow-sm border border-white cursor-pointer group z-10"
                      style={getSlotStyle(slot)}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSlotEdit(slot)
                      }}
                    >
                      <div className="p-1 h-full flex flex-col justify-between text-white text-xs">
                        <div>
                          <div className="font-medium truncate">{slot.title}</div>
                          <div className="opacity-90">
                            {formatTime(slot.startHour, slot.startMinute)} - 
                            {formatTime(
                              slot.startHour + Math.floor((slot.startMinute + slot.durationMinutes) / 60),
                              (slot.startMinute + slot.durationMinutes) % 60
                            )}
                          </div>
                        </div>
                        {slot.comment && (
                          <div className="opacity-75 truncate">{slot.comment}</div>
                        )}
                      </div>

                      {/* Actions au hover */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSlotEdit(slot)
                          }}
                          className="p-1 bg-white bg-opacity-90 rounded text-gray-700 hover:bg-opacity-100"
                          title="Modifier"
                        >
                          <Edit className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSlotDuplicate(slot)
                          }}
                          className="p-1 bg-white bg-opacity-90 rounded text-gray-700 hover:bg-opacity-100"
                          title="Dupliquer"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Supprimer ce créneau ?')) {
                              removeSlot(slot.id)
                            }
                          }}
                          className="p-1 bg-white bg-opacity-90 rounded text-red-600 hover:bg-opacity-100"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <SlotModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSlotSave}
        slot={editingSlot}
        initialDay={modalInitialDay}
        initialHour={modalInitialHour}
      />
    </div>
  )
}

export default PlanningGrid
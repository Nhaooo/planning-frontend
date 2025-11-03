import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { SimpleSlot } from '../services/simplePlanningApi'
import { CATEGORY_COLORS } from '../utils/categoryColors'

interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SlotFormData) => void
  slot?: SimpleSlot | null
  defaultStartTime?: string
  isLoading?: boolean
}

interface SlotFormData {
  title: string
  category: string
  comment: string
  startTime: string
  endTime: string
}

const CATEGORIES = Object.entries(CATEGORY_COLORS).map(([code, config]) => ({
  code,
  label: config.name,
  color: config.color
}))

const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const SlotModal: React.FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  slot,
  defaultStartTime,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<SlotFormData>({
    title: '',
    category: 'administratif',
    comment: '',
    startTime: defaultStartTime || '09:00',
    endTime: '10:00'
  })

  // Initialiser le formulaire
  useEffect(() => {
    if (slot) {
      // Mode édition
      setFormData({
        title: slot.title,
        category: slot.category,
        comment: slot.comment || '',
        startTime: minutesToTime(slot.start_time),
        endTime: minutesToTime(slot.end_time)
      })
    } else {
      // Mode création
      setFormData({
        title: '',
        category: 'administratif',
        comment: '',
        startTime: defaultStartTime || '09:00',
        endTime: '10:00'
      })
    }
  }, [slot, defaultStartTime])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation simple
    if (!formData.title.trim()) {
      alert('Le titre est requis')
      return
    }
    
    if (formData.startTime >= formData.endTime) {
      alert('L\'heure de fin doit être après l\'heure de début')
      return
    }
    
    onSave(formData)
  }

  const handleInputChange = (field: keyof SlotFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {slot ? 'Modifier le créneau' : 'Nouveau créneau'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Cours débutants"
              required
              disabled={isLoading}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            >
              {CATEGORIES.map(cat => (
                <option key={cat.code} value={cat.code}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Horaires */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Début *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fin *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange('endTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commentaire
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Commentaire optionnel..."
              disabled={isLoading}
            />
          </div>

          {/* Boutons */}
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

export default SlotModal
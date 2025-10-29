import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { Slot, SlotFormData } from '../types'
import { minutesToTime, timeToMinutes } from '../utils/timeUtils'
import { getAllCategories, DEFAULT_CATEGORY_LEGEND } from '../utils/categoryUtils'

interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: SlotFormData) => void
  slot?: Slot | null
  initialData?: Partial<SlotFormData> | null
}

const slotSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200, 'Le titre est trop long'),
  category: z.enum(['a', 'p', 'e', 'c', 'o', 'l', 'm', 's'], {
    required_error: 'La catégorie est requise'
  }),
  comment: z.string().max(500, 'Le commentaire est trop long').optional(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide'),
  duration_min: z.number().min(15, 'Durée minimum 15 minutes').max(720, 'Durée maximum 12 heures'),
  day_index: z.number().min(0).max(6)
})

type SlotFormFields = z.infer<typeof slotSchema>

const SlotModal: FC<SlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  slot,
  initialData
}) => {
  const categories = getAllCategories(DEFAULT_CATEGORY_LEGEND)
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid }
  } = useForm<SlotFormFields>({
    resolver: zodResolver(slotSchema),
    mode: 'onChange'
  })

  const selectedCategory = watch('category')

  // Initialiser le formulaire
  useEffect(() => {
    if (isOpen) {
      if (slot) {
        // Mode édition
        reset({
          title: slot.title,
          category: slot.category,
          comment: slot.comment || '',
          start_time: minutesToTime(slot.start_min),
          duration_min: slot.duration_min,
          day_index: slot.day_index
        })
      } else if (initialData) {
        // Mode création avec données initiales
        reset({
          title: '',
          category: initialData.category || 'o',
          comment: '',
          start_time: initialData.start_min ? minutesToTime(initialData.start_min) : '09:00',
          duration_min: initialData.duration_min || 60,
          day_index: initialData.day_index || 0
        })
      }
    }
  }, [isOpen, slot, initialData, reset])

  const onSubmit = (data: SlotFormFields) => {
    const formData: SlotFormData = {
      title: data.title,
      category: data.category,
      comment: data.comment,
      day_index: data.day_index,
      start_min: timeToMinutes(data.start_time),
      duration_min: data.duration_min
    }
    
    onSave(formData)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {slot ? 'Modifier le créneau' : 'Nouveau créneau'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              {...register('title')}
              className="form-input"
              placeholder="Ex: Cours d'escalade débutants"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie *
            </label>
            <select {...register('category')} className="form-select">
              {categories.map((category) => (
                <option key={category.code} value={category.code}>
                  {category.label}
                </option>
              ))}
            </select>
            {selectedCategory && (
              <div className="mt-2 flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: categories.find(c => c.code === selectedCategory)?.color }}
                />
                <span className="text-sm text-gray-600">
                  {categories.find(c => c.code === selectedCategory)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Heure et durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Heure de début *
              </label>
              <input
                type="time"
                {...register('start_time')}
                className="form-input"
              />
              {errors.start_time && (
                <p className="text-red-600 text-sm mt-1">{errors.start_time.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée (minutes) *
              </label>
              <select {...register('duration_min', { valueAsNumber: true })} className="form-select">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1h</option>
                <option value={90}>1h30</option>
                <option value={120}>2h</option>
                <option value={180}>3h</option>
                <option value={240}>4h</option>
              </select>
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire
            </label>
            <textarea
              {...register('comment')}
              rows={3}
              className="form-input"
              placeholder="Informations complémentaires..."
            />
            {errors.comment && (
              <p className="text-red-600 text-sm mt-1">{errors.comment.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {slot ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SlotModal
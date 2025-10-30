import { FC, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, User } from 'lucide-react'
import { Employee } from '../types'
import { employeeService } from '../services/api'
import LoadingSpinner from './LoadingSpinner'

interface EmployeeFormModalProps {
  isOpen: boolean
  onClose: () => void
  employee?: Employee | null
}

const employeeSchema = z.object({
  fullname: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom est trop long'),
  slug: z.string()
    .min(2, 'L\'identifiant doit contenir au moins 2 caractères')
    .max(50, 'L\'identifiant est trop long')
    .regex(/^[a-z0-9-]+$/, 'L\'identifiant ne peut contenir que des lettres minuscules, chiffres et tirets'),
  active: z.boolean()
})

type EmployeeFormData = z.infer<typeof employeeSchema>

const EmployeeFormModal: FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  employee
}) => {
  const queryClient = useQueryClient()
  const isEditing = !!employee

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid }
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      active: true
    }
  })

  // Mutation pour créer/modifier
  const mutation = useMutation({
    mutationFn: async (data: EmployeeFormData) => {
      if (isEditing && employee) {
        return employeeService.update(employee.id, data)
      } else {
        return employeeService.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
      reset()
    },
    onError: (error) => {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  })

  // Initialiser le formulaire en mode édition
  useEffect(() => {
    if (isOpen && employee) {
      setValue('fullname', employee.fullname)
      setValue('slug', employee.slug)
      setValue('active', employee.active)
    } else if (isOpen) {
      reset({
        fullname: '',
        slug: '',
        active: true
      })
    }
  }, [isOpen, employee, setValue, reset])

  const onSubmit = (data: EmployeeFormData) => {
    mutation.mutate(data)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Générer automatiquement le slug depuis le nom
  const generateSlug = (fullname: string) => {
    return fullname
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Éviter les tirets multiples
      .replace(/^-|-$/g, '') // Supprimer tirets en début/fin
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>{isEditing ? 'Modifier l\'employé' : 'Nouvel employé'}</span>
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
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              {...register('fullname')}
              className="form-input"
              placeholder="Ex: Jeanne Dupont"
              onChange={(e) => {
                // Auto-générer le slug
                if (!isEditing) {
                  const slug = generateSlug(e.target.value)
                  setValue('slug', slug)
                }
              }}
            />
            {errors.fullname && (
              <p className="text-red-600 text-sm mt-1">{errors.fullname.message}</p>
            )}
          </div>

          {/* Identifiant (slug) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Identifiant (slug) *
            </label>
            <input
              type="text"
              {...register('slug')}
              className="form-input"
              placeholder="Ex: jeanne-dupont"
            />
            {errors.slug && (
              <p className="text-red-600 text-sm mt-1">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Utilisé pour la connexion employé. Lettres minuscules, chiffres et tirets uniquement.
            </p>
          </div>

          {/* Statut actif */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('active')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Employé actif
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Les employés inactifs n'apparaissent pas dans les sélecteurs de planning.
            </p>
          </div>

          {/* Erreur de mutation */}
          {mutation.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Erreur lors de la sauvegarde. Vérifiez que l'identifiant n'existe pas déjà.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={mutation.isPending}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {mutation.isPending && <LoadingSpinner size="small" />}
              <span>
                {mutation.isPending 
                  ? 'Sauvegarde...' 
                  : isEditing ? 'Modifier' : 'Créer'
                }
              </span>
            </button>
          </div>
        </form>

        {/* Aide */}
        {!isEditing && (
          <div className="px-6 pb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                💡 Conseils
              </h4>
              <div className="text-xs text-blue-800 space-y-1">
                <div>• L'identifiant est généré automatiquement depuis le nom</div>
                <div>• Il peut être modifié avant la création</div>
                <div>• L'employé pourra se connecter avec cet identifiant</div>
                <div>• Exemple: "Jeanne Dupont" → identifiant "jeanne-dupont"</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeFormModal
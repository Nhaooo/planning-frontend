import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Shield, User, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import LoadingSpinner from './LoadingSpinner'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const loginSchema = z.object({
  loginType: z.enum(['admin', 'employee']),
  pin: z.string().optional(),
  employeeSlug: z.string().optional()
}).refine((data) => {
  if (data.loginType === 'admin') {
    return data.pin && data.pin.length >= 4
  }
  if (data.loginType === 'employee') {
    return data.employeeSlug && data.employeeSlug.length > 0
  }
  return false
}, {
  message: "Veuillez remplir les champs requis",
  path: ["root"]
})

type LoginFormData = z.infer<typeof loginSchema>

const LoginModal: FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [showPin, setShowPin] = useState(false)
  const { login, isLoading, error, clearError } = useAuthStore()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      loginType: 'admin'
    }
  })

  const loginType = watch('loginType')

  const onSubmit = async (data: LoginFormData) => {
    clearError()
    
    const credentials = {
      pin: data.loginType === 'admin' ? data.pin : undefined,
      employeeSlug: data.loginType === 'employee' ? data.employeeSlug : undefined
    }

    const success = await login(credentials)
    if (success) {
      reset()
      onClose()
    }
  }

  const handleClose = () => {
    reset()
    clearError()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            <span>Connexion</span>
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Sélecteur de type de connexion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              Type de connexion
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <label className="relative">
                <input
                  type="radio"
                  value="admin"
                  {...register('loginType')}
                  className="sr-only"
                />
                <div className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  loginType === 'admin' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    <span className="font-medium text-sm sm:text-base">Admin</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Accès complet avec PIN
                  </p>
                </div>
              </label>

              <label className="relative">
                <input
                  type="radio"
                  value="employee"
                  {...register('loginType')}
                  className="sr-only"
                />
                <div className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  loginType === 'employee' 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="font-medium text-sm sm:text-base">Employé</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Accès à son planning
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Champs de connexion selon le type */}
          {loginType === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PIN Administrateur
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  {...register('pin')}
                  className="form-input pr-10"
                  placeholder="Entrez votre PIN"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPin ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.pin && (
                <p className="text-red-600 text-sm mt-1">{errors.pin.message}</p>
              )}
            </div>
          )}

          {loginType === 'employee' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identifiant Employé
              </label>
              <input
                type="text"
                {...register('employeeSlug')}
                className="form-input"
                placeholder="Ex: jeanne, julien, lucas..."
                autoComplete="username"
              />
              {errors.employeeSlug && (
                <p className="text-red-600 text-sm mt-1">{errors.employeeSlug.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Utilisez votre identifiant (slug) pour accéder à votre planning
              </p>
            </div>
          )}

          {/* Erreur générale */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary order-2 sm:order-1"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 order-1 sm:order-2"
            >
              {isLoading && <LoadingSpinner size="small" />}
              <span>
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </span>
            </button>
          </div>
        </form>

        {/* Aide */}
        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Aide à la connexion
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>Admin :</strong> Accès complet avec PIN (défaut: 1234)</div>
              <div><strong>Employé :</strong> Accès à son planning avec son identifiant</div>
              <div className="hidden sm:block"><strong>Identifiants disponibles :</strong> jeanne, julien, lucas, melanie, raphael</div>
              <div className="sm:hidden"><strong>IDs :</strong> jeanne, julien, lucas, melanie, raphael</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
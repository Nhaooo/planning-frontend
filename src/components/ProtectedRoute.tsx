import { FC, ReactNode } from 'react'
import { Shield, Lock } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

interface ProtectedRouteProps {
  children: ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  requiredPermission?: string
  fallback?: ReactNode
}

const ProtectedRoute: FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requiredPermission,
  fallback
}) => {
  const { isAuthenticated, isAdmin, canAccess, user } = useAuthStore()

  // Vérifier l'authentification
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connexion requise
          </h3>
          <p className="text-gray-500 mb-4">
            Vous devez vous connecter pour accéder à cette page.
          </p>
        </div>
      </div>
    )
  }

  // Vérifier les droits admin
  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Accès administrateur requis
          </h3>
          <p className="text-gray-500 mb-4">
            Cette page est réservée aux administrateurs.
          </p>
          <div className="text-sm text-gray-400">
            Connecté en tant que : {user?.name} ({user?.type})
          </div>
        </div>
      </div>
    )
  }

  // Vérifier une permission spécifique
  if (requiredPermission && !canAccess(requiredPermission)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-12 w-12 text-orange-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Permission insuffisante
          </h3>
          <p className="text-gray-500 mb-4">
            Vous n'avez pas les permissions nécessaires pour cette action.
          </p>
          <div className="text-sm text-gray-400">
            Permission requise : {requiredPermission}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
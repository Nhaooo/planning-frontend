import { FC, useState } from 'react'
import { User, Shield, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const UserInfo: FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { user, logout, isAdmin } = useAuthStore()

  if (!user) return null

  const handleLogout = () => {
    logout()
    setIsDropdownOpen(false)
  }

  return (
    <div className="relative">
      {/* Bouton utilisateur */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className={`p-1 rounded-full ${
          user.type === 'admin' ? 'bg-blue-100' : 'bg-green-100'
        }`}>
          {user.type === 'admin' ? (
            <Shield className="h-4 w-4 text-blue-600" />
          ) : (
            <User className="h-4 w-4 text-green-600" />
          )}
        </div>
        
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.name}
          </div>
          <div className="text-xs text-gray-500">
            {user.type === 'admin' ? 'Administrateur' : 'Employé'}
          </div>
        </div>
        
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
          isDropdownOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Menu déroulant */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Informations utilisateur */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                user.type === 'admin' ? 'bg-blue-100' : 'bg-green-100'
              }`}>
                {user.type === 'admin' ? (
                  <Shield className="h-5 w-5 text-blue-600" />
                ) : (
                  <User className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">
                  {user.type === 'admin' ? 'Administrateur' : `Employé • ${user.slug}`}
                </div>
              </div>
            </div>
          </div>

          {/* Informations de session */}
          <div className="px-4 py-2 text-xs text-gray-500">
            <div>ID: {user.id}</div>
            <div>Expire: {new Date(user.expiresAt).toLocaleString('fr-FR')}</div>
          </div>

          {/* Actions admin */}
          {isAdmin() && (
            <>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={() => {
                  // TODO: Ouvrir l'interface de gestion des employés
                  console.log('Ouvrir gestion employés')
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span>Gérer les employés</span>
              </button>
            </>
          )}

          {/* Déconnexion */}
          <div className="border-t border-gray-200 my-2"></div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      )}

      {/* Overlay pour fermer le dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}

export default UserInfo
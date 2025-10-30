import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthState, UserRole, Permission } from '../types'
import { authService } from '../services/api'

interface AuthStore extends AuthState {
  // Actions
  login: (credentials: { pin?: string; employeeSlug?: string }) => Promise<boolean>
  logout: () => void
  setUser: (user: User | null) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // Utilitaires
  getPermissions: () => Permission
  isAdmin: () => boolean
  isEmployee: () => boolean
  canAccess: (resource: string) => boolean
}

// Définition des permissions par rôle
const getPermissionsByRole = (role: UserRole): Permission => {
  switch (role) {
    case 'admin':
      return {
        canViewAllEmployees: true,
        canEditAllEmployees: true,
        canCreateEmployees: true,
        canDeleteEmployees: true,
        canViewOwnPlanning: true,
        canEditOwnPlanning: true,
        canViewBackups: true,
        canCreateBackups: true
      }
    case 'employee':
      return {
        canViewAllEmployees: false,
        canEditAllEmployees: false,
        canCreateEmployees: false,
        canDeleteEmployees: false,
        canViewOwnPlanning: true,
        canEditOwnPlanning: true,
        canViewBackups: false,
        canCreateBackups: false
      }
    default:
      return {
        canViewAllEmployees: false,
        canEditAllEmployees: false,
        canCreateEmployees: false,
        canDeleteEmployees: false,
        canViewOwnPlanning: false,
        canEditOwnPlanning: false,
        canViewBackups: false,
        canCreateBackups: false
      }
  }
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions d'authentification
        login: async (credentials) => {
          set({ isLoading: true, error: null })
          
          try {
            if (credentials.pin) {
              // Connexion admin par PIN
              const response = await authService.login(credentials.pin)
              
              const user: User = {
                id: response.user_id,
                type: 'admin',
                name: response.user_name,
                token: response.access_token,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
              }
              
              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
              })
              
              return true
            } else if (credentials.employeeSlug) {
              // Connexion employé par slug
              const response = await authService.loginEmployee(credentials.employeeSlug)
              
              const user: User = {
                id: response.user_id,
                type: 'employee',
                name: response.user_name,
                slug: credentials.employeeSlug,
                token: response.access_token,
                expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() // 8 heures
              }
              
              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
              })
              
              return true
            }
            
            throw new Error('Identifiants manquants')
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
            set({ 
              isLoading: false, 
              error: errorMessage,
              user: null,
              isAuthenticated: false 
            })
            return false
          }
        },

        logout: () => {
          set({
            user: null,
            isAuthenticated: false,
            error: null
          })
        },

        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        // Utilitaires
        getPermissions: () => {
          const { user } = get()
          if (!user) return getPermissionsByRole('employee') // Permissions minimales
          return getPermissionsByRole(user.type)
        },

        isAdmin: () => {
          const { user } = get()
          return user?.type === 'admin'
        },

        isEmployee: () => {
          const { user } = get()
          return user?.type === 'employee'
        },

        canAccess: (resource: string) => {
          const permissions = get().getPermissions()
          
          switch (resource) {
            case 'employee-management':
              return permissions.canEditAllEmployees
            case 'all-plannings':
              return permissions.canViewAllEmployees
            case 'backups':
              return permissions.canViewBackups
            case 'own-planning':
              return permissions.canViewOwnPlanning
            default:
              return false
          }
        }
      }),
      {
        name: 'auth-store',
        // Persister seulement les données essentielles
        partialize: (state: AuthStore) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    {
      name: 'auth-store'
    }
  )
)
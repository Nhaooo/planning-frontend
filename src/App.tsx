import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from './components/Header'
import PlanningGrid from './components/PlanningGrid'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'
import ServerWakeupBanner from './components/ServerWakeupBanner'
import LoginModal from './components/LoginModal'
import EmployeeManagement from './components/EmployeeManagement'
import ProtectedRoute from './components/ProtectedRoute'
import ApiDiagnostic from './components/ApiDiagnostic'
import { usePlanningStore } from './store/planningStore'
import { useAuthStore } from './store/authStore'
import { employeeService } from './services/api'
import { Employee } from './types'
import './App.css'

function App() {
  const [showWakeupBanner, setShowWakeupBanner] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [currentView, setCurrentView] = useState<'planning' | 'employees'>('planning')
  
  const { selectedEmployeeId, setEmployees } = usePlanningStore()
  const { isAuthenticated, user, isAdmin } = useAuthStore()

  // Charger les employés seulement si authentifié
  const { data, isLoading, error } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: employeeService.getAll,
    enabled: isAuthenticated // Ne charger que si connecté
  })

  // Gérer les données et erreurs
  useEffect(() => {
    if (error) {
      setShowWakeupBanner(true)
    } else if (data) {
      setEmployees(data)
      setShowWakeupBanner(false)
    }
  }, [data, error, setEmployees])

  // Masquer la bannière après 10 secondes
  useEffect(() => {
    if (showWakeupBanner) {
      const timer = setTimeout(() => {
        setShowWakeupBanner(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [showWakeupBanner])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Erreur de connexion
          </h1>
          <p className="text-gray-600 mb-4">
            Impossible de se connecter au serveur. Veuillez vérifier votre connexion.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  // Afficher le modal de connexion si pas authentifié
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Planning Hebdomadaire
          </h1>
          <p className="text-gray-600 mb-8">
            Connectez-vous pour accéder à l'application
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="btn-primary text-lg px-8 py-3"
          >
            Se connecter
          </button>
        </div>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showWakeupBanner && <ServerWakeupBanner />}
      
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="container mx-auto px-4 py-6">
        {/* Vue Gestion des employés (Admin seulement) */}
        {currentView === 'employees' && (
          <ProtectedRoute requireAdmin={true}>
            <EmployeeManagement />
          </ProtectedRoute>
        )}

        {/* Vue Planning */}
        {currentView === 'planning' && (
          <ProtectedRoute requireAuth={true}>
            {selectedEmployeeId || (user?.type === 'employee' && user.slug) ? (
              <div className="flex flex-col xl:grid xl:grid-cols-4 gap-4 md:gap-6">
                <div className="xl:col-span-3 order-2 xl:order-1">
                  <PlanningGrid />
                </div>
                <div className="xl:col-span-1 order-1 xl:order-2">
                  <Sidebar />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  {isAdmin() ? 'Sélectionnez un employé pour commencer' : 'Chargement de votre planning...'}
                </h2>
                <p className="text-gray-500">
                  {isAdmin() 
                    ? 'Utilisez le sélecteur d\'employé dans l\'en-tête pour afficher un planning.'
                    : 'Votre planning personnel se charge...'
                  }
                </p>
              </div>
            )}
          </ProtectedRoute>
        )}
      </main>

      {/* Modal de connexion */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />

      {/* Diagnostic API (bouton rouge en bas à droite) */}
      <ApiDiagnostic />
    </div>
  )
}

export default App
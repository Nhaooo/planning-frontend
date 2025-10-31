import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Palette } from 'lucide-react'
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
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false)
  
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
              <div className="relative">
                {/* Layout Desktop */}
                <div className="hidden xl:grid xl:grid-cols-4 gap-6">
                  <div className="xl:col-span-3">
                    <PlanningGrid />
                  </div>
                  <div className="xl:col-span-1">
                    <Sidebar />
                  </div>
                </div>

                {/* Layout Mobile - Planning pleine largeur */}
                <div className="xl:hidden">
                  <PlanningGrid />
                </div>

                {/* Bouton flottant pour palette mobile */}
                <button
                  onClick={() => setIsMobilePaletteOpen(true)}
                  className="xl:hidden fixed bottom-20 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center z-40 transition-all duration-300 hover:scale-110 animate-pulse-float"
                  aria-label="Ouvrir la palette de blocs"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                    boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Palette className="h-7 w-7" />
                  
                  {/* Badge indicateur */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">!</span>
                  </div>
                </button>

                {/* Overlay palette mobile */}
                {isMobilePaletteOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="xl:hidden fixed inset-0 bg-black bg-opacity-50 z-50"
                      onClick={() => setIsMobilePaletteOpen(false)}
                    />
                    
                    {/* Palette flottante */}
                    <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[75vh] overflow-hidden animate-slide-up mobile-palette">
                      {/* Poignée de glissement */}
                      <div className="flex justify-center pt-3 pb-2">
                        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                      </div>
                      
                      <div className="px-6 pb-6">
                        {/* Header de la palette */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Palette className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Palette de blocs</h3>
                              <p className="text-sm text-gray-500">Glissez-déposez dans le planning</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setIsMobilePaletteOpen(false)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* Contenu de la sidebar dans la palette */}
                        <div className="overflow-y-auto max-h-[calc(75vh-140px)] -mx-2 px-2">
                          <Sidebar />
                        </div>
                      </div>
                    </div>
                  </>
                )}
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
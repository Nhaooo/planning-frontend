import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Header from './components/Header'
import PlanningGrid from './components/PlanningGrid'
import Sidebar from './components/Sidebar'
import LoadingSpinner from './components/LoadingSpinner'
import ServerWakeupBanner from './components/ServerWakeupBanner'
import { usePlanningStore } from './store/planningStore'
import { employeeService } from './services/api'
import './App.css'

function App() {
  const [showWakeupBanner, setShowWakeupBanner] = useState(false)
  const { selectedEmployeeId, setEmployees } = usePlanningStore()

  // Charger les employés au démarrage
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getAll,
    onError: () => {
      // Afficher la bannière de réveil du serveur si la première requête échoue
      setShowWakeupBanner(true)
    },
    onSuccess: (data) => {
      setEmployees(data)
      setShowWakeupBanner(false)
    }
  })

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

  return (
    <div className="min-h-screen bg-gray-50">
      {showWakeupBanner && <ServerWakeupBanner />}
      
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        {selectedEmployeeId ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <PlanningGrid />
            </div>
            <div className="lg:col-span-1">
              <Sidebar />
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Sélectionnez un employé pour commencer
            </h2>
            <p className="text-gray-500">
              Utilisez le sélecteur d'employé dans l'en-tête pour afficher un planning.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
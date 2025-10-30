import PlanningGrid from './components/PlanningGrid'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* En-tête simple */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">
                  📅 Planning Hebdomadaire
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Version Ultra-Simple
              </span>
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">P</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <PlanningGrid />
        </div>
      </main>

      {/* Pied de page */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Planning Ultra-Simple - Stockage Local - 
              <span className="text-green-600 font-medium"> Fonctionne TOUJOURS !</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
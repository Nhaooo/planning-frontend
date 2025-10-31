import { FC, useState } from 'react'
import { Calendar, Undo, Redo, Download, Copy, Users, Grid3X3, Menu, X } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { useAuthStore } from '../store/authStore'
import EmployeeSelector from './EmployeeSelector'
import WeekSelector from './WeekSelector'
import SaveIndicator from './SaveIndicator'
import UserInfo from './UserInfo'

interface HeaderProps {
  currentView: 'planning' | 'employees'
  onViewChange: (view: 'planning' | 'employees') => void
}

const Header: FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const { 
    selectedEmployeeId,
    selectedWeekKind,
    selectedVacationPeriod,
    undoStack,
    redoStack,
    undo,
    redo
  } = usePlanningStore()
  
  const { isAdmin } = useAuthStore()

  const handleDuplicateFromType = () => {
    // TODO: Implémenter la duplication depuis la semaine type
    console.log('Dupliquer depuis type')
  }

  const handleExport = () => {
    // TODO: Implémenter l'export
    console.log('Export')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-blue-600" />
            <div>
              <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">Planning Hebdomadaire</span>
                <span className="sm:hidden">Planning</span>
              </h1>
              <p className="text-xs text-gray-500 hidden lg:block">
                Gestion par quarts d'heure
              </p>
            </div>
          </div>

          {/* Menu hamburger mobile */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center space-x-4 xl:space-x-6">
            {/* Navigation des vues (Admin seulement) */}
            {isAdmin() && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('planning')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'planning'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span>Planning</span>
                </button>
                <button
                  onClick={() => onViewChange('employees')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'employees'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Employés</span>
                </button>
              </div>
            )}

            {/* Sélecteurs (seulement en vue planning) */}
            {currentView === 'planning' && (
              <div className="flex items-center space-x-4">
                <EmployeeSelector />
                <WeekSelector />
              </div>
            )}
          </div>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Undo/Redo (seulement en vue planning) */}
            {currentView === 'planning' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Annuler (Ctrl+Z)"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rétablir (Ctrl+Y)"
                >
                  <Redo className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Actions planning */}
            {currentView === 'planning' && selectedEmployeeId && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleDuplicateFromType}
                  className="btn-secondary text-sm"
                  title="Dupliquer depuis la semaine type"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="hidden xl:inline">Dupliquer</span>
                </button>
                
                <button
                  onClick={handleExport}
                  className="btn-secondary text-sm"
                  title="Exporter le planning"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span className="hidden xl:inline">Exporter</span>
                </button>
              </div>
            )}

            {/* Indicateur de sauvegarde (seulement en vue planning) */}
            {currentView === 'planning' && <SaveIndicator />}

            {/* Informations utilisateur */}
            <UserInfo />
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            {/* Navigation des vues (Admin seulement) */}
            {isAdmin() && (
              <div className="mb-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onViewChange('planning')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                      currentView === 'planning'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Planning</span>
                  </button>
                  <button
                    onClick={() => {
                      onViewChange('employees')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${
                      currentView === 'employees'
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Employés</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sélecteurs mobile */}
            {currentView === 'planning' && (
              <div className="space-y-3 mb-4">
                <EmployeeSelector />
                <WeekSelector />
              </div>
            )}

            {/* Actions mobile */}
            {currentView === 'planning' && (
              <div className="space-y-3">
                {/* Undo/Redo */}
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md text-sm disabled:opacity-50"
                  >
                    <Undo className="h-4 w-4" />
                    <span>Annuler</span>
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md text-sm disabled:opacity-50"
                  >
                    <Redo className="h-4 w-4" />
                    <span>Rétablir</span>
                  </button>
                </div>

                {/* Actions planning */}
                {selectedEmployeeId && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDuplicateFromType}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md text-sm flex-1 justify-center"
                    >
                      <Copy className="h-4 w-4" />
                      <span>Dupliquer</span>
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md text-sm flex-1 justify-center"
                    >
                      <Download className="h-4 w-4" />
                      <span>Exporter</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* User info mobile */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <UserInfo />
            </div>
          </div>
        )}

        {/* Informations contextuelles */}
        {selectedEmployeeId && (
          <div className="mt-3 text-sm text-gray-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div>
                Vue: <span className="font-medium">
                  {selectedWeekKind === 'type' && 'Semaine type'}
                  {selectedWeekKind === 'current' && 'Semaine actuelle'}
                  {selectedWeekKind === 'next' && 'Semaine suivante'}
                  {selectedWeekKind === 'vacation' && `Vacances ${selectedVacationPeriod}`}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 hidden lg:block">
                Utilisez Ctrl+Z/Y pour annuler/rétablir • Glissez-déposez pour déplacer les créneaux
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
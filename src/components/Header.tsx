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
    console.log('Dupliquer depuis type')
  }

  const handleExport = () => {
    console.log('Export')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3 md:py-4">
        {/* Header principal */}
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-600" />
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">Planning Hebdomadaire</span>
                <span className="sm:hidden">Planning</span>
              </h1>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                Gestion par quarts d'heure
              </p>
            </div>
          </div>

          {/* Menu burger mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Navigation desktop */}
          <div className="hidden sm:flex sm:items-center sm:gap-3 md:gap-6">
            {/* Navigation des vues (Admin seulement) */}
            {isAdmin() && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('planning')}
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
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
                  className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-3 py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
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
              <div className="flex items-center gap-4">
                <EmployeeSelector />
                <WeekSelector />
              </div>
            )}

            {/* Actions et indicateurs */}
            <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDuplicateFromType}
                    className="btn-secondary text-sm"
                    title="Dupliquer depuis la semaine type"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Dupliquer
                  </button>
                  
                  <button
                    onClick={handleExport}
                    className="btn-secondary text-sm"
                    title="Exporter le planning"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Exporter
                  </button>
                </div>
              )}

              {/* Indicateur de sauvegarde et utilisateur */}
              <div className="flex items-center gap-3">
                {currentView === 'planning' && <SaveIndicator />}
                <UserInfo />
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile (collapsible) */}
        {isMobileMenuOpen && (
          <div className="sm:hidden mt-3 border-t border-gray-200 pt-3 space-y-3">
            {/* Navigation des vues (Admin seulement) */}
            {isAdmin() && (
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    onViewChange('planning')
                    setIsMobileMenuOpen(false)
                  }}
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
                    currentView === 'planning'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
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
                  className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors flex-1 ${
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
              <div className="space-y-3">
                <EmployeeSelector />
                <WeekSelector />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              {/* Undo/Redo */}
              {currentView === 'planning' && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Annuler"
                  >
                    <Undo className="h-4 w-4" />
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Rétablir"
                  >
                    <Redo className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Utilisateur et sauvegarde */}
              <div className="flex items-center gap-3">
                {currentView === 'planning' && <SaveIndicator />}
                <UserInfo />
              </div>
            </div>

            {/* Actions planning */}
            {currentView === 'planning' && selectedEmployeeId && (
              <div className="flex gap-2">
                <button
                  onClick={handleDuplicateFromType}
                  className="btn-secondary text-sm flex-1"
                  title="Dupliquer depuis la semaine type"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Dupliquer
                </button>
                
                <button
                  onClick={handleExport}
                  className="btn-secondary text-sm flex-1"
                  title="Exporter le planning"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Exporter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Informations contextuelles */}
        {selectedEmployeeId && (
          <div className="mt-2 sm:mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-600">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span>
                Vue: <span className="font-medium">
                  {selectedWeekKind === 'type' && 'Semaine type'}
                  {selectedWeekKind === 'current' && 'Semaine actuelle'}
                  {selectedWeekKind === 'next' && 'Semaine suivante'}
                  {selectedWeekKind === 'vacation' && `Vacances ${selectedVacationPeriod}`}
                </span>
              </span>
            </div>
            
            <div className="text-xs text-gray-500 hidden md:block">
              Utilisez Ctrl+Z/Y pour annuler/rétablir • Glissez-déposez pour déplacer les créneaux
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
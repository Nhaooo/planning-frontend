import { FC, useState } from 'react'
import { Calendar, Undo, Redo, Users, Grid3X3, Menu, X } from 'lucide-react'
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
  const { 
    undoStack,
    redoStack,
    undo,
    redo
  } = usePlanningStore()
  
  const { isAdmin } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Logo et titre - toujours visible */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">
              <span className="hidden md:inline">Planning</span>
              <span className="md:hidden">Plan</span>
            </h1>
          </div>

          {/* Desktop: Navigation complète */}
          <div className="hidden xl:flex items-center space-x-4">
            {/* Navigation des vues */}
            {isAdmin() && (
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => onViewChange('planning')}
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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
                  className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
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

            {/* Sélecteurs */}
            {currentView === 'planning' && (
              <>
                <EmployeeSelector />
                <WeekSelector />
              </>
            )}
          </div>

          {/* Desktop: Actions */}
          <div className="hidden xl:flex items-center space-x-2">
            {currentView === 'planning' && (
              <>
                <button
                  onClick={undo}
                  disabled={undoStack.length === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Annuler"
                >
                  <Undo className="h-4 w-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                  title="Rétablir"
                >
                  <Redo className="h-4 w-4" />
                </button>
                <SaveIndicator />
              </>
            )}
            <UserInfo />
          </div>

          {/* Mobile: Menu burger */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="xl:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Menu mobile */}
        {isMenuOpen && (
          <div className="xl:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="space-y-4">
              {/* Navigation des vues */}
              {isAdmin() && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      onViewChange('planning')
                      setIsMenuOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium flex-1 justify-center ${
                      currentView === 'planning'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    <span>Planning</span>
                  </button>
                  <button
                    onClick={() => {
                      onViewChange('employees')
                      setIsMenuOpen(false)
                    }}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium flex-1 justify-center ${
                      currentView === 'employees'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Employés</span>
                  </button>
                </div>
              )}

              {/* Sélecteurs mobile */}
              {currentView === 'planning' && (
                <div className="space-y-3">
                  <EmployeeSelector />
                  <WeekSelector />
                </div>
              )}

              {/* Actions mobile */}
              {currentView === 'planning' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={undo}
                      disabled={undoStack.length === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Undo className="h-4 w-4" />
                    </button>
                    <button
                      onClick={redo}
                      disabled={redoStack.length === 0}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <Redo className="h-4 w-4" />
                    </button>
                  </div>
                  <SaveIndicator />
                </div>
              )}

              {/* User info mobile */}
              <UserInfo />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
import { FC } from 'react'
import { Calendar, Undo, Redo, Download, Copy } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import EmployeeSelector from './EmployeeSelector'
import WeekSelector from './WeekSelector'
import SaveIndicator from './SaveIndicator'

const Header: FC = () => {
  const { 
    selectedEmployeeId,
    selectedWeekKind,
    selectedVacationPeriod,
    undoStack,
    redoStack,
    undo,
    redo
  } = usePlanningStore()

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
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center space-x-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Planning Hebdomadaire
              </h1>
              <p className="text-sm text-gray-500">
                Gestion par quarts d'heure
              </p>
            </div>
          </div>

          {/* Sélecteurs centraux */}
          <div className="flex items-center space-x-4">
            <EmployeeSelector />
            <WeekSelector />
          </div>

          {/* Actions et indicateurs */}
          <div className="flex items-center space-x-3">
            {/* Undo/Redo */}
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

            {/* Actions */}
            {selectedEmployeeId && (
              <div className="flex items-center space-x-2">
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

            {/* Indicateur de sauvegarde */}
            <SaveIndicator />
          </div>
        </div>

        {/* Informations contextuelles */}
        {selectedEmployeeId && (
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                Vue: <span className="font-medium">
                  {selectedWeekKind === 'type' && 'Semaine type'}
                  {selectedWeekKind === 'current' && 'Semaine actuelle'}
                  {selectedWeekKind === 'next' && 'Semaine suivante'}
                  {selectedWeekKind === 'vacation' && `Vacances ${selectedVacationPeriod}`}
                </span>
              </span>
            </div>
            
            <div className="text-xs text-gray-500">
              Utilisez Ctrl+Z/Y pour annuler/rétablir • Glissez-déposez pour déplacer les créneaux
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
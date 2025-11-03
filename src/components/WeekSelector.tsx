import { FC, useState } from 'react'
import { Calendar, Palmtree, RotateCcw } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { WeekKind, VacationPeriod } from '../types'
import { WeekTemplateService } from '../services/weekTemplateService'

const WeekSelector: FC = () => {
  const {
    selectedWeekKind,
    selectedVacationPeriod,
    selectedWeekStart,
    selectedEmployeeId,
    currentWeek,
    setSelectedWeekKind,
    setSelectedVacationPeriod,
    setSelectedWeekStart,
    refreshWeek
  } = usePlanningStore()

  const [isResetting, setIsResetting] = useState(false)

  const weekKindOptions: { value: WeekKind; label: string; description: string }[] = [
    { 
      value: 'type', 
      label: 'Semaine type', 
      description: 'Modèle principal et persistant' 
    },
    { 
      value: 'current', 
      label: 'Semaine actuelle', 
      description: 'Copie modifiable de la semaine type' 
    },
    { 
      value: 'next', 
      label: 'Semaine suivante', 
      description: 'Prévision basée sur la semaine type' 
    },
    { 
      value: 'vacation', 
      label: 'Semaine vacances', 
      description: 'Période spéciale avec horaires adaptés' 
    }
  ]

  const vacationOptions: { value: VacationPeriod; label: string }[] = [
    { value: 'Toussaint', label: 'Toussaint' },
    { value: 'Noel', label: 'Noël' },
    { value: 'Paques', label: 'Pâques' },
    { value: 'Ete', label: 'Été' }
  ]

  const handleResetFromTemplate = async () => {
    if (!currentWeek?.week?.id || !selectedEmployeeId) {
      alert('Aucune semaine sélectionnée ou employé non défini')
      return
    }

    if (!confirm('Êtes-vous sûr de vouloir reprendre depuis la semaine type ? Toutes les modifications actuelles seront perdues.')) {
      return
    }

    setIsResetting(true)
    try {
      await WeekTemplateService.resetFromTemplate(currentWeek.week.id)
      // Rafraîchir la semaine après la remise à zéro
      await refreshWeek()
      alert('Semaine remise à zéro avec succès !')
    } catch (error) {
      console.error('Erreur lors de la remise à zéro:', error)
      alert('Erreur lors de la remise à zéro de la semaine')
    } finally {
      setIsResetting(false)
    }
  }

  // Afficher le bouton de remise à zéro seulement pour les semaines modifiables
  const canReset = selectedWeekKind !== 'type' && currentWeek?.week?.id

  return (
    <div className="flex items-center space-x-3 flex-wrap">
      {/* Sélecteur de type de semaine */}
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <select
          value={selectedWeekKind}
          onChange={(e) => setSelectedWeekKind(e.target.value as WeekKind)}
          className="form-select min-w-[150px]"
          title={weekKindOptions.find(opt => opt.value === selectedWeekKind)?.description}
        >
          {weekKindOptions.map((option) => (
            <option key={option.value} value={option.value} title={option.description}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sélecteur de période de vacances (conditionnel) */}
      {selectedWeekKind === 'vacation' && (
        <div className="flex items-center space-x-2">
          <Palmtree className="h-4 w-4 text-gray-500" />
          <select
            value={selectedVacationPeriod || ''}
            onChange={(e) => setSelectedVacationPeriod(e.target.value as VacationPeriod)}
            className="form-select min-w-[120px]"
          >
            <option value="">Période</option>
            {vacationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sélecteur de date (pour toutes les semaines sauf type) */}
      {selectedWeekKind !== 'type' && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Semaine du:</span>
          <input
            type="date"
            value={selectedWeekStart}
            onChange={(e) => setSelectedWeekStart(e.target.value)}
            className="form-input text-sm"
          />
        </div>
      )}

      {/* Bouton "Reprendre depuis la semaine type" */}
      {canReset && (
        <button
          onClick={handleResetFromTemplate}
          disabled={isResetting}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Remet à zéro cette semaine en reprenant la semaine type"
        >
          <RotateCcw className={`h-3 w-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Remise à zéro...' : 'Reprendre depuis type'}</span>
        </button>
      )}

      {/* Indicateur du type de semaine actuel */}
      <div className="text-xs text-gray-500 italic">
        {weekKindOptions.find(opt => opt.value === selectedWeekKind)?.description}
      </div>
    </div>
  )
}

export default WeekSelector
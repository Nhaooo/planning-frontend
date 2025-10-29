import { FC } from 'react'
import { Save, Check, AlertCircle, Loader } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'

const SaveIndicator: FC = () => {
  const { saveStatus } = usePlanningStore()

  const getIndicatorContent = () => {
    switch (saveStatus) {
      case 'saving':
        return {
          icon: <Loader className="h-4 w-4 animate-spin" />,
          text: 'Enregistrement...',
          className: 'save-indicator saving'
        }
      case 'saved':
        return {
          icon: <Check className="h-4 w-4" />,
          text: 'Enregistré',
          className: 'save-indicator saved'
        }
      case 'error':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Erreur',
          className: 'save-indicator error'
        }
      default:
        return {
          icon: <Save className="h-4 w-4" />,
          text: 'Prêt',
          className: 'save-indicator'
        }
    }
  }

  const { icon, text, className } = getIndicatorContent()

  return (
    <div className={className}>
      {icon}
      <span className="ml-1">{text}</span>
    </div>
  )
}

export default SaveIndicator
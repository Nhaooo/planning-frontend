import { FC } from 'react'
import { AlertCircle } from 'lucide-react'

const ServerWakeupBanner: FC = () => {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-700">
            <span className="font-medium">Réveil du serveur en cours...</span>
            {' '}Le serveur Render Free se réveille après une période d'inactivité. 
            Cela peut prendre quelques secondes.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ServerWakeupBanner
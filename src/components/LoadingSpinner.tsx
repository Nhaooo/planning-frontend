import { FC } from 'react'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const LoadingSpinner: FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  className 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
          sizeClasses[size]
        )}
        role="status"
        aria-label="Chargement en cours"
      >
        <span className="sr-only">Chargement...</span>
      </div>
    </div>
  )
}

export default LoadingSpinner
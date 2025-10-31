import { useState, useEffect, useRef, useCallback } from 'react'

interface FluidMetrics {
  pxPerMinute: number
  cellHeight: number
  cellWidth: number
  fontSize: number
  spacing: number
  touchTarget: number
  dragHandle: number
  containerWidth: number
  containerHeight: number
}

const calculateMetrics = (width: number, height: number): FluidMetrics => {
  // Calculs adaptatifs basés sur la taille du conteneur
  const pxPerMinute = Math.max(0.6, Math.min(1.6, width / 800))
  const cellHeight = Math.max(32, Math.min(64, height / 20))
  const cellWidth = Math.max(50, Math.min(120, width / 8))
  const fontSize = Math.max(12, Math.min(16, width / 80))
  const spacing = Math.max(4, Math.min(16, width / 100))
  const touchTarget = Math.max(44, Math.min(56, width / 20))
  const dragHandle = Math.max(8, Math.min(16, width / 80))

  return {
    pxPerMinute,
    cellHeight,
    cellWidth,
    fontSize,
    spacing,
    touchTarget,
    dragHandle,
    containerWidth: width,
    containerHeight: height
  }
}

export const useFluidMetrics = (containerRef: React.RefObject<HTMLElement>) => {
  const [metrics, setMetrics] = useState<FluidMetrics>({
    pxPerMinute: 1.2,
    cellHeight: 48,
    cellWidth: 80,
    fontSize: 14,
    spacing: 8,
    touchTarget: 48,
    dragHandle: 12,
    containerWidth: 800,
    containerHeight: 600
  })

  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  const updateMetrics = useCallback((entries: ResizeObserverEntry[]) => {
    if (entries.length === 0) return

    const entry = entries[0]
    const { width, height } = entry.contentRect
    
    const newMetrics = calculateMetrics(width, height)
    setMetrics(newMetrics)

    // Mettre à jour les variables CSS
    if (containerRef.current) {
      const root = containerRef.current
      root.style.setProperty('--px-per-minute', `${newMetrics.pxPerMinute}px`)
      root.style.setProperty('--cell-height', `${newMetrics.cellHeight}px`)
      root.style.setProperty('--cell-width', `${newMetrics.cellWidth}px`)
      root.style.setProperty('--font-size-base', `${newMetrics.fontSize}px`)
      root.style.setProperty('--spacing-md', `${newMetrics.spacing}px`)
      root.style.setProperty('--touch-target', `${newMetrics.touchTarget}px`)
      root.style.setProperty('--drag-handle', `${newMetrics.dragHandle}px`)
    }
  }, [containerRef])

  useEffect(() => {
    if (!containerRef.current) return

    // Créer le ResizeObserver
    resizeObserverRef.current = new ResizeObserver(updateMetrics)
    resizeObserverRef.current.observe(containerRef.current)

    // Calcul initial
    const rect = containerRef.current.getBoundingClientRect()
    updateMetrics([{
      contentRect: { width: rect.width, height: rect.height }
    } as ResizeObserverEntry])

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
    }
  }, [containerRef, updateMetrics])

  // Fonction pour convertir les minutes en pixels
  const minutesToPixels = useCallback((minutes: number) => {
    return minutes * metrics.pxPerMinute
  }, [metrics.pxPerMinute])

  // Fonction pour convertir les pixels en minutes
  const pixelsToMinutes = useCallback((pixels: number) => {
    return pixels / metrics.pxPerMinute
  }, [metrics.pxPerMinute])

  // Fonction de snap intelligent
  const snapToGrid = useCallback((minutes: number, stepMin: number = 15) => {
    return Math.round(minutes / stepMin) * stepMin
  }, [])

  return {
    metrics,
    minutesToPixels,
    pixelsToMinutes,
    snapToGrid,
    updateMetrics: () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        updateMetrics([{
          contentRect: { width: rect.width, height: rect.height }
        } as ResizeObserverEntry])
      }
    }
  }
}

export default useFluidMetrics
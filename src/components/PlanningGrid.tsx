import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { usePlanningStore } from '../store/planningStore'
import { simplePlanningApi, SimpleSlot, SimpleSlotUpdate } from '../services/simplePlanningApi'
import SlotModal from './SlotModal'
import { getCategoryColors, getSlotStyle, getCellBackgroundStyle } from '../utils/categoryColors'

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
const HOURS = Array.from({ length: 14 }, (_, i) => 7 + i) // 7h à 20h

// Utilitaires de conversion
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const getWeekStart = (date: Date): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

const addDaysToDate = (dateStr: string, days: number): string => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const PlanningGrid: React.FC = () => {
  const { 
    selectedEmployeeId, 
    selectedWeekKind, 
    selectedVacationPeriod,
    selectedWeekStart,
    setSelectedWeekStart 
  } = usePlanningStore()
  const queryClient = useQueryClient()
  
  const [selectedSlot, setSelectedSlot] = useState<SimpleSlot | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newSlotData, setNewSlotData] = useState<{ date: string; dayOfWeek: number; startTime: number } | null>(null)


  // Calculer la semaine à afficher selon le type sélectionné
  const getDisplayWeekStart = () => {
    switch (selectedWeekKind) {
      case 'type':
        return '2024-01-01' // Semaine type fixe
      case 'current':
        return selectedWeekStart || getWeekStart(new Date())
      case 'next':
        const nextWeek = new Date(selectedWeekStart || getWeekStart(new Date()))
        nextWeek.setDate(nextWeek.getDate() + 7)
        return getWeekStart(nextWeek)
      default:
        return selectedWeekStart || getWeekStart(new Date())
    }
  }

  const displayWeekStart = getDisplayWeekStart()

  console.log('🔄 PlanningGrid render - Employé:', selectedEmployeeId, 'Type:', selectedWeekKind, 'Semaine:', displayWeekStart)

  // Query pour récupérer le planning de la semaine
  const { data: weekPlanning, isLoading, error } = useQuery({
    queryKey: ['week-planning', selectedEmployeeId, selectedWeekKind, selectedVacationPeriod, displayWeekStart],
    queryFn: async () => {
      if (!selectedEmployeeId) {
        console.log('❌ Pas d\'employé sélectionné')
        return null
      }
      
      console.log('📡 Tentative de récupération planning:', { 
        employeeId: selectedEmployeeId, 
        weekStart: displayWeekStart,
        weekKind: selectedWeekKind,
        vacationPeriod: selectedVacationPeriod
      })
      
      try {
        const result = await simplePlanningApi.getWeekPlanning(selectedEmployeeId, displayWeekStart)
        console.log('✅ Planning récupéré avec succès:', result)
        return result
      } catch (err) {
         console.error('❌ Erreur lors de la récupération du planning:', err)
         console.error('❌ Détails de l\'erreur:', {
           message: err instanceof Error ? err.message : 'Erreur inconnue',
           status: (err as any)?.status,
           url: (err as any)?.url
         })
         throw err
       }
    },
    enabled: !!selectedEmployeeId,
    staleTime: 30000,
    retry: 1
  })

  console.log('📊 État de la query:', { 
    isLoading, 
    error: error?.message, 
    hasData: !!weekPlanning,
    dataLength: weekPlanning?.slots?.length 
  })

  // Mutations
  const createSlotMutation = useMutation({
    mutationFn: simplePlanningApi.createSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      setIsModalOpen(false)
      setNewSlotData(null)
      console.log('✅ Créneau créé avec succès')
    },
    onError: (error) => {
      console.error('❌ Erreur création créneau:', error)
      alert(`Erreur lors de la création: ${error.message}`)
    }
  })

  const updateSlotMutation = useMutation({
    mutationFn: ({ slotId, slotData }: { slotId: number; slotData: SimpleSlotUpdate }) => {
      console.log('🔄 Début mutation updateSlot:', { slotId, slotData })
      return simplePlanningApi.updateSlot(slotId, slotData)
    },
    onSuccess: (data) => {
      console.log('✅ Créneau modifié avec succès:', data)
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      setIsModalOpen(false)
      setSelectedSlot(null)
    },
    onError: (error) => {
      console.error('❌ Erreur modification créneau:', error)
      console.error('❌ Détails erreur:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`Erreur lors de la modification: ${error.message}`)
    }
  })

  const deleteSlotMutation = useMutation({
    mutationFn: simplePlanningApi.deleteSlot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week-planning'] })
      console.log('✅ Créneau supprimé avec succès')
    },
    onError: (error) => {
      console.error('❌ Erreur suppression créneau:', error)
      alert(`Erreur lors de la suppression: ${error.message}`)
    }
  })

  // Gestionnaires d'événements
  const handleCellClick = (dayIndex: number, hour: number) => {
    if (!selectedEmployeeId) return
    
    const date = addDaysToDate(displayWeekStart, dayIndex)
    const startTime = hour * 60 // Convertir l'heure en minutes
    
    console.log('🎯 Clic cellule:', { dayIndex, hour, date, startTime })
    
    setNewSlotData({ date, dayOfWeek: dayIndex, startTime })
    setSelectedSlot(null)
    setIsModalOpen(true)
  }

  // État pour tracker le type de drag en cours
  const [dragType, setDragType] = useState<'palette' | 'existing' | null>(null)
  


  // Gestionnaires drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Toujours autoriser le drop
    if (dragType === 'existing') {
      e.dataTransfer.dropEffect = 'move'
    } else {
      e.dataTransfer.dropEffect = 'copy'
    }
    
    // Ajouter une classe pour le feedback visuel
    const target = e.currentTarget as HTMLElement
    target.classList.add('drag-over')
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement
    target.classList.remove('drag-over')
  }

  const handleDrop = (e: React.DragEvent, dayIndex: number, hour: number) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🎯 Drop détecté sur:', { dayIndex, hour })
    
    // Nettoyer le feedback visuel
    const target = e.currentTarget as HTMLElement
    target.classList.remove('drag-over')
    
    if (!selectedEmployeeId) {
      console.log('❌ Pas d\'employé sélectionné')
      return
    }
    
    try {
      const draggedData = JSON.parse(e.dataTransfer.getData('application/json'))
      const date = addDaysToDate(displayWeekStart, dayIndex)
      const startTime = hour * 60
      
      console.log('📦 Données draggées:', draggedData)
      
      if (draggedData.isExistingSlot) {
        // Déplacement d'un créneau existant
        const duration = draggedData.end_time - draggedData.start_time
        const endTime = startTime + duration
        
        console.log('🎯 Déplacement créneau:', { 
          draggedData, 
          dayIndex, 
          hour, 
          date, 
          startTime, 
          endTime,
          selectedEmployeeId,
          employeeIdType: typeof selectedEmployeeId
        })
        
        const updateData = {
          employee_id: Number(selectedEmployeeId),
          date: date,
          day_of_week: dayIndex,
          start_time: startTime,
          end_time: endTime,
          title: draggedData.title,
          category: draggedData.category,
          comment: draggedData.comment || ''
        }
        
        console.log('📝 Données de mise à jour:', updateData)
        
        // Solution optimisée : créer d'abord (duplication), supprimer après
        // Effet visuel instantané : le créneau apparaît immédiatement à la nouvelle position
        console.log('🔄 Duplication instantanée puis suppression...')
        
        // D'abord créer le nouveau créneau (duplication instantanée)
        createSlotMutation.mutate({
          employee_id: Number(selectedEmployeeId),
          date: date,
          day_of_week: dayIndex,
          start_time: startTime,
          end_time: endTime,
          title: draggedData.title,
          category: draggedData.category,
          comment: draggedData.comment || ''
        }, {
          onSuccess: () => {
            console.log('✅ Nouveau créneau créé, suppression de l\'ancien...')
            // Puis supprimer l'ancien créneau avec un petit délai pour l'effet visuel
            setTimeout(() => {
              deleteSlotMutation.mutate(draggedData.id, {
                onError: (error) => {
                  console.error('❌ Erreur suppression ancien créneau:', error)
                  // Pas d'alerte ici car le nouveau créneau est déjà créé
                }
              })
            }, 0) // 100ms de délai pour l'effet visuel
          },
          onError: (error) => {
            console.error('❌ Erreur création nouveau créneau:', error)
            alert('Erreur lors du déplacement du créneau')
          }
        })
      } else {
        // Création d'un nouveau créneau depuis la palette
        const endTime = startTime + draggedData.defaultDuration
        
        console.log('🎯 Création créneau:', { draggedData, dayIndex, hour, date, startTime, endTime })
        
        // Créer directement le créneau
        createSlotMutation.mutate({
          employee_id: selectedEmployeeId,
          date: date,
          day_of_week: dayIndex,
          start_time: startTime,
          end_time: endTime,
          title: draggedData.title,
          category: draggedData.category,
          comment: draggedData.description || ''
        })
      }
    } catch (error) {
      console.error('Erreur lors du drop:', error)
    }
     }

  // Gestionnaires drag & drop pour les créneaux existants
  const handleSlotDragStart = (e: React.DragEvent, slot: SimpleSlot) => {
    e.stopPropagation()
    
    console.log('🎯 Début drag créneau existant:', slot)
    setDragType('existing')
    
    // Stocker les données du créneau pour le déplacement
    const slotData = {
      ...slot,
      isExistingSlot: true
    }
    
    e.dataTransfer.setData('application/json', JSON.stringify(slotData))
    e.dataTransfer.effectAllowed = 'move'
    
    // Ajouter une classe pour l'animation
    const target = e.target as HTMLElement
    target.classList.add('dragging')
  }

  const handleSlotDragEnd = (e: React.DragEvent) => {
    console.log('🎯 Fin drag créneau')
    setDragType(null)
    
    const target = e.target as HTMLElement
    target.classList.remove('dragging')
  }

  // ÉTIREMENT AVEC POINTEREVENTS - ADAPTÉ À NOTRE STRUCTURE
  const [resizingSlot, setResizingSlot] = useState<SimpleSlot | null>(null)
  const [tempStartTime, setTempStartTime] = useState<number>(0)
  const [tempEndTime, setTempEndTime] = useState<number>(0)
  const [horizontalPreviewDays, setHorizontalPreviewDays] = useState<number>(0)
  
  const draggingRef = useRef<{
    kind: "resize-start" | "resize-end" | "resize-horizontal"
    startAt: number
    endAt: number
    pointerStartY: number
    pointerStartX: number
  } | null>(null)

  // Constantes de configuration
  const PX_PER_MIN = 1.6
  const STEP_MIN = 60
  const MIN_DURATION = 60

  const snap = (m: number) => Math.round(m / STEP_MIN) * STEP_MIN
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
  
  // Fonction pour obtenir l'index du jour à partir d'une date
  const getDayIndex = (dateStr: string) => {
    const slotDate = new Date(dateStr)
    const startDate = new Date(displayWeekStart)
    const diffTime = slotDate.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Au clic sur la poignée
  const onPointerDown = (slot: SimpleSlot, kind: "resize-start" | "resize-end" | "resize-horizontal") => (e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    
    console.log('🎯 Début étirement PointerEvent:', { slot, kind })
    
    setResizingSlot(slot)
    setTempStartTime(slot.start_time)
    setTempEndTime(slot.end_time)
    
    draggingRef.current = {
      kind,
      startAt: slot.start_time,
      endAt: slot.end_time,
      pointerStartY: e.clientY,
      pointerStartX: e.clientX,
    }
  }

  // Pendant le drag
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !resizingSlot) return

    const { kind, startAt, endAt, pointerStartY, pointerStartX } = draggingRef.current

    if (kind === "resize-horizontal") {
      // Étirement horizontal : mise à jour du preview
      const deltaX = e.clientX - pointerStartX
      const deltaDays = Math.max(0, Math.round(deltaX / 200)) // 200px par jour approximativement
      setHorizontalPreviewDays(deltaDays)
      console.log('📏 Étirement horizontal:', { deltaX, deltaDays })
    } else {
      // Étirement vertical
      const deltaMin = (e.clientY - pointerStartY) / PX_PER_MIN
      const delta = snap(deltaMin)

      if (kind === "resize-start") {
        let next = clamp(startAt + delta, 0, endAt - MIN_DURATION)
        setTempStartTime(next)
      } else {
        let next = clamp(endAt + delta, startAt + MIN_DURATION, 24 * 60)
        setTempEndTime(next)
      }
    }
  }

  // À la fin du drag
  const onPointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current || !resizingSlot) return
    
    const { kind, pointerStartX } = draggingRef.current
    
    if (kind === "resize-horizontal") {
      // Étirement horizontal : créer des blocs séparés sur plusieurs jours
      const deltaX = e.clientX - pointerStartX
      const deltaDays = Math.round(deltaX / 200) // 200px par jour
      
      if (deltaDays > 0) {
        const numDays = Math.min(6, deltaDays) // Maximum 6 jours supplémentaires
        
        console.log('✅ Création blocs sur', numDays + 1, 'jours')
        
        // Créer des créneaux séparés sur les jours suivants
        for (let i = 1; i <= numDays; i++) {
          const newDate = new Date(resizingSlot.date)
          newDate.setDate(newDate.getDate() + i)
          
          createSlotMutation.mutate({
            employee_id: Number(selectedEmployeeId),
            date: newDate.toISOString().split('T')[0],
            day_of_week: (resizingSlot.day_of_week + i) % 7,
            start_time: resizingSlot.start_time,
            end_time: resizingSlot.end_time,
            title: resizingSlot.title,
            category: resizingSlot.category,
            comment: resizingSlot.comment || ''
          })
        }
      }
    } else {
      // Étirement vertical : mise à jour de la durée
      const finalStartTime = snap(tempStartTime)
      const finalEndTime = snap(tempEndTime)
      
      console.log('✅ Fin étirement vertical, mise à jour:', { 
        slotId: resizingSlot.id, 
        start_time: finalStartTime, 
        end_time: finalEndTime 
      })
      
      // Mise à jour via API
      updateSlotMutation.mutate({
        slotId: resizingSlot.id,
        slotData: {
          start_time: finalStartTime,
          end_time: finalEndTime
        }
      })
    }
    
    // Nettoyage
    draggingRef.current = null
    setResizingSlot(null)
    setTempStartTime(0)
    setTempEndTime(0)
    setHorizontalPreviewDays(0)
  }

     const handleSlotClick = (slot: SimpleSlot) => {
      // Empêcher l'ouverture du modal pendant l'étirement
      if (resizingSlot) return
      
      console.log('🎯 Clic créneau:', slot)
      setSelectedSlot(slot)
      setIsModalOpen(true)
    }

  const handleDeleteSlot = (slotId: number, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
      deleteSlotMutation.mutate(slotId)
    }
  }

  const handleSaveSlot = (slotData: any) => {
    if (!selectedEmployeeId) return

    if (selectedSlot) {
      // Modification
      updateSlotMutation.mutate({
        slotId: selectedSlot.id,
        slotData: {
          title: slotData.title,
          category: slotData.category,
          comment: slotData.comment,
          start_time: timeToMinutes(slotData.startTime),
          end_time: timeToMinutes(slotData.endTime)
        }
      })
    } else if (newSlotData) {
      // Création
      createSlotMutation.mutate({
        employee_id: selectedEmployeeId,
        date: newSlotData.date,
        day_of_week: newSlotData.dayOfWeek,
        start_time: timeToMinutes(slotData.startTime),
        end_time: timeToMinutes(slotData.endTime),
        title: slotData.title,
        category: slotData.category,
        comment: slotData.comment || ''
      })
    }
  }

  // Fonction pour obtenir les créneaux d'un jour spécifique
  const getSlotsForDay = (dayIndex: number): SimpleSlot[] => {
    if (!weekPlanning?.slots) return []
    
    const dayDate = addDaysToDate(displayWeekStart, dayIndex)
    return weekPlanning.slots.filter(slot => slot.date === dayDate)
  }

  // Fonction pour vérifier si une cellule a un créneau
  const getSlotAtTime = (dayIndex: number, hour: number): SimpleSlot | null => {
    const slots = getSlotsForDay(dayIndex)
    const timeInMinutes = hour * 60
    
    return slots.find(slot => 
      slot.start_time <= timeInMinutes && slot.end_time > timeInMinutes
    ) || null
  }

  // Fonction pour vérifier si c'est la première cellule d'un créneau
  const isSlotStart = (slot: SimpleSlot, hour: number): boolean => {
    const hourStart = hour * 60
    return slot.start_time >= hourStart && slot.start_time < hourStart + 60
  }

  // Fonction pour calculer la hauteur d'un créneau en cellules
  const getSlotHeight = (slot: SimpleSlot): number => {
    const durationInMinutes = slot.end_time - slot.start_time
    
    // Pour les créneaux de moins de 60 minutes, on ajuste visuellement
    if (durationInMinutes < 60) {
      return durationInMinutes / 60 // 0.5 pour 30min, 0.75 pour 45min
    }
    
    const durationInHours = durationInMinutes / 60
    return Math.max(1, Math.ceil(durationInHours))
  }

  // Navigation semaine
  const goToPreviousWeek = () => {
    if (selectedWeekKind !== 'type') {
      const prevWeek = new Date(displayWeekStart)
      prevWeek.setDate(prevWeek.getDate() - 7)
      setSelectedWeekStart(getWeekStart(prevWeek))
    }
  }

  const goToNextWeek = () => {
    if (selectedWeekKind !== 'type') {
      const nextWeek = new Date(displayWeekStart)
      nextWeek.setDate(nextWeek.getDate() + 7)
      setSelectedWeekStart(getWeekStart(nextWeek))
    }
  }

  const goToCurrentWeek = () => {
    setSelectedWeekStart(getWeekStart(new Date()))
  }



  if (!selectedEmployeeId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun employé sélectionné</h3>
          <p className="text-gray-500">Sélectionnez un employé pour voir son planning</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement du planning...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Erreur de chargement</h3>
          <p className="text-red-600">Impossible de charger le planning</p>
          <button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['week-planning'] })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Navigation semaine responsive */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow header-responsive">
        <button 
          onClick={goToPreviousWeek}
          className="btn-secondary touch-target"
          style={{ touchAction: 'manipulation' }}
          aria-label="Semaine précédente"
        >
          <span className="hidden sm:inline">← Semaine précédente</span>
          <span className="sm:hidden">←</span>
        </button>
        
        <div className="text-center flex-1 spacing-fluid-sm">
          <h2 className="text-fluid-lg font-semibold">
            {selectedWeekKind === 'type' && 'Semaine type'}
            {selectedWeekKind === 'current' && (
              <>
                <span className="hidden md:inline">Semaine actuelle - </span>
                {new Date(displayWeekStart).toLocaleDateString('fr-FR')}
              </>
            )}
            {selectedWeekKind === 'next' && (
              <>
                <span className="hidden md:inline">Semaine suivante - </span>
                {new Date(displayWeekStart).toLocaleDateString('fr-FR')}
              </>
            )}
            {selectedWeekKind === 'vacation' && (
              <>
                <span className="hidden md:inline">Vacances {selectedVacationPeriod} - </span>
                {new Date(displayWeekStart).toLocaleDateString('fr-FR')}
              </>
            )}
          </h2>
          <button 
            onClick={goToCurrentWeek}
            className="text-fluid-sm text-blue-600 hover:text-blue-800 touch-target"
            style={{ touchAction: 'manipulation' }}
            aria-label="Aller à cette semaine"
          >
            <span className="hidden sm:inline">Aller à cette semaine</span>
            <span className="sm:hidden">Aujourd'hui</span>
          </button>
        </div>
        
        <button 
          onClick={goToNextWeek}
          className="btn-secondary touch-target"
          style={{ touchAction: 'manipulation' }}
          aria-label="Semaine suivante"
        >
          <span className="hidden sm:inline">Semaine suivante →</span>
          <span className="sm:hidden">→</span>
        </button>
      </div>

      {/* Grille de planning responsive */}
      <div className="bg-white rounded-lg shadow overflow-hidden main-container">
        <div className="planning-grid-modern">
          {/* En-tête avec les jours responsive */}
          <div className="planning-time-cell bg-gray-50 border-b">
            <span className="text-fluid-sm font-medium">Heures</span>
          </div>
          {DAYS.map((day, index) => (
            <div key={day} className="planning-time-cell bg-gray-50 border-b">
              <div className="text-center">
                <span className="text-fluid-sm font-medium">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </span>
                <div className="text-fluid-xs text-gray-500 mt-1">
                  {new Date(addDaysToDate(displayWeekStart, index)).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          ))}

          {/* Lignes d'heures responsives */}
          {HOURS.map(hour => (
            <React.Fragment key={hour}>
              {/* Colonne des heures responsive */}
              <div className="planning-time-cell bg-gray-50 border-b border-r">
                <span className="text-fluid-sm font-medium">
                  <span className="hidden sm:inline">{hour}:00</span>
                  <span className="sm:hidden">{hour}h</span>
                </span>
              </div>
              
              {/* Cellules pour chaque jour */}
              {DAYS.map((_, dayIndex) => {
                const slot = getSlotAtTime(dayIndex, hour)
                const shouldShowSlot = slot && isSlotStart(slot, hour)
                // Utiliser les temps temporaires pendant l'étirement pour feedback visuel
                  const isBeingResized = slot && resizingSlot?.id === slot.id
                  const isHorizontalResize = isBeingResized && draggingRef.current?.kind === "resize-horizontal"
                  
                  // Preview horizontal : afficher les futurs blocs
                  const isHorizontalPreview = resizingSlot && !slot && horizontalPreviewDays > 0 && 
                    draggingRef.current?.kind === "resize-horizontal" &&
                    dayIndex > getDayIndex(resizingSlot.date) && 
                    dayIndex <= getDayIndex(resizingSlot.date) + horizontalPreviewDays &&
                    hour === resizingSlot.start_time // Seulement au début du slot
                  const displayStartTime = isBeingResized ? tempStartTime : (slot?.start_time || 0)
                  const displayEndTime = isBeingResized ? tempEndTime : (slot?.end_time || 0)
                  const displaySlot = slot ? { ...slot, start_time: displayStartTime, end_time: displayEndTime } : null
                  const slotHeight = displaySlot ? getSlotHeight(displaySlot) : 1
                
                return (
                  <div 
                    key={`${hour}-${dayIndex}`}
                    className={`
                      relative border-b border-r cursor-pointer transition-colors touch-target
                      ${slot ? '' : 'hover:bg-gray-50'}
                    `}
                    style={{
                      ...(slot ? getCellBackgroundStyle(slot.category) : {}),
                      height: 'var(--cell-height)',
                      minHeight: 'var(--cell-height)',
                      touchAction: 'manipulation'
                    }}
                    onClick={() => {
                      if (resizingSlot) return // Empêcher clic pendant étirement
                      slot ? handleSlotClick(slot) : handleCellClick(dayIndex, hour)
                    }}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, dayIndex, hour)}
                  >
                    {shouldShowSlot ? (
                      <div 
                        className={`absolute inset-1 text-white rounded p-1 text-xs overflow-hidden z-10 cursor-move slot-container ${
                          isBeingResized ? (isHorizontalResize ? 'slot-resizing-horizontal' : 'slot-resizing') : ''
                        }`}
                        style={{
                          ...getSlotStyle(slot.category),
                          height: `${slotHeight * 64 - 8}px`, // 64px par cellule - 8px pour les marges
                          minHeight: slotHeight < 1 ? `${slotHeight * 64 - 8}px` : '56px'
                        }}
                        draggable={!resizingSlot}
                        onDragStart={(e) => handleSlotDragStart(e, slot)}
                        onDragEnd={handleSlotDragEnd}
                        onPointerMove={onPointerMove}
                        onPointerUp={(e) => onPointerUp(e)}
                        onClick={(e) => {
                          if (resizingSlot) {
                            e.preventDefault()
                            e.stopPropagation()
                            return
                          }
                        }}
                      >
                        <div className="font-medium truncate">{slot.title}</div>
                        <div className={`opacity-80 ${isBeingResized ? (isHorizontalResize ? 'font-bold text-green-200' : 'font-bold text-blue-200') : ''}`}>
                          {minutesToTime(displayStartTime)} - {minutesToTime(displayEndTime)}
                          {isBeingResized && !isHorizontalResize && (
                            <span className="ml-1 text-blue-100">
                              ({Math.round((displayEndTime - displayStartTime) / 60 * 10) / 10}h)
                            </span>
                          )}
                          {isHorizontalResize && (
                            <span className="ml-1 text-green-100 animate-pulse">
                              → Plusieurs jours
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {getCategoryColors(slot.category).name}
                        </div>
                        
                        {/* Bouton de suppression optimisé tactile */}
                        <button
                          onClick={(e) => handleDeleteSlot(slot.id, e)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center touch-target"
                          style={{
                            minWidth: 'var(--touch-target)',
                            minHeight: 'var(--touch-target)',
                            width: 'clamp(20px, 4vw, 32px)',
                            height: 'clamp(20px, 4vw, 32px)',
                            touchAction: 'manipulation'
                          }}
                          aria-label="Supprimer le créneau"
                        >
                          <Trash2 size={12} />
                        </button>
                        
                        {/* Handles d'étirement optimisés pour tactile */}
                        <div 
                          className="resize-handle resize-handle-vertical resize-handle-bottom touch-target"
                          onPointerDown={onPointerDown(slot, "resize-end")}
                          onPointerMove={onPointerMove}
                          onPointerUp={(e) => onPointerUp(e)}
                          style={{ 
                            touchAction: 'none', 
                            userSelect: 'none',
                            cursor: 'ns-resize',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none'
                          }}
                          title="Glisser pour changer la durée"
                          aria-label="Redimensionner verticalement"
                        ></div>
                        <div 
                          className="resize-handle resize-handle-horizontal resize-handle-right touch-target"
                          onPointerDown={onPointerDown(slot, "resize-horizontal")}
                          onPointerMove={onPointerMove}
                          onPointerUp={(e) => onPointerUp(e)}
                          style={{ 
                            touchAction: 'none', 
                            userSelect: 'none',
                            cursor: 'ew-resize',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none'
                          }}
                          title="Glisser pour étaler sur plusieurs jours"
                          aria-label="Redimensionner horizontalement"
                        ></div>
                      </div>
                    ) : isHorizontalPreview ? (
                        // Preview horizontal : bloc fantôme
                        <div 
                          className="absolute inset-1 rounded p-1 text-xs overflow-hidden z-5 pointer-events-none"
                          style={{
                            ...getSlotStyle(resizingSlot.category),
                            opacity: 0.5,
                            border: '2px dashed rgba(34, 197, 94, 0.8)',
                            background: `${getSlotStyle(resizingSlot.category).backgroundColor}80`, // 50% opacity
                            height: `${getSlotHeight(resizingSlot) * 64 - 8}px`,
                          }}
                        >
                          <div className="font-medium truncate text-green-100">{resizingSlot.title}</div>
                          <div className="text-xs opacity-75 text-green-200">
                            {minutesToTime(resizingSlot.start_time)} - {minutesToTime(resizingSlot.end_time)}
                          </div>
                          <div className="text-xs opacity-75 text-green-200 animate-pulse">
                            Preview
                          </div>
                        </div>
                      ) : !slot ? (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Plus size={16} className="text-gray-400" />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
        </div>
      </div>



      {/* Modal */}
      {isModalOpen && (
        <SlotModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedSlot(null)
            setNewSlotData(null)
          }}
          onSave={handleSaveSlot}
          slot={selectedSlot}
          defaultStartTime={newSlotData ? minutesToTime(newSlotData.startTime) : undefined}
          isLoading={createSlotMutation.isPending || updateSlotMutation.isPending}
        />
      )}
    </div>
  )
}

export default PlanningGrid
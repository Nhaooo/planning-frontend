import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import dayjs from 'dayjs'
import { PlanningState } from '../types'

const getMonday = (date: Date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajuster pour que lundi soit le premier jour
  return new Date(d.setDate(diff))
}

export const usePlanningStore = create<PlanningState>()(
  devtools(
    (set, get) => ({
      // État initial
      employees: [],
      currentWeek: undefined,
      legend: {},
      
      selectedEmployeeId: undefined,
      selectedWeekKind: 'current',
      selectedVacationPeriod: undefined,
      selectedWeekStart: dayjs(getMonday()).format('YYYY-MM-DD'),
      
      isLoading: false,
      saveStatus: 'idle',
      undoStack: [],
      redoStack: [],
      
      // Actions de base
      setEmployees: (employees) => set({ employees }),
      
      setSelectedEmployee: (employeeId) => set({ 
        selectedEmployeeId: employeeId,
        currentWeek: undefined // Reset la semaine courante
      }),
      
      setSelectedWeekKind: (kind) => set({ 
        selectedWeekKind: kind,
        selectedVacationPeriod: kind === 'vacation' ? get().selectedVacationPeriod || 'Toussaint' : undefined
      }),
      
      setSelectedVacationPeriod: (period) => set({ selectedVacationPeriod: period }),
      
      setSelectedWeekStart: (date) => set({ selectedWeekStart: date }),
      
      setCurrentWeek: (week) => set({ currentWeek: week }),
      
      setLegend: (legend) => set({ legend }),
      
      setSaveStatus: (status) => {
        set({ saveStatus: status })
        
        // Auto-reset du statut après 3 secondes
        if (status === 'saved' || status === 'error') {
          setTimeout(() => {
            const currentStatus = get().saveStatus
            if (currentStatus === status) {
              set({ saveStatus: 'idle' })
            }
          }, 3000)
        }
      },
      
      // Gestion Undo/Redo
      pushToUndoStack: (state) => {
        const { undoStack, redoStack } = get()
        const newUndoStack = [...undoStack, state].slice(-10) // Garder max 10 niveaux
        
        set({
          undoStack: newUndoStack,
          redoStack: [] // Clear redo stack when new action is performed
        })
      },
      
      undo: () => {
        const { undoStack, redoStack, currentWeek } = get()
        
        if (undoStack.length === 0) return
        
        const previousState = undoStack[undoStack.length - 1]
        const newUndoStack = undoStack.slice(0, -1)
        const newRedoStack = currentWeek ? [...redoStack, currentWeek] : redoStack
        
        set({
          currentWeek: previousState,
          undoStack: newUndoStack,
          redoStack: newRedoStack
        })
      },
      
      redo: () => {
        const { undoStack, redoStack, currentWeek } = get()
        
        if (redoStack.length === 0) return
        
        const nextState = redoStack[redoStack.length - 1]
        const newRedoStack = redoStack.slice(0, -1)
        const newUndoStack = currentWeek ? [...undoStack, currentWeek] : undoStack
        
        set({
          currentWeek: nextState,
          undoStack: newUndoStack,
          redoStack: newRedoStack
        })
      },
      
      clearUndoRedo: () => set({ undoStack: [], redoStack: [] })
    }),
    {
      name: 'planning-store',
      // Ne pas persister les données sensibles
      partialize: (state) => ({
        selectedWeekKind: state.selectedWeekKind,
        selectedVacationPeriod: state.selectedVacationPeriod,
        selectedWeekStart: state.selectedWeekStart,
        selectedEmployeeId: state.selectedEmployeeId
      })
    }
  )
)
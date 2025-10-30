import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Types ultra-simples
export interface SimpleSlot {
  id: string
  employeeId: number
  day: number // 0-6 (Lundi-Dimanche)
  startHour: number // 9-22
  startMinute: number // 0, 15, 30, 45
  durationMinutes: number // 15, 30, 45, 60, etc.
  title: string
  category: string
  comment?: string
  color: string
}

export interface SimpleEmployee {
  id: number
  name: string
  active: boolean
}

interface PlanningState {
  // Données
  employees: SimpleEmployee[]
  slots: SimpleSlot[]
  
  // État UI
  selectedEmployeeId: number | null
  selectedWeek: string // Format YYYY-MM-DD (lundi)
  
  // Actions
  setSelectedEmployee: (id: number | null) => void
  setSelectedWeek: (week: string) => void
  
  // Gestion employés
  addEmployee: (name: string) => void
  removeEmployee: (id: number) => void
  
  // Gestion créneaux
  addSlot: (slot: Omit<SimpleSlot, 'id' | 'color'>) => void
  updateSlot: (id: string, updates: Partial<SimpleSlot>) => void
  removeSlot: (id: string) => void
  getSlotsForEmployee: (employeeId: number, week: string) => SimpleSlot[]
  
  // Utilitaires
  initializeDefaultData: () => void
}

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, string> = {
  'admin': '#3B82F6', // Bleu
  'prestation': '#10B981', // Vert
  'ecole': '#F59E0B', // Orange
  'competition': '#EF4444', // Rouge
  'ouverture': '#8B5CF6', // Violet
  'loisir': '#06B6D4', // Cyan
  'rangement': '#6B7280', // Gris
  'sante': '#EC4899' // Rose
}

// Fonction pour générer un ID unique
const generateId = () => `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Fonction pour obtenir le lundi d'une semaine
const getMondayOfWeek = (date: Date = new Date()): string => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export const usePlanningStore = create<PlanningState>()(
  persist(
    (set, get) => ({
      // État initial
      employees: [],
      slots: [],
      selectedEmployeeId: null,
      selectedWeek: getMondayOfWeek(),
      
      // Actions UI
      setSelectedEmployee: (id) => set({ selectedEmployeeId: id }),
      setSelectedWeek: (week) => set({ selectedWeek: week }),
      
      // Gestion employés
      addEmployee: (name) => {
        const employees = get().employees
        const newId = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1
        const newEmployee: SimpleEmployee = {
          id: newId,
          name,
          active: true
        }
        set({ employees: [...employees, newEmployee] })
      },
      
      removeEmployee: (id) => {
        set(state => ({
          employees: state.employees.filter(e => e.id !== id),
          selectedEmployeeId: state.selectedEmployeeId === id ? null : state.selectedEmployeeId
        }))
      },
      
      // Gestion créneaux
      addSlot: (slotData) => {
        const newSlot: SimpleSlot = {
          ...slotData,
          id: generateId(),
          color: CATEGORY_COLORS[slotData.category] || '#6B7280'
        }
        set(state => ({ slots: [...state.slots, newSlot] }))
      },
      
      updateSlot: (id, updates) => {
        set(state => ({
          slots: state.slots.map(slot => 
            slot.id === id 
              ? { 
                  ...slot, 
                  ...updates,
                  color: updates.category ? CATEGORY_COLORS[updates.category] || slot.color : slot.color
                }
              : slot
          )
        }))
      },
      
      removeSlot: (id) => {
        set(state => ({ slots: state.slots.filter(slot => slot.id !== id) }))
      },
      
      getSlotsForEmployee: (employeeId, _week) => {
        return get().slots.filter(slot => 
          slot.employeeId === employeeId && 
          // Pour simplifier, on ne filtre pas par semaine pour l'instant
          true
        )
      },
      
      // Initialisation avec des données par défaut
      initializeDefaultData: () => {
        const state = get()
        if (state.employees.length === 0) {
          console.log('🚀 Initialisation des données par défaut...')
          
          // Ajouter des employés par défaut
          const defaultEmployees: SimpleEmployee[] = [
            { id: 1, name: 'Noah Jamet', active: true },
            { id: 2, name: 'Marie Dupont', active: true },
            { id: 3, name: 'Pierre Martin', active: true }
          ]
          
          set({ employees: defaultEmployees, selectedEmployeeId: 1 })
          console.log('✅ Données par défaut initialisées')
        }
      }
    }),
    {
      name: 'planning-storage',
      version: 1
    }
  )
)
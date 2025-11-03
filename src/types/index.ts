// Types pour l'API et l'application

export interface Employee {
  id: number
  slug: string
  fullname: string
  active: boolean
}

export interface Slot {
  id: number
  week_id: number
  day_index: number // 0=Monday, 6=Sunday
  start_min: number // Minutes since 00:00
  duration_min: number // Duration in minutes, multiple of 15
  title: string
  category: CategoryCode
  comment?: string
}

export interface Week {
  id: number
  employee_id: number
  kind_id: number
  vacation_id?: number
  week_start_date: string // ISO date string
  meta: Record<string, any>
}

export interface Note {
  id: number
  week_id: number
  hours_total?: number
  comments?: string
  last_edit_by?: string
  last_edit_at: string
}

export interface WeekTotals {
  per_day: number[] // Hours per day (7 days)
  week_total: number
  indetermine: number
}

export interface CategoryRepartition {
  administratif: number // Administratif/gestion
  prestation: number // Prestation/événement
  ecole: number // École d'escalade
  competition: number // Groupes compétition
  ouverture: number // Ouverture
  loisir: number // Loisir
  mise_en_place: number // Mise en place / Rangement
  sante: number // Santé Adulte/Enfant
}

export interface WeekResponse {
  week: Week
  slots: Slot[]
  notes?: Note
  totals: WeekTotals
  repartition: CategoryRepartition
}

export type CategoryCode = 'administratif' | 'prestation' | 'ecole' | 'competition' | 'ouverture' | 'loisir' | 'mise_en_place' | 'sante'

export interface CategoryLegend {
  [key: string]: {
    label: string
    color: string
  }
}

export type WeekKind = 'type' | 'current' | 'next' | 'vacation'
export type VacationPeriod = 'Toussaint' | 'Noel' | 'Paques' | 'Ete'

// Types pour les formulaires
export interface SlotFormData {
  title: string
  category: CategoryCode
  comment?: string
  day_index: number
  start_min: number
  duration_min: number
}

export interface WeekFilters {
  employeeId?: number
  kind?: WeekKind
  vacation?: VacationPeriod
  weekStart?: string
}

// Types pour le store Zustand
export interface PlanningState {
  // Données
  employees: Employee[]
  currentWeek?: WeekResponse
  legend: CategoryLegend
  
  // Sélections
  selectedEmployeeId?: number
  selectedWeekKind: WeekKind
  selectedVacationPeriod?: VacationPeriod
  selectedWeekStart: string
  
  // UI State
  isLoading: boolean
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  undoStack: any[]
  redoStack: any[]
  
  // Actions
  setEmployees: (employees: Employee[]) => void
  setSelectedEmployee: (employeeId: number) => void
  setSelectedWeekKind: (kind: WeekKind) => void
  setSelectedVacationPeriod: (period?: VacationPeriod) => void
  setSelectedWeekStart: (date: string) => void
  setCurrentWeek: (week: WeekResponse | undefined) => void
  setLegend: (legend: CategoryLegend) => void
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void
  refreshWeek: () => Promise<void>
  
  // Undo/Redo
  pushToUndoStack: (state: any) => void
  undo: () => void
  redo: () => void
  clearUndoRedo: () => void
}

// Types pour les utilitaires
export interface TimeSlot {
  hour: number
  minute: number
  label: string
  totalMinutes: number
}

export interface DragItem {
  type: string
  slot?: Slot
  newSlot?: Partial<SlotFormData>
}

// Types pour les erreurs API
export interface ApiError {
  detail: string
  status?: number
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data?: T
  error?: ApiError
}

// Configuration de l'application
export interface AppConfig {
  apiBaseUrl: string
  defaultOpeningHour: number
  defaultClosingHour: number
  autoSaveDelay: number
  maxUndoLevels: number
}

// Types pour l'authentification
export interface User {
  id: number
  type: 'admin' | 'employee'
  name: string
  slug?: string
  token: string
  expiresAt: string
}

export interface LoginCredentials {
  pin?: string
  employeeSlug?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

// Types pour les rôles et permissions
export type UserRole = 'admin' | 'employee'

export interface Permission {
  canViewAllEmployees: boolean
  canEditAllEmployees: boolean
  canCreateEmployees: boolean
  canDeleteEmployees: boolean
  canViewOwnPlanning: boolean
  canEditOwnPlanning: boolean
  canViewBackups: boolean
  canCreateBackups: boolean
}
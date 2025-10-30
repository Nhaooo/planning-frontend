import { apiService } from './api'

export interface Slot {
  id: number
  employee_id: number
  date: string
  start_hour: number
  start_minute: number
  duration_hours: number
  duration_minutes: number
  title: string
  category: string
  comment?: string
  created_at: string
  updated_at: string
  start_time_str: string
  end_time_str: string
}

export interface SlotCreate {
  employee_id: number
  date: string
  start_hour: number
  start_minute: number
  duration_hours: number
  duration_minutes: number
  title: string
  category: string
  comment?: string
}

export interface SlotUpdate {
  employee_id?: number
  date?: string
  start_hour?: number
  start_minute?: number
  duration_hours?: number
  duration_minutes?: number
  title?: string
  category?: string
  comment?: string
}

export interface WeekPlanningResponse {
  employee_id: number
  week_start: string
  slots: Slot[]
}

export const slotApi = {
  
  async getWeekPlanning(employeeId: number, weekStart: string): Promise<WeekPlanningResponse> {
    console.log('📅 Récupération planning semaine:', { employeeId, weekStart })
    
    return apiService.request<WeekPlanningResponse>(`/slots/week?employee_id=${employeeId}&week_start=${weekStart}`, {
      method: 'GET'
    })
  },

  async createSlot(slotData: SlotCreate): Promise<Slot> {
    console.log('➕ Création créneau:', slotData)
    
    return apiService.request<Slot>('/slots/', {
      method: 'POST',
      body: JSON.stringify(slotData)
    })
  },

  async updateSlot(slotId: number, slotData: SlotUpdate): Promise<Slot> {
    console.log('✏️ Modification créneau:', { slotId, slotData })
    
    return apiService.request<Slot>(`/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(slotData)
    })
  },

  async deleteSlot(slotId: number): Promise<void> {
    console.log('🗑️ Suppression créneau:', slotId)
    
    return apiService.request<void>(`/slots/${slotId}`, {
      method: 'DELETE'
    })
  },

  async getSlot(slotId: number): Promise<Slot> {
    console.log('🔍 Récupération créneau:', slotId)
    
    return apiService.request<Slot>(`/slots/${slotId}`, {
      method: 'GET'
    })
  }
}
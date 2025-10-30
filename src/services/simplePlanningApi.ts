import { apiService } from './api'

export interface SimpleSlot {
  id: number
  employee_id: number
  date: string
  day_of_week: number
  start_time: number
  end_time: number
  title: string
  category: string
  comment?: string
  created_at: string
  updated_at: string
}

export interface SimpleSlotCreate {
  employee_id: number
  date: string
  day_of_week: number
  start_time: number
  end_time: number
  title: string
  category: string
  comment?: string
}

export interface SimpleSlotUpdate {
  employee_id?: number
  date?: string
  day_of_week?: number
  start_time?: number
  end_time?: number
  title?: string
  category?: string
  comment?: string
}

export interface WeekPlanningResponse {
  employee_id: number
  week_start: string
  slots: SimpleSlot[]
}

export const simplePlanningApi = {
  
  async getWeekPlanning(employeeId: number, weekStart: string): Promise<WeekPlanningResponse> {
    console.log('📅 Récupération planning semaine:', { employeeId, weekStart })
    
    return apiService.request(`/planning/week?employee_id=${employeeId}&week_start=${weekStart}`, {
      method: 'GET'
    })
  },

  async createSlot(slotData: SimpleSlotCreate): Promise<SimpleSlot> {
    console.log('➕ Création créneau:', slotData)
    
    return apiService.request('/planning/slots', {
      method: 'POST',
      body: JSON.stringify(slotData)
    })
  },

  async updateSlot(slotId: number, slotData: SimpleSlotUpdate): Promise<SimpleSlot> {
    console.log('✏️ Modification créneau:', { slotId, slotData })
    
    return apiService.request(`/planning/slots/${slotId}`, {
      method: 'PUT',
      body: JSON.stringify(slotData)
    })
  },

  async deleteSlot(slotId: number): Promise<void> {
    console.log('🗑️ Suppression créneau:', slotId)
    
    return apiService.request(`/planning/slots/${slotId}`, {
      method: 'DELETE'
    })
  },

  async getSlot(slotId: number): Promise<SimpleSlot> {
    console.log('🔍 Récupération créneau:', slotId)
    
    return apiService.request(`/planning/slots/${slotId}`, {
      method: 'GET'
    })
  }
}
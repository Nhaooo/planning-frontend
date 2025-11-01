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
    
    const url = `/planning/week?employee_id=${employeeId}&week_start=${weekStart}`
    console.log('🌐 URL complète:', url)
    
    try {
      console.log('📡 Envoi de la requête...')
      const result = await apiService.request<WeekPlanningResponse>(url, {
         method: 'GET'
       })
       console.log('✅ Réponse reçue:', result)
       return result
     } catch (error) {
       console.error('❌ Erreur dans getWeekPlanning:', error)
       console.error('❌ Type d\'erreur:', typeof error)
       if (error && typeof error === 'object') {
         console.error('❌ Propriétés de l\'erreur:', Object.keys(error))
       }
       throw error
     }
  },

  async createSlot(slotData: SimpleSlotCreate & { exclude_id?: number }): Promise<SimpleSlot> {
    console.log('➕ Création créneau:', slotData)
    
    // Extraire exclude_id des données et l'envoyer en query param
    const { exclude_id, ...bodyData } = slotData
    const url = exclude_id ? `/planning/slots?exclude_id=${exclude_id}` : '/planning/slots'
    
    return apiService.request(url, {
      method: 'POST',
      body: JSON.stringify(bodyData)
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
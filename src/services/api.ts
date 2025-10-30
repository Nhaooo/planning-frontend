import { 
  Employee, 
  WeekResponse, 
  WeekFilters, 
  SlotFormData, 
  CategoryLegend,
  Slot
} from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

class ApiService {
  private getAuthToken(): string | null {
    // Récupérer le token depuis localStorage (où Zustand le stocke)
    try {
      const authState = localStorage.getItem('auth-storage')
      if (authState) {
        const parsed = JSON.parse(authState)
        return parsed.state?.user?.token || null
      }
    } catch (error) {
      console.warn('Erreur récupération token:', error)
    }
    return null
  }

  async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    // Ajouter automatiquement le token d'authentification si disponible
    const token = this.getAuthToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    const config: RequestInit = {
      headers: {
        ...headers,
        ...options.headers,
      },
      ...options,
    }

    console.log('🌐 Requête API:', { url, method: config.method || 'GET', headers: config.headers })

    try {
      const response = await fetch(url, config)
      
      console.log('📡 Réponse reçue:', { 
        status: response.status, 
        statusText: response.statusText, 
        ok: response.ok,
        url: response.url 
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
        console.error('❌ Erreur API:', { status: response.status, errorData })
        const error = new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`) as any
        error.status = response.status
        error.url = response.url
        throw error
      }

      const data = await response.json()
      console.log('✅ Données reçues:', data)
      return data
    } catch (error) {
      console.error('❌ Erreur dans request:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Network error')
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request('/health')
  }
}

// Service pour les employés
export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const api = new ApiService()
    return api.request('/employees')
  },

  async getById(id: number): Promise<Employee> {
    const api = new ApiService()
    return api.request(`/employees/${id}`)
  },

  async create(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const api = new ApiService()
    return api.request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee),
    })
  },

  async update(id: number, employee: Partial<Employee>): Promise<Employee> {
    const api = new ApiService()
    return api.request(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employee),
    })
  },

  async delete(id: number): Promise<void> {
    const api = new ApiService()
    return api.request(`/employees/${id}`, {
      method: 'DELETE',
    })
  }
}

// Service pour les semaines
export const weekService = {
  async getWeeks(filters: WeekFilters = {}): Promise<WeekResponse[]> {
    const api = new ApiService()
    const params = new URLSearchParams()
    
    if (filters.employeeId) params.append('employee_id', filters.employeeId.toString())
    if (filters.kind) params.append('kind', filters.kind)
    if (filters.vacation) params.append('vacation', filters.vacation)
    if (filters.weekStart) params.append('week_start', filters.weekStart)
    
    const queryString = params.toString()
    return api.request(`/weeks${queryString ? `?${queryString}` : ''}`)
  },

  async getWeekById(id: number): Promise<WeekResponse> {
    const api = new ApiService()
    return api.request(`/weeks/${id}`)
  },

  async createWeek(employeeId: number, kind: string, weekStart: string, vacation?: string): Promise<WeekResponse> {
    const api = new ApiService()
    
    // Données simplifiées - envoi direct des strings
    const weekData: any = {
      employee_id: employeeId,
      kind: kind,
      week_start_date: weekStart
    }
    
    if (vacation) {
      weekData.vacation = vacation
    }
    
    console.log('📤 Données semaine simplifiées à envoyer:', weekData)
    
    return api.request('/weeks', {
      method: 'POST',
      body: JSON.stringify(weekData),
    })
  },

  async updateWeek(id: number, data: any): Promise<WeekResponse> {
    const api = new ApiService()
    return api.request(`/weeks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Service pour les créneaux
export const slotService = {
  async createSlot(weekId: number, slot: SlotFormData): Promise<Slot> {
    const api = new ApiService()
    return api.request(`/weeks/${weekId}/slots`, {
      method: 'POST',
      body: JSON.stringify(slot),
    })
  },

  async updateSlot(weekId: number, slotId: number, slot: Partial<SlotFormData>): Promise<Slot> {
    const api = new ApiService()
    return api.request(`/weeks/${weekId}/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(slot),
    })
  },

  async deleteSlot(weekId: number, slotId: number): Promise<void> {
    const api = new ApiService()
    return api.request(`/weeks/${weekId}/slots/${slotId}`, {
      method: 'DELETE',
    })
  }
}

// Service pour la légende
export const legendService = {
  async getLegend(): Promise<CategoryLegend> {
    const api = new ApiService()
    return api.request('/legend/')
  }
}

// Service d'authentification
export const authService = {
  async login(pin: string): Promise<{ 
    access_token: string; 
    token_type: string;
    user_type: string;
    user_name: string;
    user_id: number;
  }> {
    const api = new ApiService()
    return api.request('/auth/login/admin', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    })
  },

  async loginEmployee(employeeSlug: string): Promise<{ 
    access_token: string; 
    token_type: string;
    user_type: string;
    user_name: string;
    user_id: number;
  }> {
    const api = new ApiService()
    return api.request('/auth/login/employee', {
      method: 'POST',
      body: JSON.stringify({ employee_slug: employeeSlug }),
    })
  }
}

// Service de backup
export const backupService = {
  async createBackup(token: string): Promise<any> {
    const api = new ApiService()
    return api.request('/backup/backup', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  },

  async restoreBackup(token: string, file: File): Promise<any> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/backup/restore`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(errorData.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }
}

// Export du service principal
export const apiService = new ApiService()
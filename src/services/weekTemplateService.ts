import { WeekResponse } from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface WeekTemplateResponse {
  message: string;
  weeks: {
    template: WeekResponse;
    current?: WeekResponse;
    next?: WeekResponse;
  };
}

export class WeekTemplateService {
  /**
   * Récupère la semaine type d'un employé (modèle persistant)
   */
  static async getTemplateWeek(employeeId: number): Promise<WeekResponse> {
    const response = await fetch(`${API_BASE_URL}/week-templates/template/${employeeId}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de la semaine type');
    }
    return response.json();
  }

  /**
   * Crée ou récupère la semaine type d'un employé
   */
  static async createTemplateWeek(employeeId: number): Promise<WeekResponse> {
    const response = await fetch(`${API_BASE_URL}/week-templates/template/${employeeId}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Erreur lors de la création de la semaine type');
    }
    return response.json();
  }

  /**
   * Duplique la semaine type vers une autre semaine
   * @param employeeId ID de l'employé
   * @param targetKind Type de semaine cible: 'current' | 'next' | 'vacation'
   * @param weekStart Date de début de semaine (lundi)
   * @param vacationPeriod Période de vacances (requis si targetKind='vacation')
   */
  static async duplicateFromTemplate(
    employeeId: number,
    targetKind: 'current' | 'next' | 'vacation',
    weekStart: string,
    vacationPeriod?: string
  ): Promise<WeekResponse> {
    const params = new URLSearchParams({
      employee_id: employeeId.toString(),
      target_kind: targetKind,
      week_start: weekStart,
    });

    if (vacationPeriod) {
      params.append('vacation_period', vacationPeriod);
    }

    const response = await fetch(`${API_BASE_URL}/week-templates/duplicate-from-template?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la duplication de la semaine type');
    }

    return response.json();
  }

  /**
   * Remet à zéro une semaine en la dupliquant depuis la semaine type
   * (Bouton 'Reprendre depuis la semaine type')
   */
  static async resetFromTemplate(weekId: number): Promise<WeekResponse> {
    const response = await fetch(`${API_BASE_URL}/week-templates/reset-from-template/${weekId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la remise à zéro de la semaine');
    }

    return response.json();
  }

  /**
   * Copie la semaine suivante vers la semaine actuelle
   * (Utilisé en fin de semaine pour passer à la suivante)
   */
  static async copyNextToCurrent(employeeId: number, currentWeekStart: string): Promise<WeekResponse> {
    const params = new URLSearchParams({
      employee_id: employeeId.toString(),
      current_week_start: currentWeekStart,
    });

    const response = await fetch(`${API_BASE_URL}/week-templates/copy-next-to-current?${params}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la copie de la semaine suivante');
    }

    return response.json();
  }

  /**
   * Crée automatiquement toutes les semaines manquantes pour un employé
   * (template, current, next) basées sur la semaine type
   */
  static async autoCreateWeeks(employeeId: number, weekStart: string): Promise<WeekTemplateResponse> {
    const params = new URLSearchParams({
      week_start: weekStart,
    });

    const response = await fetch(`${API_BASE_URL}/week-templates/auto-create/${employeeId}?${params}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Erreur lors de la création automatique des semaines');
    }

    return response.json();
  }

  /**
   * Utilitaire pour formater une date en string YYYY-MM-DD
   */
  static formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Utilitaire pour obtenir le lundi d'une semaine donnée
   */
  static getMondayOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi = 1
    return new Date(date.setDate(diff));
  }
}
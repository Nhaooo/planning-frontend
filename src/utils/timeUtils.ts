import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { TimeSlot } from '../types'

dayjs.extend(isoWeek)

/**
 * Convertit les minutes depuis minuit en format HH:MM
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Convertit un format HH:MM en minutes depuis minuit
 */
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Génère les créneaux horaires pour la grille (par quarts d'heure)
 */
export const generateTimeSlots = (
  startHour: number = 9, 
  endHour: number = 22
): TimeSlot[] => {
  const slots: TimeSlot[] = []
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Ne pas ajouter le dernier quart d'heure de la dernière heure
      if (hour === endHour && minute > 0) break
      
      const totalMinutes = hour * 60 + minute
      slots.push({
        hour,
        minute,
        label: minutesToTime(totalMinutes),
        totalMinutes
      })
    }
  }
  
  return slots
}

/**
 * Snap une position en minutes au quart d'heure le plus proche
 */
export const snapToQuarterHour = (minutes: number): number => {
  return Math.round(minutes / 15) * 15
}

/**
 * Calcule la position Y d'un créneau dans la grille
 */
export const getSlotPosition = (
  startMin: number, 
  durationMin: number, 
  gridStartHour: number = 9
): { top: number; height: number } => {
  const gridStartMin = gridStartHour * 60
  const relativeStart = startMin - gridStartMin
  const slotHeight = 60 // Hauteur d'une heure en pixels
  
  return {
    top: (relativeStart / 60) * slotHeight,
    height: (durationMin / 60) * slotHeight
  }
}

/**
 * Vérifie si deux créneaux se chevauchent
 */
export const slotsOverlap = (
  slot1: { start_min: number; duration_min: number; day_index: number },
  slot2: { start_min: number; duration_min: number; day_index: number }
): boolean => {
  // Différents jours = pas de chevauchement
  if (slot1.day_index !== slot2.day_index) return false
  
  const slot1End = slot1.start_min + slot1.duration_min
  const slot2End = slot2.start_min + slot2.duration_min
  
  return slot1.start_min < slot2End && slot2.start_min < slot1End
}

/**
 * Obtient le lundi de la semaine pour une date donnée
 */
export const getMondayOfWeek = (date: Date | string): Date => {
  const d = dayjs(date)
  return d.startOf('isoWeek').toDate()
}

/**
 * Formate une date pour l'affichage
 */
export const formatDate = (date: Date | string, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format)
}

/**
 * Obtient les noms des jours de la semaine
 */
export const getDayNames = (): string[] => {
  return ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
}

/**
 * Obtient les dates de la semaine à partir du lundi
 */
export const getWeekDates = (mondayDate: Date | string): Date[] => {
  const monday = dayjs(mondayDate)
  return Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').toDate())
}

/**
 * Calcule la durée totale en heures à partir de créneaux
 */
export const calculateTotalHours = (slots: { duration_min: number }[]): number => {
  return slots.reduce((total, slot) => total + slot.duration_min, 0) / 60
}

/**
 * Formate une durée en heures et minutes
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h${mins.toString().padStart(2, '0')}`
}

/**
 * Valide qu'un créneau respecte les contraintes
 */
export const validateSlot = (slot: {
  start_min: number
  duration_min: number
  day_index: number
}): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  // Vérifier que le jour est valide
  if (slot.day_index < 0 || slot.day_index > 6) {
    errors.push('Le jour doit être entre 0 (lundi) et 6 (dimanche)')
  }
  
  // Vérifier que l'heure de début est valide
  if (slot.start_min < 0 || slot.start_min >= 1440) {
    errors.push('L\'heure de début doit être entre 00:00 et 23:59')
  }
  
  // Vérifier que la durée est un multiple de 15
  if (slot.duration_min % 15 !== 0) {
    errors.push('La durée doit être un multiple de 15 minutes')
  }
  
  // Vérifier que la durée est positive
  if (slot.duration_min <= 0) {
    errors.push('La durée doit être positive')
  }
  
  // Vérifier que le créneau ne dépasse pas minuit
  if (slot.start_min + slot.duration_min > 1440) {
    errors.push('Le créneau ne peut pas dépasser minuit')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Obtient la semaine ISO pour une date
 */
export const getISOWeek = (date: Date | string): number => {
  return dayjs(date).isoWeek()
}

/**
 * Obtient l'année ISO pour une date
 */
export const getISOYear = (date: Date | string): number => {
  return dayjs(date).isoWeekYear()
}
import { describe, it, expect } from 'vitest'
import {
  minutesToTime,
  timeToMinutes,
  snapToQuarterHour,
  generateTimeSlots,
  slotsOverlap,
  validateSlot,
  formatDuration
} from '../utils/timeUtils'

describe('timeUtils', () => {
  describe('minutesToTime', () => {
    it('should convert minutes to HH:MM format', () => {
      expect(minutesToTime(0)).toBe('00:00')
      expect(minutesToTime(60)).toBe('01:00')
      expect(minutesToTime(540)).toBe('09:00')
      expect(minutesToTime(1439)).toBe('23:59')
    })
  })

  describe('timeToMinutes', () => {
    it('should convert HH:MM to minutes', () => {
      expect(timeToMinutes('00:00')).toBe(0)
      expect(timeToMinutes('01:00')).toBe(60)
      expect(timeToMinutes('09:00')).toBe(540)
      expect(timeToMinutes('23:59')).toBe(1439)
    })
  })

  describe('snapToQuarterHour', () => {
    it('should snap to nearest quarter hour', () => {
      expect(snapToQuarterHour(0)).toBe(0)
      expect(snapToQuarterHour(7)).toBe(0)
      expect(snapToQuarterHour(8)).toBe(15)
      expect(snapToQuarterHour(22)).toBe(15)
      expect(snapToQuarterHour(23)).toBe(30)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate time slots for given hours', () => {
      const slots = generateTimeSlots(9, 10)
      expect(slots).toHaveLength(4) // 9:00, 9:15, 9:30, 9:45
      expect(slots[0]).toEqual({
        hour: 9,
        minute: 0,
        label: '09:00',
        totalMinutes: 540
      })
    })
  })

  describe('slotsOverlap', () => {
    it('should detect overlapping slots on same day', () => {
      const slot1 = { start_min: 540, duration_min: 60, day_index: 0 } // 9:00-10:00
      const slot2 = { start_min: 570, duration_min: 60, day_index: 0 } // 9:30-10:30
      
      expect(slotsOverlap(slot1, slot2)).toBe(true)
    })

    it('should not detect overlap on different days', () => {
      const slot1 = { start_min: 540, duration_min: 60, day_index: 0 }
      const slot2 = { start_min: 540, duration_min: 60, day_index: 1 }
      
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })

    it('should not detect overlap for adjacent slots', () => {
      const slot1 = { start_min: 540, duration_min: 60, day_index: 0 } // 9:00-10:00
      const slot2 = { start_min: 600, duration_min: 60, day_index: 0 } // 10:00-11:00
      
      expect(slotsOverlap(slot1, slot2)).toBe(false)
    })
  })

  describe('validateSlot', () => {
    it('should validate correct slot', () => {
      const slot = {
        start_min: 540,
        duration_min: 60,
        day_index: 0
      }
      
      const result = validateSlot(slot)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid duration', () => {
      const slot = {
        start_min: 540,
        duration_min: 50, // Not multiple of 15
        day_index: 0
      }
      
      const result = validateSlot(slot)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('La durée doit être un multiple de 15 minutes')
    })

    it('should reject slot going past midnight', () => {
      const slot = {
        start_min: 1380, // 23:00
        duration_min: 120, // 2 hours -> goes to 01:00 next day
        day_index: 0
      }
      
      const result = validateSlot(slot)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Le créneau ne peut pas dépasser minuit')
    })
  })

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(30)).toBe('30min')
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(90)).toBe('1h30')
      expect(formatDuration(120)).toBe('2h')
    })
  })
})
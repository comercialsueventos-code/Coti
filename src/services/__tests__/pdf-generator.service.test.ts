/**
 * Unit Tests for PDF Generator Service Multiday Functions
 * Story 1.5: Multiday PDF Generation Fix
 * 
 * Tests the multiday event detection and formatting functions
 */

import { PDFGeneratorService } from '../pdf-generator.service'
import { Quote, QuoteDailySchedule } from '../../types'
import moment from 'moment'
import 'moment/locale/es'

// Configure moment to use Spanish locale for tests
moment.locale('es')

// Access private methods via any casting for testing
const TestPDFService = PDFGeneratorService as any

describe('PDFGeneratorService Multiday Functions', () => {
  
  // Mock single-day quote data
  const mockSingleDayQuote: Partial<Quote> = {
    id: 1,
    quote_number: 'Q-2025-001',
    event_date: '2025-01-15',
    event_start_time: '10:00',
    event_end_time: '18:00',
    daily_schedules: undefined
  }

  // Mock multiday quote data
  const mockMultidayQuote: Partial<Quote> = {
    id: 2,
    quote_number: 'Q-2025-002',
    event_date: '2025-01-15',
    event_start_time: '10:00',
    event_end_time: '18:00',
    daily_schedules: [
      {
        id: 1,
        quote_id: 2,
        event_date: '2025-01-15',
        start_time: '10:00',
        end_time: '14:00',
        notes: 'First day setup',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z'
      },
      {
        id: 2,
        quote_id: 2,
        event_date: '2025-01-16',
        start_time: '09:00',
        end_time: '17:00',
        notes: 'Main event',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z'
      },
      {
        id: 3,
        quote_id: 2,
        event_date: '2025-01-17',
        start_time: '08:00',
        end_time: '12:00',
        notes: 'Cleanup day',
        created_at: '2025-01-10T00:00:00Z',
        updated_at: '2025-01-10T00:00:00Z'
      }
    ]
  }

  // Mock empty multiday quote
  const mockEmptyMultidayQuote: Partial<Quote> = {
    id: 3,
    quote_number: 'Q-2025-003',
    event_date: '2025-01-15',
    event_start_time: '10:00',
    event_end_time: '18:00',
    daily_schedules: []
  }

  describe('isMultidayEvent', () => {
    
    it('should return false for single-day quotes with no daily_schedules', () => {
      const result = TestPDFService.isMultidayEvent(mockSingleDayQuote)
      expect(result).toBe(false)
    })

    it('should return false for quotes with empty daily_schedules array', () => {
      const result = TestPDFService.isMultidayEvent(mockEmptyMultidayQuote)
      expect(result).toBe(false)
    })

    it('should return true for quotes with populated daily_schedules', () => {
      const result = TestPDFService.isMultidayEvent(mockMultidayQuote)
      expect(result).toBe(true)
    })

    it('should handle undefined daily_schedules gracefully', () => {
      const quoteWithUndefined = { ...mockSingleDayQuote, daily_schedules: undefined }
      const result = TestPDFService.isMultidayEvent(quoteWithUndefined)
      expect(result).toBe(false)
    })
  })

  describe('formatMultidayScheduleHTML', () => {
    
    it('should return empty string for empty or undefined schedules', () => {
      expect(TestPDFService.formatMultidayScheduleHTML([])).toBe('')
      expect(TestPDFService.formatMultidayScheduleHTML(undefined)).toBe('')
      expect(TestPDFService.formatMultidayScheduleHTML(null)).toBe('')
    })

    it('should format single day schedule correctly', () => {
      const singleDaySchedule = [{
        event_date: '2025-01-15',
        start_time: '10:00',
        end_time: '18:00'
      }]
      
      const result = TestPDFService.formatMultidayScheduleHTML(singleDaySchedule)
      
      expect(result).toContain('Día 1:')
      expect(result).toContain('enero 15 de 2025')
      expect(result).toContain('10:00 a 18:00')
      expect(result).toContain('<div style="margin-bottom: 8px;">')
    })

    it('should format multiple day schedules correctly', () => {
      const result = TestPDFService.formatMultidayScheduleHTML(mockMultidayQuote.daily_schedules!)
      
      expect(result).toContain('Día 1:')
      expect(result).toContain('Día 2:')
      expect(result).toContain('Día 3:')
      expect(result).toContain('enero 15 de 2025')
      expect(result).toContain('enero 16 de 2025')
      expect(result).toContain('enero 17 de 2025')
      expect(result).toContain('10:00 a 14:00')
      expect(result).toContain('09:00 a 17:00')
      expect(result).toContain('08:00 a 12:00')
    })

    it('should handle schedules without time information', () => {
      const schedulesWithoutTime = [{
        event_date: '2025-01-15',
        start_time: '',
        end_time: ''
      }]
      
      const result = TestPDFService.formatMultidayScheduleHTML(schedulesWithoutTime)
      
      expect(result).toContain('Día 1:')
      expect(result).toContain('enero 15 de 2025')
      expect(result).not.toContain(' - ')
    })
  })

  describe('getEventDateDisplay', () => {
    
    const mockFormatDateFn = (dateStr: string) => {
      // Use moment with Spanish locale for consistent formatting
      return moment(dateStr).format('MMMM DD [de] YYYY')
    }

    it('should return single date for single-day events', () => {
      const result = TestPDFService.getEventDateDisplay(mockSingleDayQuote, mockFormatDateFn)
      expect(result).toContain('15 de enero')
      expect(result).toContain('2025')
    })

    it('should return date range for multiday events', () => {
      const result = TestPDFService.getEventDateDisplay(mockMultidayQuote, mockFormatDateFn)
      expect(result).toContain('15 de enero')
      expect(result).toContain('17 de enero')
      expect(result).toContain(' - ')
    })

    it('should handle single date in multiday schedules', () => {
      const singleDayMultidayQuote = {
        ...mockMultidayQuote,
        daily_schedules: [{
          id: 1,
          quote_id: 2,
          event_date: '2025-01-15',
          start_time: '10:00',
          end_time: '14:00',
          notes: 'Single day',
          created_at: '2025-01-10T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z'
        }]
      }
      
      const result = TestPDFService.getEventDateDisplay(singleDayMultidayQuote, mockFormatDateFn)
      expect(result).toContain('15 de enero')
      expect(result).not.toContain(' - ')
    })

    it('should fallback to quote.event_date for malformed multiday data', () => {
      const malformedQuote = {
        ...mockMultidayQuote,
        daily_schedules: [{ event_date: '' }]
      }
      
      const result = TestPDFService.getEventDateDisplay(malformedQuote, mockFormatDateFn)
      expect(result).toContain('15 de enero')
    })
  })

  describe('getEventTimeDisplay', () => {
    
    it('should return time range for single-day events', () => {
      const result = TestPDFService.getEventTimeDisplay(mockSingleDayQuote)
      expect(result).toBe('10:00 a 18:00')
    })

    it('should return descriptive message for multiday events', () => {
      const result = TestPDFService.getEventTimeDisplay(mockMultidayQuote)
      expect(result).toBe('Ver horario detallado abajo')
    })

    it('should handle missing time information in single-day events', () => {
      const quoteWithoutTimes = {
        ...mockSingleDayQuote,
        event_start_time: undefined,
        event_end_time: undefined
      }
      
      const result = TestPDFService.getEventTimeDisplay(quoteWithoutTimes)
      expect(result).toBe('')
    })

    it('should handle partial time information in single-day events', () => {
      const quoteWithPartialTime = {
        ...mockSingleDayQuote,
        event_start_time: '10:00',
        event_end_time: undefined
      }
      
      const result = TestPDFService.getEventTimeDisplay(quoteWithPartialTime)
      expect(result).toBe('')
    })
  })

  describe('Integration scenarios', () => {
    
    it('should handle quote with undefined daily_schedules gracefully', () => {
      const quoteWithUndefined = {
        event_date: '2025-01-15',
        event_start_time: '10:00',
        event_end_time: '18:00'
      }
      
      expect(() => {
        TestPDFService.isMultidayEvent(quoteWithUndefined)
        TestPDFService.getEventDateDisplay(quoteWithUndefined, (d: string) => d)
        TestPDFService.getEventTimeDisplay(quoteWithUndefined)
      }).not.toThrow()
    })

    it('should handle malformed daily schedule data', () => {
      const malformedQuote = {
        event_date: '2025-01-15',
        daily_schedules: [
          { event_date: null, start_time: null, end_time: null },
          { event_date: '2025-01-16', start_time: '09:00', end_time: '17:00' }
        ]
      }
      
      expect(() => {
        TestPDFService.formatMultidayScheduleHTML(malformedQuote.daily_schedules)
        TestPDFService.getEventDateDisplay(malformedQuote, (d: string) => d)
      }).not.toThrow()
    })
  })
})
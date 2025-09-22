/**
 * Unit Tests for Multiday Hour Total Calculation Bug Fix
 * Story 1.4: MULTIDAY-HOUR-TOTAL-CALC-BUG
 * 
 * Tests the mathematical functions that were causing 12h + 12h + 1h = 25.5h instead of 25h
 */

import { renderHook } from '@testing-library/react'
import { usePricingForm } from '../usePricingForm'
import { PricingFormData } from '../../types'

// Mock the external dependencies
jest.mock('../../../../hooks/usePricing', () => ({
  useQuotePricing: jest.fn().mockReturnValue({
    result: null,
    errors: [],
    is_valid: false
  }),
  usePricingOptimization: jest.fn().mockReturnValue({
    suggestions: []
  })
}))

jest.mock('../../../../hooks/useQuotes', () => ({
  useCreateQuote: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false
  }),
  useUpdateQuote: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
    isPending: false
  }),
  QUOTES_QUERY_KEYS: {
    detail: jest.fn(),
    lists: jest.fn(),
    statistics: jest.fn()
  }
}))

// Mock all other hooks
jest.mock('../../../../hooks/useEmployees', () => ({
  useActiveEmployees: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useProducts', () => ({
  useActiveProducts: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useMachinery', () => ({
  useMachinery: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useSuppliers', () => ({
  useSuppliers: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useMachineryRental', () => ({
  useMachineryRentals: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useEventSubcontract', () => ({
  useEventSubcontracts: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../../hooks/useDisposableItems', () => ({
  useActiveDisposableItems: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn().mockReturnValue({
    invalidateQueries: jest.fn()
  })
}))

describe('usePricingForm - Multiday Hour Total Calculation Fix', () => {
  
  describe('calculateHoursPerDay - Mathematical Fix', () => {
    
    it('should return total hours (25h) for multiday event: 12h + 12h + 1h', () => {
      const { result } = renderHook(() => usePricingForm())
      
      // Set up multiday event with specific daily schedules that caused the bug
      const multidayFormData: Partial<PricingFormData> = {
        eventStartDate: '2024-09-10',
        eventEndDate: '2024-09-12', // 3-day event
        dailySchedules: [
          { date: '2024-09-10', startTime: '08:00:00', endTime: '20:00:00' }, // 12 hours
          { date: '2024-09-11', startTime: '08:00:00', endTime: '20:00:00' }, // 12 hours  
          { date: '2024-09-12', startTime: '10:00:00', endTime: '11:00:00' }  // 1 hour
        ]
      }
      
      // Apply the form data
      Object.entries(multidayFormData).forEach(([key, value]) => {
        result.current.updateFormData(key as keyof PricingFormData, value)
      })
      
      // Access the internal calculateHoursPerDay function
      // Since it's not directly exposed, we'll test via the pricing input
      const pricingInput = (result.current as any).buildPricingInput?.()
      
      // For this test case, we expect total hours to be 25, not 25.5
      const expectedTotalHours = 25
      
      // Test via hook's state - the hours should be set correctly for employees
      result.current.addEmployee()
      const employeeInput = result.current.formData.employeeInputs[0]
      
      expect(employeeInput?.hours).toBe(expectedTotalHours)
    })
    
    it('should handle various multiday combinations correctly', () => {
      const testCases = [
        {
          name: 'Even hours: 8h + 8h + 8h',
          schedules: [
            { date: '2024-09-10', startTime: '08:00:00', endTime: '16:00:00' }, // 8h
            { date: '2024-09-11', startTime: '08:00:00', endTime: '16:00:00' }, // 8h  
            { date: '2024-09-12', startTime: '08:00:00', endTime: '16:00:00' }  // 8h
          ],
          expectedTotal: 24
        },
        {
          name: 'Fractional hours: 8.5h + 12h + 2.5h',
          schedules: [
            { date: '2024-09-10', startTime: '08:00:00', endTime: '16:30:00' }, // 8.5h
            { date: '2024-09-11', startTime: '08:00:00', endTime: '20:00:00' }, // 12h  
            { date: '2024-09-12', startTime: '10:00:00', endTime: '12:30:00' }  // 2.5h
          ],
          expectedTotal: 23
        },
        {
          name: 'Single long day: 20h',
          schedules: [
            { date: '2024-09-10', startTime: '06:00:00', endTime: '02:00:00' }  // 20h (overnight)
          ],
          expectedTotal: 20
        },
        {
          name: 'Overnight events: 16h + 8h',
          schedules: [
            { date: '2024-09-10', startTime: '18:00:00', endTime: '10:00:00' }, // 16h overnight
            { date: '2024-09-11', startTime: '10:00:00', endTime: '18:00:00' }  // 8h
          ],
          expectedTotal: 24
        }
      ]
      
      testCases.forEach(testCase => {
        const { result } = renderHook(() => usePricingForm())
        
        // Set up multiday event with test case schedules
        result.current.updateFormData('eventStartDate', testCase.schedules[0].date)
        result.current.updateFormData('eventEndDate', testCase.schedules[testCase.schedules.length - 1].date)
        result.current.updateFormData('dailySchedules', testCase.schedules)
        
        // Add an employee to test hour calculation
        result.current.addEmployee()
        const employeeInput = result.current.formData.employeeInputs[0]
        
        expect(employeeInput?.hours).toBe(testCase.expectedTotal)
      })
    })
    
    it('should maintain backward compatibility for single-day events', () => {
      const { result } = renderHook(() => usePricingForm())
      
      // Set up single-day event
      result.current.updateFormData('eventStartDate', '2024-09-10')
      result.current.updateFormData('eventEndDate', '2024-09-10')
      result.current.updateFormData('eventStartTime', '08:00:00')
      result.current.updateFormData('eventEndTime', '20:00:00') // 12 hours
      
      // Add an employee to test hour calculation
      result.current.addEmployee()
      const employeeInput = result.current.formData.employeeInputs[0]
      
      expect(employeeInput?.hours).toBe(12)
    })
    
    it('should handle minimum hour requirements correctly', () => {
      const { result } = renderHook(() => usePricingForm())
      
      // Set up very short event (less than 0.5h)
      result.current.updateFormData('eventStartDate', '2024-09-10')
      result.current.updateFormData('eventEndDate', '2024-09-10')
      result.current.updateFormData('eventStartTime', '10:00:00')
      result.current.updateFormData('eventEndTime', '10:15:00') // 0.25 hours
      
      // Add an employee to test hour calculation  
      result.current.addEmployee()
      const employeeInput = result.current.formData.employeeInputs[0]
      
      // Should enforce minimum 0.5h
      expect(employeeInput?.hours).toBe(0.5)
    })
    
    it('should round to nearest 0.5 hour correctly', () => {
      const roundingTestCases = [
        {
          name: '8.2h should round to 8h',
          startTime: '08:00:00',
          endTime: '16:12:00', // 8.2h
          expected: 8
        },
        {
          name: '8.3h should round to 8.5h', 
          startTime: '08:00:00',
          endTime: '16:18:00', // 8.3h
          expected: 8.5
        },
        {
          name: '8.7h should round to 8.5h',
          startTime: '08:00:00', 
          endTime: '16:42:00', // 8.7h
          expected: 8.5
        },
        {
          name: '8.8h should round to 9h',
          startTime: '08:00:00',
          endTime: '16:48:00', // 8.8h  
          expected: 9
        }
      ]
      
      roundingTestCases.forEach(testCase => {
        const { result } = renderHook(() => usePricingForm())
        
        result.current.updateFormData('eventStartDate', '2024-09-10')
        result.current.updateFormData('eventEndDate', '2024-09-10')  
        result.current.updateFormData('eventStartTime', testCase.startTime)
        result.current.updateFormData('eventEndTime', testCase.endTime)
        
        result.current.addEmployee()
        const employeeInput = result.current.formData.employeeInputs[0]
        
        expect(employeeInput?.hours).toBe(testCase.expected)
      })
    })
    
  })
  
  describe('Edge Cases and Error Handling', () => {
    
    it('should handle missing daily schedules gracefully', () => {
      const { result } = renderHook(() => usePricingForm())
      
      // Set up multiday event but no daily schedules
      result.current.updateFormData('eventStartDate', '2024-09-10')
      result.current.updateFormData('eventEndDate', '2024-09-12')
      result.current.updateFormData('dailySchedules', [])
      
      result.current.addEmployee()
      const employeeInput = result.current.formData.employeeInputs[0]
      
      // Should default to reasonable value (not crash)
      expect(employeeInput?.hours).toBeDefined()
      expect(employeeInput?.hours).toBeGreaterThanOrEqual(0)
    })
    
    it('should handle incomplete daily schedules', () => {
      const { result } = renderHook(() => usePricingForm())
      
      // Set up multiday event with incomplete schedules
      result.current.updateFormData('eventStartDate', '2024-09-10')
      result.current.updateFormData('eventEndDate', '2024-09-12')
      result.current.updateFormData('dailySchedules', [
        { date: '2024-09-10', startTime: '08:00:00', endTime: '16:00:00' }, // Complete
        { date: '2024-09-11', startTime: '', endTime: '' },                 // Incomplete  
        { date: '2024-09-12', startTime: '10:00:00', endTime: '14:00:00' }  // Complete
      ])
      
      result.current.addEmployee()
      const employeeInput = result.current.formData.employeeInputs[0]
      
      // Should calculate only from complete schedules: 8h + 4h = 12h
      expect(employeeInput?.hours).toBe(12)
    })
    
  })
  
})
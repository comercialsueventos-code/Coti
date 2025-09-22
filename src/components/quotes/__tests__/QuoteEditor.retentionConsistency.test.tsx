/**
 * Unit Tests for QuoteEditor - Retention Consistency Fix
 * Story SUE-002: Fix Quote Editing - Retention Inconsistency (0% vs 4%)
 *
 * Tests that retention values are consistent between form and calculations
 * when editing existing quotes
 */

import { renderHook } from '@testing-library/react'
import { usePricingForm } from '../../pricing/hooks/usePricingForm'
import { QuoteEditor } from '../QuoteEditor'
import { Quote } from '../../../types'

// Mock the external dependencies
jest.mock('../../../hooks/useClients', () => ({
  useClients: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useProducts', () => ({
  useActiveProducts: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useEmployees', () => ({
  useActiveEmployees: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useTransportZones', () => ({
  useTransportZones: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useCities', () => ({
  useCities: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useMachinery', () => ({
  useMachinery: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useSuppliers', () => ({
  useSuppliers: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useMachineryRental', () => ({
  useMachineryRentals: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useEventSubcontract', () => ({
  useEventSubcontracts: jest.fn().mockReturnValue({ data: [] })
}))

jest.mock('../../../hooks/useDisposableItems', () => ({
  useActiveDisposableItems: jest.fn().mockReturnValue({ data: [] })
}))

describe('QuoteEditor - Retention Consistency Fix', () => {

  describe('buildPricingFormData - Retention Logic', () => {

    it('should set both enableRetention and retentionPercentage to 0 when no retention was applied', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-001',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: 0, // No retention applied
        retention_percentage: 4, // But stored percentage is 4%
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], // clients
        [], // products
        [], // employees
        [], // transportZones
        [], // cities
        [], // machinery
        [], // suppliers
        [], // machineryRentals
        [], // eventSubcontracts
        []  // disposableItems
      )

      // Both should be consistent when no retention was applied
      expect(formData.enableRetention).toBe(false)
      expect(formData.retentionPercentage).toBe(0) // This should be 0, not 4
    })

    it('should set both enableRetention and retentionPercentage correctly when retention was applied', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-002',
        client_id: 1,
        event_title: 'Test Event with Retention',
        event_date: '2024-12-01',
        tax_retention_percentage: 4, // Retention was applied
        retention_percentage: 4, // Stored percentage is 4%
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], // clients
        [], // products
        [], // employees
        [], // transportZones
        [], // cities
        [], // machinery
        [], // suppliers
        [], // machineryRentals
        [], // eventSubcontracts
        []  // disposableItems
      )

      // Both should be consistent when retention was applied
      expect(formData.enableRetention).toBe(true)
      expect(formData.retentionPercentage).toBe(4)
    })

    it('should handle undefined tax_retention_percentage correctly', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-003',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: undefined, // No retention data
        retention_percentage: 4, // But stored percentage exists
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], // clients
        [], // products
        [], // employees
        [], // transportZones
        [], // cities
        [], // machinery
        [], // suppliers
        [], // machineryRentals
        [], // eventSubcontracts
        []  // disposableItems
      )

      // Should treat undefined as 0 for consistency
      expect(formData.enableRetention).toBe(false)
      expect(formData.retentionPercentage).toBe(0)
    })

    it('should handle null retention_percentage correctly when retention is enabled', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-004',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: 5, // Retention was applied
        retention_percentage: null, // But stored percentage is null
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], // clients
        [], // products
        [], // employees
        [], // transportZones
        [], // cities
        [], // machinery
        [], // suppliers
        [], // machineryRentals
        [], // eventSubcontracts
        []  // disposableItems
      )

      // Should enable retention but use 0 as fallback for percentage
      expect(formData.enableRetention).toBe(true)
      expect(formData.retentionPercentage).toBe(0)
    })

    it('should maintain consistency when retention percentage is different from tax percentage', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-005',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: 3.5, // Different applied retention
        retention_percentage: 4, // Different stored percentage
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], // clients
        [], // products
        [], // employees
        [], // transportZones
        [], // cities
        [], // machinery
        [], // suppliers
        [], // machineryRentals
        [], // eventSubcontracts
        []  // disposableItems
      )

      // Should enable retention and use the stored percentage when enabled
      expect(formData.enableRetention).toBe(true)
      expect(formData.retentionPercentage).toBe(4) // Should use retention_percentage when enabled
    })

  })

  describe('Integration with usePricingForm', () => {

    it('should maintain retention consistency through form initialization', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-006',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: 0, // No retention applied
        retention_percentage: 4, // But stored percentage is 4%
        margin_percentage: 30,
        items: []
      }

      const initialData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], [], [], [], [], [], [], [], [], []
      )

      const { result } = renderHook(() => usePricingForm({
        initialData,
        isEditMode: true,
        editingQuoteId: 1
      }))

      // Form should show consistent retention values
      expect(result.current.formData.enableRetention).toBe(false)
      expect(result.current.formData.retentionPercentage).toBe(0)
    })

  })

  describe('Edge Cases', () => {

    it('should handle very small retention percentages correctly', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-007',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: 0.01, // Very small but > 0
        retention_percentage: 0.01,
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], [], [], [], [], [], [], [], [], []
      )

      // Should still enable retention for any value > 0
      expect(formData.enableRetention).toBe(true)
      expect(formData.retentionPercentage).toBe(0.01)
    })

    it('should handle negative retention percentages as disabled', () => {
      const mockQuote: Partial<Quote> = {
        id: 1,
        quote_number: 'SUE-2024-008',
        client_id: 1,
        event_title: 'Test Event',
        event_date: '2024-12-01',
        tax_retention_percentage: -1, // Negative value
        retention_percentage: 4,
        margin_percentage: 30,
        items: []
      }

      const formData = QuoteEditor.buildPricingFormData(
        mockQuote as Quote,
        [], [], [], [], [], [], [], [], [], []
      )

      // Should treat negative as disabled for safety
      expect(formData.enableRetention).toBe(false)
      expect(formData.retentionPercentage).toBe(0)
    })

  })

})
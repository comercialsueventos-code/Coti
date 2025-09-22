/**
 * Unit Tests for Quote Items - Quantity and Units Per Product Fix
 * Story SUE-001: Fix Quote Editing - Quantity and Units Per Product Not Saving
 *
 * Tests that quantity and units_per_product fields are correctly included
 * when saving quote items during CREATE and UPDATE operations
 */

import { renderHook, act } from '@testing-library/react'
import { usePricingForm } from '../usePricingForm'
import { PricingFormData, ProductInput } from '../../types'
import { QuotesService } from '../../../../services/quotes.service'

// Mock the external dependencies
jest.mock('../../../../hooks/usePricing', () => ({
  useQuotePricing: jest.fn().mockReturnValue({
    result: {
      subtotal: 1000,
      transport_subtotal: 100,
      margin_amount: 300,
      tax_retention_percentage: 0,
      tax_retention_amount: 0,
      total_cost: 1400
    },
    errors: [],
    is_valid: true
  }),
  usePricingOptimization: jest.fn().mockReturnValue({
    suggestions: []
  })
}))

const mockCreateQuote = jest.fn()
const mockUpdateQuote = jest.fn()

jest.mock('../../../../hooks/useQuotes', () => ({
  useCreateQuote: jest.fn(() => ({
    mutateAsync: mockCreateQuote,
    isPending: false
  })),
  useUpdateQuote: jest.fn(() => ({
    mutateAsync: mockUpdateQuote,
    isPending: false
  })),
  QUOTES_QUERY_KEYS: {
    detail: jest.fn(),
    lists: jest.fn(),
    statistics: jest.fn()
  }
}))

// Mock all other hooks with minimal data
jest.mock('../../../../hooks/useEmployees', () => ({
  useActiveEmployees: jest.fn().mockReturnValue({
    data: [
      { id: 1, name: 'Test Employee', has_arl: false, hourly_rates: { '1-4h': 50000, '4-8h': 45000, '8h+': 40000 } }
    ]
  })
}))

jest.mock('../../../../hooks/useProducts', () => ({
  useActiveProducts: jest.fn().mockReturnValue({
    data: [
      { id: 1, name: 'Test Product', base_price: 10000, unit: 'unidad', pricing_type: 'measurement', minimum_order: 1 }
    ]
  })
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

jest.mock('../../../../services/quotes.service')
jest.mock('../../../../services/employee-scheduling.service')

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: jest.fn().mockReturnValue({
    invalidateQueries: jest.fn()
  })
}))

describe('usePricingForm - Units Per Product Fix', () => {

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock successful quote creation/update responses
    mockCreateQuote.mockResolvedValue({
      id: 1,
      quote_number: 'SUE-2024-001'
    })

    mockUpdateQuote.mockResolvedValue({
      id: 1,
      quote_number: 'SUE-2024-001'
    })

    // Mock QuotesService methods
    jest.spyOn(QuotesService, 'updateQuoteItems').mockResolvedValue()
    jest.spyOn(QuotesService, 'updateDailySchedules').mockResolvedValue()
  })

  describe('CREATE Quote - Units Per Product Inclusion', () => {

    it('should include units_per_product when creating quote with employee-product associations', async () => {
      const { result } = renderHook(() => usePricingForm())

      await act(async () => {
        // Set up basic quote data
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee
        result.current.addEmployee()

        // Add a product with specific units per product
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 100)
        result.current.updateProduct(0, 'unitsPerProduct', 7) // 7 units per product

        // Associate employee with product
        result.current.updateEmployee(0, 'selectedProductIds', [1])

        // Save the quote
        await result.current.handleSaveQuote()
      })

      // Verify that createQuote was called with correct data structure
      expect(mockCreateQuote).toHaveBeenCalledWith({
        quoteData: expect.objectContaining({
          quote_items: expect.arrayContaining([
            expect.objectContaining({
              item_type: 'product',
              product_id: 1,
              employee_id: 1,
              quantity: expect.any(Number),
              units_per_product: 7, // This should be included
              unit_price: expect.any(Number),
              total_price: expect.any(Number)
            })
          ])
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            units_per_product: 7 // This should be included in items array too
          })
        ])
      })
    })

    it('should include units_per_product when creating quote with products without employees', async () => {
      const { result } = renderHook(() => usePricingForm())

      await act(async () => {
        // Set up basic quote data
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee (required for validation)
        result.current.addEmployee()
        result.current.updateEmployee(0, 'selectedProductIds', []) // No product association

        // Add a product with specific units per product but no employee assignment
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 50)
        result.current.updateProduct(0, 'unitsPerProduct', 3) // 3 units per product

        // Save the quote
        await result.current.handleSaveQuote()
      })

      // Verify that createQuote was called with correct data structure
      expect(mockCreateQuote).toHaveBeenCalledWith({
        quoteData: expect.objectContaining({
          quote_items: expect.arrayContaining([
            expect.objectContaining({
              item_type: 'product',
              product_id: 1,
              employee_id: undefined, // No employee assigned
              quantity: 50,
              units_per_product: 3, // This should be included
              unit_price: expect.any(Number),
              total_price: expect.any(Number)
            })
          ])
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            units_per_product: 3 // This should be included in items array too
          })
        ])
      })
    })

  })

  describe('UPDATE Quote - Units Per Product Inclusion', () => {

    it('should include units_per_product when updating quote with employee-product associations', async () => {
      const { result } = renderHook(() => usePricingForm({
        isEditMode: true,
        editingQuoteId: 1
      }))

      await act(async () => {
        // Set up basic quote data for edit
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Updated Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee
        result.current.addEmployee()

        // Add a product with specific units per product
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 150)
        result.current.updateProduct(0, 'unitsPerProduct', 12) // 12 units per product

        // Associate employee with product
        result.current.updateEmployee(0, 'selectedProductIds', [1])

        // Save the quote (this will call UPDATE)
        await result.current.handleSaveQuote()
      })

      // Verify that updateQuote was called
      expect(mockUpdateQuote).toHaveBeenCalled()

      // Verify that updateQuoteItems was called with correct data structure
      expect(QuotesService.updateQuoteItems).toHaveBeenCalledWith(
        1, // quoteId
        expect.arrayContaining([
          expect.objectContaining({
            item_type: 'product',
            product_id: 1,
            employee_id: 1,
            quantity: expect.any(Number),
            units_per_product: 12, // This should be included
            unit_price: expect.any(Number),
            total_price: expect.any(Number)
          })
        ])
      )
    })

    it('should include units_per_product when updating quote with products without employees', async () => {
      const { result } = renderHook(() => usePricingForm({
        isEditMode: true,
        editingQuoteId: 1
      }))

      await act(async () => {
        // Set up basic quote data for edit
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Updated Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee (required for validation)
        result.current.addEmployee()
        result.current.updateEmployee(0, 'selectedProductIds', []) // No product association

        // Add a product with specific units per product but no employee assignment
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 75)
        result.current.updateProduct(0, 'unitsPerProduct', 5) // 5 units per product

        // Save the quote (this will call UPDATE)
        await result.current.handleSaveQuote()
      })

      // Verify that updateQuote was called
      expect(mockUpdateQuote).toHaveBeenCalled()

      // Verify that updateQuoteItems was called with correct data structure
      expect(QuotesService.updateQuoteItems).toHaveBeenCalledWith(
        1, // quoteId
        expect.arrayContaining([
          expect.objectContaining({
            item_type: 'product',
            product_id: 1,
            quantity: 75,
            units_per_product: 5, // This should be included
            unit_price: expect.any(Number),
            total_price: expect.any(Number)
          })
        ])
      )
    })

  })

  describe('Quantity Field Verification', () => {

    it('should always include quantity field in quote items', async () => {
      const { result } = renderHook(() => usePricingForm())

      await act(async () => {
        // Set up basic quote data
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee
        result.current.addEmployee()

        // Add a product with specific quantity
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 25)
        result.current.updateProduct(0, 'unitsPerProduct', 2)

        // Associate employee with product
        result.current.updateEmployee(0, 'selectedProductIds', [1])

        // Save the quote
        await result.current.handleSaveQuote()
      })

      // Verify that both quantity and units_per_product are included
      expect(mockCreateQuote).toHaveBeenCalledWith({
        quoteData: expect.objectContaining({
          quote_items: expect.arrayContaining([
            expect.objectContaining({
              quantity: expect.any(Number), // Quantity should always be included
              units_per_product: 2 // Units per product should be included
            })
          ])
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            quantity: expect.any(Number), // Quantity should always be included
            units_per_product: 2 // Units per product should be included
          })
        ])
      })
    })

  })

  describe('Edge Cases', () => {

    it('should handle undefined units_per_product gracefully', async () => {
      const { result } = renderHook(() => usePricingForm())

      await act(async () => {
        // Set up basic quote data
        result.current.updateFormData('selectedClient', { id: 1, name: 'Test Client', type: 'social' })
        result.current.updateFormData('eventName', 'Test Event')
        result.current.updateFormData('eventStartDate', '2024-12-01')
        result.current.updateFormData('eventEndDate', '2024-12-01')
        result.current.updateFormData('eventStartTime', '10:00:00')
        result.current.updateFormData('eventEndTime', '18:00:00')

        // Add an employee
        result.current.addEmployee()

        // Add a product without setting unitsPerProduct (should be undefined)
        result.current.addProduct()
        result.current.updateProduct(0, 'quantity', 10)
        // Note: NOT setting unitsPerProduct

        // Associate employee with product
        result.current.updateEmployee(0, 'selectedProductIds', [1])

        // Save the quote
        await result.current.handleSaveQuote()
      })

      // Should not throw error and should include undefined units_per_product
      expect(mockCreateQuote).toHaveBeenCalledWith({
        quoteData: expect.objectContaining({
          quote_items: expect.arrayContaining([
            expect.objectContaining({
              quantity: expect.any(Number),
              units_per_product: undefined // Should handle undefined gracefully
            })
          ])
        }),
        items: expect.arrayContaining([
          expect.objectContaining({
            quantity: expect.any(Number),
            units_per_product: undefined
          })
        ])
      })
    })

  })

})
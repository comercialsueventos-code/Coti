import { renderHook, act } from '@testing-library/react'
import { usePricingForm } from '../usePricingForm'

// Mock external dependencies
jest.mock('../../../../hooks/useDebounce', () => ({
  useDebounce: (value: any, delay: number) => value // Return immediately for testing
}))

jest.mock('../../../../hooks/useEmployees', () => ({
  useActiveEmployees: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useProducts', () => ({
  useActiveProducts: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useMachinery', () => ({
  useMachinery: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useSuppliers', () => ({
  useSuppliers: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useMachineryRental', () => ({
  useMachineryRentals: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useEventSubcontract', () => ({
  useEventSubcontracts: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useDisposableItems', () => ({
  useActiveDisposableItems: () => ({ data: [] })
}))

jest.mock('../../../../hooks/usePricing', () => ({
  useQuotePricing: () => ({ data: null }),
  usePricingOptimization: () => ({ data: null })
}))

jest.mock('../../../../hooks/useQuotes', () => ({
  useCreateQuote: () => ({ mutate: jest.fn() }),
  useUpdateQuote: () => ({ mutate: jest.fn() }),
  QUOTES_QUERY_KEYS: { list: 'quotes' }
}))

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: jest.fn() })
}))

describe('usePricingForm Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('updateFormData should be memoized and not recreate on re-renders', () => {
    const { result, rerender } = renderHook(() => usePricingForm())

    const initialUpdateFormData = result.current.updateFormData

    // Force re-render by updating props (simulate parent component re-render)
    rerender()

    const afterRerenderUpdateFormData = result.current.updateFormData

    // Function should be the same reference (memoized)
    expect(initialUpdateFormData).toBe(afterRerenderUpdateFormData)
  })

  test('addEmployee should be memoized when dependencies do not change', () => {
    const { result, rerender } = renderHook(() => usePricingForm())

    const initialAddEmployee = result.current.addEmployee

    // Force re-render without changing dependencies
    rerender()

    const afterRerenderAddEmployee = result.current.addEmployee

    // Function should be the same reference (memoized)
    expect(initialAddEmployee).toBe(afterRerenderAddEmployee)
  })

  test('updateEmployee should be memoized', () => {
    const { result, rerender } = renderHook(() => usePricingForm())

    const initialUpdateEmployee = result.current.updateEmployee

    rerender()

    const afterRerenderUpdateEmployee = result.current.updateEmployee

    expect(initialUpdateEmployee).toBe(afterRerenderUpdateEmployee)
  })

  test('updateProduct should be memoized', () => {
    const { result, rerender } = renderHook(() => usePricingForm())

    const initialUpdateProduct = result.current.updateProduct

    rerender()

    const afterRerenderUpdateProduct = result.current.updateProduct

    expect(initialUpdateProduct).toBe(afterRerenderUpdateProduct)
  })

  test('rapid updateFormData calls should not cause performance issues', () => {
    const { result } = renderHook(() => usePricingForm())

    const start = performance.now()

    // Simulate rapid typing in a text field
    act(() => {
      for (let i = 0; i < 100; i++) {
        result.current.updateFormData('eventName', `Test Event ${i}`)
      }
    })

    const end = performance.now()
    const duration = end - start

    // Should complete in reasonable time (under 100ms for 100 updates)
    expect(duration).toBeLessThan(100)
  })

  test('form data should update correctly with optimizations', () => {
    const { result } = renderHook(() => usePricingForm())

    act(() => {
      result.current.updateFormData('eventName', 'Performance Test Event')
    })

    expect(result.current.formData.eventName).toBe('Performance Test Event')
  })
})
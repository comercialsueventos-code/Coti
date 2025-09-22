import { describe, it, expect } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import PricingClientSelection from '../PricingClientSelection'
import { PricingFormData } from '../../types'

// Mock the custom hooks
jest.mock('../../../../hooks/useClients', () => ({
  useActiveClients: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useTransport', () => ({
  useActiveTransportZones: () => ({ data: [] })
}))

jest.mock('../../../../hooks/useCities', () => ({
  useCityDropdownData: () => ({ dropdownOptions: [], isLoading: false })
}))

jest.mock('../TransportValidationErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTransportValidationError: () => ({
    throwTransportError: jest.fn()
  })
}))

jest.mock('../components/MultiTransportZoneSelector', () => {
  return function MockMultiTransportZoneSelector() {
    return <div>Mock Multi Transport Zone Selector</div>
  }
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('PricingClientSelection - Multidia Date Navigation', () => {
  const mockUpdateFormData = jest.fn()
  
  const baseFormData: PricingFormData = {
    selectedClient: null,
    selectedContact: null,
    eventName: '',
    eventStartDate: '',
    eventEndDate: '',
    eventStartTime: '',
    eventEndTime: '',
    selectedDays: [],
    dailySchedules: [],
    eventAddress: '',
    eventCity: null,
    eventDescription: '',
    selectedTransportZone: null,
    selectedTransportZones: [],
    transportCount: 0,
    transportProductIds: [],
    includeEquipmentTransport: false,
    useFlexibleTransport: false,
    transportAllocations: [],
    employeeInputs: [],
    productInputs: [],
    machineryInputs: [],
    subcontractInputs: [],
    disposableItemInputs: [],
    profitMarginPercentage: 25,
    marginMode: 'global'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should handle date range generation correctly without timezone issues', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-02-15',
      eventEndDate: '2024-02-17'
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should show multiday event controls
    expect(screen.getByText(/Selección de Días Específicos/i)).toBeInTheDocument()
  })

  it('should calculate event duration correctly across month boundaries', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-01-30',
      eventEndDate: '2024-02-02'
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should display duration information correctly
    expect(screen.getByText(/4 días/)).toBeInTheDocument()
  })

  it('should handle invalid date formats gracefully', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: 'invalid-date',
      eventEndDate: '2024-02-17'
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should not crash and should show appropriate fallback
    expect(screen.queryByText(/Fecha inválida/)).not.toBeInTheDocument()
  })

  it('should handle day selection without restrictions', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-02-15',
      eventEndDate: '2024-02-20',
      selectedDays: ['2024-02-15', '2024-02-17'] // Non-consecutive days
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should show selected days count
    expect(screen.getByText(/Días seleccionados \(2\)/)).toBeInTheDocument()
  })

  it('should handle year boundaries correctly', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2023-12-30',
      eventEndDate: '2024-01-02'
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should calculate duration correctly across year boundary
    expect(screen.getByText(/4 días/)).toBeInTheDocument()
  })

  it('should prevent infinite loops with very large date ranges', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-01-01',
      eventEndDate: '2026-01-01' // 2+ year range
    }

    // Should not hang or crash
    expect(() => {
      render(
        <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
        { wrapper: createWrapper() }
      )
    }).not.toThrow()
  })

  it('should handle leap year February correctly', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-02-28', // 2024 is leap year
      eventEndDate: '2024-03-01'
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should include February 29th in leap year
    expect(screen.getByText(/3 días/)).toBeInTheDocument()
  })

  it('should auto-generate daily schedules when days are selected', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-09-10',
      eventEndDate: '2024-09-12',
      selectedDays: ['2024-09-10', '2024-09-11', '2024-09-12']
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should trigger auto-generation of schedules via useEffect
    // The useEffect should call updateFormData('dailySchedules', schedules)
    expect(mockUpdateFormData).toHaveBeenCalledWith('dailySchedules', expect.arrayContaining([
      expect.objectContaining({ date: '2024-09-10' }),
      expect.objectContaining({ date: '2024-09-11' }),
      expect.objectContaining({ date: '2024-09-12' })
    ]))
  })

  it('should show "Horarios por Día" section immediately when days are selected', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-09-10',
      eventEndDate: '2024-09-12',
      selectedDays: ['2024-09-10', '2024-09-11', '2024-09-12'],
      dailySchedules: [] // Empty schedules initially
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should show the "Horarios por Día" section even with empty schedules
    expect(screen.getByText(/Horarios por Día/)).toBeInTheDocument()
    expect(screen.getByText(/Generando horarios para 3 días seleccionados/)).toBeInTheDocument()
  })

  it('should preserve existing schedule times when updating days', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-09-10',
      eventEndDate: '2024-09-12',
      selectedDays: ['2024-09-10', '2024-09-12'], // Skip middle day
      dailySchedules: [
        { date: '2024-09-10', startTime: '08:00:00', endTime: '17:00:00' }
      ]
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should preserve existing times and add new day with default times
    expect(mockUpdateFormData).toHaveBeenCalledWith('dailySchedules', expect.arrayContaining([
      { date: '2024-09-10', startTime: '08:00:00', endTime: '17:00:00' }, // Preserved
      { date: '2024-09-12', startTime: '', endTime: '' } // New day with defaults
    ]))
  })

  it('should clear daily schedules for single-day events', () => {
    const formData = {
      ...baseFormData,
      eventStartDate: '2024-09-10',
      eventEndDate: '2024-09-10', // Same day - single day event
      dailySchedules: [
        { date: '2024-09-10', startTime: '08:00:00', endTime: '17:00:00' }
      ]
    }

    render(
      <PricingClientSelection formData={formData} updateFormData={mockUpdateFormData} />,
      { wrapper: createWrapper() }
    )

    // Should clear daily schedules for single-day events
    expect(mockUpdateFormData).toHaveBeenCalledWith('dailySchedules', [])
  })
})
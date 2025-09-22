/**
 * UI Integration Tests for PricingClientSelection Component
 * TMD-CONSOLIDATED story - QA testing requirement
 * 
 * Tests real-time validation and transport manual distribution UI behavior
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import PricingClientSelection from '../PricingClientSelection'
import { PricingFormProps } from '../../types'

// Mock hooks
jest.mock('../../../../hooks/useClients', () => ({
  useActiveClients: () => ({
    data: [
      {
        id: 1,
        name: 'Test Client',
        email: 'test@client.com',
        type: 'corporativo',
        contacts: [
          {
            name: 'John Doe',
            email: 'john@test.com',
            phone: '123-456-7890',
            position: 'Manager',
            is_primary: true
          }
        ]
      }
    ]
  })
}))

jest.mock('../../../../hooks/useTransport', () => ({
  useActiveTransportZones: () => ({
    data: [
      {
        id: 1,
        name: 'Zona Norte',
        base_cost: 50000,
        additional_equipment_cost: 25000,
        estimated_travel_time_minutes: 45
      },
      {
        id: 2,
        name: 'Zona Sur',
        base_cost: 75000,
        additional_equipment_cost: 30000,
        estimated_travel_time_minutes: 60
      }
    ]
  })
}))

jest.mock('../../../../hooks/useCities', () => ({
  useCityDropdownData: () => ({
    dropdownOptions: [
      { value: 1, label: 'Bogotá, Cundinamarca', department: 'Cundinamarca' },
      { value: 2, label: 'Medellín, Antioquia', department: 'Antioquia' }
    ],
    isLoading: false
  })
}))

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('PricingClientSelection Integration Tests', () => {
  let mockFormData: any
  let mockUpdateFormData: jest.Mock

  beforeEach(() => {
    mockFormData = {
      selectedClient: null,
      selectedContact: null,
      selectedTransportZone: null,
      transportCount: 1,
      includeEquipmentTransport: false,
      useFlexibleTransport: false,
      transportAllocations: [],
      transportProductIds: [],
      productInputs: [
        { product: { id: 1, name: 'Product 1' } },
        { product: { id: 2, name: 'Product 2' } },
        { product: { id: 3, name: 'Product 3' } }
      ],
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
      marginPercentage: 25,
      enableRetention: false,
      retentionPercentage: 4
    }

    mockUpdateFormData = jest.fn()
  })

  const renderComponent = (formData = mockFormData) => {
    const props: PricingFormProps = {
      formData,
      updateFormData: mockUpdateFormData
    }

    return render(
      <PricingClientSelection {...props} />,
      { wrapper: createWrapper() }
    )
  }

  describe('Transport Manual Distribution Real-time Validation', () => {
    
    it('should show manual distribution controls when flexible transport is enabled', async () => {
      const user = userEvent.setup()
      
      // Start with transport zone selected
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        }
      }
      
      renderComponent(formDataWithTransport)

      // Initially should not show manual distribution
      expect(screen.queryByText('📊 Distribución Manual de Transportes')).not.toBeInTheDocument()

      // Enable flexible transport
      const flexibleSwitch = screen.getByRole('checkbox', { name: /distribución manual/i })
      await user.click(flexibleSwitch)

      // Should call updateFormData with useFlexibleTransport: true
      expect(mockUpdateFormData).toHaveBeenCalledWith('useFlexibleTransport', true)
    })

    it('should initialize manual allocations when switching to flexible transport', async () => {
      const user = userEvent.setup()
      
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: [
          { product: { id: 1, name: 'Cake' } },
          { product: { id: 2, name: 'Drinks' } }
        ]
      }
      
      renderComponent(formDataWithTransport)

      // Enable flexible transport
      const flexibleSwitch = screen.getByRole('checkbox', { name: /distribución manual/i })
      await user.click(flexibleSwitch)

      // Should initialize allocations for all products
      expect(mockUpdateFormData).toHaveBeenCalledWith('transportAllocations', [
        { productId: 1, quantity: 0 },
        { productId: 2, quantity: 0 }
      ])
    })

    it('should show real-time validation for manual allocations', () => {
      const formDataWithManualDistribution = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        useFlexibleTransport: true,
        transportCount: 3,
        transportAllocations: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 }
        ]
      }
      
      renderComponent(formDataWithManualDistribution)

      // Should show validation message
      expect(screen.getByText('Total asignado: 2 / 3 transportes')).toBeInTheDocument()
      expect(screen.getByText('⚠️ Faltan 1 transportes')).toBeInTheDocument()
    })

    it('should show success validation when allocations match transport count', () => {
      const formDataWithCorrectAllocation = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        useFlexibleTransport: true,
        transportCount: 3,
        transportAllocations: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 }
        ]
      }
      
      renderComponent(formDataWithCorrectAllocation)

      expect(screen.getByText('Total asignado: 3 / 3 transportes')).toBeInTheDocument()
      expect(screen.getByText('✅ Distribución correcta')).toBeInTheDocument()
    })

    it('should show warning when allocations exceed transport count', () => {
      const formDataWithExcessAllocation = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        useFlexibleTransport: true,
        transportCount: 2,
        transportAllocations: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 2 }
        ]
      }
      
      renderComponent(formDataWithExcessAllocation)

      expect(screen.getByText('Total asignado: 4 / 2 transportes')).toBeInTheDocument()
      expect(screen.getByText('⚠️ Excede por 2')).toBeInTheDocument()
    })

    it('should update allocations when transport count changes', async () => {
      const user = userEvent.setup()
      
      const formDataWithManualDistribution = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        transportCount: 2
      }
      
      renderComponent(formDataWithManualDistribution)

      // Change transport count
      const transportCountInput = screen.getByLabelText('Cantidad de Transportes')
      await user.clear(transportCountInput)
      await user.type(transportCountInput, '5')

      expect(mockUpdateFormData).toHaveBeenCalledWith('transportCount', 5)
    })

    it('should enforce min/max constraints on allocation inputs', async () => {
      const user = userEvent.setup()
      
      const formDataWithManualDistribution = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        useFlexibleTransport: true,
        transportCount: 3,
        transportAllocations: [
          { productId: 1, quantity: 0 }
        ],
        productInputs: [
          { product: { id: 1, name: 'Cake' } }
        ]
      }
      
      renderComponent(formDataWithManualDistribution)

      // Find the allocation input
      const allocationInput = screen.getByDisplayValue('0')
      expect(allocationInput).toHaveAttribute('min', '0')
      expect(allocationInput).toHaveAttribute('max', '3')
    })
  })

  describe('Margin Mode Selector', () => {
    it('should render margin mode selector and update value', async () => {
      renderComponent()
      // Expect the selector label to be present
      expect(screen.getByLabelText('Modo de Margen')).toBeInTheDocument()

      // Change to "Por línea"
      const marginModeSelect = screen.getByLabelText('Modo de Margen') as HTMLInputElement
      await act(async () => {
        fireEvent.mouseDown(marginModeSelect)
      })
      const option = await screen.findByText('Por línea')
      await act(async () => {
        option.click()
      })
      expect(mockUpdateFormData).toHaveBeenCalledWith('marginMode', 'per_line')
    })
  })

  describe('Transport Cost Calculation Display', () => {
    
    it('should display correct base transport cost', () => {
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        transportCount: 2,
        includeEquipmentTransport: false
      }
      
      renderComponent(formDataWithTransport)

      expect(screen.getByText('• Costo unitario: 50.000 COP')).toBeInTheDocument()
      expect(screen.getByText('• Cantidad: 2 transporte(s)')).toBeInTheDocument()
      expect(screen.getByText('• Total: 100.000 COP')).toBeInTheDocument()
    })

    it('should display cost with equipment when equipment is included', () => {
      const formDataWithEquipment = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        transportCount: 1,
        includeEquipmentTransport: true
      }
      
      renderComponent(formDataWithEquipment)

      expect(screen.getByText('• Costo unitario: 75.000 COP')).toBeInTheDocument()
      expect(screen.getByText('• Total: 75.000 COP')).toBeInTheDocument()
    })

    it('should update cost display when equipment toggle changes', async () => {
      const user = userEvent.setup()
      
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        transportCount: 1,
        includeEquipmentTransport: false
      }
      
      renderComponent(formDataWithTransport)

      // Initially without equipment
      expect(screen.getByText('• Costo unitario: 50.000 COP')).toBeInTheDocument()

      // Toggle equipment
      const equipmentSwitch = screen.getByRole('checkbox', { name: /con equipo/i })
      await user.click(equipmentSwitch)

      expect(mockUpdateFormData).toHaveBeenCalledWith('includeEquipmentTransport', true)
    })
  })

  describe('Product Selection for Transport Distribution', () => {
    
    it('should show product selection buttons', () => {
      const formDataWithProducts = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: [
          { product: { id: 1, name: 'Cake' } },
          { product: { id: 2, name: 'Drinks' } }
        ]
      }
      
      renderComponent(formDataWithProducts)

      expect(screen.getByText('Todos los productos')).toBeInTheDocument()
      expect(screen.getByText('Cake')).toBeInTheDocument()
      expect(screen.getByText('Drinks')).toBeInTheDocument()
    })

    it('should handle product selection for transport distribution', async () => {
      const user = userEvent.setup()
      
      const formDataWithProducts = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: [
          { product: { id: 1, name: 'Cake' } },
          { product: { id: 2, name: 'Drinks' } }
        ],
        transportProductIds: []
      }
      
      renderComponent(formDataWithProducts)

      // Select a specific product
      const cakeButton = screen.getByText('Cake')
      await user.click(cakeButton)

      expect(mockUpdateFormData).toHaveBeenCalledWith('transportProductIds', [1])
    })

    it('should deselect product when clicking selected product', async () => {
      const user = userEvent.setup()
      
      const formDataWithSelectedProduct = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: [
          { product: { id: 1, name: 'Cake' } }
        ],
        transportProductIds: [1]
      }
      
      renderComponent(formDataWithSelectedProduct)

      // Deselect the product
      const cakeButton = screen.getByText('Cake')
      await user.click(cakeButton)

      expect(mockUpdateFormData).toHaveBeenCalledWith('transportProductIds', [])
    })

    it('should show correct status message for product selection', () => {
      const formDataWithSelectedProducts = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: [
          { product: { id: 1, name: 'Cake' } },
          { product: { id: 2, name: 'Drinks' } }
        ],
        transportProductIds: [1]
      }
      
      renderComponent(formDataWithSelectedProducts)

      expect(screen.getByText('Transporte se distribuirá entre 1 producto(s) seleccionado(s)')).toBeInTheDocument()
    })
  })

  describe('Event Date and Time Validation', () => {
    
    it('should show multi-day event alert when end date is different from start date', () => {
      const formDataWithMultiDay = {
        ...mockFormData,
        eventStartDate: '2024-01-01',
        eventEndDate: '2024-01-03'
      }
      
      renderComponent(formDataWithMultiDay)

      expect(screen.getByText('Evento multi-día detectado')).toBeInTheDocument()
      expect(screen.getByText('Selecciona días específicos del evento abajo')).toBeInTheDocument()
    })

    it('should show single day time inputs when start and end dates are the same', () => {
      const formDataWithSingleDay = {
        ...mockFormData,
        eventStartDate: '2024-01-01',
        eventEndDate: '2024-01-01'
      }
      
      renderComponent(formDataWithSingleDay)

      expect(screen.getByLabelText('Hora de Inicio')).toBeInTheDocument()
      expect(screen.getByLabelText('Hora de Fin')).toBeInTheDocument()
    })

    it('should filter end time options based on start time', async () => {
      const user = userEvent.setup()
      
      const formDataWithSingleDay = {
        ...mockFormData,
        eventStartDate: '2024-01-01',
        eventEndDate: '2024-01-01',
        eventStartTime: '10:00:00'
      }
      
      renderComponent(formDataWithSingleDay)

      const endTimeSelect = screen.getByLabelText('Hora de Fin')
      expect(endTimeSelect).not.toBeDisabled()
    })

    it('should clear end time when start time is changed to later time', async () => {
      const user = userEvent.setup()
      
      const formDataWithTimes = {
        ...mockFormData,
        eventStartDate: '2024-01-01',
        eventEndDate: '2024-01-01',
        eventStartTime: '10:00:00',
        eventEndTime: '12:00:00'
      }
      
      renderComponent(formDataWithTimes)

      // Change start time to after current end time
      const startTimeSelect = screen.getByLabelText('Hora de Inicio')
      await user.selectOptions(startTimeSelect, '14:00:00')

      expect(mockUpdateFormData).toHaveBeenCalledWith('eventStartTime', '14:00:00')
      expect(mockUpdateFormData).toHaveBeenCalledWith('eventEndTime', '')
    })
  })

  describe('Retention Control Validation', () => {
    
    it('should show retention percentage input when retention is enabled', async () => {
      const user = userEvent.setup()
      
      renderComponent()

      // Enable retention
      const retentionCheckbox = screen.getByRole('checkbox', { name: /aplicar retención de impuestos/i })
      await user.click(retentionCheckbox)

      expect(mockUpdateFormData).toHaveBeenCalledWith('enableRetention', true)
    })

    it('should enforce min/max constraints on retention percentage', () => {
      const formDataWithRetention = {
        ...mockFormData,
        enableRetention: true,
        retentionPercentage: 4
      }
      
      renderComponent(formDataWithRetention)

      const retentionInput = screen.getByLabelText('Porcentaje de Retención (%)')
      expect(retentionInput).toHaveAttribute('min', '0')
      expect(retentionInput).toHaveAttribute('max', '100')
    })

    it('should clamp retention percentage to valid range', async () => {
      const user = userEvent.setup()
      
      const formDataWithRetention = {
        ...mockFormData,
        enableRetention: true,
        retentionPercentage: 4
      }
      
      renderComponent(formDataWithRetention)

      const retentionInput = screen.getByLabelText('Porcentaje de Retención (%)')
      await user.clear(retentionInput)
      await user.type(retentionInput, '150')

      // Should clamp to 100
      expect(mockUpdateFormData).toHaveBeenCalledWith('retentionPercentage', 100)
    })
  })

  describe('Performance and Accessibility', () => {
    
    it('should render efficiently with many products', () => {
      const manyProducts = Array.from({ length: 50 }, (_, i) => ({
        product: { id: i + 1, name: `Product ${i + 1}` }
      }))
      
      const formDataWithManyProducts = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: manyProducts
      }

      const start = performance.now()
      renderComponent(formDataWithManyProducts)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(1000) // Should render in under 1 second
    })

    it('should have proper ARIA labels for transport inputs', () => {
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        }
      }
      
      renderComponent(formDataWithTransport)

      expect(screen.getByLabelText('Cantidad de Transportes')).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /con equipo/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /distribución manual/i })).toBeInTheDocument()
    })

    it('should maintain focus management in form interactions', async () => {
      const user = userEvent.setup()
      
      const formDataWithTransport = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        }
      }
      
      renderComponent(formDataWithTransport)

      // Focus should work correctly
      const transportCountInput = screen.getByLabelText('Cantidad de Transportes')
      transportCountInput.focus()
      expect(transportCountInput).toHaveFocus()

      await user.tab()
      // Focus should move to next focusable element
      const equipmentSwitch = screen.getByRole('checkbox', { name: /con equipo/i })
      expect(equipmentSwitch).toHaveFocus()
    })
  })

  describe('Error Boundary Integration', () => {
    
    it('should handle missing transport zone data gracefully', () => {
      const formDataWithInvalidZone = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Invalid Zone'
          // missing cost data
        }
      }
      
      // Should not throw an error
      expect(() => {
        renderComponent(formDataWithInvalidZone)
      }).not.toThrow()
    })

    it('should handle empty product inputs gracefully', () => {
      const formDataWithoutProducts = {
        ...mockFormData,
        selectedTransportZone: {
          id: 1,
          name: 'Zona Norte',
          base_cost: 50000,
          additional_equipment_cost: 25000
        },
        productInputs: []
      }
      
      expect(() => {
        renderComponent(formDataWithoutProducts)
      }).not.toThrow()
    })
  })
})

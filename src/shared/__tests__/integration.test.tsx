/**
 * Integration Tests for Consolidated Components
 * 
 * Real-world usage tests to ensure consolidated components work
 * correctly in typical application scenarios.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Import consolidated modules
import TabPanel from '../components/TabPanel'
import {
  ACTIONS,
  STATUS,
  VALIDATION_MESSAGES,
  EMPLOYEE_TYPES,
  PRODUCT_CATEGORIES,
  EMPLOYEE_RATE_TEMPLATES,
  getEmployeeRateTemplate,
  getEmployeeTypeInfo
} from '../constants'

import type {
  BaseEntity,
  CreateData,
  SelectOption,
  GenericFormState,
  ApiResponse
} from '../types'

// Mock components to test integration
interface Employee extends BaseEntity {
  name: string
  employee_type: string
  email: string
}

interface Product extends BaseEntity {
  name: string
  category: string
  price: number
}

// Mock Employee Form Component using consolidated patterns
const EmployeeForm: React.FC<{
  employee?: Employee
  onSubmit: (data: CreateData<Employee>) => Promise<void>
  onCancel: () => void
}> = ({ employee, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState<CreateData<Employee>>({
    name: employee?.name || '',
    employee_type: employee?.employee_type || '',
    email: employee?.email || '',
    is_active: employee?.is_active ?? true
  })
  
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) {
      newErrors.name = VALIDATION_MESSAGES.REQUIRED
    }
    
    if (!formData.email) {
      newErrors.email = VALIDATION_MESSAGES.REQUIRED
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = VALIDATION_MESSAGES.INVALID_EMAIL
    }
    
    if (!formData.employee_type) {
      newErrors.employee_type = VALIDATION_MESSAGES.REQUIRED
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} data-testid="employee-form">
      <div>
        <label htmlFor="name">Nombre</label>
        <input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          data-testid="name-input"
        />
        {errors.name && <span data-testid="name-error">{errors.name}</span>}
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          data-testid="email-input"
        />
        {errors.email && <span data-testid="email-error">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="employee_type">Tipo de Empleado</label>
        <select
          id="employee_type"
          value={formData.employee_type}
          onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
          data-testid="employee-type-select"
        >
          <option value="">Seleccionar...</option>
          {EMPLOYEE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
        {errors.employee_type && <span data-testid="employee-type-error">{errors.employee_type}</span>}
      </div>

      <div>
        <button 
          type="submit" 
          disabled={isSubmitting}
          data-testid="submit-button"
        >
          {isSubmitting ? ACTIONS.SAVING : ACTIONS.SAVE}
        </button>
        <button 
          type="button" 
          onClick={onCancel}
          data-testid="cancel-button"
        >
          {ACTIONS.CANCEL}
        </button>
      </div>
    </form>
  )
}

// Mock Tabs Component using consolidated TabPanel
const EmployeeManagement: React.FC = () => {
  const [currentTab, setCurrentTab] = React.useState(0)
  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [showForm, setShowForm] = React.useState(false)

  const handleCreateEmployee = async (data: CreateData<Employee>) => {
    const newEmployee: Employee = {
      ...data,
      id: Date.now(),
      created_at: new Date().toISOString()
    }
    setEmployees([...employees, newEmployee])
    setShowForm(false)
  }

  return (
    <div data-testid="employee-management">
      <div role="tablist">
        <button
          role="tab"
          aria-selected={currentTab === 0}
          onClick={() => setCurrentTab(0)}
          data-testid="active-tab"
        >
          Empleados Activos
        </button>
        <button
          role="tab"
          aria-selected={currentTab === 1}
          onClick={() => setCurrentTab(1)}
          data-testid="inactive-tab"
        >
          Empleados Inactivos
        </button>
      </div>

      <TabPanel value={currentTab} index={0} idPrefix="employee">
        <div data-testid="active-employees">
          <h2>Empleados Activos</h2>
          <button 
            onClick={() => setShowForm(true)}
            data-testid="create-employee-button"
          >
            {ACTIONS.CREATE} Empleado
          </button>
          
          <div>
            {employees
              .filter(emp => emp.is_active)
              .map(emp => (
                <div key={emp.id} data-testid={`employee-${emp.id}`}>
                  <span>{emp.name}</span>
                  <span>{getEmployeeTypeInfo(emp.employee_type)?.icon}</span>
                  <span>{STATUS.ACTIVE}</span>
                </div>
              ))}
          </div>
        </div>
      </TabPanel>

      <TabPanel value={currentTab} index={1} idPrefix="employee">
        <div data-testid="inactive-employees">
          <h2>Empleados Inactivos</h2>
          <div>
            {employees
              .filter(emp => !emp.is_active)
              .map(emp => (
                <div key={emp.id} data-testid={`employee-${emp.id}`}>
                  <span>{emp.name}</span>
                  <span>{STATUS.INACTIVE}</span>
                </div>
              ))}
          </div>
        </div>
      </TabPanel>

      {showForm && (
        <div data-testid="employee-form-modal">
          <EmployeeForm
            onSubmit={handleCreateEmployee}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}
    </div>
  )
}

describe('Integration Tests', () => {
  
  describe('Employee Management Integration', () => {
    
    it('should render employee management with tabs', () => {
      render(<EmployeeManagement />)
      
      expect(screen.getByTestId('employee-management')).toBeInTheDocument()
      expect(screen.getByTestId('active-tab')).toBeInTheDocument()
      expect(screen.getByTestId('inactive-tab')).toBeInTheDocument()
      expect(screen.getByTestId('active-employees')).toBeInTheDocument()
    })

    it('should switch between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      // Initially on active tab
      expect(screen.getByTestId('active-employees')).toBeVisible()
      expect(screen.queryByTestId('inactive-employees')).not.toBeVisible()
      
      // Switch to inactive tab
      await user.click(screen.getByTestId('inactive-tab'))
      
      await waitFor(() => {
        expect(screen.queryByTestId('active-employees')).not.toBeVisible()
        expect(screen.getByTestId('inactive-employees')).toBeVisible()
      })
    })

    it('should show create employee form when button clicked', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      // Click create button
      await user.click(screen.getByTestId('create-employee-button'))
      
      expect(screen.getByTestId('employee-form-modal')).toBeInTheDocument()
      expect(screen.getByTestId('employee-form')).toBeInTheDocument()
    })

    it('should validate form using consolidated validation messages', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      // Open form and try to submit empty
      await user.click(screen.getByTestId('create-employee-button'))
      await user.click(screen.getByTestId('submit-button'))
      
      // Should show validation errors using consolidated messages
      expect(screen.getByTestId('name-error')).toHaveTextContent(VALIDATION_MESSAGES.REQUIRED)
      expect(screen.getByTestId('email-error')).toHaveTextContent(VALIDATION_MESSAGES.REQUIRED)
      expect(screen.getByTestId('employee-type-error')).toHaveTextContent(VALIDATION_MESSAGES.REQUIRED)
    })

    it('should validate email format using consolidated validation', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      // Open form and enter invalid email
      await user.click(screen.getByTestId('create-employee-button'))
      await user.type(screen.getByTestId('email-input'), 'invalid-email')
      await user.click(screen.getByTestId('submit-button'))
      
      expect(screen.getByTestId('email-error')).toHaveTextContent(VALIDATION_MESSAGES.INVALID_EMAIL)
    })

    it('should populate employee type select with consolidated options', () => {
      render(<EmployeeManagement />)
      
      // Open form
      fireEvent.click(screen.getByTestId('create-employee-button'))
      
      const select = screen.getByTestId('employee-type-select')
      const options = select.querySelectorAll('option')
      
      // Should have all employee types + default option
      expect(options.length).toBe(EMPLOYEE_TYPES.length + 1)
      
      // Check that options include icons and labels
      const operarioOption = Array.from(options).find(
        option => option.textContent?.includes('🔧 Operario')
      )
      expect(operarioOption).toBeInTheDocument()
    })

    it('should successfully create employee with all consolidated patterns', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      // Open form
      await user.click(screen.getByTestId('create-employee-button'))
      
      // Fill form
      await user.type(screen.getByTestId('name-input'), 'John Doe')
      await user.type(screen.getByTestId('email-input'), 'john@example.com')
      await user.selectOptions(screen.getByTestId('employee-type-select'), 'operario')
      
      // Submit form
      await user.click(screen.getByTestId('submit-button'))
      
      // Form should close and employee should appear in list
      await waitFor(() => {
        expect(screen.queryByTestId('employee-form-modal')).not.toBeInTheDocument()
      })
      
      // Employee should be in active list
      const employeeItem = screen.getByText('John Doe')
      expect(employeeItem).toBeInTheDocument()
      
      // Should show status and icon using consolidated constants
      expect(screen.getByText(STATUS.ACTIVE)).toBeInTheDocument()
      expect(screen.getByText('🔧')).toBeInTheDocument()
    })

    it('should use consolidated button labels correctly', () => {
      render(<EmployeeManagement />)
      
      // Create button should use consolidated action
      expect(screen.getByTestId('create-employee-button')).toHaveTextContent(
        `${ACTIONS.CREATE} Empleado`
      )
      
      // Open form to see more buttons
      fireEvent.click(screen.getByTestId('create-employee-button'))
      
      expect(screen.getByTestId('submit-button')).toHaveTextContent(ACTIONS.SAVE)
      expect(screen.getByTestId('cancel-button')).toHaveTextContent(ACTIONS.CANCEL)
    })
  })

  describe('Real-world Form Integration', () => {
    
    it('should integrate with rate templates', () => {
      const operarioRates = getEmployeeRateTemplate('operario')
      const chefRates = getEmployeeRateTemplate('chef')
      
      // Should get different templates for different types
      expect(operarioRates).not.toEqual(chefRates)
      
      // Should have rate structure
      expect(operarioRates[0]).toHaveProperty('min_hours')
      expect(operarioRates[0]).toHaveProperty('max_hours')
      expect(operarioRates[0]).toHaveProperty('rate')
      expect(operarioRates[0]).toHaveProperty('description')
    })

    it('should work with type inference and helpers', () => {
      const employeeType = 'operario'
      const typeInfo = getEmployeeTypeInfo(employeeType)
      
      expect(typeInfo).toMatchObject({
        value: 'operario',
        label: 'Operario',
        icon: '🔧'
      })
      
      // Should work with TypeScript inference
      if (typeInfo) {
        const label: string = typeInfo.label
        const icon: string | undefined = typeInfo.icon
        expect(label).toBe('Operario')
        expect(icon).toBe('🔧')
      }
    })
  })

  describe('API Integration Patterns', () => {
    
    it('should work with generic API response patterns', async () => {
      // Mock API response using consolidated types
      const mockApiResponse: ApiResponse<Employee[]> = {
        data: [
          {
            id: 1,
            name: 'John Doe',
            employee_type: 'operario',
            email: 'john@example.com',
            created_at: '2024-01-01',
            is_active: true
          }
        ],
        success: true,
        message: 'Employees fetched successfully'
      }

      expect(mockApiResponse.success).toBe(true)
      expect(Array.isArray(mockApiResponse.data)).toBe(true)
      expect(mockApiResponse.data[0].employee_type).toBe('operario')
    })

    it('should work with generic create data patterns', () => {
      const createEmployeeData: CreateData<Employee> = {
        name: 'Jane Doe',
        employee_type: 'chef',
        email: 'jane@example.com',
        is_active: true
      }

      // Should not have id, created_at, updated_at
      expect(createEmployeeData).not.toHaveProperty('id')
      expect(createEmployeeData).not.toHaveProperty('created_at')
      expect(createEmployeeData).not.toHaveProperty('updated_at')
      
      // Should have required fields
      expect(createEmployeeData.name).toBe('Jane Doe')
      expect(createEmployeeData.employee_type).toBe('chef')
    })
  })

  describe('Performance Integration', () => {
    
    it('should handle many tab switches efficiently', async () => {
      const user = userEvent.setup()
      render(<EmployeeManagement />)
      
      const start = performance.now()
      
      // Switch tabs multiple times
      for (let i = 0; i < 10; i++) {
        await user.click(screen.getByTestId('inactive-tab'))
        await user.click(screen.getByTestId('active-tab'))
      }
      
      const duration = performance.now() - start
      
      // Should complete quickly
      expect(duration).toBeLessThan(1000)
    })

    it('should handle many constant lookups efficiently', () => {
      const start = performance.now()
      
      // Simulate heavy usage
      for (let i = 0; i < 1000; i++) {
        EMPLOYEE_TYPES.find(t => t.value === 'operario')
        getEmployeeTypeInfo('chef')
        VALIDATION_MESSAGES.REQUIRED
        ACTIONS.CREATE
      }
      
      const duration = performance.now() - start
      
      // Should be fast
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Error Handling Integration', () => {
    
    it('should handle missing data gracefully', () => {
      // Test with undefined employee type
      const invalidTypeInfo = getEmployeeTypeInfo('invalid-type')
      expect(invalidTypeInfo).toBeUndefined()
      
      // Test with invalid rate template
      const invalidRates = getEmployeeRateTemplate('invalid-type')
      expect(Array.isArray(invalidRates)).toBe(true)
      expect(invalidRates.length).toBeGreaterThan(0) // Should return defaults
    })
  })
})

/**
 * Integration test utilities
 */
export const integrationTestUtils = {
  /**
   * Test a full form workflow with consolidated patterns
   */
  testFormWorkflow: async (
    formTestId: string,
    fields: Record<string, string>,
    expectedResult: any
  ) => {
    const user = userEvent.setup()
    
    // Fill form fields
    for (const [field, value] of Object.entries(fields)) {
      const input = screen.getByTestId(`${field}-input`)
      await user.clear(input)
      await user.type(input, value)
    }
    
    // Submit form
    await user.click(screen.getByTestId('submit-button'))
    
    // Verify result
    await waitFor(() => {
      expect(expectedResult).toBeDefined()
    })
  },

  /**
   * Test tab switching with consolidated TabPanel
   */
  testTabSwitching: async (tabTestIds: string[]) => {
    const user = userEvent.setup()
    
    for (let i = 0; i < tabTestIds.length; i++) {
      await user.click(screen.getByTestId(tabTestIds[i]))
      
      // Verify tab is active
      await waitFor(() => {
        expect(screen.getByTestId(tabTestIds[i])).toHaveAttribute('aria-selected', 'true')
      })
    }
  }
}
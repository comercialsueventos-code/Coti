/**
 * Consolidation Integration Tests
 * 
 * Comprehensive test suite to validate that all consolidations work correctly
 * and maintain backward compatibility.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

// Test TabPanel consolidation
import TabPanel from '../components/TabPanel'
import { TabPanelProps } from '../types'

// Test Constants consolidation  
import {
  ACTIONS,
  STATUS,
  VALIDATION_MESSAGES,
  EMPLOYEE_TYPES,
  PRODUCT_CATEGORIES,
  MONTHS,
  BANKS
} from '../constants'

// Test Types consolidation
import {
  BaseEntity,
  CreateData,
  UpdateData,
  SelectOption,
  GenericFormState,
  ApiResponse
} from '../types'

describe('Consolidation Integration Tests', () => {
  
  describe('TabPanel Consolidation', () => {
    const defaultProps: TabPanelProps = {
      value: 0,
      index: 0,
      children: <div data-testid="tab-content">Test Content</div>
    }

    it('should render TabPanel when active', () => {
      render(<TabPanel {...defaultProps} />)
      
      expect(screen.getByTestId('tab-content')).toBeInTheDocument()
      expect(screen.getByRole('tabpanel')).toBeInTheDocument()
    })

    it('should hide TabPanel when inactive', () => {
      render(<TabPanel {...defaultProps} value={1} />)
      
      expect(screen.getByRole('tabpanel')).toHaveAttribute('hidden')
    })

    it('should use correct accessibility attributes', () => {
      const idPrefix = 'test-panel'
      render(<TabPanel {...defaultProps} idPrefix={idPrefix} />)
      
      const tabpanel = screen.getByRole('tabpanel')
      expect(tabpanel).toHaveAttribute('id', `${idPrefix}-tabpanel-0`)
      expect(tabpanel).toHaveAttribute('aria-labelledby', `${idPrefix}-tab-0`)
    })

    it('should support custom props', () => {
      render(
        <TabPanel 
          {...defaultProps} 
          className="custom-class"
          data-testid="custom-tabpanel"
        />
      )
      
      const tabpanel = screen.getByTestId('custom-tabpanel')
      expect(tabpanel).toHaveClass('custom-class')
    })
  })

  describe('Constants Consolidation', () => {
    
    describe('UI Constants', () => {
      it('should export all required ACTIONS', () => {
        expect(ACTIONS.CREATE).toBe('Crear')
        expect(ACTIONS.EDIT).toBe('Editar')
        expect(ACTIONS.DELETE).toBe('Eliminar')
        expect(ACTIONS.SAVE).toBe('Guardar')
        expect(ACTIONS.CANCEL).toBe('Cancelar')
        expect(ACTIONS.LOADING).toBe('Cargando...')
      })

      it('should export all required STATUS values', () => {
        expect(STATUS.ACTIVE).toBe('Activo')
        expect(STATUS.INACTIVE).toBe('Inactivo')
        expect(STATUS.PENDING).toBe('Pendiente')
        expect(STATUS.COMPLETED).toBe('Completado')
      })

      it('should export validation messages with functions', () => {
        expect(VALIDATION_MESSAGES.REQUIRED).toBe('Este campo es obligatorio')
        expect(VALIDATION_MESSAGES.INVALID_EMAIL).toBe('Ingrese un correo electrónico válido')
        expect(VALIDATION_MESSAGES.MIN_LENGTH(5)).toBe('Debe tener al menos 5 caracteres')
        expect(VALIDATION_MESSAGES.MAX_VALUE(100)).toBe('El valor máximo es 100')
      })
    })

    describe('Common Data Constants', () => {
      it('should export MONTHS as SelectOption array', () => {
        expect(Array.isArray(MONTHS)).toBe(true)
        expect(MONTHS.length).toBe(12)
        
        const enero = MONTHS.find(m => m.label === 'Enero')
        expect(enero).toEqual({ value: '1', label: 'Enero' })
      })

      it('should export BANKS as SelectOption array', () => {
        expect(Array.isArray(BANKS)).toBe(true)
        expect(BANKS.length).toBeGreaterThan(5)
        
        const bancolombia = BANKS.find(b => b.value === 'bancolombia')
        expect(bancolombia).toEqual({ value: 'bancolombia', label: 'Bancolombia' })
      })
    })

    describe('Domain-specific Constants', () => {
      it('should export EMPLOYEE_TYPES with icons', () => {
        expect(Array.isArray(EMPLOYEE_TYPES)).toBe(true)
        
        const operario = EMPLOYEE_TYPES.find(e => e.value === 'operario')
        expect(operario).toEqual({ 
          value: 'operario', 
          label: 'Operario', 
          icon: '🔧' 
        })
      })

      it('should export PRODUCT_CATEGORIES with icons', () => {
        expect(Array.isArray(PRODUCT_CATEGORIES)).toBe(true)
        
        const bebidas = PRODUCT_CATEGORIES.find(p => p.value === 'bebidas')
        expect(bebidas).toEqual({ 
          value: 'bebidas', 
          label: 'Bebidas', 
          icon: '🥤' 
        })
      })
    })
  })

  describe('Types Consolidation', () => {
    
    it('should provide generic BaseEntity interface', () => {
      interface TestEntity extends BaseEntity {
        name: string
        email: string
      }

      const entity: TestEntity = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        created_at: '2024-01-01',
        is_active: true
      }

      expect(entity.id).toBe(1)
      expect(entity.is_active).toBe(true)
    })

    it('should provide CreateData type helper', () => {
      interface User extends BaseEntity {
        name: string
        email: string
      }

      // CreateData should omit id, created_at, updated_at
      const createData: CreateData<User> = {
        name: 'John',
        email: 'john@example.com',
        is_active: true
      }

      expect(createData.name).toBe('John')
      // TypeScript should prevent these fields
      // createData.id = 1 // Should cause TS error
      // createData.created_at = '' // Should cause TS error
    })

    it('should provide UpdateData type helper', () => {
      interface User extends BaseEntity {
        name: string
        email: string
        age: number
      }

      // UpdateData should make all fields optional except system fields
      const updateData: UpdateData<User> = {
        name: 'Jane' // Only updating name, everything else optional
      }

      expect(updateData.name).toBe('Jane')
      expect(updateData.email).toBeUndefined()
    })

    it('should provide SelectOption interface', () => {
      const option: SelectOption = {
        value: 'test',
        label: 'Test Label',
        icon: '🔧',
        disabled: false
      }

      expect(option.value).toBe('test')
      expect(option.label).toBe('Test Label')
      expect(option.icon).toBe('🔧')
    })

    it('should provide ApiResponse interface', () => {
      const response: ApiResponse<string> = {
        data: 'test data',
        success: true,
        message: 'Operation successful'
      }

      expect(response.data).toBe('test data')
      expect(response.success).toBe(true)
    })

    it('should provide GenericFormState interface', () => {
      interface FormData {
        name: string
        email: string
      }

      const formState: GenericFormState<FormData> = {
        data: { name: '', email: '' },
        errors: {},
        touched: {},
        isValid: false,
        isDirty: false,
        isSubmitting: false
      }

      expect(formState.isValid).toBe(false)
      expect(formState.isDirty).toBe(false)
    })
  })

  describe('Cross-module Integration', () => {
    
    it('should work together - constants with types', () => {
      // Test that constants can be used with generic types
      const employeeOptions: SelectOption[] = EMPLOYEE_TYPES
      
      expect(employeeOptions.length).toBeGreaterThan(0)
      expect(employeeOptions[0]).toHaveProperty('value')
      expect(employeeOptions[0]).toHaveProperty('label')
    })

    it('should work together - TabPanel with constants', () => {
      // Test TabPanel with constant values
      render(
        <TabPanel value={0} index={0} idPrefix="employee">
          <div>{ACTIONS.CREATE}</div>
        </TabPanel>
      )

      expect(screen.getByText('Crear')).toBeInTheDocument()
    })

    it('should maintain type safety across consolidations', () => {
      interface Employee extends BaseEntity {
        name: string
        type: string
      }

      const createEmployee: CreateData<Employee> = {
        name: 'John Doe',
        type: 'operario',
        is_active: true
      }

      // Should be able to use with constants
      const employeeType = EMPLOYEE_TYPES.find(t => t.value === createEmployee.type)
      expect(employeeType?.label).toBe('Operario')
    })
  })

  describe('Backward Compatibility', () => {
    
    it('should maintain existing API surfaces', () => {
      // Ensure old import paths still work (if any)
      expect(TabPanel).toBeDefined()
      expect(ACTIONS).toBeDefined()
      expect(STATUS).toBeDefined()
    })

    it('should provide all expected exports from shared module', () => {
      // Test that main exports are available
      expect(ACTIONS).toBeDefined()
      expect(STATUS).toBeDefined()
      expect(VALIDATION_MESSAGES).toBeDefined()
      expect(EMPLOYEE_TYPES).toBeDefined()
      expect(PRODUCT_CATEGORIES).toBeDefined()
    })
  })

  describe('Performance Tests', () => {
    
    it('should not cause circular dependencies', () => {
      // Import all consolidated modules
      expect(() => {
        require('../constants')
        require('../types')
        require('../components')
      }).not.toThrow()
    })

    it('should have efficient constant lookups', () => {
      const start = performance.now()
      
      // Simulate heavy constant usage
      for (let i = 0; i < 1000; i++) {
        EMPLOYEE_TYPES.find(t => t.value === 'operario')
        MONTHS.find(m => m.value === '6')
        BANKS.find(b => b.value === 'bancolombia')
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete quickly (under 100ms for 1000 iterations)
      expect(duration).toBeLessThan(100)
    })
  })

  describe('Error Handling', () => {
    
    it('should handle missing TabPanel props gracefully', () => {
      // Test with minimal props
      const { container } = render(
        <TabPanel value={0} index={1}>
          <div>Hidden content</div>
        </TabPanel>
      )
      
      expect(container.querySelector('[role="tabpanel"]')).toHaveAttribute('hidden')
    })

    it('should provide default values for optional constants', () => {
      // Test that constants provide reasonable defaults
      expect(typeof ACTIONS.LOADING).toBe('string')
      expect(ACTIONS.LOADING.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Test Utilities for consolidation testing
 */
export const consolidationTestUtils = {
  /**
   * Verify that a constant array has the expected SelectOption structure
   */
  validateSelectOptionArray: (options: SelectOption[], expectedLength?: number) => {
    expect(Array.isArray(options)).toBe(true)
    if (expectedLength) {
      expect(options).toHaveLength(expectedLength)
    }
    
    options.forEach(option => {
      expect(option).toHaveProperty('value')
      expect(option).toHaveProperty('label')
      expect(typeof option.value).toBe('string')
      expect(typeof option.label).toBe('string')
    })
  },

  /**
   * Verify that an entity matches BaseEntity structure
   */
  validateBaseEntity: (entity: BaseEntity) => {
    expect(entity).toHaveProperty('id')
    expect(typeof entity.id).toBe('number')
    
    if (entity.created_at) {
      expect(typeof entity.created_at).toBe('string')
    }
    
    if (entity.is_active !== undefined) {
      expect(typeof entity.is_active).toBe('boolean')
    }
  },

  /**
   * Test TabPanel rendering with various configurations
   */
  testTabPanelConfigurations: (configurations: TabPanelProps[]) => {
    configurations.forEach((config, index) => {
      const { rerender } = render(<TabPanel {...config} />)
      
      const tabpanel = screen.getByRole('tabpanel')
      expect(tabpanel).toBeInTheDocument()
      
      if (config.value === config.index) {
        expect(tabpanel).not.toHaveAttribute('hidden')
      } else {
        expect(tabpanel).toHaveAttribute('hidden')
      }
      
      rerender(<></>)
    })
  }
}
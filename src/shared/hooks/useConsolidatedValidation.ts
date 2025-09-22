/**
 * Consolidated Validation Hook - Story 2.6: Validation System Unification
 * 
 * Unified validation hook that replaces 8+ individual validation hooks.
 * Uses validation factory and common validators for consistency.
 */

import { useMemo } from 'react'
import createValidationFactory from '../validation/createValidationFactory'
import { getValidationSchema, type EntityType, type EntityValidationData } from '../validation/entitySchemas'
import { validEmail, validPhone } from '../validation/commonValidators'
import type { ValidationResult, FieldValidationResult } from '../validation/createValidationFactory'

/**
 * Consolidated validation hook for all entities
 */
export function useConsolidatedValidation<T extends EntityType>(entityType: T) {
  const validator = useMemo(() => {
    const schema = getValidationSchema(entityType)
    return createValidationFactory({
      entityName: entityType,
      schema,
      skipUndefined: true
    })
  }, [entityType])

  return {
    /**
     * Validate complete entity data
     */
    validateData: (data: EntityValidationData<T>): ValidationResult => {
      return validator.validateData(data)
    },

    /**
     * Validate single field
     */
    validateField: <K extends keyof EntityValidationData<T>>(
      field: K,
      value: EntityValidationData<T>[K]
    ): FieldValidationResult => {
      return validator.validateField(field, value)
    },

    /**
     * Get validation schema
     */
    getSchema: () => validator.getSchema(),

    /**
     * Create custom validator with additional rules
     */
    createCustomValidator: validator.createCustomValidator,

    /**
     * Entity name for reference
     */
    entityName: entityType
  }
}

/**
 * Specific entity validation hooks (for backward compatibility)
 */

// useProductValidation moved to useConsolidatedProducts.ts to avoid conflicts

export function useEmployeeValidation() {
  const validation = useConsolidatedValidation('employee')
  
  return {
    validateEmployeeData: validation.validateData,
    validateEmail: (email: string) => validEmail(email),
    validatePhone: (phone: string) => validPhone(phone),
    validateField: validation.validateField
  }
}

// useSupplierValidation moved to useConsolidatedSuppliers.ts to avoid conflicts

// useMachineryValidation moved to useConsolidatedMachinery.ts to avoid conflicts

// useTransportValidation moved to useConsolidatedTransport.ts to avoid conflicts

// useCategoryValidation moved to useConsolidatedCategories.ts to avoid conflicts

export function useClientValidation() {
  const validation = useConsolidatedValidation('client')
  
  return {
    validateClientData: validation.validateData,
    validateEmail: (email: string) => validEmail(email),
    validatePhone: (phone: string) => validPhone(phone),
    validateField: validation.validateField
  }
}

export function useQuoteValidation() {
  const validation = useConsolidatedValidation('quote')
  
  return {
    validateQuoteData: validation.validateData,
    validateField: validation.validateField
  }
}

/**
 * Generic field validators (commonly used standalone)
 */
export function useFieldValidators() {
  return {
    validateEmail: (email: string) => validEmail(email),
    validatePhone: (phone: string) => validPhone(phone),
    validateRequired: (value: any) => value !== null && value !== undefined && value !== '',
    validatePositive: (value: number) => !isNaN(value) && value > 0,
    validatePercentage: (value: number) => !isNaN(value) && value >= 0 && value <= 100
  }
}

/**
 * Batch validation hook - validate multiple entities at once
 */
export function useBatchValidation<T extends EntityType>(entityType: T) {
  const validation = useConsolidatedValidation(entityType)
  
  return {
    validateBatch: (entities: EntityValidationData<T>[]) => {
      const results = entities.map(entity => validation.validateData(entity))
      const hasErrors = results.some(result => !result.isValid)
      const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0)
      
      return {
        results,
        hasErrors,
        totalErrors,
        validEntities: entities.filter((_, index) => results[index].isValid),
        invalidEntities: entities.filter((_, index) => !results[index].isValid)
      }
    }
  }
}

/**
 * Form integration hook - works with createEntityForm
 */
export function useFormValidation<T extends EntityType>(entityType: T) {
  const validation = useConsolidatedValidation(entityType)
  
  return {
    // Convert validation result to form-compatible format
    validateFormData: (formData: EntityValidationData<T>) => {
      const result = validation.validateData(formData)
      
      // Convert to field-specific errors for form compatibility
      const fieldErrors: Record<string, string> = {}
      result.errors.forEach(error => {
        const [field, ...messageParts] = error.split(': ')
        fieldErrors[field] = messageParts.join(': ')
      })
      
      return fieldErrors
    },
    
    // Validate single field for real-time validation
    validateField: validation.validateField
  }
}

export default useConsolidatedValidation
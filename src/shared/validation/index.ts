/**
 * Validation Module - Story 2.6: Validation System Unification
 * 
 * Central exports for the unified validation system.
 * Replaces 15+ duplicate validation patterns across the application.
 */

// Core validation factory
export { default as createValidationFactory } from './createValidationFactory'
export type {
  ValidationResult,
  FieldValidationResult,
  ValidationRule,
  ValidationSchema,
  ValidationConfig
} from './createValidationFactory'

export {
  validateBatch,
  createValidationPipeline,
  createConditionalValidator,
  ValidationMessages
} from './createValidationFactory'

// Common validators
export * from './commonValidators'

// Entity schemas
export * from './entitySchemas'

// Convenience re-exports for most commonly used patterns
export {
  useConsolidatedValidation,
  useEmployeeValidation,
  useClientValidation,
  useQuoteValidation,
  useFieldValidators,
  useBatchValidation,
  useFormValidation
} from '../hooks/useConsolidatedValidation'

// Entity-specific validation hooks moved to respective entity files to avoid conflicts
export { useProductValidation } from '../hooks/useConsolidatedProducts'
export { useSupplierValidation } from '../hooks/useConsolidatedSuppliers'
export { useMachineryValidation } from '../hooks/useConsolidatedMachinery'
export { useTransportValidation } from '../hooks/useConsolidatedTransport'
export { useCategoryValidation } from '../hooks/useConsolidatedCategories'

/**
 * Quick validation utilities for common use cases
 */
export const QuickValidators = {
  // Quick entity validation - returns boolean
  isValidProduct: (data: any) => {
    const { productValidationSchema } = require('./entitySchemas')
    const factory = require('./createValidationFactory').default({
      entityName: 'product',
      schema: productValidationSchema
    })
    return factory.validateData(data).isValid
  },

  isValidEmployee: (data: any) => {
    const { employeeValidationSchema } = require('./entitySchemas')
    const factory = require('./createValidationFactory').default({
      entityName: 'employee',
      schema: employeeValidationSchema
    })
    return factory.validateData(data).isValid
  },

  // Quick field validation - returns boolean
  isValidEmail: (email: string) => {
    const { validEmail } = require('./commonValidators')
    return validEmail(email).isValid
  },

  isValidPhone: (phone: string) => {
    const { validPhone } = require('./commonValidators')
    return validPhone(phone).isValid
  },

  isPositiveNumber: (value: number) => {
    const { positiveNumber } = require('./commonValidators')
    return positiveNumber(value).isValid
  },

  isValidPercentage: (value: number) => {
    const { validPercentage } = require('./commonValidators')
    return validPercentage(value).isValid
  }
} as const

/**
 * Legacy validation utilities for backward compatibility
 * These will be deprecated in favor of the new system
 */
export const LegacyValidation = {
  validateEmail: (email: string): boolean => {
    const { validEmail } = require('./commonValidators')
    return validEmail(email).isValid
  },

  validatePhone: (phone: string): boolean => {
    const { validPhone } = require('./commonValidators')
    return validPhone(phone).isValid
  },

  // Standard validation result format for services
  createValidationResult: (isValid: boolean, errors: string[] = []): ValidationResult => ({
    isValid,
    errors
  }),

  // Helper to convert new validation result to legacy boolean
  toBooleanResult: (result: FieldValidationResult): boolean => result.isValid
} as const
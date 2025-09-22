/**
 * Validation Factory - Story 2.6: Validation System Unification
 * 
 * Generates standardized validation functions to eliminate 15+ duplicate patterns.
 * Creates type-safe, reusable validation logic with consistent error messages.
 */

/**
 * Standard validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Individual field validation result
 */
export interface FieldValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validation rule function type
 */
export type ValidationRule<T = any> = (value: T, context?: any) => FieldValidationResult

/**
 * Validation schema definition
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule<T[K]>[]
}

/**
 * Validation configuration for entity
 */
export interface ValidationConfig<T> {
  entityName: string
  schema: ValidationSchema<T>
  customMessages?: Record<string, string>
  skipUndefined?: boolean
  contextProvider?: (data: T) => any
}

/**
 * Creates a validation factory for a specific entity type
 */
export function createValidationFactory<T extends Record<string, any>>(
  config: ValidationConfig<T>
) {
  /**
   * Validate entity data against schema
   */
  function validateData(data: T): ValidationResult {
    const errors: string[] = []
    const context = config.contextProvider?.(data)
    
    for (const [field, rules] of Object.entries(config.schema)) {
      const fieldValue = (data as any)[field]
      
      // Skip validation if field is undefined and skipUndefined is true
      if (config.skipUndefined && fieldValue === undefined) {
        continue
      }
      
      if (rules && Array.isArray(rules)) {
        for (const rule of rules) {
          const result = rule(fieldValue, context)
          if (!result.isValid && result.error) {
            errors.push(`${field}: ${result.error}`)
          }
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validate single field
   */
  function validateField<K extends keyof T>(
    field: K, 
    value: T[K], 
    context?: any
  ): FieldValidationResult {
    const rules = config.schema[field]
    if (!rules || !Array.isArray(rules)) {
      return { isValid: true }
    }
    
    for (const rule of rules) {
      const result = rule(value, context)
      if (!result.isValid) {
        return result
      }
    }
    
    return { isValid: true }
  }
  
  /**
   * Get validation schema (for external use)
   */
  function getSchema(): ValidationSchema<T> {
    return config.schema
  }
  
  /**
   * Create custom validator with specific rules
   */
  function createCustomValidator(customRules: Partial<ValidationSchema<T>>) {
    const mergedSchema = { ...config.schema, ...customRules }
    return createValidationFactory({
      ...config,
      schema: mergedSchema
    })
  }
  
  return {
    validateData,
    validateField,
    getSchema,
    createCustomValidator,
    entityName: config.entityName
  }
}

/**
 * Batch validation for multiple entities
 */
export function validateBatch<T>(
  entities: T[],
  validator: ReturnType<typeof createValidationFactory<T>>
): { results: ValidationResult[]; hasErrors: boolean; totalErrors: number } {
  const results = entities.map(entity => validator.validateData(entity))
  const hasErrors = results.some(result => !result.isValid)
  const totalErrors = results.reduce((sum, result) => sum + result.errors.length, 0)
  
  return {
    results,
    hasErrors,
    totalErrors
  }
}

/**
 * Validation pipeline - allows chaining multiple validators
 */
export function createValidationPipeline<T>(...validators: ReturnType<typeof createValidationFactory<T>>[]) {
  return function validateInPipeline(data: T): ValidationResult {
    const allErrors: string[] = []
    
    for (const validator of validators) {
      const result = validator.validateData(data)
      if (!result.isValid) {
        allErrors.push(...result.errors)
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }
}

/**
 * Conditional validation - only validate if condition is met
 */
export function createConditionalValidator<T>(
  condition: (data: T) => boolean,
  validator: ReturnType<typeof createValidationFactory<T>>
) {
  return function validateConditionally(data: T): ValidationResult {
    if (!condition(data)) {
      return { isValid: true, errors: [] }
    }
    return validator.validateData(data)
  }
}

/**
 * Standard validation messages (Spanish)
 */
export const ValidationMessages = {
  REQUIRED: 'Este campo es requerido',
  MIN_LENGTH: (min: number) => `Debe tener al menos ${min} caracteres`,
  MAX_LENGTH: (max: number) => `No puede tener más de ${max} caracteres`,
  POSITIVE_NUMBER: 'Debe ser un número mayor a 0',
  NON_NEGATIVE: 'No puede ser un número negativo',
  VALID_EMAIL: 'Debe ser un email válido',
  VALID_PHONE: 'Debe ser un teléfono válido',
  VALID_PERCENTAGE: 'Debe ser un porcentaje válido (0-100)',
  VALID_URL: 'Debe ser una URL válida',
  ARRAY_NOT_EMPTY: 'Debe contener al menos un elemento',
  VALID_DATE: 'Debe ser una fecha válida',
  FUTURE_DATE: 'Debe ser una fecha futura',
  PAST_DATE: 'Debe ser una fecha pasada'
} as const

export default createValidationFactory
/**
 * Common Validators - Story 2.6: Validation System Unification
 * 
 * Reusable validation functions to eliminate duplicate validation patterns.
 * Each validator returns FieldValidationResult for consistency.
 */

import type { FieldValidationResult } from './createValidationFactory'
import { ValidationMessages } from './createValidationFactory'

/**
 * Required field validator
 */
export const required = (value: any): FieldValidationResult => {
  const isEmpty = value === null || 
    value === undefined || 
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0)
    
  return {
    isValid: !isEmpty,
    error: isEmpty ? ValidationMessages.REQUIRED : undefined
  }
}

/**
 * Minimum length validator for strings
 */
export const minLength = (min: number) => (value: string): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true } // Let required handle null/undefined
  }
  
  const trimmed = String(value).trim()
  const isValid = trimmed.length >= min
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.MIN_LENGTH(min) : undefined
  }
}

/**
 * Maximum length validator for strings
 */
export const maxLength = (max: number) => (value: string): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const trimmed = String(value).trim()
  const isValid = trimmed.length <= max
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.MAX_LENGTH(max) : undefined
  }
}

/**
 * Positive number validator (> 0)
 */
export const positiveNumber = (value: number): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const numValue = Number(value)
  const isValid = !isNaN(numValue) && numValue > 0
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.POSITIVE_NUMBER : undefined
  }
}

/**
 * Non-negative number validator (>= 0)
 */
export const nonNegativeNumber = (value: number): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const numValue = Number(value)
  const isValid = !isNaN(numValue) && numValue >= 0
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.NON_NEGATIVE : undefined
  }
}

/**
 * Valid percentage validator (0-100)
 */
export const validPercentage = (value: number): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const numValue = Number(value)
  const isValid = !isNaN(numValue) && numValue >= 0 && numValue <= 100
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.VALID_PERCENTAGE : undefined
  }
}

/**
 * Email validator
 */
export const validEmail = (value: string): FieldValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: true } // Let required handle empty values
  }
  
  // Standard email regex (same as used in existing services)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValid = emailRegex.test(value.trim())
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.VALID_EMAIL : undefined
  }
}

/**
 * Phone validator (Colombian format)
 */
export const validPhone = (value: string): FieldValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: true }
  }
  
  // Colombian phone validation (from existing services)
  const phone = value.trim()
  const digitsOnly = phone.replace(/\D/g, '')
  
  // Accept various formats: +57 300 123 4567, 3001234567, etc.
  const isValid = digitsOnly.length >= 7 && digitsOnly.length <= 13
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.VALID_PHONE : undefined
  }
}

/**
 * URL validator
 */
export const validUrl = (value: string): FieldValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: true }
  }
  
  try {
    new URL(value)
    return { isValid: true }
  } catch {
    return {
      isValid: false,
      error: ValidationMessages.VALID_URL
    }
  }
}

/**
 * Non-empty array validator
 */
export const arrayNotEmpty = (value: any[]): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const isValid = Array.isArray(value) && value.length > 0
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.ARRAY_NOT_EMPTY : undefined
  }
}

/**
 * Valid date validator
 */
export const validDate = (value: string | Date): FieldValidationResult => {
  if (!value) {
    return { isValid: true }
  }
  
  const date = value instanceof Date ? value : new Date(value)
  const isValid = !isNaN(date.getTime())
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.VALID_DATE : undefined
  }
}

/**
 * Future date validator
 */
export const futureDate = (value: string | Date): FieldValidationResult => {
  if (!value) {
    return { isValid: true }
  }
  
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: ValidationMessages.VALID_DATE }
  }
  
  const isValid = date.getTime() > Date.now()
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.FUTURE_DATE : undefined
  }
}

/**
 * Past date validator
 */
export const pastDate = (value: string | Date): FieldValidationResult => {
  if (!value) {
    return { isValid: true }
  }
  
  const date = value instanceof Date ? value : new Date(value)
  if (isNaN(date.getTime())) {
    return { isValid: false, error: ValidationMessages.VALID_DATE }
  }
  
  const isValid = date.getTime() < Date.now()
  
  return {
    isValid,
    error: !isValid ? ValidationMessages.PAST_DATE : undefined
  }
}

/**
 * Numeric range validator
 */
export const inRange = (min: number, max: number) => (value: number): FieldValidationResult => {
  if (value === null || value === undefined) {
    return { isValid: true }
  }
  
  const numValue = Number(value)
  if (isNaN(numValue)) {
    return { isValid: false, error: 'Debe ser un número válido' }
  }
  
  const isValid = numValue >= min && numValue <= max
  
  return {
    isValid,
    error: !isValid ? `Debe estar entre ${min} y ${max}` : undefined
  }
}

/**
 * String length range validator
 */
export const lengthRange = (min: number, max: number) => (value: string): FieldValidationResult => {
  if (!value) {
    return { isValid: true }
  }
  
  const trimmed = value.trim()
  const length = trimmed.length
  const isValid = length >= min && length <= max
  
  return {
    isValid,
    error: !isValid ? `Debe tener entre ${min} y ${max} caracteres` : undefined
  }
}

/**
 * Custom regex validator
 */
export const matchesRegex = (regex: RegExp, message: string) => (value: string): FieldValidationResult => {
  if (!value || value.trim() === '') {
    return { isValid: true }
  }
  
  const isValid = regex.test(value)
  
  return {
    isValid,
    error: !isValid ? message : undefined
  }
}

/**
 * Composite validator - all rules must pass
 */
export const allOf = (...validators: ((value: any) => FieldValidationResult)[]) => 
  (value: any): FieldValidationResult => {
    for (const validator of validators) {
      const result = validator(value)
      if (!result.isValid) {
        return result
      }
    }
    return { isValid: true }
  }

/**
 * Composite validator - at least one rule must pass
 */
export const anyOf = (...validators: ((value: any) => FieldValidationResult)[]) =>
  (value: any): FieldValidationResult => {
    const errors: string[] = []
    
    for (const validator of validators) {
      const result = validator(value)
      if (result.isValid) {
        return { isValid: true }
      }
      if (result.error) {
        errors.push(result.error)
      }
    }
    
    return {
      isValid: false,
      error: `Debe cumplir al menos una de las siguientes condiciones: ${errors.join(', ')}`
    }
  }

/**
 * Conditional validator - only validate if condition is met
 */
export const when = (
  condition: (value: any, context?: any) => boolean,
  validator: (value: any) => FieldValidationResult
) => (value: any, context?: any): FieldValidationResult => {
  if (!condition(value, context)) {
    return { isValid: true }
  }
  return validator(value)
}

// Export commonly used validator combinations
export const RequiredValidators = {
  /** Required string with minimum length */
  requiredString: (minLen: number = 2) => allOf(required, minLength(minLen)),
  /** Required positive number */
  requiredPositiveNumber: allOf(required, positiveNumber),
  /** Required email */
  requiredEmail: allOf(required, validEmail),
  /** Required phone */
  requiredPhone: allOf(required, validPhone),
  /** Required non-empty array */
  requiredArray: allOf(required, arrayNotEmpty),
  /** Required percentage */
  requiredPercentage: allOf(required, validPercentage)
} as const
/**
 * Entity Validation Schemas - Story 2.6: Validation System Unification
 * 
 * Centralized validation schemas for all entities using common validators.
 * Replaces duplicate validation logic across 15+ service files.
 */

import {
  required,
  minLength,
  maxLength,
  positiveNumber,
  nonNegativeNumber,
  validPercentage,
  validEmail,
  validPhone,
  validUrl,
  arrayNotEmpty,
  lengthRange,
  RequiredValidators
} from './commonValidators'
import type { ValidationSchema } from './createValidationFactory'

// ============================================================================
// PRODUCT VALIDATION SCHEMA
// ============================================================================

export interface ProductValidationData {
  name: string
  category_id: number
  subcategory?: string
  unit: string
  base_price: number
  cost_price?: number
  minimum_order: number
  description?: string
  ingredients?: string[]
  allergens?: string[]
  image_url?: string
}

export const productValidationSchema: ValidationSchema<ProductValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  category_id: [RequiredValidators.requiredPositiveNumber],
  subcategory: [maxLength(100)],
  unit: [RequiredValidators.requiredString(1)],
  base_price: [RequiredValidators.requiredPositiveNumber],
  cost_price: [nonNegativeNumber],
  minimum_order: [RequiredValidators.requiredPositiveNumber],
  description: [maxLength(500)],
  image_url: [validUrl]
}

// ============================================================================
// SUPPLIER VALIDATION SCHEMA
// ============================================================================

export interface SupplierValidationData {
  name: string
  type: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  payment_terms_days?: number
  advance_payment_percentage?: number
  commission_percentage?: number
}

export const supplierValidationSchema: ValidationSchema<SupplierValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  type: [required],
  contact_person: [minLength(2)],
  email: [validEmail],
  phone: [validPhone],
  address: [maxLength(200)],
  payment_terms_days: [nonNegativeNumber],
  advance_payment_percentage: [validPercentage],
  commission_percentage: [validPercentage]
}

// ============================================================================
// EMPLOYEE VALIDATION SCHEMA
// ============================================================================

export interface EmployeeValidationData {
  name: string
  employee_type: string
  category_id?: number
  phone?: string
  email?: string
  identification_number?: string
  address?: string
  certifications?: string[]
}

export const employeeValidationSchema: ValidationSchema<EmployeeValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  employee_type: [required],
  category_id: [positiveNumber],
  phone: [validPhone],
  email: [validEmail],
  identification_number: [lengthRange(6, 15)],
  address: [maxLength(200)]
}

// ============================================================================
// MACHINERY VALIDATION SCHEMA
// ============================================================================

export interface MachineryValidationData {
  name: string
  category: string
  description?: string
  hourly_rate?: number
  daily_rate?: number
  specifications?: string
  capacity?: string
}

export const machineryValidationSchema: ValidationSchema<MachineryValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  category: [required],
  description: [maxLength(500)],
  hourly_rate: [positiveNumber],
  daily_rate: [positiveNumber],
  specifications: [maxLength(1000)],
  capacity: [maxLength(100)]
}

// ============================================================================
// TRANSPORT VALIDATION SCHEMA
// ============================================================================

export interface TransportValidationData {
  name: string
  base_cost: number
  estimated_travel_time_minutes?: number
  description?: string
  max_distance_km?: number
}

export const transportValidationSchema: ValidationSchema<TransportValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  base_cost: [RequiredValidators.requiredPositiveNumber],
  estimated_travel_time_minutes: [positiveNumber],
  description: [maxLength(300)],
  max_distance_km: [positiveNumber]
}

// ============================================================================
// CATEGORY VALIDATION SCHEMA  
// ============================================================================

export interface CategoryValidationData {
  name: string
  category_type?: string
  description?: string
  icon?: string
  color?: string
  pricing_type?: 'plana' | 'flexible'
  flat_rate?: number
  min_experience_months?: number
}

export const categoryValidationSchema: ValidationSchema<CategoryValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  category_type: [required],
  description: [maxLength(300)],
  icon: [maxLength(50)],
  color: [maxLength(20)],
  flat_rate: [positiveNumber],
  min_experience_months: [nonNegativeNumber]
}

// ============================================================================
// CLIENT VALIDATION SCHEMA
// ============================================================================

export interface ClientValidationData {
  name: string
  type?: string
  contact_person?: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
}

export const clientValidationSchema: ValidationSchema<ClientValidationData> = {
  name: [RequiredValidators.requiredString(2)],
  type: [required],
  contact_person: [minLength(2)],
  email: [validEmail],
  phone: [validPhone],
  address: [maxLength(200)],
  tax_id: [lengthRange(6, 15)]
}

// ============================================================================
// QUOTE VALIDATION SCHEMA
// ============================================================================

export interface QuoteValidationData {
  event_title: string
  client_id: number
  event_date?: string
  estimated_attendees?: number
  venue_address?: string
  notes?: string
}

export const quoteValidationSchema: ValidationSchema<QuoteValidationData> = {
  event_title: [RequiredValidators.requiredString(3)],
  client_id: [RequiredValidators.requiredPositiveNumber],
  estimated_attendees: [positiveNumber],
  venue_address: [maxLength(300)],
  notes: [maxLength(1000)]
}

// ============================================================================
// SCHEMA REGISTRY - Easy access to all schemas
// ============================================================================

export const ValidationSchemas = {
  product: productValidationSchema,
  supplier: supplierValidationSchema,
  employee: employeeValidationSchema,
  machinery: machineryValidationSchema,
  transport: transportValidationSchema,
  category: categoryValidationSchema,
  client: clientValidationSchema,
  quote: quoteValidationSchema
} as const

export type EntityType = keyof typeof ValidationSchemas
export type EntityValidationData<T extends EntityType> = 
  T extends 'product' ? ProductValidationData :
  T extends 'supplier' ? SupplierValidationData :
  T extends 'employee' ? EmployeeValidationData :
  T extends 'machinery' ? MachineryValidationData :
  T extends 'transport' ? TransportValidationData :
  T extends 'category' ? CategoryValidationData :
  T extends 'client' ? ClientValidationData :
  T extends 'quote' ? QuoteValidationData :
  never

/**
 * Get validation schema by entity type
 */
export function getValidationSchema<T extends EntityType>(
  entityType: T
): ValidationSchema<EntityValidationData<T>> {
  return ValidationSchemas[entityType] as ValidationSchema<EntityValidationData<T>>
}

/**
 * Entity-specific validation utilities
 */
export const EntityValidationUtils = {
  /**
   * Validate employee type enum
   */
  validateEmployeeType: (type: string) => {
    const validTypes = ['operario', 'chef', 'mesero', 'supervisor', 'conductor']
    return validTypes.includes(type)
  },

  /**
   * Validate product pricing type
   */
  validatePricingType: (type: string) => {
    const validTypes = ['unit', 'measurement', 'weight']
    return validTypes.includes(type)
  },

  /**
   * Validate supplier type
   */
  validateSupplierType: (type: string) => {
    const validTypes = ['equipment', 'food', 'service', 'transport', 'venue']
    return validTypes.includes(type)
  },

  /**
   * Validate machinery category
   */
  validateMachineryCategory: (category: string) => {
    const validCategories = ['cocina', 'servicio', 'transporte', 'sonido', 'decoracion']
    return validCategories.includes(category)
  }
} as const
/**
 * Consolidated Constants
 * 
 * Central export point for all shared constants.
 * Replaces duplicated constants across components.
 */

// UI Constants
export * from './ui'

// Common Data Constants  
export * from './common'

// Domain-specific Constants (using specific exports to avoid conflicts)

// Re-export specific commonly used constants for convenience
export { ACTIONS, STATUS, FORM_LABELS, VALIDATION_MESSAGES, CONFIRMATIONS, SUCCESS_MESSAGES, ERROR_MESSAGES, EMPTY_STATES } from './ui'
export { MONTHS, BANKS, ACCOUNT_TYPES, DOCUMENT_TYPES, CITIES, RELATIONSHIPS, PHONE_PREFIXES, PRIORITIES, UNITS, CATEGORY_COLORS } from './common'

// Employee constants
export { 
  EMPLOYEE_TYPES, 
  EMPLOYEE_CERTIFICATIONS, 
  EMPLOYEE_RATE_TEMPLATES,
  ARL_PROVIDERS,
  DEFAULT_HOURLY_RATES,
  getEmployeeRateTemplate,
  getEmployeeTypeInfo,
  COMMON_ICONS,
  COMMON_COLORS,
  COMMON_CERTIFICATIONS,
  COMMON_SKILLS,
  COMMON_EQUIPMENT as EMPLOYEE_COMMON_EQUIPMENT,
  CATEGORY_TYPES,
  TAB_LABELS,
  DEFAULT_FORM_VALUES,
  PRICING_TYPES as EMPLOYEE_PRICING_TYPES
} from './employees'

// Product constants  
export { 
  PRODUCT_CATEGORIES, 
  PRICING_TYPES, 
  PRODUCT_UNITS,
  ALL_PRODUCT_UNITS,
  COMMON_EQUIPMENT,
  COMMON_ALLERGENS, 
  NUTRITIONAL_CATEGORIES,
  PRODUCT_CONDITIONS,
  STORAGE_REQUIREMENTS,
  getUnitsByPricingType,
  defaultFormData as defaultProductFormData,
  getProductCategoryInfo
} from './products'
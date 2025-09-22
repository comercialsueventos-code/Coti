/**
 * Consolidated Type Definitions
 * 
 * Shared types that replace duplicated type definitions across the app.
 */

// Re-export TabPanelProps from components for backward compatibility
export type { TabPanelProps } from '../components/TabPanel'

/**
 * Common form mode types
 */
export type FormMode = 'create' | 'edit'

/**
 * Common dialog props pattern
 */
export interface BaseDialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Common entity dialog props
 */
export interface EntityDialogProps<T = any> extends BaseDialogProps {
  entity?: T | null
  isEdit?: boolean
}

/**
 * Common page state pattern for tab-based pages
 */
export interface TabPageState {
  currentTab: number
  createDialogOpen: boolean
  editDialogOpen: boolean
  selectedEntity: any | null
}

/**
 * Common page actions pattern for tab-based pages
 */
export interface TabPageActions {
  setCurrentTab: (tab: number) => void
  setCreateDialogOpen: (open: boolean) => void
  setEditDialogOpen: (open: boolean) => void
  setSelectedEntity: (entity: any | null) => void
}

/**
 * Common tab content props pattern
 */
export interface BaseTabProps {
  onEdit: (entity: any) => void
  onDelete: (id: number) => Promise<void>
}

/**
 * Common option type for select components
 */
export interface SelectOption {
  value: string
  label: string
  icon?: string
  disabled?: boolean
}

/**
 * Common search/filter state
 */
export interface FilterState {
  searchTerm: string
  selectedCategory: string
  selectedType: string
}

/**
 * Common sort configuration
 */
export interface SortConfig {
  field: string
  direction: 'asc' | 'desc'
}

/**
 * Generic Entity Base - common fields for all entities
 */
export interface BaseEntity {
  id: number
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

/**
 * Generic Create Data - omit database-generated fields
 */
export type CreateData<T extends BaseEntity> = Omit<T, 'id' | 'created_at' | 'updated_at'>

/**
 * Generic Update Data - make all fields optional except ID
 */
export type UpdateData<T extends BaseEntity> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>

/**
 * Generic API Response wrapper
 */
export interface ApiResponse<T = any> {
  data: T
  success: boolean
  message?: string
  error?: string
}

/**
 * Generic List Response with pagination
 */
export interface ListResponse<T> {
  data: T[]
  total: number
  page?: number
  limit?: number
  hasMore?: boolean
}

/**
 * Generic Entity Filters - common filter patterns
 */
export interface BaseEntityFilters {
  search?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
  order_by?: string
  order_direction?: 'asc' | 'desc'
}

/**
 * Generic Form State - common form patterns
 */
export interface GenericFormState<T> {
  data: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isValid: boolean
  isDirty: boolean
  isSubmitting: boolean
}

/**
 * Generic Form Actions - common form actions
 */
export interface GenericFormActions<T> {
  setValue: (field: keyof T, value: any) => void
  setError: (field: keyof T, error: string) => void
  clearError: (field: keyof T) => void
  setTouched: (field: keyof T, touched?: boolean) => void
  reset: () => void
  validate: () => boolean
  submit: () => Promise<void>
}

/**
 * Generic Query Configuration
 */
export interface QueryConfig {
  select?: string
  orderBy?: string
  ascending?: boolean
  limit?: number
  offset?: number
}

/**
 * Generic Mutation Options
 */
export interface MutationOptions<T = any> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  onSettled?: (data?: T, error?: Error) => void
}

/**
 * Generic Validation Rule
 */
export interface ValidationRule<T> {
  field: keyof T
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
  message?: string
}

/**
 * Generic Category/Type Configuration
 */
export interface CategoryConfig {
  value: string
  label: string
  icon?: string
  color?: string
  description?: string
  isDefault?: boolean
}

/**
 * Generic Status Configuration
 */
export interface StatusConfig {
  value: string
  label: string
  color?: string
  description?: string
}

/**
 * Generic Audit Fields - for entities with audit trail
 */
export interface AuditFields {
  created_by?: number
  updated_by?: number
  deleted_by?: number
  deleted_at?: string
}

/**
 * Generic Metadata Fields - for entities with additional metadata
 */
export interface MetadataFields {
  metadata?: Record<string, any>
  tags?: string[]
  notes?: string
}

/**
 * Generic Contact Information Pattern
 */
export interface ContactInfo {
  name: string
  email?: string
  phone?: string
  relationship?: string
}

/**
 * Generic Address Pattern
 */
export interface Address {
  street?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

/**
 * Generic File Upload Response
 */
export interface FileUploadResponse {
  url: string
  filename: string
  size: number
  mimetype: string
}

/**
 * Generic Pagination State
 */
export interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Generic Table Column Definition
 */
export interface TableColumn<T = any> {
  key: keyof T
  label: string
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, row: T) => React.ReactNode
}

/**
 * Generic Loading State
 */
export interface LoadingState {
  isLoading: boolean
  isError: boolean
  error?: Error | null
  isSuccess: boolean
  data?: any
}

/**
 * Helper type to make specific fields required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Helper type to make specific fields optional
 */
export type PartialFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/**
 * Helper type for deep partial (makes all nested fields optional)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/**
 * Helper type to extract the value type from SelectOption arrays
 */
export type SelectOptionValue<T extends ReadonlyArray<SelectOption>> = T[number]['value']

/**
 * Domain-specific Form Data Types
 */

/**
 * Product Form Data - consolidated from components/products/types
 */
export interface ProductFormData {
  category: string // Deprecated: usar category_id
  category_id?: number
  subcategory: string
  name: string
  description: string
  pricing_type: 'unit' | 'measurement'
  base_price: number
  unit: string
  requires_equipment: boolean
  equipment_needed: string[]
  preparation_time_minutes: number
  shelf_life_hours: number
  ingredients: string[]
  allergens: string[]
  nutritional_info: Record<string, any>
  supplier_info: Record<string, any>
  cost_price: number
  minimum_order: number
  is_seasonal: boolean
  seasonal_months: number[]
  image_url: string
  is_active: boolean
}

/**
 * Product form section props - consolidated from components/products/types
 */
export interface ProductFormSectionProps {
  formData: ProductFormData
  onFormDataChange: (field: keyof ProductFormData, value: any) => void
  errors?: Record<string, string>
}

export interface ProductBasicInfoProps extends ProductFormSectionProps {}
export interface ProductPricingProps extends ProductFormSectionProps {}
export interface ProductTimesProps extends ProductFormSectionProps {}
export interface ProductEquipmentProps extends ProductFormSectionProps {}
export interface ProductIngredientsProps extends ProductFormSectionProps {}
export interface ProductSeasonalProps extends ProductFormSectionProps {}
/**
 * Component Factory Types - Story 2.7: Component Standardization
 * 
 * Core TypeScript interfaces and types for component factory system
 * Provides type-safe generation of standardized entity components
 */

import { ReactNode } from 'react'

// ============================================================================
// BASE ENTITY TYPES
// ============================================================================

export interface BaseEntity {
  id: number
  name?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface BaseFormData {
  name?: string
  [key: string]: any
}

// ============================================================================
// COMPONENT CONFIGURATION INTERFACES
// ============================================================================

/**
 * Configuration for entity component generation
 */
export interface EntityComponentConfig<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
> {
  entityName: string
  entityDisplayName: string
  entityIcon: string
  tableName?: string
  features?: ComponentFeatures
  customSections?: EntitySection<TFormData>[]
  customFields?: FieldConfig[]
  layout?: LayoutConfig
}

/**
 * Feature toggles for component generation
 */
export interface ComponentFeatures {
  createEnabled?: boolean
  editEnabled?: boolean
  deleteEnabled?: boolean
  searchEnabled?: boolean
  filtersEnabled?: boolean
  exportEnabled?: boolean
  bulkActionsEnabled?: boolean
  quickAddEnabled?: boolean
}

/**
 * Layout configuration for components
 */
export interface LayoutConfig {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
  fullWidth?: boolean
  gridCols?: number
  cardView?: boolean
  tableView?: boolean
}

// ============================================================================
// FORM COMPONENT INTERFACES
// ============================================================================

/**
 * Standardized props for entity forms
 */
export interface EntityFormProps<TEntity extends BaseEntity = BaseEntity> {
  open: boolean
  onClose: () => void
  entity?: TEntity
  mode: 'create' | 'edit'
  onSaved?: (entity: TEntity) => void
  customTitle?: string
  readOnly?: boolean
  hideActions?: boolean
}

/**
 * Form state interface
 */
export interface EntityFormState<TFormData extends BaseFormData = BaseFormData> {
  formData: TFormData
  errors: Record<string, string>
  isLoading: boolean
  isDirty: boolean
}

/**
 * Form actions interface  
 */
export interface EntityFormActions<TFormData extends BaseFormData = BaseFormData> {
  handleFormDataChange: (updates: Partial<TFormData>) => void
  handleFieldChange: (field: keyof TFormData, value: any) => void
  handleSubmit: () => void
  handleReset: () => void
  validateForm: () => boolean
}

/**
 * Entity section configuration
 */
export interface EntitySection<TFormData extends BaseFormData = BaseFormData> {
  id: string
  title: string
  icon?: string
  component: React.ComponentType<EntitySectionProps<TFormData>>
  order: number
  visible?: (formData: TFormData, mode: 'create' | 'edit') => boolean
}

/**
 * Props for entity section components
 */
export interface EntitySectionProps<TFormData extends BaseFormData = BaseFormData> {
  formData: TFormData
  onFormDataChange: (updates: Partial<TFormData>) => void
  errors: Record<string, string>
  mode: 'create' | 'edit'
  readOnly?: boolean
}

// ============================================================================
// LIST COMPONENT INTERFACES
// ============================================================================

/**
 * Standardized props for entity lists
 */
export interface EntityListProps<TEntity extends BaseEntity = BaseEntity> {
  onEditEntity?: (entity: TEntity) => void
  onCreateEntity?: () => void
  onDeleteEntity?: (entity: TEntity) => void
  showActions?: boolean
  showFilters?: boolean
  showSearch?: boolean
  customFilters?: FilterConfig[]
  customActions?: ActionConfig<TEntity>[]
  selectable?: boolean
  onSelectionChange?: (selected: TEntity[]) => void
  hideInactive?: boolean
}

/**
 * List state interface
 */
export interface EntityListState<TEntity extends BaseEntity = BaseEntity> {
  entities: TEntity[]
  loading: boolean
  error: string | null
  selectedEntities: TEntity[]
  filters: Record<string, any>
  search: string
  pagination: PaginationState
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number
  pageSize: number
  total: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  field: string
  label: string
  type: 'select' | 'text' | 'date' | 'boolean' | 'number'
  options?: { label: string; value: any }[]
  defaultValue?: any
}

/**
 * Action configuration
 */
export interface ActionConfig<TEntity extends BaseEntity = BaseEntity> {
  id: string
  label: string
  icon?: string
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  onClick: (entity: TEntity) => void
  visible?: (entity: TEntity) => boolean
  disabled?: (entity: TEntity) => boolean
}

// ============================================================================
// DIALOG COMPONENT INTERFACES
// ============================================================================

/**
 * Standardized props for quick add dialogs
 */
export interface QuickAddDialogProps<TEntity extends BaseEntity = BaseEntity> {
  open: boolean
  onClose: () => void
  onEntityCreated: (entity: TEntity) => void
  initialData?: Partial<TEntity>
  customTitle?: string
}

/**
 * Quick add configuration
 */
export interface QuickAddConfig<TFormData extends BaseFormData = BaseFormData> {
  entityName: string
  entityDisplayName: string
  icon: string
  fields: QuickAddField[]
  defaultValues?: Partial<TFormData>
  validation?: (data: Partial<TFormData>) => Record<string, string>
}

/**
 * Quick add field configuration
 */
export interface QuickAddField {
  field: string
  label: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'date'
  required?: boolean
  options?: { label: string; value: any }[]
  placeholder?: string
  helperText?: string
}

// ============================================================================
// FIELD CONFIGURATION INTERFACES
// ============================================================================

/**
 * Field configuration for dynamic forms
 */
export interface FieldConfig {
  field: string
  label: string
  type: FieldType
  section?: string
  order: number
  required?: boolean
  placeholder?: string
  helperText?: string
  options?: FieldOption[]
  validation?: FieldValidation[]
  visible?: (formData: any, mode: 'create' | 'edit') => boolean
  disabled?: (formData: any, mode: 'create' | 'edit') => boolean
}

/**
 * Field types
 */
export type FieldType = 
  | 'text' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'currency'
  | 'percentage'
  | 'select' 
  | 'multiselect'
  | 'boolean' 
  | 'date' 
  | 'datetime'
  | 'textarea'
  | 'autocomplete'
  | 'file'
  | 'color'

/**
 * Field option for selects
 */
export interface FieldOption {
  label: string
  value: any
  disabled?: boolean
  group?: string
}

/**
 * Field validation rule
 */
export interface FieldValidation {
  type: 'required' | 'email' | 'phone' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message?: string
  validator?: (value: any) => boolean | string
}

// ============================================================================
// COMPONENT FACTORY INTERFACES
// ============================================================================

/**
 * Component factory result
 */
export interface ComponentFactoryResult<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
> {
  Form: React.ComponentType<EntityFormProps<TEntity>>
  List: React.ComponentType<EntityListProps<TEntity>>
  QuickAddDialog: React.ComponentType<QuickAddDialogProps<TEntity>>
  hooks: {
    useForm: () => EntityFormState<TFormData> & EntityFormActions<TFormData>
    useList: () => EntityListState<TEntity>
  }
}

/**
 * Component generation options
 */
export interface ComponentGenerationOptions {
  generateForm?: boolean
  generateList?: boolean
  generateQuickAdd?: boolean
  generateHooks?: boolean
  customizations?: ComponentCustomizations
}

/**
 * Component customizations
 */
export interface ComponentCustomizations {
  formCustomizations?: FormCustomizations
  listCustomizations?: ListCustomizations
  dialogCustomizations?: DialogCustomizations
}

export interface FormCustomizations {
  customHeader?: ReactNode
  customFooter?: ReactNode
  customValidation?: (data: any) => Record<string, string>
  onBeforeSave?: (data: any) => Promise<any>
  onAfterSave?: (entity: any) => void
}

export interface ListCustomizations {
  customToolbar?: ReactNode
  customEmptyState?: ReactNode
  customRowActions?: ActionConfig<any>[]
  customBulkActions?: ActionConfig<any[]>[]
}

export interface DialogCustomizations {
  customHeader?: ReactNode
  customFooter?: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fullWidth?: boolean
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Entity icon mapping
 */
export type EntityIcons = Record<string, string>

/**
 * Component theme configuration
 */
export interface ComponentTheme {
  primaryColor?: string
  secondaryColor?: string
  spacing?: number
  borderRadius?: number
  shadows?: boolean
}

/**
 * Component error state
 */
export interface ComponentError {
  code: string
  message: string
  field?: string
}

/**
 * Loading state
 */
export interface LoadingState {
  loading: boolean
  loadingText?: string
}
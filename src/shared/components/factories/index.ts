/**
 * Component Factories - Story 2.7: Component Standardization
 * 
 * Central export point for all component factory functions and utilities
 * Provides consistent interface for generating standardized entity components
 */

// Core factory functions
export { default as createComponentFactory, createEntityConfig, mergeEntityConfigs, EntityConfigs } from './createComponentFactory.tsx'
export { default as createEntityForm, createDefaultSections, mergeSections } from './createEntityForm.tsx'
export { default as createEntityList } from './createEntityList.tsx'
export { default as createQuickAddDialog, createDefaultQuickAddConfig, mergeQuickAddFields } from './createQuickAddDialog.tsx'
export { 
  createEntitySection, 
  CommonSections, 
  createCustomSection, 
  mergeFields 
} from './createEntitySection.tsx'

// Type definitions
export type {
  // Core interfaces
  BaseEntity,
  BaseFormData,
  EntityComponentConfig,
  ComponentFactoryResult,
  ComponentGenerationOptions,
  
  // Feature and layout configuration
  ComponentFeatures,
  LayoutConfig,
  
  // Form component types
  EntityFormProps,
  EntityFormState,
  EntityFormActions,
  EntitySection,
  EntitySectionProps,
  
  // List component types
  EntityListProps,
  EntityListState,
  PaginationState,
  FilterConfig,
  ActionConfig,
  
  // Dialog component types
  QuickAddDialogProps,
  QuickAddConfig,
  QuickAddField,
  
  // Field configuration types
  FieldConfig,
  FieldType,
  FieldOption,
  FieldValidation,
  
  // Customization types
  ComponentCustomizations,
  FormCustomizations,
  ListCustomizations,
  DialogCustomizations,
  
  // Utility types
  EntityIcons,
  ComponentTheme,
  ComponentError,
  LoadingState
} from './types'

// Configuration interfaces for individual factories
export type {
  EntityFormConfig,
  EntityListConfig,
  QuickAddDialogConfig,
  EntitySectionConfig
} from './createEntityForm.tsx'

export type { EntityListConfig as ListConfig } from './createEntityList.tsx'
export type { QuickAddDialogConfig as QuickAddConfig } from './createQuickAddDialog.tsx'

/**
 * Quick utility functions for common use cases
 */

/**
 * Create a basic CRUD component set with minimal configuration
 * 
 * @param entityName - Name of the entity (e.g., 'product', 'client')
 * @param customizations - Optional customizations
 * @returns Complete component factory result
 */
export function createBasicEntityComponents<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  entityName: string,
  customizations: Partial<EntityComponentConfig<TEntity, TFormData>> = {}
) {
  return createComponentFactory<TEntity, TFormData>(
    EntityConfigs.basicCRUD<TEntity, TFormData>(entityName, customizations),
    {
      generateForm: true,
      generateList: true,
      generateQuickAdd: true,
      generateHooks: true
    }
  )
}

/**
 * Create form-only components (useful for embedded forms)
 * 
 * @param entityName - Name of the entity
 * @param sections - Form sections configuration
 * @param customizations - Optional customizations
 * @returns Form component only
 */
export function createFormOnlyComponents<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  entityName: string,
  sections: EntitySection<TFormData>[] = [],
  customizations: Partial<EntityComponentConfig<TEntity, TFormData>> = {}
) {
  return createComponentFactory<TEntity, TFormData>(
    EntityConfigs.basicCRUD<TEntity, TFormData>(entityName, {
      ...customizations,
      customSections: sections
    }),
    {
      generateForm: true,
      generateList: false,
      generateQuickAdd: false,
      generateHooks: false
    }
  )
}

/**
 * Create list-only components (useful for selection dialogs)
 * 
 * @param entityName - Name of the entity
 * @param fields - List fields configuration
 * @param customizations - Optional customizations
 * @returns List component only
 */
export function createListOnlyComponents<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  entityName: string,
  fields: FieldConfig[] = [],
  customizations: Partial<EntityComponentConfig<TEntity, TFormData>> = {}
) {
  return createComponentFactory<TEntity, TFormData>(
    EntityConfigs.basicCRUD<TEntity, TFormData>(entityName, {
      ...customizations,
      customFields: fields
    }),
    {
      generateForm: false,
      generateList: true,
      generateQuickAdd: false,
      generateHooks: false
    }
  )
}

/**
 * Pre-configured entity component sets for common business entities
 */
export const PredefinedComponents = {
  /**
   * Create product components with standard product fields
   */
  createProductComponents: <TProduct extends BaseEntity, TProductForm extends BaseFormData>() => {
    const productSections: EntitySection<TProductForm>[] = [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: createEntitySection(CommonSections.basicInfo([
          {
            field: 'category_id',
            label: 'Categoría',
            type: 'select',
            section: 'basic',
            order: 2,
            required: true,
            options: [] // Should be populated with categories
          }
        ])),
        order: 1
      },
      {
        id: 'pricing',
        title: 'Precios y Costos',
        icon: '💰',
        component: createEntitySection(CommonSections.pricingInfo([
          {
            field: 'unit',
            label: 'Unidad',
            type: 'select',
            section: 'pricing',
            order: 4,
            required: true,
            options: [
              { label: 'Unidad', value: 'unidad' },
              { label: 'Porción', value: 'porcion' },
              { label: 'Litro', value: 'litro' },
              { label: 'Kilo', value: 'kilo' }
            ]
          }
        ])),
        order: 2
      }
    ]
    
    return createComponentFactory<TProduct, TProductForm>(
      EntityConfigs.basicCRUD<TProduct, TProductForm>('product', {
        customSections: productSections
      })
    )
  },

  /**
   * Create employee components with standard employee fields
   */
  createEmployeeComponents: <TEmployee extends BaseEntity, TEmployeeForm extends BaseFormData>() => {
    const employeeSections: EntitySection<TEmployeeForm>[] = [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: createEntitySection(CommonSections.basicInfo()),
        order: 1
      },
      {
        id: 'contact',
        title: 'Contacto',
        icon: '📞',
        component: createEntitySection(CommonSections.contactInfo()),
        order: 2
      },
      {
        id: 'rates',
        title: 'Tarifas',
        icon: '💰',
        component: createEntitySection({
          id: 'rates',
          title: 'Tarifas por Categoría',
          icon: '💰',
          fields: [
            {
              field: 'hourly_rate',
              label: 'Tarifa por Hora',
              type: 'currency',
              section: 'rates',
              order: 1,
              required: true
            }
          ]
        }),
        order: 3
      }
    ]
    
    return createComponentFactory<TEmployee, TEmployeeForm>(
      EntityConfigs.basicCRUD<TEmployee, TEmployeeForm>('employee', {
        customSections: employeeSections
      })
    )
  },

  /**
   * Create client components with standard client fields
   */
  createClientComponents: <TClient extends BaseEntity, TClientForm extends BaseFormData>() => {
    const clientSections: EntitySection<TClientForm>[] = [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: createEntitySection(CommonSections.basicInfo([
          {
            field: 'client_type',
            label: 'Tipo de Cliente',
            type: 'select',
            section: 'basic',
            order: 2,
            options: [
              { label: 'Persona Natural', value: 'individual' },
              { label: 'Empresa', value: 'company' }
            ]
          }
        ])),
        order: 1
      },
      {
        id: 'contact',
        title: 'Contacto',
        icon: '📞',
        component: createEntitySection(CommonSections.contactInfo([
          {
            field: 'tax_id',
            label: 'NIT/Cédula',
            type: 'text',
            section: 'contact',
            order: 4
          }
        ])),
        order: 2
      }
    ]
    
    return createComponentFactory<TClient, TClientForm>(
      EntityConfigs.basicCRUD<TClient, TClientForm>('client', {
        customSections: clientSections
      })
    )
  }
}

/**
 * Validation utilities for component configurations
 */
export const ComponentValidation = {
  /**
   * Validate entity configuration for completeness
   */
  validateEntityConfig: <T extends BaseEntity, F extends BaseFormData>(
    config: EntityComponentConfig<T, F>
  ): string[] => {
    const errors: string[] = []
    
    if (!config.entityName) {
      errors.push('entityName is required')
    }
    
    if (!config.entityDisplayName) {
      errors.push('entityDisplayName is required')
    }
    
    if (!config.entityIcon) {
      errors.push('entityIcon is required')
    }
    
    // Validate sections
    if (config.customSections) {
      const sectionIds = config.customSections.map(s => s.id)
      const duplicateIds = sectionIds.filter((id, index) => sectionIds.indexOf(id) !== index)
      if (duplicateIds.length > 0) {
        errors.push(`Duplicate section IDs: ${duplicateIds.join(', ')}`)
      }
    }
    
    // Validate fields
    if (config.customFields) {
      const fieldNames = config.customFields.map(f => f.field)
      const duplicateFields = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
      if (duplicateFields.length > 0) {
        errors.push(`Duplicate field names: ${duplicateFields.join(', ')}`)
      }
    }
    
    return errors
  },
  
  /**
   * Validate field configuration
   */
  validateFieldConfig: (field: FieldConfig): string[] => {
    const errors: string[] = []
    
    if (!field.field) {
      errors.push('field name is required')
    }
    
    if (!field.label) {
      errors.push('field label is required')
    }
    
    if (!field.type) {
      errors.push('field type is required')
    }
    
    if (field.type === 'select' || field.type === 'multiselect') {
      if (!field.options || field.options.length === 0) {
        errors.push(`field ${field.field}: options are required for select fields`)
      }
    }
    
    return errors
  }
}

// Export default as the main factory function
export { default } from './createComponentFactory.tsx'
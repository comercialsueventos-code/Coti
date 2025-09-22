/**
 * Core Component Factory - Story 2.7: Component Standardization
 * 
 * Main factory function for generating standardized entity components
 * Eliminates duplication across Form, List, and Dialog components
 */

import React from 'react'
import createEntityForm from './createEntityForm.tsx'
import createEntityList from './createEntityList.tsx'
import createQuickAddDialog from './createQuickAddDialog.tsx'
import type {
  BaseEntity,
  BaseFormData,
  EntityComponentConfig,
  ComponentFactoryResult,
  ComponentGenerationOptions,
  EntityFormProps,
  EntityListProps,
  QuickAddDialogProps
} from './types'

/**
 * Default entity icons mapping
 */
const DEFAULT_ENTITY_ICONS: Record<string, string> = {
  // Core entities
  client: '🏢',
  clients: '🏢',
  employee: '👤',
  employees: '👤',
  product: '🛍️',
  products: '🛍️',
  supplier: '🚚',
  suppliers: '🚚',
  machinery: '🔧',
  machineries: '🔧',
  transport: '🚐',
  transports: '🚐',
  category: '📁',
  categories: '📁',
  quote: '💰',
  quotes: '💰',
  
  // Fallback
  default: '📦'
}

/**
 * Generate display names from entity names
 */
function generateDisplayName(entityName: string): string {
  const displayNames: Record<string, string> = {
    client: 'Cliente',
    clients: 'Clientes',
    employee: 'Empleado',
    employees: 'Empleados',
    product: 'Producto',
    products: 'Productos',
    supplier: 'Proveedor',
    suppliers: 'Proveedores',
    machinery: 'Maquinaria',
    machineries: 'Maquinaria',
    transport: 'Transporte',
    transports: 'Transporte',
    category: 'Categoría',
    categories: 'Categorías',
    quote: 'Cotización',
    quotes: 'Cotizaciones'
  }
  
  return displayNames[entityName.toLowerCase()] || 
         entityName.charAt(0).toUpperCase() + entityName.slice(1)
}

/**
 * Main component factory function
 * 
 * @param config - Entity configuration for component generation
 * @param options - Generation options and customizations
 * @returns Factory result with generated components and hooks
 */
export default function createComponentFactory<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  config: EntityComponentConfig<TEntity, TFormData>,
  options: ComponentGenerationOptions = {}
): ComponentFactoryResult<TEntity, TFormData> {
  
  // Apply defaults to configuration
  const fullConfig = applyConfigDefaults(config)
  const fullOptions = applyOptionDefaults(options)
  
  // Generate components based on options
  const components = generateComponents<TEntity, TFormData>(fullConfig, fullOptions)
  
  return {
    Form: components.Form,
    List: components.List,
    QuickAddDialog: components.QuickAddDialog,
    hooks: components.hooks
  }
}

/**
 * Apply default values to entity configuration
 */
function applyConfigDefaults<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(config: EntityComponentConfig<TEntity, TFormData>): EntityComponentConfig<TEntity, TFormData> {
  
  return {
    entityName: config.entityName,
    entityDisplayName: config.entityDisplayName || generateDisplayName(config.entityName),
    entityIcon: config.entityIcon || DEFAULT_ENTITY_ICONS[config.entityName.toLowerCase()] || DEFAULT_ENTITY_ICONS.default,
    tableName: config.tableName || config.entityName.toLowerCase(),
    
    features: {
      createEnabled: true,
      editEnabled: true,
      deleteEnabled: true,
      searchEnabled: true,
      filtersEnabled: true,
      exportEnabled: false,
      bulkActionsEnabled: false,
      quickAddEnabled: true,
      ...config.features
    },
    
    layout: {
      maxWidth: 'lg',
      fullWidth: true,
      gridCols: 12,
      cardView: true,
      tableView: false,
      ...config.layout
    },
    
    customSections: config.customSections || [],
    customFields: config.customFields || []
  }
}

/**
 * Apply default values to generation options
 */
function applyOptionDefaults(options: ComponentGenerationOptions): ComponentGenerationOptions {
  return {
    generateForm: true,
    generateList: true,
    generateQuickAdd: true,
    generateHooks: true,
    ...options
  }
}

/**
 * Generate all components based on configuration
 */
function generateComponents<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  config: EntityComponentConfig<TEntity, TFormData>,
  options: ComponentGenerationOptions
) {
  const components: any = {}
  
  // Generate Form component
  if (options.generateForm) {
    components.Form = createEntityForm<TEntity, TFormData>({
      entityName: config.entityName,
      entityDisplayName: config.entityDisplayName,
      entityIcon: config.entityIcon,
      sections: config.customSections || [],
      layout: config.layout,
      features: config.features,
      customizations: options.customizations?.formCustomizations
    })
  } else {
    // Provide placeholder component
    components.Form = React.forwardRef<any, EntityFormProps<TEntity>>((props, ref) => {
      console.warn(`Form component for ${config.entityName} not generated. Set generateForm: true to enable.`)
      return null
    })
  }
  
  // Generate List component
  if (options.generateList) {
    components.List = createEntityList<TEntity>({
      entityName: config.entityName,
      entityDisplayName: config.entityDisplayName,
      entityIcon: config.entityIcon,
      fields: config.customFields || [],
      layout: config.layout,
      features: config.features,
      customizations: options.customizations?.listCustomizations
    })
  } else {
    // Provide placeholder component
    components.List = React.forwardRef<any, EntityListProps<TEntity>>((props, ref) => {
      console.warn(`List component for ${config.entityName} not generated. Set generateList: true to enable.`)
      return null
    })
  }
  
  // Generate QuickAdd dialog component
  if (options.generateQuickAdd && config.features?.quickAddEnabled) {
    components.QuickAddDialog = createQuickAddDialog<TEntity, TFormData>({
      entityName: config.entityName,
      entityDisplayName: config.entityDisplayName,
      icon: config.entityIcon,
      fields: (config.customFields || [])
        .filter(field => field.section === 'basic' || !field.section)
        .slice(0, 5) // Limit to first 5 basic fields for quick add
        .map(field => ({
          field: field.field,
          label: field.label,
          type: field.type === 'text' ? 'text' : 
                field.type === 'number' ? 'number' :
                field.type === 'select' ? 'select' :
                field.type === 'boolean' ? 'boolean' :
                field.type === 'date' ? 'date' : 'text',
          required: field.required,
          options: field.options
        })),
      customizations: options.customizations?.dialogCustomizations
    })
  } else {
    // Provide placeholder component
    components.QuickAddDialog = React.forwardRef<any, QuickAddDialogProps<TEntity>>((props, ref) => {
      console.warn(`QuickAdd dialog for ${config.entityName} not generated. Set generateQuickAdd: true and quickAddEnabled: true to enable.`)
      return null
    })
  }
  
  // Generate hooks (placeholder for now, will be implemented in separate factories)
  if (options.generateHooks) {
    components.hooks = {
      useForm: () => {
        console.warn(`Form hook for ${config.entityName} not yet implemented. Will be generated in createEntityForm.`)
        return {} as any
      },
      useList: () => {
        console.warn(`List hook for ${config.entityName} not yet implemented. Will be generated in createEntityList.`)
        return {} as any
      }
    }
  } else {
    components.hooks = {}
  }
  
  return components
}

/**
 * Utility function to create component configuration
 * Provides a type-safe way to configure entity components
 */
export function createEntityConfig<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(config: EntityComponentConfig<TEntity, TFormData>): EntityComponentConfig<TEntity, TFormData> {
  return config
}

/**
 * Utility function to merge configurations
 * Useful for extending base configurations
 */
export function mergeEntityConfigs<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(
  baseConfig: EntityComponentConfig<TEntity, TFormData>,
  overrides: Partial<EntityComponentConfig<TEntity, TFormData>>
): EntityComponentConfig<TEntity, TFormData> {
  return {
    ...baseConfig,
    ...overrides,
    features: {
      ...baseConfig.features,
      ...overrides.features
    },
    layout: {
      ...baseConfig.layout,
      ...overrides.layout
    },
    customSections: [
      ...(baseConfig.customSections || []),
      ...(overrides.customSections || [])
    ],
    customFields: [
      ...(baseConfig.customFields || []),
      ...(overrides.customFields || [])
    ]
  }
}

/**
 * Pre-configured entity configurations for common use cases
 */
export const EntityConfigs = {
  // Basic CRUD entity (most common case)
  basicCRUD: <T extends BaseEntity, F extends BaseFormData>(
    entityName: string, 
    customizations?: Partial<EntityComponentConfig<T, F>>
  ): EntityComponentConfig<T, F> => createEntityConfig({
    entityName,
    entityDisplayName: generateDisplayName(entityName),
    entityIcon: DEFAULT_ENTITY_ICONS[entityName.toLowerCase()] || DEFAULT_ENTITY_ICONS.default,
    features: {
      createEnabled: true,
      editEnabled: true,
      deleteEnabled: true,
      searchEnabled: true,
      filtersEnabled: true,
      quickAddEnabled: true
    },
    ...customizations
  } as EntityComponentConfig<T, F>),
  
  // Read-only entity (for reference data)
  readOnly: <T extends BaseEntity, F extends BaseFormData>(
    entityName: string,
    customizations?: Partial<EntityComponentConfig<T, F>>
  ): EntityComponentConfig<T, F> => createEntityConfig({
    entityName,
    entityDisplayName: generateDisplayName(entityName),
    entityIcon: DEFAULT_ENTITY_ICONS[entityName.toLowerCase()] || DEFAULT_ENTITY_ICONS.default,
    features: {
      createEnabled: false,
      editEnabled: false,
      deleteEnabled: false,
      searchEnabled: true,
      filtersEnabled: true,
      quickAddEnabled: false
    },
    ...customizations
  } as EntityComponentConfig<T, F>),
  
  // Advanced entity (all features enabled)
  advanced: <T extends BaseEntity, F extends BaseFormData>(
    entityName: string,
    customizations?: Partial<EntityComponentConfig<T, F>>
  ): EntityComponentConfig<T, F> => createEntityConfig({
    entityName,
    entityDisplayName: generateDisplayName(entityName),
    entityIcon: DEFAULT_ENTITY_ICONS[entityName.toLowerCase()] || DEFAULT_ENTITY_ICONS.default,
    features: {
      createEnabled: true,
      editEnabled: true,
      deleteEnabled: true,
      searchEnabled: true,
      filtersEnabled: true,
      exportEnabled: true,
      bulkActionsEnabled: true,
      quickAddEnabled: true
    },
    ...customizations
  } as EntityComponentConfig<T, F>)
}
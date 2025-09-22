/**
 * Consolidated Components
 * 
 * Exports for all consolidated UI components.
 * These components replace duplicated implementations across the app.
 */

// Layout Components
export { default as TabPanel } from './TabPanel'
export type { TabPanelProps } from './TabPanel'

// Form Components
export { default as BaseForm } from './BaseForm'
export type { BaseFormProps } from './BaseForm'

// Dialog Components
export { default as EntityDialog } from './EntityDialog'
export type { EntityDialogProps, EntityDialogType } from './EntityDialog'

// List Components
export { default as EntityList, createDefaultActions } from './EntityList'
export type { EntityListProps, EntityAction } from './EntityList'

// ============================================================================
// COMPONENT FACTORIES - Story 2.7: Component Standardization
// ============================================================================

// Export all factory functions and utilities
export * from './factories'

// Main factory functions (convenience re-exports)
export {
  default as createComponentFactory,
  createBasicEntityComponents,
  createFormOnlyComponents,
  createListOnlyComponents,
  PredefinedComponents,
  ComponentValidation
} from './factories'

// Individual factory functions
export {
  createEntityForm,
  createEntityList,
  createQuickAddDialog,
  createEntitySection,
  CommonSections
} from './factories'

// Configuration utilities
export {
  createEntityConfig,
  mergeEntityConfigs,
  EntityConfigs,
  createCustomSection,
  mergeFields
} from './factories'

// Convenience re-exports
export { BaseForm, EntityDialog, EntityList, TabPanel }
export { createDefaultActions }
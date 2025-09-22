/**
 * Shared Module Exports
 * 
 * Central export point for all consolidated implementations.
 * Import consolidated versions from here to ensure consistency.
 */

// Components
export * from './components'

// Hooks
export * from './hooks'

// Services
export * from './services'

// Types  
export * from './types'

// Constants
export * from './constants'

// Utils
export * from './utils/featureFlags'

// Validation System - Story 2.6: Validation System Unification
export * from './validation'

// Convenience re-exports for common imports
export { TabPanel, BaseForm, EntityDialog, EntityList } from './components'
export { 
  // Core hooks
  useEntityCRUD, 
  useTabPage, 
  useEntityList, 
  useEntityDetail,
  useFormState,
  useAsync,
  useToggle,
  useDebounce,
  useDebouncedCallback,
  useDebouncedState,
  useLocalStorage,
  useSessionStorage,
  useStorageState,
  useModal,
  usePrevious,
  useCounter,
  useClipboard,
  useOnline,
  useWindowSize,
  useInterval,
  
  // Story 2.5: Consolidated Entity Hooks
  createEntityHooks,
  createEntityQueryKeys,
  
  // Clients hooks
  useClients,
  useClient,
  useActiveClients,
  useCreateClient,
  useUpdateClient,
  useDeleteClient,
  clientsQueryKeys,
  consolidatedClientsHooks,
  
  // Employees hooks
  useEmployees,
  useEmployee,
  useActiveEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  employeesQueryKeys,
  consolidatedEmployeesHooks,
  
  // Products hooks
  useProducts,
  useProduct,
  useActiveProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  productsQueryKeys,
  consolidatedProductsHooks,
  
  // Suppliers hooks
  useSuppliers,
  useSupplier,
  useActiveSuppliers,
  useCreateSupplier,
  useUpdateSupplier,
  useDeleteSupplier,
  suppliersQueryKeys,
  consolidatedSuppliersHooks,
  
  // Machinery hooks
  useMachinery,
  useMachineryItem,
  useActiveMachinery,
  useCreateMachinery,
  useUpdateMachinery,
  useDeleteMachinery,
  machineryQueryKeys,
  consolidatedMachineryHooks,
  
  // Transport hooks
  useTransportZones,
  useTransportZone,
  useActiveTransportZones,
  useCreateTransportZone,
  useUpdateTransportZone,
  useDeleteTransportZone,
  transportQueryKeys,
  consolidatedTransportHooks,
  
  // Categories hooks
  useCategories,
  useCategory,
  useActiveCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  categoriesQueryKeys,
  consolidatedCategoriesHooks,
  
  // Story 2.5 Sprint 4: Form & Page Hook Factories
  createEntityForm,
  createEntityPage,
  FormDataTransformers,
  createEntityFormValidator,
  defaultEntitySearch,
  defaultEntityFilter,
  
  // Consolidated Form Hooks
  useProductForm as useConsolidatedProductForm,
  useEmployeeForm as useConsolidatedEmployeeForm,
  useCategoryForm as useConsolidatedCategoryForm,
  useQuickProductForm,
  useEditProductForm,
  useQuickEmployeeForm,
  useEditEmployeeForm,
  useQuickCategoryForm,
  useEditCategoryForm,
  
  // Consolidated Page Hooks
  useMachineryPage as useConsolidatedMachineryPage,
  useSuppliersPage as useConsolidatedSuppliersPage,
  
  // Story 2.6: Consolidated Validation Hooks
  useConsolidatedValidation,
  // useProductValidation moved to products hooks to avoid conflicts
  useEmployeeValidation as useConsolidatedEmployeeValidation,
  useSupplierValidation as useConsolidatedSupplierValidation,
  useMachineryValidation as useConsolidatedMachineryValidation,
  useTransportValidation as useConsolidatedTransportValidation,
  useCategoryValidation as useConsolidatedCategoryValidation,
  useClientValidation as useConsolidatedClientValidation,
  useQuoteValidation as useConsolidatedQuoteValidation,
  useFieldValidators,
  useBatchValidation,
  useFormValidation
} from './hooks'
export { BaseEntityService, ConsolidatedClientsService, ConsolidatedEmployeesService, ConsolidatedProductsService, ConsolidatedSuppliersService, ConsolidatedMachineryService, ConsolidatedTransportService, ConsolidatedCategoriesService, services } from './services'
export { 
  // UI Constants
  ACTIONS, 
  STATUS, 
  FORM_LABELS, 
  VALIDATION_MESSAGES,
  CONFIRMATIONS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  EMPTY_STATES,
  TIME_PERIODS,
  
  // Common Data Constants
  MONTHS, 
  BANKS, 
  ACCOUNT_TYPES,
  DOCUMENT_TYPES,
  CITIES,
  RELATIONSHIPS,
  PHONE_PREFIXES,
  PRIORITIES,
  UNITS,
  CATEGORY_COLORS,
  
  // Domain-specific Constants
  EMPLOYEE_TYPES,
  EMPLOYEE_CERTIFICATIONS,
  EMPLOYEE_RATE_TEMPLATES,
  ARL_PROVIDERS,
  DEFAULT_HOURLY_RATES,
  
  PRODUCT_CATEGORIES,
  PRICING_TYPES,
  ALL_PRODUCT_UNITS,
  PRODUCT_UNITS,
  COMMON_EQUIPMENT,
  COMMON_ALLERGENS,
  PRODUCT_CONDITIONS,
  STORAGE_REQUIREMENTS,
  defaultProductFormData,
  
  // Helper Functions
  getEmployeeRateTemplate,
  getEmployeeTypeInfo,
  getUnitsByPricingType,
  getProductCategoryInfo
} from './constants'
export { isFeatureEnabled } from './utils/featureFlags'
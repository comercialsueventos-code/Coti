/**
 * Consolidated Services - Central Export Point
 * 
 * Services that use BaseEntityService to eliminate CRUD duplication
 */

// Base service for creating new consolidated services
export { default as BaseEntityService } from './BaseEntityService'
export type { EntityServiceConfig, BaseEntityFilters } from './BaseEntityService'

// Consolidated service implementations
export { default as ConsolidatedClientsService } from './ConsolidatedClientsService'
export { default as ConsolidatedEmployeesService } from './ConsolidatedEmployeesService'
export { default as ConsolidatedProductsService } from './ConsolidatedProductsService'
export { default as ConsolidatedSuppliersService } from './ConsolidatedSuppliersService'
export { default as ConsolidatedMachineryService } from './ConsolidatedMachineryService'
export { default as ConsolidatedTransportService } from './ConsolidatedTransportService'
export { default as ConsolidatedCategoriesService } from './ConsolidatedCategoriesService'

// Service instances - import and re-export
import { consolidatedClientsService } from './ConsolidatedClientsService'
import { consolidatedEmployeesService } from './ConsolidatedEmployeesService'
import { consolidatedProductsService } from './ConsolidatedProductsService'
import { consolidatedSuppliersService } from './ConsolidatedSuppliersService'
import { consolidatedMachineryService } from './ConsolidatedMachineryService'
import { consolidatedTransportService } from './ConsolidatedTransportService'
import { consolidatedCategoriesService } from './ConsolidatedCategoriesService'

// Export service instances for direct imports
export { 
  consolidatedClientsService, 
  consolidatedEmployeesService, 
  consolidatedProductsService, 
  consolidatedSuppliersService, 
  consolidatedMachineryService, 
  consolidatedTransportService, 
  consolidatedCategoriesService 
}

// Re-export for convenience
export const services = {
  clients: consolidatedClientsService,
  employees: consolidatedEmployeesService,
  products: consolidatedProductsService,
  suppliers: consolidatedSuppliersService,
  machinery: consolidatedMachineryService,
  transport: consolidatedTransportService,
  categories: consolidatedCategoriesService
}

/**
 * Factory function for creating new consolidated services
 * Note: createEntityService not implemented yet
 */

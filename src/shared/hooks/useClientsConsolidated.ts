/**
 * Consolidated Clients Hooks
 * 
 * Demonstrates how to create entity-specific hooks using the generic patterns.
 * This replaces the existing useClients.ts with a consolidated approach.
 */

import { ConsolidatedClientsService, ClientFilters } from '../services/ClientsService.consolidated'
import {
  useEntityList,
  useEntityDetail,
  useEntitySearch,
  useEntityCount,
  useEntityCreate,
  useEntityUpdate,
  useEntityDelete,
  EntityQueryKeys
} from './useEntityQuery'
import { Client, CreateClientData, UpdateClientData } from '../../types'

// Create service instance (could also be provided via context)
const clientsService = new ConsolidatedClientsService()

// Export query keys for external use
export const clientsQueryKeys = EntityQueryKeys.forEntity('clients')

/**
 * Get all clients with filtering
 * 
 * @example
 * ```typescript
 * const { data: clients, isLoading, error } = useClients({ 
 *   type: 'corporativo', 
 *   is_active: true 
 * })
 * ```
 */
export function useClients(filters?: ClientFilters) {
  return useEntityList({
    entityName: 'clients',
    service: clientsService,
    filters
  })
}

/**
 * Get single client by ID
 * 
 * @example
 * ```typescript
 * const { data: client, isLoading, error } = useClient(123)
 * ```
 */
export function useClient(id: number, select?: string) {
  return useEntityDetail({
    entityName: 'clients',
    service: clientsService,
    id,
    select
  })
}

/**
 * Search clients by text
 * 
 * @example
 * ```typescript
 * const { data: results, isLoading, refetch } = useClientSearch('acme corp')
 * ```
 */
export function useClientSearch(searchTerm: string) {
  return useEntitySearch({
    entityName: 'clients',
    service: clientsService,
    searchTerm
  })
}

/**
 * Count clients with filters
 * 
 * @example
 * ```typescript
 * const { data: count } = useClientsCount({ is_active: true })
 * ```
 */
export function useClientsCount(filters?: ClientFilters) {
  return useEntityCount({
    entityName: 'clients',
    service: clientsService,
    filters
  })
}

/**
 * Get active clients only
 * 
 * @example
 * ```typescript
 * const { data: activeClients } = useActiveClients()
 * ```
 */
export function useActiveClients() {
  return useClients({ is_active: true })
}

/**
 * Get corporate clients only
 * 
 * @example
 * ```typescript
 * const { data: corporateClients } = useCorporateClients()
 * ```
 */
export function useCorporateClients() {
  return useClients({ type: 'corporativo', is_active: true })
}

/**
 * Get social clients only
 * 
 * @example
 * ```typescript
 * const { data: socialClients } = useSocialClients()
 * ```
 */
export function useSocialClients() {
  return useClients({ type: 'social', is_active: true })
}

// --- Mutation Hooks ---

/**
 * Create client mutation
 * 
 * @example
 * ```typescript
 * const createClient = useCreateClient({
 *   onSuccess: (client) => console.log('Created:', client)
 * })
 * 
 * createClient.mutate(newClientData)
 * ```
 */
export function useCreateClient({
  onSuccess,
  onError,
}: {
  onSuccess?: (client: Client) => void
  onError?: (error: Error) => void
} = {}) {
  return useEntityCreate({
    entityName: 'clients',
    service: clientsService,
    onSuccess,
    onError
  })
}

/**
 * Update client mutation
 * 
 * @example
 * ```typescript
 * const updateClient = useUpdateClient({
 *   onSuccess: (client) => console.log('Updated:', client)
 * })
 * 
 * updateClient.mutate({ id: 123, data: updatedData })
 * ```
 */
export function useUpdateClient({
  onSuccess,
  onError,
}: {
  onSuccess?: (client: Client) => void
  onError?: (error: Error) => void
} = {}) {
  return useEntityUpdate({
    entityName: 'clients',
    service: clientsService,
    onSuccess,
    onError
  })
}

/**
 * Delete client mutation
 * 
 * @example
 * ```typescript
 * const deleteClient = useDeleteClient({
 *   onSuccess: (id) => console.log('Deleted client:', id)
 * })
 * 
 * deleteClient.mutate({ id: 123, hardDelete: false })
 * ```
 */
export function useDeleteClient({
  onSuccess,
  onError,
}: {
  onSuccess?: (id: number) => void
  onError?: (error: Error) => void
} = {}) {
  return useEntityDelete({
    entityName: 'clients',
    service: clientsService,
    onSuccess,
    onError
  })
}

// --- Client-Specific Hooks (using service methods) ---

/**
 * Get clients by city
 */
export function useClientsByCity(cityId: number) {
  return useClients({ city_id: cityId })
}

/**
 * Get clients by payment terms
 */
export function useClientsByPaymentTerms(days: number) {
  return useClients({ payment_terms_days: days })
}

/**
 * Get clients with contacts
 */
export function useClientsWithContacts() {
  return useClients({ has_contacts: true })
}

// --- Legacy Hook Compatibility ---

/**
 * Legacy compatibility hook - maintains existing API
 * @deprecated Use useClients instead
 */
export function useClientList(filters?: ClientFilters) {
  console.warn('useClientList is deprecated, use useClients instead')
  return useClients(filters)
}

/**
 * Legacy compatibility hook - maintains existing API
 * @deprecated Use useClient instead
 */
export function useClientDetail(id: number) {
  console.warn('useClientDetail is deprecated, use useClient instead')
  return useClient(id)
}
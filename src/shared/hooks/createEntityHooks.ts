/**
 * Entity Hooks Factory - Generic Hook Generator
 * 
 * Eliminates CRUD hook duplication by generating standard hooks automatically.
 * Based on BaseEntityService pattern from Story 2.4.
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import type { BaseEntityService, BaseEntityFilters } from '../services/BaseEntityService'

/**
 * Base entity interface - all entities must extend this
 */
export interface BaseEntity {
  id: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Configuration for entity hooks factory
 */
export interface EntityHooksConfig<TEntity extends BaseEntity, TCreateData, TUpdateData, TFilters extends BaseEntityFilters> {
  entityName: string
  service: BaseEntityService<TEntity, TCreateData, TUpdateData, TFilters>
  defaultStaleTime?: number
}

/**
 * Standard query keys factory
 */
export function createEntityQueryKeys<TFilters = any>(entityName: string) {
  return {
    all: [entityName] as const,
    lists: () => [...createEntityQueryKeys(entityName).all, 'list'] as const,
    list: (filters?: TFilters) => [...createEntityQueryKeys(entityName).lists(), filters] as const,
    details: () => [...createEntityQueryKeys(entityName).all, 'detail'] as const,
    detail: (id: number) => [...createEntityQueryKeys(entityName).details(), id] as const,
    search: (term: string) => [...createEntityQueryKeys(entityName).all, 'search', term] as const,
    active: () => [...createEntityQueryKeys(entityName).all, 'active'] as const,
    statistics: () => [...createEntityQueryKeys(entityName).all, 'statistics'] as const,
    // Custom keys can be added per entity
    custom: (key: string, ...params: any[]) => [...createEntityQueryKeys(entityName).all, key, ...params] as const,
  }
}

/**
 * Generic entity hooks factory
 * 
 * Usage:
 * ```typescript
 * const clientHooks = createEntityHooks({
 *   entityName: 'clients',
 *   service: consolidatedClientsService,
 * })
 * 
 * const { useClients, useClient, useCreateClient } = clientHooks
 * ```
 */
export function createEntityHooks<
  TEntity extends BaseEntity,
  TCreateData = any,
  TUpdateData = any,
  TFilters extends BaseEntityFilters = BaseEntityFilters
>(config: EntityHooksConfig<TEntity, TCreateData, TUpdateData, TFilters>) {
  
  const { entityName, service, defaultStaleTime = 5 * 60 * 1000 } = config
  const queryKeys = createEntityQueryKeys<TFilters>(entityName)

  // ============================================================================
  // QUERY HOOKS
  // ============================================================================

  /**
   * Hook to get all entities with optional filters
   * useClients, useEmployees, etc.
   */
  const useEntities = (filters?: TFilters, options?: Omit<UseQueryOptions<TEntity[]>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
      queryKey: queryKeys.list(filters),
      queryFn: () => service.getAll(filters),
      staleTime: defaultStaleTime,
      ...options,
    })
  }

  /**
   * Hook to get single entity by ID
   * useClient, useEmployee, etc.
   */
  const useEntity = (id: number, options?: Omit<UseQueryOptions<TEntity>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => service.getById(id),
      enabled: !!id,
      staleTime: defaultStaleTime,
      ...options,
    })
  }

  /**
   * Hook to get active entities only
   * useActiveClients, useActiveEmployees, etc.
   */
  const useActiveEntities = (options?: Omit<UseQueryOptions<TEntity[]>, 'queryKey' | 'queryFn'>) => {
    return useQuery({
      queryKey: queryKeys.active(),
      queryFn: () => service.getAll({ is_active: true } as TFilters),
      staleTime: defaultStaleTime,
      ...options,
    })
  }

  /**
   * Hook for search functionality
   * searchClients, searchEmployees, etc.
   */
  const useSearchEntities = (
    searchTerm: string, 
    filters?: TFilters,
    options?: Omit<UseQueryOptions<TEntity[]>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery({
      queryKey: queryKeys.search(searchTerm),
      queryFn: () => service.getAll({ ...filters, search: searchTerm } as TFilters),
      enabled: searchTerm.length >= 2,
      staleTime: 2 * 60 * 1000, // Shorter stale time for search
      ...options,
    })
  }

  // ============================================================================
  // MUTATION HOOKS
  // ============================================================================

  /**
   * Hook to create new entity
   * useCreateClient, useCreateEmployee, etc.
   */
  const useCreateEntity = (options?: UseMutationOptions<TEntity, Error, TCreateData>) => {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: (data: TCreateData) => service.create(data),
      onSuccess: (newEntity, variables) => {
        // Update detail cache
        queryClient.setQueryData(queryKeys.detail(newEntity.id), newEntity)
        
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.active() })
        
        // Run custom onSuccess if provided
        options?.onSuccess?.(newEntity, variables, undefined as any)
      },
      ...options,
    })
  }

  /**
   * Hook to update existing entity
   * useUpdateClient, useUpdateEmployee, etc.
   */
  const useUpdateEntity = (options?: UseMutationOptions<TEntity, Error, { id: number; data: TUpdateData }>) => {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: ({ id, data }: { id: number; data: TUpdateData }) => service.update(id, data),
      onSuccess: (updatedEntity, variables) => {
        // Update detail cache
        queryClient.setQueryData(queryKeys.detail(updatedEntity.id), updatedEntity)
        
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.active() })
        
        // Run custom onSuccess if provided
        options?.onSuccess?.(updatedEntity, variables, undefined as any)
      },
      ...options,
    })
  }

  /**
   * Hook to delete entity (soft delete sets is_active: false)
   * useDeleteClient, useDeleteEmployee, etc.
   */
  const useDeleteEntity = (options?: UseMutationOptions<void, Error, number>) => {
    const queryClient = useQueryClient()
    
    return useMutation({
      mutationFn: (id: number) => service.delete(id),
      onSuccess: (_, deletedId) => {
        // Remove from detail cache
        queryClient.removeQueries({ queryKey: queryKeys.detail(deletedId) })
        
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
        queryClient.invalidateQueries({ queryKey: queryKeys.active() })
        
        // Run custom onSuccess if provided
        options?.onSuccess?.(_, deletedId, undefined as any)
      },
      ...options,
    })
  }

  // ============================================================================
  // UTILITY HOOKS
  // ============================================================================

  /**
   * Hook for bulk operations
   */
  const useBulkOperations = () => {
    const queryClient = useQueryClient()

    const bulkUpdate = useMutation({
      mutationFn: async (updates: { id: number; data: TUpdateData }[]) => {
        const results = await Promise.all(
          updates.map(({ id, data }) => service.update(id, data))
        )
        return results
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
      },
    })

    const bulkDelete = useMutation({
      mutationFn: async (ids: number[]) => {
        await Promise.all(ids.map(id => service.delete(id)))
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
      },
    })

    return {
      bulkUpdate,
      bulkDelete,
    }
  }

  /**
   * Hook to get cached entity data without triggering fetch
   */
  const useEntityCache = (id: number) => {
    const queryClient = useQueryClient()
    return queryClient.getQueryData<TEntity>(queryKeys.detail(id))
  }

  /**
   * Hook to prefetch entity data
   */
  const usePrefetchEntity = () => {
    const queryClient = useQueryClient()
    
    const prefetchEntity = async (id: number) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.detail(id),
        queryFn: () => service.getById(id),
        staleTime: defaultStaleTime,
      })
    }

    const prefetchEntities = async (filters?: TFilters) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.list(filters),
        queryFn: () => service.getAll(filters),
        staleTime: defaultStaleTime,
      })
    }

    return {
      prefetchEntity,
      prefetchEntities,
    }
  }

  // ============================================================================
  // RETURN OBJECT WITH NAMING CONVENTION
  // ============================================================================

  // Generate hook names based on entity name
  const capitalizedEntity = entityName.charAt(0).toUpperCase() + entityName.slice(1)
  const singularEntity = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName
  const capitalizedSingular = singularEntity.charAt(0).toUpperCase() + singularEntity.slice(1)

  return {
    // Query keys for external use
    queryKeys,

    // Query hooks
    [`use${capitalizedEntity}`]: useEntities,
    [`use${capitalizedSingular}`]: useEntity,  
    [`useActive${capitalizedEntity}`]: useActiveEntities,
    [`useSearch${capitalizedEntity}`]: useSearchEntities,

    // Mutation hooks
    [`useCreate${capitalizedSingular}`]: useCreateEntity,
    [`useUpdate${capitalizedSingular}`]: useUpdateEntity,
    [`useDelete${capitalizedSingular}`]: useDeleteEntity,

    // Utility hooks
    [`use${capitalizedEntity}BulkOperations`]: useBulkOperations,
    [`use${capitalizedSingular}Cache`]: useEntityCache,
    [`usePrefetch${capitalizedEntity}`]: usePrefetchEntity,

    // Raw hooks for custom naming
    useEntities,
    useEntity,
    useActiveEntities,
    useSearchEntities,
    useCreateEntity,
    useUpdateEntity,
    useDeleteEntity,
    useBulkOperations,
    useEntityCache,
    usePrefetchEntity,
  }
}

/**
 * Helper type to infer hook names from entity name
 */
export type EntityHooks<TEntityName extends string> = TEntityName extends `${infer Singular}s`
  ? {
      [K in `use${Capitalize<TEntityName>}`]: any
    } & {
      [K in `use${Capitalize<Singular>}`]: any
    } & {
      [K in `useActive${Capitalize<TEntityName>}`]: any
    } & {
      [K in `useSearch${Capitalize<TEntityName>}`]: any
    }
  : {
      [K in `use${Capitalize<TEntityName>}s`]: any
    } & {
      [K in `use${Capitalize<TEntityName>}`]: any
    }

export default createEntityHooks
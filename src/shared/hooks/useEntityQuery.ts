import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query'
import { BaseEntityService, BaseEntityFilters, EntityQueryConfig } from '../services/BaseEntityService'

/**
 * Query Key Factory for Entities
 * 
 * Provides standardized query key patterns for consistent caching.
 */
export class EntityQueryKeys {
  static forEntity(entityName: string) {
    return {
      all: [entityName] as const,
      lists: () => [...EntityQueryKeys.forEntity(entityName).all, 'list'] as const,
      list: (filters?: any) => [...EntityQueryKeys.forEntity(entityName).lists(), filters] as const,
      details: () => [...EntityQueryKeys.forEntity(entityName).all, 'detail'] as const,
      detail: (id: number) => [...EntityQueryKeys.forEntity(entityName).details(), id] as const,
      search: (term: string) => [...EntityQueryKeys.forEntity(entityName).all, 'search', term] as const,
      count: (filters?: any) => [...EntityQueryKeys.forEntity(entityName).all, 'count', filters] as const,
      active: () => [...EntityQueryKeys.forEntity(entityName).all, 'active'] as const,
    }
  }
}

/**
 * Entity Query Hook Configuration
 */
export interface EntityQueryHookConfig<TEntity, TFilters> {
  /** Entity name for query keys */
  entityName: string
  /** Service instance */
  service: BaseEntityService<TEntity, any, any, TFilters>
  /** Default stale time for queries (default: 5 minutes) */
  defaultStaleTime?: number
  /** Default cache time for queries (default: 10 minutes) */
  defaultCacheTime?: number
}

/**
 * Entity Query Hook Options
 */
export interface UseEntityQueryOptions<TEntity, TFilters> extends EntityQueryHookConfig<TEntity, TFilters> {
  /** Custom query options */
  queryOptions?: Omit<UseQueryOptions<TEntity[], Error>, 'queryKey' | 'queryFn'>
}

/**
 * Entity Detail Query Options
 */
export interface UseEntityDetailOptions<TEntity, TFilters> extends EntityQueryHookConfig<TEntity, TFilters> {
  /** Entity ID */
  id: number
  /** Custom select clause */
  select?: string
  /** Custom query options */
  queryOptions?: Omit<UseQueryOptions<TEntity, Error>, 'queryKey' | 'queryFn'>
}

/**
 * Entity Mutation Options
 */
export interface EntityMutationOptions<TEntity, TCreateData, TUpdateData> {
  /** Entity name for query invalidation */
  entityName: string
  /** Service instance */
  service: BaseEntityService<TEntity, TCreateData, TUpdateData>
  /** Success callback */
  onSuccess?: (data: TEntity) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Custom mutation options */
  mutationOptions?: Omit<UseMutationOptions<TEntity, Error>, 'mutationFn' | 'onSuccess' | 'onError'>
}

/**
 * Generic Entity List Query Hook
 * 
 * Provides standardized querying for any entity list with filtering support.
 * 
 * @example
 * ```typescript
 * const { data: clients, isLoading, error } = useEntityList({
 *   entityName: 'clients',
 *   service: new ClientsService(),
 *   filters: { is_active: true, type: 'corporativo' }
 * })
 * ```
 */
export function useEntityList<
  TEntity extends { id: number },
  TFilters extends BaseEntityFilters = BaseEntityFilters
>({
  entityName,
  service,
  filters,
  queryConfig,
  queryOptions,
  defaultStaleTime = 1000 * 60 * 5, // 5 minutes
  defaultCacheTime = 1000 * 60 * 10, // 10 minutes
}: {
  entityName: string
  service: BaseEntityService<TEntity, any, any, TFilters>
  filters?: TFilters
  queryConfig?: EntityQueryConfig
  queryOptions?: Omit<UseQueryOptions<TEntity[], Error>, 'queryKey' | 'queryFn'>
  defaultStaleTime?: number
  defaultCacheTime?: number
}) {
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useQuery({
    queryKey: queryKeys.list({ filters, queryConfig }),
    queryFn: () => service.getAll(filters, queryConfig),
    staleTime: defaultStaleTime,
    cacheTime: defaultCacheTime,
    ...queryOptions
  })
}

/**
 * Generic Entity Detail Query Hook
 * 
 * Provides standardized querying for a single entity by ID.
 * 
 * @example
 * ```typescript
 * const { data: client, isLoading, error } = useEntityDetail({
 *   entityName: 'clients',
 *   service: new ClientsService(),
 *   id: 123,
 *   select: '*, contacts(*)'
 * })
 * ```
 */
export function useEntityDetail<TEntity extends { id: number }>({
  entityName,
  service,
  id,
  select,
  queryOptions,
  defaultStaleTime = 1000 * 60 * 5,
  defaultCacheTime = 1000 * 60 * 10,
}: {
  entityName: string
  service: BaseEntityService<TEntity, any, any>
  id: number
  select?: string
  queryOptions?: Omit<UseQueryOptions<TEntity, Error>, 'queryKey' | 'queryFn'>
  defaultStaleTime?: number
  defaultCacheTime?: number
}) {
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => service.getById(id, select),
    enabled: !!id,
    staleTime: defaultStaleTime,
    cacheTime: defaultCacheTime,
    ...queryOptions
  })
}

/**
 * Generic Entity Search Hook
 * 
 * Provides standardized search functionality for entities.
 * 
 * @example
 * ```typescript
 * const { data: results, isLoading, refetch } = useEntitySearch({
 *   entityName: 'clients',
 *   service: new ClientsService(),
 *   searchTerm: 'acme corp'
 * })
 * ```
 */
export function useEntitySearch<TEntity extends { id: number }>({
  entityName,
  service,
  searchTerm,
  queryConfig,
  queryOptions,
  defaultStaleTime = 1000 * 60 * 2, // 2 minutes for search results
}: {
  entityName: string
  service: BaseEntityService<TEntity, any, any>
  searchTerm: string
  queryConfig?: EntityQueryConfig
  queryOptions?: Omit<UseQueryOptions<TEntity[], Error>, 'queryKey' | 'queryFn'>
  defaultStaleTime?: number
}) {
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useQuery({
    queryKey: queryKeys.search(searchTerm),
    queryFn: () => service.search(searchTerm, queryConfig),
    enabled: !!searchTerm && searchTerm.length > 0,
    staleTime: defaultStaleTime,
    ...queryOptions
  })
}

/**
 * Generic Entity Count Hook
 * 
 * Provides standardized counting for entities with filters.
 */
export function useEntityCount<TFilters extends BaseEntityFilters = BaseEntityFilters>({
  entityName,
  service,
  filters,
  queryOptions,
  defaultStaleTime = 1000 * 60 * 5,
}: {
  entityName: string
  service: BaseEntityService<any, any, any, TFilters>
  filters?: TFilters
  queryOptions?: Omit<UseQueryOptions<number, Error>, 'queryKey' | 'queryFn'>
  defaultStaleTime?: number
}) {
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useQuery({
    queryKey: queryKeys.count(filters),
    queryFn: () => service.count(filters),
    staleTime: defaultStaleTime,
    ...queryOptions
  })
}

/**
 * Generic Entity Create Mutation Hook
 * 
 * Provides standardized creation mutation with automatic cache invalidation.
 * 
 * @example
 * ```typescript
 * const createClient = useEntityCreate({
 *   entityName: 'clients',
 *   service: new ClientsService(),
 *   onSuccess: (newClient) => {
 *     console.log('Client created:', newClient)
 *   }
 * })
 * 
 * createClient.mutate(newClientData)
 * ```
 */
export function useEntityCreate<
  TEntity extends { id: number },
  TCreateData = any
>({
  entityName,
  service,
  onSuccess,
  onError,
  mutationOptions
}: {
  entityName: string
  service: BaseEntityService<TEntity, TCreateData, any>
  onSuccess?: (data: TEntity) => void
  onError?: (error: Error) => void
  mutationOptions?: Omit<UseMutationOptions<TEntity, Error, TCreateData>, 'mutationFn' | 'onSuccess' | 'onError'>
}) {
  const queryClient = useQueryClient()
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useMutation({
    mutationFn: (data: TCreateData) => service.create(data),
    onSuccess: (data) => {
      // Invalidate all lists and counts
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      
      onSuccess?.(data)
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Generic Entity Update Mutation Hook
 * 
 * Provides standardized update mutation with automatic cache invalidation.
 */
export function useEntityUpdate<
  TEntity extends { id: number },
  TUpdateData = any
>({
  entityName,
  service,
  onSuccess,
  onError,
  mutationOptions
}: {
  entityName: string
  service: BaseEntityService<TEntity, any, TUpdateData>
  onSuccess?: (data: TEntity) => void
  onError?: (error: Error) => void
  mutationOptions?: Omit<UseMutationOptions<TEntity, Error, { id: number; data: TUpdateData }>, 'mutationFn' | 'onSuccess' | 'onError'>
}) {
  const queryClient = useQueryClient()
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TUpdateData }) => service.update(id, data),
    onSuccess: (data) => {
      // Update specific entity cache
      queryClient.setQueryData(queryKeys.detail(data.id), data)
      
      // Invalidate lists and counts
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      
      onSuccess?.(data)
    },
    onError,
    ...mutationOptions
  })
}

/**
 * Generic Entity Delete Mutation Hook
 * 
 * Provides standardized delete mutation with automatic cache invalidation.
 */
export function useEntityDelete({
  entityName,
  service,
  onSuccess,
  onError,
  mutationOptions
}: {
  entityName: string
  service: BaseEntityService<any, any, any>
  onSuccess?: (id: number) => void
  onError?: (error: Error) => void
  mutationOptions?: Omit<UseMutationOptions<void, Error, { id: number; hardDelete?: boolean }>, 'mutationFn' | 'onSuccess' | 'onError'>
}) {
  const queryClient = useQueryClient()
  const queryKeys = EntityQueryKeys.forEntity(entityName)
  
  return useMutation({
    mutationFn: ({ id, hardDelete = false }: { id: number; hardDelete?: boolean }) => service.delete(id, hardDelete),
    onSuccess: (_, { id }) => {
      // Remove from specific entity cache
      queryClient.removeQueries({ queryKey: queryKeys.detail(id) })
      
      // Invalidate lists and counts
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.all })
      
      onSuccess?.(id)
    },
    onError,
    ...mutationOptions
  })
}
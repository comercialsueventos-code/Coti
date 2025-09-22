/**
 * Consolidated Entity Page Factory - Story 2.5: Hooks Standardization
 * 
 * Generates standardized page hooks for entity management pages.
 * Eliminates duplication across machinery, suppliers, and other entity page hooks.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTabPage, TabPageConfig } from './useTabPage'

/**
 * Base entity for page management
 */
export interface BasePageEntity {
  id: number
  name?: string
  [key: string]: any
}

/**
 * Entity page dialog types
 */
export type EntityPageDialogType = 'create' | 'edit' | 'delete' | 'details' | string

/**
 * Entity page configuration
 */
export interface EntityPageConfig<TEntity extends BasePageEntity> {
  /** Entity name for logging and UI */
  entityName: string
  /** Tab configuration */
  tabConfig?: TabPageConfig
  /** Available dialog types */
  dialogTypes?: EntityPageDialogType[]
  /** Custom filter function */
  customFilter?: (entity: TEntity, filters: Record<string, any>) => boolean
  /** Custom search function */
  customSearch?: (entity: TEntity, searchTerm: string) => boolean
  /** Delete confirmation message */
  deleteConfirmMessage?: (entity: TEntity) => string
}

/**
 * Entity page data hooks interface
 */
export interface EntityPageDataHooks<TEntity extends BasePageEntity> {
  /** Main entity data hook */
  useEntityData: (filters?: any) => {
    data?: TEntity[]
    isLoading?: boolean
    error?: any
  }
  /** Statistics hook (optional) */
  useStatistics?: () => {
    data?: any
    isLoading?: boolean
  }
  /** Delete mutation hook */
  useDeleteMutation: () => {
    mutateAsync: (id: number) => Promise<void>
    isPending?: boolean
  }
  /** Additional data hooks */
  [key: string]: any
}

/**
 * Entity page state interface
 */
export interface EntityPageState<TEntity extends BasePageEntity> {
  // Dialog states
  dialogs: Record<string, boolean>
  selectedEntity: TEntity | null
  
  // Filter states
  selectedCategory?: string
  selectedType?: string
  customFilters: Record<string, any>
  
  // UI states
  isLoading: boolean
  error?: string
}

/**
 * Entity page actions interface
 */
export interface EntityPageActions<TEntity extends BasePageEntity> {
  // Dialog actions
  openDialog: (dialogType: string, entity?: TEntity) => void
  closeDialog: (dialogType: string) => void
  closeAllDialogs: () => void
  
  // Entity actions
  setSelectedEntity: (entity: TEntity | null) => void
  handleCreate: () => void
  handleEdit: (entity: TEntity) => void
  handleDelete: (id: number) => Promise<void>
  handleView: (entity: TEntity) => void
  
  // Filter actions
  setCategory: (category: string) => void
  setType: (type: string) => void
  setCustomFilter: (key: string, value: any) => void
  clearCustomFilters: () => void
}

/**
 * Entity page hook return interface
 */
export interface EntityPageHook<TEntity extends BasePageEntity> {
  // Tab page functionality
  tabPage: ReturnType<typeof useTabPage>
  
  // Entity page state
  state: EntityPageState<TEntity>
  actions: EntityPageActions<TEntity>
  
  // Computed data
  data: {
    entities: TEntity[]
    statistics?: any
    filteredEntities: TEntity[]
    searchResults: TEntity[]
    [key: string]: any
  }
  
  // Utility functions
  isDialogOpen: (dialogType: string) => boolean
  hasActiveFilters: boolean
  getEntityById: (id: number) => TEntity | undefined
}

/**
 * Creates a standardized entity page hook
 */
export function createEntityPage<TEntity extends BasePageEntity>(
  config: EntityPageConfig<TEntity>,
  dataHooks: EntityPageDataHooks<TEntity>
) {
  return function useEntityPage(
    initialFilters?: Record<string, any>
  ): EntityPageHook<TEntity> {
    
    // Tab page functionality
    const tabPage = useTabPage({
      enableSearch: true,
      enableFiltering: true,
      initialFilters,
      ...config.tabConfig
    })
    
    // Entity page state
    const [entityState, setEntityState] = useState<{
      dialogs: Record<string, boolean>
      selectedEntity: TEntity | null
      selectedCategory: string
      selectedType: string
      customFilters: Record<string, any>
      error?: string
    }>({
      dialogs: {},
      selectedEntity: null,
      selectedCategory: '',
      selectedType: '',
      customFilters: initialFilters || {},
      error: undefined
    })
    
    // Data queries
    const entityQuery = dataHooks.useEntityData({
      category: entityState.selectedCategory || undefined,
      type: entityState.selectedType || undefined,
      search: tabPage.state.searchTerm || undefined,
      ...entityState.customFilters
    })
    const statisticsQuery = dataHooks.useStatistics?.()
    const deleteMutation = dataHooks.useDeleteMutation()
    
    const entities = entityQuery.data || []
    const isLoading = entityQuery.isLoading || false
    
    // Update tab page data when entities change
    React.useEffect(() => {
      tabPage.actions.setData(entities)
    }, [entities, tabPage.actions])
    
    // Filtered entities
    const filteredEntities = useMemo(() => {
      let result = entities
      
      // Apply category filter
      if (entityState.selectedCategory) {
        result = result.filter(entity => 
          (entity as any).category === entityState.selectedCategory
        )
      }
      
      // Apply type filter
      if (entityState.selectedType) {
        result = result.filter(entity => 
          (entity as any).type === entityState.selectedType
        )
      }
      
      // Apply custom filters
      if (config.customFilter) {
        result = result.filter(entity => 
          config.customFilter!(entity, entityState.customFilters)
        )
      }
      
      return result
    }, [entities, entityState.selectedCategory, entityState.selectedType, entityState.customFilters, config])
    
    // Search results
    const searchResults = useMemo(() => {
      if (!tabPage.state.searchTerm) return filteredEntities
      
      if (config.customSearch) {
        return filteredEntities.filter(entity =>
          config.customSearch!(entity, tabPage.state.searchTerm)
        )
      }
      
      // Default search implementation
      return filteredEntities.filter(entity => {
        const searchableText = [
          entity.name,
          (entity as any).description,
          (entity as any).category,
          (entity as any).type
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        
        return searchableText.includes(tabPage.state.searchTerm.toLowerCase())
      })
    }, [filteredEntities, tabPage.state.searchTerm, config])
    
    // Dialog actions
    const openDialog = useCallback((dialogType: string, entity?: TEntity) => {
      setEntityState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, [dialogType]: true },
        selectedEntity: entity || null
      }))
    }, [])
    
    const closeDialog = useCallback((dialogType: string) => {
      setEntityState(prev => ({
        ...prev,
        dialogs: { ...prev.dialogs, [dialogType]: false }
      }))
    }, [])
    
    const closeAllDialogs = useCallback(() => {
      setEntityState(prev => ({
        ...prev,
        dialogs: {},
        selectedEntity: null
      }))
    }, [])
    
    // Entity actions
    const setSelectedEntity = useCallback((entity: TEntity | null) => {
      setEntityState(prev => ({ ...prev, selectedEntity: entity }))
    }, [])
    
    const handleCreate = useCallback(() => {
      openDialog('create')
    }, [openDialog])
    
    const handleEdit = useCallback((entity: TEntity) => {
      openDialog('edit', entity)
    }, [openDialog])
    
    const handleDelete = useCallback(async (id: number) => {
      const entity = entities.find(e => e.id === id)
      if (!entity) return
      
      const confirmMessage = config.deleteConfirmMessage 
        ? config.deleteConfirmMessage(entity)
        : `¿Estás seguro de que quieres eliminar "${entity.name || 'este elemento'}"?`
      
      if (window.confirm(confirmMessage)) {
        try {
          await deleteMutation.mutateAsync(id)
        } catch (error) {
          console.error(`Error deleting ${config.entityName}:`, error)
          setEntityState(prev => ({ 
            ...prev, 
            error: `Error al eliminar ${config.entityName}` 
          }))
        }
      }
    }, [entities, config, deleteMutation])
    
    const handleView = useCallback((entity: TEntity) => {
      openDialog('details', entity)
    }, [openDialog])
    
    // Filter actions
    const setCategory = useCallback((category: string) => {
      setEntityState(prev => ({ ...prev, selectedCategory: category }))
    }, [])
    
    const setType = useCallback((type: string) => {
      setEntityState(prev => ({ ...prev, selectedType: type }))
    }, [])
    
    const setCustomFilter = useCallback((key: string, value: any) => {
      setEntityState(prev => ({
        ...prev,
        customFilters: { ...prev.customFilters, [key]: value }
      }))
    }, [])
    
    const clearCustomFilters = useCallback(() => {
      setEntityState(prev => ({
        ...prev,
        customFilters: {},
        selectedCategory: '',
        selectedType: ''
      }))
    }, [])
    
    // Utility functions
    const isDialogOpen = useCallback((dialogType: string) => {
      return Boolean(entityState.dialogs[dialogType])
    }, [entityState.dialogs])
    
    const hasActiveFilters = Boolean(
      entityState.selectedCategory ||
      entityState.selectedType ||
      Object.keys(entityState.customFilters).length > 0 ||
      tabPage.state.searchTerm
    )
    
    const getEntityById = useCallback((id: number) => {
      return entities.find(entity => entity.id === id)
    }, [entities])
    
    // Build return object
    const state: EntityPageState<TEntity> = {
      dialogs: entityState.dialogs,
      selectedEntity: entityState.selectedEntity,
      selectedCategory: entityState.selectedCategory,
      selectedType: entityState.selectedType,
      customFilters: entityState.customFilters,
      isLoading,
      error: entityState.error
    }
    
    const actions: EntityPageActions<TEntity> = {
      openDialog,
      closeDialog,
      closeAllDialogs,
      setSelectedEntity,
      handleCreate,
      handleEdit,
      handleDelete,
      handleView,
      setCategory,
      setType,
      setCustomFilter,
      clearCustomFilters
    }
    
    const data = {
      entities,
      statistics: statisticsQuery?.data,
      filteredEntities,
      searchResults,
      // Include any additional data from hooks
      ...Object.fromEntries(
        Object.entries(dataHooks)
          .filter(([key]) => !['useEntityData', 'useStatistics', 'useDeleteMutation'].includes(key))
          .map(([key, hook]) => {
            const hookName = key.replace(/^use/, '').toLowerCase()
            return [hookName, typeof hook === 'function' ? hook()?.data : undefined]
          })
      )
    }
    
    return {
      tabPage,
      state,
      actions,
      data,
      isDialogOpen,
      hasActiveFilters,
      getEntityById
    }
  }
}

/**
 * Default entity search function
 */
export const defaultEntitySearch = <T extends BasePageEntity>(
  entity: T,
  searchTerm: string
): boolean => {
  const searchableFields = [
    entity.name,
    (entity as any).description,
    (entity as any).category,
    (entity as any).type,
    (entity as any).contact_person
  ].filter(Boolean)
  
  const searchableText = searchableFields.join(' ').toLowerCase()
  return searchableText.includes(searchTerm.toLowerCase())
}

/**
 * Default entity filter function
 */
export const defaultEntityFilter = <T extends BasePageEntity>(
  entity: T,
  filters: Record<string, any>
): boolean => {
  return Object.entries(filters).every(([key, value]) => {
    if (!value) return true
    return (entity as any)[key] === value
  })
}

// React import for useEffect
import React from 'react'

export default createEntityPage
import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Generic CRUD Configuration
 */
export interface EntityCRUDConfig<TEntity, TCreateData, TUpdateData> {
  /** Entity name for query keys (e.g., 'clients', 'products') */
  entityName: string
  
  /** Create function */
  createFn: (data: TCreateData) => Promise<TEntity>
  
  /** Update function */
  updateFn: (id: number, data: TUpdateData) => Promise<TEntity>
  
  /** Delete function */
  deleteFn: (id: number) => Promise<void>
  
  /** Optional success messages */
  successMessages?: {
    create?: string
    update?: string
    delete?: string
  }
  
  /** Optional error messages */
  errorMessages?: {
    create?: string
    update?: string
    delete?: string
  }
}

/**
 * CRUD State interface
 */
export interface CRUDState<TEntity> {
  // Dialog states
  createDialogOpen: boolean
  editDialogOpen: boolean
  deleteDialogOpen: boolean
  
  // Selected entity
  selectedEntity: TEntity | null
  
  // Loading states
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  
  // Error states
  createError: string | null
  updateError: string | null
  deleteError: string | null
}

/**
 * CRUD Actions interface
 */
export interface CRUDActions<TEntity, TCreateData, TUpdateData> {
  // Dialog actions
  openCreateDialog: () => void
  openEditDialog: (entity: TEntity) => void
  openDeleteDialog: (entity: TEntity) => void
  closeAllDialogs: () => void
  
  // CRUD operations
  handleCreate: (data: TCreateData) => Promise<void>
  handleUpdate: (data: TUpdateData) => Promise<void>
  handleDelete: () => Promise<void>
  
  // Utility
  resetErrors: () => void
}

/**
 * Complete CRUD hook return type
 */
export interface EntityCRUDHook<TEntity, TCreateData, TUpdateData> {
  state: CRUDState<TEntity>
  actions: CRUDActions<TEntity, TCreateData, TUpdateData>
}

/**
 * Generic Entity CRUD Hook
 * 
 * Provides standardized CRUD operations and state management for any entity.
 * Handles dialogs, loading states, errors, and API calls consistently.
 * 
 * @example
 * ```typescript
 * const { state, actions } = useEntityCRUD({
 *   entityName: 'clients',
 *   createFn: createClient,
 *   updateFn: updateClient,
 *   deleteFn: deleteClient,
 *   successMessages: {
 *     create: 'Cliente creado exitosamente',
 *     update: 'Cliente actualizado exitosamente',
 *     delete: 'Cliente eliminado exitosamente'
 *   }
 * })
 * ```
 */
export function useEntityCRUD<TEntity, TCreateData, TUpdateData = TCreateData>({
  entityName,
  createFn,
  updateFn,
  deleteFn,
  successMessages = {},
  errorMessages = {}
}: EntityCRUDConfig<TEntity, TCreateData, TUpdateData>): EntityCRUDHook<TEntity, TCreateData, TUpdateData> {
  
  const queryClient = useQueryClient()
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Selected entity
  const [selectedEntity, setSelectedEntity] = useState<TEntity | null>(null)
  
  // Error states
  const [createError, setCreateError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  
  // Create mutation
  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      setCreateDialogOpen(false)
      setCreateError(null)
      // TODO: Show success message
      console.log(successMessages.create || `${entityName} created successfully`)
    },
    onError: (error: any) => {
      const message = error?.message || errorMessages.create || `Error creating ${entityName}`
      setCreateError(message)
      console.error(`Create ${entityName} error:`, error)
    }
  })
  
  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: TUpdateData }) => updateFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      setEditDialogOpen(false)
      setSelectedEntity(null)
      setUpdateError(null)
      // TODO: Show success message
      console.log(successMessages.update || `${entityName} updated successfully`)
    },
    onError: (error: any) => {
      const message = error?.message || errorMessages.update || `Error updating ${entityName}`
      setUpdateError(message)
      console.error(`Update ${entityName} error:`, error)
    }
  })
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [entityName] })
      setDeleteDialogOpen(false)
      setSelectedEntity(null)
      setDeleteError(null)
      // TODO: Show success message
      console.log(successMessages.delete || `${entityName} deleted successfully`)
    },
    onError: (error: any) => {
      const message = error?.message || errorMessages.delete || `Error deleting ${entityName}`
      setDeleteError(message)
      console.error(`Delete ${entityName} error:`, error)
    }
  })
  
  // Dialog actions
  const openCreateDialog = useCallback(() => {
    setCreateDialogOpen(true)
    setCreateError(null)
  }, [])
  
  const openEditDialog = useCallback((entity: TEntity) => {
    setSelectedEntity(entity)
    setEditDialogOpen(true)
    setUpdateError(null)
  }, [])
  
  const openDeleteDialog = useCallback((entity: TEntity) => {
    setSelectedEntity(entity)
    setDeleteDialogOpen(true)
    setDeleteError(null)
  }, [])
  
  const closeAllDialogs = useCallback(() => {
    setCreateDialogOpen(false)
    setEditDialogOpen(false)
    setDeleteDialogOpen(false)
    setSelectedEntity(null)
    setCreateError(null)
    setUpdateError(null)
    setDeleteError(null)
  }, [])
  
  // CRUD operations
  const handleCreate = useCallback(async (data: TCreateData) => {
    await createMutation.mutateAsync(data)
  }, [createMutation])
  
  const handleUpdate = useCallback(async (data: TUpdateData) => {
    if (!selectedEntity || !('id' in selectedEntity)) {
      throw new Error('No entity selected for update')
    }
    
    const id = (selectedEntity as any).id
    await updateMutation.mutateAsync({ id, data })
  }, [selectedEntity, updateMutation])
  
  const handleDelete = useCallback(async () => {
    if (!selectedEntity || !('id' in selectedEntity)) {
      throw new Error('No entity selected for deletion')
    }
    
    const id = (selectedEntity as any).id
    await deleteMutation.mutateAsync(id)
  }, [selectedEntity, deleteMutation])
  
  const resetErrors = useCallback(() => {
    setCreateError(null)
    setUpdateError(null)
    setDeleteError(null)
  }, [])
  
  // Build state and actions objects
  const state: CRUDState<TEntity> = {
    createDialogOpen,
    editDialogOpen,
    deleteDialogOpen,
    selectedEntity,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError,
    updateError,
    deleteError
  }
  
  const actions: CRUDActions<TEntity, TCreateData, TUpdateData> = {
    openCreateDialog,
    openEditDialog,
    openDeleteDialog,
    closeAllDialogs,
    handleCreate,
    handleUpdate,
    handleDelete,
    resetErrors
  }
  
  return { state, actions }
}
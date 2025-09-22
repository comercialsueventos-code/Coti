/**
 * Consolidated Entity Form Factory - Story 2.5: Hooks Standardization
 * 
 * Generates standardized form hooks for entity CRUD operations.
 * Eliminates duplication across product, employee, category, and other form hooks.
 */

import { useState, useEffect, useCallback } from 'react'
import { useFormState, UseFormStateConfig } from './useFormState'

/**
 * Base entity form configuration
 */
export interface EntityFormConfig<TFormData, TEntity, TCreateData, TUpdateData> {
  /** Entity name for logging and debugging */
  entityName: string
  /** Default form data */
  defaultFormData: TFormData
  /** Function to convert form data to create payload */
  toCreateData: (formData: TFormData) => TCreateData
  /** Function to convert form data to update payload */ 
  toUpdateData: (formData: TFormData, entity: TEntity) => TUpdateData
  /** Function to load entity data into form */
  fromEntity: (entity: TEntity) => TFormData
  /** Custom validation function */
  validator?: (formData: TFormData) => Record<string, string>
  /** Form-specific side effects */
  effects?: {
    /** Called when form is opened */
    onOpen?: (mode: 'create' | 'edit', entity?: TEntity) => void
    /** Called when form data changes */
    onChange?: (field: keyof TFormData, value: any, formData: TFormData) => void
    /** Called before submit */
    beforeSubmit?: (formData: TFormData, mode: 'create' | 'edit') => Promise<boolean> | boolean
    /** Called after successful submit */
    afterSubmit?: (result: any, mode: 'create' | 'edit') => void
  }
}

/**
 * Entity form mutation hooks interface
 */
export interface EntityFormMutations<TEntity, TCreateData, TUpdateData> {
  useCreate: () => {
    mutateAsync: (data: TCreateData) => Promise<TEntity>
    isPending: boolean
  }
  useUpdate: () => {
    mutateAsync: (params: { id: number; data: TUpdateData }) => Promise<TEntity>
    isPending: boolean
  }
  useValidation?: () => {
    validateEntityData: (data: TCreateData | TUpdateData) => { isValid: boolean; errors: string[] }
  }
  useUtils?: () => {
    getDefaultValues?: (key: string) => any
    [key: string]: any
  }
}

/**
 * Entity form state interface
 */
export interface EntityFormState<TFormData> {
  formData: TFormData
  errors: Record<string, string>
  isLoading: boolean
  isDirty: boolean
  isValid: boolean
  mode: 'create' | 'edit'
  entity: any
}

/**
 * Entity form actions interface
 */
export interface EntityFormActions<TFormData> {
  handleFormDataChange: (field: keyof TFormData, value: any) => void
  handleSubmit: () => Promise<void>
  reset: () => void
  setEntity: (entity: any, mode: 'create' | 'edit') => void
}

/**
 * Entity form hook return interface
 */
export interface EntityFormHook<TFormData> {
  formData: TFormData
  errors: Record<string, string>
  isLoading: boolean
  isDirty: boolean
  isValid: boolean
  handleFormDataChange: (field: keyof TFormData, value: any) => void
  handleSubmit: () => Promise<void>
  reset: () => void
  setEntity: (entity: any, mode: 'create' | 'edit') => void
}

/**
 * Creates a standardized entity form hook
 */
export function createEntityForm<TFormData extends Record<string, any>, TEntity, TCreateData, TUpdateData>(
  config: EntityFormConfig<TFormData, TEntity, TCreateData, TUpdateData>,
  mutations: EntityFormMutations<TEntity, TCreateData, TUpdateData>
) {
  return function useEntityForm(
    entity?: TEntity | null,
    mode: 'create' | 'edit' = 'create',
    onClose?: () => void
  ): EntityFormHook<TFormData> {
    
    // State management
    const [currentEntity, setCurrentEntity] = useState<TEntity | null>(entity || null)
    const [currentMode, setCurrentMode] = useState<'create' | 'edit'>(mode)

    // Get mutation hooks
    const createMutation = mutations.useCreate()
    const updateMutation = mutations.useUpdate()
    const validation = mutations.useValidation?.()

    // Form state with validation
    const formStateConfig: UseFormStateConfig<TFormData> = {
      initialData: config.defaultFormData,
      validator: config.validator,
      validateOnChange: true,
      validateOnBlur: true,
      resetOnSubmit: false
    }

    const { state: formState, actions: formActions } = useFormState<TFormData>(formStateConfig)

    // Load entity data when entity or mode changes
    useEffect(() => {
      if (currentMode === 'edit' && currentEntity) {
        const entityFormData = config.fromEntity(currentEntity)
        formActions.setData(entityFormData)
      } else {
        formActions.setData(config.defaultFormData)
      }
      formActions.clearErrors()

      // Call onOpen effect
      config.effects?.onOpen?.(currentMode, currentEntity || undefined)
    }, [currentMode, currentEntity, config, formActions])

    // Enhanced field change handler with effects
    const handleFormDataChange = useCallback((field: keyof TFormData, value: any) => {
      formActions.setField(field, value)
      
      // Clear field error if it exists
      if (formState.errors[field as string]) {
        formActions.clearFieldError(field)
      }

      // Call onChange effect
      const newFormData = { ...formState.data, [field]: value }
      config.effects?.onChange?.(field, value, newFormData)
    }, [formActions, formState.errors, formState.data, config])

    // Enhanced submit handler
    const handleSubmit = useCallback(async () => {
      try {
        // Run beforeSubmit hook
        if (config.effects?.beforeSubmit) {
          const shouldProceed = await config.effects.beforeSubmit(formState.data, currentMode)
          if (!shouldProceed) {
            return
          }
        }

        // Validate if validation function is available
        if (validation?.validateEntityData) {
          const dataToValidate = currentMode === 'create' 
            ? config.toCreateData(formState.data)
            : config.toUpdateData(formState.data, currentEntity!)
          
          const validationResult = validation.validateEntityData(dataToValidate)
          if (!validationResult.isValid) {
            console.error(`${config.entityName} validation errors:`, validationResult.errors)
            return
          }
        }

        let result: TEntity

        if (currentMode === 'create') {
          const createData = config.toCreateData(formState.data)
          result = await createMutation.mutateAsync(createData)
        } else if (currentEntity) {
          const updateData = config.toUpdateData(formState.data, currentEntity)
          result = await updateMutation.mutateAsync({
            id: (currentEntity as any).id,
            data: updateData
          })
        } else {
          throw new Error('No entity provided for update mode')
        }

        // Call afterSubmit effect
        config.effects?.afterSubmit?.(result, currentMode)

        // Close form if callback provided
        onClose?.()
        
      } catch (error) {
        console.error(`Error saving ${config.entityName}:`, error)
        formActions.setErrors({ submit: `Error al guardar ${config.entityName}` })
      }
    }, [
      formState.data, 
      currentMode, 
      currentEntity, 
      config, 
      validation, 
      createMutation, 
      updateMutation, 
      formActions,
      onClose
    ])

    // Set entity and mode
    const setEntity = useCallback((entity: TEntity | null, mode: 'create' | 'edit') => {
      setCurrentEntity(entity)
      setCurrentMode(mode)
    }, [])

    // Reset form
    const reset = useCallback(() => {
      formActions.reset()
      setCurrentEntity(null)
      setCurrentMode('create')
    }, [formActions])

    const isLoading = createMutation.isPending || updateMutation.isPending

    return {
      formData: formState.data,
      errors: formState.errors,
      isLoading,
      isDirty: formState.isDirty,
      isValid: formState.isValid && !isLoading,
      handleFormDataChange,
      handleSubmit,
      reset,
      setEntity
    }
  }
}

/**
 * Standard entity form validation helper
 */
export function createEntityFormValidator<T>(
  validators: Partial<Record<keyof T, (value: any, formData: T) => string | null>>
) {
  return (formData: T): Record<string, string> => {
    const errors: Record<string, string> = {}
    
    for (const [field, validator] of Object.entries(validators)) {
      if (validator && typeof validator === 'function') {
        const error = validator((formData as any)[field], formData)
        if (error) {
          errors[field] = error
        }
      }
    }
    
    return errors
  }
}

/**
 * Common form data transformers
 */
export const FormDataTransformers = {
  /**
   * Convert form data to create payload by removing undefined values
   */
  toCreateData: <T>(formData: T): Partial<T> => {
    const result: any = {}
    for (const [key, value] of Object.entries(formData as any)) {
      if (value !== undefined && value !== null && value !== '') {
        result[key] = value
      }
    }
    return result
  },

  /**
   * Convert form data to update payload by preserving original values
   */
  toUpdateData: <T, U>(formData: T, originalEntity: U): Partial<T> => {
    const result: any = {}
    for (const [key, value] of Object.entries(formData as any)) {
      // Include field if it has a value or if it differs from original
      if (value !== undefined && (value !== '' || (originalEntity as any)?.[key])) {
        result[key] = value
      }
    }
    return result
  },

  /**
   * Load entity data into form data structure
   */
  fromEntity: <T, U>(entity: U, defaultFormData: T): T => {
    const result = { ...defaultFormData }
    for (const key of Object.keys(result as any)) {
      if ((entity as any)?.[key] !== undefined) {
        (result as any)[key] = (entity as any)[key]
      }
    }
    return result
  }
}

export default createEntityForm
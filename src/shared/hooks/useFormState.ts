import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Form Validation Function Type
 */
export type FormValidator<T> = (data: T) => Record<string, string> | Promise<Record<string, string>>

/**
 * Form Field Change Handler Type
 */
export type FormFieldHandler<T> = (field: keyof T, value: T[keyof T]) => void

/**
 * Form Submit Handler Type
 */
export type FormSubmitHandler<T> = (data: T, isValid: boolean) => Promise<void> | void

/**
 * Form State Configuration
 */
export interface UseFormStateConfig<T> {
  /** Initial form data */
  initialData: T
  /** Validation function */
  validator?: FormValidator<T>
  /** Validate on field change */
  validateOnChange?: boolean
  /** Validate on blur */
  validateOnBlur?: boolean
  /** Reset form after successful submit */
  resetOnSubmit?: boolean
  /** Callback when form is submitted */
  onSubmit?: FormSubmitHandler<T>
  /** Callback when form data changes */
  onChange?: (data: T) => void
  /** Callback when validation state changes */
  onValidationChange?: (errors: Record<string, string>, isValid: boolean) => void
}

/**
 * Form State Interface
 */
export interface FormState<T> {
  /** Current form data */
  data: T
  /** Validation errors */
  errors: Record<string, string>
  /** Whether form is currently being validated */
  isValidating: boolean
  /** Whether form is currently being submitted */
  isSubmitting: boolean
  /** Whether form has been modified from initial state */
  isDirty: boolean
  /** Whether form has been touched (any field interacted with) */
  isTouched: boolean
  /** Whether form is currently valid */
  isValid: boolean
  /** Fields that have been touched */
  touchedFields: Set<keyof T>
}

/**
 * Form Actions Interface
 */
export interface FormActions<T> {
  /** Set field value */
  setField: (field: keyof T, value: T[keyof T]) => void
  /** Set multiple fields at once */
  setFields: (fields: Partial<T>) => void
  /** Set entire form data */
  setData: (data: T) => void
  /** Set form errors */
  setErrors: (errors: Record<string, string>) => void
  /** Set single field error */
  setFieldError: (field: keyof T, error: string) => void
  /** Clear all errors */
  clearErrors: () => void
  /** Clear single field error */
  clearFieldError: (field: keyof T) => void
  /** Mark field as touched */
  touchField: (field: keyof T) => void
  /** Mark multiple fields as touched */
  touchFields: (fields: (keyof T)[]) => void
  /** Reset form to initial state */
  reset: () => void
  /** Reset form to specific data */
  resetTo: (data: T) => void
  /** Validate entire form */
  validate: () => Promise<boolean>
  /** Validate specific field */
  validateField: (field: keyof T) => Promise<boolean>
  /** Submit form */
  submit: () => Promise<void>
  /** Handle form submission (for form onSubmit) */
  handleSubmit: (event: React.FormEvent) => Promise<void>
  /** Get field props for input components */
  getFieldProps: (field: keyof T) => {
    value: T[keyof T]
    onChange: (value: T[keyof T]) => void
    onBlur: () => void
    error: string | undefined
    name: string
  }
}

/**
 * Form State Hook Return Type
 */
export interface UseFormStateReturn<T> {
  state: FormState<T>
  actions: FormActions<T>
}

/**
 * Form State Hook
 * 
 * Comprehensive form state management with validation, dirty tracking,
 * field-level error handling, and convenient action methods.
 * 
 * @example
 * ```typescript
 * interface UserForm {
 *   name: string
 *   email: string
 *   age: number
 * }
 * 
 * const { state, actions } = useFormState<UserForm>({
 *   initialData: { name: '', email: '', age: 0 },
 *   validator: (data) => {
 *     const errors: Record<string, string> = {}
 *     if (!data.name) errors.name = 'Name is required'
 *     if (!data.email) errors.email = 'Email is required'
 *     return errors
 *   },
 *   validateOnChange: true,
 *   onSubmit: async (data) => {
 *     await userService.createUser(data)
 *   }
 * })
 * 
 * // In component
 * <form onSubmit={actions.handleSubmit}>
 *   <input {...actions.getFieldProps('name')} />
 *   <input {...actions.getFieldProps('email')} />
 *   <button type="submit" disabled={!state.isValid || state.isSubmitting}>
 *     Submit
 *   </button>
 * </form>
 * ```
 */
export function useFormState<T extends Record<string, any>>({
  initialData,
  validator,
  validateOnChange = false,
  validateOnBlur = true,
  resetOnSubmit = false,
  onSubmit,
  onChange,
  onValidationChange
}: UseFormStateConfig<T>): UseFormStateReturn<T> {
  
  // State management
  const [data, setDataState] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set())
  
  // Track initial data for dirty checking
  const initialDataRef = useRef(initialData)
  const validationTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Computed values
  const isDirty = JSON.stringify(data) !== JSON.stringify(initialDataRef.current)
  const isTouched = touchedFields.size > 0
  const isValid = Object.keys(errors).length === 0
  
  // Validation function
  const runValidation = useCallback(async (dataToValidate: T): Promise<Record<string, string>> => {
    if (!validator) return {}
    
    setIsValidating(true)
    try {
      const validationErrors = await validator(dataToValidate)
      return validationErrors || {}
    } catch (error) {
      console.error('Validation error:', error)
      return { _form: 'Validation failed' }
    } finally {
      setIsValidating(false)
    }
  }, [validator])
  
  // Debounced validation
  const debouncedValidation = useCallback(async (dataToValidate: T) => {
    // Clear previous timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
    
    // Set new timeout
    validationTimeoutRef.current = setTimeout(async () => {
      const validationErrors = await runValidation(dataToValidate)
      setErrors(validationErrors)
      onValidationChange?.(validationErrors, Object.keys(validationErrors).length === 0)
    }, 300) // 300ms debounce
  }, [runValidation, onValidationChange])
  
  // Actions
  const setField = useCallback((field: keyof T, value: T[keyof T]) => {
    setDataState(prev => {
      const newData = { ...prev, [field]: value }
      
      // Call onChange callback
      onChange?.(newData)
      
      // Validate on change if enabled
      if (validateOnChange) {
        debouncedValidation(newData)
      }
      
      return newData
    })
  }, [onChange, validateOnChange, debouncedValidation])
  
  const setFields = useCallback((fields: Partial<T>) => {
    setDataState(prev => {
      const newData = { ...prev, ...fields }
      
      onChange?.(newData)
      
      if (validateOnChange) {
        debouncedValidation(newData)
      }
      
      return newData
    })
  }, [onChange, validateOnChange, debouncedValidation])
  
  const setData = useCallback((newData: T) => {
    setDataState(newData)
    onChange?.(newData)
    
    if (validateOnChange) {
      debouncedValidation(newData)
    }
  }, [onChange, validateOnChange, debouncedValidation])
  
  const setFormErrors = useCallback((newErrors: Record<string, string>) => {
    setErrors(newErrors)
    onValidationChange?.(newErrors, Object.keys(newErrors).length === 0)
  }, [onValidationChange])
  
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => {
      const newErrors = { ...prev, [field as string]: error }
      onValidationChange?.(newErrors, Object.keys(newErrors).length === 0)
      return newErrors
    })
  }, [onValidationChange])
  
  const clearErrors = useCallback(() => {
    setErrors({})
    onValidationChange?.({}, true)
  }, [onValidationChange])
  
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const { [field as string]: removed, ...rest } = prev
      onValidationChange?.(rest, Object.keys(rest).length === 0)
      return rest
    })
  }, [onValidationChange])
  
  const touchField = useCallback((field: keyof T) => {
    setTouchedFields(prev => new Set(prev).add(field))
  }, [])
  
  const touchFields = useCallback((fields: (keyof T)[]) => {
    setTouchedFields(prev => {
      const newSet = new Set(prev)
      fields.forEach(field => newSet.add(field))
      return newSet
    })
  }, [])
  
  const reset = useCallback(() => {
    setDataState(initialDataRef.current)
    setErrors({})
    setTouchedFields(new Set())
    setIsSubmitting(false)
    
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
  }, [])
  
  const resetTo = useCallback((newData: T) => {
    initialDataRef.current = newData
    setDataState(newData)
    setErrors({})
    setTouchedFields(new Set())
    setIsSubmitting(false)
    
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }
  }, [])
  
  const validate = useCallback(async (): Promise<boolean> => {
    const validationErrors = await runValidation(data)
    setErrors(validationErrors)
    onValidationChange?.(validationErrors, Object.keys(validationErrors).length === 0)
    return Object.keys(validationErrors).length === 0
  }, [data, runValidation, onValidationChange])
  
  const validateField = useCallback(async (field: keyof T): Promise<boolean> => {
    const validationErrors = await runValidation(data)
    const fieldError = validationErrors[field as string]
    
    if (fieldError) {
      setFieldError(field, fieldError)
      return false
    } else {
      clearFieldError(field)
      return true
    }
  }, [data, runValidation, setFieldError, clearFieldError])
  
  const submit = useCallback(async (): Promise<void> => {
    setIsSubmitting(true)
    
    try {
      // Validate before submit
      const isFormValid = await validate()
      
      // Call onSubmit callback
      if (onSubmit) {
        await onSubmit(data, isFormValid)
        
        // Reset form if configured to do so and submission was successful
        if (resetOnSubmit && isFormValid) {
          reset()
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }, [data, validate, onSubmit, resetOnSubmit, reset])
  
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault()
    await submit()
  }, [submit])
  
  const getFieldProps = useCallback((field: keyof T) => {
    return {
      value: data[field],
      onChange: (value: T[keyof T]) => setField(field, value),
      onBlur: () => {
        touchField(field)
        if (validateOnBlur) {
          validateField(field)
        }
      },
      error: errors[field as string],
      name: field as string
    }
  }, [data, errors, setField, touchField, validateOnBlur, validateField])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])
  
  // Build state and actions objects
  const state: FormState<T> = {
    data,
    errors,
    isValidating,
    isSubmitting,
    isDirty,
    isTouched,
    isValid,
    touchedFields
  }
  
  const actions: FormActions<T> = {
    setField,
    setFields,
    setData,
    setErrors: setFormErrors,
    setFieldError,
    clearErrors,
    clearFieldError,
    touchField,
    touchFields,
    reset,
    resetTo,
    validate,
    validateField,
    submit,
    handleSubmit,
    getFieldProps
  }
  
  return { state, actions }
}
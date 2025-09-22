import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Async State Interface
 */
export interface AsyncState<T> {
  /** Data returned from async operation */
  data: T | null
  /** Error from async operation */
  error: Error | null
  /** Loading state */
  isLoading: boolean
  /** Whether operation has completed (success or error) */
  isResolved: boolean
  /** Whether operation completed successfully */
  isSuccess: boolean
  /** Whether operation failed */
  isError: boolean
}

/**
 * Async Hook Configuration
 */
export interface UseAsyncOptions<T> {
  /** Initial data value */
  initialData?: T
  /** Success callback */
  onSuccess?: (data: T) => void
  /** Error callback */
  onError?: (error: Error) => void
  /** Reset error on new execution */
  resetErrorOnExecute?: boolean
  /** Throw errors instead of catching them */
  throwErrors?: boolean
}

/**
 * Async Hook Return Type
 */
export interface UseAsyncReturn<T, TArgs extends unknown[] = []> extends AsyncState<T> {
  /** Execute the async operation */
  execute: (...args: TArgs) => Promise<T>
  /** Reset state to initial values */
  reset: () => void
  /** Set data directly (useful for optimistic updates) */
  setData: (data: T) => void
  /** Set error directly */
  setError: (error: Error) => void
}

/**
 * Async Operation Hook
 * 
 * Manages state for async operations with loading, error, and success states.
 * Handles race conditions and provides convenient state management.
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const { execute, isLoading, data, error } = useAsync<User>(
 *   userService.fetchUser,
 *   {
 *     onSuccess: (user) => console.log('User loaded:', user),
 *     onError: (error) => console.error('Failed to load user:', error)
 *   }
 * )
 * 
 * // Execute operation
 * const handleLoadUser = async () => {
 *   try {
 *     await execute(userId)
 *   } catch (error) {
 *     // Handle error if needed
 *   }
 * }
 * 
 * // In component
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error.message} />
 * return <UserProfile user={data} />
 * ```
 */
export function useAsync<T, TArgs extends unknown[] = []>(
  asyncFunction?: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, TArgs> {
  
  const {
    initialData = null,
    onSuccess,
    onError,
    resetErrorOnExecute = true,
    throwErrors = false
  } = options
  
  // Use ref to track the latest execution to handle race conditions
  const executionRef = useRef<number>(0)
  
  // State management
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: false,
    isResolved: false,
    isSuccess: false,
    isError: false
  })
  
  // Execute async function
  const execute = useCallback(async (...args: TArgs): Promise<T> => {
    if (!asyncFunction) {
      throw new Error('No async function provided to useAsync')
    }
    
    // Increment execution counter to handle race conditions
    const currentExecution = ++executionRef.current
    
    // Reset error if configured to do so
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: resetErrorOnExecute ? null : prevState.error,
      isResolved: false,
      isSuccess: false,
      isError: false
    }))
    
    try {
      const result = await asyncFunction(...args)
      
      // Only update state if this is still the latest execution
      if (currentExecution === executionRef.current) {
        setState({
          data: result,
          error: null,
          isLoading: false,
          isResolved: true,
          isSuccess: true,
          isError: false
        })
        
        onSuccess?.(result)
      }
      
      return result
      
    } catch (error) {
      const errorObject = error instanceof Error ? error : new Error(String(error))
      
      // Only update state if this is still the latest execution
      if (currentExecution === executionRef.current) {
        setState({
          data: null,
          error: errorObject,
          isLoading: false,
          isResolved: true,
          isSuccess: false,
          isError: true
        })
        
        onError?.(errorObject)
      }
      
      if (throwErrors) {
        throw errorObject
      }
      
      // Return a rejected promise for consistency
      throw errorObject
    }
  }, [asyncFunction, resetErrorOnExecute, onSuccess, onError, throwErrors])
  
  // Reset state to initial values
  const reset = useCallback(() => {
    executionRef.current = 0
    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isResolved: false,
      isSuccess: false,
      isError: false
    })
  }, [initialData])
  
  // Set data directly (for optimistic updates)
  const setData = useCallback((data: T) => {
    setState(prevState => ({
      ...prevState,
      data,
      error: null,
      isSuccess: true,
      isError: false,
      isResolved: true
    }))
  }, [])
  
  // Set error directly
  const setError = useCallback((error: Error) => {
    setState(prevState => ({
      ...prevState,
      error,
      isSuccess: false,
      isError: true,
      isResolved: true,
      isLoading: false
    }))
  }, [])
  
  // Cleanup on unmount to prevent state updates
  useEffect(() => {
    return () => {
      executionRef.current = 0
    }
  }, [])
  
  return {
    ...state,
    execute,
    reset,
    setData,
    setError
  }
}

/**
 * Immediate Async Hook
 * 
 * Executes the async function immediately on mount and whenever dependencies change.
 * 
 * @example
 * ```typescript
 * const { data, isLoading, error, refetch } = useAsyncImmediate(
 *   () => userService.fetchUser(userId),
 *   [userId], // Dependencies
 *   {
 *     onSuccess: (user) => console.log('User loaded:', user)
 *   }
 * )
 * ```
 */
export function useAsyncImmediate<T>(
  asyncFunction: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, []> & { refetch: () => Promise<T> } {
  
  const { execute, ...asyncState } = useAsync(asyncFunction, options)
  
  // Execute on mount and when dependencies change
  useEffect(() => {
    execute()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  
  return {
    ...asyncState,
    execute,
    refetch: execute
  }
}

/**
 * Multiple Async Hook
 * 
 * Manages multiple async operations with a shared loading state.
 * Useful when you need to track multiple async operations together.
 * 
 * @example
 * ```typescript
 * const { execute, isLoading, results, errors } = useMultipleAsync([
 *   userService.fetchUser,
 *   postsService.fetchPosts,
 *   settingsService.fetchSettings
 * ])
 * 
 * const loadAll = async () => {
 *   const [user, posts, settings] = await execute([userId], [userId], [])
 * }
 * ```
 */
export function useMultipleAsync<T extends unknown[]>(
  asyncFunctions: { [K in keyof T]: (...args: any[]) => Promise<T[K]> }
): {
  execute: (...args: { [K in keyof T]: Parameters<typeof asyncFunctions[K]> }) => Promise<T>
  isLoading: boolean
  results: (T[keyof T] | null)[]
  errors: (Error | null)[]
  reset: () => void
} {
  
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<(T[keyof T] | null)[]>(() => 
    new Array(asyncFunctions.length).fill(null)
  )
  const [errors, setErrors] = useState<(Error | null)[]>(() => 
    new Array(asyncFunctions.length).fill(null)
  )
  
  const execute = useCallback(async (...argsArray: { [K in keyof T]: Parameters<typeof asyncFunctions[K]> }): Promise<T> => {
    setIsLoading(true)
    setErrors(new Array(asyncFunctions.length).fill(null))
    
    try {
      const promises = asyncFunctions.map((fn, index) => 
        fn(...(argsArray[index] as Parameters<typeof fn>))
      )
      
      const results = await Promise.all(promises) as T
      
      setResults(results)
      setIsLoading(false)
      
      return results
      
    } catch (error) {
      setIsLoading(false)
      throw error
    }
  }, [asyncFunctions])
  
  const reset = useCallback(() => {
    setResults(new Array(asyncFunctions.length).fill(null))
    setErrors(new Array(asyncFunctions.length).fill(null))
    setIsLoading(false)
  }, [asyncFunctions.length])
  
  return {
    execute,
    isLoading,
    results,
    errors,
    reset
  }
}
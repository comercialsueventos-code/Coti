import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Debounce Hook Configuration
 */
export interface UseDebounceOptions {
  /** Delay in milliseconds (default: 300) */
  delay?: number
  /** Leading edge execution */
  leading?: boolean
  /** Trailing edge execution (default: true) */
  trailing?: boolean
  /** Maximum wait time */
  maxWait?: number
}

/**
 * Debounced Value Hook
 * 
 * Returns a debounced version of the input value that only updates
 * after the specified delay has passed without the value changing.
 * 
 * @example
 * ```typescript
 * const [searchTerm, setSearchTerm] = useState('')
 * const debouncedSearchTerm = useDebounce(searchTerm, 500)
 * 
 * // Perform search when debounced value changes
 * useEffect(() => {
 *   if (debouncedSearchTerm) {
 *     performSearch(debouncedSearchTerm)
 *   }
 * }, [debouncedSearchTerm])
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

/**
 * Debounced Callback Hook
 * 
 * Returns a debounced version of a callback function.
 * 
 * @example
 * ```typescript
 * const debouncedSearch = useDebouncedCallback(
 *   (searchTerm: string) => {
 *     performSearch(searchTerm)
 *   },
 *   { delay: 500 }
 * )
 * 
 * const handleInputChange = (e) => {
 *   debouncedSearch(e.target.value)
 * }
 * ```
 */
export function useDebouncedCallback<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  options: UseDebounceOptions = {}
): {
  /** The debounced callback function */
  (...args: TArgs): void
  /** Cancel pending executions */
  cancel: () => void
  /** Execute immediately */
  flush: (...args: TArgs) => void
  /** Check if callback is pending */
  isPending: () => boolean
} {
  
  const {
    delay = 300,
    leading = false,
    trailing = true,
    maxWait
  } = options
  
  const timeoutRef = useRef<NodeJS.Timeout>()
  const maxTimeoutRef = useRef<NodeJS.Timeout>()
  const callbackRef = useRef(callback)
  const argsRef = useRef<TArgs>()
  const lastCallTimeRef = useRef<number>()
  const lastInvokeTimeRef = useRef<number>(0)
  
  // Update callback ref when callback changes
  callbackRef.current = callback
  
  const invokeCallback = useCallback(() => {
    const args = argsRef.current
    if (args) {
      lastInvokeTimeRef.current = Date.now()
      callbackRef.current(...args)
    }
  }, [])
  
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current)
      maxTimeoutRef.current = undefined
    }
    lastCallTimeRef.current = undefined
  }, [])
  
  const flush = useCallback((...args: TArgs) => {
    cancel()
    argsRef.current = args
    invokeCallback()
  }, [cancel, invokeCallback])
  
  const isPending = useCallback(() => {
    return timeoutRef.current !== undefined
  }, [])
  
  const debouncedCallback = useCallback((...args: TArgs) => {
    const currentTime = Date.now()
    const lastCallTime = lastCallTimeRef.current
    
    argsRef.current = args
    lastCallTimeRef.current = currentTime
    
    const shouldCallNow = leading && lastCallTime === undefined
    const shouldSetTimeout = trailing || (!leading && !trailing)
    
    // Cancel existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Call immediately if leading and first call
    if (shouldCallNow) {
      invokeCallback()
    }
    
    // Set up trailing call
    if (shouldSetTimeout) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = undefined
        if (trailing && lastCallTimeRef.current !== undefined) {
          invokeCallback()
        }
      }, delay)
    }
    
    // Handle maxWait
    if (maxWait && !maxTimeoutRef.current) {
      maxTimeoutRef.current = setTimeout(() => {
        maxTimeoutRef.current = undefined
        invokeCallback()
      }, maxWait)
    }
  }, [delay, leading, trailing, maxWait, invokeCallback])
  
  // Cleanup on unmount
  useEffect(() => {
    return cancel
  }, [cancel])
  
  // Add methods to the debounced function
  Object.assign(debouncedCallback, {
    cancel,
    flush,
    isPending
  })
  
  return debouncedCallback as typeof debouncedCallback & {
    cancel: () => void
    flush: (...args: TArgs) => void
    isPending: () => boolean
  }
}

/**
 * Debounced State Hook
 * 
 * Combines useState with debouncing, providing both immediate and debounced values.
 * 
 * @example
 * ```typescript
 * const {
 *   value,           // Immediate value
 *   debouncedValue,  // Debounced value
 *   setValue,        // Set immediate value
 *   isPending        // Whether debounce is pending
 * } = useDebouncedState('', 500)
 * 
 * // Use immediate value for input
 * <input value={value} onChange={(e) => setValue(e.target.value)} />
 * 
 * // Use debounced value for API calls
 * useEffect(() => {
 *   if (debouncedValue) {
 *     searchAPI(debouncedValue)
 *   }
 * }, [debouncedValue])
 * ```
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay = 300
): {
  /** Current immediate value */
  value: T
  /** Debounced value */
  debouncedValue: T
  /** Set the immediate value */
  setValue: (value: T | ((prev: T) => T)) => void
  /** Whether debounce is pending */
  isPending: boolean
} {
  
  const [value, setValue] = useState<T>(initialValue)
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue)
  const [isPending, setIsPending] = useState(false)
  
  useEffect(() => {
    if (value === debouncedValue) {
      setIsPending(false)
      return
    }
    
    setIsPending(true)
    
    const handler = setTimeout(() => {
      setDebouncedValue(value)
      setIsPending(false)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, debouncedValue, delay])
  
  return {
    value,
    debouncedValue,
    setValue,
    isPending
  }
}
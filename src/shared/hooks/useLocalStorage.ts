import { useState, useCallback, useEffect } from 'react'

/**
 * Local Storage Hook Options
 */
export interface UseLocalStorageOptions<T> {
  /** Serialize function (default: JSON.stringify) */
  serialize?: (value: T) => string
  /** Deserialize function (default: JSON.parse) */
  deserialize?: (value: string) => T
  /** Default value when key doesn't exist */
  defaultValue?: T
  /** Callback when storage changes */
  onError?: (error: Error) => void
}

/**
 * Local Storage Hook
 * 
 * Provides persistent state management using localStorage with
 * automatic serialization, error handling, and SSR safety.
 * 
 * @example
 * ```typescript
 * const [user, setUser] = useLocalStorage<User>('user', null)
 * const [preferences, setPreferences] = useLocalStorage('preferences', {
 *   theme: 'light',
 *   language: 'es'
 * })
 * 
 * const [settings, setSettings, { remove, clear }] = useLocalStorage('settings', {
 *   notifications: true
 * })
 * 
 * // Remove item
 * remove()
 * 
 * // Clear all localStorage
 * clear()
 * ```
 */
export function useLocalStorage<T>(
  key: string,
  initialValue?: T,
  options: UseLocalStorageOptions<T> = {}
): [
  T,
  (value: T | ((prev: T) => T)) => void,
  {
    remove: () => void
    clear: () => void
    refresh: () => void
  }
] {
  
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    defaultValue = initialValue,
    onError
  } = options
  
  // Initialize state
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Return default value during SSR
    if (typeof window === 'undefined') {
      return defaultValue as T
    }
    
    try {
      const item = window.localStorage.getItem(key)
      if (item === null) {
        return defaultValue as T
      }
      return deserialize(item)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return defaultValue as T
    }
  })
  
  // Set value in localStorage and state
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      // Save to state
      setStoredValue(valueToStore)
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        if (valueToStore === undefined || valueToStore === null) {
          window.localStorage.removeItem(key)
        } else {
          window.localStorage.setItem(key, serialize(valueToStore))
        }
        
        // Dispatch storage event for cross-tab communication
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, newValue: valueToStore, oldValue: storedValue }
        }))
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, serialize, storedValue, onError])
  
  // Remove item from localStorage
  const remove = useCallback(() => {
    try {
      setStoredValue(defaultValue as T)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
        
        // Dispatch storage event
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key, newValue: null, oldValue: storedValue }
        }))
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, defaultValue, storedValue, onError])
  
  // Clear all localStorage
  const clear = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear()
        
        // Dispatch storage event
        window.dispatchEvent(new CustomEvent('local-storage', {
          detail: { key: null, newValue: null, oldValue: null }
        }))
      }
      
      // Reset to default value
      setStoredValue(defaultValue as T)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [defaultValue, onError])
  
  // Refresh value from localStorage
  const refresh = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key)
        if (item === null) {
          setStoredValue(defaultValue as T)
        } else {
          setStoredValue(deserialize(item))
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      setStoredValue(defaultValue as T)
    }
  }, [key, deserialize, defaultValue, onError])
  
  // Listen for storage changes (cross-tab communication)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      let eventKey: string | null
      let newValue: string | null
      
      if (e instanceof StorageEvent) {
        eventKey = e.key
        newValue = e.newValue
      } else {
        const detail = (e as CustomEvent).detail
        eventKey = detail.key
        newValue = detail.newValue ? serialize(detail.newValue) : null
      }
      
      if (eventKey === key || eventKey === null) {
        try {
          if (newValue === null) {
            setStoredValue(defaultValue as T)
          } else {
            setStoredValue(deserialize(newValue))
          }
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error(String(error)))
          setStoredValue(defaultValue as T)
        }
      }
    }
    
    // Listen for both native storage events and custom events
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-storage', handleStorageChange as EventListener)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-storage', handleStorageChange as EventListener)
    }
  }, [key, deserialize, serialize, defaultValue, onError])
  
  return [storedValue, setValue, { remove, clear, refresh }]
}

/**
 * Session Storage Hook
 * 
 * Similar to useLocalStorage but uses sessionStorage instead.
 * Data persists only for the browser session.
 * 
 * @example
 * ```typescript
 * const [tempData, setTempData] = useSessionStorage('tempData', {})
 * ```
 */
export function useSessionStorage<T>(
  key: string,
  initialValue?: T,
  options: UseLocalStorageOptions<T> = {}
): [
  T,
  (value: T | ((prev: T) => T)) => void,
  {
    remove: () => void
    clear: () => void
    refresh: () => void
  }
] {
  
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    defaultValue = initialValue,
    onError
  } = options
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue as T
    }
    
    try {
      const item = window.sessionStorage.getItem(key)
      if (item === null) {
        return defaultValue as T
      }
      return deserialize(item)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return defaultValue as T
    }
  })
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        if (valueToStore === undefined || valueToStore === null) {
          window.sessionStorage.removeItem(key)
        } else {
          window.sessionStorage.setItem(key, serialize(valueToStore))
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, serialize, storedValue, onError])
  
  const remove = useCallback(() => {
    try {
      setStoredValue(defaultValue as T)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, defaultValue, onError])
  
  const clear = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.clear()
      }
      setStoredValue(defaultValue as T)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [defaultValue, onError])
  
  const refresh = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.sessionStorage.getItem(key)
        if (item === null) {
          setStoredValue(defaultValue as T)
        } else {
          setStoredValue(deserialize(item))
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      setStoredValue(defaultValue as T)
    }
  }, [key, deserialize, defaultValue, onError])
  
  return [storedValue, setValue, { remove, clear, refresh }]
}

/**
 * Storage State Hook
 * 
 * Generic hook that can work with any storage implementation.
 * 
 * @example
 * ```typescript
 * // Custom storage implementation
 * const customStorage = {
 *   getItem: (key: string) => // custom implementation,
 *   setItem: (key: string, value: string) => // custom implementation,
 *   removeItem: (key: string) => // custom implementation,
 *   clear: () => // custom implementation
 * }
 * 
 * const [value, setValue] = useStorageState('key', 'default', customStorage)
 * ```
 */
export function useStorageState<T>(
  key: string,
  defaultValue: T,
  storage: Storage,
  options: Omit<UseLocalStorageOptions<T>, 'defaultValue'> = {}
): [T, (value: T | ((prev: T) => T)) => void] {
  
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError
  } = options
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = storage.getItem(key)
      if (item === null) {
        return defaultValue
      }
      return deserialize(item)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
      return defaultValue
    }
  })
  
  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      
      setStoredValue(valueToStore)
      
      if (valueToStore === undefined || valueToStore === null) {
        storage.removeItem(key)
      } else {
        storage.setItem(key, serialize(valueToStore))
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)))
    }
  }, [key, serialize, storedValue, storage, onError])
  
  return [storedValue, setValue]
}
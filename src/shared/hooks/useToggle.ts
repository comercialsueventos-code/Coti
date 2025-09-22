import { useState, useCallback } from 'react'

/**
 * Toggle Hook Configuration
 */
export interface UseToggleOptions {
  /** Initial value (default: false) */
  initial?: boolean
  /** Callback when value changes */
  onChange?: (value: boolean) => void
}

/**
 * Toggle Hook Return Type
 */
export interface UseToggleReturn {
  /** Current toggle value */
  value: boolean
  /** Set toggle to true */
  setTrue: () => void
  /** Set toggle to false */
  setFalse: () => void
  /** Toggle the current value */
  toggle: () => void
  /** Set to specific boolean value */
  setValue: (value: boolean) => void
  /** Reset to initial value */
  reset: () => void
}

/**
 * Boolean Toggle Hook
 * 
 * Provides convenient state management for boolean values with
 * common operations like toggle, setTrue, setFalse, etc.
 * 
 * @example
 * ```typescript
 * const modal = useToggle()
 * const loading = useToggle(true)
 * const sidebar = useToggle({ 
 *   initial: false, 
 *   onChange: (open) => console.log('Sidebar:', open)
 * })
 * 
 * // Usage
 * <Button onClick={modal.setTrue}>Open Modal</Button>
 * <Modal open={modal.value} onClose={modal.setFalse} />
 * ```
 */
export function useToggle(options?: boolean | UseToggleOptions): UseToggleReturn {
  // Handle both boolean and options parameter
  const config = typeof options === 'boolean' 
    ? { initial: options } 
    : options || {}
    
  const { initial = false, onChange } = config
  
  const [value, setState] = useState(initial)
  
  const setTrue = useCallback(() => {
    setState(true)
    onChange?.(true)
  }, [onChange])
  
  const setFalse = useCallback(() => {
    setState(false)
    onChange?.(false)
  }, [onChange])
  
  const toggle = useCallback(() => {
    setState(prev => {
      const newValue = !prev
      onChange?.(newValue)
      return newValue
    })
  }, [onChange])
  
  const setValue = useCallback((newValue: boolean) => {
    setState(newValue)
    onChange?.(newValue)
  }, [onChange])
  
  const reset = useCallback(() => {
    setState(initial)
    onChange?.(initial)
  }, [initial, onChange])
  
  return {
    value,
    setTrue,
    setFalse,
    toggle,
    setValue,
    reset
  }
}
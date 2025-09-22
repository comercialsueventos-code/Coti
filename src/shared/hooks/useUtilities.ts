import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * Previous Value Hook
 * 
 * Returns the previous value of a variable from the last render.
 * 
 * @example
 * ```typescript
 * const [count, setCount] = useState(0)
 * const prevCount = usePrevious(count)
 * 
 * // prevCount will be the value of count from the previous render
 * console.log(`Count changed from ${prevCount} to ${count}`)
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  
  useEffect(() => {
    ref.current = value
  })
  
  return ref.current
}

/**
 * Modal State Hook
 * 
 * Manages modal/dialog state with convenience methods.
 * 
 * @example
 * ```typescript
 * const modal = useModal()
 * const confirmModal = useModal(false)
 * 
 * return (
 *   <>
 *     <button onClick={modal.open}>Open Modal</button>
 *     <Modal 
 *       open={modal.isOpen} 
 *       onClose={modal.close}
 *       onExited={modal.onExited}
 *     />
 *   </>
 * )
 * ```
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState<any>(null)
  
  const open = useCallback((modalData?: any) => {
    setData(modalData || null)
    setIsOpen(true)
  }, [])
  
  const close = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  const toggle = useCallback((modalData?: any) => {
    if (isOpen) {
      close()
    } else {
      open(modalData)
    }
  }, [isOpen, open, close])
  
  // Called when modal animation completes
  const onExited = useCallback(() => {
    setData(null)
  }, [])
  
  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    onExited
  }
}

/**
 * Counter Hook
 * 
 * Manages a counter with increment, decrement, reset, and set operations.
 * 
 * @example
 * ```typescript
 * const counter = useCounter(0, { min: 0, max: 100 })
 * 
 * return (
 *   <div>
 *     <button onClick={counter.decrement}>-</button>
 *     <span>{counter.count}</span>
 *     <button onClick={counter.increment}>+</button>
 *     <button onClick={counter.reset}>Reset</button>
 *   </div>
 * )
 * ```
 */
export function useCounter(
  initialValue = 0,
  options: { min?: number; max?: number; step?: number } = {}
) {
  const { min, max, step = 1 } = options
  const [count, setCount] = useState(initialValue)
  
  const increment = useCallback(() => {
    setCount(prev => {
      const newValue = prev + step
      return max !== undefined ? Math.min(newValue, max) : newValue
    })
  }, [step, max])
  
  const decrement = useCallback(() => {
    setCount(prev => {
      const newValue = prev - step
      return min !== undefined ? Math.max(newValue, min) : newValue
    })
  }, [step, min])
  
  const reset = useCallback(() => {
    setCount(initialValue)
  }, [initialValue])
  
  const set = useCallback((value: number | ((prev: number) => number)) => {
    setCount(prev => {
      const newValue = typeof value === 'function' ? value(prev) : value
      
      let clampedValue = newValue
      if (min !== undefined) clampedValue = Math.max(clampedValue, min)
      if (max !== undefined) clampedValue = Math.min(clampedValue, max)
      
      return clampedValue
    })
  }, [min, max])
  
  return {
    count,
    increment,
    decrement,
    reset,
    set,
    isAtMax: max !== undefined && count >= max,
    isAtMin: min !== undefined && count <= min
  }
}

/**
 * Clipboard Hook
 * 
 * Provides clipboard operations with feedback.
 * 
 * @example
 * ```typescript
 * const { copyToClipboard, isSupported, hasCopied, error } = useClipboard()
 * 
 * const handleCopy = () => {
 *   copyToClipboard('Hello World!')
 * }
 * 
 * return (
 *   <button onClick={handleCopy} disabled={!isSupported}>
 *     {hasCopied ? 'Copied!' : 'Copy'}
 *   </button>
 * )
 * ```
 */
export function useClipboard(resetTimeoutMs = 2000) {
  const [hasCopied, setHasCopied] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  const isSupported = typeof navigator !== 'undefined' && navigator.clipboard
  
  const copyToClipboard = useCallback(async (text: string) => {
    if (!isSupported) {
      const error = new Error('Clipboard API not supported')
      setError(error)
      throw error
    }
    
    try {
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      setError(null)
      
      // Clear timeout if it exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Reset hasCopied after timeout
      timeoutRef.current = setTimeout(() => {
        setHasCopied(false)
      }, resetTimeoutMs)
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setHasCopied(false)
      throw error
    }
  }, [isSupported, resetTimeoutMs])
  
  const readFromClipboard = useCallback(async (): Promise<string> => {
    if (!isSupported) {
      const error = new Error('Clipboard API not supported')
      setError(error)
      throw error
    }
    
    try {
      const text = await navigator.clipboard.readText()
      setError(null)
      return text
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      throw error
    }
  }, [isSupported])
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])
  
  return {
    copyToClipboard,
    readFromClipboard,
    hasCopied,
    error,
    isSupported
  }
}

/**
 * Online Status Hook
 * 
 * Tracks the user's online/offline status.
 * 
 * @example
 * ```typescript
 * const isOnline = useOnline()
 * 
 * return (
 *   <div>
 *     Status: {isOnline ? 'Online' : 'Offline'}
 *   </div>
 * )
 * ```
 */
export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return isOnline
}

/**
 * Window Size Hook
 * 
 * Tracks the window size and provides common breakpoint utilities.
 * 
 * @example
 * ```typescript
 * const { width, height, isMobile, isTablet, isDesktop } = useWindowSize()
 * 
 * return (
 *   <div>
 *     Size: {width} x {height}
 *     {isMobile && <MobileComponent />}
 *     {isDesktop && <DesktopComponent />}
 *   </div>
 * )
 * ```
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    
    // Call handler right away so state gets updated with initial window size
    handleResize()
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return {
    width: windowSize.width,
    height: windowSize.height,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024
  }
}

/**
 * Interval Hook
 * 
 * Manages intervals with automatic cleanup.
 * 
 * @example
 * ```typescript
 * const { start, stop, isActive } = useInterval(() => {
 *   console.log('Tick')
 * }, 1000)
 * 
 * return (
 *   <div>
 *     <button onClick={start}>Start</button>
 *     <button onClick={stop}>Stop</button>
 *     <div>Status: {isActive ? 'Running' : 'Stopped'}</div>
 *   </div>
 * )
 * ```
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  options: { immediate?: boolean; autoStart?: boolean } = {}
) {
  const { immediate = false, autoStart = false } = options
  const savedCallback = useRef(callback)
  const intervalRef = useRef<NodeJS.Timeout>()
  const [isActive, setIsActive] = useState(autoStart)
  
  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])
  
  const start = useCallback(() => {
    if (delay === null) return
    
    if (immediate) {
      savedCallback.current()
    }
    
    intervalRef.current = setInterval(() => {
      savedCallback.current()
    }, delay)
    
    setIsActive(true)
  }, [delay, immediate])
  
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }
    setIsActive(false)
  }, [])
  
  const reset = useCallback(() => {
    stop()
    if (autoStart) {
      start()
    }
  }, [stop, start, autoStart])
  
  // Auto start if configured
  useEffect(() => {
    if (autoStart) {
      start()
    }
    
    return stop
  }, [autoStart, start, stop])
  
  // Cleanup on unmount
  useEffect(() => {
    return stop
  }, [stop])
  
  return {
    start,
    stop,
    reset,
    isActive
  }
}
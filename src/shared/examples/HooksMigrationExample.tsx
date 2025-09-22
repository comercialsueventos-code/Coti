/**
 * Hooks Migration Example: Before vs After
 * 
 * Demonstrates how to migrate from existing hook patterns to consolidated hooks.
 * This file shows the transformation patterns but should not be used in production.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  // NEW: All hooks imported from consolidated shared module
  useFormState,
  useAsync,
  useToggle,
  useDebounce,
  useLocalStorage,
  useModal,
  usePrevious,
  useCounter,
  useClipboard,
  useOnline,
  useWindowSize,
  BaseForm,
  EntityDialog
} from '@/shared'

// --- BEFORE: Traditional Hook Patterns ---

/*
// OLD WAY: Manual state management with lots of boilerplate
const OldFormComponent: React.FC = () => {
  // Lots of manual state management
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  
  // Manual validation
  const validateForm = async () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name) newErrors.name = 'Name required'
    if (!formData.email) newErrors.email = 'Email required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Manual field handling
  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setTouchedFields(prev => new Set([...prev, field]))
    setIsDirty(true)
    // Manual validation logic...
  }
  
  // Manual submit handling
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const isValid = await validateForm()
      if (isValid) {
        // Submit logic...
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Lots of JSX with manual prop passing...
}

// OLD WAY: Manual async state management
const OldAsyncComponent: React.FC = () => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.fetchData()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }
  
  // Manual effect management, race conditions, etc.
}

// OLD WAY: Manual toggle state
const OldToggleComponent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const toggleOpen = () => setIsOpen(!isOpen)
  const showModal = () => setIsOpen(true)
  const hideModal = () => setIsOpen(false)
  
  // Repeated patterns across components...
}
*/

// --- AFTER: Consolidated Hook Patterns ---

/**
 * NEW WAY: Form management with useFormState
 */
interface UserFormData {
  name: string
  email: string
  age: number
}

const ConsolidatedFormExample: React.FC = () => {
  const { state, actions } = useFormState<UserFormData>({
    initialData: { name: '', email: '', age: 0 },
    validator: (data) => {
      const errors: Record<string, string> = {}
      if (!data.name) errors.name = 'Name is required'
      if (!data.email) errors.email = 'Email is required'
      if (data.age < 18) errors.age = 'Must be 18 or older'
      return errors
    },
    validateOnChange: true,
    onSubmit: async (data, isValid) => {
      if (isValid) {
        console.log('Submitting:', data)
        // API call here
      }
    }
  })
  
  return (
    <BaseForm
      title="User Registration"
      isSubmitting={state.isSubmitting}
      error={state.errors._form}
      onSubmit={actions.handleSubmit}
      onCancel={() => actions.reset()}
    >
      <input {...actions.getFieldProps('name')} placeholder="Name" />
      <input {...actions.getFieldProps('email')} placeholder="Email" />
      <input {...actions.getFieldProps('age')} type="number" placeholder="Age" />
    </BaseForm>
  )
}

/**
 * NEW WAY: Async operations with useAsync
 */
const ConsolidatedAsyncExample: React.FC = () => {
  const { execute, data, isLoading, error, reset } = useAsync(
    async (userId: number) => {
      // Simulated API call
      const response = await fetch(`/api/users/${userId}`)
      return response.json()
    },
    {
      onSuccess: (user) => console.log('User loaded:', user),
      onError: (error) => console.error('Failed to load user:', error)
    }
  )
  
  const handleLoadUser = (userId: number) => {
    execute(userId)
  }
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      <button onClick={() => handleLoadUser(1)}>Load User 1</button>
      <button onClick={() => handleLoadUser(2)}>Load User 2</button>
      <button onClick={reset}>Reset</button>
      {data && <div>User: {JSON.stringify(data)}</div>}
    </div>
  )
}

/**
 * NEW WAY: Toggle states with useToggle
 */
const ConsolidatedToggleExample: React.FC = () => {
  const modal = useModal()
  const sidebar = useToggle(false)
  const notifications = useToggle({ 
    initial: true, 
    onChange: (enabled) => console.log('Notifications:', enabled)
  })
  
  return (
    <div>
      <button onClick={sidebar.toggle}>
        {sidebar.value ? 'Hide' : 'Show'} Sidebar
      </button>
      
      <button onClick={modal.open}>Open Modal</button>
      
      <button onClick={notifications.toggle}>
        Notifications: {notifications.value ? 'On' : 'Off'}
      </button>
      
      <EntityDialog
        open={modal.isOpen}
        onClose={modal.close}
        type="custom"
        entityName="example"
      >
        <div>Modal Content</div>
      </EntityDialog>
    </div>
  )
}

/**
 * NEW WAY: Debounced search with useDebounce
 */
const ConsolidatedSearchExample: React.FC = () => {
  const {
    value: searchTerm,
    debouncedValue,
    setValue: setSearchTerm,
    isPending
  } = useDebouncedState('', 500)
  
  const { execute, data, isLoading } = useAsync(
    async (query: string) => {
      if (!query) return []
      const response = await fetch(`/api/search?q=${query}`)
      return response.json()
    }
  )
  
  // Execute search when debounced value changes
  React.useEffect(() => {
    execute(debouncedValue)
  }, [debouncedValue, execute])
  
  return (
    <div>
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      
      {isPending && <div>Typing...</div>}
      {isLoading && <div>Searching...</div>}
      
      {data && (
        <div>
          {data.map((item: any) => (
            <div key={item.id}>{item.name}</div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * NEW WAY: Persistent state with useLocalStorage
 */
const ConsolidatedStorageExample: React.FC = () => {
  const [preferences, setPreferences] = useLocalStorage('userPreferences', {
    theme: 'light',
    language: 'es',
    notifications: true
  })
  
  const [sessionData, setSessionData] = useLocalStorage('sessionData', {
    lastVisited: new Date().toISOString()
  })
  
  return (
    <div>
      <h3>Preferences (persistent)</h3>
      <label>
        Theme:
        <select
          value={preferences.theme}
          onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      
      <label>
        Language:
        <select
          value={preferences.language}
          onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
        >
          <option value="es">Español</option>
          <option value="en">English</option>
        </select>
      </label>
      
      <div>Last visited: {sessionData.lastVisited}</div>
    </div>
  )
}

/**
 * NEW WAY: Utility hooks showcase
 */
const ConsolidatedUtilitiesExample: React.FC = () => {
  const [count, setCount] = useState(0)
  const prevCount = usePrevious(count)
  
  const counter = useCounter(0, { min: 0, max: 10 })
  const { copyToClipboard, hasCopied } = useClipboard()
  const isOnline = useOnline()
  const { width, isMobile } = useWindowSize()
  
  return (
    <div>
      <h3>Previous Value</h3>
      <div>Count: {count} (was: {prevCount})</div>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      
      <h3>Counter with Limits</h3>
      <button onClick={counter.decrement} disabled={counter.isAtMin}>-</button>
      <span>{counter.count}</span>
      <button onClick={counter.increment} disabled={counter.isAtMax}>+</button>
      <button onClick={counter.reset}>Reset</button>
      
      <h3>Clipboard</h3>
      <button onClick={() => copyToClipboard('Hello World!')}>
        {hasCopied ? 'Copied!' : 'Copy Text'}
      </button>
      
      <h3>Online Status</h3>
      <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
      
      <h3>Window Size</h3>
      <div>Width: {width}px ({isMobile ? 'Mobile' : 'Desktop'})</div>
    </div>
  )
}

// --- Migration Benefits Summary ---

/**
 * HOOKS CONSOLIDATION BENEFITS:
 * 
 * 🎯 Code Reduction:
 * - Before: ~100 lines of boilerplate per form component
 * - After: ~20 lines with useFormState
 * - 80% reduction in form handling code
 * 
 * 🔧 Consistency:
 * - Standardized patterns across all components
 * - Unified error handling and validation
 * - Consistent async state management
 * 
 * 🚀 Developer Experience:
 * - Type-safe hooks with full TypeScript support
 * - Built-in best practices (debouncing, race condition handling, etc.)
 * - Automatic cleanup and memory management
 * 
 * 🧪 Testing:
 * - Hooks can be tested independently
 * - Predictable behavior across components
 * - Easier mocking and stubbing
 * 
 * 📈 Performance:
 * - Optimized re-renders with useCallback and useMemo
 * - Debouncing and throttling built-in
 * - Memory leak prevention
 * 
 * 🎨 Features:
 * - Cross-tab communication (localStorage)
 * - Race condition handling (async)
 * - Accessibility support (form validation)
 * - Responsive design utilities (window size)
 * - Offline support detection
 */

// Example component using multiple consolidated hooks together
const ComprehensiveExample: React.FC = () => {
  // Form state
  const form = useFormState({
    initialData: { search: '', category: 'all' },
    validateOnChange: true
  })
  
  // Async data fetching
  const { execute: search, data, isLoading } = useAsync(searchAPI)
  
  // UI state
  const modal = useModal()
  const sidebar = useToggle(false)
  
  // Utilities
  const { copyToClipboard } = useClipboard()
  const [savedSearches] = useLocalStorage('savedSearches', [])
  
  // Debounced search
  const debouncedSearch = useDebounce(form.state.data.search, 300)
  
  // Effect for search
  React.useEffect(() => {
    if (debouncedSearch) {
      search(debouncedSearch, form.state.data.category)
    }
  }, [debouncedSearch, form.state.data.category, search])
  
  return (
    <div>
      <form onSubmit={form.actions.handleSubmit}>
        <input {...form.actions.getFieldProps('search')} placeholder="Search..." />
        <select {...form.actions.getFieldProps('category')}>
          <option value="all">All Categories</option>
          <option value="products">Products</option>
          <option value="users">Users</option>
        </select>
      </form>
      
      {isLoading && <div>Searching...</div>}
      
      {data && (
        <div>
          <button onClick={() => copyToClipboard(JSON.stringify(data))}>
            Copy Results
          </button>
          {/* Render results */}
        </div>
      )}
    </div>
  )
}

// Mock search API
async function searchAPI(query: string, category: string) {
  await new Promise(resolve => setTimeout(resolve, 1000))
  return [
    { id: 1, name: `Result for ${query} in ${category}` },
    { id: 2, name: `Another result for ${query}` }
  ]
}

export default {
  ConsolidatedFormExample,
  ConsolidatedAsyncExample,
  ConsolidatedToggleExample,
  ConsolidatedSearchExample,
  ConsolidatedStorageExample,
  ConsolidatedUtilitiesExample,
  ComprehensiveExample
}
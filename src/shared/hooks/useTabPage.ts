import { useState, useCallback } from 'react'

/**
 * Tab Page Configuration
 */
export interface TabPageConfig {
  /** Initial tab index (default: 0) */
  initialTab?: number
  
  /** Tab labels for accessibility */
  tabLabels?: string[]
  
  /** Enable search functionality */
  enableSearch?: boolean
  
  /** Enable filtering functionality */  
  enableFiltering?: boolean
  
  /** Initial search term */
  initialSearchTerm?: string
  
  /** Initial filter values */
  initialFilters?: Record<string, any>
}

/**
 * Tab Page State
 */
export interface TabPageState {
  // Tab state
  currentTab: number
  
  // Search state (if enabled)
  searchTerm: string
  searchResults?: any[]
  
  // Filter state (if enabled)
  filters: Record<string, any>
  filteredResults?: any[]
  
  // Loading states
  isLoading: boolean
  isSearching: boolean
  isFiltering: boolean
  
  // General state
  data: any[]
}

/**
 * Tab Page Actions
 */
export interface TabPageActions {
  // Tab actions
  setCurrentTab: (tab: number) => void
  goToNextTab: () => void
  goToPreviousTab: () => void
  
  // Search actions (if enabled)
  setSearchTerm: (term: string) => void
  performSearch: (term?: string) => void
  clearSearch: () => void
  
  // Filter actions (if enabled)
  setFilter: (key: string, value: any) => void
  setFilters: (filters: Record<string, any>) => void
  clearFilters: () => void
  clearFilter: (key: string) => void
  
  // Data actions
  setData: (data: any[]) => void
  setLoading: (loading: boolean) => void
}

/**
 * Complete Tab Page hook return type
 */
export interface TabPageHook {
  state: TabPageState
  actions: TabPageActions
  
  // Helper computed values
  hasSearch: boolean
  hasFilters: boolean
  activeFiltersCount: number
  hasActiveSearch: boolean
}

/**
 * Tab Page Hook
 * 
 * Manages common state patterns for tab-based pages including:
 * - Tab navigation
 * - Search functionality
 * - Filtering capabilities
 * - Loading states
 * 
 * @example
 * ```typescript
 * const { state, actions } = useTabPage({
 *   initialTab: 0,
 *   enableSearch: true,
 *   enableFiltering: true,
 *   tabLabels: ['All Items', 'Active', 'Inactive']
 * })
 * ```
 */
export function useTabPage({
  initialTab = 0,
  tabLabels = [],
  enableSearch = false,
  enableFiltering = false,
  initialSearchTerm = '',
  initialFilters = {}
}: TabPageConfig = {}): TabPageHook {
  
  // Tab state
  const [currentTab, setCurrentTab] = useState(initialTab)
  
  // Search state
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Filter state
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters)
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  
  // General state
  const [data, setData] = useState<any[]>([])
  const [isLoading, setLoading] = useState(false)
  
  // Tab actions
  const handleSetCurrentTab = useCallback((tab: number) => {
    if (tab >= 0 && (tabLabels.length === 0 || tab < tabLabels.length)) {
      setCurrentTab(tab)
    }
  }, [tabLabels.length])
  
  const goToNextTab = useCallback(() => {
    const maxTab = tabLabels.length > 0 ? tabLabels.length - 1 : 10
    if (currentTab < maxTab) {
      setCurrentTab(currentTab + 1)
    }
  }, [currentTab, tabLabels.length])
  
  const goToPreviousTab = useCallback(() => {
    if (currentTab > 0) {
      setCurrentTab(currentTab - 1)
    }
  }, [currentTab])
  
  // Search actions
  const handleSetSearchTerm = useCallback((term: string) => {
    if (enableSearch) {
      setSearchTerm(term)
    }
  }, [enableSearch])
  
  const performSearch = useCallback((term?: string) => {
    if (!enableSearch) return
    
    const searchQuery = term ?? searchTerm
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    setIsSearching(true)
    
    // Simple search implementation - can be overridden by components
    try {
      const results = data.filter(item => {
        const searchableText = JSON.stringify(item).toLowerCase()
        return searchableText.includes(searchQuery.toLowerCase())
      })
      
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [enableSearch, searchTerm, data])
  
  const clearSearch = useCallback(() => {
    if (enableSearch) {
      setSearchTerm('')
      setSearchResults([])
    }
  }, [enableSearch])
  
  // Filter actions
  const setFilter = useCallback((key: string, value: any) => {
    if (enableFiltering) {
      setFilters(prev => ({
        ...prev,
        [key]: value
      }))
    }
  }, [enableFiltering])
  
  const handleSetFilters = useCallback((newFilters: Record<string, any>) => {
    if (enableFiltering) {
      setFilters(newFilters)
    }
  }, [enableFiltering])
  
  const clearFilters = useCallback(() => {
    if (enableFiltering) {
      setFilters({})
      setFilteredResults([])
    }
  }, [enableFiltering])
  
  const clearFilter = useCallback((key: string) => {
    if (enableFiltering) {
      setFilters(prev => {
        const { [key]: removed, ...rest } = prev
        return rest
      })
    }
  }, [enableFiltering])
  
  // Data actions
  const handleSetData = useCallback((newData: any[]) => {
    setData(newData)
    
    // Clear search and filter results when data changes
    if (enableSearch) setSearchResults([])
    if (enableFiltering) setFilteredResults([])
  }, [enableSearch, enableFiltering])
  
  const handleSetLoading = useCallback((loading: boolean) => {
    setLoading(loading)
  }, [])
  
  // Computed values
  const hasSearch = enableSearch
  const hasFilters = enableFiltering
  const activeFiltersCount = Object.keys(filters).filter(key => {
    const value = filters[key]
    return value !== null && value !== undefined && value !== ''
  }).length
  const hasActiveSearch = enableSearch && searchTerm.length > 0
  
  // Build state and actions
  const state: TabPageState = {
    currentTab,
    searchTerm,
    searchResults: enableSearch ? searchResults : undefined,
    filters,
    filteredResults: enableFiltering ? filteredResults : undefined,
    isLoading,
    isSearching: enableSearch ? isSearching : false,
    isFiltering: enableFiltering ? isFiltering : false,
    data
  }
  
  const actions: TabPageActions = {
    setCurrentTab: handleSetCurrentTab,
    goToNextTab,
    goToPreviousTab,
    setSearchTerm: handleSetSearchTerm,
    performSearch,
    clearSearch,
    setFilter,
    setFilters: handleSetFilters,
    clearFilters,
    clearFilter,
    setData: handleSetData,
    setLoading: handleSetLoading
  }
  
  return {
    state,
    actions,
    hasSearch,
    hasFilters,
    activeFiltersCount,
    hasActiveSearch
  }
}
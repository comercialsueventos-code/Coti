import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MachineryService } from '../services/machinery.service'
import { Machinery, CreateMachineryData, UpdateMachineryData, MachineryFilters } from '../types'

// Query keys
export const MACHINERY_QUERY_KEYS = {
  all: ['machinery'] as const,
  lists: () => [...MACHINERY_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: MachineryFilters) => [...MACHINERY_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...MACHINERY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MACHINERY_QUERY_KEYS.details(), id] as const,
  statistics: () => [...MACHINERY_QUERY_KEYS.all, 'statistics'] as const,
  search: (term: string) => [...MACHINERY_QUERY_KEYS.all, 'search', term] as const,
  category: (category: string) => [...MACHINERY_QUERY_KEYS.all, 'category', category] as const,
  available: (date: string, hours: number, category?: string) => 
    [...MACHINERY_QUERY_KEYS.all, 'available', date, hours, category] as const,
  availability: (machineryId: number, date: string, hours: number) =>
    [...MACHINERY_QUERY_KEYS.all, 'availability', machineryId, date, hours] as const,
  maintenance: () => [...MACHINERY_QUERY_KEYS.all, 'maintenance'] as const
}

/**
 * Hook for fetching all machinery with optional filters
 */
export function useMachinery(filters?: MachineryFilters) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.list(filters),
    queryFn: () => MachineryService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single machinery by ID
 */
export function useMachineryDetail(id: number) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.detail(id),
    queryFn: () => MachineryService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching machinery statistics
 */
export function useMachineryStatistics() {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.statistics(),
    queryFn: () => MachineryService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for searching machinery
 */
export function useMachinerySearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.search(searchTerm),
    queryFn: () => MachineryService.search(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching machinery by category
 */
export function useMachineryByCategory(category: string, enabled: boolean = true) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.category(category),
    queryFn: () => MachineryService.getByCategory(category),
    enabled: enabled && !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching available machinery for a date/time
 */
export function useAvailableMachinery(
  date: string, 
  hours: number, 
  category?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.available(date, hours, category),
    queryFn: () => MachineryService.getAvailableMachinery(date, hours, category),
    enabled: enabled && !!date && hours > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for checking machinery availability
 */
export function useMachineryAvailability(
  machineryId: number, 
  date: string, 
  hours: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.availability(machineryId, date, hours),
    queryFn: () => MachineryService.checkAvailability(machineryId, date, hours),
    enabled: enabled && !!machineryId && !!date && hours > 0,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Hook for fetching machinery needing maintenance
 */
export function useMachineryNeedingMaintenance() {
  return useQuery({
    queryKey: MACHINERY_QUERY_KEYS.maintenance(),
    queryFn: () => MachineryService.getMachineryNeedingMaintenance(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

/**
 * Hook for creating new machinery
 */
export function useCreateMachinery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (machineryData: CreateMachineryData) => {
      return MachineryService.create(machineryData)
    },
    onSuccess: (newMachinery) => {
      // Invalidate and refetch machinery lists
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.statistics() })
      
      // Add the new machinery to cache
      queryClient.setQueryData(MACHINERY_QUERY_KEYS.detail(newMachinery.id), newMachinery)
    },
  })
}

/**
 * Hook for updating machinery
 */
export function useUpdateMachinery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateMachineryData }) => {
      return MachineryService.update(id, updateData)
    },
    onSuccess: (updatedMachinery) => {
      // Update specific machinery in cache
      queryClient.setQueryData(MACHINERY_QUERY_KEYS.detail(updatedMachinery.id), updatedMachinery)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting machinery
 */
export function useDeleteMachinery() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => MachineryService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: MACHINERY_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for marking machinery as unavailable
 */
export function useMarkMachineryUnavailable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => {
      return MachineryService.markUnavailable(id, reason)
    },
    onSuccess: (updatedMachinery) => {
      queryClient.setQueryData(MACHINERY_QUERY_KEYS.detail(updatedMachinery.id), updatedMachinery)
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.all })
    },
  })
}

/**
 * Hook for marking machinery as available
 */
export function useMarkMachineryAvailable() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => MachineryService.markAvailable(id),
    onSuccess: (updatedMachinery) => {
      queryClient.setQueryData(MACHINERY_QUERY_KEYS.detail(updatedMachinery.id), updatedMachinery)
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.all })
    },
  })
}

/**
 * Hook for scheduling maintenance
 */
export function useScheduleMaintenance() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ machineryId, maintenanceDate }: { 
      machineryId: number; 
      maintenanceDate: string 
    }) => {
      return MachineryService.scheduleMaintenance(machineryId, maintenanceDate)
    },
    onSuccess: (updatedMachinery) => {
      queryClient.setQueryData(MACHINERY_QUERY_KEYS.detail(updatedMachinery.id), updatedMachinery)
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_QUERY_KEYS.maintenance() })
    },
  })
}

/**
 * Utility hook for machinery business logic and formatting
 */
export function useMachineryUtils() {
  return {
    validateMachineryData: MachineryService.validateMachineryData,
    calculateMachineryCost: MachineryService.calculateMachineryCost,
    getCategoryIcon: MachineryService.getCategoryIcon,
    getCategoryDisplayName: MachineryService.getCategoryDisplayName,
    formatCurrency: MachineryService.formatCurrency,
    getMaintenanceStatusColor: MachineryService.getMaintenanceStatusColor,
    getMaintenanceStatusMessage: MachineryService.getMaintenanceStatusMessage,
    generateMachineryReport: MachineryService.generateMachineryReport,

    // Helper to get category options
    getCategoryOptions: () => [
      { value: 'sonido', label: '🎵 Sonido' },
      { value: 'iluminacion', label: '💡 Iluminación' },
      { value: 'cocina', label: '🍳 Cocina' },
      { value: 'refrigeracion', label: '❄️ Refrigeración' },
      { value: 'mobiliario', label: '🪑 Mobiliario' },
      { value: 'decoracion', label: '🎈 Decoración' },
      { value: 'transporte', label: '🚐 Transporte' },
      { value: 'otros', label: '🔧 Otros' }
    ],

    // Helper to determine optimal pricing (hourly vs daily)
    getOptimalPricing: (machinery: Machinery, hours: number) => {
      const hourlyTotal = machinery.hourly_rate * hours
      const dailyEquivalent = machinery.daily_rate
      const isDaily = hours >= 8

      return {
        use_daily_rate: isDaily && dailyEquivalent < hourlyTotal,
        hourly_cost: hourlyTotal,
        daily_cost: dailyEquivalent,
        recommended_cost: isDaily && dailyEquivalent < hourlyTotal ? dailyEquivalent : hourlyTotal,
        savings: isDaily && dailyEquivalent < hourlyTotal ? hourlyTotal - dailyEquivalent : 0
      }
    },

    // Helper to get availability status color
    getAvailabilityStatusColor: (isAvailable: boolean, isActive: boolean) => {
      if (!isActive) return 'default'
      if (!isAvailable) return 'error'
      return 'success'
    },

    // Helper to format specifications for display
    formatSpecifications: (specifications?: Record<string, any>) => {
      if (!specifications) return []
      
      return Object.entries(specifications).map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: String(value)
      }))
    },

    // Helper to calculate ROI
    calculateROI: (machinery: Machinery, monthlyUsageHours: number) => {
      if (!machinery.purchase_date) return null

      const purchaseDate = new Date(machinery.purchase_date)
      const monthsSincePurchase = Math.ceil(
        (new Date().getTime() - purchaseDate.getTime()) / (1000 * 3600 * 24 * 30)
      )

      const monthlyRevenue = machinery.hourly_rate * monthlyUsageHours
      const totalRevenue = monthlyRevenue * monthsSincePurchase
      
      // Estimate purchase cost as 200x hourly rate (rough estimate)
      const estimatedPurchaseCost = machinery.hourly_rate * 200
      
      const roi = totalRevenue / estimatedPurchaseCost * 100

      return {
        monthly_revenue: monthlyRevenue,
        total_revenue: totalRevenue,
        estimated_cost: estimatedPurchaseCost,
        roi_percentage: roi,
        months_to_break_even: estimatedPurchaseCost / monthlyRevenue
      }
    }
  }
}
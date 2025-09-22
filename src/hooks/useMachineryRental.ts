import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MachineryRentalService, MachineryRentalFilters, CreateMachineryRentalData, UpdateMachineryRentalData } from '../services/machineryRental.service'
import { MachineryRental } from '../types'

// Query keys
export const MACHINERY_RENTAL_QUERY_KEYS = {
  all: ['machinery_rental'] as const,
  lists: () => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: MachineryRentalFilters) => [...MACHINERY_RENTAL_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...MACHINERY_RENTAL_QUERY_KEYS.details(), id] as const,
  statistics: () => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'statistics'] as const,
  search: (term: string) => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'search', term] as const,
  category: (category: string) => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'category', category] as const,
  supplier: (supplierId: number) => [...MACHINERY_RENTAL_QUERY_KEYS.all, 'supplier', supplierId] as const
}

/**
 * Hook for fetching all machinery rentals with optional filters
 */
export function useMachineryRentals(filters?: MachineryRentalFilters) {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.list(filters),
    queryFn: () => MachineryRentalService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single machinery rental by ID
 */
export function useMachineryRentalDetail(id: number) {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.detail(id),
    queryFn: () => MachineryRentalService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching machinery rental statistics
 */
export function useMachineryRentalStatistics() {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.statistics(),
    queryFn: () => MachineryRentalService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for searching machinery rentals
 */
export function useMachineryRentalSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.search(searchTerm),
    queryFn: () => MachineryRentalService.search(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching machinery rentals by category
 */
export function useMachineryRentalsByCategory(category: string, enabled: boolean = true) {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.category(category),
    queryFn: () => MachineryRentalService.getByCategory(category),
    enabled: enabled && !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching machinery rentals by supplier
 */
export function useMachineryRentalsBySupplier(supplierId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: MACHINERY_RENTAL_QUERY_KEYS.supplier(supplierId),
    queryFn: () => MachineryRentalService.getBySupplier(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating new machinery rental
 */
export function useCreateMachineryRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (rentalData: CreateMachineryRentalData) => {
      return MachineryRentalService.create(rentalData)
    },
    onSuccess: (newRental) => {
      // Invalidate and refetch machinery rental lists
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.statistics() })
      
      // Add the new rental to cache
      queryClient.setQueryData(MACHINERY_RENTAL_QUERY_KEYS.detail(newRental.id), newRental)
    },
  })
}

/**
 * Hook for updating machinery rental
 */
export function useUpdateMachineryRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateMachineryRentalData }) => {
      return MachineryRentalService.update(id, updateData)
    },
    onSuccess: (updatedRental) => {
      // Update specific rental in cache
      queryClient.setQueryData(MACHINERY_RENTAL_QUERY_KEYS.detail(updatedRental.id), updatedRental)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting machinery rental
 */
export function useDeleteMachineryRental() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => MachineryRentalService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: MACHINERY_RENTAL_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Utility hook for machinery rental business logic and formatting
 */
export function useMachineryRentalUtils() {
  return {
    validateMachineryRentalData: MachineryRentalService.validateMachineryRentalData,
    calculateMachineryRentalCost: MachineryRentalService.calculateMachineryRentalCost,
    getCategoryIcon: MachineryRentalService.getCategoryIcon,
    getCategoryDisplayName: MachineryRentalService.getCategoryDisplayName,
    formatCurrency: MachineryRentalService.formatCurrency,

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
    getOptimalPricing: (rental: MachineryRental, hours: number) => {
      const hourlyTotal = rental.sue_hourly_rate * hours
      const dailyEquivalent = rental.sue_daily_rate
      const isDaily = hours >= 8

      return {
        use_daily_rate: isDaily && dailyEquivalent < hourlyTotal,
        hourly_cost: hourlyTotal,
        daily_cost: dailyEquivalent,
        recommended_cost: isDaily && dailyEquivalent < hourlyTotal ? dailyEquivalent : hourlyTotal,
        savings: isDaily && dailyEquivalent < hourlyTotal ? hourlyTotal - dailyEquivalent : 0
      }
    },

    // Helper to calculate margin information
    getMarginInfo: (rental: MachineryRental) => {
      const hourlyMargin = rental.sue_hourly_rate - rental.supplier_hourly_rate
      const dailyMargin = rental.sue_daily_rate - rental.supplier_daily_rate
      
      const hourlyMarginPercentage = rental.supplier_hourly_rate > 0 
        ? (hourlyMargin / rental.supplier_hourly_rate) * 100 
        : 0
      
      const dailyMarginPercentage = rental.supplier_daily_rate > 0 
        ? (dailyMargin / rental.supplier_daily_rate) * 100 
        : 0

      return {
        hourly_margin: hourlyMargin,
        daily_margin: dailyMargin,
        hourly_margin_percentage: hourlyMarginPercentage,
        daily_margin_percentage: dailyMarginPercentage,
        average_margin_percentage: (hourlyMarginPercentage + dailyMarginPercentage) / 2
      }
    },

    // Helper to format rental details
    formatRentalSummary: (rental: MachineryRental) => {
      const marginInfo = this.getMarginInfo?.(rental)
      return {
        name: rental.machinery_name,
        category: MachineryRentalService.getCategoryDisplayName(rental.category),
        supplier: rental.supplier?.name || 'Unknown',
        hourly_rate: MachineryRentalService.formatCurrency(rental.sue_hourly_rate),
        daily_rate: MachineryRentalService.formatCurrency(rental.sue_daily_rate),
        margin_percentage: marginInfo?.average_margin_percentage.toFixed(1) + '%',
        includes_operator: rental.requires_operator,
        includes_delivery: (rental.delivery_cost || 0) > 0,
        includes_pickup: (rental.pickup_cost || 0) > 0
      }
    }
  }
}
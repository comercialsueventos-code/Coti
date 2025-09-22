import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DisposableItemsService, DisposableItemFilters, CreateDisposableItemData, UpdateDisposableItemData } from '../services/disposableItems.service'
import { DisposableItem } from '../types'

// Query keys
export const DISPOSABLE_ITEMS_QUERY_KEYS = {
  all: ['disposable_items'] as const,
  lists: () => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: DisposableItemFilters) => [...DISPOSABLE_ITEMS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...DISPOSABLE_ITEMS_QUERY_KEYS.details(), id] as const,
  statistics: () => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'statistics'] as const,
  search: (term: string) => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'search', term] as const,
  category: (category: string) => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'category', category] as const,
  subcategory: (subcategory: string) => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'subcategory', subcategory] as const,
  categories: () => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'categories'] as const,
  ecoFriendly: () => [...DISPOSABLE_ITEMS_QUERY_KEYS.all, 'eco_friendly'] as const
}

/**
 * Hook for fetching all disposable items with optional filters
 */
export function useDisposableItems(filters?: DisposableItemFilters) {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.list(filters),
    queryFn: () => DisposableItemsService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching active disposable items (commonly used)
 */
export function useActiveDisposableItems(filters?: Omit<DisposableItemFilters, 'is_active'>) {
  return useDisposableItems({ ...filters, is_active: true })
}

/**
 * Hook for fetching a single disposable item by ID
 */
export function useDisposableItemDetail(id: number) {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.detail(id),
    queryFn: () => DisposableItemsService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching disposable item statistics
 */
export function useDisposableItemStatistics() {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.statistics(),
    queryFn: () => DisposableItemsService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for searching disposable items
 */
export function useDisposableItemSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.search(searchTerm),
    queryFn: () => DisposableItemsService.search(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching disposable items by category
 */
export function useDisposableItemsByCategory(category: string, enabled: boolean = true) {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.category(category),
    queryFn: () => DisposableItemsService.getByCategory(category),
    enabled: enabled && !!category,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching disposable items by subcategory
 */
export function useDisposableItemsBySubcategory(subcategory: string, enabled: boolean = true) {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.subcategory(subcategory),
    queryFn: () => DisposableItemsService.getBySubcategory(subcategory),
    enabled: enabled && !!subcategory,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching available categories and subcategories
 */
export function useDisposableItemCategories() {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.categories(),
    queryFn: () => DisposableItemsService.getCategories(),
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

/**
 * Hook for fetching eco-friendly disposable items
 */
export function useEcoFriendlyDisposableItems() {
  return useQuery({
    queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.ecoFriendly(),
    queryFn: () => DisposableItemsService.getEcoFriendly(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for creating new disposable item
 */
export function useCreateDisposableItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (itemData: CreateDisposableItemData) => {
      return DisposableItemsService.create(itemData)
    },
    onSuccess: (newItem) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.statistics() })
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.categories() })
      
      // Add the new item to cache
      queryClient.setQueryData(DISPOSABLE_ITEMS_QUERY_KEYS.detail(newItem.id), newItem)
    },
  })
}

/**
 * Hook for updating disposable item
 */
export function useUpdateDisposableItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateDisposableItemData }) => {
      return DisposableItemsService.update(id, updateData)
    },
    onSuccess: (updatedItem) => {
      // Update specific item in cache
      queryClient.setQueryData(DISPOSABLE_ITEMS_QUERY_KEYS.detail(updatedItem.id), updatedItem)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting disposable item
 */
export function useDeleteDisposableItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => DisposableItemsService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: DISPOSABLE_ITEMS_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Utility hook for disposable items business logic and formatting
 */
export function useDisposableItemUtils() {
  return {
    validateDisposableItemData: DisposableItemsService.validateDisposableItemData,
    calculateDisposableItemCost: DisposableItemsService.calculateDisposableItemCost,
    getSubcategoryIcon: DisposableItemsService.getSubcategoryIcon,
    getEcoLabel: DisposableItemsService.getEcoLabel,
    formatCurrency: DisposableItemsService.formatCurrency,

    // Helper to get subcategory options (all are desechables now)
    getSubcategoryOptions: () => [
      { value: 'vajilla', label: '🍽️ Vajilla' },
      { value: 'cubiertos', label: '🍴 Cubiertos' },
      { value: 'vasos', label: '🥤 Vasos' },
      { value: 'platos', label: '🍽️ Platos' },
      { value: 'servilletas', label: '🧻 Servilletas' },
      { value: 'manteles', label: '🫖 Manteles' },
      { value: 'toallas', label: '🧽 Toallas' },
      { value: 'velas', label: '🕯️ Velas' },
      { value: 'globos', label: '🎈 Globos' },
      { value: 'confeti', label: '🎊 Confeti' },
      { value: 'bolsas_basura', label: '🗑️ Bolsas de Basura' },
      { value: 'productos_limpieza', label: '🧽 Productos de Limpieza' },
      { value: 'packaging', label: '📦 Empaques' },
      { value: 'decoracion', label: '🎈 Decoración' },
      { value: 'otros', label: '📦 Otros' }
    ],

    // Helper to calculate quantity with minimum requirements
    calculateActualQuantity: (requestedQuantity: number, minimumQuantity: number) => {
      return Math.max(requestedQuantity, minimumQuantity)
    },

    // Helper to determine if item needs minimum quantity warning
    needsMinimumQuantityWarning: (requestedQuantity: number, minimumQuantity: number) => {
      return requestedQuantity < minimumQuantity
    },

    // Helper to format item summary
    formatItemSummary: (item: DisposableItem) => {
      const ecoLabel = DisposableItemsService.getEcoLabel(item)
      
      return {
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || 'Sin subcategoría',
        unit: item.unit,
        price: DisposableItemsService.formatCurrency(item.sale_price),
        minimum_quantity: item.minimum_quantity,
        eco_label: ecoLabel,
        has_shelf_life: !!item.shelf_life_days,
        shelf_life_display: item.shelf_life_days ? `${item.shelf_life_days} días` : 'Sin vencimiento'
      }
    },

    // Helper to calculate bulk pricing (if applicable)
    calculateBulkPricing: (item: DisposableItem, quantity: number) => {
      const actualQuantity = Math.max(quantity, item.minimum_quantity)
      const cost = DisposableItemsService.calculateDisposableItemCost(item, actualQuantity)
      
      // Simple bulk discount logic (can be made more sophisticated)
      let discountPercentage = 0
      if (actualQuantity >= 1000) {
        discountPercentage = 10
      } else if (actualQuantity >= 500) {
        discountPercentage = 5
      } else if (actualQuantity >= 100) {
        discountPercentage = 2
      }

      const discountAmount = cost.total_sale_price * (discountPercentage / 100)
      const finalPrice = cost.total_sale_price - discountAmount

      return {
        ...cost,
        bulk_discount_percentage: discountPercentage,
        bulk_discount_amount: discountAmount,
        final_price: finalPrice,
        price_per_unit_after_discount: actualQuantity > 0 ? finalPrice / actualQuantity : 0
      }
    },

    // Helper to check if item is near expiry (if shelf life applies)
    isNearExpiry: (item: DisposableItem, daysThreshold: number = 30) => {
      if (!item.shelf_life_days) return false
      return item.shelf_life_days <= daysThreshold
    },

    // Helper to get storage recommendations
    getStorageRecommendations: (item: DisposableItem) => {
      const recommendations = []
      
      if (item.storage_requirements) {
        recommendations.push(item.storage_requirements)
      }
      
      if (item.is_biodegradable) {
        recommendations.push('Mantener en lugar seco para preservar propiedades biodegradables')
      }
      
      if (item.shelf_life_days && item.shelf_life_days <= 90) {
        recommendations.push('Rotar inventario regularmente por vida útil limitada')
      }

      return recommendations.length > 0 ? recommendations : ['Almacenar en condiciones normales']
    }
  }
}
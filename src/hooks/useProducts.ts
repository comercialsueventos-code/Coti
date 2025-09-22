import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ConsolidatedProductsService, CreateProductData, UpdateProductData, ProductFilters } from '../shared/services/ConsolidatedProductsService'
import { consolidatedProductsService } from '../shared/services'
import { Product } from '../types'

// Query keys
export const PRODUCTS_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCTS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: ProductFilters) => [...PRODUCTS_QUERY_KEYS.lists(), filters] as const,
  details: () => [...PRODUCTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...PRODUCTS_QUERY_KEYS.details(), id] as const,
  search: (term: string) => [...PRODUCTS_QUERY_KEYS.all, 'search', term] as const,
  byCategory: (category: string) => [...PRODUCTS_QUERY_KEYS.all, 'category', category] as const,
  active: () => [...PRODUCTS_QUERY_KEYS.all, 'active'] as const,
  seasonal: () => [...PRODUCTS_QUERY_KEYS.all, 'seasonal'] as const,
}

// Hook para obtener todos los productos con filtros
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.list(filters),
    queryFn: () => consolidatedProductsService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener productos activos
export function useActiveProducts() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.active(),
    queryFn: () => consolidatedProductsService.getActive(),
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener productos por categoría
export function useProductsByCategory(category: string | number) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.byCategory(String(category)),
    queryFn: () => consolidatedProductsService.getByCategory(category),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener un producto por ID
export function useProduct(id: number) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.detail(id),
    queryFn: () => consolidatedProductsService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para buscar productos
export function useProductSearch(searchTerm: string) {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.search(searchTerm),
    queryFn: () => consolidatedProductsService.search(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
  })
}

// Hook para productos estacionales
export function useSeasonalProducts() {
  return useQuery({
    queryKey: PRODUCTS_QUERY_KEYS.seasonal(),
    queryFn: () => consolidatedProductsService.getSeasonalProducts(),
    staleTime: 10 * 60 * 1000, // 10 minutos para productos estacionales
  })
}

// Hook para crear producto
export function useCreateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateProductData) => consolidatedProductsService.create(data),
    onSuccess: () => {
      // Invalidar todas las queries de productos
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all })
    },
  })
}

// Hook para actualizar producto
export function useUpdateProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductData }) => 
      consolidatedProductsService.update(id, data),
    onSuccess: (updatedProduct) => {
      // Actualizar cache específico
      queryClient.setQueryData(
        PRODUCTS_QUERY_KEYS.detail(updatedProduct.id),
        updatedProduct
      )
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.active() })
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.seasonal() })
    },
  })
}

// Hook para eliminar producto
export function useDeleteProduct() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => consolidatedProductsService.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de productos
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all })
    },
  })
}

// Hook para operaciones masivas
export function useBulkProductOperations() {
  const queryClient = useQueryClient()
  
  const updateMultiple = useMutation({
    mutationFn: (updates: { id: number; data: UpdateProductData }[]) => 
      consolidatedProductsService.updateMultiple(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all })
    },
  })

  const deactivateMultiple = useMutation({
    mutationFn: (ids: number[]) => consolidatedProductsService.deactivateMultiple(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all })
    },
  })

  const activateMultiple = useMutation({
    mutationFn: (ids: number[]) => consolidatedProductsService.activateMultiple(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEYS.all })
    },
  })

  return {
    updateMultiple,
    deactivateMultiple,
    activateMultiple,
  }
}

// Hook para validación de productos
export function useProductValidation() {
  return {
    validateProductData: ConsolidatedProductsService.validateProductData,
  }
}

// Hook para utilidades de productos
export function useProductUtils() {
  return {
    calculateMargin: ConsolidatedProductsService.calculateMargin,
    calculateProfitPerUnit: ConsolidatedProductsService.calculateProfitPerUnit,
    getCategoryIcon: ConsolidatedProductsService.getCategoryIcon,
    getCategoryDisplayName: ConsolidatedProductsService.getCategoryDisplayName,
    formatPrice: ConsolidatedProductsService.formatPrice,
    formatUnit: ConsolidatedProductsService.formatUnit,
    getSeasonalStatus: ConsolidatedProductsService.getSeasonalStatus,
    checkInventoryAlert: ConsolidatedProductsService.checkInventoryAlert,
    getRequiredEquipment: ConsolidatedProductsService.getRequiredEquipment,
    estimateTotalPreparationTime: ConsolidatedProductsService.estimateTotalPreparationTime,
    generateProductReport: ConsolidatedProductsService.generateProductReport,
    getDefaultValues: ConsolidatedProductsService.getDefaultValues,
  }
}

// Hook para estadísticas de productos
export function useProductStats() {
  const { data: products = [] } = useProducts()
  
  return {
    stats: ConsolidatedProductsService.generateProductReport(products),
    products,
  }
}

// Hook personalizado para gestión de categorías
export function useProductCategories() {
  const { data: products = [] } = useActiveProducts()
  
  // Extraer categorías únicas desde category_info o fallback al antiguo sistema
  const categoryMap = new Map()
  
  products.forEach(product => {
    if (product.category_info) {
      // Usar nueva estructura
      const cat = product.category_info
      if (categoryMap.has(cat.id)) {
        categoryMap.get(cat.id).count++
      } else {
        categoryMap.set(cat.id, {
          value: cat.name,
          label: cat.display_name,
          icon: cat.icon || '📦',
          count: 1,
          id: cat.id
        })
      }
    } else {
      // Fallback al sistema antiguo
      const category = product.category
      const key = `legacy_${category}`
      if (categoryMap.has(key)) {
        categoryMap.get(key).count++
      } else {
        categoryMap.set(key, {
          value: category,
          label: ConsolidatedProductsService.getCategoryDisplayName(category),
          icon: ConsolidatedProductsService.getCategoryIcon(category),
          count: 1,
          legacy: true
        })
      }
    }
  })

  const categories = Array.from(categoryMap.values()).sort((a, b) => {
    // Ordenar por sort_order si existe, sino por label
    if (a.sort_order !== undefined && b.sort_order !== undefined) {
      return a.sort_order - b.sort_order
    }
    return a.label.localeCompare(b.label)
  })

  return { categories, products }
}

// Hook para análisis de precios
export function useProductPriceAnalysis() {
  const { data: products = [] } = useActiveProducts()
  
  const analysis = {
    totalProducts: products.length,
    averagePrice: products.length > 0 
      ? products.reduce((sum, p) => sum + p.base_price, 0) / products.length 
      : 0,
    priceRanges: {
      low: products.filter(p => p.base_price < 5000).length,
      medium: products.filter(p => p.base_price >= 5000 && p.base_price < 15000).length,
      high: products.filter(p => p.base_price >= 15000).length,
    },
    marginAnalysis: products
      .filter(p => p.cost_price && p.cost_price > 0)
      .map(p => ({
        id: p.id,
        name: p.name,
        margin: ConsolidatedProductsService.calculateMargin(p.base_price, p.cost_price),
        profit: ConsolidatedProductsService.calculateProfitPerUnit(p.base_price, p.cost_price)
      }))
      .sort((a, b) => b.margin - a.margin),
    equipmentRequirements: ConsolidatedProductsService.getRequiredEquipment(products)
  }

  return analysis
}

// Hook para gestión de inventario
export function useInventoryManagement() {
  const { data: products = [] } = useActiveProducts()
  
  const checkAvailability = (productId: number, quantity: number) => {
    const product = products.find(p => p.id === productId)
    if (!product) return { available: false, message: 'Producto no encontrado' }
    
    const alert = ConsolidatedProductsService.checkInventoryAlert(product, quantity)
    const seasonal = ConsolidatedProductsService.getSeasonalStatus(product)
    
    return {
      available: !alert.hasAlert || alert.severity !== 'error',
      product,
      alert,
      seasonal,
      message: alert.hasAlert ? alert.message : 'Disponible'
    }
  }

  const getSeasonalAvailability = () => {
    return products
      .filter(p => p.is_seasonal)
      .map(product => ({
        product,
        ...ConsolidatedProductsService.getSeasonalStatus(product)
      }))
  }

  const getLowStockAlerts = () => {
    // Este método podría expandirse para integrar con un sistema de inventario real
    return products
      .filter(p => p.requires_equipment)
      .map(product => ({
        product,
        message: `Verificar disponibilidad de equipos: ${product.equipment_needed?.join(', ')}`
      }))
  }

  return {
    checkAvailability,
    getSeasonalAvailability,
    getLowStockAlerts,
    products
  }
}
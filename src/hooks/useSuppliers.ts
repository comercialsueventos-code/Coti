import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { SuppliersService } from '../services/suppliers.service'
import { Supplier, CreateSupplierData, UpdateSupplierData, SupplierFilters } from '../types'

// Query keys
export const SUPPLIERS_QUERY_KEYS = {
  all: ['suppliers'] as const,
  lists: () => [...SUPPLIERS_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: SupplierFilters) => [...SUPPLIERS_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...SUPPLIERS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...SUPPLIERS_QUERY_KEYS.details(), id] as const,
  statistics: () => [...SUPPLIERS_QUERY_KEYS.all, 'statistics'] as const,
  type: (type: string) => [...SUPPLIERS_QUERY_KEYS.all, 'type', type] as const,
  topRated: (limit: number) => [...SUPPLIERS_QUERY_KEYS.all, 'topRated', limit] as const,
  performance: (id: number) => [...SUPPLIERS_QUERY_KEYS.all, 'performance', id] as const,
  capability: (capability: string, serviceArea?: string) => 
    [...SUPPLIERS_QUERY_KEYS.all, 'capability', capability, serviceArea] as const,
  suitable: (serviceType: string, specialty?: string, serviceArea?: string, minQuality?: number) =>
    [...SUPPLIERS_QUERY_KEYS.all, 'suitable', serviceType, specialty, serviceArea, minQuality] as const
}

/**
 * Hook for fetching all suppliers with optional filters
 */
export function useSuppliers(filters?: SupplierFilters) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.list(filters),
    queryFn: () => SuppliersService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single supplier by ID
 */
export function useSupplier(id: number) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.detail(id),
    queryFn: () => SuppliersService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching suppliers statistics
 */
export function useSuppliersStatistics() {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.statistics(),
    queryFn: () => SuppliersService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching suppliers by type
 */
export function useSuppliersByType(type: string, enabled: boolean = true) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.type(type),
    queryFn: () => SuppliersService.getByType(type),
    enabled: enabled && !!type,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching top-rated suppliers
 */
export function useTopRatedSuppliers(limit: number = 10) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.topRated(limit),
    queryFn: () => SuppliersService.getTopRated(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for fetching supplier performance metrics
 */
export function useSupplierPerformance(id: number, enabled: boolean = true) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.performance(id),
    queryFn: () => SuppliersService.getPerformanceMetrics(id),
    enabled: enabled && !!id,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

/**
 * Hook for searching suppliers by capability
 */
export function useSuppliersByCapability(
  capability: string, 
  serviceArea?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.capability(capability, serviceArea),
    queryFn: () => SuppliersService.searchByCapability(capability, serviceArea),
    enabled: enabled && !!capability,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for finding suitable suppliers
 */
export function useSuitableSuppliers(
  serviceType: string,
  specialty?: string,
  serviceArea?: string,
  minQualityRating: number = 3.0,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: SUPPLIERS_QUERY_KEYS.suitable(serviceType, specialty, serviceArea, minQualityRating),
    queryFn: () => SuppliersService.findSuitableSuppliers(serviceType, specialty, serviceArea, minQualityRating),
    enabled: enabled && !!serviceType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating a new supplier
 */
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (supplierData: CreateSupplierData) => {
      return SuppliersService.create(supplierData)
    },
    onSuccess: (newSupplier) => {
      // Invalidate and refetch suppliers lists
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.statistics() })
      
      // Add the new supplier to cache
      queryClient.setQueryData(SUPPLIERS_QUERY_KEYS.detail(newSupplier.id), newSupplier)
    },
  })
}

/**
 * Hook for updating a supplier
 */
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateSupplierData }) => {
      return SuppliersService.update(id, updateData)
    },
    onSuccess: (updatedSupplier) => {
      // Update specific supplier in cache
      queryClient.setQueryData(SUPPLIERS_QUERY_KEYS.detail(updatedSupplier.id), updatedSupplier)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting a supplier
 */
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => SuppliersService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: SUPPLIERS_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for rating a supplier
 */
export function useRateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      supplierId, 
      qualityRating, 
      reliabilityRating, 
      priceRating 
    }: {
      supplierId: number
      qualityRating: number
      reliabilityRating: number
      priceRating: number
    }) => {
      return SuppliersService.rateSupplier(supplierId, qualityRating, reliabilityRating, priceRating)
    },
    onSuccess: (updatedSupplier) => {
      queryClient.setQueryData(SUPPLIERS_QUERY_KEYS.detail(updatedSupplier.id), updatedSupplier)
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.statistics() })
      queryClient.invalidateQueries({ queryKey: SUPPLIERS_QUERY_KEYS.performance(updatedSupplier.id) })
    },
  })
}

/**
 * Utility hook for supplier business logic and formatting
 */
export function useSuppliersUtils() {
  return {
    validateSupplierData: SuppliersService.validateSupplierData,
    getTypeIcon: SuppliersService.getTypeIcon,
    getTypeDisplayName: SuppliersService.getTypeDisplayName,
    formatCurrency: SuppliersService.formatCurrency,
    getRatingColor: SuppliersService.getRatingColor,
    getRatingText: SuppliersService.getRatingText,
    calculateCommissionValue: SuppliersService.calculateCommissionValue,
    formatPaymentTerms: SuppliersService.formatPaymentTerms,
    generateSupplierReport: SuppliersService.generateSupplierReport,

    // Helper to get supplier type options
    getTypeOptions: () => [
      { value: 'machinery_rental', label: '🚐 Alquiler de Maquinaria' },
      { value: 'event_subcontractor', label: '🎪 Subcontratista de Eventos' },
      { value: 'catering', label: '🍽️ Catering' },
      { value: 'decoration', label: '🎈 Decoración' },
      { value: 'entertainment', label: '🎵 Entretenimiento' },
      { value: 'transport', label: '🚚 Transporte' },
      { value: 'otros', label: '🏢 Otros' }
    ],

    // Helper to get rating stars display
    getRatingStars: (rating: number) => {
      const stars = Math.round(rating)
      return '★'.repeat(stars) + '☆'.repeat(5 - stars)
    },

    // Helper to get common specialties by type
    getCommonSpecialties: (type: string) => {
      const specialties: Record<string, string[]> = {
        'machinery_rental': [
          'Sonido profesional',
          'Iluminación LED',
          'Carpas y toldos',
          'Mobiliario',
          'Equipos de cocina',
          'Refrigeración'
        ],
        'event_subcontractor': [
          'Bodas',
          'Eventos corporativos',
          'Quinceañeros',
          'Bautizos',
          'Graduaciones',
          'Conferencias'
        ],
        'catering': [
          'Comida colombiana',
          'Comida internacional',
          'Vegetariano/Vegano',
          'Postres',
          'Bebidas',
          'Servicios de bar'
        ],
        'decoration': [
          'Decoración temática',
          'Flores',
          'Globos',
          'Centros de mesa',
          'Backdrop',
          'Arreglos florales'
        ],
        'entertainment': [
          'DJ',
          'Banda en vivo',
          'Animación infantil',
          'Mariachi',
          'Fotógrafo',
          'Videógrafo'
        ],
        'transport': [
          'Transporte de equipos',
          'Transporte de personal',
          'Vehículos de lujo',
          'Autobuses',
          'Camiones',
          'Logística'
        ]
      }
      return specialties[type] || []
    },

    // Helper to get common service areas in Colombia
    getServiceAreas: () => [
      'Bogotá',
      'Medellín',
      'Cali',
      'Barranquilla',
      'Cartagena',
      'Bucaramanga',
      'Pereira',
      'Ibagué',
      'Manizales',
      'Villavicencio',
      'Nacional'
    ],

    // Helper to calculate overall score
    calculateOverallScore: (supplier: Supplier) => {
      const scores = [
        supplier.quality_rating,
        supplier.reliability_rating,
        supplier.price_rating
      ].filter(score => score > 0)

      return scores.length > 0 
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0
    },

    // Helper to get supplier status
    getSupplierStatus: (supplier: Supplier) => {
      if (!supplier.is_active) return { label: 'Inactivo', color: 'default' }
      
      const overallScore = [
        supplier.quality_rating,
        supplier.reliability_rating,
        supplier.price_rating
      ].filter(score => score > 0)
      .reduce((sum, score, _, arr) => sum + score / arr.length, 0)

      if (overallScore >= 4.5) return { label: 'Proveedor Premium', color: 'success' }
      if (overallScore >= 4.0) return { label: 'Proveedor Confiable', color: 'primary' }
      if (overallScore >= 3.0) return { label: 'Proveedor Regular', color: 'warning' }
      return { label: 'Nuevo Proveedor', color: 'info' }
    },

    // Helper to format collaboration history
    formatCollaborationSummary: (supplier: Supplier) => {
      if (!supplier.last_collaboration_date) {
        return 'Sin colaboraciones previas'
      }
      
      const lastDate = new Date(supplier.last_collaboration_date)
      const monthsAgo = Math.floor(
        (new Date().getTime() - lastDate.getTime()) / (1000 * 3600 * 24 * 30)
      )
      
      if (monthsAgo === 0) return 'Colaboración reciente'
      if (monthsAgo === 1) return 'Hace 1 mes'
      if (monthsAgo < 12) return `Hace ${monthsAgo} meses`
      
      const yearsAgo = Math.floor(monthsAgo / 12)
      return yearsAgo === 1 ? 'Hace 1 año' : `Hace ${yearsAgo} años`
    }
  }
}
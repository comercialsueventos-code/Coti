import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EventSubcontractService, EventSubcontractFilters, CreateEventSubcontractData, UpdateEventSubcontractData } from '../services/eventSubcontract.service'
import { EventSubcontract } from '../types'

// Query keys
export const EVENT_SUBCONTRACT_QUERY_KEYS = {
  all: ['event_subcontract'] as const,
  lists: () => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: EventSubcontractFilters) => [...EVENT_SUBCONTRACT_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...EVENT_SUBCONTRACT_QUERY_KEYS.details(), id] as const,
  statistics: () => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'statistics'] as const,
  search: (term: string) => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'search', term] as const,
  serviceType: (serviceType: string) => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'serviceType', serviceType] as const,
  supplier: (supplierId: number) => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'supplier', supplierId] as const,
  attendees: (attendees: number) => [...EVENT_SUBCONTRACT_QUERY_KEYS.all, 'attendees', attendees] as const
}

/**
 * Hook for fetching all event subcontracts with optional filters
 */
export function useEventSubcontracts(filters?: EventSubcontractFilters) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.list(filters),
    queryFn: () => EventSubcontractService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single event subcontract by ID
 */
export function useEventSubcontractDetail(id: number) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.detail(id),
    queryFn: () => EventSubcontractService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching event subcontract statistics
 */
export function useEventSubcontractStatistics() {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.statistics(),
    queryFn: () => EventSubcontractService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for searching event subcontracts
 */
export function useEventSubcontractSearch(searchTerm: string, enabled: boolean = true) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.search(searchTerm),
    queryFn: () => EventSubcontractService.search(searchTerm),
    enabled: enabled && searchTerm.length > 2,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching event subcontracts by service type
 */
export function useEventSubcontractsByServiceType(serviceType: string, enabled: boolean = true) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.serviceType(serviceType),
    queryFn: () => EventSubcontractService.getByServiceType(serviceType),
    enabled: enabled && !!serviceType,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching event subcontracts by supplier
 */
export function useEventSubcontractsBySupplier(supplierId: number, enabled: boolean = true) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.supplier(supplierId),
    queryFn: () => EventSubcontractService.getBySupplier(supplierId),
    enabled: enabled && !!supplierId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching event subcontracts suitable for attendee count
 */
export function useEventSubcontractsByAttendeeCount(attendees: number, enabled: boolean = true) {
  return useQuery({
    queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.attendees(attendees),
    queryFn: () => EventSubcontractService.getByAttendeeCount(attendees),
    enabled: enabled && attendees > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating new event subcontract
 */
export function useCreateEventSubcontract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (subcontractData: CreateEventSubcontractData) => {
      return EventSubcontractService.create(subcontractData)
    },
    onSuccess: (newSubcontract) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.statistics() })
      
      // Add the new subcontract to cache
      queryClient.setQueryData(EVENT_SUBCONTRACT_QUERY_KEYS.detail(newSubcontract.id), newSubcontract)
    },
  })
}

/**
 * Hook for updating event subcontract
 */
export function useUpdateEventSubcontract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateEventSubcontractData }) => {
      return EventSubcontractService.update(id, updateData)
    },
    onSuccess: (updatedSubcontract) => {
      // Update specific subcontract in cache
      queryClient.setQueryData(EVENT_SUBCONTRACT_QUERY_KEYS.detail(updatedSubcontract.id), updatedSubcontract)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting event subcontract
 */
export function useDeleteEventSubcontract() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => EventSubcontractService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EVENT_SUBCONTRACT_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Utility hook for event subcontract business logic and formatting
 */
export function useEventSubcontractUtils() {
  return {
    validateEventSubcontractData: EventSubcontractService.validateEventSubcontractData,
    calculateEventSubcontractCost: EventSubcontractService.calculateEventSubcontractCost,
    getServiceTypeIcon: EventSubcontractService.getServiceTypeIcon,
    getServiceTypeDisplayName: EventSubcontractService.getServiceTypeDisplayName,
    formatCurrency: EventSubcontractService.formatCurrency,

    // Helper to get service type options
    getServiceTypeOptions: () => [
      { value: 'event_complete', label: '🎉 Evento Completo' },
      { value: 'catering_only', label: '🍽️ Solo Catering' },
      { value: 'decoration_only', label: '🎈 Solo Decoración' },
      { value: 'entertainment_only', label: '🎵 Solo Entretenimiento' },
      { value: 'transport_only', label: '🚐 Solo Transporte' }
    ],

    // Helper to check if subcontract is suitable for attendee count
    isSuitableForAttendees: (subcontract: EventSubcontract, attendees: number) => {
      const meetsMinimum = !subcontract.minimum_attendees || attendees >= subcontract.minimum_attendees
      const meetsMaximum = !subcontract.maximum_attendees || attendees <= subcontract.maximum_attendees
      return meetsMinimum && meetsMaximum
    },

    // Helper to calculate margin information
    getMarginInfo: (subcontract: EventSubcontract) => {
      const margin = subcontract.sue_price - subcontract.supplier_cost
      const marginPercentage = subcontract.supplier_cost > 0 
        ? (margin / subcontract.supplier_cost) * 100 
        : 0

      return {
        margin_amount: margin,
        margin_percentage: marginPercentage,
        is_profitable: margin > 0
      }
    },

    // Helper to format subcontract details
    formatSubcontractSummary: (subcontract: EventSubcontract) => {
      const marginInfo = this.getMarginInfo?.(subcontract)
      const includes = []
      
      if (subcontract.includes_setup) includes.push('Instalación')
      if (subcontract.includes_cleanup) includes.push('Limpieza')
      if (subcontract.includes_staff) includes.push('Personal')
      if (subcontract.includes_equipment) includes.push('Equipos')

      return {
        name: subcontract.service_name,
        service_type: EventSubcontractService.getServiceTypeDisplayName(subcontract.service_type),
        supplier: subcontract.supplier?.name || 'Unknown',
        price: EventSubcontractService.formatCurrency(subcontract.sue_price),
        margin_percentage: marginInfo?.margin_percentage.toFixed(1) + '%',
        includes: includes.join(', ') || 'Servicios básicos',
        attendee_range: this.formatAttendeeRange?.(subcontract),
        advance_notice: subcontract.advance_notice_days ? `${subcontract.advance_notice_days} días` : 'No especificado'
      }
    },

    // Helper to format attendee range
    formatAttendeeRange: (subcontract: EventSubcontract) => {
      if (subcontract.minimum_attendees && subcontract.maximum_attendees) {
        return `${subcontract.minimum_attendees} - ${subcontract.maximum_attendees} personas`
      } else if (subcontract.minimum_attendees) {
        return `Mínimo ${subcontract.minimum_attendees} personas`
      } else if (subcontract.maximum_attendees) {
        return `Máximo ${subcontract.maximum_attendees} personas`
      }
      return 'Sin restricciones'
    },

    // Helper to calculate cost per attendee
    calculateCostPerAttendee: (subcontract: EventSubcontract, attendees: number) => {
      if (attendees <= 0) return 0
      return subcontract.sue_price / attendees
    },

    // Helper to get quality guarantees display
    formatQualityGuarantees: (subcontract: EventSubcontract) => {
      if (!subcontract.quality_guarantees || subcontract.quality_guarantees.length === 0) {
        return 'Sin garantías especificadas'
      }
      return subcontract.quality_guarantees.join(', ')
    },

    // Helper to determine if enough advance notice
    hasEnoughAdvanceNotice: (subcontract: EventSubcontract, eventDate: string) => {
      if (!subcontract.advance_notice_days) return true
      
      const today = new Date()
      const event = new Date(eventDate)
      const daysToEvent = Math.ceil((event.getTime() - today.getTime()) / (1000 * 3600 * 24))
      
      return daysToEvent >= subcontract.advance_notice_days
    }
  }
}
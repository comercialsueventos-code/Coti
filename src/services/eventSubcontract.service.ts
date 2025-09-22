import { supabase } from './supabase'
import { EventSubcontract } from '../types'

export interface CreateEventSubcontractData {
  supplier_id: number
  service_name: string
  service_type: 'event_complete' | 'catering_only' | 'decoration_only' | 'entertainment_only' | 'transport_only'
  description?: string
  supplier_cost: number
  sue_price: number
  includes_setup?: boolean
  includes_cleanup?: boolean
  includes_staff?: boolean
  includes_equipment?: boolean
  minimum_attendees?: number
  maximum_attendees?: number
  service_duration_hours?: number
  advance_notice_days?: number
  cancellation_policy?: string
  quality_guarantees?: string[]
}

export interface UpdateEventSubcontractData extends Partial<CreateEventSubcontractData> {
  is_available?: boolean
}

export interface EventSubcontractFilters {
  supplier_id?: number
  service_type?: string
  is_available?: boolean
  min_attendees?: number
  max_attendees?: number
  max_cost?: number
  search?: string
}

export interface EventSubcontractCostCalculation {
  supplier_cost: number
  sue_price: number
  margin_amount: number
  margin_percentage: number
  cost_per_attendee?: number
  includes_breakdown: {
    setup: boolean
    cleanup: boolean
    staff: boolean
    equipment: boolean
  }
}

export class EventSubcontractService {
  /**
   * Get all event subcontracts with optional filters
   */
  static async getAll(filters?: EventSubcontractFilters): Promise<EventSubcontract[]> {
    let query = supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('service_name')

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }

    if (filters?.service_type) {
      query = query.eq('service_type', filters.service_type)
    }

    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available)
    }

    if (filters?.search) {
      query = query.or(`service_name.ilike.%${filters.search}%, description.ilike.%${filters.search}%`)
    }

    if (filters?.max_cost !== undefined) {
      query = query.lte('sue_price', filters.max_cost)
    }

    if (filters?.min_attendees !== undefined) {
      query = query.gte('maximum_attendees', filters.min_attendees)
    }

    if (filters?.max_attendees !== undefined) {
      query = query.lte('minimum_attendees', filters.max_attendees)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get event subcontract by ID
   */
  static async getById(id: number): Promise<EventSubcontract> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create new event subcontract
   */
  static async create(subcontractData: CreateEventSubcontractData): Promise<EventSubcontract> {
    const processedData = {
      ...subcontractData,
      includes_setup: subcontractData.includes_setup ?? false,
      includes_cleanup: subcontractData.includes_cleanup ?? false,
      includes_staff: subcontractData.includes_staff ?? false,
      includes_equipment: subcontractData.includes_equipment ?? false,
      advance_notice_days: subcontractData.advance_notice_days ?? 7,
      quality_guarantees: subcontractData.quality_guarantees ?? [],
      is_available: true
    }

    const { data, error } = await supabase
      .from('event_subcontract')
      .insert(processedData)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update event subcontract
   */
  static async update(id: number, subcontractData: UpdateEventSubcontractData): Promise<EventSubcontract> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .update(subcontractData)
      .eq('id', id)
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete event subcontract
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('event_subcontract')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get event subcontracts by service type
   */
  static async getByServiceType(serviceType: string): Promise<EventSubcontract[]> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('service_type', serviceType)
      .eq('is_available', true)
      .order('service_name')

    if (error) throw error
    return data || []
  }

  /**
   * Get event subcontracts by supplier
   */
  static async getBySupplier(supplierId: number): Promise<EventSubcontract[]> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('supplier_id', supplierId)
      .eq('is_available', true)
      .order('service_name')

    if (error) throw error
    return data || []
  }

  /**
   * Get subcontracts suitable for attendee count
   */
  static async getByAttendeeCount(attendees: number): Promise<EventSubcontract[]> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .or(`minimum_attendees.is.null,minimum_attendees.lte.${attendees}`)
      .or(`maximum_attendees.is.null,maximum_attendees.gte.${attendees}`)
      .eq('is_available', true)
      .order('service_name')

    if (error) throw error
    return data || []
  }

  /**
   * Calculate event subcontract cost
   */
  static calculateEventSubcontractCost(
    subcontract: EventSubcontract,
    attendees?: number,
    customSupplierCost?: number,
    customSuePrice?: number
  ): EventSubcontractCostCalculation {
    const supplierCost = customSupplierCost ?? subcontract.supplier_cost
    const suePrice = customSuePrice ?? subcontract.sue_price

    const marginAmount = suePrice - supplierCost
    const marginPercentage = supplierCost > 0 ? (marginAmount / supplierCost) * 100 : 0

    const costPerAttendee = attendees && attendees > 0 ? suePrice / attendees : undefined

    return {
      supplier_cost: supplierCost,
      sue_price: suePrice,
      margin_amount: marginAmount,
      margin_percentage: marginPercentage,
      cost_per_attendee: costPerAttendee,
      includes_breakdown: {
        setup: subcontract.includes_setup,
        cleanup: subcontract.includes_cleanup,
        staff: subcontract.includes_staff,
        equipment: subcontract.includes_equipment
      }
    }
  }

  /**
   * Search event subcontracts
   */
  static async search(searchTerm: string): Promise<EventSubcontract[]> {
    const { data, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .or(`service_name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, service_type.ilike.%${searchTerm}%`)
      .eq('is_available', true)
      .order('service_name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    total_subcontracts: number
    available_subcontracts: number
    by_service_type: Record<string, number>
    by_supplier: Record<string, number>
    average_margin_percentage: number
    average_cost: number
  }> {
    const { data: subcontracts, error } = await supabase
      .from('event_subcontract')
      .select(`
        *,
        supplier:suppliers(name)
      `)

    if (error) throw error

    const availableSubcontracts = subcontracts?.filter(s => s.is_available) || []

    const byServiceType = (subcontracts || []).reduce((acc, subcontract) => {
      acc[subcontract.service_type] = (acc[subcontract.service_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySupplier = (subcontracts || []).reduce((acc, subcontract) => {
      const supplierName = subcontract.supplier?.name || 'Unknown'
      acc[supplierName] = (acc[supplierName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate averages
    const margins = availableSubcontracts.map(subcontract => {
      const supplierCost = subcontract.supplier_cost
      const suePrice = subcontract.sue_price
      return supplierCost > 0 ? ((suePrice - supplierCost) / supplierCost) * 100 : 0
    })

    const costs = availableSubcontracts.map(s => s.sue_price)

    const averageMargin = margins.length > 0
      ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length
      : 0

    const averageCost = costs.length > 0
      ? costs.reduce((sum, cost) => sum + cost, 0) / costs.length
      : 0

    return {
      total_subcontracts: subcontracts?.length || 0,
      available_subcontracts: availableSubcontracts.length,
      by_service_type: byServiceType,
      by_supplier: bySupplier,
      average_margin_percentage: averageMargin,
      average_cost: averageCost
    }
  }

  /**
   * Validation helpers
   */
  static validateEventSubcontractData(data: CreateEventSubcontractData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.service_name || data.service_name.trim().length < 2) {
      errors.push('El nombre del servicio debe tener al menos 2 caracteres')
    }

    if (!data.service_type) {
      errors.push('El tipo de servicio es requerido')
    }

    if (!data.supplier_cost || data.supplier_cost <= 0) {
      errors.push('El costo del proveedor debe ser mayor a 0')
    }

    if (!data.sue_price || data.sue_price <= 0) {
      errors.push('El precio de Sue Events debe ser mayor a 0')
    }

    if (data.sue_price <= data.supplier_cost) {
      errors.push('El precio de Sue Events debe ser mayor que el costo del proveedor')
    }

    if (data.minimum_attendees && data.maximum_attendees && data.minimum_attendees > data.maximum_attendees) {
      errors.push('El mínimo de asistentes no puede ser mayor que el máximo')
    }

    if (data.advance_notice_days && data.advance_notice_days < 0) {
      errors.push('Los días de aviso previo no pueden ser negativos')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Utility functions
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  static getServiceTypeIcon(serviceType: string): string {
    const icons: Record<string, string> = {
      'event_complete': '🎉',
      'catering_only': '🍽️',
      'decoration_only': '🎈',
      'entertainment_only': '🎵',
      'transport_only': '🚐'
    }
    return icons[serviceType] || '🤝'
  }

  static getServiceTypeDisplayName(serviceType: string): string {
    const names: Record<string, string> = {
      'event_complete': 'Evento Completo',
      'catering_only': 'Solo Catering',
      'decoration_only': 'Solo Decoración',
      'entertainment_only': 'Solo Entretenimiento',
      'transport_only': 'Solo Transporte'
    }
    return names[serviceType] || serviceType
  }
}
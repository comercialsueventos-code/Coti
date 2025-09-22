import { supabase } from './supabase'
import { Supplier, CreateSupplierData, UpdateSupplierData, SupplierFilters } from '../types'

export interface SupplierPerformanceMetrics {
  supplier_id: number
  supplier_name: string
  total_collaborations: number
  total_revenue_generated: number
  average_project_value: number
  last_collaboration_date?: string
  reliability_score: number
  quality_score: number
  price_competitiveness: number
  overall_rating: number
}

export interface SupplierCollaboration {
  id: number
  supplier_id: number
  quote_id: number
  project_value: number
  collaboration_date: string
  performance_rating: number
  notes?: string
  created_at: string
}

export class SuppliersService {
  /**
   * Get all suppliers with optional filters
   */
  static async getAll(filters?: SupplierFilters): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name')

    if (filters?.type) {
      query = query.eq('type', filters.type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.service_area) {
      query = query.contains('service_areas', [filters.service_area])
    }

    if (filters?.specialty) {
      query = query.contains('specialties', [filters.specialty])
    }

    if (filters?.min_quality_rating !== undefined) {
      query = query.gte('quality_rating', filters.min_quality_rating)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, contact_person.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get supplier by ID
   */
  static async getById(id: number): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create new supplier
   */
  static async create(supplierData: CreateSupplierData): Promise<Supplier> {
    const processedData = {
      ...supplierData,
      payment_terms_days: supplierData.payment_terms_days || 30,
      requires_advance_payment: supplierData.requires_advance_payment ?? false,
      advance_payment_percentage: supplierData.advance_payment_percentage || 0,
      commission_percentage: supplierData.commission_percentage || 0,
      quality_rating: supplierData.quality_rating || 0,
      reliability_rating: supplierData.reliability_rating || 0,
      price_rating: supplierData.price_rating || 0,
      is_active: true
    }

    const { data, error } = await supabase
      .from('suppliers')
      .insert(processedData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update supplier
   */
  static async update(id: number, supplierData: UpdateSupplierData): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .update(supplierData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete supplier
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get suppliers by type
   */
  static async getByType(type: string): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('type', type)
      .eq('is_active', true)
      .order('quality_rating', { ascending: false })

    if (error) throw error
    return data || []
  }

  /**
   * Get top-rated suppliers
   */
  static async getTopRated(limit: number = 10): Promise<Supplier[]> {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)
      .order('quality_rating', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }

  /**
   * Search suppliers by specialty or service area
   */
  static async searchByCapability(
    capability: string, 
    serviceArea?: string
  ): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('is_active', true)

    // Search in specialties
    query = query.or(`specialties.cs.{${capability}}, equipment_categories.cs.{${capability}}`)

    // Filter by service area if provided
    if (serviceArea) {
      query = query.contains('service_areas', [serviceArea])
    }

    query = query.order('quality_rating', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get supplier performance metrics
   */
  static async getPerformanceMetrics(supplierId: number): Promise<SupplierPerformanceMetrics> {
    const supplier = await this.getById(supplierId)
    
    // TODO: Calculate real metrics from collaboration history
    // For now, return mock data based on supplier ratings
    
    const totalCollaborations = Math.floor(Math.random() * 50) + 1
    const averageProjectValue = 2000000 + (Math.random() * 8000000)
    const totalRevenue = totalCollaborations * averageProjectValue

    return {
      supplier_id: supplierId,
      supplier_name: supplier.name,
      total_collaborations: totalCollaborations,
      total_revenue_generated: totalRevenue,
      average_project_value: averageProjectValue,
      last_collaboration_date: supplier.last_collaboration_date,
      reliability_score: supplier.reliability_rating,
      quality_score: supplier.quality_rating,
      price_competitiveness: supplier.price_rating,
      overall_rating: (supplier.quality_rating + supplier.reliability_rating + supplier.price_rating) / 3
    }
  }

  /**
   * Get suppliers statistics
   */
  static async getStatistics(): Promise<{
    total_suppliers: number
    active_suppliers: number
    by_type: Record<string, number>
    average_quality_rating: number
    average_reliability_rating: number
    top_specialties: string[]
    service_coverage: string[]
  }> {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')

    if (error) throw error

    const activeSuppliers = suppliers?.filter(s => s.is_active) || []

    const byType = (suppliers || []).reduce((acc, supplier) => {
      acc[supplier.type] = (acc[supplier.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const qualityRatings = activeSuppliers.map(s => s.quality_rating).filter(r => r > 0)
    const reliabilityRatings = activeSuppliers.map(s => s.reliability_rating).filter(r => r > 0)

    const avgQuality = qualityRatings.length > 0
      ? qualityRatings.reduce((sum, rating) => sum + rating, 0) / qualityRatings.length
      : 0

    const avgReliability = reliabilityRatings.length > 0
      ? reliabilityRatings.reduce((sum, rating) => sum + rating, 0) / reliabilityRatings.length
      : 0

    // Get all specialties
    const allSpecialties = activeSuppliers
      .flatMap(s => s.specialties || [])
      .reduce((acc: Record<string, number>, specialty) => {
        acc[specialty] = (acc[specialty] || 0) + 1
        return acc
      }, {})

    const topSpecialties = Object.entries(allSpecialties)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([specialty]) => specialty)

    // Get all service areas
    const allServiceAreas = activeSuppliers
      .flatMap(s => s.service_areas || [])
      .filter((area, index, arr) => arr.indexOf(area) === index)

    return {
      total_suppliers: suppliers?.length || 0,
      active_suppliers: activeSuppliers.length,
      by_type: byType,
      average_quality_rating: avgQuality,
      average_reliability_rating: avgReliability,
      top_specialties: topSpecialties,
      service_coverage: allServiceAreas
    }
  }

  /**
   * Rate supplier after collaboration
   */
  static async rateSupplier(
    supplierId: number,
    qualityRating: number,
    reliabilityRating: number,
    priceRating: number
  ): Promise<Supplier> {
    // Get current ratings to calculate average with new rating
    const supplier = await this.getById(supplierId)
    
    // Simple average for now - could be more sophisticated with weighted averages
    const newQualityRating = (supplier.quality_rating + qualityRating) / 2
    const newReliabilityRating = (supplier.reliability_rating + reliabilityRating) / 2
    const newPriceRating = (supplier.price_rating + priceRating) / 2

    return await this.update(supplierId, {
      quality_rating: newQualityRating,
      reliability_rating: newReliabilityRating,
      price_rating: newPriceRating,
      last_collaboration_date: new Date().toISOString().split('T')[0]
    })
  }

  /**
   * Find suitable suppliers for a requirement
   */
  static async findSuitableSuppliers(
    serviceType: string,
    specialty?: string,
    serviceArea?: string,
    minQualityRating: number = 3.0
  ): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('type', serviceType)
      .eq('is_active', true)
      .gte('quality_rating', minQualityRating)

    if (specialty) {
      query = query.contains('specialties', [specialty])
    }

    if (serviceArea) {
      query = query.contains('service_areas', [serviceArea])
    }

    query = query.order('quality_rating', { ascending: false })

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Validation helpers
   */
  static validateSupplierData(data: CreateSupplierData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    if (!data.type) {
      errors.push('El tipo de proveedor es requerido')
    }

    if (data.payment_terms_days !== undefined && data.payment_terms_days < 0) {
      errors.push('Los días de pago no pueden ser negativos')
    }

    if (data.advance_payment_percentage !== undefined && 
        (data.advance_payment_percentage < 0 || data.advance_payment_percentage > 100)) {
      errors.push('El porcentaje de anticipo debe estar entre 0% y 100%')
    }

    if (data.commission_percentage !== undefined && 
        (data.commission_percentage < 0 || data.commission_percentage > 100)) {
      errors.push('El porcentaje de comisión debe estar entre 0% y 100%')
    }

    if (data.quality_rating !== undefined && 
        (data.quality_rating < 0 || data.quality_rating > 5)) {
      errors.push('La calificación de calidad debe estar entre 0 y 5')
    }

    if (data.reliability_rating !== undefined && 
        (data.reliability_rating < 0 || data.reliability_rating > 5)) {
      errors.push('La calificación de confiabilidad debe estar entre 0 y 5')
    }

    if (data.price_rating !== undefined && 
        (data.price_rating < 0 || data.price_rating > 5)) {
      errors.push('La calificación de precio debe estar entre 0 y 5')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Business logic helpers
   */
  static getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'machinery_rental': '🚐',
      'event_subcontractor': '🎪',
      'catering': '🍽️',
      'decoration': '🎈',
      'entertainment': '🎵',
      'transport': '🚚',
      'otros': '🏢'
    }
    return icons[type] || '🏢'
  }

  static getTypeDisplayName(type: string): string {
    const names: Record<string, string> = {
      'machinery_rental': 'Alquiler de Maquinaria',
      'event_subcontractor': 'Subcontratista de Eventos',
      'catering': 'Catering',
      'decoration': 'Decoración',
      'entertainment': 'Entretenimiento',
      'transport': 'Transporte',
      'otros': 'Otros'
    }
    return names[type] || type
  }

  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  static getRatingColor(rating: number): 'error' | 'warning' | 'success' {
    if (rating < 2.5) return 'error'
    if (rating < 4.0) return 'warning'
    return 'success'
  }

  static getRatingText(rating: number): string {
    if (rating < 1.5) return 'Muy Bajo'
    if (rating < 2.5) return 'Bajo'
    if (rating < 3.5) return 'Regular'
    if (rating < 4.5) return 'Bueno'
    return 'Excelente'
  }

  static calculateCommissionValue(projectValue: number, commissionPercentage: number): number {
    return projectValue * (commissionPercentage / 100)
  }

  static formatPaymentTerms(supplier: Supplier): string {
    let terms = `${supplier.payment_terms_days} días`
    
    if (supplier.requires_advance_payment) {
      terms += ` (${supplier.advance_payment_percentage}% anticipo)`
    }
    
    return terms
  }

  /**
   * Generate supplier report
   */
  static generateSupplierReport(suppliers: Supplier[]): {
    total_suppliers: number
    active_suppliers: number
    quality_distribution: Record<string, number>
    payment_terms_analysis: {
      average_payment_days: number
      advance_payment_required: number
      average_advance_percentage: number
    }
    commission_analysis: {
      average_commission: number
      total_potential_commission: number
    }
    geographic_coverage: string[]
    service_capabilities: string[]
  } {
    const activeSuppliers = suppliers.filter(s => s.is_active)

    const qualityDistribution = {
      'excelente': suppliers.filter(s => s.quality_rating >= 4.5).length,
      'bueno': suppliers.filter(s => s.quality_rating >= 3.5 && s.quality_rating < 4.5).length,
      'regular': suppliers.filter(s => s.quality_rating >= 2.5 && s.quality_rating < 3.5).length,
      'bajo': suppliers.filter(s => s.quality_rating < 2.5).length
    }

    const paymentTermsAnalysis = {
      average_payment_days: suppliers.length > 0
        ? suppliers.reduce((sum, s) => sum + s.payment_terms_days, 0) / suppliers.length
        : 0,
      advance_payment_required: suppliers.filter(s => s.requires_advance_payment).length,
      average_advance_percentage: suppliers.filter(s => s.requires_advance_payment).length > 0
        ? suppliers
            .filter(s => s.requires_advance_payment)
            .reduce((sum, s) => sum + s.advance_payment_percentage, 0) / 
          suppliers.filter(s => s.requires_advance_payment).length
        : 0
    }

    const commissionAnalysis = {
      average_commission: suppliers.length > 0
        ? suppliers.reduce((sum, s) => sum + s.commission_percentage, 0) / suppliers.length
        : 0,
      total_potential_commission: suppliers.reduce((sum, s) => sum + s.commission_percentage, 0)
    }

    const geographicCoverage = [...new Set(
      suppliers.flatMap(s => s.service_areas || [])
    )]

    const serviceCapabilities = [...new Set(
      suppliers.flatMap(s => s.specialties || [])
    )]

    return {
      total_suppliers: suppliers.length,
      active_suppliers: activeSuppliers.length,
      quality_distribution: qualityDistribution,
      payment_terms_analysis: paymentTermsAnalysis,
      commission_analysis: commissionAnalysis,
      geographic_coverage: geographicCoverage,
      service_capabilities: serviceCapabilities
    }
  }
}
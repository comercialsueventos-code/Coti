import { supabase } from './supabase'
import { MachineryRental } from '../types'

export interface CreateMachineryRentalData {
  supplier_id: number
  machinery_name: string
  category: 'sonido' | 'iluminacion' | 'cocina' | 'refrigeracion' | 'mobiliario' | 'decoracion' | 'transporte' | 'otros'
  description?: string
  supplier_hourly_rate: number
  supplier_daily_rate: number
  sue_hourly_rate: number
  sue_daily_rate: number
  setup_cost?: number
  requires_operator?: boolean
  operator_cost?: number
  minimum_rental_hours?: number
  delivery_cost?: number
  pickup_cost?: number
  insurance_cost?: number
  damage_deposit?: number
}

export interface UpdateMachineryRentalData extends Partial<CreateMachineryRentalData> {
  is_available?: boolean
}

export interface MachineryRentalFilters {
  supplier_id?: number
  category?: string
  is_available?: boolean
  max_hourly_rate?: number
  max_daily_rate?: number
  search?: string
}

export interface MachineryRentalCostCalculation {
  base_cost: number
  operator_cost: number
  setup_cost: number
  delivery_cost: number
  pickup_cost: number
  insurance_cost: number
  damage_deposit: number
  total_supplier_cost: number
  total_sue_price: number
  margin_amount: number
  margin_percentage: number
}

export class MachineryRentalService {
  /**
   * Get all machinery rentals with optional filters
   */
  static async getAll(filters?: MachineryRentalFilters): Promise<MachineryRental[]> {
    let query = supabase
      .from('machinery_rental')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .order('machinery_name')

    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.is_available !== undefined) {
      query = query.eq('is_available', filters.is_available)
    }

    if (filters?.search) {
      query = query.or(`machinery_name.ilike.%${filters.search}%, description.ilike.%${filters.search}%`)
    }

    if (filters?.max_hourly_rate !== undefined) {
      query = query.lte('sue_hourly_rate', filters.max_hourly_rate)
    }

    if (filters?.max_daily_rate !== undefined) {
      query = query.lte('sue_daily_rate', filters.max_daily_rate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get machinery rental by ID
   */
  static async getById(id: number): Promise<MachineryRental> {
    const { data, error } = await supabase
      .from('machinery_rental')
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
   * Create new machinery rental
   */
  static async create(rentalData: CreateMachineryRentalData): Promise<MachineryRental> {
    const processedData = {
      ...rentalData,
      requires_operator: rentalData.requires_operator ?? false,
      minimum_rental_hours: rentalData.minimum_rental_hours ?? 4,
      setup_cost: rentalData.setup_cost ?? 0,
      operator_cost: rentalData.operator_cost ?? 0,
      delivery_cost: rentalData.delivery_cost ?? 0,
      pickup_cost: rentalData.pickup_cost ?? 0,
      insurance_cost: rentalData.insurance_cost ?? 0,
      damage_deposit: rentalData.damage_deposit ?? 0,
      is_available: true
    }

    const { data, error } = await supabase
      .from('machinery_rental')
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
   * Update machinery rental
   */
  static async update(id: number, rentalData: UpdateMachineryRentalData): Promise<MachineryRental> {
    const { data, error } = await supabase
      .from('machinery_rental')
      .update(rentalData)
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
   * Delete machinery rental
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('machinery_rental')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get machinery rentals by category
   */
  static async getByCategory(category: string): Promise<MachineryRental[]> {
    const { data, error } = await supabase
      .from('machinery_rental')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('category', category)
      .eq('is_available', true)
      .order('machinery_name')

    if (error) throw error
    return data || []
  }

  /**
   * Get machinery rentals by supplier
   */
  static async getBySupplier(supplierId: number): Promise<MachineryRental[]> {
    const { data, error } = await supabase
      .from('machinery_rental')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .eq('supplier_id', supplierId)
      .eq('is_available', true)
      .order('machinery_name')

    if (error) throw error
    return data || []
  }

  /**
   * Calculate machinery rental cost for quote
   */
  static calculateMachineryRentalCost(
    rental: MachineryRental,
    hours: number,
    includeOperator: boolean = false,
    includeDelivery: boolean = false,
    includePickup: boolean = false
  ): MachineryRentalCostCalculation {
    // Determine if should use daily rate
    const useDaily = hours >= 8
    
    // Calculate supplier costs
    const supplierBaseCost = useDaily ? rental.supplier_daily_rate : rental.supplier_hourly_rate * hours
    const operatorCost = includeOperator && rental.requires_operator && rental.operator_cost
      ? rental.operator_cost * hours
      : 0
    const setupCost = rental.setup_cost || 0
    const deliveryCost = includeDelivery ? (rental.delivery_cost || 0) : 0
    const pickupCost = includePickup ? (rental.pickup_cost || 0) : 0
    const insuranceCost = rental.insurance_cost || 0
    const damageDeposit = rental.damage_deposit || 0

    const totalSupplierCost = supplierBaseCost + operatorCost + setupCost + deliveryCost + pickupCost + insuranceCost

    // Calculate Sue Events price
    const sueBaseCost = useDaily ? rental.sue_daily_rate : rental.sue_hourly_rate * hours
    const totalSuePrice = sueBaseCost + operatorCost + setupCost + deliveryCost + pickupCost + insuranceCost

    // Calculate margin
    const marginAmount = totalSuePrice - totalSupplierCost
    const marginPercentage = totalSupplierCost > 0 ? (marginAmount / totalSupplierCost) * 100 : 0

    return {
      base_cost: sueBaseCost,
      operator_cost: operatorCost,
      setup_cost: setupCost,
      delivery_cost: deliveryCost,
      pickup_cost: pickupCost,
      insurance_cost: insuranceCost,
      damage_deposit: damageDeposit,
      total_supplier_cost: totalSupplierCost,
      total_sue_price: totalSuePrice,
      margin_amount: marginAmount,
      margin_percentage: marginPercentage
    }
  }

  /**
   * Search machinery rentals
   */
  static async search(searchTerm: string): Promise<MachineryRental[]> {
    const { data, error } = await supabase
      .from('machinery_rental')
      .select(`
        *,
        supplier:suppliers(*)
      `)
      .or(`machinery_name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, category.ilike.%${searchTerm}%`)
      .eq('is_available', true)
      .order('machinery_name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    total_rentals: number
    available_rentals: number
    by_category: Record<string, number>
    by_supplier: Record<string, number>
    average_margin_percentage: number
  }> {
    const { data: rentals, error } = await supabase
      .from('machinery_rental')
      .select(`
        *,
        supplier:suppliers(name)
      `)

    if (error) throw error

    const availableRentals = rentals?.filter(r => r.is_available) || []

    const byCategory = (rentals || []).reduce((acc, rental) => {
      acc[rental.category] = (acc[rental.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySupplier = (rentals || []).reduce((acc, rental) => {
      const supplierName = rental.supplier?.name || 'Unknown'
      acc[supplierName] = (acc[supplierName] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate average margin percentage
    const margins = availableRentals.map(rental => {
      const supplierCost = rental.supplier_hourly_rate
      const sueCost = rental.sue_hourly_rate
      return supplierCost > 0 ? ((sueCost - supplierCost) / supplierCost) * 100 : 0
    })

    const averageMargin = margins.length > 0
      ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length
      : 0

    return {
      total_rentals: rentals?.length || 0,
      available_rentals: availableRentals.length,
      by_category: byCategory,
      by_supplier: bySupplier,
      average_margin_percentage: averageMargin
    }
  }

  /**
   * Validation helpers
   */
  static validateMachineryRentalData(data: CreateMachineryRentalData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.machinery_name || data.machinery_name.trim().length < 2) {
      errors.push('El nombre de la maquinaria debe tener al menos 2 caracteres')
    }

    if (!data.category) {
      errors.push('La categoría es requerida')
    }

    if (!data.supplier_hourly_rate || data.supplier_hourly_rate <= 0) {
      errors.push('La tarifa por hora del proveedor debe ser mayor a 0')
    }

    if (!data.supplier_daily_rate || data.supplier_daily_rate <= 0) {
      errors.push('La tarifa diaria del proveedor debe ser mayor a 0')
    }

    if (!data.sue_hourly_rate || data.sue_hourly_rate <= 0) {
      errors.push('La tarifa por hora de Sue Events debe ser mayor a 0')
    }

    if (!data.sue_daily_rate || data.sue_daily_rate <= 0) {
      errors.push('La tarifa diaria de Sue Events debe ser mayor a 0')
    }

    if (data.sue_hourly_rate <= data.supplier_hourly_rate) {
      errors.push('La tarifa de Sue Events debe ser mayor que la del proveedor')
    }

    if (data.sue_daily_rate <= data.supplier_daily_rate) {
      errors.push('La tarifa diaria de Sue Events debe ser mayor que la del proveedor')
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

  static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'sonido': '🎵',
      'iluminacion': '💡',
      'cocina': '🍳',
      'refrigeracion': '❄️',
      'mobiliario': '🪑',
      'decoracion': '🎈',
      'transporte': '🚐',
      'otros': '🔧'
    }
    return icons[category] || '🔧'
  }

  static getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'sonido': 'Sonido',
      'iluminacion': 'Iluminación',
      'cocina': 'Cocina',
      'refrigeracion': 'Refrigeración',
      'mobiliario': 'Mobiliario',
      'decoracion': 'Decoración',
      'transporte': 'Transporte',
      'otros': 'Otros'
    }
    return names[category] || category
  }
}
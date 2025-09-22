import { supabase } from './supabase'
import { DisposableItem } from '../types'

export interface CreateDisposableItemData {
  name: string
  category?: string
  subcategory?: string
  description?: string
  unit?: string
  cost_price: number
  sale_price: number
  minimum_quantity?: number
  supplier_info?: Record<string, any>
  is_recyclable?: boolean
  is_biodegradable?: boolean
  storage_requirements?: string
  shelf_life_days?: number
  image_url?: string
}

export interface UpdateDisposableItemData extends Partial<CreateDisposableItemData> {
  is_active?: boolean
}

export interface DisposableItemFilters {
  category?: string
  subcategory?: string
  is_active?: boolean
  is_recyclable?: boolean
  is_biodegradable?: boolean
  search?: string
  max_price?: number
  min_quantity?: number
}

export interface DisposableItemCostCalculation {
  unit_cost: number
  unit_sale_price: number
  quantity: number
  total_cost: number
  total_sale_price: number
  margin_amount: number
  margin_percentage: number
  minimum_quantity_required: number
}

export class DisposableItemsService {
  /**
   * Get all disposable items with optional filters
   */
  static async getAll(filters?: DisposableItemFilters): Promise<DisposableItem[]> {
    let query = supabase
      .from('disposable_items')
      .select('*')
      .order('category, subcategory, name')

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.subcategory) {
      query = query.eq('subcategory', filters.subcategory)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.is_recyclable !== undefined) {
      query = query.eq('is_recyclable', filters.is_recyclable)
    }

    if (filters?.is_biodegradable !== undefined) {
      query = query.eq('is_biodegradable', filters.is_biodegradable)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%, subcategory.ilike.%${filters.search}%`)
    }

    if (filters?.max_price !== undefined) {
      query = query.lte('sale_price', filters.max_price)
    }

    if (filters?.min_quantity !== undefined) {
      query = query.lte('minimum_quantity', filters.min_quantity)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get disposable item by ID
   */
  static async getById(id: number): Promise<DisposableItem> {
    const { data, error } = await supabase
      .from('disposable_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Create new disposable item
   */
  static async create(itemData: CreateDisposableItemData): Promise<DisposableItem> {
    const processedData = {
      ...itemData,
      category: itemData.category ?? 'desechables',
      unit: itemData.unit ?? 'unidad',
      minimum_quantity: itemData.minimum_quantity ?? 1,
      is_recyclable: itemData.is_recyclable ?? false,
      is_biodegradable: itemData.is_biodegradable ?? false,
      is_active: true
    }

    const { data, error } = await supabase
      .from('disposable_items')
      .insert(processedData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update disposable item
   */
  static async update(id: number, itemData: UpdateDisposableItemData): Promise<DisposableItem> {
    const { data, error } = await supabase
      .from('disposable_items')
      .update(itemData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete disposable item
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('disposable_items')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get disposable items by category
   */
  static async getByCategory(category: string): Promise<DisposableItem[]> {
    const { data, error } = await supabase
      .from('disposable_items')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('subcategory, name')

    if (error) throw error
    return data || []
  }

  /**
   * Get disposable items by subcategory
   */
  static async getBySubcategory(subcategory: string): Promise<DisposableItem[]> {
    const { data, error } = await supabase
      .from('disposable_items')
      .select('*')
      .eq('subcategory', subcategory)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  /**
   * Get eco-friendly items (recyclable or biodegradable)
   */
  static async getEcoFriendly(): Promise<DisposableItem[]> {
    const { data, error } = await supabase
      .from('disposable_items')
      .select('*')
      .or('is_recyclable.eq.true,is_biodegradable.eq.true')
      .eq('is_active', true)
      .order('category, subcategory, name')

    if (error) throw error
    return data || []
  }

  /**
   * Calculate disposable item cost for quote
   */
  static calculateDisposableItemCost(
    item: DisposableItem,
    quantity: number,
    customPrice?: number
  ): DisposableItemCostCalculation {
    const unitSalePrice = customPrice ?? item.sale_price
    const unitCost = item.cost_price

    // Ensure minimum quantity
    const actualQuantity = Math.max(quantity, item.minimum_quantity)

    const totalCost = unitCost * actualQuantity
    const totalSalePrice = unitSalePrice * actualQuantity

    const marginAmount = totalSalePrice - totalCost
    const marginPercentage = totalCost > 0 ? (marginAmount / totalCost) * 100 : 0

    return {
      unit_cost: unitCost,
      unit_sale_price: unitSalePrice,
      quantity: actualQuantity,
      total_cost: totalCost,
      total_sale_price: totalSalePrice,
      margin_amount: marginAmount,
      margin_percentage: marginPercentage,
      minimum_quantity_required: item.minimum_quantity
    }
  }

  /**
   * Search disposable items
   */
  static async search(searchTerm: string): Promise<DisposableItem[]> {
    const { data, error } = await supabase
      .from('disposable_items')
      .select('*')
      .or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, subcategory.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  /**
   * Get available categories and subcategories
   */
  static async getCategories(): Promise<{
    categories: string[]
    subcategories: Record<string, string[]>
  }> {
    const { data: items, error } = await supabase
      .from('disposable_items')
      .select('category, subcategory')
      .eq('is_active', true)

    if (error) throw error

    const categories = [...new Set((items || []).map(item => item.category))]
    
    const subcategories = (items || []).reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      if (item.subcategory && !acc[item.category].includes(item.subcategory)) {
        acc[item.category].push(item.subcategory)
      }
      return acc
    }, {} as Record<string, string[]>)

    return {
      categories: categories.sort(),
      subcategories
    }
  }

  /**
   * Get statistics
   */
  static async getStatistics(): Promise<{
    total_items: number
    active_items: number
    by_category: Record<string, number>
    by_subcategory: Record<string, number>
    eco_friendly_count: number
    average_margin_percentage: number
    average_price: number
  }> {
    const { data: items, error } = await supabase
      .from('disposable_items')
      .select('*')

    if (error) throw error

    const activeItems = items?.filter(item => item.is_active) || []
    const ecoFriendlyItems = activeItems.filter(item => item.is_recyclable || item.is_biodegradable)

    const byCategory = (items || []).reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySubcategory = (items || []).reduce((acc, item) => {
      if (item.subcategory) {
        acc[item.subcategory] = (acc[item.subcategory] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Calculate averages
    const margins = activeItems.map(item => {
      const margin = item.sale_price - item.cost_price
      return item.cost_price > 0 ? (margin / item.cost_price) * 100 : 0
    })

    const prices = activeItems.map(item => item.sale_price)

    const averageMargin = margins.length > 0
      ? margins.reduce((sum, margin) => sum + margin, 0) / margins.length
      : 0

    const averagePrice = prices.length > 0
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0

    return {
      total_items: items?.length || 0,
      active_items: activeItems.length,
      by_category: byCategory,
      by_subcategory: bySubcategory,
      eco_friendly_count: ecoFriendlyItems.length,
      average_margin_percentage: averageMargin,
      average_price: averagePrice
    }
  }

  /**
   * Validation helpers
   */
  static validateDisposableItemData(data: CreateDisposableItemData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    if (!data.cost_price || data.cost_price <= 0) {
      errors.push('El precio de costo debe ser mayor a 0')
    }

    if (!data.sale_price || data.sale_price <= 0) {
      errors.push('El precio de venta debe ser mayor a 0')
    }

    if (data.sale_price <= data.cost_price) {
      errors.push('El precio de venta debe ser mayor que el precio de costo')
    }

    if (data.minimum_quantity !== undefined && data.minimum_quantity < 1) {
      errors.push('La cantidad mínima debe ser al menos 1')
    }

    if (data.shelf_life_days !== undefined && data.shelf_life_days < 0) {
      errors.push('La vida útil no puede ser negativa')
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

  static getSubcategoryIcon(subcategory?: string): string {
    const icons: Record<string, string> = {
      'vajilla': '🍽️',
      'cubiertos': '🍴',
      'vasos': '🥤',
      'platos': '🍽️',
      'servilletas': '🧻',
      'manteles': '🫖',
      'toallas': '🧽',
      'velas': '🕯️',
      'globos': '🎈',
      'confeti': '🎊',
      'bolsas_basura': '🗑️',
      'productos_limpieza': '🧽',
      'packaging': '📦',
      'decoracion': '🎈',
      'otros': '📦'
    }
    return icons[subcategory || ''] || '📦'
  }

  static getEcoLabel(item: DisposableItem): string {
    if (item.is_biodegradable && item.is_recyclable) {
      return '♻️🌱 Eco-Friendly'
    } else if (item.is_biodegradable) {
      return '🌱 Biodegradable'
    } else if (item.is_recyclable) {
      return '♻️ Reciclable'
    }
    return ''
  }
}
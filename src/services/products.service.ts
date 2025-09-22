import { supabase } from './supabase'
import { Product } from '../types'

export interface CreateProductData {
  category?: string // Deprecated: usar category_id
  category_id: number
  subcategory?: string
  name: string
  description?: string
  pricing_type: 'unit' | 'measurement'
  base_price: number
  unit: string
  requires_equipment?: boolean
  equipment_needed?: string[]
  preparation_time_minutes?: number
  shelf_life_hours?: number
  ingredients?: string[]
  allergens?: string[]
  nutritional_info?: Record<string, any>
  supplier_info?: Record<string, any>
  cost_price?: number
  minimum_order?: number
  is_seasonal?: boolean
  seasonal_months?: number[]
  image_url?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  is_active?: boolean
}

export interface ProductFilters {
  category?: string // Deprecated: usar category_id
  category_id?: number
  subcategory?: string
  is_active?: boolean
  requires_equipment?: boolean
  is_seasonal?: boolean
  search?: string
  max_price?: number
  min_price?: number
}

export class ProductsService {
  static async getAll(filters?: ProductFilters): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .order('category, name')

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.subcategory) {
      query = query.eq('subcategory', filters.subcategory)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.requires_equipment !== undefined) {
      query = query.eq('requires_equipment', filters.requires_equipment)
    }

    if (filters?.is_seasonal !== undefined) {
      query = query.eq('is_seasonal', filters.is_seasonal)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%, category.ilike.%${filters.search}%`)
    }

    if (filters?.min_price !== undefined) {
      query = query.gte('base_price', filters.min_price)
    }

    if (filters?.max_price !== undefined) {
      query = query.lte('base_price', filters.max_price)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(productData: CreateProductData): Promise<Product> {
    const processedData = {
      ...productData,
      requires_equipment: productData.requires_equipment ?? false,
      minimum_order: productData.minimum_order ?? 1,
      is_seasonal: productData.is_seasonal ?? false,
      is_active: true
    }

    const { data, error } = await supabase
      .from('products')
      .insert(processedData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: number, productData: UpdateProductData): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getByCategory(category: string | number): Promise<Product[]> {
    let query = supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .eq('is_active', true)
      .order('name')

    // Permitir búsqueda por category_id (número) o category (string, para compatibilidad)
    if (typeof category === 'number') {
      query = query.eq('category_id', category)
    } else {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .eq('is_active', true)
      .order('category, name')

    if (error) throw error
    return data || []
  }

  static async search(searchTerm: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .or(`name.ilike.%${searchTerm}%, description.ilike.%${searchTerm}%, category.ilike.%${searchTerm}%, categories.display_name.ilike.%${searchTerm}%, categories.name.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  static async getSeasonalProducts(): Promise<Product[]> {
    const currentMonth = new Date().getMonth() + 1

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category_info:categories(*)
      `)
      .eq('is_seasonal', true)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    
    // Filter by current month on client side
    return (data || []).filter(product => 
      !product.seasonal_months || 
      product.seasonal_months.includes(currentMonth)
    )
  }

  // Validation helpers
  static validateProductData(data: CreateProductData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    if (!data.category_id || data.category_id <= 0) {
      errors.push('La categoría es requerida')
    }

    if (!data.unit || data.unit.trim().length < 1) {
      errors.push('La unidad de medida es requerida')
    }

    if (!data.base_price || data.base_price <= 0) {
      errors.push('El precio base debe ser mayor a 0')
    }

    if (data.cost_price !== undefined && data.cost_price < 0) {
      errors.push('El precio de costo no puede ser negativo')
    }

    if (data.minimum_order !== undefined && data.minimum_order < 1) {
      errors.push('El pedido mínimo debe ser al menos 1')
    }

    if (data.preparation_time_minutes !== undefined && data.preparation_time_minutes < 0) {
      errors.push('El tiempo de preparación no puede ser negativo')
    }

    if (data.shelf_life_hours !== undefined && data.shelf_life_hours < 0) {
      errors.push('La vida útil no puede ser negativa')
    }

    if (data.seasonal_months) {
      const validMonths = data.seasonal_months.every(month => month >= 1 && month <= 12)
      if (!validMonths) {
        errors.push('Los meses estacionales deben estar entre 1 y 12')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Business logic helpers
  static calculateMargin(basePrice: number, costPrice?: number): number {
    if (!costPrice || costPrice <= 0) return 0
    return ((basePrice - costPrice) / costPrice) * 100
  }

  static calculateProfitPerUnit(basePrice: number, costPrice?: number): number {
    if (!costPrice) return 0
    return basePrice - costPrice
  }

  // Deprecated: usar category_info del producto o CategoriesService
  static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'bebidas': '🥤',
      'snacks': '🍿',
      'dulces': '🍭',
      'postres': '🧇',
      'comida': '🍽️',
      'decoracion': '🎈',
      'equipos': '🔧',
      'mobiliario': '🪑',
      'personal': '👥',
      'transporte': '🚐',
      'otros': '📦'
    }
    return icons[category.toLowerCase()] || '📦'
  }

  // Deprecated: usar category_info del producto o CategoriesService
  static getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'bebidas': 'Bebidas',
      'snacks': 'Snacks',
      'dulces': 'Dulces',
      'postres': 'Postres',
      'comida': 'Comida',
      'decoracion': 'Decoración',
      'equipos': 'Equipos',
      'mobiliario': 'Mobiliario',
      'personal': 'Personal',
      'transporte': 'Transporte',
      'otros': 'Otros'
    }
    return names[category.toLowerCase()] || category
  }

  static formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  static formatUnit(unit: string, quantity: number = 1): string {
    const units: Record<string, { singular: string; plural: string }> = {
      'unidad': { singular: 'unidad', plural: 'unidades' },
      'porcion': { singular: 'porción', plural: 'porciones' },
      'litro': { singular: 'litro', plural: 'litros' },
      'kilo': { singular: 'kilo', plural: 'kilos' },
      'gramo': { singular: 'gramo', plural: 'gramos' },
      'docena': { singular: 'docena', plural: 'docenas' },
      'paquete': { singular: 'paquete', plural: 'paquetes' },
      'caja': { singular: 'caja', plural: 'cajas' }
    }

    const unitInfo = units[unit.toLowerCase()]
    if (unitInfo) {
      return quantity === 1 ? unitInfo.singular : unitInfo.plural
    }
    return unit
  }

  static getSeasonalStatus(product: Product): {
    isInSeason: boolean
    message: string
    nextSeasonMonth?: number
  } {
    if (!product.is_seasonal || !product.seasonal_months) {
      return { isInSeason: true, message: 'Disponible todo el año' }
    }

    const currentMonth = new Date().getMonth() + 1
    const isInSeason = product.seasonal_months.includes(currentMonth)

    if (isInSeason) {
      return { isInSeason: true, message: 'En temporada' }
    }

    // Find next season month
    const futureMonths = product.seasonal_months.filter(month => month > currentMonth)
    const nextSeasonMonth = futureMonths.length > 0 
      ? Math.min(...futureMonths)
      : Math.min(...product.seasonal_months)

    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]

    return {
      isInSeason: false,
      message: `Próxima temporada: ${monthNames[nextSeasonMonth - 1]}`,
      nextSeasonMonth
    }
  }

  static checkInventoryAlert(product: Product, requestedQuantity: number): {
    hasAlert: boolean
    message: string
    severity: 'info' | 'warning' | 'error'
  } {
    if (requestedQuantity < product.minimum_order) {
      return {
        hasAlert: true,
        message: `Pedido mínimo: ${product.minimum_order} ${ProductsService.formatUnit(product.unit, product.minimum_order)}`,
        severity: 'warning'
      }
    }

    const seasonal = ProductsService.getSeasonalStatus(product)
    if (!seasonal.isInSeason) {
      return {
        hasAlert: true,
        message: seasonal.message,
        severity: 'warning'
      }
    }

    return {
      hasAlert: false,
      message: 'Disponible',
      severity: 'info'
    }
  }

  // Equipment helpers
  static getRequiredEquipment(products: Product[]): string[] {
    const equipment = new Set<string>()
    
    products.forEach(product => {
      if (product.requires_equipment && product.equipment_needed) {
        product.equipment_needed.forEach(eq => equipment.add(eq))
      }
    })

    return Array.from(equipment)
  }

  static estimateTotalPreparationTime(products: { product: Product; quantity: number }[]): number {
    return products.reduce((total, { product, quantity }) => {
      const prepTime = product.preparation_time_minutes || 0
      return total + (prepTime * quantity)
    }, 0)
  }

  // Statistics and reports
  static generateProductReport(products: Product[]): {
    total_products: number
    by_category: Record<string, number>
    active_products: number
    seasonal_products: number
    requires_equipment_count: number
    average_price: number
    most_expensive: Product | null
    cheapest: Product | null
    categories: string[]
  } {
    const activeProducts = products.filter(p => p.is_active)
    
    const byCategory = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const seasonalCount = products.filter(p => p.is_seasonal).length
    const equipmentCount = products.filter(p => p.requires_equipment).length
    
    const prices = activeProducts.map(p => p.base_price).filter(price => price > 0)
    const averagePrice = prices.length > 0 
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length 
      : 0

    const mostExpensive = activeProducts.length > 0
      ? activeProducts.reduce((max, product) => 
          product.base_price > max.base_price ? product : max)
      : null

    const cheapest = activeProducts.length > 0
      ? activeProducts.reduce((min, product) => 
          product.base_price < min.base_price ? product : min)
      : null

    return {
      total_products: products.length,
      by_category: byCategory,
      active_products: activeProducts.length,
      seasonal_products: seasonalCount,
      requires_equipment_count: equipmentCount,
      average_price: averagePrice,
      most_expensive: mostExpensive,
      cheapest: cheapest,
      categories: Object.keys(byCategory)
    }
  }

  // Default values for new products
  static getDefaultValues(category: string): Partial<CreateProductData> {
    const defaults: Record<string, Partial<CreateProductData>> = {
      'bebidas': {
        unit: 'litro',
        minimum_order: 1,
        shelf_life_hours: 24,
        requires_equipment: true,
        equipment_needed: ['dispensador', 'vasos', 'hielo']
      },
      'snacks': {
        unit: 'porcion',
        minimum_order: 10,
        shelf_life_hours: 48,
        requires_equipment: true,
        equipment_needed: ['bowl', 'servilletas']
      },
      'dulces': {
        unit: 'unidad',
        minimum_order: 12,
        shelf_life_hours: 72,
        requires_equipment: false
      },
      'postres': {
        unit: 'porcion',
        minimum_order: 6,
        shelf_life_hours: 12,
        preparation_time_minutes: 30,
        requires_equipment: true,
        equipment_needed: ['platos', 'cucharas']
      }
    }

    return defaults[category.toLowerCase()] || {
      unit: 'unidad',
      minimum_order: 1,
      requires_equipment: false
    }
  }

  // Bulk operations
  static async updateMultiple(updates: { id: number; data: UpdateProductData }[]): Promise<Product[]> {
    const results = await Promise.all(
      updates.map(({ id, data }) => ProductsService.update(id, data))
    )
    return results
  }

  static async deactivateMultiple(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .in('id', ids)

    if (error) throw error
  }

  static async activateMultiple(ids: number[]): Promise<void> {
    const { error } = await supabase
      .from('products')
      .update({ is_active: true })
      .in('id', ids)

    if (error) throw error
  }
}
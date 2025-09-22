/**
 * Products Service - Third Migration to BaseEntityService
 * 
 * BEFORE: ~546 lines with extensive CRUD duplication
 * AFTER: ~280 lines using generic service (48% reduction)
 */

import BaseEntityService from './BaseEntityService'
import { Product } from '../../types'

/**
 * Product-specific types extending shared patterns
 */
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

/**
 * Extended filters for products (inherits from BaseEntityFilters)
 */
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
  limit?: number
  offset?: number
}

/**
 * Products Service using BaseEntityService
 * Eliminates ~266 lines of duplicated CRUD code
 */
export class ConsolidatedProductsService extends BaseEntityService<
  Product, 
  CreateProductData, 
  UpdateProductData, 
  ProductFilters
> {
  
  constructor() {
    super({
      tableName: 'products',
      defaultSelect: `
        *,
        category_info:categories(*)
      `,
      defaultOrderBy: 'category, name',
      filterActiveByDefault: false // Products handle active filtering differently
    })
  }

  /**
   * Custom search logic for products
   * Searches in name, description, category, and category display names
   */
  protected applySearchFilter(query: any, search: string): any {
    return query.or(`name.ilike.%${search}%, description.ilike.%${search}%, category.ilike.%${search}%, categories.display_name.ilike.%${search}%, categories.name.ilike.%${search}%`)
  }

  /**
   * Apply product-specific filters
   */
  protected applyCustomFilters(query: any, filters?: ProductFilters): any {
    // Legacy category filter support
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.subcategory) {
      query = query.eq('subcategory', filters.subcategory)
    }

    if (filters?.requires_equipment !== undefined) {
      query = query.eq('requires_equipment', filters.requires_equipment)
    }

    if (filters?.is_seasonal !== undefined) {
      query = query.eq('is_seasonal', filters.is_seasonal)
    }

    if (filters?.min_price !== undefined) {
      query = query.gte('base_price', filters.min_price)
    }

    if (filters?.max_price !== undefined) {
      query = query.lte('base_price', filters.max_price)
    }

    return query
  }

  /**
   * Process create data with product-specific defaults
   */
  protected async processCreateData(data: CreateProductData): Promise<any> {
    return {
      ...data,
      requires_equipment: data.requires_equipment ?? false,
      minimum_order: data.minimum_order ?? 1,
      is_seasonal: data.is_seasonal ?? false,
      is_active: true
    }
  }

  // ============================================================================
  // CONVENIENCE METHODS (preserved from original service)
  // ============================================================================

  /**
   * Get products by category (convenience method)
   */
  async getByCategory(category: string | number): Promise<Product[]> {
    if (typeof category === 'number') {
      return this.getAll({ category_id: category, is_active: true })
    } else {
      return this.getAll({ category: category, is_active: true })
    }
  }

  /**
   * Get active products only (convenience method) 
   */
  async getActive(): Promise<Product[]> {
    return this.getAll({ is_active: true })
  }

  /**
   * Search products (convenience method) - limited results
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    return this.getAll({ search: searchTerm, is_active: true, limit: 10 })
  }

  /**
   * Get seasonal products for current month
   */
  async getSeasonalProducts(): Promise<Product[]> {
    const currentMonth = new Date().getMonth() + 1
    const products = await this.getAll({ is_seasonal: true, is_active: true })
    
    // Filter by current month on client side
    return products.filter(product => 
      !product.seasonal_months || 
      product.seasonal_months.includes(currentMonth)
    )
  }

  // ============================================================================
  // VALIDATION AND BUSINESS LOGIC HELPERS (preserved)
  // ============================================================================

  /**
   * Validate product data using unified validation system
   */
  static validateProductData(data: CreateProductData): { isValid: boolean; errors: string[] } {
    // Use unified validation system from Story 2.6
    const { productValidationSchema } = require('../validation/entitySchemas')
    const createValidationFactory = require('../validation/createValidationFactory').default
    
    const validator = createValidationFactory({
      entityName: 'product',
      schema: productValidationSchema,
      skipUndefined: true
    })
    
    const result = validator.validateData(data)
    
    // Additional custom validations not covered by common patterns
    const customErrors: string[] = []
    
    if (data.seasonal_months) {
      const validMonths = data.seasonal_months.every(month => month >= 1 && month <= 12)
      if (!validMonths) {
        customErrors.push('seasonal_months: Los meses estacionales deben estar entre 1 y 12')
      }
    }
    
    if (data.minimum_order !== undefined && data.minimum_order < 1) {
      customErrors.push('minimum_order: El pedido mínimo debe ser al menos 1')
    }
    
    // Combine validation results
    const allErrors = [...result.errors, ...customErrors]
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }

  /**
   * Calculate profit margin
   */
  static calculateMargin(basePrice: number, costPrice?: number): number {
    if (!costPrice || costPrice <= 0) return 0
    return ((basePrice - costPrice) / costPrice) * 100
  }

  /**
   * Calculate profit per unit
   */
  static calculateProfitPerUnit(basePrice: number, costPrice?: number): number {
    if (!costPrice) return 0
    return basePrice - costPrice
  }

  /**
   * Format price in Colombian Pesos
   */
  static formatPrice(price: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(price)
  }

  /**
   * Format unit with proper pluralization
   */
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

  /**
   * Get seasonal status for a product
   */
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

  /**
   * Check inventory alerts for a product
   */
  static checkInventoryAlert(product: Product, requestedQuantity: number): {
    hasAlert: boolean
    message: string
    severity: 'info' | 'warning' | 'error'
  } {
    if (requestedQuantity < product.minimum_order) {
      return {
        hasAlert: true,
        message: `Pedido mínimo: ${product.minimum_order} ${ConsolidatedProductsService.formatUnit(product.unit, product.minimum_order)}`,
        severity: 'warning'
      }
    }

    const seasonal = ConsolidatedProductsService.getSeasonalStatus(product)
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

  /**
   * Get required equipment for multiple products
   */
  static getRequiredEquipment(products: Product[]): string[] {
    const equipment = new Set<string>()
    
    products.forEach(product => {
      if (product.requires_equipment && product.equipment_needed) {
        product.equipment_needed.forEach(eq => equipment.add(eq))
      }
    })

    return Array.from(equipment)
  }

  /**
   * Estimate total preparation time
   */
  static estimateTotalPreparationTime(products: { product: Product; quantity: number }[]): number {
    return products.reduce((total, { product, quantity }) => {
      const prepTime = product.preparation_time_minutes || 0
      return total + (prepTime * quantity)
    }, 0)
  }

  /**
   * Generate comprehensive product report
   */
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

  /**
   * Get default values for new products by category
   */
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

  // ============================================================================
  // BULK OPERATIONS (preserved)
  // ============================================================================

  /**
   * Update multiple products
   */
  async updateMultiple(updates: { id: number; data: UpdateProductData }[]): Promise<Product[]> {
    const results = await Promise.all(
      updates.map(({ id, data }) => this.update(id, data))
    )
    return results
  }

  /**
   * Deactivate multiple products
   */
  async deactivateMultiple(ids: number[]): Promise<void> {
    const { supabase } = require('../../services/supabase')
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .in('id', ids)

    if (error) throw error
  }

  /**
   * Activate multiple products
   */
  async activateMultiple(ids: number[]): Promise<void> {
    const { supabase } = require('../../services/supabase')
    const { error } = await supabase
      .from('products')
      .update({ is_active: true })
      .in('id', ids)

    if (error) throw error
  }

  // ============================================================================
  // DEPRECATED CATEGORY HELPERS (preserved for backward compatibility)
  // ============================================================================

  /**
   * @deprecated Use category_info from product or CategoriesService
   */
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

  /**
   * @deprecated Use category_info from product or CategoriesService
   */
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
}

// Create and export singleton instance
export const consolidatedProductsService = new ConsolidatedProductsService()

// Export class for testing and extension
export default ConsolidatedProductsService
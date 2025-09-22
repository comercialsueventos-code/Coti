import { Employee, Product, TransportZone, Client } from '../types'
import { TransportZoneInput } from '../components/pricing/types'

// Types específicos para pricing
export interface EmployeePricingInput {
  employee: Employee
  hours: number
  extraCost?: number
  extraCostReason?: string
  date?: string // Para validar disponibilidad
}

export interface EmployeePricingResult {
  employee_id: number
  employee_name: string
  employee_type: string
  hours: number
  hourly_rate: number
  base_cost: number
  arl_cost: number
  extra_cost: number
  extra_cost_reason?: string
  total_cost: number
  rate_tier: '1-4h' | '4-8h' | '8h+'
  is_available: boolean
}

export interface TransportAllocation {
  productId: number
  quantity: number
}

export interface TransportCalculationInput {
  zone: any // TransportZone type
  transport_count: number
  include_equipment: boolean
  use_flexible_transport?: boolean
  transport_allocations?: TransportAllocation[]
  selected_product_ids?: number[]
}

export interface TransportPricingInput {
  zone_id: number
  requires_equipment: boolean
  equipment_count?: number
}

export interface TransportPricingResult {
  zone_id: number
  zone_name: string
  base_cost: number
  equipment_cost: number
  total_transport_cost: number
  estimated_time_minutes: number
}

export interface ProductPricingInput {
  product: Product
  quantity: number // Cantidad de productos
  measurement_per_unit?: number // Para productos tipo 'measurement': cuántas unidades de medida por producto (ej. 7 onzas por frappe)
  custom_price?: number // Para productos variables
  custom_reason?: string
}

export interface ProductPricingResult {
  product_id: number
  product_name: string
  category: string
  pricing_type: 'unit' | 'measurement'
  quantity: number
  measurement_per_unit?: number // Solo para tipo 'measurement'
  unit_price: number // Para 'unit': precio por producto. Para 'measurement': precio por unidad de medida
  total_cost: number
  margin: number
  is_variable: boolean
  variable_reason?: string
  calculation_breakdown?: string // Ej. "100 frappes × 7 onzas × $200/onza"
}

export interface MachineryPricingInput {
  machinery: any // Machinery type
  hours: number
  includeOperator: boolean
  setupRequired: boolean
}

export interface MachineryRentalPricingInput {
  machineryRental: any // MachineryRental type
  hours: number
  includeOperator: boolean
  includeDelivery: boolean
  includePickup: boolean
  customMarginPercentage?: number
  isCustomCost?: boolean
  customTotalCost?: number
}

export interface EventSubcontractPricingInput {
  eventSubcontract: any // EventSubcontract type
  attendees?: number
  customSupplierCost?: number
  customSuePrice?: number
  customMarginPercentage?: number
  notes?: string
}

export interface DisposableItemPricingInput {
  disposableItem: any // DisposableItem type
  quantity: number
  isCustomPrice: boolean
  customPrice?: number
  customReason?: string
  isCustomTotalCost?: boolean
  customTotalCost?: number
  associatedProductId?: number
}

export interface QuotePricingInput {
  client: Client
  employees: EmployeePricingInput[]
  products: ProductPricingInput[]
  machinery?: MachineryPricingInput[]
  machineryRentals?: MachineryRentalPricingInput[]
  eventSubcontracts?: EventSubcontractPricingInput[]
  disposableItems?: DisposableItemPricingInput[]
  transport?: TransportPricingInput // Deprecated: usar transportZones
  transportZones?: TransportZoneInput[] // Nueva implementación de múltiples zonas
  transport_product_ids?: number[] // Manual selection of products for transport distribution
  use_flexible_transport?: boolean // Toggle para distribución manual vs automática
  transport_allocations?: TransportAllocation[] // Asignaciones manuales por producto
  margin_percentage?: number
  margin_mode?: 'global' | 'per_line'
  enable_retention?: boolean // Control manual para aplicar retención
  retention_percentage?: number // Valor manual del porcentaje de retención
}

export interface MachineryPricingResult {
  machinery_id: number
  machinery_name: string
  hours: number
  base_cost: number
  operator_cost: number
  setup_cost: number
  total_cost: number
}

export interface MachineryRentalPricingResult {
  rental_id: number
  machinery_name: string
  hours: number
  base_cost: number
  operator_cost: number
  setup_cost: number
  delivery_cost: number
  pickup_cost: number
  total_cost: number
}

export interface EventSubcontractPricingResult {
  subcontract_id: number
  service_name: string
  supplier_cost: number
  sue_price: number
  total_cost: number
}

export interface DisposableItemPricingResult {
  item_id: number
  item_name: string
  quantity: number
  unit_price: number
  total_cost: number
}

export interface QuotePricingResult {
  employees: EmployeePricingResult[]
  products: ProductPricingResult[]
  machinery?: MachineryPricingResult[]
  machineryRentals?: MachineryRentalPricingResult[]
  eventSubcontracts?: EventSubcontractPricingResult[]
  disposableItems?: DisposableItemPricingResult[]
  transport?: TransportPricingResult
  
  // Subtotales
  employees_subtotal: number
  products_subtotal: number
  machinery_subtotal: number
  machinery_rental_subtotal: number
  subcontract_subtotal: number
  disposable_subtotal: number
  transport_subtotal: number
  subtotal: number
  
  // Cálculos finales
  margin_percentage: number
  margin_amount: number
  tax_retention_percentage: number
  tax_retention_amount: number
  total_cost: number
  
  // Información del cliente
  client_type: 'social' | 'corporativo'
  payment_terms: {
    days: number
    requires_advance: boolean
    advance_percentage: number
  }
}

// 🤖 ULTRATHINK: Generador inteligente de títulos para cotizaciones
export const generateIntelligentQuoteTitle = (data: {
  client?: { name?: string, type?: string },
  products?: Array<{ product?: { name?: string }, quantity?: number }>,
  employeeCount?: number,
  eventStartDate?: string,
  estimatedAttendees?: number,
  eventDescription?: string
}): string => {
  const { client, products = [], employeeCount = 0, eventStartDate, estimatedAttendees, eventDescription } = data

  // Si ya hay descripción manual, usarla como base
  if (eventDescription && eventDescription !== 'Evento sin título') {
    return eventDescription
  }

  // Análisis inteligente de productos para determinar tipo de evento
  const productNames = products.map(p => p.product?.name?.toLowerCase() || '').filter(Boolean)
  let eventType = 'Evento'
  
  // 🎂 Eventos de celebración
  if (productNames.some(name => name.includes('torta') || name.includes('pastel') || name.includes('vela'))) {
    eventType = 'Celebración'
  }
  // 🍽️ Eventos gastronómicos
  else if (productNames.some(name => name.includes('frape') || name.includes('bebida') || name.includes('cóctel'))) {
    eventType = 'Evento Gastronómico'
  }
  // 🎉 Eventos corporativos
  else if (client?.type === 'corporativo') {
    if (productNames.some(name => name.includes('coffee') || name.includes('café'))) {
      eventType = 'Coffee Break Corporativo'
    } else {
      eventType = 'Evento Corporativo'
    }
  }
  // 👨‍👩‍👧‍👦 Eventos sociales
  else if (client?.type === 'social') {
    eventType = 'Evento Social'
  }

  // Construir título inteligente
  let title = eventType

  // Agregar info del cliente si es relevante
  if (client?.name) {
    const clientName = client.name
    if (clientName.length < 30) { // Solo si no es muy largo
      title += ` - ${clientName}`
    }
  }

  // Agregar detalles si son relevantes
  if (estimatedAttendees && estimatedAttendees > 0) {
    title += ` (${estimatedAttendees} personas)`
  }

  // Agregar fecha si está disponible
  if (eventStartDate) {
    const date = new Date(eventStartDate)
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const formattedDate = `${date.getDate()} ${monthNames[date.getMonth()]}`
    title += ` - ${formattedDate}`
  }

  // Limitar longitud total
  if (title.length > 80) {
    title = title.substring(0, 77) + '...'
  }

  // Title generated intelligently
  return title
}

// 🤖 ULTRATHINK: Validación de asociación empleado-producto
export const validateEmployeeProductAssociation = (data: {
  employees: Array<any>,
  products: Array<any>
}): { isValid: boolean, errors: string[] } => {
  const errors: string[] = []
  
  // Si no hay empleados, es válido (no es requerido tener empleados)
  if (!data.employees || data.employees.length === 0) {
    return { isValid: true, errors: [] }
  }
  
  // Si hay empleados pero no hay productos, es inválido
  if (!data.products || data.products.length === 0) {
    errors.push('⚠️ Debe agregar al menos un producto para poder incluir operarios en la cotización')
    return { isValid: false, errors }
  }
  
  // Si el formulario soporta asociación explícita, validar que cada operario tenga al menos un producto
  const hasExplicitAssociation = data.employees.some(e => Array.isArray(e.selectedProductIds))
  if (hasExplicitAssociation) {
    const withoutLinks = data.employees.filter(e => (e.selectedProductIds?.length || 0) === 0)
    if (withoutLinks.length > 0) {
      errors.push(`⚠️ Cada operario debe estar asociado a mínimo un producto: ${withoutLinks.map(e => e.employee?.name || 'Operario').join(', ')}`)
    }
  }

  // Validar coherencia general empleado-producto
  const productNames = data.products.map(p => p.product?.name?.toLowerCase() || '').filter(Boolean)
  const hasServiceProducts = productNames.some(name => 
    name.includes('servicio') || 
    name.includes('evento') || 
    name.includes('catering') ||
    name.includes('atención')
  )
  
  // Si hay operarios tipo chef pero no hay productos de comida
  const chefs = data.employees.filter(e => 
    e.employee?.employee_type === 'chef' || 
    e.employee?.name?.toLowerCase().includes('chef')
  )
  
  if (chefs.length > 0) {
    const hasFoodProducts = productNames.some(name => 
      name.includes('comida') || 
      name.includes('alimento') || 
      name.includes('bebida') ||
      name.includes('frape') ||
      name.includes('plato') ||
      name.includes('menú')
    )
    
    if (!hasFoodProducts && !hasServiceProducts) {
      errors.push('⚠️ Tiene chefs en la cotización pero no hay productos de alimentos o bebidas')
    }
  }
  
  // Advertencia si hay muchos empleados para pocos productos
  const employeeHours = data.employees.reduce((sum, e) => sum + (e.hours || 0), 0)
  const productQuantity = data.products.reduce((sum, p) => sum + (p.quantity || 0), 0)
  
  if (employeeHours > productQuantity * 5) { // Regla heurística: max 5 horas por producto
    errors.push(`ℹ️ Proporción alta: ${employeeHours}h de trabajo para ${productQuantity} productos. Considere si necesita todos los operarios`)
  }
  
  return { 
    isValid: errors.filter(e => e.startsWith('⚠️')).length === 0, 
    errors 
  }
}

export class PricingService {
  // ARL configuration removed - now handled only through extra costs

  // Configuración de márgenes por categoría
  private static readonly DEFAULT_MARGINS = {
    'social': 25.0,
    'corporativo': 30.0
  }

  /**
   * FIXED - Story 1.4: Calculate employee cost day by day for multiday events
   */
  static calculateEmployeeCostMultiday(input: EmployeePricingInput, dailySchedules: any[]): EmployeePricingResult {
    const { employee, extraCost = 0, extraCostReason } = input
    
    let totalBaseCost = 0
    let totalHours = 0
    let rateTier: '1-4h' | '4-8h' | '8h+' = '1-4h' // Default tier
    
    // Calculate cost for each day individually
    dailySchedules.forEach(daySchedule => {
      if (daySchedule.startTime && daySchedule.endTime) {
        const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
        const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
        
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute
        
        let hoursThisDay = (endMinutes - startMinutes) / 60
        
        // Handle overnight events
        if (hoursThisDay < 0) {
          hoursThisDay += 24
        }
        
        hoursThisDay = Math.max(0.5, hoursThisDay)
        totalHours += hoursThisDay
        
        // Get rate for this specific day's hours
        const rates = employee.category?.default_hourly_rates || employee.hourly_rates
        let hourlyRate = 0
        
        if (Array.isArray(rates)) {
          // New category-based flexible rates (array format)
          const applicableRate = rates.find(rate => 
            hoursThisDay >= rate.min_hours && (rate.max_hours === null || hoursThisDay <= rate.max_hours)
          )
          hourlyRate = applicableRate?.rate || 0
        } else {
          // Legacy individual rates (object format)
          if (hoursThisDay <= 4) {
            hourlyRate = rates?.['1-4h'] || 0
          } else if (hoursThisDay <= 8) {
            hourlyRate = rates?.['4-8h'] || 0
          } else {
            hourlyRate = rates?.['8h+'] || 0
          }
        }
        
        // Add cost for this day
        totalBaseCost += hourlyRate * hoursThisDay
        
        // Update tier to the highest tier used
        if (hoursThisDay > 8) rateTier = '8h+'
        else if (hoursThisDay > 4 && rateTier !== '8h+') rateTier = '4-8h'
      }
    })

    const arlCost = 0 // Always 0 - ARL handled through extraCost field
    const totalCost = totalBaseCost + arlCost + extraCost

    // Use average hourly rate for display purposes
    const avgHourlyRate = totalHours > 0 ? totalBaseCost / totalHours : 0

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_type: employee.employee_type,
      hours: totalHours,
      hourly_rate: avgHourlyRate,
      base_cost: totalBaseCost,
      arl_cost: arlCost,
      extra_cost: extraCost,
      extra_cost_reason: extraCostReason,
      total_cost: totalCost,
      rate_tier: rateTier
    }
  }

  /**
   * Calcula el costo de un empleado basado en escalones horarios
   * FIXED - Story 1.4: Now supports daily_schedules for multiday events
   */
  static calculateEmployeeCost(input: EmployeePricingInput, dailySchedules?: any[]): EmployeePricingResult {
    const { employee, hours, extraCost = 0, extraCostReason } = input
    
    // FIXED - Story 1.4: Calculate day by day for multiday events
    if (dailySchedules && dailySchedules.length > 1) {
      return this.calculateEmployeeCostMultiday(input, dailySchedules)
    }
    
    // Single day calculation (original logic)
    // Determinar el tier de tarifa
    let rateTier: '1-4h' | '4-8h' | '8h+'
    let hourlyRate: number

    // Use category rates if available, otherwise fall back to individual rates
    const rates = employee.category?.default_hourly_rates || employee.hourly_rates
    
    if (Array.isArray(rates)) {
      // New category-based flexible rates (array format)
      const applicableRate = rates.find(rate => 
        hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
      )
      hourlyRate = applicableRate?.rate || 0
      rateTier = hours <= 4 ? '1-4h' : hours <= 8 ? '4-8h' : '8h+'
    } else {
      // Legacy individual rates (object format)
      if (hours <= 4) {
        rateTier = '1-4h'
        hourlyRate = rates?.['1-4h'] || 0
      } else if (hours <= 8) {
        rateTier = '4-8h'
        hourlyRate = rates?.['4-8h'] || 0
      } else {
        rateTier = '8h+'
        hourlyRate = rates?.['8h+'] || 0
      }
    }

    const baseCost = hourlyRate * hours

    // ARL is now handled only through extra costs, not automatically calculated
    const arlCost = 0 // Always 0 - ARL handled through extraCost field

    const totalCost = baseCost + arlCost + extraCost

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_type: employee.employee_type,
      hours,
      hourly_rate: hourlyRate,
      base_cost: baseCost,
      arl_cost: arlCost,
      extra_cost: extraCost,
      extra_cost_reason: extraCostReason,
      total_cost: totalCost,
      rate_tier: rateTier,
      is_available: true // TODO: Validar disponibilidad real
    }
  }

  /**
   * Calcula múltiples empleados
   */
  static calculateMultipleEmployees(inputs: EmployeePricingInput[]): EmployeePricingResult[] {
    return inputs.map(input => this.calculateEmployeeCost(input))
  }


  /**
   * Calcula costo de producto con posibilidad de precio variable y dos tipos de pricing
   * 🤖 ULTRA-INTELIGENTE: Calcula automáticamente medidas faltantes
   */
  static calculateProductCost(input: ProductPricingInput): ProductPricingResult {
    const { product, quantity, measurement_per_unit, custom_price, custom_reason } = input
    
    const isVariable = custom_price !== undefined
    let unitPrice: number
    let totalCost: number
    let calculationBreakdown: string

    if (isVariable) {
      // Precio personalizado/variable
      unitPrice = custom_price!
      totalCost = unitPrice * quantity
      calculationBreakdown = `${quantity} × ${PricingService.formatCurrency(unitPrice)} (precio variable)`
    } else if (product.pricing_type === 'measurement') {
      // Producto por unidad de medida (ej. frappe a $200/onza)
      
      // 🧠 SISTEMA ULTRA-INTELIGENTE: Auto-corrección de medidas
      let actualMeasurementPerUnit = measurement_per_unit
      
      if (!measurement_per_unit || measurement_per_unit <= 0) {
        // Auto-calcular medida inteligente basada en el tipo de producto
        actualMeasurementPerUnit = PricingService.calculateIntelligentMeasurement(product, quantity)
        console.warn(`🤖 Auto-corrección inteligente: Producto "${product.name}" requería medidas. Usando valor inteligente: ${actualMeasurementPerUnit} ${product.unit || 'unidades'} por producto.`)
      }
      
      unitPrice = product.base_price // Precio por unidad de medida
      const totalMeasurement = quantity * (actualMeasurementPerUnit || 1)
      totalCost = totalMeasurement * unitPrice
      
      // Indicar si se usó auto-corrección
      const autoCorrection = measurement_per_unit !== actualMeasurementPerUnit ? ' (auto-calculado)' : ''
      calculationBreakdown = `${quantity} productos × ${actualMeasurementPerUnit} ${product.unit || 'unidades'}${autoCorrection} × ${PricingService.formatCurrency(unitPrice)}/${product.unit || 'unidad'}`
    } else {
      // Producto por unidad fija (ej. 1 hamburguesa = $8000)
      unitPrice = product.base_price
      totalCost = unitPrice * quantity
      calculationBreakdown = `${quantity} × ${PricingService.formatCurrency(unitPrice)}`
    }
    
    // Calcular margen basado en costo
    const costPrice = product.cost_price || 0
    const margin = costPrice > 0 ? ((unitPrice - costPrice) / costPrice) * 100 : 0

    return {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      pricing_type: product.pricing_type,
      quantity,
      measurement_per_unit,
      unit_price: unitPrice,
      total_cost: totalCost,
      margin,
      is_variable: isVariable,
      variable_reason: custom_reason,
      calculation_breakdown: calculationBreakdown
    }
  }

  /**
   * Calcula múltiples productos
   */
  static calculateMultipleProducts(inputs: ProductPricingInput[]): ProductPricingResult[] {
    return inputs.map(input => PricingService.calculateProductCost(input))
  }


  /**
   * Validaciones de pricing
   */
  static validatePricingInput(input: QuotePricingInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // 🚀 PERFORMANCE: Removed debug logging to improve performance

    // Validar empleados
    if (!input.employees || input.employees.length === 0) {
      errors.push('Debe incluir al menos un empleado')
    }

    input.employees.forEach((emp, index) => {
      if (emp.hours <= 0) {
        errors.push(`Empleado ${index + 1}: Las horas deben ser mayor a 0`)
      }
      
      // FIXED - Story 1.4: Allow more than 24h for multiday events
      // Check if this is a multiday event by seeing if there are dailySchedules
      const isMultiDayEvent = input.daily_schedules && input.daily_schedules.length > 1
      
      if (!isMultiDayEvent && emp.hours > 24) {
        // Single-day event: limit to 24h per day
        errors.push(`Empleado ${index + 1}: Las horas por día no pueden exceder 24`)
      } else if (isMultiDayEvent && emp.hours > 168) {
        // Multiday event: allow up to 168h total (7 days × 24h)
        errors.push(`Empleado ${index + 1}: El total de horas no puede exceder 168 (máximo 7 días de 24h)`)
      }
      // Check if employee has rates either from category or individually
      const hasRates = emp.employee.category?.default_hourly_rates || emp.employee.hourly_rates
      if (!hasRates) {
        errors.push(`Empleado ${index + 1}: No tiene tarifas configuradas (ni en categoría ni individuales)`)
      }
    })

    // Validar productos con sistema ultra-inteligente
    input.products.forEach((prod, index) => {
      if (prod.quantity <= 0) {
        errors.push(`Producto ${index + 1}: La cantidad debe ser mayor a 0`)
      }
      if (prod.custom_price !== undefined && prod.custom_price < 0) {
        errors.push(`Producto ${index + 1}: El precio personalizado no puede ser negativo`)
      }
      
      // 🤖 ULTRA-SMART: Auto-corregir productos de medida sin especificar
      if (prod.product.pricing_type === 'measurement') {
        if (!prod.measurement_per_unit || prod.measurement_per_unit <= 0) {
          // Auto-corrigiendo producto sin medidas
          // No agregar error, dejar que el sistema inteligente lo maneje automáticamente
        }
      }
    })

    // Validar márgenes
    if (input.margin_percentage !== undefined) {
      if (input.margin_percentage < 0 || input.margin_percentage > 200) {
        errors.push('El margen debe estar entre 0% y 200%')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 🧠 SISTEMA ULTRA-INTELIGENTE: Cálculo automático de medidas por producto
   * Analiza el nombre del producto y determina medidas apropiadas automáticamente
   */
  static calculateIntelligentMeasurement(product: any, quantity: number): number {
    const productName = product.name?.toLowerCase() || ''
    const productUnit = product.unit?.toLowerCase() || ''
    const category = product.category?.toLowerCase() || ''

    // 🚀 PERFORMANCE: Analyzing product for measurement calculation

    // 🧠 ANÁLISIS DE BEBIDAS (ml, onzas, litros)
    if (productName.includes('frape') || productName.includes('frappe') || 
        productName.includes('smoothie') || productName.includes('malteada')) {
      // Frapés típicos: 12-16 onzas (360-480ml)
      const measurement = productUnit.includes('onz') ? 14 : 420 // 14 onzas o 420ml
      // Bebida fría detectada
      return measurement
    }

    if (productName.includes('café') || productName.includes('capuchino') || 
        productName.includes('latte') || productName.includes('espresso')) {
      // Cafés: 8-12 onzas (240-360ml)
      const measurement = productUnit.includes('onz') ? 10 : 300
      // Café detectado
      return measurement
    }

    if (productName.includes('jugo') || productName.includes('zumo') || 
        productName.includes('naranja') || productName.includes('limón')) {
      // Jugos: 8-12 onzas (240-360ml)
      const measurement = productUnit.includes('onz') ? 10 : 300
      // Juice detected - intelligent measurement applied
      return measurement
    }

    if (productName.includes('cerveza') || productName.includes('beer')) {
      // Cervezas: 12 onzas estándar (355ml)
      const measurement = productUnit.includes('onz') ? 12 : 355
      // Beer detected - intelligent measurement applied
      return measurement
    }

    if (productName.includes('agua') || productName.includes('water')) {
      // Agua embotellada: 16.9 onzas (500ml) estándar
      const measurement = productUnit.includes('onz') ? 16.9 : 500
      // Water detected - intelligent measurement applied
      return measurement
    }

    // 🧠 ANÁLISIS DE COMIDA (gramos, libras, porciones)
    if (productName.includes('torta') || productName.includes('pastel') || 
        productName.includes('cake')) {
      // Porciones de torta: 120-150g por porción
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.3 : 135
      // Cake detected - intelligent measurement applied
      return measurement
    }

    if (productName.includes('sandwich') || productName.includes('hamburguesa') || 
        productName.includes('burger')) {
      // Sandwiches/hamburguesas: 200-300g cada uno
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.55 : 250
      // Sandwich/Burger detected - intelligent measurement applied
      return measurement
    }

    if (productName.includes('pizza')) {
      // Pizza por porción: 120g aproximadamente
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.26 : 120
      // Pizza detected - intelligent measurement applied
      return measurement
    }

    if (productName.includes('ensalada') || productName.includes('salad')) {
      // Ensaladas: 150-200g por porción
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.38 : 175
      // Salad detected - intelligent measurement applied
      return measurement
    }

    // 🧠 ANÁLISIS POR CATEGORÍA
    if (category.includes('bebida') || category.includes('drink') || category.includes('beverage')) {
      // Bebidas genéricas: 12 onzas (355ml)
      const measurement = productUnit.includes('onz') ? 12 : 355
      // Beverage category - intelligent measurement applied
      return measurement
    }

    if (category.includes('comida') || category.includes('food') || category.includes('plato')) {
      // Comidas genéricas: 200g por porción
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.44 : 200
      // Food category - intelligent measurement applied
      return measurement
    }

    if (category.includes('postre') || category.includes('dessert') || category.includes('dulce')) {
      // Postres: 100g por porción
      const measurement = productUnit.includes('lb') || productUnit.includes('libra') ? 0.22 : 100
      // Dessert category - intelligent measurement applied
      return measurement
    }

    // 🧠 ANÁLISIS POR UNIDAD
    if (productUnit.includes('ml') || productUnit.includes('millilitr')) {
      // Para medidas en ml, default 300ml (10 onzas aprox)
      // Liquid unit detected - intelligent measurement applied
      return 300
    }

    if (productUnit.includes('onz') || productUnit.includes('oz')) {
      // Para medidas en onzas, default 10 onzas
      // Ounces unit detected - intelligent measurement applied
      return 10
    }

    if (productUnit.includes('g') || productUnit.includes('gram') || productUnit.includes('gr')) {
      // Para medidas en gramos, default 150g
      // Grams unit detected - intelligent measurement applied
      return 150
    }

    if (productUnit.includes('lb') || productUnit.includes('libra') || productUnit.includes('pound')) {
      // Para medidas en libras, default 0.33 lb (150g)
      // Pounds unit detected - intelligent measurement applied
      return 0.33
    }

    // 🧠 FALLBACK INTELIGENTE
    // Si no puede determinar específicamente, usa valores conservadores basados en la cantidad
    let intelligentDefault = 1
    
    if (quantity <= 5) {
      // Pocas cantidades = productos más grandes (ej. tortas, pizzas grandes)
      intelligentDefault = 500 // 500ml o 500g
    } else if (quantity <= 20) {
      // Cantidad media = productos medianos (ej. hamburguesas, bebidas)
      intelligentDefault = 200 // 200ml o 200g  
    } else {
      // Muchas cantidades = productos pequeños (ej. snacks, muestras)
      intelligentDefault = 50 // 50ml o 50g
    }

    // Intelligent fallback applied
    
    return intelligentDefault
  }

  /**
   * Calcula el costo de transporte basado en la zona, si incluye equipo y la cantidad
   */
  static calculateTransportCost(input: TransportPricingInput, zone: TransportZone): TransportPricingResult {
    const baseCost = zone.base_cost || 0
    const equipmentCost = input.requires_equipment ? (zone.additional_equipment_cost || 0) : 0
    const unitCost = baseCost + equipmentCost
    const transportCount = input.equipment_count || 1
    const totalCost = unitCost * transportCount
    
    return {
      zone_id: zone.id,
      zone_name: zone.name || 'Zona sin nombre',
      base_cost: baseCost,
      equipment_cost: equipmentCost,
      total_transport_cost: totalCost,
      estimated_time_minutes: zone.estimated_travel_time_minutes || 0
    }
  }

  /**
   * Calcula costos de transporte para múltiples zonas
   */
  static calculateMultipleTransportZonesCosts(transportZones: TransportZoneInput[]) {
    const results = []
    
    for (const zoneInput of transportZones) {
      const input: TransportCalculationInput = {
        zone: zoneInput.zone,
        transport_count: zoneInput.transportCount,
        include_equipment: zoneInput.includeEquipmentTransport,
        use_flexible_transport: zoneInput.useFlexibleTransport,
        transport_allocations: zoneInput.transportAllocations,
        selected_product_ids: zoneInput.transportProductIds
      }
      
      const zoneResults = this.calculateTransportCosts(input)
      
      // Agregar información de la zona a cada resultado
      const zoneResultsWithInfo = zoneResults.map(result => ({
        ...result,
        zone_id: zoneInput.zone.id,
        zone_name: zoneInput.zone.name,
        transport_count: zoneInput.transportCount,
        includes_equipment: zoneInput.includeEquipmentTransport
      }))
      
      results.push(...zoneResultsWithInfo)
    }
    
    return results
  }

  /**
   * Calcula el costo total de todas las zonas de transporte
   */
  static calculateTotalTransportCost(transportZones: TransportZoneInput[]) {
    return transportZones.reduce((total, zoneInput) => {
      const costPerTransport = zoneInput.zone.base_cost + 
        (zoneInput.includeEquipmentTransport ? (zoneInput.zone.additional_equipment_cost || 0) : 0)
      return total + (costPerTransport * zoneInput.transportCount)
    }, 0)
  }

  /**
   * Calcula costos de transporte con distribución manual o automática
   */
  static calculateTransportCosts(input: TransportCalculationInput) {
    if (input.use_flexible_transport && input.transport_allocations?.length > 0) {
      return this.calculateManualTransportDistribution(input)
    } else {
      return this.calculateAutomaticTransportDistribution(input)
    }
  }

  /**
   * Calcula distribución manual de transportes por producto
   */
  static calculateManualTransportDistribution(input: TransportCalculationInput) {
    const costPerTransport = input.zone.base_cost + 
      (input.include_equipment ? (input.zone.additional_equipment_cost || 0) : 0)
    
    return input.transport_allocations!.map(allocation => ({
      product_id: allocation.productId,
      quantity: allocation.quantity,
      cost: allocation.quantity * costPerTransport
    }))
  }

  /**
   * Calcula distribución automática (equitativa) de transportes
   */
  static calculateAutomaticTransportDistribution(input: TransportCalculationInput) {
    const costPerTransport = input.zone.base_cost + 
      (input.include_equipment ? (input.zone.additional_equipment_cost || 0) : 0)
    
    const totalCost = input.transport_count * costPerTransport
    const selectedProductCount = input.selected_product_ids?.length || 1
    const costPerProduct = totalCost / selectedProductCount
    const transportPerProduct = input.transport_count / selectedProductCount

    // Si hay productos seleccionados específicamente, distribuir solo entre ellos
    if (input.selected_product_ids?.length) {
      return input.selected_product_ids.map(productId => ({
        product_id: productId,
        quantity: transportPerProduct,
        cost: costPerProduct
      }))
    }

    // Si no hay selección específica, devolver el costo total sin distribución
    return [{
      product_id: null,
      quantity: input.transport_count,
      cost: totalCost
    }]
  }

  /**
   * Calcula el costo de maquinaria propia
   */
  static calculateMachineryCost(input: MachineryPricingInput): MachineryPricingResult {
    const baseCost = input.hours >= 8 ? input.machinery.daily_rate : input.machinery.hourly_rate * input.hours
    const operatorCost = input.includeOperator && input.machinery.operator_hourly_rate 
      ? input.machinery.operator_hourly_rate * input.hours 
      : 0
    const setupCost = input.setupRequired ? (input.machinery.setup_cost || 0) : 0
    const totalCost = baseCost + operatorCost + setupCost

    return {
      machinery_id: input.machinery.id,
      machinery_name: input.machinery.name,
      hours: input.hours,
      base_cost: baseCost,
      operator_cost: operatorCost,
      setup_cost: setupCost,
      total_cost: totalCost
    }
  }

  /**
   * Calcula el costo de alquiler de maquinaria
   */
  static calculateMachineryRentalCost(input: MachineryRentalPricingInput): MachineryRentalPricingResult {
    // Si hay costo personalizado, usarlo directamente
    if (input.isCustomCost && input.customTotalCost !== undefined) {
      return {
        rental_id: input.machineryRental.id,
        machinery_name: input.machineryRental.machinery_name || input.machineryRental.name,
        hours: input.hours,
        base_cost: input.customTotalCost, // Mostrar el costo editado como base
        operator_cost: 0,
        setup_cost: 0,
        delivery_cost: 0,
        pickup_cost: 0,
        total_cost: input.customTotalCost
      }
    }

    // Cálculo estándar
    const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
    const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
      ? input.machineryRental.operator_cost * input.hours 
      : 0
    const setupCost = input.machineryRental.setup_cost || 0
    const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
    const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
    const totalCost = baseCost + operatorCost + setupCost + deliveryCost + pickupCost

    return {
      rental_id: input.machineryRental.id,
      machinery_name: input.machineryRental.machinery_name || input.machineryRental.name,
      hours: input.hours,
      base_cost: baseCost,
      operator_cost: operatorCost,
      setup_cost: setupCost,
      delivery_cost: deliveryCost,
      pickup_cost: pickupCost,
      total_cost: totalCost
    }
  }

  /**
   * Calcula el costo de subcontratación de eventos
   */
  static calculateEventSubcontractCost(input: EventSubcontractPricingInput): EventSubcontractPricingResult {
    const totalCost = input.customSuePrice || input.eventSubcontract.sue_price

    return {
      subcontract_id: input.eventSubcontract.id,
      service_name: input.eventSubcontract.service_name,
      supplier_cost: 0, // Not tracking supplier cost in this context
      sue_price: input.customSuePrice || input.eventSubcontract.sue_price,
      total_cost: totalCost
    }
  }

  /**
   * Calcula el costo de elementos desechables
   */
  static calculateDisposableItemCost(input: DisposableItemPricingInput): DisposableItemPricingResult {
    // Si hay costo total personalizado, usarlo directamente
    if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
      return {
        item_id: input.disposableItem.id,
        item_name: input.disposableItem.name,
        quantity: input.quantity,
        unit_price: input.quantity > 0 ? input.customTotalCost / input.quantity : input.customTotalCost, // Calcular precio unitario equivalente
        total_cost: input.customTotalCost
      }
    }

    // Cálculo estándar
    const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
    const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
    const totalCost = unitPrice * actualQuantity

    return {
      item_id: input.disposableItem.id,
      item_name: input.disposableItem.name,
      quantity: actualQuantity,
      unit_price: unitPrice,
      total_cost: totalCost
    }
  }

  /**
   * Calcula el total de una cotización completa
   */
  static calculateQuoteTotal(input: QuotePricingInput): QuotePricingResult {
    // Calcular empleados
    const employees = input.employees.map(emp => this.calculateEmployeeCost(emp, input.daily_schedules))
    const employeesSubtotal = employees.reduce((sum, emp) => sum + emp.total_cost, 0)

    // Calcular productos
    const products = input.products.map(prod => this.calculateProductCost(prod))
    const productsSubtotal = products.reduce((sum, prod) => sum + prod.total_cost, 0)

    // Calcular maquinaria propia
    const machinery = (input.machinery || []).map(mach => this.calculateMachineryCost(mach))
    const machinerySubtotal = machinery.reduce((sum, mach) => sum + mach.total_cost, 0)

    // Calcular alquiler de maquinaria
    const machineryRentals = (input.machineryRentals || []).map(rental => this.calculateMachineryRentalCost(rental))
    const machineryRentalSubtotal = machineryRentals.reduce((sum, rental) => sum + rental.total_cost, 0)

    // Calcular subcontratación
    const eventSubcontracts = (input.eventSubcontracts || []).map(sub => this.calculateEventSubcontractCost(sub))
    const subcontractSubtotal = eventSubcontracts.reduce((sum, sub) => sum + sub.total_cost, 0)

    // Calcular elementos desechables
    const disposableItems = (input.disposableItems || []).map(item => this.calculateDisposableItemCost(item))
    const disposableSubtotal = disposableItems.reduce((sum, item) => sum + item.total_cost, 0)

    // Calcular transporte
    let transport: TransportPricingResult | undefined
    let transportSubtotal = 0
    if (input.transport) {
      // Para calcular transporte necesitamos la zona - esto se hará en el hook
      transportSubtotal = 0 // Se calculará en el hook useTransportPricing
    }

    // Subtotal
    const subtotal = employeesSubtotal + productsSubtotal + machinerySubtotal + machineryRentalSubtotal + subcontractSubtotal + disposableSubtotal + transportSubtotal

    // Margen
    const marginPercentage = input.margin_percentage ?? this.DEFAULT_MARGINS[input.client.type] ?? 25
    const marginAmount = subtotal * (marginPercentage / 100)

    // Retención de impuestos - aplicar si está habilitada manualmente con valor personalizado
    const taxRetentionPercentage = input.enable_retention ? (input.retention_percentage || 4) : 0
    const taxRetentionAmount = (subtotal + marginAmount) * (taxRetentionPercentage / 100)

    // Total final
    const totalCost = subtotal + marginAmount - taxRetentionAmount

    // Términos de pago
    const paymentTerms = {
      days: input.client.type === 'corporativo' ? 30 : 15,
      requires_advance: totalCost > 500000,
      advance_percentage: totalCost > 500000 ? 50 : 0
    }

    return {
      employees,
      products,
      machinery,
      machineryRentals: machineryRentals,
      eventSubcontracts: eventSubcontracts,
      disposableItems: disposableItems,
      transport,
      employees_subtotal: employeesSubtotal,
      products_subtotal: productsSubtotal,
      machinery_subtotal: machinerySubtotal,
      machinery_rental_subtotal: machineryRentalSubtotal,
      subcontract_subtotal: subcontractSubtotal,
      disposable_subtotal: disposableSubtotal,
      transport_subtotal: transportSubtotal,
      subtotal,
      margin_percentage: marginPercentage,
      margin_amount: marginAmount,
      tax_retention_percentage: taxRetentionPercentage,
      tax_retention_amount: taxRetentionAmount,
      total_cost: totalCost,
      client_type: input.client.type,
      payment_terms: paymentTerms
    }
  }

  /**
   * Utilidades de formateo
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  static formatPercentage(percentage: number): string {
    return `${percentage.toFixed(1)}%`
  }

  /**
   * Generar resumen de cotización
   */
  static generateQuoteSummary(result: QuotePricingResult): string {
    const lines = [
      `=== RESUMEN DE COTIZACIÓN ===`,
      `Cliente: ${result.client_type}`,
      ``,
      `EMPLEADOS (${result.employees.length}):`,
      ...result.employees.map(emp => 
        `  ${emp.employee_name} (${emp.employee_type}): ${emp.hours}h x ${this.formatCurrency(emp.hourly_rate)} = ${this.formatCurrency(emp.total_cost)}`
      ),
      `  Subtotal Empleados: ${this.formatCurrency(result.employees_subtotal)}`,
      ``,
      `PRODUCTOS (${result.products.length}):`,
      ...result.products.map(prod => 
        `  ${prod.product_name}: ${prod.quantity} x ${this.formatCurrency(prod.unit_price)} = ${this.formatCurrency(prod.total_cost)}`
      ),
      `  Subtotal Productos: ${this.formatCurrency(result.products_subtotal)}`,
      ``
    ]

    if (result.transport) {
      lines.push(
        `TRANSPORTE:`,
        `  ${result.transport.zone_name}: ${this.formatCurrency(result.transport.total_transport_cost)}`,
        ``
      )
    }

    lines.push(
      `TOTALES:`,
      `  Subtotal: ${this.formatCurrency(result.subtotal)}`,
      `  Margen ${this.formatPercentage(result.margin_percentage)}: ${this.formatCurrency(result.margin_amount)}`,
      ...(result.tax_retention_percentage > 0 
        ? [`  Retención ${this.formatPercentage(result.tax_retention_percentage)}: -${this.formatCurrency(result.tax_retention_amount)}`]
        : []),
      `  TOTAL FINAL: ${this.formatCurrency(result.total_cost)}`,
      ``,
      `TÉRMINOS DE PAGO:`,
      `  Plazo: ${result.payment_terms.days} días`,
      ...(result.payment_terms.requires_advance 
        ? [`  Anticipo: ${this.formatPercentage(result.payment_terms.advance_percentage)}`]
        : ['  Sin anticipo requerido'])
    )

    return lines.join('\n')
  }
}

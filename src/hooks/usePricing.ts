import { useMemo } from 'react'
import { 
  PricingService, 
  EmployeePricingInput, 
  ProductPricingInput, 
  MachineryPricingInput,
  EventSubcontractPricingInput,
  TransportPricingInput, 
  QuotePricingInput,
  EmployeePricingResult,
  ProductPricingResult,
  MachineryPricingResult,
  MachineryRentalPricingResult,
  EventSubcontractPricingResult,
  QuotePricingResult
} from '../services/pricing.service'
import { TransportZoneInput } from '../components/pricing/types'
import { useActiveTransportZones } from './useTransport'
import { Employee, Product } from '../types'

// Hook principal para cálculo de empleados
export const useEmployeePricing = (inputs: EmployeePricingInput[]) => {
  return useMemo(() => {
    if (!inputs || inputs.length === 0) {
      return {
        results: [] as EmployeePricingResult[],
        total_cost: 0,
        total_hours: 0,
        average_rate: 0
      }
    }

    const results = PricingService.calculateMultipleEmployees(inputs)
    const totalCost = results.reduce((sum, result) => sum + result.total_cost, 0)
    const totalHours = results.reduce((sum, result) => sum + result.hours, 0)
    const averageRate = totalHours > 0 ? totalCost / totalHours : 0

    return {
      results,
      total_cost: totalCost,
      total_hours: totalHours,
      average_rate: averageRate
    }
  }, [inputs])
}

// Hook para cálculo de productos
export const useProductPricing = (inputs: ProductPricingInput[]) => {
  return useMemo(() => {
    if (!inputs || inputs.length === 0) {
      return {
        results: [] as ProductPricingResult[],
        total_cost: 0,
        total_quantity: 0,
        variable_products_count: 0
      }
    }

    const results = PricingService.calculateMultipleProducts(inputs)
    const totalCost = results.reduce((sum, result) => sum + result.total_cost, 0)
    const totalQuantity = results.reduce((sum, result) => sum + result.quantity, 0)
    const variableProductsCount = results.filter(r => r.is_variable).length

    return {
      results,
      total_cost: totalCost,
      total_quantity: totalQuantity,
      variable_products_count: variableProductsCount
    }
  }, [inputs])
}

// Hook para cálculo de transporte con datos reales
export const useTransportPricing = (input?: TransportPricingInput) => {
  const { data: zones = [] } = useActiveTransportZones()

  return useMemo(() => {
    if (!input || !input.zone_id) {
      return {
        result: null,
        is_available: false,
        error: null
      }
    }

    const zone = zones.find(z => z.id === input.zone_id)
    
    if (!zone) {
      return {
        result: null,
        is_available: false,
        error: 'Zona de transporte no encontrada'
      }
    }

    const result = PricingService.calculateTransportCost(input, zone)

    return {
      result,
      is_available: true,
      error: null
    }
  }, [input, zones])
}

// Hook principal para cálculo completo de cotización
export const useQuotePricing = (input?: QuotePricingInput) => {
  const { data: zones = [] } = useActiveTransportZones()

  return useMemo(() => {
    if (!input) {
      return {
        result: null,
        is_valid: false,
        errors: ['Datos de cotización no proporcionados'],
        summary: ''
      }
    }

    // Validar entrada
    const validation = PricingService.validatePricingInput(input)
    if (!validation.isValid) {
      return {
        result: null,
        is_valid: false,
        errors: validation.errors,
        summary: ''
      }
    }

    // Verificar que las zonas de transporte existan si se especifican
    if (input.transportZones && input.transportZones.length > 0) {
      const invalidZones = input.transportZones.filter(zoneInput => 
        !zones.find(z => z.id === zoneInput.zone.id)
      )
      if (invalidZones.length > 0) {
        return {
          result: null,
          is_valid: false,
          errors: [`Zonas de transporte no encontradas: ${invalidZones.map(z => z.zone.name).join(', ')}`],
          summary: ''
        }
      }
    } else if (input.transport && input.transport.zone_id) {
      // Mantener compatibilidad con implementación anterior
      const zone = zones.find(z => z.id === input.transport!.zone_id)
      if (!zone) {
        return {
          result: null,
          is_valid: false,
          errors: ['Zona de transporte no encontrada'],
          summary: ''
        }
      }
    }

    // Calcular cotización
    let result = PricingService.calculateQuoteTotal(input)
    
    // 🔥 NEW: Cálculo de múltiples zonas de transporte
    let totalTransportCost = 0
    let multipleTransportResults: any[] = []
    
    if (input.transportZones && input.transportZones.length > 0) {
      // Usar el nuevo método para múltiples zonas
      multipleTransportResults = PricingService.calculateMultipleTransportZonesCosts(input.transportZones)
      totalTransportCost = PricingService.calculateTotalTransportCost(input.transportZones)
      
    } else if (input.transport && input.transport.zone_id) {
      // Mantener compatibilidad con implementación anterior
      const zone = zones.find(z => z.id === input.transport!.zone_id)
      
      if (zone) {
        // 🔥 NEW: Construir TransportCalculationInput para distribución manual
        const transportCalculationInput = {
          zone,
          transport_count: input.transport.equipment_count || 1,
          include_equipment: input.transport.requires_equipment || false,
          use_flexible_transport: input.use_flexible_transport || false,
          transport_allocations: input.transport_allocations || [],
          selected_product_ids: input.transport_product_ids || []
        }
        
        // 🔥 NEW: Usar calculateTransportCosts que maneja distribución manual
        const transportDistribution = PricingService.calculateTransportCosts(transportCalculationInput)
        
        // Calcular costo total de transporte sumando todas las distribuciones
        totalTransportCost = transportDistribution.reduce((sum, dist) => sum + (dist.cost || 0), 0)
        
        // Crear resultado de transporte compatible con interfaz existente
        const transportResult = {
          zone_id: zone.id,
          zone_name: zone.name || 'Zona sin nombre',
          base_cost: zone.base_cost || 0,
          equipment_cost: input.transport.requires_equipment ? (zone.additional_equipment_cost || 0) : 0,
          total_transport_cost: totalTransportCost,
          estimated_time_minutes: zone.estimated_travel_time_minutes || 0,
          // 🔥 NEW: Agregar distribución detallada para PDF
          distribution: transportDistribution
        }
        
        multipleTransportResults = [transportResult]
      }
    }
    
    // Aplicar cálculo de transporte si hay algún resultado
    if (totalTransportCost > 0) {
      // Recalcular totales con transporte
      const subtotalWithTransport = result.employees_subtotal + result.products_subtotal + 
        (result.machinery_subtotal || 0) + (result.machinery_rental_subtotal || 0) + 
        (result.subcontract_subtotal || 0) + (result.disposable_subtotal || 0) + 
        totalTransportCost
      const marginAmount = subtotalWithTransport * (result.margin_percentage / 100)
      // 🤖 ULTRATHINK FIX: Respetar el flag enable_retention al recalcular con transporte
      const taxRetentionPercentage = input.enable_retention ? (input.retention_percentage ?? 4) : 0
      const taxRetentionAmount = (subtotalWithTransport + marginAmount) * (taxRetentionPercentage / 100)
      const totalCostWithTransport = subtotalWithTransport + marginAmount - taxRetentionAmount
      
      result = {
        ...result,
        transport: multipleTransportResults[0], // Para compatibilidad
        multipleTransportZones: multipleTransportResults, // Nueva propiedad
        transport_subtotal: totalTransportCost,
        subtotal: subtotalWithTransport,
        margin_amount: marginAmount,
        tax_retention_percentage: taxRetentionPercentage,
        tax_retention_amount: taxRetentionAmount,
        total_cost: totalCostWithTransport
      }
    }
    
    const summary = PricingService.generateQuoteSummary(result)

    return {
      result,
      is_valid: true,
      errors: [],
      summary
    }
  }, [input, zones])
}

// Hook para validaciones en tiempo real
export const usePricingValidation = () => {
  const validateEmployeeInput = (employee: Employee, hours: number, isMultiDayTotal?: boolean): string[] => {
    const errors: string[] = []

    if (hours <= 0) {
      errors.push('Las horas deben ser mayor a 0')
    }
    
    // For multiday events, allow more than 24h total (e.g., 12h × 3 days = 36h total)
    // Only limit individual day hours to 24h maximum
    if (!isMultiDayTotal && hours > 24) {
      errors.push('Las horas por día no pueden exceder 24')
    } else if (isMultiDayTotal && hours > 168) {
      // Reasonable total limit: 24h × 7 days = 168h maximum for multiday events
      errors.push('El total de horas no puede exceder 168 (máximo 7 días de 24h)')
    }
    // Check if employee has rates either from category or individually
    const hasRates = employee.category?.default_hourly_rates || employee.hourly_rates
    if (!hasRates || (typeof hasRates === 'object' && !Array.isArray(hasRates) && Object.keys(hasRates).length === 0)) {
      errors.push('El empleado no tiene tarifas configuradas')
    }

    return errors
  }

  const validateProductInput = (product: Product, quantity: number, customPrice?: number): string[] => {
    const errors: string[] = []

    if (quantity <= 0) {
      errors.push('La cantidad debe ser mayor a 0')
    }
    if (customPrice !== undefined && customPrice < 0) {
      errors.push('El precio personalizado no puede ser negativo')
    }
    if (!product.is_active) {
      errors.push('El producto no está activo')
    }

    return errors
  }

  const validateMargin = (margin: number): string[] => {
    const errors: string[] = []

    if (margin < 0) {
      errors.push('El margen no puede ser negativo')
    }
    if (margin > 200) {
      errors.push('El margen no puede exceder 200%')
    }

    return errors
  }

  return {
    validateEmployeeInput,
    validateProductInput,
    validateMargin
  }
}

// Hook para comparación de cotizaciones
export const useQuoteComparison = (quotes: QuotePricingResult[]) => {
  return useMemo(() => {
    if (quotes.length === 0) {
      return {
        cheapest: null,
        most_expensive: null,
        average_cost: 0,
        cost_difference: 0
      }
    }

    const sortedByPrice = [...quotes].sort((a, b) => a.total_cost - b.total_cost)
    const cheapest = sortedByPrice[0]
    const mostExpensive = sortedByPrice[sortedByPrice.length - 1]
    const averageCost = quotes.reduce((sum, quote) => sum + quote.total_cost, 0) / quotes.length
    const costDifference = mostExpensive.total_cost - cheapest.total_cost

    return {
      cheapest,
      most_expensive: mostExpensive,
      average_cost: averageCost,
      cost_difference: costDifference
    }
  }, [quotes])
}

// Hook para sugerencias de optimización
export const usePricingOptimization = (result?: QuotePricingResult) => {
  return useMemo(() => {
    if (!result) return { suggestions: [] }

    const suggestions: string[] = []

    // Verificar margen alto
    if (result.margin_percentage > 50) {
      suggestions.push(`Margen muy alto (${result.margin_percentage.toFixed(1)}%). Considera reducirlo para ser más competitivo.`)
    }

    // Verificar margen bajo
    if (result.margin_percentage < 15) {
      suggestions.push(`Margen bajo (${result.margin_percentage.toFixed(1)}%). Considera aumentarlo para mejorar rentabilidad.`)
    }

    // Verificar costos de empleados altos
    const employeeCostPercentage = (result.employees_subtotal / result.subtotal) * 100
    if (employeeCostPercentage > 70) {
      suggestions.push(`Los costos de empleados representan ${employeeCostPercentage.toFixed(1)}% del total. Considera optimizar el equipo.`)
    }

    // Verificar costos de transporte altos
    if (result.transport_subtotal > 0) {
      const transportPercentage = (result.transport_subtotal / result.subtotal) * 100
      if (transportPercentage > 20) {
        suggestions.push(`Los costos de transporte son altos (${transportPercentage.toFixed(1)}%). Considera una zona más cercana.`)
      }
    }

    // Sugerencias para clientes corporativos
    if (result.client_type === 'corporativo') {
      if (result.margin_percentage < 25) {
        suggestions.push('Para clientes corporativos, considera un margen mínimo del 25%.')
      }
    }

    return { suggestions }
  }, [result])
}

// Hook para formateo de precios
export const usePricingFormat = () => {
  const formatCurrency = (amount: number): string => {
    return PricingService.formatCurrency(amount)
  }

  const formatPercentage = (percentage: number): string => {
    return PricingService.formatPercentage(percentage)
  }

  const formatHours = (hours: number): string => {
    if (hours === 1) return '1 hora'
    if (hours < 1) return `${Math.round(hours * 60)} min`
    return `${hours} horas`
  }

  const formatRate = (rate: number): string => {
    return `${formatCurrency(rate)}/hora`
  }

  return {
    formatCurrency,
    formatPercentage,
    formatHours,
    formatRate
  }
}

// Hook para cálculos rápidos sin cotización completa
export const useQuickPricing = () => {
  const calculateEmployeeCost = (employee: Employee, hours: number): number => {
    const result = PricingService.calculateEmployeeCost({
      employee,
      hours,
      includeARL: true
    })
    return result.total_cost
  }

  const calculateProductCost = (product: Product, quantity: number, customPrice?: number): number => {
    const result = PricingService.calculateProductCost({
      product,
      quantity,
      custom_price: customPrice
    })
    return result.total_cost
  }

  const estimateQuoteTotal = (
    employeeCosts: number[],
    productCosts: number[],
    transportCost: number = 0,
    marginPercentage: number = 30,
    isCorpotativo: boolean = false
  ): number => {
    const subtotal = [...employeeCosts, ...productCosts, transportCost].reduce((sum, cost) => sum + cost, 0)
    const margin = subtotal * (marginPercentage / 100)
    const retention = isCorpotativo ? subtotal * 0.04 : 0
    return subtotal + margin - retention
  }

  return {
    calculateEmployeeCost,
    calculateProductCost,
    estimateQuoteTotal
  }
}
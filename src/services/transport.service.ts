import { supabase } from './supabase'
import { TransportZone, CreateTransportZoneData, UpdateTransportZoneData, TransportFilters } from '../types'

export class TransportService {
  static async getAll(filters?: TransportFilters): Promise<TransportZone[]> {
    let query = supabase
      .from('transport_zones')
      .select('*')
      .order('base_cost')

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, description.ilike.%${filters.search}%`)
    }

    if (filters?.max_cost) {
      query = query.lte('base_cost', filters.max_cost)
    }

    if (filters?.max_travel_time) {
      query = query.lte('estimated_travel_time_minutes', filters.max_travel_time)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<TransportZone> {
    const { data, error } = await supabase
      .from('transport_zones')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(zoneData: CreateTransportZoneData): Promise<TransportZone> {
    const { data, error } = await supabase
      .from('transport_zones')
      .insert({
        ...zoneData,
        additional_equipment_cost: zoneData.additional_equipment_cost || 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: number, zoneData: UpdateTransportZoneData): Promise<TransportZone> {
    const { data, error } = await supabase
      .from('transport_zones')
      .update(zoneData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('transport_zones')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getActive(): Promise<TransportZone[]> {
    return this.getAll({ is_active: true })
  }

  static async calculateCost(
    zoneId: number, 
    requiresEquipment: boolean = false, 
    equipmentCount: number = 1
  ): Promise<{
    zone: TransportZone
    base_cost: number
    equipment_cost: number
    total_cost: number
  }> {
    const zone = await this.getById(zoneId)
    
    const baseCost = zone.base_cost
    const equipmentCost = requiresEquipment 
      ? zone.additional_equipment_cost * equipmentCount 
      : 0
    const totalCost = baseCost + equipmentCost

    return {
      zone,
      base_cost: baseCost,
      equipment_cost: equipmentCost,
      total_cost: totalCost
    }
  }

  static async getZonesByDistance(): Promise<TransportZone[]> {
    const { data, error } = await supabase
      .from('transport_zones')
      .select('*')
      .eq('is_active', true)
      .order('estimated_travel_time_minutes', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async getZonesByCost(): Promise<TransportZone[]> {
    const { data, error } = await supabase
      .from('transport_zones')
      .select('*')
      .eq('is_active', true)
      .order('base_cost', { ascending: true })

    if (error) throw error
    return data || []
  }

  // Validaciones específicas
  static validateZoneData(data: CreateTransportZoneData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre de la zona debe tener al menos 2 caracteres')
    }

    if (data.base_cost <= 0) {
      errors.push('El costo base debe ser mayor a 0')
    }

    if (data.base_cost > 1000000) {
      errors.push('El costo base no puede exceder $1,000,000')
    }

    if (data.additional_equipment_cost && data.additional_equipment_cost < 0) {
      errors.push('El costo adicional de equipos no puede ser negativo')
    }

    if (data.estimated_travel_time_minutes && data.estimated_travel_time_minutes <= 0) {
      errors.push('El tiempo estimado debe ser mayor a 0')
    }

    if (data.estimated_travel_time_minutes && data.estimated_travel_time_minutes > 600) {
      errors.push('El tiempo estimado no puede exceder 10 horas (600 minutos)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Utilidades de cálculo
  static calculateDistanceBasedCost(
    baseZone: TransportZone,
    distanceMultiplier: number = 1
  ): number {
    return Math.round(baseZone.base_cost * distanceMultiplier)
  }

  static estimateTimeWithTraffic(
    baseTimeMinutes: number,
    trafficFactor: number = 1.3 // 30% adicional por tráfico
  ): number {
    return Math.round(baseTimeMinutes * trafficFactor)
  }

  static formatTravelTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`
  }

  // Buscar zona más cercana por costo
  static findOptimalZone(
    zones: TransportZone[],
    maxBudget?: number,
    maxTime?: number
  ): TransportZone | null {
    let filteredZones = zones.filter(zone => zone.is_active)

    if (maxBudget) {
      filteredZones = filteredZones.filter(zone => zone.base_cost <= maxBudget)
    }

    if (maxTime) {
      filteredZones = filteredZones.filter(zone => 
        !zone.estimated_travel_time_minutes || zone.estimated_travel_time_minutes <= maxTime
      )
    }

    if (filteredZones.length === 0) return null

    // Retornar la zona con mejor relación costo/tiempo
    return filteredZones.reduce((best, current) => {
      const bestScore = best.base_cost + (best.estimated_travel_time_minutes || 0) * 100
      const currentScore = current.base_cost + (current.estimated_travel_time_minutes || 0) * 100
      return currentScore < bestScore ? current : best
    })
  }

  // Generar reporte de costos por zona
  static generateCostReport(zones: TransportZone[]): {
    total_zones: number
    average_cost: number
    min_cost: number
    max_cost: number
    average_time: number
    zones_by_cost: TransportZone[]
  } {
    const activezones = zones.filter(z => z.is_active)
    
    if (activezones.length === 0) {
      return {
        total_zones: 0,
        average_cost: 0,
        min_cost: 0,
        max_cost: 0,
        average_time: 0,
        zones_by_cost: []
      }
    }

    const costs = activezones.map(z => z.base_cost)
    const times = activezones
      .filter(z => z.estimated_travel_time_minutes)
      .map(z => z.estimated_travel_time_minutes!)

    return {
      total_zones: activezones.length,
      average_cost: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
      min_cost: Math.min(...costs),
      max_cost: Math.max(...costs),
      average_time: times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0,
      zones_by_cost: [...activezones].sort((a, b) => a.base_cost - b.base_cost)
    }
  }
}
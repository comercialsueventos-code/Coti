import { supabase } from './supabase'
import { Employee, HourlyRateRange } from '../types'

export interface CreateEmployeeData {
  name: string
  employee_type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'
  category_id?: number
  phone?: string
  email?: string
  identification_number?: string
  address?: string
  has_arl?: boolean
  arl_provider?: string
  certifications?: string[]
}

export interface UpdateEmployeeData extends Partial<CreateEmployeeData> {
  is_active?: boolean
}

export interface EmployeeFilters {
  employee_type?: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'
  category_id?: number
  is_active?: boolean
  has_arl?: boolean
  search?: string
}

export class EmployeesService {
  static async getAll(filters?: EmployeeFilters): Promise<Employee[]> {
    let query = supabase
      .from('employees')
      .select(`
        *,
        category:employee_categories(
          id,
          name,
          icon,
          color,
          description,
          default_hourly_rates
        )
      `)
      .order('name')

    // Default to only active employees unless explicitly requested otherwise
    const isActiveFilter = filters?.is_active !== undefined ? filters.is_active : true
    query = query.eq('is_active', isActiveFilter)

    if (filters?.employee_type) {
      query = query.eq('employee_type', filters.employee_type)
    }

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }

    if (filters?.has_arl !== undefined) {
      query = query.eq('has_arl', filters.has_arl)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, email.ilike.%${filters.search}%, identification_number.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        category:employee_categories(
          id,
          name,
          icon,
          color,
          description,
          default_hourly_rates
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(employeeData: CreateEmployeeData): Promise<Employee> {
    const processedData = {
      ...employeeData,
      has_arl: employeeData.has_arl ?? true, // Default to true
      is_active: true,
      // Employee creation without hourly rates
      ...({})
    }

    const { data, error } = await supabase
      .from('employees')
      .insert(processedData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: number, employeeData: UpdateEmployeeData): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<void> {
    // Use soft delete instead of hard delete to avoid foreign key conflicts
    const { error } = await supabase
      .from('employees')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error
  }

  static async getByType(type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        category:employee_categories(
          id,
          name,
          icon,
          color,
          description,
          default_hourly_rates
        )
      `)
      .eq('employee_type', type)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        category:employee_categories(
          id,
          name,
          icon,
          color,
          description,
          default_hourly_rates
        )
      `)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async search(searchTerm: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        category:employee_categories(
          id,
          name,
          icon,
          color,
          description,
          default_hourly_rates
        )
      `)
      .or(`name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%, identification_number.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name')
      .limit(10)

    if (error) throw error
    return data || []
  }

  // Validation helpers
  static validateEmployeeData(data: CreateEmployeeData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    if (!data.employee_type) {
      errors.push('El tipo de empleado es requerido')
    }

    // Hourly rates validation removed - now handled by categories
    // If category_id is provided, rates will come from the category

    // Use explicit class reference to avoid lost `this` context when method is passed as a callback
    if (data.email && !EmployeesService.validateEmail(data.email)) {
      errors.push('Email inválido')
    }

    // Use explicit class reference to avoid lost `this` context when method is passed as a callback
    if (data.phone && !EmployeesService.validatePhone(data.phone)) {
      errors.push('Formato de teléfono inválido (+57 300 123 4567)')
    }

    if (data.identification_number && data.identification_number.length < 6) {
      errors.push('El número de identificación debe tener al menos 6 caracteres')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhone(phone: string): boolean {
    // Colombian phone number validation - flexible format
    if (!phone) return false
    
    // Remove all non-digits and check if it starts with 57
    const digitsOnly = phone.replace(/\D/g, '')
    
    // Should be 57 + 10 digits (Colombian mobile) or 57 + 7 digits (landline)
    if (digitsOnly.startsWith('57')) {
      const numberPart = digitsOnly.substring(2)
      return numberPart.length === 10 || numberPart.length === 7
    }
    
    // Alternative: just Colombian mobile/landline without country code
    return digitsOnly.length === 10 || digitsOnly.length === 7
  }

  // Business logic helpers
  static calculateAverageRate(hourlyRates: Record<string, number> | HourlyRateRange[] | null | undefined): number {
    if (!hourlyRates) return 0
    
    if (Array.isArray(hourlyRates)) {
      // New array format
      const rates = hourlyRates.map(r => r.rate).filter(r => r > 0)
      return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0
    } else {
      // Legacy object format
      const rates = Object.values(hourlyRates).filter(r => r > 0)
      return rates.length > 0 ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0
    }
  }

  static getEmployeeTypeDisplayName(type: string): string {
    const types = {
      'operario': 'Operario',
      'chef': 'Chef',
      'mesero': 'Mesero',
      'supervisor': 'Supervisor',
      'conductor': 'Conductor'
    }
    return types[type as keyof typeof types] || type
  }

  static getEmployeeTypeIcon(type: string): string {
    const icons = {
      'operario': '🔧',
      'chef': '👨‍🍳',
      'mesero': '🍽️',
      'supervisor': '👔',
      'conductor': '🚐'
    }
    return icons[type as keyof typeof icons] || '👤'
  }

  static formatHourlyRate(rate: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(rate) + '/hora'
  }

  static formatPhoneNumber(phone: string): string {
    if (!phone) return ''
    // Format Colombian phone numbers: +57 300 123 4567
    return phone.replace(/(\+57)(\d{3})(\d{3})(\d{4})/, '$1 $2 $3 $4')
  }

  // Availability and scheduling helpers
  static async getEmployeeAvailability(employeeId: number, date: string): Promise<{
    is_available: boolean
    shifts: any[]
    conflicts: any[]
  }> {
    // Check employee shifts for the date
    const { data: shifts, error } = await supabase
      .from('employee_shifts')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', date)

    if (error) throw error

    const isAvailable = !shifts || shifts.length === 0 || shifts.every(shift => shift.status === 'available')
    const conflicts = shifts ? shifts.filter(shift => shift.status !== 'available') : []

    return {
      is_available: isAvailable,
      shifts: shifts || [],
      conflicts
    }
  }

  static async getEmployeesByAvailability(date: string, shiftType?: 'morning' | 'afternoon' | 'full_day'): Promise<{
    available: Employee[]
    unavailable: Employee[]
  }> {
    // Get all active employees
    const employees = await this.getActive()
    
    // Check availability for each employee
    const availabilityPromises = employees.map(async (employee) => {
      const availability = await this.getEmployeeAvailability(employee.id, date)
      return {
        employee,
        is_available: availability.is_available
      }
    })

    const results = await Promise.all(availabilityPromises)
    
    return {
      available: results.filter(r => r.is_available).map(r => r.employee),
      unavailable: results.filter(r => !r.is_available).map(r => r.employee)
    }
  }

  // Helper function to get rate for specific hours, checking both individual and category rates
  private static getEmployeeRateForHours(employee: Employee, hours: number): number {
    // First try category rates (new system)
    if (employee.category?.default_hourly_rates) {
      const applicableRate = employee.category.default_hourly_rates.find(rate => 
        hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
      )
      if (applicableRate) return applicableRate.rate
    }
    
    // Legacy individual rates removed - now using categories only
    
    return 0
  }

  // Statistics and reports
  static generateEmployeeReport(employees: Employee[]): {
    total_employees: number
    by_type: Record<string, number>
    with_arl: number
    average_rate_4_8h: number
    active_employees: number
  } {
    const activeEmployees = employees.filter(e => e.is_active)
    
    const byType = employees.reduce((acc, emp) => {
      acc[emp.employee_type] = (acc[emp.employee_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const withArl = employees.filter(e => e.has_arl).length
    
    // Get 4-8h rates using the helper function
    const rates4to8h = employees
      .map(e => this.getEmployeeRateForHours(e, 6)) // Use 6 hours as representative of 4-8h tier
      .filter(rate => rate && rate > 0)
    
    const averageRate = rates4to8h.length > 0 
      ? rates4to8h.reduce((sum, rate) => sum + rate, 0) / rates4to8h.length
      : 0

    return {
      total_employees: employees.length,
      by_type: byType,
      with_arl: withArl,
      average_rate_4_8h: averageRate,
      active_employees: activeEmployees.length
    }
  }

  // Default values for new employees
  static getDefaultValues(employeeType: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'): Partial<CreateEmployeeData> {
    const defaultRates = {
      'operario': { '1-4h': 10000, '4-8h': 8000, '8h+': 6000 },
      'chef': { '1-4h': 15000, '4-8h': 12000, '8h+': 10000 },
      'mesero': { '1-4h': 8000, '4-8h': 6500, '8h+': 5000 },
      'supervisor': { '1-4h': 18000, '4-8h': 15000, '8h+': 12000 },
      'conductor': { '1-4h': 12000, '4-8h': 10000, '8h+': 8000 }
    }

    const defaultCertifications = {
      'operario': ['manipulacion_alimentos'],
      'chef': ['manipulacion_alimentos', 'chef_profesional'],
      'mesero': ['atencion_cliente', 'manipulacion_alimentos'],
      'supervisor': ['liderazgo', 'manipulacion_alimentos'],
      'conductor': ['licencia_c2']
    }

    return {
      has_arl: true,
      certifications: defaultCertifications[employeeType]
    }
  }
}

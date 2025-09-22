import { supabase } from './supabase'
import { EmployeeShift, Employee, ShiftType } from '../types'

export interface CreateShiftData {
  employee_id: number
  date: string
  shift_type: ShiftType
  shift_start_time?: string  // e.g., "02:00:00"
  shift_end_time?: string    // e.g., "05:30:00"
  status?: 'available' | 'booked' | 'vacation' | 'sick' | 'maintenance'
  quote_id?: number
  quote_item_id?: number
  replacement_for_employee_id?: number
  notes?: string
  created_by?: string | null
}

export interface UpdateShiftData extends Partial<CreateShiftData> {
  id: number
}

export interface AvailabilityCheckResult {
  employee_id: number
  employee_name: string
  date: string
  shift_type: ShiftType
  is_available: boolean
  conflict_reason?: string
  current_status?: 'available' | 'booked' | 'vacation' | 'sick' | 'maintenance'
  conflicting_quote?: {
    id: number
    quote_number: string
    event_title: string
  }
}

export interface ScheduleConflict {
  employee_id: number
  employee_name: string
  date: string
  shift_type: ShiftType
  existing_commitment: {
    quote_id?: number
    quote_number?: string
    event_title?: string
    status: string
  }
}

export class EmployeeSchedulingService {
  /**
   * Create a new employee shift
   */
  static async createShift(shiftData: CreateShiftData): Promise<EmployeeShift> {
    const processedData = {
      ...shiftData,
      status: shiftData.status || 'available',
      created_by: shiftData.created_by || null
    }

    const { data, error } = await supabase
      .from('employee_shifts')
      .insert(processedData)
      .select(`
        *,
        employee:employees!employee_id(*),
        replacement_for_employee:employees!replacement_for_employee_id(*),
        quote:quotes(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update an employee shift
   */
  static async updateShift(shiftData: UpdateShiftData): Promise<EmployeeShift> {
    const { id, ...updateData } = shiftData

    const { data, error } = await supabase
      .from('employee_shifts')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        employee:employees!employee_id(*),
        replacement_for_employee:employees!replacement_for_employee_id(*),
        quote:quotes(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete an employee shift
   */
  static async deleteShift(id: number): Promise<void> {
    const { error } = await supabase
      .from('employee_shifts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Get shifts for an employee in a date range
   */
  static async getEmployeeShifts(
    employeeId: number, 
    startDate: string, 
    endDate: string
  ): Promise<EmployeeShift[]> {
    const { data, error } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        employee:employees!employee_id(*),
        replacement_for_employee:employees!replacement_for_employee_id(*),
        quote:quotes(*)
      `)
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Get all shifts in a date range (optimized for scheduling page)
   */
  static async getShiftsInRange(startDate: string, endDate: string, employeeId?: number): Promise<EmployeeShift[]> {
    let query = supabase
      .from('employee_shifts')
      .select(`
        *,
        employee:employees!employee_id(*),
        replacement_for_employee:employees!replacement_for_employee_id(*),
        quote:quotes(*)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  /**
   * Get all shifts for a specific date
   */
  static async getShiftsByDate(date: string): Promise<EmployeeShift[]> {
    const { data, error } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        employee:employees!employee_id(*),
        replacement_for_employee:employees!replacement_for_employee_id(*),
        quote:quotes(*)
      `)
      .eq('date', date)
      .order('employee_id', { ascending: true })

    if (error) throw error
    return data || []
  }

  /**
   * Check availability of an employee for a specific date and shift
   */
  static async checkAvailability(
    employeeId: number, 
    date: string, 
    shiftType: ShiftType
  ): Promise<AvailabilityCheckResult> {
    // Get employee info
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, name')
      .eq('id', employeeId)
      .single()

    if (employeeError) throw employeeError

    // Check for existing shifts on that date
    const { data: existingShifts, error: shiftError } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        quote:quotes(id, quote_number, event_title)
      `)
      .eq('employee_id', employeeId)
      .eq('date', date)

    if (shiftError) throw shiftError

    const result: AvailabilityCheckResult = {
      employee_id: employeeId,
      employee_name: employee.name,
      date,
      shift_type: shiftType,
      is_available: true
    }

    if (!existingShifts || existingShifts.length === 0) {
      return result // Available - no existing shifts
    }

    // Check for conflicts based on shift type
    for (const shift of existingShifts) {
      if (this.shiftsConflict(shiftType, shift.shift_type)) {
        result.is_available = false
        result.current_status = shift.status
        result.conflict_reason = this.getConflictReason(shift.status, shift.shift_type)
        
        if (shift.quote) {
          result.conflicting_quote = {
            id: shift.quote.id,
            quote_number: shift.quote.quote_number,
            event_title: shift.quote.event_title
          }
        }
        break
      }
    }

    return result
  }

  /**
   * Check availability for multiple employees
   */
  static async checkMultipleAvailability(
    employeeIds: number[], 
    date: string, 
    shiftType: ShiftType
  ): Promise<AvailabilityCheckResult[]> {
    const results = await Promise.all(
      employeeIds.map(id => this.checkAvailability(id, date, shiftType))
    )
    return results
  }

  /**
   * Book an employee for a quote with specific shift times
   */
  static async bookEmployeeForQuote(
    employeeId: number,
    date: string,
    shiftType: ShiftType,
    quoteId: number,
    quoteItemId?: number,
    notes?: string,
    shiftStartTime?: string,
    shiftEndTime?: string
  ): Promise<EmployeeShift> {
    // First check availability
    const availability = await this.checkAvailability(employeeId, date, shiftType)
    
    if (!availability.is_available) {
      throw new Error(`Employee ${availability.employee_name} is not available on ${date} for ${shiftType} shift. ${availability.conflict_reason}`)
    }

    // Create the booking with specific times
    return await this.createShift({
      employee_id: employeeId,
      date,
      shift_type: shiftType,
      shift_start_time: shiftStartTime,
      shift_end_time: shiftEndTime,
      status: 'booked',
      quote_id: quoteId,
      quote_item_id: quoteItemId,
      notes,
      created_by: null
    })
  }

  /**
   * Release employee booking (when quote is cancelled/modified)
   */
  static async releaseEmployeeBooking(
    employeeId: number,
    date: string,
    shiftType: ShiftType,
    quoteId: number
  ): Promise<void> {
    const { error } = await supabase
      .from('employee_shifts')
      .delete()
      .eq('employee_id', employeeId)
      .eq('date', date)
      .eq('shift_type', shiftType)
      .eq('quote_id', quoteId)
      .eq('status', 'booked')

    if (error) throw error
  }

  /**
   * Get schedule conflicts for a date range
   */
  static async getScheduleConflicts(
    startDate: string,
    endDate: string
  ): Promise<ScheduleConflict[]> {
    const { data: shifts, error } = await supabase
      .from('employee_shifts')
      .select(`
        *,
        employee:employees!employee_id(id, name),
        replacement_for_employee:employees!replacement_for_employee_id(id, name),
        quote:quotes(id, quote_number, event_title)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['booked', 'vacation', 'sick'])

    if (error) throw error

    // Group by employee and date to find conflicts
    const conflictMap = new Map<string, EmployeeShift[]>()
    
    shifts?.forEach(shift => {
      const key = `${shift.employee_id}-${shift.date}`
      if (!conflictMap.has(key)) {
        conflictMap.set(key, [])
      }
      conflictMap.get(key)!.push(shift)
    })

    const conflicts: ScheduleConflict[] = []
    
    conflictMap.forEach((shiftsForDay, key) => {
      if (shiftsForDay.length > 1) {
        shiftsForDay.forEach(shift => {
          conflicts.push({
            employee_id: shift.employee_id,
            employee_name: shift.employee?.name || 'Unknown',
            date: shift.date,
            shift_type: shift.shift_type,
            existing_commitment: {
              quote_id: shift.quote_id,
              quote_number: shift.quote?.quote_number,
              event_title: shift.quote?.event_title,
              status: shift.status
            }
          })
        })
      }
    })

    return conflicts
  }

  /**
   * Get available employees for a specific date and shift
   */
  static async getAvailableEmployees(
    date: string,
    shiftType: ShiftType,
    employeeType?: string
  ): Promise<Employee[]> {
    // Get all active employees
    let employeeQuery = supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)

    if (employeeType) {
      employeeQuery = employeeQuery.eq('employee_type', employeeType)
    }

    const { data: employees, error: employeesError } = await employeeQuery

    if (employeesError) throw employeesError

    if (!employees) return []

    // Check availability for each employee
    const availabilityChecks = await Promise.all(
      employees.map(emp => this.checkAvailability(emp.id, date, shiftType))
    )

    // Filter to only available employees
    const availableEmployeeIds = availabilityChecks
      .filter(check => check.is_available)
      .map(check => check.employee_id)

    return employees.filter(emp => availableEmployeeIds.includes(emp.id))
  }

  /**
   * Generate employee schedule for a date range
   */
  static async generateScheduleReport(
    startDate: string,
    endDate: string,
    employeeId?: number
  ): Promise<{
    total_shifts: number
    booked_shifts: number
    available_shifts: number
    vacation_days: number
    sick_days: number
    by_employee: Record<number, {
      employee_name: string
      total_shifts: number
      booked_shifts: number
      available_hours: number
      revenue_generated: number
    }>
  }> {
    let query = supabase
      .from('employee_shifts')
      .select(`
        *,
        employee:employees!employee_id(id, name, hourly_rates),
        replacement_for_employee:employees!replacement_for_employee_id(id, name, hourly_rates),
        quote:quotes(total_cost)
      `)
      .gte('date', startDate)
      .lte('date', endDate)

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data: shifts, error } = await query

    if (error) throw error

    const stats = {
      total_shifts: shifts?.length || 0,
      booked_shifts: shifts?.filter(s => s.status === 'booked').length || 0,
      available_shifts: shifts?.filter(s => s.status === 'available').length || 0,
      vacation_days: shifts?.filter(s => s.status === 'vacation').length || 0,
      sick_days: shifts?.filter(s => s.status === 'sick').length || 0,
      by_employee: {} as any
    }

    // Group by employee
    const employeeMap = new Map<number, any>()
    
    shifts?.forEach(shift => {
      const empId = shift.employee_id
      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employee_name: shift.employee?.name || 'Unknown',
          total_shifts: 0,
          booked_shifts: 0,
          available_hours: 0,
          revenue_generated: 0
        })
      }
      
      const empData = employeeMap.get(empId)
      empData.total_shifts++
      
      if (shift.status === 'booked') {
        empData.booked_shifts++
        empData.revenue_generated += shift.quote?.total_cost || 0
      }
    })

    stats.by_employee = Object.fromEntries(employeeMap)

    return stats
  }

  /**
   * Helper: Check if two shift types conflict
   */
  private static shiftsConflict(shiftType1: ShiftType, shiftType2: ShiftType): boolean {
    if (shiftType1 === 'full_day' || shiftType2 === 'full_day') {
      return true // Full day conflicts with any other shift
    }
    
    return shiftType1 === shiftType2 // Same shift times conflict
  }

  /**
   * Helper: Get conflict reason message
   */
  private static getConflictReason(status: string, shiftType: ShiftType): string {
    const shiftNames = {
      morning: 'mañana',
      afternoon: 'tarde',
      full_day: 'día completo'
    }

    const statusNames = {
      booked: 'ya está reservado para otro evento',
      vacation: 'está de vacaciones',
      sick: 'está de incapacidad',
      maintenance: 'no está disponible'
    }

    return `${statusNames[status as keyof typeof statusNames] || 'no está disponible'} en turno de ${shiftNames[shiftType]}`
  }

  /**
   * Validation helpers
   */
  static validateShiftData(data: CreateShiftData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.employee_id) {
      errors.push('ID del empleado es requerido')
    }

    if (!data.date) {
      errors.push('Fecha es requerida')
    }

    if (data.date && new Date(data.date) < new Date()) {
      errors.push('La fecha no puede ser en el pasado')
    }

    if (!data.shift_type) {
      errors.push('Tipo de turno es requerido')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Utility: Format shift for display
   */
  static formatShiftForDisplay(shift: EmployeeShift): string {
    const shiftNames = {
      morning: 'Mañana',
      afternoon: 'Tarde', 
      full_day: 'Día Completo'
    }

    const statusNames = {
      available: 'Disponible',
      booked: 'Reservado',
      vacation: 'Vacaciones',
      sick: 'Incapacidad',
      maintenance: 'Mantenimiento'
    }

    // Format specific times if available
    const timeRange = shift.shift_start_time && shift.shift_end_time 
      ? ` (${shift.shift_start_time.slice(0, 5)} - ${shift.shift_end_time.slice(0, 5)})`
      : ''

    return `${shift.employee?.name} - ${shiftNames[shift.shift_type]}${timeRange} - ${statusNames[shift.status]}`
  }

  /**
   * Utility: Format only the time range for display
   */
  static formatShiftTimeRange(shift: EmployeeShift): string {
    if (shift.shift_start_time && shift.shift_end_time) {
      return `${shift.shift_start_time.slice(0, 5)} - ${shift.shift_end_time.slice(0, 5)}`
    }
    
    // Fallback to generic times based on shift type
    const defaultTimes = {
      morning: '08:00 - 12:00',
      afternoon: '14:00 - 20:00',
      full_day: '08:00 - 20:00'
    }
    
    return defaultTimes[shift.shift_type] || '08:00 - 20:00'
  }


  /**
   * Release all employee reservations for a specific quote
   */
  static async releaseQuoteReservations(quoteId: number): Promise<void> {
    // Releasing all employee reservations for quote
    
    // Delete all shifts associated with this quote
    const { error } = await supabase
      .from('employee_shifts')
      .delete()
      .eq('quote_id', quoteId)
      .eq('status', 'booked')

    if (error) {
      console.error('Error releasing quote reservations:', error)
      throw error
    }

    // Successfully released all reservations
  }
}
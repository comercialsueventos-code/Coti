import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmployeeSchedulingService, CreateShiftData, UpdateShiftData, AvailabilityCheckResult } from '../services/employee-scheduling.service'
import { EmployeeShift, Employee, ShiftType } from '../types'

// Query keys
export const EMPLOYEE_SCHEDULING_QUERY_KEYS = {
  all: ['employee-scheduling'] as const,
  shifts: () => [...EMPLOYEE_SCHEDULING_QUERY_KEYS.all, 'shifts'] as const,
  employeeShifts: (employeeId: number, startDate: string, endDate: string) => 
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.shifts(), 'employee', employeeId, startDate, endDate] as const,
  shiftsByDate: (date: string) => 
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.shifts(), 'date', date] as const,
  availability: () => [...EMPLOYEE_SCHEDULING_QUERY_KEYS.all, 'availability'] as const,
  availabilityCheck: (employeeId: number, date: string, shiftType: ShiftType) =>
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.availability(), employeeId, date, shiftType] as const,
  availableEmployees: (date: string, shiftType: ShiftType, employeeType?: string) =>
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.availability(), 'employees', date, shiftType, employeeType] as const,
  conflicts: (startDate: string, endDate: string) =>
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.all, 'conflicts', startDate, endDate] as const,
  scheduleReport: (startDate: string, endDate: string, employeeId?: number) =>
    [...EMPLOYEE_SCHEDULING_QUERY_KEYS.all, 'report', startDate, endDate, employeeId] as const
}

/**
 * Hook for fetching employee shifts in a date range
 */
export function useEmployeeShifts(
  employeeId: number, 
  startDate: string, 
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.employeeShifts(employeeId, startDate, endDate),
    queryFn: () => EmployeeSchedulingService.getEmployeeShifts(employeeId, startDate, endDate),
    enabled: enabled && !!employeeId && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching ALL shifts in a date range (for scheduling page)
 */
export function useAllShiftsInRange(params: {
  date_from: string
  date_to: string
  employee_id?: number
}) {
  return useQuery({
    queryKey: [...EMPLOYEE_SCHEDULING_QUERY_KEYS.shifts(), 'range', params.date_from, params.date_to, params.employee_id],
    queryFn: () => {
      // Use optimized single-query method
      return EmployeeSchedulingService.getShiftsInRange(params.date_from, params.date_to, params.employee_id)
    },
    enabled: !!params.date_from && !!params.date_to,
    staleTime: 1000 * 60 * 2, // 2 minutes - more frequent refresh for scheduling page
  })
}

/**
 * Hook for fetching all shifts on a specific date
 */
export function useShiftsByDate(date: string, enabled: boolean = true) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.shiftsByDate(date),
    queryFn: () => EmployeeSchedulingService.getShiftsByDate(date),
    enabled: enabled && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for checking employee availability
 */
export function useEmployeeAvailability(
  employeeId: number, 
  date: string, 
  shiftType: ShiftType,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.availabilityCheck(employeeId, date, shiftType),
    queryFn: () => EmployeeSchedulingService.checkAvailability(employeeId, date, shiftType),
    enabled: enabled && !!employeeId && !!date && !!shiftType,
    staleTime: 1000 * 60 * 1, // 1 minute (availability changes frequently)
  })
}

/**
 * Hook for checking multiple employees availability
 */
export function useMultipleEmployeeAvailability(
  employeeIds: number[], 
  date: string, 
  shiftType: ShiftType,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [...EMPLOYEE_SCHEDULING_QUERY_KEYS.availability(), 'multiple', employeeIds, date, shiftType],
    queryFn: () => EmployeeSchedulingService.checkMultipleAvailability(employeeIds, date, shiftType),
    enabled: enabled && employeeIds.length > 0 && !!date && !!shiftType,
    staleTime: 1000 * 60 * 1, // 1 minute
  })
}

/**
 * Hook for fetching available employees for a date/shift
 */
export function useAvailableEmployees(
  date: string, 
  shiftType: ShiftType, 
  employeeType?: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.availableEmployees(date, shiftType, employeeType),
    queryFn: () => EmployeeSchedulingService.getAvailableEmployees(date, shiftType, employeeType),
    enabled: enabled && !!date && !!shiftType,
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook for fetching schedule conflicts
 */
export function useScheduleConflicts(
  startDate: string, 
  endDate: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.conflicts(startDate, endDate),
    queryFn: () => EmployeeSchedulingService.getScheduleConflicts(startDate, endDate),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for generating schedule reports
 */
export function useScheduleReport(
  startDate: string, 
  endDate: string, 
  employeeId?: number,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.scheduleReport(startDate, endDate, employeeId),
    queryFn: () => EmployeeSchedulingService.generateScheduleReport(startDate, endDate, employeeId),
    enabled: enabled && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for creating a new shift
 */
export function useCreateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shiftData: CreateShiftData) => {
      return EmployeeSchedulingService.createShift(shiftData)
    },
    onSuccess: (newShift) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.employeeShifts(
          newShift.employee_id, 
          newShift.date, 
          newShift.date
        ) 
      })
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.shiftsByDate(newShift.date) 
      })
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.availability() 
      })
    },
  })
}

/**
 * Hook for updating a shift
 */
export function useUpdateShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shiftData: UpdateShiftData) => {
      return EmployeeSchedulingService.updateShift(shiftData)
    },
    onSuccess: (updatedShift) => {
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.employeeShifts(
          updatedShift.employee_id, 
          updatedShift.date, 
          updatedShift.date
        ) 
      })
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.shiftsByDate(updatedShift.date) 
      })
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.availability() 
      })
    },
  })
}

/**
 * Hook for deleting a shift
 */
export function useDeleteShift() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (shiftId: number) => {
      return EmployeeSchedulingService.deleteShift(shiftId)
    },
    onSuccess: () => {
      // Invalidate all scheduling-related queries
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.all 
      })
    },
  })
}

/**
 * Hook for booking an employee for a quote
 */
export function useBookEmployeeForQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      employeeId, 
      date, 
      shiftType, 
      quoteId, 
      quoteItemId, 
      notes,
      shiftStartTime,
      shiftEndTime
    }: {
      employeeId: number
      date: string
      shiftType: ShiftType
      quoteId: number
      quoteItemId?: number
      notes?: string
      shiftStartTime?: string
      shiftEndTime?: string
    }) => {
      return EmployeeSchedulingService.bookEmployeeForQuote(
        employeeId, 
        date, 
        shiftType, 
        quoteId, 
        quoteItemId, 
        notes,
        shiftStartTime,
        shiftEndTime
      )
    },
    onSuccess: (booking) => {
      // Invalidate all scheduling related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.all
      })
      // Special refresh for current month in scheduling page
      const currentMonth = new Date(booking.date)
      queryClient.invalidateQueries({ 
        queryKey: [...EMPLOYEE_SCHEDULING_QUERY_KEYS.shifts(), 'range']
      })
    },
  })
}

/**
 * Hook for releasing an employee booking
 */
export function useReleaseEmployeeBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      employeeId, 
      date, 
      shiftType, 
      quoteId 
    }: {
      employeeId: number
      date: string
      shiftType: ShiftType
      quoteId: number
    }) => {
      return EmployeeSchedulingService.releaseEmployeeBooking(employeeId, date, shiftType, quoteId)
    },
    onSuccess: (_, { employeeId, date }) => {
      // Invalidate all scheduling related queries to ensure fresh data everywhere
      queryClient.invalidateQueries({ 
        queryKey: EMPLOYEE_SCHEDULING_QUERY_KEYS.all
      })
      // Special refresh for scheduling page range queries
      queryClient.invalidateQueries({ 
        queryKey: [...EMPLOYEE_SCHEDULING_QUERY_KEYS.shifts(), 'range']
      })
    },
  })
}

/**
 * Utility hook for validation and formatting
 */
export function useEmployeeSchedulingUtils() {
  return {
    validateShiftData: EmployeeSchedulingService.validateShiftData,
    formatShiftForDisplay: EmployeeSchedulingService.formatShiftForDisplay,
    formatShiftTimeRange: EmployeeSchedulingService.formatShiftTimeRange,
    
    // Helper to get shift type options
    getShiftTypeOptions: () => [
      { value: 'morning', label: 'Mañana' },
      { value: 'afternoon', label: 'Tarde' },
      { value: 'full_day', label: 'Día Completo' }
    ],

    // Helper to get status options
    getStatusOptions: () => [
      { value: 'available', label: 'Disponible', color: 'success' },
      { value: 'booked', label: 'Reservado', color: 'primary' },
      { value: 'vacation', label: 'Vacaciones', color: 'warning' },
      { value: 'sick', label: 'Incapacidad', color: 'error' },
      { value: 'maintenance', label: 'Mantenimiento', color: 'default' }
    ],

    // Helper to format date for display
    formatDateForDisplay: (date: string) => {
      return new Date(date).toLocaleDateString('es-CO', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    // Helper to get next 30 days
    getNext30Days: () => {
      const dates = []
      const today = new Date()
      for (let i = 0; i < 30; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }
      return dates
    },

    // Helper to get availability status color
    getAvailabilityColor: (availability: AvailabilityCheckResult) => {
      if (availability.is_available) return 'success'
      
      switch (availability.current_status) {
        case 'booked': return 'primary'
        case 'vacation': return 'warning' 
        case 'sick': return 'error'
        default: return 'default'
      }
    }
  }
}
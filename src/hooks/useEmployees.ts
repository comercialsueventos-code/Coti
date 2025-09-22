import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmployeesService, CreateEmployeeData, UpdateEmployeeData, EmployeeFilters } from '../services/employees.service'
import { Employee } from '../types'

// Query keys
export const EMPLOYEES_QUERY_KEYS = {
  all: ['employees'] as const,
  lists: () => [...EMPLOYEES_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: EmployeeFilters) => [...EMPLOYEES_QUERY_KEYS.lists(), filters] as const,
  details: () => [...EMPLOYEES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...EMPLOYEES_QUERY_KEYS.details(), id] as const,
  search: (term: string) => [...EMPLOYEES_QUERY_KEYS.all, 'search', term] as const,
  byType: (type: string) => [...EMPLOYEES_QUERY_KEYS.all, 'type', type] as const,
  active: () => [...EMPLOYEES_QUERY_KEYS.all, 'active'] as const,
}

// Hook para obtener todos los empleados con filtros
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.list(filters),
    queryFn: () => EmployeesService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener empleados activos
export function useActiveEmployees() {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.active(),
    queryFn: () => EmployeesService.getActive(),
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener empleados por tipo
export function useEmployeesByType(type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor') {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.byType(type),
    queryFn: () => EmployeesService.getByType(type),
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para obtener un empleado por ID
export function useEmployee(id: number) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.detail(id),
    queryFn: () => EmployeesService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook para buscar empleados
export function useEmployeeSearch(searchTerm: string) {
  return useQuery({
    queryKey: EMPLOYEES_QUERY_KEYS.search(searchTerm),
    queryFn: () => EmployeesService.search(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutos para búsquedas
  })
}

// Hook para crear empleado
export function useCreateEmployee() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateEmployeeData) => EmployeesService.create(data),
    onSuccess: () => {
      // Invalidar todas las queries de empleados
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.all })
    },
  })
}

// Hook para actualizar empleado
export function useUpdateEmployee() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeData }) => 
      EmployeesService.update(id, data),
    onSuccess: (updatedEmployee) => {
      // Actualizar cache específico
      queryClient.setQueryData(
        EMPLOYEES_QUERY_KEYS.detail(updatedEmployee.id),
        updatedEmployee
      )
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.active() })
    },
  })
}

// Hook para eliminar empleado
export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => EmployeesService.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de empleados
      queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEYS.all })
    },
  })
}

// Hook para validar datos de empleado
export function useEmployeeValidation() {
  return {
    validateEmployeeData: EmployeesService.validateEmployeeData,
    validateEmail: EmployeesService.validateEmail,
    validatePhone: EmployeesService.validatePhone,
  }
}

// Hook para utilidades de empleados
export function useEmployeeUtils() {
  return {
    calculateAverageRate: EmployeesService.calculateAverageRate,
    getEmployeeTypeDisplayName: EmployeesService.getEmployeeTypeDisplayName,
    getEmployeeTypeIcon: EmployeesService.getEmployeeTypeIcon,
    formatHourlyRate: EmployeesService.formatHourlyRate,
    formatPhoneNumber: EmployeesService.formatPhoneNumber,
    getDefaultValues: EmployeesService.getDefaultValues,
    generateEmployeeReport: EmployeesService.generateEmployeeReport,
  }
}

// Hook para disponibilidad de empleados
export function useEmployeeAvailability(employeeId: number, date: string) {
  return useQuery({
    queryKey: ['employee-availability', employeeId, date],
    queryFn: () => EmployeesService.getEmployeeAvailability(employeeId, date),
    enabled: !!employeeId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minuto para disponibilidad
  })
}

// Hook para empleados disponibles por fecha
export function useEmployeesByAvailability(date: string, shiftType?: 'morning' | 'afternoon' | 'full_day') {
  return useQuery({
    queryKey: ['employees-by-availability', date, shiftType],
    queryFn: () => EmployeesService.getEmployeesByAvailability(date, shiftType),
    enabled: !!date,
    staleTime: 1 * 60 * 1000,
  })
}

// Hook para estadísticas de empleados
export function useEmployeeStats() {
  const { data: employees = [] } = useEmployees()
  
  return {
    stats: EmployeesService.generateEmployeeReport(employees),
    employees,
  }
}
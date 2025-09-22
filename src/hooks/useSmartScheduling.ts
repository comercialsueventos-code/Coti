import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmployeeSchedulingService } from '../services/employee-scheduling.service'
import { Employee, ShiftType, EmployeeShift } from '../types'
import { useEmployees } from './useEmployees'
import moment from 'moment'

interface SmartSchedulingOptions {
  date: string
  shiftType: ShiftType
  duration: number
  requiredEmployeeTypes?: string[]
  excludeEmployeeIds?: number[]
}

interface EmployeeAvailabilityStatus {
  employee: Employee
  isAvailable: boolean
  conflictReason?: string
  alternativeShifts?: ShiftType[]
  conflictingQuote?: {
    id: number
    quote_number: string
    event_title: string
  }
  recommendationScore: number // 0-100 score for recommendation
}

interface SmartSchedulingResult {
  availableEmployees: EmployeeAvailabilityStatus[]
  conflictedEmployees: EmployeeAvailabilityStatus[]
  recommendations: EmployeeAvailabilityStatus[]
  totalAvailable: number
  conflicts: number
  alternatives: {
    employee: Employee
    suggestedShift: ShiftType
    reason: string
  }[]
}

export const useSmartScheduling = (options: SmartSchedulingOptions) => {
  const { data: employees = [] } = useEmployees()
  const queryClient = useQueryClient()
  
  // Real-time availability check
  const { data: smartResult, isLoading, refetch } = useQuery({
    queryKey: ['smart-scheduling', options],
    queryFn: async (): Promise<SmartSchedulingResult> => {
      if (!options.date) {
        return {
          availableEmployees: [],
          conflictedEmployees: [],
          recommendations: [],
          totalAvailable: 0,
          conflicts: 0,
          alternatives: []
        }
      }

      const activeEmployees = employees.filter(emp => 
        emp.is_active && 
        (!options.requiredEmployeeTypes || options.requiredEmployeeTypes.includes(emp.employee_type)) &&
        (!options.excludeEmployeeIds || !options.excludeEmployeeIds.includes(emp.id))
      )

      // Check availability for all employees in parallel
      const availabilityPromises = activeEmployees.map(async (employee): Promise<EmployeeAvailabilityStatus> => {
        const availability = await EmployeeSchedulingService.checkAvailability(
          employee.id,
          options.date,
          options.shiftType
        )

        // Calculate recommendation score based on multiple factors
        let recommendationScore = 0
        
        // Base score for availability
        if (availability.is_available) {
          recommendationScore += 50
        }
        
        // Score based on employee type match
        if (options.requiredEmployeeTypes?.includes(employee.employee_type)) {
          recommendationScore += 30
        }
        
        // Score based on recent work history (less overworked = higher score)
        const recentShifts = await getRecentShifts(employee.id)
        const workloadScore = Math.max(0, 20 - recentShifts.length) // Max 20 points for light workload
        recommendationScore += workloadScore

        // Check for alternative shifts if not available
        const alternativeShifts: ShiftType[] = []
        if (!availability.is_available) {
          const alternatives: ShiftType[] = ['morning', 'afternoon', 'full_day']
          for (const altShift of alternatives) {
            if (altShift !== options.shiftType) {
              const altAvailability = await EmployeeSchedulingService.checkAvailability(
                employee.id,
                options.date,
                altShift
              )
              if (altAvailability.is_available) {
                alternativeShifts.push(altShift)
              }
            }
          }
        }

        return {
          employee,
          isAvailable: availability.is_available,
          conflictReason: availability.conflict_reason,
          conflictingQuote: availability.conflicting_quote,
          alternativeShifts,
          recommendationScore
        }
      })

      const results = await Promise.all(availabilityPromises)
      
      // Separate available and conflicted employees
      const availableEmployees = results
        .filter(r => r.isAvailable)
        .sort((a, b) => b.recommendationScore - a.recommendationScore) // Sort by recommendation score

      const conflictedEmployees = results
        .filter(r => !r.isAvailable)
        .sort((a, b) => b.alternativeShifts!.length - a.alternativeShifts!.length) // Sort by alternatives available

      // Generate smart recommendations
      const recommendations = availableEmployees.slice(0, 5) // Top 5 recommendations

      // Generate alternatives for conflicted employees
      const alternatives = conflictedEmployees
        .filter(emp => emp.alternativeShifts && emp.alternativeShifts.length > 0)
        .map(emp => ({
          employee: emp.employee,
          suggestedShift: emp.alternativeShifts![0],
          reason: `Disponible en turno ${getShiftTypeName(emp.alternativeShifts![0])}`
        }))

      return {
        availableEmployees,
        conflictedEmployees,
        recommendations,
        totalAvailable: availableEmployees.length,
        conflicts: conflictedEmployees.length,
        alternatives
      }
    },
    enabled: !!options.date && employees.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000 // Consider data stale after 10 seconds
  })

  // Auto-booking mutation
  const autoBookMutation = useMutation({
    mutationFn: async ({
      employeeIds,
      quoteId,
      quoteItemIds
    }: {
      employeeIds: number[]
      quoteId: number
      quoteItemIds?: number[]
    }) => {
      const bookingPromises = employeeIds.map(async (employeeId, index) => {
        return await EmployeeSchedulingService.bookEmployeeForQuote(
          employeeId,
          options.date,
          options.shiftType,
          quoteId,
          quoteItemIds?.[index],
          `Auto-booked by smart scheduling system`
        )
      })
      
      return await Promise.all(bookingPromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] })
    }
  })

  // Auto-release mutation
  const autoReleaseMutation = useMutation({
    mutationFn: async ({
      employeeIds,
      quoteId
    }: {
      employeeIds: number[]
      quoteId: number
    }) => {
      const releasePromises = employeeIds.map(async (employeeId) => {
        return await EmployeeSchedulingService.releaseEmployeeBooking(
          employeeId,
          options.date,
          options.shiftType,
          quoteId
        )
      })
      
      return await Promise.all(releasePromises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-scheduling'] })
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] })
    }
  })

  // Utility functions
  const getRecentShifts = async (employeeId: number): Promise<EmployeeShift[]> => {
    const startDate = moment().subtract(7, 'days').format('YYYY-MM-DD')
    const endDate = moment().format('YYYY-MM-DD')
    return await EmployeeSchedulingService.getEmployeeShifts(employeeId, startDate, endDate)
  }

  const getShiftTypeName = (shiftType: ShiftType): string => {
    switch (shiftType) {
      case 'morning': return 'mañana'
      case 'afternoon': return 'tarde'
      case 'full_day': return 'día completo'
      default: return shiftType
    }
  }

  // Smart suggestions for optimal team composition
  const generateTeamSuggestions = (requiredCount: number) => {
    if (!smartResult) return []

    const available = smartResult.availableEmployees
    if (available.length < requiredCount) return []

    // Generate different team composition options
    const suggestions = []
    
    // Option 1: Highest scored employees
    suggestions.push({
      name: 'Mejor Puntuados',
      employees: available.slice(0, requiredCount),
      reason: 'Empleados con mejor puntaje de recomendación'
    })

    // Option 2: Diverse skill set (if we have different employee types)
    const employeeTypes = [...new Set(available.map(emp => emp.employee.employee_type))]
    if (employeeTypes.length > 1) {
      const diverseTeam = []
      for (const type of employeeTypes) {
        const typeEmployees = available.filter(emp => emp.employee.employee_type === type)
        if (typeEmployees.length > 0) {
          diverseTeam.push(typeEmployees[0])
          if (diverseTeam.length >= requiredCount) break
        }
      }
      if (diverseTeam.length === requiredCount) {
        suggestions.push({
          name: 'Equipo Diverso',
          employees: diverseTeam,
          reason: 'Combinación de diferentes tipos de empleados'
        })
      }
    }

    // Option 3: Low workload employees
    const lowWorkload = available
      .filter(emp => emp.recommendationScore >= 70) // High score means low recent workload
      .slice(0, requiredCount)
    
    if (lowWorkload.length === requiredCount) {
      suggestions.push({
        name: 'Carga de Trabajo Equilibrada',
        employees: lowWorkload,
        reason: 'Empleados con menor carga de trabajo reciente'
      })
    }

    return suggestions
  }

  return {
    // Data
    result: smartResult,
    isLoading,
    
    // Actions
    autoBook: autoBookMutation.mutateAsync,
    autoRelease: autoReleaseMutation.mutateAsync,
    refresh: refetch,
    
    // Smart suggestions
    generateTeamSuggestions,
    
    // Loading states
    isBooking: autoBookMutation.isPending,
    isReleasing: autoReleaseMutation.isPending,
    
    // Utilities
    getShiftTypeName,
    
    // Real-time status
    lastUpdated: new Date(),
    
    // Quick access computed values
    hasConflicts: (smartResult?.conflicts || 0) > 0,
    hasAlternatives: (smartResult?.alternatives || []).length > 0,
    canFulfillRequest: (requiredCount: number) => (smartResult?.totalAvailable || 0) >= requiredCount
  }
}

// Hook specifically for pricing calculator integration
export const usePricingScheduling = (
  eventDate: string,
  eventHours: number,
  selectedEmployees: { id: number; employee_type: string }[]
) => {
  const [validationResults, setValidationResults] = useState<{
    [employeeId: number]: EmployeeAvailabilityStatus
  }>({})

  const shiftType: ShiftType = eventHours <= 8 
    ? (new Date(`${eventDate}T06:00`).getHours() < 14 ? 'morning' : 'afternoon')
    : 'full_day'

  const selectedEmployeeIds = selectedEmployees.map(emp => emp.id)
  
  const smartScheduling = useSmartScheduling({
    date: eventDate,
    shiftType,
    duration: eventHours,
    excludeEmployeeIds: []
  })

  // Validate selected employees in real-time
  useEffect(() => {
    const validateSelectedEmployees = async () => {
      if (!selectedEmployees.length || !eventDate) return

      try {
        const validationPromises = selectedEmployees.map(async (emp) => {
          const availability = await EmployeeSchedulingService.checkAvailability(
            emp.id,
            eventDate,
            shiftType
          )

          const employee = smartScheduling.result?.availableEmployees
            ?.concat(smartScheduling.result.conflictedEmployees)
            ?.find(e => e.employee.id === emp.id)

          return {
            employeeId: emp.id,
            status: employee || {
              employee: { id: emp.id, name: 'Unknown' } as Employee,
              isAvailable: availability.is_available,
              conflictReason: availability.conflict_reason,
              conflictingQuote: availability.conflicting_quote,
              recommendationScore: 0
            }
          }
        })

        const results = await Promise.all(validationPromises)
        const validationMap = results.reduce((acc, result) => {
          acc[result.employeeId] = result.status
          return acc
        }, {} as { [employeeId: number]: EmployeeAvailabilityStatus })

        setValidationResults(validationMap)
      } catch (error) {
        console.warn('Error validating selected employees:', error)
        setValidationResults({})
      }
    }

    validateSelectedEmployees()
  }, [selectedEmployees, eventDate, shiftType, smartScheduling.result])

  return {
    ...smartScheduling,
    
    // Pricing-specific validation
    validationResults,
    selectedEmployeesStatus: selectedEmployeeIds.map(id => validationResults[id]).filter(Boolean),
    allSelectedAvailable: selectedEmployeeIds.every(id => validationResults[id]?.isAvailable),
    conflictedSelections: selectedEmployeeIds.filter(id => !validationResults[id]?.isAvailable),
    
    // Auto-suggestions for replacements
    getSuggestionsForConflicts: () => {
      if (!smartScheduling.result) return []
      
      return selectedEmployeeIds
        .filter(id => !validationResults[id]?.isAvailable)
        .map(conflictedId => {
          const conflictedEmployee = validationResults[conflictedId]?.employee
          if (!conflictedEmployee) return null
          
          // Find similar available employees
          const similar = smartScheduling.result!.availableEmployees
            .filter(emp => emp.employee.employee_type === conflictedEmployee.employee_type)
            .slice(0, 3)
            
          return {
            conflictedEmployeeId: conflictedId,
            suggestions: similar
          }
        })
        .filter(Boolean)
    }
  }
}
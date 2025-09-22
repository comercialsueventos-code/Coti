import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useUpdateQuote } from './useQuotes'
import { EmployeeSchedulingService } from '../services/employee-scheduling.service'
import { Quote, ShiftType } from '../types'
import moment from 'moment'

interface SmartQuoteUpdateData {
  id: number
  originalQuote: Quote
  updates: Partial<Quote>
  employeeChanges?: {
    added: { id: number; hours: number; employee_type: string }[]
    removed: { id: number; hours: number; employee_type: string }[]
    modified: { id: number; oldHours: number; newHours: number; employee_type: string }[]
  }
}

interface AutoReleaseResult {
  releasedBookings: number
  newBookings: number
  errors: string[]
  success: boolean
}

export const useSmartQuoteManagement = () => {
  const queryClient = useQueryClient()
  const updateQuote = useUpdateQuote()

  // Smart quote update with auto-release/re-booking
  const smartUpdateQuote = useMutation({
    mutationFn: async (data: SmartQuoteUpdateData): Promise<AutoReleaseResult> => {
      const result: AutoReleaseResult = {
        releasedBookings: 0,
        newBookings: 0,
        errors: [],
        success: false
      }

      try {
        console.log(`🔄 Smart quote update for ${data.originalQuote.quote_number}`)
        
        // Step 1: Update the quote first
        await updateQuote.mutateAsync({
          id: data.id,
          ...data.updates
        })

        // Step 2: Handle employee changes with intelligent release/booking
        if (data.employeeChanges) {
          const { added, removed, modified } = data.employeeChanges
          const eventDate = data.updates.event_start_date || data.originalQuote.event_start_date
          
          if (!eventDate) {
            throw new Error('No event date available for scheduling operations')
          }

          // Calculate shift type from original or updated quote
          const shiftType = calculateShiftType(data.originalQuote, data.updates)

          // Step 2A: Release removed employees
          if (removed.length > 0) {
            console.log(`🔓 Releasing ${removed.length} employees from quote ${data.originalQuote.quote_number}`)
            
            for (const employee of removed) {
              try {
                await EmployeeSchedulingService.releaseEmployeeBooking(
                  employee.id,
                  eventDate,
                  shiftType,
                  data.originalQuote.id
                )
                result.releasedBookings++
                console.log(`✅ Released employee ${employee.id} from quote`)
              } catch (error: any) {
                const errorMsg = `Failed to release employee ${employee.id}: ${error.message}`
                result.errors.push(errorMsg)
                console.warn(`⚠️ ${errorMsg}`)
              }
            }
          }

          // Step 2B: Book new employees
          if (added.length > 0) {
            console.log(`🔒 Booking ${added.length} new employees for quote ${data.originalQuote.quote_number}`)
            
            for (const employee of added) {
              try {
                await EmployeeSchedulingService.bookEmployeeForQuote(
                  employee.id,
                  eventDate,
                  shiftType,
                  data.originalQuote.id,
                  undefined,
                  `Auto-booked during quote update - ${data.updates.event_description || data.originalQuote.event_description || 'Event'}`
                )
                result.newBookings++
                console.log(`✅ Booked new employee ${employee.id} for quote`)
              } catch (error: any) {
                const errorMsg = `Failed to book employee ${employee.id}: ${error.message}`
                result.errors.push(errorMsg)
                console.warn(`⚠️ ${errorMsg}`)
              }
            }
          }

          // Step 2C: Handle modified employees (if shift type or date changed)
          if (modified.length > 0) {
            console.log(`🔄 Updating ${modified.length} modified employees for quote ${data.originalQuote.quote_number}`)
            
            // For modified employees, we might need to release and re-book if shift type changed
            const originalShiftType = calculateShiftType(data.originalQuote)
            const newShiftType = calculateShiftType(data.originalQuote, data.updates)
            const dateChanged = data.updates.event_start_date && data.updates.event_start_date !== data.originalQuote.event_start_date
            
            if (originalShiftType !== newShiftType || dateChanged) {
              for (const employee of modified) {
                try {
                  // Release old booking
                  await EmployeeSchedulingService.releaseEmployeeBooking(
                    employee.id,
                    data.originalQuote.event_start_date,
                    originalShiftType,
                    data.originalQuote.id
                  )
                  result.releasedBookings++
                  
                  // Create new booking
                  await EmployeeSchedulingService.bookEmployeeForQuote(
                    employee.id,
                    eventDate,
                    newShiftType,
                    data.originalQuote.id,
                    undefined,
                    `Re-booked during quote update - schedule changed`
                  )
                  result.newBookings++
                  
                  console.log(`✅ Re-scheduled employee ${employee.id} due to changes`)
                } catch (error: any) {
                  const errorMsg = `Failed to re-schedule employee ${employee.id}: ${error.message}`
                  result.errors.push(errorMsg)
                  console.warn(`⚠️ ${errorMsg}`)
                }
              }
            }
          }
        }

        result.success = true
        console.log(`🎉 Smart quote update complete: ${result.releasedBookings} released, ${result.newBookings} booked, ${result.errors.length} errors`)
        
        return result

      } catch (error: any) {
        console.error('❌ Smart quote update failed:', error)
        result.errors.push(`Quote update failed: ${error.message}`)
        throw error
      }
    },
    onSuccess: (result) => {
      // Invalidate relevant caches
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-scheduling'] })
      
      if (result.success && result.errors.length === 0) {
        console.log('✅ All scheduling operations completed successfully')
      } else if (result.errors.length > 0) {
        console.log(`⚠️ Some scheduling operations failed: ${result.errors.join(', ')}`)
      }
    },
    onError: (error) => {
      console.error('❌ Smart quote update failed completely:', error)
    }
  })

  // Smart quote cancellation with auto-release
  const smartCancelQuote = useMutation({
    mutationFn: async (quote: Quote): Promise<AutoReleaseResult> => {
      const result: AutoReleaseResult = {
        releasedBookings: 0,
        newBookings: 0,
        errors: [],
        success: false
      }

      try {
        console.log(`❌ Smart quote cancellation for ${quote.quote_number}`)
        
        // Step 1: Update quote status to cancelled
        await updateQuote.mutateAsync({
          id: quote.id,
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })

        // Step 2: Release all employee bookings
        if (quote.event_start_date) {
          const shiftType = calculateShiftType(quote)
          
          console.log(`🔓 Releasing all employee bookings for cancelled quote ${quote.quote_number}`)
          
          // Get all shifts for this quote and release them
          const dayShifts = await EmployeeSchedulingService.getShiftsByDate(quote.event_start_date)
          const quoteShifts = dayShifts.filter(shift => shift.quote_id === quote.id)
          
          for (const shift of quoteShifts) {
            try {
              await EmployeeSchedulingService.deleteShift(shift.id)
              result.releasedBookings++
              console.log(`✅ Released employee ${shift.employee?.name} from cancelled quote`)
            } catch (error: any) {
              const errorMsg = `Failed to release employee ${shift.employee?.name}: ${error.message}`
              result.errors.push(errorMsg)
              console.warn(`⚠️ ${errorMsg}`)
            }
          }
        }

        result.success = true
        console.log(`🎉 Smart quote cancellation complete: ${result.releasedBookings} employees released`)
        
        return result

      } catch (error: any) {
        console.error('❌ Smart quote cancellation failed:', error)
        result.errors.push(`Quote cancellation failed: ${error.message}`)
        throw error
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] })
      queryClient.invalidateQueries({ queryKey: ['smart-scheduling'] })
      
      console.log(`✅ Quote cancelled and ${result.releasedBookings} employees automatically released`)
    }
  })

  // Smart quote status change with intelligent handling
  const smartChangeStatus = useMutation({
    mutationFn: async ({
      quote,
      newStatus,
      reason
    }: {
      quote: Quote
      newStatus: 'approved' | 'rejected' | 'completed' | 'cancelled'
      reason?: string
    }): Promise<AutoReleaseResult> => {
      const result: AutoReleaseResult = {
        releasedBookings: 0,
        newBookings: 0,
        errors: [],
        success: false
      }

      try {
        console.log(`🔄 Smart status change for ${quote.quote_number}: ${quote.status} → ${newStatus}`)
        
        // Update quote status
        const updateData: Partial<Quote> = {
          status: newStatus
        }

        switch (newStatus) {
          case 'approved':
            updateData.approved_at = new Date().toISOString()
            updateData.approval_notes = reason
            break
          case 'rejected':
            updateData.rejected_at = new Date().toISOString()
            updateData.rejection_reason = reason
            // Release all bookings for rejected quotes
            if (quote.event_start_date) {
              const shiftType = calculateShiftType(quote)
              const dayShifts = await EmployeeSchedulingService.getShiftsByDate(quote.event_start_date)
              const quoteShifts = dayShifts.filter(shift => shift.quote_id === quote.id)
              
              for (const shift of quoteShifts) {
                try {
                  await EmployeeSchedulingService.deleteShift(shift.id)
                  result.releasedBookings++
                } catch (error: any) {
                  result.errors.push(`Failed to release employee: ${error.message}`)
                }
              }
            }
            break
          case 'completed':
            updateData.completed_at = new Date().toISOString()
            break
          case 'cancelled':
            return await smartCancelQuote.mutateAsync(quote)
        }

        await updateQuote.mutateAsync({
          id: quote.id,
          ...updateData
        })

        result.success = true
        console.log(`✅ Smart status change complete for ${quote.quote_number}`)
        
        return result

      } catch (error: any) {
        console.error('❌ Smart status change failed:', error)
        result.errors.push(`Status change failed: ${error.message}`)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      queryClient.invalidateQueries({ queryKey: ['employee-shifts'] })
    }
  })

  return {
    smartUpdateQuote: smartUpdateQuote.mutateAsync,
    smartCancelQuote: smartCancelQuote.mutateAsync,
    smartChangeStatus: smartChangeStatus.mutateAsync,
    
    // Loading states
    isUpdating: smartUpdateQuote.isPending,
    isCancelling: smartCancelQuote.isPending,
    isChangingStatus: smartChangeStatus.isPending,
    
    // Utils
    calculateShiftType
  }
}

// Utility function to calculate shift type from quote data
const calculateShiftType = (originalQuote: Quote, updates?: Partial<Quote>): ShiftType => {
  const startTime = updates?.event_start_time || originalQuote.event_start_time || '08:00'
  const endTime = updates?.event_end_time || originalQuote.event_end_time || '20:00'
  const startDate = updates?.event_start_date || originalQuote.event_start_date
  const endDate = updates?.event_end_date || originalQuote.event_end_date || startDate
  
  if (!startDate) return 'full_day'
  
  const eventStart = moment(`${startDate} ${startTime}`)
  const eventEnd = moment(`${endDate} ${endTime}`)
  const durationHours = eventEnd.diff(eventStart, 'hours')
  
  // Determine shift type based on duration and time
  if (durationHours > 12) {
    return 'full_day'
  } else if (eventStart.hour() < 14) {
    return 'morning'
  } else {
    return 'afternoon'
  }
}
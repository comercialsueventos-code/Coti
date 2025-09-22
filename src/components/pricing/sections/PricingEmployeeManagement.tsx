import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  List,
  ListItem,
  ListItemText,
  Box,
  Alert,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip
} from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material'
import { useActiveEmployees } from '../../../hooks/useEmployees'
import { EmployeeManagementProps } from '../types'
import { PricingService } from '../../../services/pricing.service'

const EmployeeAvailabilityIndicator: React.FC<{
  employeeId: number
  date: string
  hours: number
}> = ({ employeeId, date, hours }) => {
  // Simplified availability check - in real implementation this would check against database
  const isAvailable = true // For now, assume employees are available
  
  return (
    <Chip
      label={isAvailable ? "Disponible" : "No disponible"}
      color={isAvailable ? "success" : "error"}
      size="small"
    />
  )
}

const PricingEmployeeManagement: React.FC<EmployeeManagementProps> = ({
  formData,
  addEmployee,
  removeEmployee,
  updateEmployee
}) => {
  const { data: employees = [], isLoading: loadingEmployees } = useActiveEmployees()
  const [viewMode, setViewMode] = useState<'by_employee' | 'by_event'>('by_employee')
  
  // Function to get the correct hourly rate based on hours worked
  const getEmployeeRateForHours = (employee: any, hours: number): number => {
    // First try category rates (new system)
    if (employee.category?.default_hourly_rates) {
      const applicableRate = employee.category.default_hourly_rates.find((rate: any) => 
        hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
      )
      if (applicableRate) return applicableRate.rate
    }
    
    // Fallback to individual rates (legacy system)
    if (employee.hourly_rates) {
      if (Array.isArray(employee.hourly_rates)) {
        // New array format
        const applicableRate = employee.hourly_rates.find((rate: any) => 
          hours >= rate.min_hours && (rate.max_hours === null || hours <= rate.max_hours)
        )
        return applicableRate?.rate || 0
      } else {
        // Legacy object format
        if (hours <= 4) return employee.hourly_rates['1-4h'] || 0
        if (hours <= 8) return employee.hourly_rates['4-8h'] || 0
        return employee.hourly_rates['8h+'] || 0
      }
    }
    
    return 0
  }

  // Function to calculate total cost for an employee including ARL
  const calculateEmployeeCost = (employee: any, hours: number, includeARL: boolean = false): number => {
    const result = PricingService.calculateEmployeeCost({
      employee,
      hours,
      includeARL
    })
    return result.total_cost
  }

  // Function to calculate total cost for an employee including manual extra cost
  const calculateEmployeeCostWithExtra = (employee: any, hours: number, includeARL: boolean = false, extraCost?: number): number => {
    const baseCost = calculateEmployeeCost(employee, hours, includeARL)
    return baseCost + (extraCost || 0)
  }

  // 🔥 FIX: Function to calculate employee cost for multi-day events (specific hours per day)
  const calculateEmployeeCostForEvent = (employee: any, dailySchedules: any[], includeARL: boolean = false, extraCost?: number): number => {
    let totalBaseCost = 0
    
    // Calculate cost for each day individually with its specific hours
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
        
        // Calculate cost for this specific day with its specific hours
        const costThisDay = calculateEmployeeCost(employee, hoursThisDay, includeARL)
        totalBaseCost += costThisDay
      }
    })
    
    // Add extra cost (applied once, not per day)
    return totalBaseCost + (extraCost || 0)
  }

  // Function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return ''
    // Remove seconds from time display (HH:MM:SS -> HH:MM)
    return timeString.split(':').slice(0, 2).join(':')
  }
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // 🔥 FIX: Calculate total hours for multiday events (FIXED - Story 1.4)
  const calculateHoursPerDay = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return 0 // Can't calculate without dates
    }
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    // For multi-day events with individual daily schedules
    if (isMultiDay && formData.dailySchedules.length > 0) {
      // Calculate total hours (not average per day)
      let totalHours = 0
      let daysWithSchedule = 0
      
      formData.dailySchedules.forEach(daySchedule => {
        if (daySchedule.startTime && daySchedule.endTime) {
          const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
          const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
          
          const startMinutes = startHour * 60 + startMinute
          const endMinutes = endHour * 60 + endMinute
          
          let hoursPerDay = (endMinutes - startMinutes) / 60
          
          // Handle overnight events
          if (hoursPerDay < 0) {
            hoursPerDay += 24
          }
          
          totalHours += Math.max(0.5, hoursPerDay)
          daysWithSchedule++
        }
      })
      
      // Fix: Return total hours for multiday events, not average per day
      return Math.round(totalHours * 2) / 2 // Round total hours to nearest 0.5 hour
    }
    
    // For single-day events
    if (!formData.eventStartTime || !formData.eventEndTime) {
      return 0 // Can't calculate without times
    }
    
    const [startHour, startMinute] = formData.eventStartTime.split(':').slice(0, 2).map(Number)
    const [endHour, endMinute] = formData.eventEndTime.split(':').slice(0, 2).map(Number)
    
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    
    let hoursPerDay = (endMinutes - startMinutes) / 60
    
    // Handle overnight events
    if (hoursPerDay < 0) {
      hoursPerDay += 24
    }
    
    return Math.max(0.5, Math.round(hoursPerDay * 2) / 2) // Round to nearest 0.5 hour
  }

  // 🔥 FIX: Calculate number of event days
  const calculateEventDays = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return 1 // Default to 1 day if no dates
    }
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay && formData.dailySchedules.length > 0) {
      // Count days with actual schedules
      return formData.dailySchedules.filter(daySchedule => 
        daySchedule.startTime && daySchedule.endTime
      ).length
    }
    
    return 1 // Single day event
  }

  // 🔥 FIX: Calculate total event hours for display (FIXED - Story 1.4)
  const calculateEventHours = () => {
    const isMultiDay = formData.eventEndDate && new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    // For multiday events with individual schedules, calculateHoursPerDay() already returns total
    if (isMultiDay && formData.dailySchedules.length > 0) {
      return calculateHoursPerDay() // Already returns total hours, don't multiply
    }
    
    // For single-day events, multiply hours by days (backward compatibility)
    return calculateHoursPerDay() * calculateEventDays()
  }

  // 🔥 NEW: Check if event has variable hours per day
  const hasVariableHours = () => {
    if (!formData.dailySchedules || formData.dailySchedules.length <= 1) {
      return false
    }

    const hoursPerDayArray = formData.dailySchedules.map(daySchedule => {
      if (daySchedule.startTime && daySchedule.endTime) {
        const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
        const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
        
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute
        
        let hoursThisDay = (endMinutes - startMinutes) / 60
        if (hoursThisDay < 0) hoursThisDay += 24
        
        return Math.max(0.5, Math.round(hoursThisDay * 2) / 2)
      }
      return 0
    }).filter(hours => hours > 0)

    // Check if all hours are the same
    return hoursPerDayArray.length > 1 && !hoursPerDayArray.every(hours => hours === hoursPerDayArray[0])
  }

  // 🔥 NEW: Get detailed hours breakdown for variable schedules
  const getHoursBreakdown = () => {
    if (!formData.dailySchedules || formData.dailySchedules.length === 0) {
      return null
    }

    return formData.dailySchedules.map((daySchedule, index) => {
      if (daySchedule.startTime && daySchedule.endTime) {
        const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
        const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
        
        const startMinutes = startHour * 60 + startMinute
        const endMinutes = endHour * 60 + endMinute
        
        let hoursThisDay = (endMinutes - startMinutes) / 60
        if (hoursThisDay < 0) hoursThisDay += 24
        
        hoursThisDay = Math.max(0.5, Math.round(hoursThisDay * 2) / 2)

        return {
          day: index + 1,
          hours: hoursThisDay,
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime
        }
      }
      return null
    }).filter(day => day !== null)
  }

  const getEventSummary = () => {
    if (!hasEventDates) return ''
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay) {
      const selectedDaysCount = formData.selectedDays?.length || 0
      const scheduledDays = formData.dailySchedules.filter(day => day.startTime && day.endTime).length
      return selectedDaysCount > 0 
        ? `${selectedDaysCount} días seleccionados (${scheduledDays}/${selectedDaysCount} configurados)`
        : 'Sin días seleccionados'
    } else {
      const hoursDetail = formData.eventStartTime && formData.eventEndTime ? 
        ` (${formData.eventStartTime}-${formData.eventEndTime})` : ''
      return `1 día${hoursDetail}`
    }
  }

  const eventHours = calculateEventHours()
  const hoursPerDay = calculateHoursPerDay()
  const eventDays = calculateEventDays()
  const hasEventDates = formData.eventStartDate && formData.eventEndDate
  
  // 🔥 FIX: Calculate total cost of all employees (specific hours per day for multi-day events)
  const totalEmployeesCost = formData.employeeInputs.reduce((total, input) => {
    const isMultiDay = eventDays > 1
    
    if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
      // For multi-day events: calculate cost for each day with its specific hours
      return total + calculateEmployeeCostForEvent(input.employee, formData.dailySchedules, input.includeARL, input.extraCost)
    } else {
      // For single-day events: use original calculation
      return total + calculateEmployeeCostWithExtra(input.employee, input.hours, input.includeARL, input.extraCost)
    }
  }, 0)
  
  const hasCompleteEventInfo = (() => {
    if (!hasEventDates) return false
    
    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay) {
      // Multi-day event: requires selected days and all daily schedules to be complete
      return formData.selectedDays && formData.selectedDays.length > 0 &&
             formData.dailySchedules.length === formData.selectedDays.length && 
             formData.dailySchedules.every(day => day.startTime && day.endTime)
    } else {
      // Single-day event: requires start and end times
      return formData.eventStartTime && formData.eventEndTime
    }
  })()


  const renderEmployeesByEmployee = () => (
    <List>
      {formData.employeeInputs.map((input, index) => (
        <ListItem key={index}>
          <Box sx={{ width: '100%' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Empleado</InputLabel>
                  <Select
                    value={input.employee.id}
                    label="Empleado"
                    onChange={(e) => {
                      const employee = employees.find(emp => emp.id === Number(e.target.value))
                      if (employee) {
                        updateEmployee(index, 'employee', employee)
                        // Automatically adjust ARL setting based on employee's ARL status
                        updateEmployee(index, 'includeARL', employee.has_arl || false)
                        // Load default extra cost from employee
                        updateEmployee(index, 'extraCost', employee.default_extra_cost || undefined)
                        updateEmployee(index, 'extraCostReason', employee.default_extra_cost_reason || undefined)
                      }
                    }}
                  >
                    {loadingEmployees ? (
                      <MenuItem value="" disabled>Cargando empleados...</MenuItem>
                    ) : employees.length === 0 ? (
                      <MenuItem value="" disabled>No hay empleados disponibles</MenuItem>
                    ) : (
                      employees.map(emp => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employee_type})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={2}>
                <TextField
                  size="small"
                  label="Horas"
                  type="number"
                  value={input.hours}
                  onChange={(e) => updateEmployee(index, 'hours', Number(e.target.value))}
                  inputProps={{ min: 0.5, step: 0.5 }}
                  disabled={hasCompleteEventInfo}
                />
              </Grid>
              
              <Grid item xs={2}>
                <TextField
                  size="small"
                  label="Costo Extra"
                  type="number"
                  value={input.extraCost || ''}
                  onChange={(e) => updateEmployee(index, 'extraCost', e.target.value ? Number(e.target.value) : undefined)}
                  inputProps={{ min: 0, step: 1000 }}
                  placeholder="Ej: 5000"
                />
              </Grid>
              
              <Grid item xs={3}>
                <Typography variant="body2" fontWeight="bold">
                  {(() => {
                    const isMultiDay = eventDays > 1
                    if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
                      return formatCurrency(calculateEmployeeCostForEvent(input.employee, formData.dailySchedules, input.includeARL, input.extraCost))
                    } else {
                      return formatCurrency(calculateEmployeeCostWithExtra(input.employee, input.hours, input.includeARL, input.extraCost))
                    }
                  })()}
                </Typography>
                {input.extraCost && input.extraCost > 0 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    (+{formatCurrency(input.extraCost)} extra)
                  </Typography>
                )}
                {eventDays > 1 && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {hasVariableHours() ? (
                      // Show detailed breakdown for variable hours
                      getHoursBreakdown()?.map(day => 
                        `Día ${day.day}: ${day.hours}h`
                      ).join(', ')
                    ) : (
                      // Show simple format for uniform hours
                      `({eventDays} días × ${hoursPerDay}h/día)`
                    )}
                  </Typography>
                )}
              </Grid>
              
              <Grid item xs={1}>
                <Button
                  size="small"
                  onClick={() => removeEmployee(index)}
                  color="error"
                >
                  <RemoveIcon />
                </Button>
              </Grid>
              
              {/* Campo de razón del costo extra */}
              {input.extraCost && input.extraCost > 0 && (
                <Grid item xs={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Razón del costo extra (opcional)"
                    value={input.extraCostReason || ''}
                    onChange={(e) => updateEmployee(index, 'extraCostReason', e.target.value || undefined)}
                    placeholder="Ej: ARL, bonificación, costo de transporte, etc."
                  />
                </Grid>
              )}
              
              {/* Productos asociados */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Productos Asociados (Requerido)</InputLabel>
                  <Select
                    multiple
                    value={input.selectedProductIds || []}
                    label="Productos Asociados (Requerido)"
                    onChange={(e) => {
                      const selectedIds = Array.isArray(e.target.value) ? e.target.value : [e.target.value]
                      updateEmployee(index, 'selectedProductIds', selectedIds.map(Number))
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as number[]).map((productId) => {
                          const product = formData.productInputs.find(p => p.product.id === productId)
                          return (
                            <Chip
                              key={productId}
                              label={product?.product.name || `Producto ${productId}`}
                              size="small"
                              color="primary"
                            />
                          )
                        })}
                      </Box>
                    )}
                  >
                    {formData.productInputs.length === 0 ? (
                      <MenuItem value="" disabled>
                        Primero agregue productos para asociar empleados
                      </MenuItem>
                    ) : (
                      formData.productInputs.map((productInput, productIndex) => (
                        <MenuItem key={productInput.product.id} value={productInput.product.id}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography>
                              {productInput.product.name}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* Disponibilidad */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <EmployeeAvailabilityIndicator
                  employeeId={input.employee.id}
                  date={formData.eventStartDate}
                  hours={input.hours}
                />
              </Grid>
            </Grid>
          </Box>
        </ListItem>
      ))}
    </List>
  )

  const renderEmployeesByEvent = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          <Typography variant="body2">
            📅 Configure las fechas del evento para ver la vista por días
          </Typography>
        </Alert>
      )
    }

    const isMultiDay = new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay && (!formData.selectedDays || formData.selectedDays.length === 0)) {
      return (
        <Alert severity="warning" sx={{ m: 2 }}>
          <Typography variant="body2">
            📅 Seleccione días específicos para ver la distribución de empleados
          </Typography>
        </Alert>
      )
    }

    const eventDays = isMultiDay ? formData.selectedDays || [] : [formData.eventStartDate]
    
    return (
      <Box sx={{ p: 2 }}>
        {eventDays.map((date, dayIndex) => {
          const daySchedule = formData.dailySchedules.find(schedule => schedule.date === date)
          const dayName = formatDateForDisplay(date)
          
          return (
            <Box key={date} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📅 {dayName}
              </Typography>
              
              {daySchedule && daySchedule.startTime && daySchedule.endTime && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  🕐 {formatTimeForDisplay(daySchedule.startTime)} - {formatTimeForDisplay(daySchedule.endTime)}
                </Typography>
              )}
              
              <Box sx={{ ml: 2 }}>
                {formData.employeeInputs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hay empleados asignados para este día
                  </Typography>
                ) : (
                  formData.employeeInputs.map((input, empIndex) => (
                    <Box key={empIndex} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        👤 {input.employee.name} ({input.employee.employee_type})
                      </Typography>
                      
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={4}>
                          <Typography variant="body2">
                            ⏱️ <strong>Horas:</strong> {(() => {
                              if (eventDays > 1) {
                                if (hasVariableHours()) {
                                  // Show variable hours breakdown
                                  return getHoursBreakdown()?.map(day => 
                                    `${day.hours}h`
                                  ).join(' + ') + ` (${eventDays} días)`
                                } else {
                                  // Show uniform hours
                                  return `${hoursPerDay}h/día × ${eventDays} días`
                                }
                              } else {
                                return `${input.hours}h`
                              }
                            })()}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <Typography variant="body2">
                            💰 <strong>Costo:</strong> {(() => {
                              const isMultiDay = eventDays > 1
                              if (isMultiDay && formData.dailySchedules && formData.dailySchedules.length > 0) {
                                return formatCurrency(calculateEmployeeCostForEvent(input.employee, formData.dailySchedules, input.includeARL, input.extraCost))
                              } else {
                                return formatCurrency(calculateEmployeeCostWithExtra(input.employee, input.hours, input.includeARL, input.extraCost))
                              }
                            })()}
                            {input.includeARL && input.employee.has_arl && (
                              <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                                {' '}(+ARL)
                              </Typography>
                            )}
                            {input.extraCost && input.extraCost > 0 && (
                              <Typography component="span" variant="caption" sx={{ color: 'text.secondary' }}>
                                {' '}(+{formatCurrency(input.extraCost)} extra)
                              </Typography>
                            )}
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={4}>
                          <EmployeeAvailabilityIndicator
                            employeeId={input.employee.id}
                            date={date}
                            hours={input.hours}
                          />
                        </Grid>
                        
                        {input.selectedProductIds && input.selectedProductIds.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">
                              🍽️ Productos asignados:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {input.selectedProductIds.map(productId => {
                                const product = formData.productInputs.find(p => p.product.id === productId)
                                return (
                                  <Chip
                                    key={productId}
                                    label={product?.product.name || `Producto ${productId}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                )
                              })}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>
                  ))
                )}
              </Box>
              
              {dayIndex < eventDays.length - 1 && <Divider sx={{ my: 2 }} />}
            </Box>
          )
        })}
      </Box>
    )
  }

  return (
    <Card>
      <CardHeader 
        title="👥 Empleados"
        action={
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={viewMode === 'by_event'}
                  onChange={(e) => setViewMode(e.target.checked ? 'by_event' : 'by_employee')}
                  size="small"
                />
              }
              label={
                <Typography variant="caption">
                  {viewMode === 'by_employee' ? '👤 Por Empleado' : '📅 Por Evento'}
                </Typography>
              }
            />
            <Button
              startIcon={<AddIcon />}
              onClick={addEmployee}
              size="small"
            >
              Agregar
            </Button>
          </Box>
        }
      />
      <Alert severity={hasCompleteEventInfo ? "info" : "warning"} sx={{ m: 2, mb: 0 }}>
        <Typography variant="caption">
          {hasCompleteEventInfo ? 
            `✅ Evento: ${getEventSummary()} = ${(() => {
              if (eventDays > 1) {
                if (hasVariableHours()) {
                  // Show variable hours breakdown
                  const breakdown = getHoursBreakdown()?.map(day => `${day.hours}h`).join(' + ')
                  return `${breakdown} (${eventDays} días, ${eventHours}h totales)`
                } else {
                  // Show uniform hours
                  return `${hoursPerDay}h/día × ${eventDays} días (${eventHours}h totales)`
                }
              } else {
                return `${eventHours}h`
              }
            })()} por empleado` +
            (formData.employeeInputs.length > 0 ? ` • Total empleados: ${formatCurrency(totalEmployeesCost)}` : '') :
            hasEventDates ? 
              new Date(formData.eventEndDate) > new Date(formData.eventStartDate) ?
                (!formData.selectedDays || formData.selectedDays.length === 0) ?
                  '⚠️ Selecciona días específicos del evento multi-día' :
                  '⚠️ Configura horarios para los días seleccionados' :
                '⚠️ Selecciona horas de inicio y fin del evento para calcular horas de operarios' :
              '⚠️ Selecciona fechas y horarios del evento para calcular horas de operarios automáticamente'
          }
        </Typography>
      </Alert>
      <CardContent sx={{ p: 0 }}>
        {viewMode === 'by_employee' ? renderEmployeesByEmployee() : renderEmployeesByEvent()}
        
        {formData.employeeInputs.length === 0 && viewMode === 'by_employee' && (
          <List>
            <ListItem>
              <ListItemText 
                primary="No hay empleados agregados"
                secondary={hasCompleteEventInfo ? 
                  "Agrega empleados para calcular costos" : 
                  hasEventDates ?
                    new Date(formData.eventEndDate) > new Date(formData.eventStartDate) ?
                      "Selecciona días específicos y configura horarios, luego agrega empleados" :
                      "Configura horarios del evento, luego agrega empleados" :
                    "Configura fechas y horarios del evento, luego agrega empleados"
                }
              />
            </ListItem>
          </List>
        )}
      </CardContent>
    </Card>
  )
}

export default PricingEmployeeManagement
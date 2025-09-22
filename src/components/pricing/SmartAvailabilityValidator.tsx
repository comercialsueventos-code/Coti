import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  Collapse,
  LinearProgress,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  CheckCircle as AvailableIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  SwapHoriz as ReplaceIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  TrendingUp as ScoreIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  AutoFixHigh as MagicIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material'
import { usePricingScheduling } from '../../hooks/useSmartScheduling'
import { useEmployees } from '../../hooks/useEmployees'
import { EmployeeSchedulingService } from '../../services/employee-scheduling.service'
import { PricingFormData } from '../types'
import moment from 'moment'

interface SmartAvailabilityValidatorProps {
  formData: PricingFormData
  onEmployeeReplace: (oldEmployeeId: number, newEmployeeId: number) => void
  onAutoOptimize: (suggestions: any[]) => void
}

const SmartAvailabilityValidator: React.FC<SmartAvailabilityValidatorProps> = ({
  formData,
  onEmployeeReplace,
  onAutoOptimize
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsDialog, setSuggestionsDialog] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState<any>(null)

  // Get all employees data for name resolution
  const { data: allEmployees = [] } = useEmployees()

  // 🔥 FIX: Calculate total hours for multi-day events (FIXED - Story 1.4)
  const calculateHoursPerDay = () => {
    const isMultiDay = formData.eventEndDate && new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay && formData.dailySchedules.length > 0) {
      // Multi-day event: return total hours (not average per day)
      let totalHours = 0
      let daysWithSchedule = 0
      
      formData.dailySchedules.forEach(daySchedule => {
        if (daySchedule.startTime && daySchedule.endTime) {
          const [startHour, startMinute] = daySchedule.startTime.split(':').slice(0, 2).map(Number)
          const [endHour, endMinute] = daySchedule.endTime.split(':').slice(0, 2).map(Number)
          
          const startMinutes = startHour * 60 + startMinute
          const endMinutes = endHour * 60 + endMinute
          
          let hoursPerDay = (endMinutes - startMinutes) / 60
          if (hoursPerDay < 0) hoursPerDay += 24 // Handle overnight events
          
          totalHours += Math.max(0.5, hoursPerDay)
          daysWithSchedule++
        }
      })
      
      // Fix: Return total hours for multiday events, not average per day
      return Math.round(totalHours * 2) / 2 // Round total hours to nearest 0.5 hour
    } else if (formData.eventStartTime && formData.eventEndTime) {
      // Single-day event
      const [startHour, startMinute] = formData.eventStartTime.split(':').slice(0, 2).map(Number)
      const [endHour, endMinute] = formData.eventEndTime.split(':').slice(0, 2).map(Number)
      
      const startMinutes = startHour * 60 + startMinute
      const endMinutes = endHour * 60 + endMinute
      
      let hours = (endMinutes - startMinutes) / 60
      if (hours < 0) hours += 24 // Handle overnight events
      
      return Math.max(0.5, Math.round(hours * 2) / 2)
    }
    return 8 // Default
  }

  // Calculate number of event days
  const calculateEventDays = () => {
    const isMultiDay = formData.eventEndDate && new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    if (isMultiDay && formData.dailySchedules.length > 0) {
      return formData.dailySchedules.filter(daySchedule => 
        daySchedule.startTime && daySchedule.endTime
      ).length
    }
    
    return 1 // Single day event
  }

  // 🔥 FIX: Calculate event duration for display (FIXED - Story 1.4)
  const calculateEventDuration = () => {
    const isMultiDay = formData.eventEndDate && new Date(formData.eventEndDate) > new Date(formData.eventStartDate)
    
    // For multiday events with individual schedules, calculateHoursPerDay() already returns total
    if (isMultiDay && formData.dailySchedules.length > 0) {
      return calculateHoursPerDay() // Already returns total hours, don't multiply
    }
    
    // For single-day events, multiply hours by days (backward compatibility)
    return calculateHoursPerDay() * calculateEventDays()
  }

  const eventDuration = calculateEventDuration()
  const isMultiDayEvent = formData.eventEndDate && new Date(formData.eventEndDate) > new Date(formData.eventStartDate)

  // Enrich employee data with real information
  const enrichedEmployees = useMemo(() => {
    return (formData.employees || formData.employeeInputs?.map(emp => ({ 
      id: emp.employee?.id || emp.id, 
      employee_type: emp.employee?.employee_type || emp.employee_type || 'unknown',
      hours: emp.hours || eventDuration
    })) || []).map(emp => {
      const realEmployee = allEmployees.find(e => e.id === emp.id)
      return {
        ...emp,
        name: realEmployee?.name || `Empleado ${emp.id}`,
        realEmployee: realEmployee
      }
    })
  }, [formData.employees, formData.employeeInputs, eventDuration, allEmployees])

  // Get event dates to validate (single day or multiple days)
  const eventDates = useMemo(() => {
    if (isMultiDayEvent && formData.selectedDays && formData.selectedDays.length > 0) {
      return formData.selectedDays
    } else if (formData.eventStartDate) {
      return [formData.eventStartDate]
    }
    return []
  }, [isMultiDayEvent, formData.selectedDays, formData.eventStartDate])

  // For multi-day events, validate the first date (primary validation)
  const primaryDate = eventDates[0] || formData.eventStartDate
  
  const smartScheduling = usePricingScheduling(
    primaryDate,
    eventDuration,
    enrichedEmployees
  )

  const {
    result,
    isLoading,
    validationResults,
    allSelectedAvailable,
    conflictedSelections,
    getSuggestionsForConflicts,
    refresh,
    lastUpdated
  } = smartScheduling

  // Multi-day validation state
  const [multiDayValidation, setMultiDayValidation] = useState<{
    [date: string]: { available: number; conflicts: number; employees: any[] }
  }>({})
  const [isValidating, setIsValidating] = useState(false)

  // 🚀 PERFORMANCE: Debounced validation for multi-day events to prevent request storms
  useEffect(() => {
    if (isMultiDayEvent && eventDates.length > 1 && enrichedEmployees.length > 0 && !isValidating) {
      setIsValidating(true)
      // Debounce validation to prevent excessive API calls
      const timeoutId = setTimeout(async () => {
        const validationMap: typeof multiDayValidation = {}
        
        // Batch all availability checks to reduce API calls
        const validationPromises = eventDates.map(async (date) => {
          try {
            // Get daily schedule for this date
            const daySchedule = formData.dailySchedules.find(schedule => schedule.date === date)
            if (!daySchedule || !daySchedule.startTime || !daySchedule.endTime) return null

            // Batch employee availability checks for this date
            const employeePromises = enrichedEmployees.map(async (emp) => {
              try {
                const availability = await EmployeeSchedulingService.checkAvailability(
                  emp.id,
                  date,
                  eventDuration <= 4 ? 'morning' : eventDuration <= 8 ? 'afternoon' : 'full_day'
                )
                
                return {
                  employee: emp,
                  isAvailable: availability.is_available,
                  conflictReason: availability.conflict_reason
                }
              } catch (error) {
                console.warn(`Error checking availability for employee ${emp.id} on ${date}:`, error)
                return {
                  employee: emp,
                  isAvailable: false,
                  conflictReason: 'Error al verificar disponibilidad'
                }
              }
            })

            const employeeStatuses = await Promise.all(employeePromises)
            const available = employeeStatuses.filter(status => status.isAvailable).length
            const conflicts = employeeStatuses.filter(status => !status.isAvailable).length

            return { date, validation: { available, conflicts, employees: employeeStatuses } }
          } catch (error) {
            console.warn(`Error validating date ${date}:`, error)
            return null
          }
        })

        const results = await Promise.all(validationPromises)
        
        // Build validation map from results
        results.forEach(result => {
          if (result) {
            validationMap[result.date] = result.validation
          }
        })
        
        setMultiDayValidation(validationMap)
        setIsValidating(false)
      }, 300) // 300ms debounce

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [isMultiDayEvent, eventDates, enrichedEmployees, formData.dailySchedules])

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      refresh()
    }, 60000)
    return () => clearInterval(interval)
  }, [refresh])

  const getStatusIcon = (isAvailable: boolean, hasAlternatives: boolean = false) => {
    if (isAvailable) {
      return <AvailableIcon color="success" />
    } else if (hasAlternatives) {
      return <WarningIcon color="warning" />
    } else {
      return <ErrorIcon color="error" />
    }
  }

  const getStatusColor = (isAvailable: boolean, hasAlternatives: boolean = false): "success" | "warning" | "error" => {
    if (isAvailable) return "success"
    if (hasAlternatives) return "warning"
    return "error"
  }

  const formatTime = (date: Date) => {
    return moment(date).format('HH:mm:ss')
  }

  const conflictSuggestions = getSuggestionsForConflicts()

  if (!formData.eventStartDate || enrichedEmployees.length === 0) {
    return null
  }

  return (
    <Card sx={{ mt: 2, border: allSelectedAvailable ? '2px solid #4caf50' : '2px solid #f44336' }}>
      <CardContent>
        {/* Header with real-time status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6">
              🧠 Validación Inteligente de Disponibilidad Ultra-Smart
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sistema de IA analizando {enrichedEmployees.length} empleados para evento de {eventDuration}h
            </Typography>
            {isLoading && <LinearProgress sx={{ width: 50, height: 2 }} />}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Actualizado: {formatTime(lastUpdated)}
            </Typography>
            <Tooltip title="Actualizar disponibilidad">
              <IconButton size="small" onClick={() => refresh()}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Smart Analytics Panel */}
        <Box sx={{ mb: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="info.main" gutterBottom>
            📊 Análisis Inteligente en Tiempo Real
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Empleados:</Typography>
              <Typography variant="body2" fontWeight="bold">{enrichedEmployees.length}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Duración Evento:</Typography>
              <Typography variant="body2" fontWeight="bold">{eventDuration}h</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Tipo Turno:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {eventDuration <= 8 ? '🌅 Parcial' : '☀️ Completo'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Estado General:</Typography>
              <Typography variant="body2" fontWeight="bold" color={allSelectedAvailable ? 'success.main' : 'error.main'}>
                {allSelectedAvailable ? '✅ Óptimo' : '⚠️ Requiere Atención'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Costo Total Horas:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {enrichedEmployees.reduce((total, emp) => total + emp.hours, 0)}h
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Overall Status Alert */}
        {allSelectedAvailable ? (
          <Alert 
            severity="success" 
            icon={<AvailableIcon />}
            sx={{ mb: 2 }}
            action={
              <Button 
                size="small" 
                startIcon={<MagicIcon />}
                onClick={() => setSuggestionsDialog(true)}
              >
                Ver Optimizaciones
              </Button>
            }
          >
            <Typography variant="body2" fontWeight="bold">
              {isMultiDayEvent ? (
                <>
                  ✅ Validación completa para evento multi-día
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {eventDates.length} días configurados • {eventDuration}h totales por empleado
                  </Typography>
                  {Object.keys(multiDayValidation).length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {eventDates.map(date => {
                        const validation = multiDayValidation[date]
                        if (!validation) return null
                        
                        const daySchedule = formData.dailySchedules.find(schedule => schedule.date === date)
                        const allAvailable = validation.available === enrichedEmployees.length
                        
                        return (
                          <Typography key={date} variant="caption" display="block">
                            {allAvailable ? '✅' : '⚠️'} {moment(date).format('DD/MM')} 
                            ({validation.available}/{enrichedEmployees.length} disponibles)
                            {daySchedule && ` • ${daySchedule.startTime?.slice(0,5)} - ${daySchedule.endTime?.slice(0,5)}`}
                          </Typography>
                        )
                      })}
                    </Box>
                  )}
                </>
              ) : (
                <>
                  ✅ Todos los empleados están disponibles para {moment(formData.eventStartDate).format('DD/MM/YYYY')}
                  <Typography variant="caption" display="block">
                    Turno: {eventDuration <= 8 ? 'Parcial' : 'Completo'} ({eventDuration}h) • 
                    {enrichedEmployees.length} empleados seleccionados • 
                    Fecha: {moment(formData.eventStartTime || '08:00', 'HH:mm').format('HH:mm')} - {moment(formData.eventEndTime || '16:00', 'HH:mm').format('HH:mm')}
                  </Typography>
                </>
              )}
            </Typography>
          </Alert>
        ) : (
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ mb: 2 }}
            action={
              <Button 
                size="small" 
                startIcon={<ReplaceIcon />}
                onClick={() => setShowSuggestions(true)}
                disabled={conflictSuggestions.length === 0}
              >
                Ver Sugerencias
              </Button>
            }
          >
            <Typography variant="body2" fontWeight="bold">
              ⚠️ {conflictedSelections.length} empleado(s) no disponible(s)
            </Typography>
            <Typography variant="caption">
              Algunas asignaciones tienen conflictos. Revisa las sugerencias automáticas.
            </Typography>
          </Alert>
        )}

        {/* Employee Status List */}
        <List dense>
          {enrichedEmployees.map((employee) => {
            const status = validationResults[employee.id]
            if (!status) {
              // If no status yet, show loading state with real employee name
              return (
                <ListItem 
                  key={employee.id}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'grey.50'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'grey.400' }}>
                      <RefreshIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="bold">
                          {employee.name}
                        </Typography>
                        <Chip 
                          label={employee.employee_type} 
                          size="small" 
                          variant="outlined"
                        />
                        <Chip 
                          label={`${employee.hours}h`} 
                          size="small" 
                          color="info" 
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary="🔄 Verificando disponibilidad..."
                  />
                </ListItem>
              )
            }

            const hasAlternatives = status.alternativeShifts && status.alternativeShifts.length > 0

            return (
              <ListItem 
                key={employee.id}
                sx={{ 
                  border: '1px solid',
                  borderColor: status.isAvailable ? 'success.main' : hasAlternatives ? 'warning.main' : 'error.main',
                  borderRadius: 1,
                  mb: 1,
                  bgcolor: status.isAvailable ? 'success.light' : hasAlternatives ? 'warning.light' : 'error.light'
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: status.isAvailable ? 'success.main' : hasAlternatives ? 'warning.main' : 'error.main' }}>
                    {getStatusIcon(status.isAvailable, hasAlternatives)}
                  </Avatar>
                </ListItemAvatar>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {employee.name}
                      </Typography>
                      <Chip 
                        label={employee.employee_type} 
                        size="small" 
                        variant="outlined"
                      />
                      <Chip 
                        label={`${employee.hours}h`} 
                        size="small" 
                        color="info" 
                        variant="outlined"
                      />
                      {status.recommendationScore > 0 && (
                        <Tooltip title={`Puntaje de recomendación: ${status.recommendationScore}/100`}>
                          <Badge badgeContent={status.recommendationScore} color="primary" max={100}>
                            <ScoreIcon fontSize="small" />
                          </Badge>
                        </Tooltip>
                      )}
                    </Box>
                  }
                  secondary={
                    <span>
                      {status.isAvailable ? (
                        <Typography variant="caption" color="success.main" component="span">
                          ✅ Disponible - Listo para asignar automáticamente
                        </Typography>
                      ) : (
                        <span>
                          <Typography variant="caption" color="error.main" component="span">
                            ❌ {status.conflictReason}
                          </Typography>
                          {status.conflictingQuote && (
                            <Typography variant="caption" display="block" component="span">
                              <br />📄 Conflicto: {status.conflictingQuote.quote_number} - {status.conflictingQuote.event_title}
                            </Typography>
                          )}
                          {hasAlternatives && (
                            <Typography variant="caption" color="warning.main" display="block" component="span">
                              <br />💡 Alternativas: {status.alternativeShifts!.map(shift => 
                                shift === 'morning' ? 'Mañana' : 
                                shift === 'afternoon' ? 'Tarde' : 
                                'Día Completo'
                              ).join(', ')}
                            </Typography>
                          )}
                        </span>
                      )}
                    </span>
                  }
                />

                {!status.isAvailable && (
                  <Tooltip title="Ver sugerencias de reemplazo inteligente">
                    <IconButton 
                      edge="end"
                      onClick={() => {
                        setSelectedConflict(employee.id)
                        setShowSuggestions(true)
                      }}
                    >
                      <ReplaceIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItem>
            )
          })}
        </List>

        {/* Ultra-Smart Help Section */}
        {enrichedEmployees.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px dashed', borderColor: 'grey.300' }}>
            <Typography variant="subtitle2" fontWeight="bold" color="primary.main" gutterBottom>
              🤖 Sistema Ultra-Inteligente Activo
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • <strong>Auto-Reserva:</strong> Al guardar la cotización, estos empleados se reservarán automáticamente
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • <strong>Verificación en Tiempo Real:</strong> Actualizamos la disponibilidad cada 30 segundos
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • <strong>Sugerencias IA:</strong> El sistema sugiere los mejores reemplazos basado en historial y carga de trabajo
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • <strong>Auto-Liberación:</strong> Si rechazas la cotización, los empleados se liberan automáticamente
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              • <strong>Optimización Continua:</strong> El sistema aprende de los patrones para mejorar las recomendaciones
            </Typography>
          </Box>
        )}

        {/* Smart Suggestions Collapse */}
        <Collapse in={showSuggestions}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle2">
                🤖 Sugerencias Inteligentes de Reemplazo
              </Typography>
              <IconButton size="small" onClick={() => setShowSuggestions(false)}>
                <CollapseIcon />
              </IconButton>
            </Box>

            {conflictSuggestions.map((conflict) => (
              <Box key={conflict.conflictedEmployeeId} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Reemplazos para empleado con conflicto:
                </Typography>
                <List dense>
                  {conflict.suggestions.slice(0, 3).map((suggestion) => (
                    <ListItem 
                      key={suggestion.employee.id}
                      sx={{ bgcolor: 'success.light', borderRadius: 1, mb: 1 }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main' }}>
                          <AvailableIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2">
                              {suggestion.employee.name}
                            </Typography>
                            <Chip 
                              label={suggestion.employee.employee_type} 
                              size="small" 
                              color="success" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${suggestion.recommendationScore}pts`}
                              size="small"
                              color="primary"
                            />
                          </Box>
                        }
                        secondary={`Disponible • Puntaje: ${suggestion.recommendationScore}/100`}
                      />
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => {
                          onEmployeeReplace(conflict.conflictedEmployeeId, suggestion.employee.id)
                          setShowSuggestions(false)
                        }}
                      >
                        Reemplazar
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            ))}

            {conflictSuggestions.length === 0 && (
              <Alert severity="info">
                No hay sugerencias de reemplazo disponibles para los conflictos actuales.
              </Alert>
            )}
          </Box>
        </Collapse>
      </CardContent>

      {/* Auto-Optimization Dialog */}
      <Dialog 
        open={suggestionsDialog} 
        onClose={() => setSuggestionsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          🧠 Optimizaciones Inteligentes del Equipo
        </DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Typography variant="body2" gutterBottom>
                El sistema ha analizado la disponibilidad y puede sugerir optimizaciones para tu equipo:
              </Typography>
              
              {smartScheduling.generateTeamSuggestions(enrichedEmployees.length).map((suggestion, index) => (
                <Card key={index} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {suggestion.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {suggestion.reason}
                    </Typography>
                    <List dense>
                      {suggestion.employees.map((emp) => (
                        <ListItem key={emp.employee.id}>
                          <ListItemText 
                            primary={emp.employee.name}
                            secondary={`${emp.employee.employee_type} • Score: ${emp.recommendationScore}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        onAutoOptimize(suggestion.employees)
                        setSuggestionsDialog(false)
                      }}
                    >
                      Aplicar Esta Sugerencia
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {smartScheduling.generateTeamSuggestions(enrichedEmployees.length).length === 0 && (
                <Alert severity="info">
                  Tu equipo actual ya está optimizado para las condiciones actuales.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSuggestionsDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default SmartAvailabilityValidator
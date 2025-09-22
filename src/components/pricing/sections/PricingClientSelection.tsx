import React, { useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
  Box,
  Button,
  Divider,
  Chip,
  FormControlLabel,
  Checkbox,
  Switch
} from '@mui/material'
import { Assignment as AssignmentIcon, Schedule as ScheduleIcon, CalendarMonth as CalendarIcon } from '@mui/icons-material'
import { useActiveClients } from '../../../hooks/useClients'
import { useActiveTransportZones } from '../../../hooks/useTransport'
import { useCityDropdownData } from '../../../hooks/useCities'
import { PricingFormProps, DaySchedule, TransportAllocation, TransportZoneInput } from '../types'
import TransportValidationErrorBoundary, { useTransportValidationError } from './TransportValidationErrorBoundary'
import MultiTransportZoneSelector from './components/MultiTransportZoneSelector'

const PricingClientSelection: React.FC<PricingFormProps> = ({ formData, updateFormData }) => {
  const { data: clients = [] } = useActiveClients()
  const { data: transportZones = [] } = useActiveTransportZones()
  const { dropdownOptions: cityOptions, isLoading: citiesLoading } = useCityDropdownData()
  const { throwTransportError } = useTransportValidationError()

  // Utility function for consistent date parsing
  const parseDate = (dateString: string): Date | null => {
    if (!dateString || typeof dateString !== 'string') return null
    
    const parts = dateString.split('-')
    if (parts.length !== 3) return null
    
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1 // Month is 0-indexed
    const day = parseInt(parts[2])
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null
    if (year < 2000 || year > 2100) return null
    if (month < 0 || month > 11) return null
    if (day < 1 || day > 31) return null
    
    const date = new Date(year, month, day)
    // Validate the date actually exists (handles invalid dates like Feb 30)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return null
    }
    
    return date
  }

  // Utility function for consistent date formatting
  const formatDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = parseDate(dateString)
    if (!date) return 'Fecha inválida'
    
    return date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return ''
    // Remove seconds from time display (HH:MM:SS -> HH:MM)
    return timeString.split(':').slice(0, 2).join(':')
  }

  const calculateEventDuration = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) return null
    
    const startDate = parseDate(formData.eventStartDate)
    const endDate = parseDate(formData.eventEndDate)
    
    if (!startDate || !endDate) return null
    if (endDate < startDate) return null
    
    const diffInDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return diffInDays
  }

  const isMultiDayEvent = () => {
    const duration = calculateEventDuration()
    return duration && duration > 1
  }

  const generateDateRange = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) return []
    
    const startDate = parseDate(formData.eventStartDate)
    const endDate = parseDate(formData.eventEndDate)
    
    if (!startDate || !endDate) return []
    if (endDate < startDate) return []
    
    const dates = []
    const currentDate = new Date(startDate)
    
    // Prevent infinite loops for very large date ranges
    const maxDays = 365 // Maximum 1 year range
    let dayCount = 0
    
    while (currentDate <= endDate && dayCount < maxDays) {
      dates.push(formatDateString(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
      dayCount++
    }
    
    return dates
  }

  const getDayName = (dateString: string) => {
    const date = parseDate(dateString)
    if (!date) return 'Día inválido'
    
    return date.toLocaleDateString('es-CO', { weekday: 'long' })
  }

  // Memoized calculations for performance optimization
  const eventDuration = useMemo(() => calculateEventDuration(), [formData.eventStartDate, formData.eventEndDate])
  
  const isMultiDay = useMemo(() => {
    return eventDuration && eventDuration > 1
  }, [eventDuration])
  
  const dateRange = useMemo(() => generateDateRange(), [formData.eventStartDate, formData.eventEndDate])

  // Auto-generate daily schedules when selected days change
  useEffect(() => {
    if (isMultiDay && formData.selectedDays && formData.selectedDays.length > 0) {
      // Check if schedules need to be generated or updated
      const currentScheduleDates = new Set(formData.dailySchedules.map(schedule => schedule.date))
      const selectedDaysSet = new Set(formData.selectedDays)
      
      // Check if schedules are missing or have extra days
      const needsUpdate = formData.dailySchedules.length !== formData.selectedDays.length ||
        !formData.selectedDays.every(day => currentScheduleDates.has(day)) ||
        formData.dailySchedules.some(schedule => !selectedDaysSet.has(schedule.date))
      
      if (needsUpdate) {
        // Generate schedules for all selected days
        const schedules: DaySchedule[] = formData.selectedDays.map(date => {
          // Preserve existing schedule times if they exist
          const existingSchedule = formData.dailySchedules.find(schedule => schedule.date === date)
          return {
            date,
            startTime: existingSchedule?.startTime || formData.eventStartTime || '',
            endTime: existingSchedule?.endTime || formData.eventEndTime || ''
          }
        })
        
        updateFormData('dailySchedules', schedules)
      }
    } else if (!isMultiDay) {
      // Clear daily schedules for single-day events
      if (formData.dailySchedules.length > 0) {
        updateFormData('dailySchedules', [])
      }
    }
  }, [isMultiDay, formData.selectedDays, formData.eventStartTime, formData.eventEndTime, formData.dailySchedules, updateFormData])

  const handleSelectAllDays = () => {
    updateFormData('selectedDays', dateRange)
  }

  const handleDeselectAllDays = () => {
    updateFormData('selectedDays', [])
  }

  const handleToggleDay = (dateString: string) => {
    const currentSelected = formData.selectedDays || []
    const isSelected = currentSelected.includes(dateString)
    
    if (isSelected) {
      updateFormData('selectedDays', currentSelected.filter(d => d !== dateString))
    } else {
      updateFormData('selectedDays', [...currentSelected, dateString].sort())
    }
  }

  const generateDailySchedules = () => {
    if (!formData.eventStartDate || !formData.eventEndDate) return
    
    // Use selected days if available, otherwise generate for all days in range
    const datesToSchedule = formData.selectedDays && formData.selectedDays.length > 0 
      ? formData.selectedDays 
      : generateDateRange()
    
    const schedules: DaySchedule[] = datesToSchedule.map(date => ({
      date,
      startTime: formData.eventStartTime || '',
      endTime: formData.eventEndTime || ''
    }))
    
    updateFormData('dailySchedules', schedules)
  }

  const updateDaySchedule = (dayIndex: number, field: keyof DaySchedule, value: string) => {
    const updatedSchedules = [...formData.dailySchedules]
    updatedSchedules[dayIndex] = {
      ...updatedSchedules[dayIndex],
      [field]: value
    }
    
    // If updating start time and end time is before start time, clear end time
    if (field === 'startTime' && updatedSchedules[dayIndex].endTime) {
      // Ensure both times have seconds format for comparison
      const endTimeWithSeconds = updatedSchedules[dayIndex].endTime.includes(':') && updatedSchedules[dayIndex].endTime.split(':').length === 2 
        ? `${updatedSchedules[dayIndex].endTime}:00` 
        : updatedSchedules[dayIndex].endTime
      
      if (value >= endTimeWithSeconds) {
        updatedSchedules[dayIndex].endTime = ''
      }
    }
    
    updateFormData('dailySchedules', updatedSchedules)
  }

  const generateTimeOptions = () => {
    return Array.from({length: 48}, (_, i) => {
      const hour = Math.floor(i / 2)
      const minute = (i % 2) * 30
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      const timeStringWithSeconds = `${timeString}:00`
      return { value: timeStringWithSeconds, label: timeString }
    })
  }

  const getFilteredEndTimes = (startTime: string) => {
    if (!startTime) return generateTimeOptions()
    
    // Ensure startTime has seconds format for comparison
    const startTimeWithSeconds = startTime.includes(':') && startTime.split(':').length === 2 
      ? `${startTime}:00` 
      : startTime
    
    return generateTimeOptions().filter(option => option.value > startTimeWithSeconds)
  }

  const handleStartTimeChange = (value: string) => {
    updateFormData('eventStartTime', value)
    
    // If end time is before or equal to new start time, clear it
    // Ensure both times have seconds format for comparison
    const endTimeWithSeconds = formData.eventEndTime?.includes(':') && formData.eventEndTime.split(':').length === 2 
      ? `${formData.eventEndTime}:00` 
      : formData.eventEndTime
    
    if (endTimeWithSeconds && value >= endTimeWithSeconds) {
      updateFormData('eventEndTime', '')
    }
  }

  // Initialize manual allocations when transport or products change
  const initializeManualAllocations = () => {
    const selectedProducts = formData.transportProductIds?.length > 0 
      ? formData.productInputs.filter(p => formData.transportProductIds.includes(p.product.id))
      : formData.productInputs

    const allocations: TransportAllocation[] = selectedProducts.map(productInput => ({
      productId: productInput.product.id,
      quantity: 0
    }))

    updateFormData('transportAllocations', allocations)
  }

  // Update manual allocation for a specific product
  const updateAllocation = (productId: number, quantity: number) => {
    try {
      // Validate inputs
      if (typeof productId !== 'number' || productId <= 0) {
        throwTransportError('ID de producto inválido', {
          code: 'INVALID_PRODUCT_ID',
          severity: 'high',
          context: { productIds: [productId] }
        })
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        throwTransportError('Cantidad de transporte inválida', {
          code: 'INVALID_QUANTITY',
          severity: 'medium',
          context: { totalAllocated: quantity, productIds: [productId] }
        })
      }

      const maxTransports = formData.transportCount || 0
      if (quantity > maxTransports) {
        throwTransportError(`La cantidad no puede exceder ${maxTransports} transportes`, {
          code: 'QUANTITY_EXCEEDS_MAX',
          severity: 'medium',
          context: { 
            transportCount: maxTransports, 
            totalAllocated: quantity,
            productIds: [productId]
          }
        })
      }

      const currentAllocations = formData.transportAllocations || []
      const updatedAllocations = currentAllocations.map(allocation =>
        allocation.productId === productId
          ? { ...allocation, quantity: Math.max(0, Math.min(quantity, maxTransports)) }
          : allocation
      )
      
      updateFormData('transportAllocations', updatedAllocations)
    } catch (error) {
      // Re-throw transport validation errors, let error boundary handle them
      if (error instanceof Error && error.name === 'TransportValidationError') {
        throw error
      }
      
      // Handle unexpected errors
      throwTransportError('Error inesperado al actualizar asignación de transporte', {
        code: 'UNEXPECTED_ERROR',
        severity: 'critical',
        context: { 
          productIds: [productId],
          transportCount: formData.transportCount,
          zone: formData.selectedTransportZone
        }
      })
    }
  }

  // Calculate total allocated transports
  const getTotalAllocated = () => {
    return (formData.transportAllocations || []).reduce((total, allocation) => total + allocation.quantity, 0)
  }

  // Get validation status for manual allocations
  const getValidationStatus = () => {
    const totalAllocated = getTotalAllocated()
    const totalTransports = formData.transportCount || 0
    
    if (totalAllocated === totalTransports) return { isValid: true, message: '✅ Distribución correcta' }
    if (totalAllocated > totalTransports) return { isValid: false, message: `⚠️ Excede por ${totalAllocated - totalTransports}` }
    return { isValid: false, message: `⚠️ Faltan ${totalTransports - totalAllocated} transportes` }
  }

  return (
    <Card>
      <CardHeader 
        title="📋 Información del Cliente y Evento"
        avatar={<AssignmentIcon color="primary" />}
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth required>
              <InputLabel>Cliente</InputLabel>
              <Select
                value={formData.selectedClient?.id || ''}
                label="Cliente"
                onChange={(e) => {
                  const client = clients.find(c => c.id === Number(e.target.value))
                  updateFormData('selectedClient', client || null)
                  // Clear selected contact when client changes
                  updateFormData('selectedContact', null)
                }}
              >
                <MenuItem value="">Selecciona un cliente</MenuItem>
                {clients.map((client) => (
                  <MenuItem key={client.id} value={client.id}>
                    {client.name || 'Cliente sin nombre'} ({client.email || 'Sin email'})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Contact Selection */}
          {formData.selectedClient && (
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Contacto</InputLabel>
                <Select
                  value={formData.selectedContact?.name || ''}
                  label="Contacto"
                  onChange={(e) => {
                    const contactName = e.target.value as string
                    const contact = formData.selectedClient?.contacts?.find(c => c.name === contactName)
                    updateFormData('selectedContact', contact || null)
                  }}
                >
                  <MenuItem value="">Seleccionar contacto</MenuItem>
                  {/* New contacts array */}
                  {formData.selectedClient.contacts?.map((contact, index) => (
                    <MenuItem key={index} value={contact.name}>
                      <Box>
                        <Typography variant="body2">
                          {contact.name}
                          {contact.is_primary && (
                            <Chip 
                              label="Principal" 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        {contact.position && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {contact.position}
                          </Typography>
                        )}
                        {(contact.phone || contact.email) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {contact.phone && contact.email 
                              ? `${contact.phone} • ${contact.email}`
                              : contact.phone || contact.email
                            }
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  {/* Legacy contact fallback */}
                  {(!formData.selectedClient.contacts || formData.selectedClient.contacts.length === 0) && 
                   (formData.selectedClient.contact_person || formData.selectedClient.phone || formData.selectedClient.email) && (
                    <MenuItem value={formData.selectedClient.contact_person || 'Contacto Principal'}>
                      <Box>
                        <Typography variant="body2">
                          {formData.selectedClient.contact_person || 'Contacto Principal'}
                          <Chip 
                            label="Legacy" 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        {(formData.selectedClient.phone || formData.selectedClient.email) && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formData.selectedClient.phone && formData.selectedClient.email 
                              ? `${formData.selectedClient.phone} • ${formData.selectedClient.email}`
                              : formData.selectedClient.phone || formData.selectedClient.email
                            }
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Nueva sección de múltiples zonas de transporte */}
          <Grid item xs={12}>
            <MultiTransportZoneSelector
              selectedTransportZones={formData.selectedTransportZones || []}
              productInputs={formData.productInputs || []}
              onUpdateTransportZones={(zones: TransportZoneInput[]) => {
                updateFormData('selectedTransportZones', zones)
                // Mantener compatibilidad con la implementación anterior
                if (zones.length > 0) {
                  updateFormData('selectedTransportZone', zones[0].zone)
                } else {
                  updateFormData('selectedTransportZone', null)
                }
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Evento"
              placeholder="Ej: Matrimonio María & Carlos, Evento Corporativo Tech Corp"
              variant="outlined"
              value={formData.eventName}
              onChange={(e) => updateFormData('eventName', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha de Inicio"
              type="date"
              value={formData.eventStartDate}
              onChange={(e) => updateFormData('eventStartDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Fecha de Fin"
              type="date"
              value={formData.eventEndDate}
              onChange={(e) => updateFormData('eventEndDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
              inputProps={{ min: formData.eventStartDate }}
            />
          </Grid>

          {!isMultiDayEvent() ? (
            <>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Hora de Inicio</InputLabel>
                  <Select
                    value={formData.eventStartTime}
                    label="Hora de Inicio"
                    onChange={(e) => handleStartTimeChange(e.target.value as string)}
                  >
                    {generateTimeOptions().map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={3}>
                <FormControl fullWidth required>
                  <InputLabel>Hora de Fin</InputLabel>
                  <Select
                    value={formData.eventEndTime}
                    label="Hora de Fin"
                    onChange={(e) => updateFormData('eventEndTime', e.target.value)}
                    disabled={!formData.eventStartTime}
                  >
                    {getFilteredEndTimes(formData.eventStartTime).map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          ) : (
            <Grid item xs={12} md={6}>
              <Alert severity="info" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon />
                <Box>
                  <Typography variant="body2">
                    <strong>Evento multi-día detectado</strong>
                  </Typography>
                  <Typography variant="caption">
                    Selecciona días específicos del evento abajo
                  </Typography>
                </Box>
              </Alert>
            </Grid>
          )}

          {/* Day Selection Section for Multi-day Events */}
          {isMultiDayEvent() && (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <CalendarIcon color="primary" />
                  <Typography variant="h6">
                    Seleccionar Días del Evento
                  </Typography>
                  <Box ml="auto" display="flex" gap={1}>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={handleSelectAllDays}
                      disabled={generateDateRange().length === 0}
                    >
                      Todos
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      onClick={handleDeselectAllDays}
                      disabled={!formData.selectedDays || formData.selectedDays.length === 0}
                    >
                      Ninguno
                    </Button>
                  </Box>
                </Box>
                
                <Grid container spacing={1}>
                  {generateDateRange().map((dateString) => {
                    const isSelected = formData.selectedDays?.includes(dateString) || false
                    return (
                      <Grid item xs={6} sm={4} md={3} key={dateString}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleToggleDay(dateString)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: isSelected ? 'bold' : 'normal' }}>
                                {getDayName(dateString)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDateForDisplay(dateString)}
                              </Typography>
                            </Box>
                          }
                        />
                      </Grid>
                    )
                  })}
                </Grid>

                {formData.selectedDays && formData.selectedDays.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Días seleccionados ({formData.selectedDays.length}):
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {formData.selectedDays.map((dateString) => (
                        <Chip
                          key={dateString}
                          label={`${getDayName(dateString)} ${new Date(dateString).getDate()}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          onDelete={() => handleToggleDay(dateString)}
                        />
                      ))}
                    </Box>
                    
                    {formData.dailySchedules.length === 0 && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          Los horarios se generarán automáticamente cuando selecciones los días del evento.
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={generateDailySchedules}
                          sx={{ mt: 1 }}
                          startIcon={<ScheduleIcon />}
                        >
                          Regenerar Horarios Manualmente
                        </Button>
                      </Alert>
                    )}
                  </Box>
                )}

                {(!formData.selectedDays || formData.selectedDays.length === 0) && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Selecciona al menos un día para continuar con la configuración del evento
                  </Alert>
                )}
              </Card>
            </Grid>
          )}

          {(formData.selectedClient || formData.eventName) && (
            <Grid item xs={12}>
              <Alert severity="info">
                <Typography variant="body2">
                  {formData.eventName && (
                    <>
                      🎉 <strong>Evento:</strong> {formData.eventName}
                      {formData.selectedClient && ' • '}
                    </>
                  )}
                  {formData.selectedClient && (
                    <>
                      👤 <strong>Cliente:</strong> {formData.selectedClient.name}
                      {formData.selectedContact && (
                        <>
                          {' • '}
                          <strong>Contacto:</strong> {formData.selectedContact.name}
                          {formData.selectedContact.position && ` (${formData.selectedContact.position})`}
                          {formData.selectedContact.is_primary && ' - Principal'}
                        </>
                      )}
                    </>
                  )}
                </Typography>
              </Alert>
            </Grid>
          )}

          {formData.eventStartDate && formData.eventEndDate && (
            <Grid item xs={12}>
              <Alert severity={
                isMultiDayEvent() 
                  ? (formData.selectedDays && formData.selectedDays.length > 0 && formData.dailySchedules.length > 0 && formData.dailySchedules.every(day => day.startTime && day.endTime) ? "success" : "warning")
                  : (formData.eventStartTime && formData.eventEndTime ? "success" : "warning")
              }>
                <Typography variant="body2">
                  📅 <strong>Evento:</strong> {formatDateForDisplay(formData.eventStartDate)}
                  {formData.eventStartDate !== formData.eventEndDate && (
                    <> hasta {formatDateForDisplay(formData.eventEndDate)}</>
                  )}
                  {isMultiDayEvent() && formData.selectedDays && formData.selectedDays.length > 0 && (
                    <> • <strong>Días seleccionados:</strong> {formData.selectedDays.length} de {calculateEventDuration()} días</>
                  )}
                  {!isMultiDayEvent() && formData.eventStartTime && formData.eventEndTime ? (
                    <> • <strong>Horario:</strong> {formatTimeForDisplay(formData.eventStartTime)} - {formatTimeForDisplay(formData.eventEndTime)}</>
                  ) : !isMultiDayEvent() ? (
                    <> • <strong>⚠️ Configura horarios para calcular horas de operarios</strong></>
                  ) : !formData.selectedDays || formData.selectedDays.length === 0 ? (
                    <> • <strong>⚠️ Selecciona días específicos del evento</strong></>
                  ) : formData.dailySchedules.length > 0 && formData.dailySchedules.every(day => day.startTime && day.endTime) ? (
                    <> • <strong>✅ Horarios configurados para días seleccionados</strong></>
                  ) : (
                    <> • <strong>⚠️ Configura horarios para cada día seleccionado</strong></>
                  )}
                </Typography>
              </Alert>
            </Grid>
          )}

          {/* Daily Schedules Section for Multi-day Events */}
          {isMultiDay && formData.selectedDays && formData.selectedDays.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon color="primary" />
                Horarios por Día
              </Typography>
              
              <Grid container spacing={2}>
                {formData.dailySchedules.length === 0 ? (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      <Typography variant="body2">
                        Generando horarios para {formData.selectedDays.length} días seleccionados...
                      </Typography>
                    </Alert>
                  </Grid>
                ) : (
                  formData.dailySchedules.map((daySchedule, index) => (
                  <Grid item xs={12} md={6} lg={4} key={daySchedule.date}>
                    <Card variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {formatDateForDisplay(daySchedule.date)}
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>Inicio</InputLabel>
                            <Select
                              value={daySchedule.startTime}
                              label="Inicio"
                              onChange={(e) => updateDaySchedule(index, 'startTime', e.target.value as string)}
                            >
                              {generateTimeOptions().map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>Fin</InputLabel>
                            <Select
                              value={daySchedule.endTime}
                              label="Fin"
                              onChange={(e) => updateDaySchedule(index, 'endTime', e.target.value as string)}
                              disabled={!daySchedule.startTime}
                            >
                              {getFilteredEndTimes(daySchedule.startTime).map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    </Card>
                  </Grid>
                  ))
                )}
              </Grid>
            </Grid>
          )}

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Dirección del Evento"
              placeholder="Dirección completa donde se realizará el evento"
              variant="outlined"
              value={formData.eventAddress}
              onChange={(e) => updateFormData('eventAddress', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Ciudad del Evento</InputLabel>
              <Select
                value={formData.eventCity?.id || ''}
                label="Ciudad del Evento"
                onChange={(e) => {
                  const cityId = e.target.value as number
                  const selectedCity = cityOptions.find(option => option.value === cityId)
                  updateFormData('eventCity', selectedCity ? {
                    id: selectedCity.value,
                    name: selectedCity.label.split(', ')[0],
                    department: selectedCity.department
                  } : null)
                }}
                disabled={citiesLoading}
              >
                <MenuItem value="">
                  <em>Seleccionar ciudad...</em>
                </MenuItem>
                {cityOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción del Evento"
              placeholder="Detalles adicionales del evento..."
              variant="outlined"
              multiline
              rows={2}
              value={formData.eventDescription}
              onChange={(e) => updateFormData('eventDescription', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Modo de Margen</InputLabel>
              <Select
                label="Modo de Margen"
                value={formData.marginMode || 'per_line'}
                onChange={(e) => updateFormData('marginMode', e.target.value)}
              >
                <MenuItem value="per_line">Por línea</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Margen de ganancia (%)"
              value={formData.marginPercentage}
              onChange={(e) => updateFormData('marginPercentage', Number(e.target.value))}
              inputProps={{ min: 0, max: 200 }}
            />
          </Grid>

          {/* Control manual de retención */}
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.enableRetention}
                  onChange={(e) => updateFormData('enableRetention', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    <strong>Aplicar Retención de Impuestos</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    La retención aparece en el resumen interno pero no en el PDF de la cotización.
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {/* Campo de porcentaje de retención */}
          {formData.enableRetention && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Porcentaje de Retención (%)"
                value={formData.retentionPercentage}
                onChange={(e) => updateFormData('retentionPercentage', Math.max(0, Math.min(100, Number(e.target.value))))}
                inputProps={{ min: 0, max: 100, step: 0.1 }}
                helperText="Ingresa el porcentaje de retención a aplicar (0-100%)"
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PricingClientSelection

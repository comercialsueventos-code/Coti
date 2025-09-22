import React, { useState } from 'react'
import {
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Divider,
  Box,
  Button,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AutoAwesome as TemplateIcon
} from '@mui/icons-material'
import { EmployeeRatesProps } from '../types'
import { HourlyRateRange } from '../../../types'
import { EMPLOYEE_RATE_TEMPLATES } from '@/shared/constants'

const EmployeeFlexibleRates: React.FC<EmployeeRatesProps> = ({
  formData,
  onFormDataChange
}) => {
  const [editingRateId, setEditingRateId] = useState<string | null>(null)
  const [newRate, setNewRate] = useState<Partial<HourlyRateRange>>({
    min_hours: 0,
    max_hours: null,
    rate: 0,
    description: ''
  })
  const [showAddForm, setShowAddForm] = useState(false)

  const ensureValidRanges = (rates: HourlyRateRange[]) => {
    if (rates.length === 0) {
      return [{
        id: crypto.randomUUID(),
        min_hours: 0,
        max_hours: null,
        rate: 0,
        description: 'Tarifa base'
      }]
    }
    
    const sortedRates = [...rates].sort((a, b) => a.min_hours - b.min_hours)
    const result: HourlyRateRange[] = []
    
    // Add base range if needed (only if first range doesn't start at 0)
    if (sortedRates[0].min_hours > 0) {
      result.push({
        id: crypto.randomUUID(),
        min_hours: 0,
        max_hours: sortedRates[0].min_hours,
        rate: 0,
        description: 'Rango base'
      })
    }
    
    // Add all existing rates (preserve them)
    result.push(...sortedRates)
    
    // Only fix obvious gaps and infinite ending
    const finalResult: HourlyRateRange[] = []
    
    for (let i = 0; i < result.length; i++) {
      const current = result[i]
      const next = result[i + 1]
      
      finalResult.push(current)
      
      // Only add gap filler if there's a real gap
      if (next && current.max_hours !== null && current.max_hours < next.min_hours) {
        finalResult.push({
          id: crypto.randomUUID(),
          min_hours: current.max_hours,
          max_hours: next.min_hours,
          rate: current.rate,
          description: 'Auto-generado'
        })
      }
    }
    
    // Ensure last rate is infinite
    if (finalResult.length > 0) {
      const lastIndex = finalResult.length - 1
      finalResult[lastIndex] = { ...finalResult[lastIndex], max_hours: null }
    }
    
    return finalResult
  }

  const addRate = () => {
    const rateToAdd: HourlyRateRange = {
      id: crypto.randomUUID(),
      min_hours: newRate.min_hours || 0,
      max_hours: newRate.max_hours || null,
      rate: newRate.rate || 0,
      description: newRate.description || ''
    }
    
    let updatedRates = [...formData.hourly_rates, rateToAdd]
      .sort((a, b) => a.min_hours - b.min_hours)
    
    // Ensure valid ranges
    updatedRates = ensureValidRanges(updatedRates)
    
    onFormDataChange('hourly_rates', updatedRates)
    setNewRate({ min_hours: 0, max_hours: null, rate: 0, description: '' })
    setShowAddForm(false)
  }

  const addRangeDirectly = () => {
    const newRateId = crypto.randomUUID()
    const rateToAdd: HourlyRateRange = {
      id: newRateId,
      min_hours: 0,
      max_hours: null,
      rate: 0,
      description: 'Nuevo rango'
    }
    
    let updatedRates = [...formData.hourly_rates, rateToAdd]
      .sort((a, b) => a.min_hours - b.min_hours)
    
    // Ensure valid ranges
    updatedRates = ensureValidRanges(updatedRates)
    
    onFormDataChange('hourly_rates', updatedRates)
    
    // Auto-edit the new range
    setEditingRateId(newRateId)
  }

  const updateRate = (id: string, field: keyof HourlyRateRange, value: any) => {
    let updatedRates = formData.hourly_rates.map(rate =>
      rate.id === id ? { ...rate, [field]: value } : rate
    ).sort((a, b) => a.min_hours - b.min_hours)
    
    // Only ensure valid ranges if needed
    updatedRates = ensureValidRanges(updatedRates)
    
    onFormDataChange('hourly_rates', updatedRates)
  }

  const saveRateEditing = (id: string) => {
    // Apply final validations and adjustments
    const updatedRates = ensureValidRanges(formData.hourly_rates)
    onFormDataChange('hourly_rates', updatedRates)
    
    // Exit editing mode
    setEditingRateId(null)
  }

  const removeRate = (id: string) => {
    let updatedRates = formData.hourly_rates.filter(rate => rate.id !== id)
    
    // Ensure valid ranges (handles empty case and validation)
    updatedRates = ensureValidRanges(updatedRates)
    
    onFormDataChange('hourly_rates', updatedRates)
  }

  const applyTemplate = (employeeType: string) => {
    const template = EMPLOYEE_RATE_TEMPLATES[employeeType]
    if (template) {
      // Generate new IDs to avoid conflicts
      let newRates = template.map(rate => ({
        ...rate,
        id: crypto.randomUUID()
      }))
      
      // Ensure valid ranges
      newRates = ensureValidRanges(newRates)
      
      onFormDataChange('hourly_rates', newRates)
    }
  }

  const formatHourRange = (minHours: number, maxHours: number | null) => {
    if (maxHours === null) {
      return `${minHours}h+`
    }
    if (minHours === maxHours) {
      return `${minHours}h`
    }
    return `${minHours}-${maxHours}h`
  }

  const validateRanges = () => {
    const errors: string[] = []
    const rates = formData.hourly_rates.sort((a, b) => a.min_hours - b.min_hours)
    
    // Check minimum number of rates
    if (rates.length < 1) {
      errors.push('Debe haber al menos 1 escalón de tarifa')
    }
    
    for (let i = 0; i < rates.length; i++) {
      const current = rates[i]
      
      // Check if min_hours >= max_hours
      if (current.max_hours !== null && current.min_hours >= current.max_hours) {
        errors.push(`Rango ${i + 1}: La hora de empieza debe ser menor que la hora de termina`)
      }
      
      // Check for negative values
      if (current.min_hours < 0) {
        errors.push(`Rango ${i + 1}: La hora de empieza no puede ser negativa`)
      }
      
      if (current.max_hours !== null && current.max_hours < 0) {
        errors.push(`Rango ${i + 1}: La hora de termina no puede ser negativa`)
      }
      
      // Check for rate
      if (current.rate < 0) {
        errors.push(`Rango ${i + 1}: La tarifa no puede ser negativa`)
      }
    }
    
    return errors
  }

  const validationErrors = validateRanges()

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            💰 Tarifas Horarias Flexibles
          </Typography>
          <Box>
            {formData.employee_type && EMPLOYEE_RATE_TEMPLATES[formData.employee_type] && (
              <Button
                size="small"
                startIcon={<TemplateIcon />}
                onClick={() => applyTemplate(formData.employee_type)}
                sx={{ mr: 1 }}
              >
                Plantilla {formData.employee_type}
              </Button>
            )}
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={addRangeDirectly}
              variant="contained"
            >
              Agregar Rango
            </Button>
            {showAddForm && (
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowAddForm(false)}
                variant="outlined"
                sx={{ ml: 1 }}
              >
                Cancelar formulario
              </Button>
            )}
          </Box>
        </Box>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>⚡ Flujo mejorado:</strong> Haz clic en "Agregar Rango" para añadir inmediatamente. 
            Edita inline y presiona Enter o el botón guardar. El sistema auto-ajusta desde 0h hasta infinito.
          </Typography>
        </Alert>
      </Grid>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Grid item xs={12}>
          <Alert severity="error">
            <Typography variant="subtitle2" gutterBottom>
              Errores en los rangos de tarifas:
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Alert>
        </Grid>
      )}

      {/* Add New Rate Form */}
      {showAddForm && (
        <Grid item xs={12}>
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom>
                ➕ Nuevo Rango de Tarifa
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Hora de empieza"
                    type="number"
                    value={newRate.min_hours || 0}
                    onChange={(e) => setNewRate(prev => ({ ...prev, min_hours: Number(e.target.value) }))}
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Hora de termina"
                    type="number"
                    value={newRate.max_hours || ''}
                    onChange={(e) => setNewRate(prev => ({ 
                      ...prev, 
                      max_hours: e.target.value ? Number(e.target.value) : null 
                    }))}
                    inputProps={{ min: 0, step: 0.5 }}
                    placeholder="∞ (vacío = infinito)"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Tarifa por hora"
                    type="number"
                    value={newRate.rate || 0}
                    onChange={(e) => setNewRate(prev => ({ ...prev, rate: Number(e.target.value) }))}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>
                    }}
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={newRate.description || ''}
                    onChange={(e) => setNewRate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="ej: Tarifa básica"
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Box display="flex" gap={1}>
                    <IconButton onClick={addRate} color="primary" size="small">
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setShowAddForm(false)} size="small">
                      <CancelIcon />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Existing Rates */}
      <Grid item xs={12}>
        <Box display="flex" flexDirection="column" gap={1}>
          {formData.hourly_rates.map((rate, index) => (
            <Card key={rate.id} variant="outlined">
              <CardContent sx={{ py: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={2}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip 
                        label={formatHourRange(rate.min_hours, rate.max_hours)} 
                        color="primary" 
                        size="small" 
                      />
                    </Box>
                  </Grid>
                  
                  {editingRateId === rate.id ? (
                    <>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          size="small"
                          label="Hora de empieza"
                          type="number"
                          value={rate.min_hours}
                          onChange={(e) => updateRate(rate.id!, 'min_hours', Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveRateEditing(rate.id!)
                            }
                          }}
                          inputProps={{ min: 0, step: 0.5 }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          size="small"
                          label="Hora de termina"
                          type="number"
                          value={rate.max_hours || ''}
                          onChange={(e) => updateRate(rate.id!, 'max_hours', e.target.value ? Number(e.target.value) : null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveRateEditing(rate.id!)
                            }
                          }}
                          inputProps={{ min: 0, step: 0.5 }}
                          placeholder="∞"
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <TextField
                          size="small"
                          label="Tarifa"
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateRate(rate.id!, 'rate', Number(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveRateEditing(rate.id!)
                            }
                          }}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          size="small"
                          label="Descripción"
                          value={rate.description || ''}
                          onChange={(e) => updateRate(rate.id!, 'description', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveRateEditing(rate.id!)
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <IconButton onClick={() => saveRateEditing(rate.id!)} size="small" color="success">
                          <SaveIcon />
                        </IconButton>
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={12} sm={3}>
                        <Typography variant="h6" color="primary">
                          ${rate.rate.toLocaleString('es-CO')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          por hora
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body2">
                          {rate.description || 'Sin descripción'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <Box display="flex" gap={1}>
                          <IconButton 
                            onClick={() => setEditingRateId(rate.id!)} 
                            size="small"
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => removeRate(rate.id!)} 
                            size="small"
                            color="error"
                            title="Eliminar escalón"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          ))}
          
          {formData.hourly_rates.length === 0 && (
            <Alert severity="info">
              No hay rangos de tarifas definidos. Agrega al menos un rango para continuar.
            </Alert>
          )}
        </Box>
      </Grid>
    </>
  )
}

export default EmployeeFlexibleRates
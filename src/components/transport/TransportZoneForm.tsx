import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Alert,
  Grid,
  Typography,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  InputAdornment,
  Paper,
  Divider
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Build as ToolIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material'
import {
  useCreateTransportZone,
  useUpdateTransportZone,
  useTransportValidation
} from '../../hooks/useTransport'
import { TransportZone, CreateTransportZoneData } from '../../types'

interface TransportZoneFormProps {
  zone?: TransportZone | null
  onClose: () => void
}

const TransportZoneForm: React.FC<TransportZoneFormProps> = ({ zone, onClose }) => {
  const [formData, setFormData] = useState<CreateTransportZoneData>({
    name: '',
    description: '',
    base_cost: 0,
    additional_equipment_cost: 0,
    estimated_travel_time_minutes: undefined
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isActive, setIsActive] = useState(true)
  
  const createMutation = useCreateTransportZone()
  const updateMutation = useUpdateTransportZone()
  const { validateZoneData } = useTransportValidation()
  
  const isEditMode = !!zone
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Initialize form with zone data when editing
  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        description: zone.description || '',
        base_cost: zone.base_cost,
        additional_equipment_cost: zone.additional_equipment_cost,
        estimated_travel_time_minutes: zone.estimated_travel_time_minutes
      })
      setIsActive(zone.is_active)
    }
  }, [zone])

  const handleInputChange = (field: keyof CreateTransportZoneData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value
    
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' || field === 'description' 
        ? value 
        : field === 'estimated_travel_time_minutes'
          ? value === '' ? undefined : parseInt(value) || 0
          : parseFloat(value) || 0
    }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const validation = validateZoneData(formData)
    const newErrors: Record<string, string> = {}

    if (!validation.isValid) {
      validation.errors.forEach((error: string) => {
        if (error.includes('nombre')) {
          newErrors.name = error
        } else if (error.includes('costo base')) {
          newErrors.base_cost = error
        } else if (error.includes('equipo')) {
          newErrors.additional_equipment_cost = error
        } else if (error.includes('tiempo')) {
          newErrors.estimated_travel_time_minutes = error
        }
      })
    }

    // Additional client-side validations
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la zona es requerido'
    }

    if (formData.base_cost < 0) {
      newErrors.base_cost = 'El costo base debe ser mayor o igual a 0'
    }

    if (formData.additional_equipment_cost < 0) {
      newErrors.additional_equipment_cost = 'El costo de equipo debe ser mayor o igual a 0'
    }

    if (formData.estimated_travel_time_minutes && formData.estimated_travel_time_minutes < 0) {
      newErrors.estimated_travel_time_minutes = 'El tiempo de viaje debe ser mayor a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      if (isEditMode && zone) {
        // Update existing zone
        const updateData = { ...formData, is_active: isActive }
        await updateMutation.mutateAsync({ id: zone.id, data: updateData })
      } else {
        // Create new zone
        await createMutation.mutateAsync(formData)
      }
      
      onClose()
    } catch (error: any) {
      console.error('Error saving zone:', error)
      setErrors({ general: error.message || 'Error al guardar la zona' })
    }
  }

  const handleCancel = () => {
    onClose()
  }

  // Calculate total estimated cost
  const totalBasicCost = formData.base_cost
  const totalWithEquipment = formData.base_cost + formData.additional_equipment_cost
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'No especificado'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      {/* General Error */}
      {errors.general && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errors.general}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon color="primary" />
                Información Básica
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nombre de la Zona"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={!!errors.name}
                    helperText={errors.name || 'Ej: Centro, Norte, Sur, etc.'}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Descripción (Opcional)"
                    value={formData.description}
                    onChange={handleInputChange('description')}
                    multiline
                    rows={2}
                    helperText="Describe la zona, barrios incluidos, puntos de referencia, etc."
                  />
                </Grid>

                {isEditMode && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Typography variant="body2">
                          {isActive ? '✅ Zona Activa' : '⏸️ Zona Inactiva'}
                        </Typography>
                      }
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Preview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.light' }}>
            <CardContent>
              <Typography variant="h6" color="primary.dark" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalculateIcon />
                Vista Previa de Costos
              </Typography>
              
              <Typography variant="body2" color="primary.dark">
                <strong>Solo Transporte:</strong><br />
                {formatCurrency(totalBasicCost)}
              </Typography>
              
              <Typography variant="body2" color="primary.dark" sx={{ mt: 1 }}>
                <strong>Con Equipo Adicional:</strong><br />
                {formatCurrency(totalWithEquipment)}
              </Typography>

              <Divider sx={{ my: 1, bgcolor: 'primary.dark' }} />

              <Typography variant="body2" color="primary.dark">
                <strong>Tiempo Estimado:</strong><br />
                {formatTime(formData.estimated_travel_time_minutes)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Pricing Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon color="primary" />
                Información de Costos
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Costo Base de Transporte"
                    type="number"
                    value={formData.base_cost}
                    onChange={handleInputChange('base_cost')}
                    error={!!errors.base_cost}
                    helperText={errors.base_cost || 'Costo básico del transporte a esta zona'}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          $
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Costo Equipo Adicional"
                    type="number"
                    value={formData.additional_equipment_cost}
                    onChange={handleInputChange('additional_equipment_cost')}
                    error={!!errors.additional_equipment_cost}
                    helperText={errors.additional_equipment_cost || 'Costo adicional por transporte de equipos'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          $
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon color="primary" />
                Información de Tiempo
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Tiempo Estimado de Viaje (minutos)"
                    type="number"
                    value={formData.estimated_travel_time_minutes || ''}
                    onChange={handleInputChange('estimated_travel_time_minutes')}
                    error={!!errors.estimated_travel_time_minutes}
                    helperText={errors.estimated_travel_time_minutes || 'Tiempo promedio de viaje a esta zona (opcional)'}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TimeIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={isLoading}
                sx={{ minWidth: 150 }}
              >
                {isLoading 
                  ? (isEditMode ? 'Actualizando...' : 'Guardando...')
                  : (isEditMode ? '🤖 Actualizar Zona' : '🤖 Crear Zona')
                }
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default TransportZoneForm
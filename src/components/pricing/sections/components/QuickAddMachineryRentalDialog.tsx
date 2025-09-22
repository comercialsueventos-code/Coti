import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material'
import { MachineryRentalInput } from '../../types'

interface QuickAddMachineryRentalDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (rental: MachineryRentalInput) => void
  eventHours: number
}

interface QuickRentalData {
  machinery_name: string
  category: string
  description: string
  total_cost: number
  requires_operator: boolean
  operator_cost: number
}

const QuickAddMachineryRentalDialog: React.FC<QuickAddMachineryRentalDialogProps> = ({
  open,
  onClose,
  onAdd,
  eventHours
}) => {
  const [formData, setFormData] = useState<QuickRentalData>({
    machinery_name: '',
    category: 'sonido',
    description: '',
    total_cost: 0,
    requires_operator: false,
    operator_cost: 0
  })

  const [errors, setErrors] = useState<string[]>([])

  const categoryOptions = [
    { value: 'sonido', label: '🎵 Sonido' },
    { value: 'iluminacion', label: '💡 Iluminación' },
    { value: 'cocina', label: '🍳 Cocina' },
    { value: 'refrigeracion', label: '❄️ Refrigeración' },
    { value: 'mobiliario', label: '🪑 Mobiliario' },
    { value: 'decoracion', label: '🎈 Decoración' },
    { value: 'transporte', label: '🚐 Transporte' },
    { value: 'otros', label: '🔧 Otros' }
  ]

  const handleInputChange = (field: keyof QuickRentalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.machinery_name.trim()) {
      newErrors.push('El nombre del equipo es requerido')
    }
    if (formData.total_cost <= 0) {
      newErrors.push('Debe especificar el costo total del alquiler')
    }
    if (formData.requires_operator && formData.operator_cost <= 0) {
      newErrors.push('Si requiere operador, debe especificar el costo')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Usar el costo total y calcular tarifas equivalentes
    const finalDailyCost = formData.total_cost
    const finalHourlyCost = formData.total_cost / 8 // Asumir 8 horas por día

    // Create a mock machinery rental object for the form
    const mockRental: MachineryRentalInput = {
      machineryRental: {
        id: Date.now(), // Temporary ID
        supplier_id: 0, // No specific supplier
        machinery_name: formData.machinery_name,
        category: formData.category as any,
        description: formData.description,
        supplier_hourly_rate: finalHourlyCost,
        supplier_daily_rate: finalDailyCost,
        sue_hourly_rate: finalHourlyCost, // Mismo costo, sin margen individual
        sue_daily_rate: finalDailyCost, // Mismo costo, sin margen individual
        setup_cost: 0,
        requires_operator: formData.requires_operator,
        operator_cost: formData.operator_cost,
        minimum_rental_hours: 4,
        delivery_cost: 0,
        pickup_cost: 0,
        insurance_cost: 0,
        damage_deposit: 0,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: {
          id: 0,
          name: 'Proveedor Externo',
          type: 'machinery_rental',
          payment_terms_days: 0,
          requires_advance_payment: false,
          advance_payment_percentage: 0,
          commission_percentage: 0,
          quality_rating: 0,
          reliability_rating: 0,
          price_rating: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      },
      hours: eventHours || 8,
      includeOperator: formData.requires_operator,
      includeDelivery: false,
      includePickup: false,
      customMarginPercentage: undefined
    }

    onAdd(mockRental)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      machinery_name: '',
      category: 'sonido',
      description: '',
      total_cost: 0,
      requires_operator: false,
      operator_cost: 0
    })
    setErrors([])
    onClose()
  }

  // No mostrar margen individual - solo costos directos

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      disableRestoreFocus
      disableEnforceFocus
    >
      <DialogTitle>
        🏪 Agregar Alquiler Rápido
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Agregar equipo de alquiler directo - solo el costo que te cuesta
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Nombre del Equipo"
              value={formData.machinery_name}
              onChange={(e) => handleInputChange('machinery_name', e.target.value)}
              placeholder="Ej: Carpa 10x10m, Audio Pro JBL, etc."
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                label="Categoría"
                onChange={(e) => handleInputChange('category', e.target.value)}
              >
                {categoryOptions.map(option => (
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
              label="Descripción"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder="Detalles del equipo, especificaciones, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              💰 Costo que te Cuesta
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Costo Total del Alquiler"
              type="number"
              value={formData.total_cost}
              onChange={(e) => handleInputChange('total_cost', Number(e.target.value))}
              InputProps={{ startAdornment: '$' }}
              placeholder="Ej: 500000"
              helperText="Costo total que te cuesta alquilar este equipo para todo el evento"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requires_operator}
                  onChange={(e) => handleInputChange('requires_operator', e.target.checked)}
                />
              }
              label="Requiere Operador"
            />
          </Grid>

          {formData.requires_operator && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Costo Operador/Hora"
                type="number"
                value={formData.operator_cost}
                onChange={(e) => handleInputChange('operator_cost', Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="warning"
          disabled={!formData.machinery_name.trim() || formData.total_cost <= 0}
        >
          Agregar Alquiler
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddMachineryRentalDialog
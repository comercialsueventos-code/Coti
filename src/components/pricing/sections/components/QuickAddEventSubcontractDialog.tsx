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
import { EventSubcontractInput } from '../../types'

interface QuickAddEventSubcontractDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (subcontract: EventSubcontractInput) => void
}

interface QuickSubcontractData {
  service_name: string
  total_subcontract_cost: number
  description: string
  attendees: number
}

const QuickAddEventSubcontractDialog: React.FC<QuickAddEventSubcontractDialogProps> = ({
  open,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState<QuickSubcontractData>({
    service_name: '',
    total_subcontract_cost: 0,
    description: '',
    attendees: 0
  })

  const [errors, setErrors] = useState<string[]>([])

  const handleInputChange = (field: keyof QuickSubcontractData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.service_name.trim()) {
      newErrors.push('El nombre del servicio es requerido')
    }
    if (formData.total_subcontract_cost <= 0) {
      newErrors.push('El costo total debe ser mayor a 0')
    }
    if (formData.attendees <= 0) {
      newErrors.push('Debe especificar el número de asistentes')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Create a mock event subcontract object for total subcontracting
    const mockSubcontract: EventSubcontractInput = {
      eventSubcontract: {
        id: Date.now(), // Temporary ID
        supplier_id: 0, // No specific supplier
        service_name: formData.service_name,
        service_type: 'event_complete',
        description: formData.description,
        supplier_cost: formData.total_subcontract_cost,
        sue_price: formData.total_subcontract_cost, // Mismo costo, sin margen individual
        includes_setup: true,
        includes_cleanup: true,
        includes_staff: true,
        includes_equipment: true,
        minimum_attendees: formData.attendees,
        maximum_attendees: formData.attendees,
        service_duration_hours: 8,
        advance_notice_days: 7,
        cancellation_policy: undefined,
        quality_guarantees: undefined,
        is_available: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        supplier: {
          id: 0,
          name: 'Subcontratación Total',
          type: 'event_subcontractor',
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
      attendees: formData.attendees,
      customSupplierCost: undefined,
      customSuePrice: undefined,
      customMarginPercentage: undefined,
      notes: `Subcontratación total para ${formData.attendees} personas`
    }

    onAdd(mockSubcontract)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      service_name: '',
      total_subcontract_cost: 0,
      description: '',
      attendees: 0
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
        🤝 Subcontratación Total del Evento
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Subcontratar todo el evento por un costo total (mantienes tus productos: desechables, muebles, maquinaria Sue, empleados)
        </Typography>

        {errors.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.map((error, index) => (
              <div key={index}>{error}</div>
            ))}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Nombre del Evento"
              value={formData.service_name}
              onChange={(e) => handleInputChange('service_name', e.target.value)}
              placeholder="Ej: Boda Jardín 300 personas, Evento Corporativo 150, etc."
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Número de Asistentes"
              type="number"
              value={formData.attendees}
              onChange={(e) => handleInputChange('attendees', Number(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Costo Total de Subcontratación"
              type="number"
              value={formData.total_subcontract_cost}
              onChange={(e) => handleInputChange('total_subcontract_cost', Number(e.target.value))}
              InputProps={{ startAdornment: '$' }}
              placeholder="Ej: 20000000"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción (Opcional)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              multiline
              rows={2}
              placeholder="Detalles adicionales del evento, ubicación, fecha, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.contrastText">
                <strong>📝 Nota:</strong> Este costo reemplaza todo el evento. Puedes seguir agregando tus productos propios: desechables, muebles, maquinaria Sue Events y empleados.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="success"
          disabled={!formData.service_name.trim() || formData.total_subcontract_cost <= 0 || formData.attendees <= 0}
        >
          Subcontratar Evento
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddEventSubcontractDialog
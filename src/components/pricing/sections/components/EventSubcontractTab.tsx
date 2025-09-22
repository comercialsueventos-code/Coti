import React, { useState } from 'react'
import {
  Box,
  Button,
  Alert,
  Typography,
  List,
  ListItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Divider,
  Paper,
  Chip
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, FlashOn as QuickIcon } from '@mui/icons-material'
import { MachineryManagementProps } from '../../types'
import { useEventSubcontracts } from '../../../../hooks/useEventSubcontract'
import QuickAddEventSubcontractDialog from './QuickAddEventSubcontractDialog'

interface EventSubcontractTabProps extends MachineryManagementProps {}

const EventSubcontractTab: React.FC<EventSubcontractTabProps> = ({
  formData,
  updateFormData,
  addEventSubcontract,
  removeEventSubcontract,
  updateEventSubcontract
}) => {
  const { data: availableSubcontracts = [] } = useEventSubcontracts({ is_available: true })
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getServiceTypeIcon = (serviceType: string) => {
    const icons: Record<string, string> = {
      'event_complete': '🎉',
      'catering_only': '🍽️',
      'decoration_only': '🎈',
      'entertainment_only': '🎵',
      'transport_only': '🚐'
    }
    return icons[serviceType] || '🤝'
  }

  // Calculate total for subcontracts
  const subcontractTotal = formData.eventSubcontractInputs.reduce((total, input) => {
    return total + (input.customSuePrice || input.eventSubcontract.sue_price)
  }, 0)

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="success.main">
          🤝 Subcontratación de Eventos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="success"
            startIcon={<QuickIcon />}
            onClick={() => setShowQuickAdd(true)}
          >
            Subcontratación Total
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={addEventSubcontract}
            disabled={availableSubcontracts.length === 0}
          >
            Agregar Subcontrato
          </Button>
        </Box>
      </Box>

      {availableSubcontracts.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay servicios de subcontratación disponibles. Primero agrega proveedores y sus servicios en la sección de Proveedores.
        </Alert>
      )}

      {formData.eventSubcontractInputs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No hay subcontratos agregados. Haz clic en "Agregar Subcontrato" para comenzar.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Sue Events actúa como intermediario con margen sobre el costo total del subcontratista
          </Typography>
        </Paper>
      ) : (
        <List>
          {formData.eventSubcontractInputs.map((input, index) => {
            const finalPrice = input.customSuePrice || input.eventSubcontract.sue_price
            const supplierCost = input.customSupplierCost || input.eventSubcontract.supplier_cost
            const margin = finalPrice - supplierCost
            const marginPercentage = supplierCost > 0 ? (margin / supplierCost) * 100 : 0

            return (
              <React.Fragment key={index}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        {input.eventSubcontract.supplier_id === 0 ? (
                          // QuickAdd subcontract - mostrar como texto no editable
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                              🤝 {input.eventSubcontract.service_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Subcontrato Rápido - {formatCurrency(input.eventSubcontract.sue_price)}
                            </Typography>
                          </Box>
                        ) : (
                          // Subcontract normal de base de datos
                          <FormControl fullWidth size="small">
                            <InputLabel>Servicio Subcontratado</InputLabel>
                            <Select
                              value={input.eventSubcontract.id}
                              label="Servicio Subcontratado"
                              onChange={(e) => {
                                const subcontract = availableSubcontracts.find(s => s.id === Number(e.target.value))
                                if (subcontract) {
                                  updateEventSubcontract(index, 'eventSubcontract', subcontract)
                                }
                              }}
                            >
                              {availableSubcontracts.map((subcontract) => (
                                <MenuItem key={subcontract.id} value={subcontract.id}>
                                  {getServiceTypeIcon(subcontract.service_type)} {subcontract.service_name} - {formatCurrency(subcontract.sue_price)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Asistentes"
                          type="number"
                          size="small"
                          value={input.attendees || ''}
                          onChange={(e) => updateEventSubcontract(index, 'attendees', Number(e.target.value) || undefined)}
                          inputProps={{ min: input.eventSubcontract.minimum_attendees || 1 }}
                          fullWidth
                          helperText={input.eventSubcontract.minimum_attendees ? `Mín: ${input.eventSubcontract.minimum_attendees}` : ''}
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Precio Personalizado"
                          type="number"
                          size="small"
                          value={input.customSuePrice || ''}
                          onChange={(e) => updateEventSubcontract(index, 'customSuePrice', Number(e.target.value) || undefined)}
                          fullWidth
                          InputProps={{
                            startAdornment: '$'
                          }}
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {formatCurrency(finalPrice)}
                          </Typography>
                          <Typography variant="caption" color="success.main">
                            Margen: {marginPercentage.toFixed(1)}%
                          </Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={6} md={1}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {input.eventSubcontract.includes_setup && <Chip label="Setup" size="small" />}
                          {input.eventSubcontract.includes_staff && <Chip label="Personal" size="small" />}
                          {input.eventSubcontract.includes_equipment && <Chip label="Equipos" size="small" />}
                          {input.eventSubcontract.includes_cleanup && <Chip label="Limpieza" size="small" />}
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeEventSubcontract(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>

                    <Grid container spacing={1} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          label="Notas adicionales"
                          size="small"
                          value={input.notes || ''}
                          onChange={(e) => updateEventSubcontract(index, 'notes', e.target.value || undefined)}
                          fullWidth
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="caption" color="text.secondary">
                          <strong>Proveedor:</strong> {input.eventSubcontract.supplier?.name || 'N/A'}<br/>
                          <strong>Costo Proveedor:</strong> {formatCurrency(supplierCost)}<br/>
                          <strong>Precio Sue Events:</strong> {formatCurrency(finalPrice)}<br/>
                          <strong>Margen:</strong> {formatCurrency(margin)} ({marginPercentage.toFixed(1)}%)
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </ListItem>
                {index < formData.eventSubcontractInputs.length - 1 && <Divider />}
              </React.Fragment>
            )
          })}
        </List>
      )}

      {formData.eventSubcontractInputs.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
          <Typography variant="h6" color="success.contrastText">
            Total Subcontratación: {formatCurrency(subcontractTotal)}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'success.main', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>💡 Ejemplo:</strong> Boda 300 personas completa → Subcontratista $15M + margen 20% = $18M
        </Typography>
      </Box>

      <QuickAddEventSubcontractDialog
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={(subcontract) => {
          // Agregar directamente el subcontract completo
          updateFormData('eventSubcontractInputs', [...formData.eventSubcontractInputs, subcontract])
        }}
      />
    </>
  )
}

export default EventSubcontractTab
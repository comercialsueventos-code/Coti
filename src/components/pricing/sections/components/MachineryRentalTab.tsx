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
  FormControlLabel,
  Checkbox,
  IconButton,
  Divider,
  Paper
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, FlashOn as QuickIcon } from '@mui/icons-material'
import { MachineryManagementProps } from '../../types'
import { useMachineryRentals } from '../../../../hooks/useMachineryRental'
import QuickAddMachineryRentalDialog from './QuickAddMachineryRentalDialog'

interface MachineryRentalTabProps extends MachineryManagementProps {}

const MachineryRentalTab: React.FC<MachineryRentalTabProps> = ({
  formData,
  updateFormData,
  addMachineryRental,
  removeMachineryRental,
  updateMachineryRental
}) => {
  const { data: availableRentals = [] } = useMachineryRentals({ is_available: true })
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Calculate total for rentals
  const rentalTotal = formData.machineryRentalInputs.reduce((total, input) => {
    // Si hay costo personalizado, usarlo; sino calcular normalmente
    if (input.isCustomCost && input.customTotalCost !== undefined) {
      return total + input.customTotalCost
    } else {
      const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
      const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
        ? input.machineryRental.operator_cost * input.hours 
        : 0
      const setupCost = input.machineryRental.setup_cost || 0
      const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
      const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
      return total + baseCost + operatorCost + setupCost + deliveryCost + pickupCost
    }
  }, 0)

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="warning.main">
          🏪 Alquiler de Equipos Externos
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<QuickIcon />}
            onClick={() => setShowQuickAdd(true)}
          >
            Alquiler Rápido
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AddIcon />}
            onClick={addMachineryRental}
            disabled={availableRentals.length === 0}
          >
            Agregar Alquiler
          </Button>
        </Box>
      </Box>

      {availableRentals.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay equipos de alquiler disponibles. Primero agrega proveedores y sus equipos en la sección de Proveedores.
        </Alert>
      )}

      {formData.machineryRentalInputs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No hay equipos de alquiler agregados. Haz clic en "Agregar Alquiler" para comenzar.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Los equipos de alquiler incluyen costo del proveedor + margen de Sue Events
          </Typography>
        </Paper>
      ) : (
        <List>
          {formData.machineryRentalInputs.map((input, index) => {
            // Si hay costo personalizado, usarlo; sino calcular normalmente
            let totalCost
            if (input.isCustomCost && input.customTotalCost !== undefined) {
              totalCost = input.customTotalCost
            } else {
              const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
              const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
                ? input.machineryRental.operator_cost * input.hours 
                : 0
              const setupCost = input.machineryRental.setup_cost || 0
              const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
              const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
              totalCost = baseCost + operatorCost + setupCost + deliveryCost + pickupCost
            }

            return (
              <React.Fragment key={index}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        {input.machineryRental.supplier_id === 0 ? (
                          // QuickAdd rental - mostrar como texto no editable
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                              🏪 {input.machineryRental.machinery_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Alquiler Rápido - {formatCurrency(input.machineryRental.sue_hourly_rate)}/h
                            </Typography>
                          </Box>
                        ) : (
                          // Rental normal de base de datos
                          <FormControl fullWidth size="small">
                            <InputLabel>Equipo de Alquiler</InputLabel>
                            <Select
                              value={input.machineryRental.id}
                              label="Equipo de Alquiler"
                              onChange={(e) => {
                                const rental = availableRentals.find(r => r.id === Number(e.target.value))
                                if (rental) {
                                  updateMachineryRental(index, 'machineryRental', rental)
                                }
                              }}
                            >
                              {availableRentals.map((rental) => (
                                <MenuItem key={rental.id} value={rental.id}>
                                  {rental.machinery_name} - {formatCurrency(rental.sue_hourly_rate)}/h
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label="Horas"
                          type="number"
                          size="small"
                          value={input.hours}
                          onChange={(e) => updateMachineryRental(index, 'hours', Number(e.target.value))}
                          inputProps={{ min: input.machineryRental.minimum_rental_hours, step: 0.5 }}
                          fullWidth
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={input.includeOperator}
                              onChange={(e) => updateMachineryRental(index, 'includeOperator', e.target.checked)}
                              disabled={!input.machineryRental.requires_operator}
                            />
                          }
                          label="Operador"
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={input.includeDelivery}
                              onChange={(e) => updateMachineryRental(index, 'includeDelivery', e.target.checked)}
                              disabled={!input.machineryRental.delivery_cost}
                            />
                          }
                          label="Entrega"
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        {input.isCustomCost ? (
                          <TextField
                            label="Costo Total"
                            type="number"
                            size="small"
                            value={input.customTotalCost !== undefined ? input.customTotalCost : totalCost}
                            onChange={(e) => {
                              const newCost = Number(e.target.value)
                              updateMachineryRental(index, 'customTotalCost', newCost)
                              updateMachineryRental(index, 'isCustomCost', true)
                            }}
                            InputProps={{ startAdornment: '$' }}
                            fullWidth
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(totalCost)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                updateMachineryRental(index, 'isCustomCost', true)
                                updateMachineryRental(index, 'customTotalCost', totalCost)
                              }}
                              title="Editar costo"
                            >
                              ✏️
                            </IconButton>
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Producto Asociado</InputLabel>
                          <Select
                            value={input.associatedProductId || ''}
                            label="Producto Asociado"
                            onChange={(e) => {
                              updateMachineryRental(index, 'associatedProductId', e.target.value ? Number(e.target.value) : undefined)
                            }}
                          >
                            <MenuItem value="">
                              <em>Sin asociar</em>
                            </MenuItem>
                            {formData.productInputs.map((productInput) => (
                              <MenuItem key={productInput.product.id} value={productInput.product.id}>
                                {productInput.product.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} md={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeMachineryRental(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {(() => {
                        // Si hay costo personalizado, mostrar solo el total editado
                        if (input.isCustomCost && input.customTotalCost !== undefined) {
                          return `Costo editado: ${formatCurrency(input.customTotalCost)}`
                        }
                        
                        // Cálculo estándar del desglose
                        const baseCost = input.hours >= 8 ? input.machineryRental.sue_daily_rate : input.machineryRental.sue_hourly_rate * input.hours
                        const operatorCost = input.includeOperator && input.machineryRental.operator_cost 
                          ? input.machineryRental.operator_cost * input.hours 
                          : 0
                        const setupCost = input.machineryRental.setup_cost || 0
                        const deliveryCost = input.includeDelivery ? (input.machineryRental.delivery_cost || 0) : 0
                        const pickupCost = input.includePickup ? (input.machineryRental.pickup_cost || 0) : 0
                        
                        const parts = [`Base: ${formatCurrency(baseCost)}`]
                        if (operatorCost > 0) parts.push(`Operador: ${formatCurrency(operatorCost)}`)
                        if (deliveryCost > 0) parts.push(`Entrega: ${formatCurrency(deliveryCost)}`)
                        if (pickupCost > 0) parts.push(`Recogida: ${formatCurrency(pickupCost)}`)
                        if (setupCost > 0) parts.push(`Instalación: ${formatCurrency(setupCost)}`)
                        if (input.associatedProductId) {
                          const associatedProduct = formData.productInputs.find(p => p.product.id === input.associatedProductId)
                          if (associatedProduct) {
                            parts.push(`Asociado a: ${associatedProduct.product.name}`)
                          }
                        }
                        return parts.join(' • ')
                      })()}
                    </Typography>
                  </Box>
                </ListItem>
                {index < formData.machineryRentalInputs.length - 1 && <Divider />}
              </React.Fragment>
            )
          })}
        </List>
      )}

      {formData.machineryRentalInputs.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
          <Typography variant="h6" color="warning.contrastText">
            Total Alquiler Externo: {formatCurrency(rentalTotal)}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>💡 Ejemplo:</strong> Carpa 10x10m que Sue Events no tiene → Proveedor $500k + margen 30% = $650k
        </Typography>
      </Box>

      <QuickAddMachineryRentalDialog
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={(rental) => {
          // Agregar directamente el rental completo sin usar addMachineryRental
          updateFormData('machineryRentalInputs', [...formData.machineryRentalInputs, rental])
        }}
        eventHours={(() => {
          // Calcular horas del evento desde start/end time
          if (formData.eventStartTime && formData.eventEndTime) {
            const start = new Date(`2000-01-01T${formData.eventStartTime}`)
            const end = new Date(`2000-01-01T${formData.eventEndTime}`)
            const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            return Math.max(diffHours, 4) // Mínimo 4 horas
          }
          return 8 // Default
        })()}
      />
    </>
  )
}

export default MachineryRentalTab
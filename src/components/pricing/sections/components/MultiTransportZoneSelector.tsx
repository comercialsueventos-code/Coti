import React, { useState } from 'react'
import {
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Alert
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalShipping as ShippingIcon
} from '@mui/icons-material'
import { useActiveTransportZones } from '../../../../hooks/useTransport'
import { TransportZoneInput, TransportAllocation } from '../../types'
import { TransportZone } from '../../../../types'
import TransportValidationErrorBoundary, { useTransportValidationError } from '../TransportValidationErrorBoundary'

interface MultiTransportZoneSelectorProps {
  selectedTransportZones: TransportZoneInput[]
  productInputs: any[]
  onUpdateTransportZones: (zones: TransportZoneInput[]) => void
}

const MultiTransportZoneSelector: React.FC<MultiTransportZoneSelectorProps> = ({
  selectedTransportZones,
  productInputs,
  onUpdateTransportZones
}) => {
  const { data: availableZones = [] } = useActiveTransportZones()
  const { throwTransportError } = useTransportValidationError()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [currentZone, setCurrentZone] = useState<TransportZoneInput | null>(null)

  const openAddDialog = () => {
    if (!availableZones || availableZones.length === 0) {
      throwTransportError('No hay zonas de transporte disponibles', {
        code: 'NO_ZONES_AVAILABLE',
        severity: 'high',
        context: {}
      })
      return
    }
    
    setCurrentZone({
      zone: availableZones[0],
      transportCount: 1,
      includeEquipmentTransport: false,
      useFlexibleTransport: false,
      transportProductIds: [],
      transportAllocations: []
    })
    setEditingIndex(null)
    setIsDialogOpen(true)
  }

  const openEditDialog = (index: number) => {
    setCurrentZone({ ...selectedTransportZones[index] })
    setEditingIndex(index)
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (!currentZone || !currentZone.zone) {
      throwTransportError('Debe seleccionar una zona de transporte', {
        code: 'ZONE_REQUIRED',
        severity: 'medium',
        context: {}
      })
      return
    }

    // Validar que no se repita la zona (excepto si estamos editando la misma)
    const isDuplicate = selectedTransportZones.some((zoneInput, index) => 
      zoneInput.zone.id === currentZone.zone.id && index !== editingIndex
    )

    if (isDuplicate) {
      throwTransportError('Esta zona ya está agregada', {
        code: 'DUPLICATE_ZONE',
        severity: 'medium',
        context: { zoneId: currentZone.zone.id, zoneName: currentZone.zone.name }
      })
      return
    }

    // Validar la distribución manual si está habilitada
    if (currentZone.useFlexibleTransport && currentZone.transportAllocations) {
      const totalAllocated = currentZone.transportAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0)
      if (totalAllocated !== currentZone.transportCount) {
        throwTransportError(`La distribución manual no coincide. Total asignado: ${totalAllocated}, Total transportes: ${currentZone.transportCount}`, {
          code: 'ALLOCATION_MISMATCH',
          severity: 'medium',
          context: { 
            totalAllocated, 
            transportCount: currentZone.transportCount,
            zoneId: currentZone.zone.id
          }
        })
        return
      }
    }

    const updatedZones = [...selectedTransportZones]
    if (editingIndex !== null) {
      updatedZones[editingIndex] = currentZone
    } else {
      updatedZones.push(currentZone)
    }

    onUpdateTransportZones(updatedZones)
    setIsDialogOpen(false)
  }

  const handleDelete = (index: number) => {
    const updatedZones = selectedTransportZones.filter((_, i) => i !== index)
    onUpdateTransportZones(updatedZones)
  }

  const initializeManualAllocations = (zoneInput: TransportZoneInput) => {
    const selectedProducts = zoneInput.transportProductIds?.length > 0 
      ? productInputs.filter(p => zoneInput.transportProductIds!.includes(p.product.id))
      : productInputs

    const allocations: TransportAllocation[] = selectedProducts.map(productInput => ({
      productId: productInput.product.id,
      quantity: 0
    }))

    return allocations
  }

  const updateCurrentZoneField = (field: keyof TransportZoneInput, value: any) => {
    if (!currentZone) return

    const updatedZone = { ...currentZone, [field]: value }

    // Si se activa distribución manual, inicializar allocations
    if (field === 'useFlexibleTransport' && value === true) {
      updatedZone.transportAllocations = initializeManualAllocations(updatedZone)
    }

    // Si se desactiva distribución manual, limpiar allocations
    if (field === 'useFlexibleTransport' && value === false) {
      updatedZone.transportAllocations = []
    }

    setCurrentZone(updatedZone)
  }

  const updateAllocation = (productId: number, quantity: number) => {
    if (!currentZone) return

    const updatedAllocations = (currentZone.transportAllocations || []).map(allocation =>
      allocation.productId === productId
        ? { ...allocation, quantity: Math.max(0, Math.min(quantity, currentZone.transportCount)) }
        : allocation
    )

    setCurrentZone({
      ...currentZone,
      transportAllocations: updatedAllocations
    })
  }

  const getTotalCost = () => {
    return selectedTransportZones.reduce((total, zoneInput) => {
      const costPerTransport = zoneInput.zone.base_cost + 
        (zoneInput.includeEquipmentTransport ? (zoneInput.zone.additional_equipment_cost || 0) : 0)
      return total + (costPerTransport * zoneInput.transportCount)
    }, 0)
  }

  const getTotalTransports = () => {
    return selectedTransportZones.reduce((total, zoneInput) => total + zoneInput.transportCount, 0)
  }

  return (
    <TransportValidationErrorBoundary
      onReset={() => {
        onUpdateTransportZones([])
        setIsDialogOpen(false)
      }}
    >
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShippingIcon color="primary" />
            Zonas de Transporte
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAddDialog}
            disabled={availableZones.length === 0}
          >
            Agregar Zona
          </Button>
        </Box>

        {selectedTransportZones.length === 0 ? (
          <Alert severity="info">
            No se han agregado zonas de transporte. Haz clic en "Agregar Zona" para comenzar.
          </Alert>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {selectedTransportZones.map((zoneInput, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card variant="outlined" sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" noWrap>
                        🚚 {zoneInput.zone.name}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => openEditDialog(index)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(index)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      • {zoneInput.transportCount} transporte(s)
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      • {zoneInput.includeEquipmentTransport ? 'Con equipo' : 'Solo transporte'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      • {zoneInput.useFlexibleTransport ? 'Distribución manual' : 'Distribución automática'}
                    </Typography>
                    
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        Total: {((zoneInput.zone.base_cost + 
                          (zoneInput.includeEquipmentTransport ? (zoneInput.zone.additional_equipment_cost || 0) : 0)
                        ) * zoneInput.transportCount).toLocaleString('es-CO')} COP
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Resumen total */}
            <Card sx={{ p: 2, bgcolor: 'primary.50' }}>
              <Typography variant="h6" gutterBottom>
                📊 Resumen Total de Transporte
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1">
                    <strong>Total de Zonas:</strong> {selectedTransportZones.length}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total de Transportes:</strong> {getTotalTransports()}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    <strong>Costo Total:</strong> {getTotalCost().toLocaleString('es-CO')} COP
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </>
        )}

        {/* Dialog para agregar/editar zona */}
        <Dialog 
          open={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingIndex !== null ? 'Editar' : 'Agregar'} Zona de Transporte
          </DialogTitle>
          <DialogContent>
            {currentZone && (
              <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Selección de zona */}
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Zona de Transporte</InputLabel>
                    <Select
                      value={currentZone.zone?.id || ''}
                      label="Zona de Transporte"
                      onChange={(e) => {
                        const zone = availableZones.find(z => z.id === Number(e.target.value))
                        updateCurrentZoneField('zone', zone || null)
                      }}
                    >
                      {availableZones.map((zone) => (
                        <MenuItem key={zone.id} value={zone.id}>
                          {zone.name} (+{zone.base_cost.toLocaleString('es-CO')} COP base)
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Cantidad de transportes */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Cantidad de Transportes"
                    value={currentZone.transportCount}
                    onChange={(e) => updateCurrentZoneField('transportCount', Math.max(1, Number(e.target.value)))}
                    inputProps={{ min: 1, max: 10 }}
                    helperText="Número de transportes para esta zona"
                  />
                </Grid>

                {/* Switch de equipo */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentZone.includeEquipmentTransport}
                        onChange={(e) => updateCurrentZoneField('includeEquipmentTransport', e.target.checked)}
                        color="primary"
                      />
                    }
                    label={currentZone.includeEquipmentTransport ? '🛠️ Con Equipo' : '🚛 Solo Transporte'}
                  />
                  {currentZone.zone && currentZone.includeEquipmentTransport && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      +{(currentZone.zone.additional_equipment_cost || 0).toLocaleString('es-CO')} COP por transporte
                    </Typography>
                  )}
                </Grid>

                {/* Toggle para distribución manual */}
                {productInputs && productInputs.length > 1 && (
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={currentZone.useFlexibleTransport || false}
                          onChange={(e) => updateCurrentZoneField('useFlexibleTransport', e.target.checked)}
                          color="secondary"
                        />
                      }
                      label={
                        <Typography variant="body2" fontWeight="bold">
                          {currentZone.useFlexibleTransport ? '📊 Distribución Manual' : '⚖️ Distribución Automática'}
                        </Typography>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" display="block">
                      {currentZone.useFlexibleTransport 
                        ? "Asigna cantidades específicas por producto" 
                        : "División equitativa entre productos seleccionados"
                      }
                    </Typography>
                  </Grid>
                )}

                {/* Controles de distribución manual */}
                {currentZone.useFlexibleTransport && productInputs && productInputs.length > 0 && (
                  <Grid item xs={12}>
                    <Box sx={{ 
                      bgcolor: 'grey.50', 
                      p: 2, 
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.200'
                    }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        📊 Distribución Manual de Transportes
                      </Typography>
                      
                      <Grid container spacing={2}>
                        {productInputs.map((productInput) => {
                          const allocation = currentZone.transportAllocations?.find(a => a.productId === productInput.product.id)
                          
                          return (
                            <Grid item xs={12} sm={6} md={4} key={productInput.product.id}>
                              <TextField
                                fullWidth
                                type="number"
                                size="small"
                                label={`${productInput.product.name}`}
                                value={allocation?.quantity || 0}
                                onChange={(e) => updateAllocation(productInput.product.id, Number(e.target.value))}
                                inputProps={{ 
                                  min: 0, 
                                  max: currentZone.transportCount,
                                  step: 1
                                }}
                                helperText={`Máximo: ${currentZone.transportCount}`}
                              />
                            </Grid>
                          )
                        })}
                      </Grid>

                      {/* Validación en tiempo real */}
                      {currentZone.transportAllocations && (
                        <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>Total asignado:</strong> {
                              currentZone.transportAllocations.reduce((sum, allocation) => sum + allocation.quantity, 0)
                            } / {currentZone.transportCount} transportes
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Resumen de costos */}
                {currentZone.zone && (
                  <Grid item xs={12}>
                    <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2" fontWeight="bold" gutterBottom>
                        💰 Resumen de Costos para esta Zona:
                      </Typography>
                      <Typography variant="body2">
                        • Costo unitario: {(currentZone.zone.base_cost + 
                          (currentZone.includeEquipmentTransport ? (currentZone.zone.additional_equipment_cost || 0) : 0)
                        ).toLocaleString('es-CO')} COP
                      </Typography>
                      <Typography variant="body2">
                        • Cantidad: {currentZone.transportCount} transporte(s)
                      </Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        • Total: {((currentZone.zone.base_cost + 
                          (currentZone.includeEquipmentTransport ? (currentZone.zone.additional_equipment_cost || 0) : 0)
                        ) * currentZone.transportCount).toLocaleString('es-CO')} COP
                      </Typography>
                    </Card>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained">
              {editingIndex !== null ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </TransportValidationErrorBoundary>
  )
}

export default MultiTransportZoneSelector
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
import { DisposableItemInput } from '../../types'
import { useDisposableItemCategories, useDisposableItemUtils } from '../../../../hooks/useDisposableItems'

interface QuickAddDisposableItemDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (disposableItem: DisposableItemInput) => void
}

interface QuickDisposableData {
  name: string
  subcategory: string
  description: string
  unit: string
  sale_price: number
  minimum_quantity: number
  shelf_life_days: number
  storage_requirements: string
  is_biodegradable: boolean
  is_recyclable: boolean
}

const QuickAddDisposableItemDialog: React.FC<QuickAddDisposableItemDialogProps> = ({
  open,
  onClose,
  onAdd
}) => {
  const { data: categoriesData, isLoading: loadingCategories } = useDisposableItemCategories()
  const utils = useDisposableItemUtils()
  
  const [formData, setFormData] = useState<QuickDisposableData>({
    name: '',
    subcategory: '',
    description: '',
    unit: 'unidad',
    sale_price: 0,
    minimum_quantity: 1,
    shelf_life_days: 0,
    storage_requirements: '',
    is_biodegradable: false,
    is_recyclable: false
  })

  const [errors, setErrors] = useState<string[]>([])

  const unitOptions = [
    'unidad', 'paquete', 'caja', 'rollo', 'metro', 'litro', 'gramo', 'kilogramo', 'docena', 'par'
  ]

  const handleInputChange = (field: keyof QuickDisposableData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.name.trim()) {
      newErrors.push('El nombre del artículo es requerido')
    }
    if (formData.sale_price <= 0) {
      newErrors.push('El precio de venta debe ser mayor a 0')
    }
    if (formData.minimum_quantity < 1) {
      newErrors.push('La cantidad mínima debe ser al menos 1')
    }
    if (!formData.unit.trim()) {
      newErrors.push('La unidad de medida es requerida')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    // Create a mock disposable item object for the form
    const mockDisposableItem: DisposableItemInput = {
      disposableItem: {
        id: Date.now(), // Temporary ID
        name: formData.name,
        category: 'desechables', // Always desechables now
        subcategory: formData.subcategory || undefined,
        description: formData.description || undefined,
        unit: formData.unit,
        cost_price: formData.sale_price * 0.6, // Assume 40% margin
        sale_price: formData.sale_price,
        minimum_quantity: formData.minimum_quantity,
        shelf_life_days: formData.shelf_life_days > 0 ? formData.shelf_life_days : undefined,
        storage_requirements: formData.storage_requirements || undefined,
        is_biodegradable: formData.is_biodegradable,
        is_recyclable: formData.is_recyclable,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      quantity: formData.minimum_quantity,
      isCustomPrice: false,
      customPrice: undefined,
      customReason: 'Artículo personalizado para esta cotización',
      isCustomTotalCost: false,
      customTotalCost: undefined,
      associatedProductId: undefined
    }

    onAdd(mockDisposableItem)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      subcategory: '',
      description: '',
      unit: 'unidad',
      sale_price: 0,
      minimum_quantity: 1,
      shelf_life_days: 0,
      storage_requirements: '',
      is_biodegradable: false,
      is_recyclable: false
    })
    setErrors([])
    onClose()
  }

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
        📦 Agregar Artículo Desechable Personalizado
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Crear un artículo desechable específico para esta cotización
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
              label="Nombre del Artículo"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: Platos Biodegradables Premium, Copas de Champagne, etc."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Subcategoría</InputLabel>
              <Select
                value={formData.subcategory}
                label="Subcategoría"
                onChange={(e) => handleInputChange('subcategory', e.target.value)}
              >
                <MenuItem value="">Sin subcategoría</MenuItem>
                {utils.getSubcategoryOptions().map(sub => (
                  <MenuItem key={sub.value} value={sub.value}>
                    {sub.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Unidad</InputLabel>
              <Select
                value={formData.unit}
                label="Unidad"
                onChange={(e) => handleInputChange('unit', e.target.value)}
              >
                {unitOptions.map(unit => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
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
              placeholder="Detalles del artículo, características especiales, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              💰 Precio y Cantidades
            </Typography>
          </Grid>

          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Precio de Venta"
              type="number"
              value={formData.sale_price}
              onChange={(e) => handleInputChange('sale_price', Number(e.target.value))}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>

          <Grid item xs={6} md={4}>
            <TextField
              fullWidth
              label="Cantidad Mínima"
              type="number"
              value={formData.minimum_quantity}
              onChange={(e) => handleInputChange('minimum_quantity', Number(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Vida Útil (Días)"
              type="number"
              value={formData.shelf_life_days}
              onChange={(e) => handleInputChange('shelf_life_days', Number(e.target.value))}
              inputProps={{ min: 0 }}
              helperText="0 = Sin límite"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Requisitos de Almacenamiento"
              value={formData.storage_requirements}
              onChange={(e) => handleInputChange('storage_requirements', e.target.value)}
              placeholder="Ej: Lugar seco, temperatura ambiente, refrigeración, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
              🌱 Características Ambientales
            </Typography>
          </Grid>

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_biodegradable}
                  onChange={(e) => handleInputChange('is_biodegradable', e.target.checked)}
                />
              }
              label="Biodegradable"
            />
          </Grid>

          <Grid item xs={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_recyclable}
                  onChange={(e) => handleInputChange('is_recyclable', e.target.checked)}
                />
              }
              label="Reciclable"
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>💡 Vista previa:</strong> 📦 {formData.name}
                {formData.subcategory && ` (${formData.subcategory})`} - 
                ${formData.sale_price.toLocaleString('es-CO')}/{formData.unit} 
                {formData.minimum_quantity > 1 && ` (Mín: ${formData.minimum_quantity})`}
                {formData.is_biodegradable && ' 🌱'}
                {formData.is_recyclable && ' ♻️'}
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
          color="info"
          disabled={!formData.name.trim() || formData.sale_price <= 0}
        >
          Agregar Artículo
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddDisposableItemDialog
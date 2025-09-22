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

interface QuickAddProductDialogProps {
  open: boolean
  onClose: () => void
  onAdd: (product: CustomProduct) => void
}

interface CustomProduct {
  id: number
  name: string
  category: string
  description: string
  unit: string
  unit_price: number
  quantity: number
  is_taxable: boolean
  requires_setup: boolean
  setup_cost: number
  notes: string
}

interface QuickProductData {
  name: string
  category: string
  description: string
  unit: string
  unit_price: number
  quantity: number
  is_taxable: boolean
  requires_setup: boolean
  setup_cost: number
  notes: string
}

const QuickAddProductDialog: React.FC<QuickAddProductDialogProps> = ({
  open,
  onClose,
  onAdd
}) => {
  const [formData, setFormData] = useState<QuickProductData>({
    name: '',
    category: 'servicio',
    description: '',
    unit: 'unidad',
    unit_price: 0,
    quantity: 1,
    is_taxable: true,
    requires_setup: false,
    setup_cost: 0,
    notes: ''
  })

  const [errors, setErrors] = useState<string[]>([])

  const categoryOptions = [
    { value: 'servicio', label: '🔧 Servicio', icon: '🔧' },
    { value: 'producto', label: '📦 Producto', icon: '📦' },
    { value: 'transporte', label: '🚐 Transporte', icon: '🚐' },
    { value: 'mano_obra', label: '👷 Mano de Obra', icon: '👷' },
    { value: 'consultoria', label: '💼 Consultoría', icon: '💼' },
    { value: 'reparacion', label: '🔨 Reparación', icon: '🔨' },
    { value: 'instalacion', label: '⚡ Instalación', icon: '⚡' },
    { value: 'otros', label: '📋 Otros', icon: '📋' }
  ]

  const unitOptions = [
    'unidad', 'hora', 'día', 'servicio', 'paquete', 'metro', 'metro cuadrado', 
    'kilogramo', 'litro', 'caja', 'lote', 'proyecto', 'evento'
  ]

  const handleInputChange = (field: keyof QuickProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = []

    if (!formData.name.trim()) {
      newErrors.push('El nombre del producto/servicio es requerido')
    }
    if (formData.unit_price <= 0) {
      newErrors.push('El precio unitario debe ser mayor a 0')
    }
    if (formData.quantity <= 0) {
      newErrors.push('La cantidad debe ser mayor a 0')
    }
    if (formData.requires_setup && formData.setup_cost <= 0) {
      newErrors.push('Si requiere instalación, el costo debe ser mayor a 0')
    }

    setErrors(newErrors)
    return newErrors.length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const product: CustomProduct = {
      id: Date.now(), // Temporary ID
      name: formData.name,
      category: formData.category,
      description: formData.description,
      unit: formData.unit,
      unit_price: formData.unit_price,
      quantity: formData.quantity,
      is_taxable: formData.is_taxable,
      requires_setup: formData.requires_setup,
      setup_cost: formData.setup_cost,
      notes: formData.notes
    }

    onAdd(product)
    handleClose()
  }

  const handleClose = () => {
    setFormData({
      name: '',
      category: 'servicio',
      description: '',
      unit: 'unidad',
      unit_price: 0,
      quantity: 1,
      is_taxable: true,
      requires_setup: false,
      setup_cost: 0,
      notes: ''
    })
    setErrors([])
    onClose()
  }

  const totalCost = (formData.unit_price * formData.quantity) + (formData.requires_setup ? formData.setup_cost : 0)
  const categoryData = categoryOptions.find(cat => cat.value === formData.category)

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
        📋 Agregar Producto/Servicio Personalizado
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Crear un producto o servicio específico para esta cotización
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
              label="Nombre del Producto/Servicio"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: Instalación especial, Producto personalizado, etc."
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
              placeholder="Detalles del producto/servicio, especificaciones, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
              💰 Precio y Cantidades
            </Typography>
          </Grid>

          <Grid item xs={6} md={3}>
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

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Precio Unitario"
              type="number"
              value={formData.unit_price}
              onChange={(e) => handleInputChange('unit_price', Number(e.target.value))}
              InputProps={{ startAdornment: '$' }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Cantidad"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', Number(e.target.value))}
              inputProps={{ min: 1, step: formData.unit === 'hora' ? 0.5 : 1 }}
            />
          </Grid>

          <Grid item xs={6} md={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_taxable}
                  onChange={(e) => handleInputChange('is_taxable', e.target.checked)}
                />
              }
              label="Incluye IVA"
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" color="secondary" sx={{ mb: 1 }}>
              🔧 Configuraciones Adicionales
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.requires_setup}
                  onChange={(e) => handleInputChange('requires_setup', e.target.checked)}
                />
              }
              label="Requiere Instalación/Setup"
            />
            {formData.requires_setup && (
              <TextField
                fullWidth
                label="Costo de Instalación"
                type="number"
                value={formData.setup_cost}
                onChange={(e) => handleInputChange('setup_cost', Number(e.target.value))}
                InputProps={{ startAdornment: '$' }}
                sx={{ mt: 1 }}
              />
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Notas Adicionales"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              multiline
              rows={3}
              placeholder="Notas especiales, condiciones, etc."
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
              <Typography variant="body2" color="primary.contrastText">
                <strong>💡 Resumen:</strong><br/>
                {categoryData?.icon} {formData.name}<br/>
                ${formData.unit_price.toLocaleString('es-CO')}/{formData.unit} × {formData.quantity} = ${(formData.unit_price * formData.quantity).toLocaleString('es-CO')}
                {formData.requires_setup && <><br/>+ Instalación: ${formData.setup_cost.toLocaleString('es-CO')}</>}
                <br/><strong>Total: ${totalCost.toLocaleString('es-CO')}</strong>
                {formData.is_taxable && ' (IVA incluido)'}
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
          color="primary"
          disabled={!formData.name.trim() || formData.unit_price <= 0 || formData.quantity <= 0}
        >
          Agregar {formData.category === 'servicio' ? 'Servicio' : 'Producto'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default QuickAddProductDialog
export type { CustomProduct }
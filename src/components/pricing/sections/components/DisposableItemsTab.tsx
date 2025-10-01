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
  Paper,
  Chip
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Nature as EcoIcon, FlashOn as QuickIcon } from '@mui/icons-material'
import { MachineryManagementProps } from '../../types'
import { useActiveDisposableItems, useDisposableItemUtils } from '../../../../hooks/useDisposableItems'
import QuickAddDisposableItemDialog from './QuickAddDisposableItemDialog'

interface DisposableItemsTabProps extends MachineryManagementProps {}

const DisposableItemsTab: React.FC<DisposableItemsTabProps> = ({
  formData,
  updateFormData,
  addDisposableItem,
  removeDisposableItem,
  updateDisposableItem
}) => {
  const { data: availableItems = [] } = useActiveDisposableItems()
  const utils = useDisposableItemUtils()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  
  console.log('DisposableItemsTab - Available items:', availableItems.length)
  console.log('DisposableItemsTab - Current disposable inputs:', formData.disposableItemInputs.length)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getSubcategoryIcon = (subcategory?: string) => {
    return utils.getSubcategoryIcon(subcategory)
  }

  // Calculate total for disposable items
  const disposableTotal = formData.disposableItemInputs.reduce((total, input) => {
    // Si hay costo total personalizado, usarlo; sino calcular normalmente
    if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
      return total + input.customTotalCost
    } else {
      const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
      const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
      return total + (unitPrice * actualQuantity)
    }
  }, 0)

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" color="info.main">
          ➕ Elementos Adicionales e Independientes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            color="info"
            startIcon={<QuickIcon />}
            onClick={() => setShowQuickAdd(true)}
          >
            Elemento Rápido
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<AddIcon />}
            onClick={addDisposableItem}
            disabled={availableItems.length === 0}
          >
            Agregar Elemento
          </Button>
        </Box>
      </Box>

      {availableItems.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay elementos desechables disponibles. Primero agrega elementos en la gestión de inventario.
        </Alert>
      )}

      {formData.disposableItemInputs.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography variant="body2" color="text.secondary">
            No hay elementos desechables agregados. Haz clic en "Agregar Elemento" para comenzar.
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Elementos de un solo uso para completar el evento
          </Typography>
        </Paper>
      ) : (
        <List>
          {formData.disposableItemInputs.map((input, index) => {
            // Calcular precio total considerando costo editado
            let totalPrice
            if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
              totalPrice = input.customTotalCost
            } else {
              const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
              const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
              totalPrice = unitPrice * actualQuantity
            }
            const needsMinWarning = input.quantity < input.disposableItem.minimum_quantity

            return (
              <React.Fragment key={index}>
                <ListItem>
                  <Box sx={{ width: '100%' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Elemento Desechable</InputLabel>
                          <Select
                            value={input.disposableItem.id || ''}
                            label="Elemento Desechable"
                            onChange={(e) => {
                              const selectedItem = availableItems.find(item => item.id === Number(e.target.value))
                              if (selectedItem) {
                                console.log('Changing disposable item to:', selectedItem.name)
                                updateDisposableItem(index, 'disposableItem', selectedItem)
                                // Reset custom pricing when changing item
                                updateDisposableItem(index, 'isCustomPrice', false)
                                updateDisposableItem(index, 'customPrice', undefined)
                                updateDisposableItem(index, 'isCustomTotalCost', false)
                                updateDisposableItem(index, 'customTotalCost', undefined)
                                // Update quantity to minimum if current is less than new minimum
                                if (input.quantity < selectedItem.minimum_quantity) {
                                  updateDisposableItem(index, 'quantity', selectedItem.minimum_quantity)
                                }
                              }
                            }}
                          >
                            {availableItems.map(item => (
                              <MenuItem key={item.id} value={item.id}>
                                {getSubcategoryIcon(item.subcategory)} {item.name} - {formatCurrency(item.sale_price)}/{item.unit}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {input.disposableItem.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {input.disposableItem.description}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item xs={6} md={2}>
                        <TextField
                          label={`Cantidad (${input.disposableItem.unit})`}
                          type="number"
                          size="small"
                          value={input.quantity}
                          onChange={(e) => {
                            const rawValue = e.target.value
                            const numericValue = Number(rawValue)
                            const newQuantity = isNaN(numericValue) ? 1 : Math.max(1, numericValue)
                            console.log(`Updating disposable item ${index} quantity from ${input.quantity} to:`, newQuantity)
                            updateDisposableItem(index, 'quantity', newQuantity)
                          }}
                          onBlur={(e) => {
                            // Ensure minimum quantity on blur
                            const currentValue = Number(e.target.value)
                            if (currentValue < input.disposableItem.minimum_quantity) {
                              updateDisposableItem(index, 'quantity', input.disposableItem.minimum_quantity)
                            }
                          }}
                          inputProps={{ 
                            min: 1,
                            step: 1
                          }}
                          fullWidth
                          error={needsMinWarning}
                          helperText={needsMinWarning ? `Mínimo: ${input.disposableItem.minimum_quantity}` : ''}
                          variant="outlined"
                        />
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Producto Asociado</InputLabel>
                          <Select
                            value={input.associatedProductId || ''}
                            label="Producto Asociado"
                            onChange={(e) => {
                              updateDisposableItem(index, 'associatedProductId', e.target.value ? Number(e.target.value) : undefined)
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

                      <Grid item xs={6} md={2}>
                        {input.isCustomTotalCost ? (
                          <TextField
                            label="Costo Total"
                            type="number"
                            size="small"
                            value={input.customTotalCost !== undefined ? input.customTotalCost : totalPrice}
                            onChange={(e) => {
                              const newCost = Number(e.target.value)
                              updateDisposableItem(index, 'customTotalCost', newCost)
                              updateDisposableItem(index, 'isCustomTotalCost', true)
                            }}
                            InputProps={{ startAdornment: '$' }}
                            fullWidth
                          />
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                {formatCurrency(totalPrice)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(() => {
                                  const unitPrice = input.isCustomPrice && input.customPrice ? input.customPrice : input.disposableItem.sale_price
                                  const actualQuantity = Math.max(input.quantity, input.disposableItem.minimum_quantity)
                                  return `${formatCurrency(unitPrice)} × ${actualQuantity}`
                                })()} 
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => {
                                updateDisposableItem(index, 'isCustomTotalCost', true)
                                updateDisposableItem(index, 'customTotalCost', totalPrice)
                              }}
                              title="Editar costo total"
                            >
                              ✏️
                            </IconButton>
                          </Box>
                        )}
                      </Grid>

                      <Grid item xs={6} md={2}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {input.disposableItem.is_biodegradable && <Chip icon={<EcoIcon />} label="Biodegradable" size="small" color="success" />}
                          {input.disposableItem.is_recyclable && <Chip label="Reciclable" size="small" color="info" />}
                          {input.disposableItem.subcategory && (
                            <Chip 
                              label={input.disposableItem.subcategory} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={1}>
                        <IconButton
                          color="error"
                          onClick={() => removeDisposableItem(index)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Grid>
                    </Grid>

                    {(input.isCustomPrice || input.isCustomTotalCost) && (
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {/* Precio personalizado por unidad */}
                        {!input.isCustomTotalCost && (
                          <Grid item xs={12} md={6}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={input.isCustomPrice}
                                  onChange={(e) => updateDisposableItem(index, 'isCustomPrice', e.target.checked)}
                                />
                              }
                              label="Precio Custom/Unidad"
                            />
                            {input.isCustomPrice && (
                              <TextField
                                label="Precio por unidad"
                                type="number"
                                size="small"
                                value={input.customPrice || ''}
                                onChange={(e) => updateDisposableItem(index, 'customPrice', Number(e.target.value) || undefined)}
                                fullWidth
                                sx={{ mt: 1 }}
                              />
                            )}
                          </Grid>
                        )}
                        
                        {/* Razón del precio personalizado */}
                        <Grid item xs={12} md={input.isCustomTotalCost ? 12 : 6}>
                          <TextField
                            label={input.isCustomTotalCost ? "Razón del costo total editado" : "Razón del precio personalizado"}
                            size="small"
                            value={input.customReason || ''}
                            onChange={(e) => updateDisposableItem(index, 'customReason', e.target.value || undefined)}
                            fullWidth
                            placeholder="Ej: Descuento por volumen, Calidad premium, etc."
                          />
                        </Grid>
                      </Grid>
                    )}

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {(() => {
                        // Si hay costo total personalizado, mostrar info específica
                        if (input.isCustomTotalCost && input.customTotalCost !== undefined) {
                          return `Costo total editado: ${formatCurrency(input.customTotalCost)}`
                        }
                        // Mostrar información estándar
                        const parts = []
                        if (input.disposableItem.subcategory) {
                          parts.push(`Tipo: ${input.disposableItem.subcategory}`)
                        }
                        if (input.disposableItem.shelf_life_days) {
                          parts.push(`Vida útil: ${input.disposableItem.shelf_life_days} días`)
                        }
                        if (input.disposableItem.storage_requirements) {
                          parts.push(`Almacenamiento: ${input.disposableItem.storage_requirements}`)
                        }
                        if (input.associatedProductId) {
                          const associatedProduct = formData.productInputs.find(p => p.product.id === input.associatedProductId)
                          if (associatedProduct) {
                            parts.push(`Asociado a: ${associatedProduct.product.name}`)
                          }
                        }
                        return parts.length > 0 ? parts.join(' • ') : 'Elemento desechable'
                      })()}
                    </Typography>
                  </Box>
                </ListItem>
                {index < formData.disposableItemInputs.length - 1 && <Divider />}
              </React.Fragment>
            )
          })}
        </List>
      )}

      {formData.disposableItemInputs.length > 0 && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
          <Typography variant="h6" color="info.contrastText">
            Total Elementos Adicionales: {formatCurrency(disposableTotal)}
          </Typography>
        </Box>
      )}

      <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'info.main', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          <strong>💡 Elementos incluidos:</strong> Vajilla desechable, servilletas, bolsas de basura, elementos decorativos de un solo uso, etc.
        </Typography>
      </Box>

      <QuickAddDisposableItemDialog
        open={showQuickAdd}
        onClose={() => setShowQuickAdd(false)}
        onAdd={(disposableItem) => {
          // Agregar directamente el disposable item completo
          updateFormData('disposableItemInputs', [...formData.disposableItemInputs, disposableItem])
        }}
      />
    </>
  )
}

export default DisposableItemsTab
import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material'
import { Add as AddIcon, Remove as RemoveIcon, LocalOffer as PriceIcon } from '@mui/icons-material'
import { useActiveProducts } from '../../../hooks/useProducts'
import { ProductManagementProps } from '../types'
import { Product } from '../../../types'

const PricingProductSelection: React.FC<ProductManagementProps> = ({
  formData,
  addProduct,
  removeProduct,
  updateProduct
}) => {
  const { data: products = [], isLoading: loadingProducts } = useActiveProducts()

  // Function to calculate product cost
  const calculateProductCost = (product: Product, quantity: number, unitsPerProduct?: number, customPrice?: number): number => {
    if (customPrice) {
      if (product.pricing_type === 'unit') {
        // Custom price is per complete product
        return customPrice * quantity
      } else {
        // Custom price is per measurement unit
        return customPrice * quantity * (unitsPerProduct || 1)
      }
    }
    
    if (product.pricing_type === 'unit') {
      // Fixed price per complete product
      return product.base_price * quantity
    } else {
      // Price per measurement unit × quantity of products × units per product
      return product.base_price * quantity * (unitsPerProduct || 1)
    }
  }

  // Function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Function to get pricing type display
  const getPricingTypeDisplay = (product: Product): string => {
    return product.pricing_type === 'unit' 
      ? `Precio único: ${formatCurrency(product.base_price)}` 
      : `Por ${product.unit}: ${formatCurrency(product.base_price)}`
  }
  return (
    <Card>
      <CardHeader 
        title="Productos y Servicios"
        action={
          <Button
            startIcon={<AddIcon />}
            onClick={addProduct}
            size="small"
            disabled={loadingProducts}
          >
            {loadingProducts ? 'Cargando...' : 'Agregar'}
          </Button>
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          {formData.productInputs.map((input, index) => (
            <Grid item xs={12} key={index}>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Producto</InputLabel>
                      <Select
                        value={input.product.id}
                        label="Producto"
                        onChange={(e) => {
                          const product = products.find(prod => prod.id === Number(e.target.value))
                          if (product) updateProduct(index, 'product', product)
                        }}
                        renderValue={(value) => {
                          const product = products.find(p => p.id === value)
                          return product ? product.name : 'Seleccionar producto'
                        }}
                      >
                        {products.map(prod => (
                          <MenuItem key={prod.id} value={prod.id}>
                            <Box>
                              <Typography variant="body2">{prod.name}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {prod.category} • {getPricingTypeDisplay(prod)}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    {input.product && (
                      <Box mt={1} display="flex" gap={0.5} flexWrap="wrap">
                        <Chip 
                          size="small" 
                          label={input.product.category} 
                          color="primary" 
                          variant="outlined"
                        />
                        {input.product.pricing_type === 'unit' ? (
                          <Chip 
                            size="small" 
                            label="Precio único" 
                            color="success" 
                            variant="outlined"
                          />
                        ) : (
                          <Chip 
                            size="small" 
                            label={`Por ${input.product.unit}`} 
                            color="info" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={input.product.pricing_type === 'measurement' ? 1.5 : 2}>
                    <TextField
                      fullWidth
                      type="number"
                      label={input.product.pricing_type === 'unit' ? 'Cantidad' : 'Productos'}
                      size="small"
                      value={input.quantity}
                      onChange={(e) => updateProduct(index, 'quantity', Number(e.target.value))}
                      inputProps={{ min: input.product.minimum_order || 1, step: 1 }}
                      helperText={input.product.pricing_type === 'unit' ? '' : 'Ej: 10 frappes'}
                    />
                  </Grid>
                  
                  {input.product.pricing_type === 'measurement' && (
                    <Grid item xs={12} sm={1.5}>
                      <TextField
                        fullWidth
                        type="number"
                        label={`${input.product.unit}/producto`}
                        size="small"
                        value={input.unitsPerProduct || ''}
                        onChange={(e) => updateProduct(index, 'unitsPerProduct', Number(e.target.value))}
                        inputProps={{ min: 0.1, step: 0.1 }}
                        helperText="Ej: 7 onzas"
                        required
                      />
                    </Grid>
                  )}
                  <Grid item xs={12} sm={2}>
                    <Box sx={{ 
                      border: 1, 
                      borderColor: 'success.main', 
                      borderRadius: 1, 
                      p: 1, 
                      bgcolor: 'success.light',
                      textAlign: 'center'
                    }}>
                      <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(calculateProductCost(input.product, input.quantity, input.unitsPerProduct, input.customPrice))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {input.product.pricing_type === 'measurement' && input.unitsPerProduct 
                          ? `${input.quantity} × ${input.unitsPerProduct} ${input.product.unit}`
                          : 'Total'
                        }
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={input.isVariable}
                          onChange={(e) => updateProduct(index, 'isVariable', e.target.checked)}
                        />
                      }
                      label="Precio custom"
                    />
                  </Grid>
                  {input.isVariable && (
                    <>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          type="number"
                          label={input.product.pricing_type === 'unit' ? 'Precio custom por producto' : `Precio custom por ${input.product.unit}`}
                          size="small"
                          value={input.customPrice || ''}
                          onChange={(e) => updateProduct(index, 'customPrice', Number(e.target.value))}
                          helperText={`Normal: ${formatCurrency(input.product.base_price)}${input.product.pricing_type === 'unit' ? ' por producto' : ` por ${input.product.unit}`}`}
                        />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <TextField
                          fullWidth
                          label="Razón del cambio"
                          size="small"
                          value={input.customReason || ''}
                          onChange={(e) => updateProduct(index, 'customReason', e.target.value)}
                          placeholder="Ej: Descuento cliente frecuente"
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sm={1}>
                    <Button
                      color="error"
                      onClick={() => removeProduct(index)}
                      size="small"
                    >
                      <RemoveIcon />
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
          {formData.productInputs.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" textAlign="center">
                No hay productos agregados. Agrega productos para calcular costos.
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default PricingProductSelection
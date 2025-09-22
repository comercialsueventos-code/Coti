import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Alert,
  Divider
} from '@mui/material'
import { ProductPricingProps } from '../types'

const ProductPricing: React.FC<ProductPricingProps> = ({
  formData,
  onFormDataChange
}) => {

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          💰 Configuración de Costos
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth required>
          <InputLabel>Tipo de Pricing</InputLabel>
          <Select
            value={formData.pricing_type}
            label="Tipo de Pricing"
            onChange={(e) => onFormDataChange('pricing_type', e.target.value)}
          >
            <MenuItem value="unit">
              📦 Precio por unidad completa
            </MenuItem>
            <MenuItem value="measurement">
              📏 Precio por unidad de medida
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={8}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            {formData.pricing_type === 'measurement' ? (
              <>
                <strong>Precio por unidad de medida:</strong> Define el precio por cada unidad (ej. onza, gramo, ml). 
                En las cotizaciones podrás especificar cuántos productos y de qué tamaño. 
                <br />
                <em>Ejemplo: Frappe a $200/onza → 100 frappes de 7 onzas = 100 × 7 × $200 = $140,000</em>
              </>
            ) : (
              <>
                <strong>Precio por unidad completa:</strong> Define un precio fijo por cada producto completo. 
                En las cotizaciones solo especificarás la cantidad de productos.
                <br />
                <em>Ejemplo: Hamburguesa a $8,000 → 10 hamburguesas = 10 × $8,000 = $80,000</em>
              </>
            )}
          </Typography>
        </Alert>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label={
            formData.pricing_type === 'measurement' 
              ? `Costo por ${formData.unit}` 
              : "Costo por producto"
          }
          type="number"
          value={formData.base_price}
          onChange={(e) => onFormDataChange('base_price', Number(e.target.value))}
          InputProps={{
            startAdornment: <InputAdornment position="start">$</InputAdornment>
          }}
          required
          helperText={
            formData.pricing_type === 'measurement' 
              ? "Ejemplo: $200 por onza" 
              : "Ejemplo: $5000 por hamburguesa"
          }
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Pedido mínimo"
          type="number"
          value={formData.minimum_order}
          onChange={(e) => onFormDataChange('minimum_order', Number(e.target.value))}
          inputProps={{ min: 1 }}
          required
        />
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>💡 Nota:</strong> El margen de ganancia se aplica a nivel general en cada cotización, 
            no por producto individual. Este costo se usará como base para los cálculos.
          </Typography>
        </Alert>
      </Grid>
    </>
  )
}

export default ProductPricing
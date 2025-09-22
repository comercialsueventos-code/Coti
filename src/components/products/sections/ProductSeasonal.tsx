import React from 'react'
import {
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Chip,
  Divider
} from '@mui/material'
import { MONTHS } from '@/shared/constants'
import { ProductSeasonalProps } from '../types'

const ProductSeasonal: React.FC<ProductSeasonalProps> = ({
  formData,
  onFormDataChange
}) => {
  const toggleMonth = (month: number) => {
    const updatedMonths = formData.seasonal_months.includes(month)
      ? formData.seasonal_months.filter(m => m !== month)
      : [...formData.seasonal_months, month].sort((a, b) => a - b)
    onFormDataChange('seasonal_months', updatedMonths)
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          📅 Disponibilidad Estacional
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.is_seasonal}
              onChange={(e) => onFormDataChange('is_seasonal', e.target.checked)}
            />
          }
          label="Producto estacional"
        />
      </Grid>
      
      {formData.is_seasonal && (
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Meses disponibles:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {MONTHS.map((month) => (
              <Chip
                key={month.value}
                label={month.label}
                onClick={() => toggleMonth(month.value)}
                color={formData.seasonal_months.includes(month.value) ? 'primary' : 'default'}
                variant={formData.seasonal_months.includes(month.value) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </Grid>
      )}
    </>
  )
}

export default ProductSeasonal
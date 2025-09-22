import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material'
import { Schedule as ScheduleIcon } from '@mui/icons-material'
import { ProductTimesProps } from '../types'

const ProductTimes: React.FC<ProductTimesProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          ⏱️ Tiempos y Vida Útil
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Tiempo de preparación (minutos)"
          type="number"
          value={formData.preparation_time_minutes}
          onChange={(e) => onFormDataChange('preparation_time_minutes', Number(e.target.value))}
          InputProps={{
            startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Vida útil (horas)"
          type="number"
          value={formData.shelf_life_hours}
          onChange={(e) => onFormDataChange('shelf_life_hours', Number(e.target.value))}
          InputProps={{
            startAdornment: <ScheduleIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Grid>
    </>
  )
}

export default ProductTimes
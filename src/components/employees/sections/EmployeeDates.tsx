import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  Divider
} from '@mui/material'
import { EmployeeDatesProps } from '../types'

const EmployeeDates: React.FC<EmployeeDatesProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          📅 Fechas
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Fecha de contratación"
          type="date"
          value={formData.hire_date}
          onChange={(e) => onFormDataChange('hire_date', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Fecha de nacimiento"
          type="date"
          value={formData.birth_date}
          onChange={(e) => onFormDataChange('birth_date', e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </>
  )
}

export default EmployeeDates
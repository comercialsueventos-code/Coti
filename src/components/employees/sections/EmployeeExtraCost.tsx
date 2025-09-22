import React from 'react'
import {
  Grid,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material'
import { EmployeeFormSectionProps } from '../types'

interface EmployeeExtraCostProps extends EmployeeFormSectionProps {}

const EmployeeExtraCost: React.FC<EmployeeExtraCostProps> = ({
  formData,
  onFormDataChange,
  errors
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          💰 Costos Adicionales
        </Typography>
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Costo Extra por Defecto"
          type="number"
          value={formData.default_extra_cost || ''}
          onChange={(e) => onFormDataChange('default_extra_cost', e.target.value ? Number(e.target.value) : undefined)}
          helperText="Costo adicional por defecto (ARL, bonificaciones, etc.)"
          inputProps={{ 
            min: 0, 
            step: 1000 
          }}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Razón del Costo Extra"
          value={formData.default_extra_cost_reason || ''}
          onChange={(e) => onFormDataChange('default_extra_cost_reason', e.target.value || undefined)}
          helperText="Descripción del costo adicional"
          placeholder="Ej: ARL, bonificación de experiencia, costo de transporte"
        />
      </Grid>

      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>💡 Información:</strong> Este costo se aplicará automáticamente como valor por defecto 
            al agregar este empleado a una cotización. Puede ser modificado manualmente en cada cotización.
          </Typography>
        </Alert>
      </Grid>
    </>
  )
}

export default EmployeeExtraCost
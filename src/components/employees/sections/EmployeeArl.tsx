import React from 'react'
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material'
import { EmployeeArlProps } from '../types'

const EmployeeArl: React.FC<EmployeeArlProps> = ({
  formData,
  onFormDataChange
}) => {
  return (
    <>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.has_arl}
              onChange={(e) => onFormDataChange('has_arl', e.target.checked)}
            />
          }
          label="Tiene ARL"
        />
      </Grid>
      
      {formData.has_arl && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Proveedor ARL"
            value={formData.arl_provider}
            onChange={(e) => onFormDataChange('arl_provider', e.target.value)}
          />
        </Grid>
      )}
    </>
  )
}

export default EmployeeArl
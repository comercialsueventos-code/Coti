import React from 'react'
import {
  Grid,
  TextField,
  Switch,
  FormControlLabel
} from '@mui/material'
import { EmployeeNotesProps } from '../types'

const EmployeeNotes: React.FC<EmployeeNotesProps> = ({
  formData,
  onFormDataChange,
  mode
}) => {
  return (
    <>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Notas adicionales"
          multiline
          rows={3}
          value={formData.notes}
          onChange={(e) => onFormDataChange('notes', e.target.value)}
        />
      </Grid>

      {mode === 'edit' && (
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => onFormDataChange('is_active', e.target.checked)}
              />
            }
            label="Empleado activo"
          />
        </Grid>
      )}
    </>
  )
}

export default EmployeeNotes
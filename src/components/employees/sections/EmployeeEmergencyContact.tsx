import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  Divider
} from '@mui/material'
import { EmployeeEmergencyContactProps } from '../types'

const EmployeeEmergencyContact: React.FC<EmployeeEmergencyContactProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleEmergencyContactChange = (field: string, value: string) => {
    onFormDataChange('emergency_contact', {
      ...formData.emergency_contact,
      [field]: value
    })
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          🚨 Contacto de Emergencia
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Nombre"
          value={formData.emergency_contact.name}
          onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Teléfono"
          value={formData.emergency_contact.phone}
          onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <TextField
          fullWidth
          label="Parentesco"
          value={formData.emergency_contact.relationship}
          onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
        />
      </Grid>
    </>
  )
}

export default EmployeeEmergencyContact
import React, { useState } from 'react'
import {
  Grid,
  Typography,
  Box,
  TextField,
  IconButton,
  Chip,
  Autocomplete,
  Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { EMPLOYEE_CERTIFICATIONS } from '@/shared/constants'
import { EmployeeCertificationsProps } from '../types'

const EmployeeCertifications: React.FC<EmployeeCertificationsProps> = ({
  formData,
  onFormDataChange
}) => {
  const [newCertification, setNewCertification] = useState('')

  const addCertification = () => {
    if (newCertification && !formData.certifications.includes(newCertification)) {
      onFormDataChange('certifications', [...formData.certifications, newCertification])
      setNewCertification('')
    }
  }

  const removeCertification = (certification: string) => {
    onFormDataChange('certifications', formData.certifications.filter(c => c !== certification))
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          📜 Certificaciones
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Box display="flex" gap={1} mb={2}>
          <Autocomplete
            freeSolo
            options={EMPLOYEE_CERTIFICATIONS.map(cert => cert.label)}
            value={newCertification}
            onChange={(_, value) => setNewCertification(value || '')}
            onInputChange={(_, value) => setNewCertification(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Agregar certificación"
                size="small"
                sx={{ minWidth: 200 }}
              />
            )}
          />
          <IconButton onClick={addCertification} disabled={!newCertification}>
            <AddIcon />
          </IconButton>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1}>
          {formData.certifications.map((cert) => (
            <Chip
              key={cert}
              label={cert}
              onDelete={() => removeCertification(cert)}
              deleteIcon={<DeleteIcon />}
            />
          ))}
        </Box>
      </Grid>
    </>
  )
}

export default EmployeeCertifications
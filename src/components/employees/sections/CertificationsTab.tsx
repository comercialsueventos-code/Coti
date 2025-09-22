import React from 'react'
import {
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Autocomplete,
  Chip
} from '@mui/material'
import { FormData } from '../utils/categoryFormValidation'
import { COMMON_CERTIFICATIONS } from '@/shared/constants'

interface CertificationsTabProps {
  formData: FormData
  errors: Record<string, string>
  onInputChange: (field: keyof FormData, value: any) => void
}

const CertificationsTab: React.FC<CertificationsTabProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          🎓 Certificaciones y Requisitos
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Configura las certificaciones por defecto y requisitos para esta categoría.
        </Typography>
      </Grid>

      {/* Certificaciones Requeridas Toggle */}
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.requires_certification}
              onChange={(e) => onInputChange('requires_certification', e.target.checked)}
            />
          }
          label="Esta categoría requiere certificaciones específicas"
        />
      </Grid>

      {/* Certificaciones por Defecto */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Certificaciones por Defecto
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={COMMON_CERTIFICATIONS}
          value={formData.default_certifications}
          onChange={(_, value) => onInputChange('default_certifications', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip 
                key={index}
                variant="outlined" 
                label={option} 
                {...getTagProps({ index })} 
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Agregar certificaciones"
              helperText="Certificaciones que se asignarán por defecto"
            />
          )}
        />
      </Grid>

      {/* Certificaciones Requeridas */}
      {formData.requires_certification && (
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>
            Certificaciones Requeridas
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={COMMON_CERTIFICATIONS}
            value={formData.required_certifications}
            onChange={(_, value) => onInputChange('required_certifications', value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip 
                  key={index}
                  color="error" 
                  variant="outlined" 
                  label={option} 
                  {...getTagProps({ index })} 
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Agregar certificaciones obligatorias"
                helperText="Certificaciones obligatorias para esta categoría"
              />
            )}
          />
        </Grid>
      )}

      {/* Experiencia Mínima */}
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          type="number"
          label="Experiencia Mínima (meses)"
          value={formData.min_experience_months}
          onChange={(e) => onInputChange('min_experience_months', Number(e.target.value))}
          inputProps={{ min: 0 }}
          helperText="0 = sin experiencia requerida"
        />
      </Grid>

      {/* Información sobre certificaciones */}
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" paragraph>
          <strong>Certificaciones Comunes:</strong>
        </Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COMMON_CERTIFICATIONS.map((cert) => (
            <Chip
              key={cert}
              label={cert}
              size="small"
              variant="outlined"
              color="default"
            />
          ))}
        </div>
      </Grid>
    </Grid>
  )
}

export default CertificationsTab
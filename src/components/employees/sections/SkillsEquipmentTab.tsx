import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  Autocomplete,
  Chip
} from '@mui/material'
import { FormData } from '../utils/categoryFormValidation'
import { COMMON_SKILLS, COMMON_EQUIPMENT } from '@/shared/constants'

interface SkillsEquipmentTabProps {
  formData: FormData
  errors: Record<string, string>
  onInputChange: (field: keyof FormData, value: any) => void
}

const SkillsEquipmentTab: React.FC<SkillsEquipmentTabProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          🛠️ Habilidades y Equipos
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Define las habilidades especiales y equipos que puede manejar esta categoría.
        </Typography>
      </Grid>

      {/* Habilidades Especiales */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Habilidades Especiales
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={COMMON_SKILLS}
          value={formData.special_skills}
          onChange={(_, value) => onInputChange('special_skills', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip 
                key={index}
                color="info" 
                variant="outlined" 
                label={option} 
                {...getTagProps({ index })} 
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Agregar habilidades"
              helperText="Habilidades que ofrece esta categoría"
            />
          )}
        />
      </Grid>

      {/* Acceso a Equipos */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Acceso a Equipos
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={COMMON_EQUIPMENT}
          value={formData.equipment_access}
          onChange={(_, value) => onInputChange('equipment_access', value)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip 
                key={index}
                color="success" 
                variant="outlined" 
                label={option} 
                {...getTagProps({ index })} 
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Agregar equipos"
              helperText="Equipos que puede usar esta categoría"
            />
          )}
        />
      </Grid>

      {/* Información sobre habilidades */}
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" paragraph>
          <strong>Habilidades Comunes:</strong>
        </Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {COMMON_SKILLS.map((skill) => (
            <Chip
              key={skill}
              label={skill}
              size="small"
              variant="outlined"
              color="info"
            />
          ))}
        </div>
      </Grid>

      {/* Información sobre equipos */}
      <Grid item xs={12}>
        <Typography variant="caption" color="text.secondary" paragraph>
          <strong>Equipos Comunes:</strong>
        </Typography>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {COMMON_EQUIPMENT.map((equipment) => (
            <Chip
              key={equipment}
              label={equipment}
              size="small"
              variant="outlined"
              color="success"
            />
          ))}
        </div>
      </Grid>
    </Grid>
  )
}

export default SkillsEquipmentTab
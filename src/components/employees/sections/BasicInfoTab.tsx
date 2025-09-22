import React from 'react'
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  InputAdornment,
  Alert,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material'
import { Palette as PaletteIcon } from '@mui/icons-material'
import { FormData } from '../utils/categoryFormValidation'
import { 
  COMMON_ICONS, 
  COMMON_COLORS, 
  CATEGORY_TYPES, 
  PRICING_TYPES 
} from '@/shared/constants'

interface BasicInfoTabProps {
  formData: FormData
  errors: Record<string, string>
  onInputChange: (field: keyof FormData, value: any) => void
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  return (
    <Grid container spacing={3}>
      {/* Nombre y Tipo */}
      <Grid item xs={12} md={8}>
        <TextField
          fullWidth
          label="Nombre de la Categoría"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          error={!!errors.name}
          helperText={errors.name}
          required
          placeholder="ej: Chef Senior, Operario Especializado"
        />
      </Grid>
      
      <Grid item xs={12} md={4}>
        <FormControl fullWidth required error={!!errors.category_type}>
          <InputLabel>Tipo Base</InputLabel>
          <Select
            value={formData.category_type}
            label="Tipo Base"
            onChange={(e) => onInputChange('category_type', e.target.value)}
          >
            {CATEGORY_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.icon} {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Descripción */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Descripción"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          multiline
          rows={2}
          placeholder="Describe las responsabilidades y características de esta categoría..."
        />
      </Grid>

      {/* Tipo de Tarifa */}
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
          <CardContent>
            <FormLabel component="legend">
              <Typography variant="h6" gutterBottom>
                💰 Tipo de Tarifa
              </Typography>
            </FormLabel>
            <RadioGroup
              value={formData.pricing_type}
              onChange={(e) => onInputChange('pricing_type', e.target.value)}
              row
            >
              {PRICING_TYPES.map((type) => (
                <FormControlLabel
                  key={type.value}
                  value={type.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="subtitle1">
                        {type.icon} {type.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
            
            {formData.pricing_type === 'plana' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Tarifa Plana:</strong> Precio fijo por hora independientemente de la cantidad de horas trabajadas.
                </Typography>
              </Alert>
            )}
            
            {formData.pricing_type === 'flexible' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Tarifa Flexible:</strong> Diferentes precios según rangos de horas (ej: 1-4h, 4-8h, 8h+).
                </Typography>
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Tarifa Plana - Solo si se selecciona tarifa plana */}
      {formData.pricing_type === 'plana' && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Tarifa por Hora"
            type="number"
            value={formData.flat_rate}
            onChange={(e) => onInputChange('flat_rate', Number(e.target.value))}
            error={!!errors.flat_rate}
            helperText={errors.flat_rate}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>
            }}
            inputProps={{ min: 0 }}
            required
          />
        </Grid>
      )}

      {/* Icono */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Icono de la Categoría
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
          {COMMON_ICONS.map((icon) => (
            <Chip
              key={icon}
              label={icon}
              clickable
              color={formData.icon === icon ? 'primary' : 'default'}
              onClick={() => onInputChange('icon', icon)}
            />
          ))}
        </Box>
        <TextField
          fullWidth
          size="small"
          value={formData.icon}
          onChange={(e) => onInputChange('icon', e.target.value)}
          placeholder="O introduce un emoji personalizado"
        />
      </Grid>

      {/* Color */}
      <Grid item xs={12} md={6}>
        <Typography variant="subtitle2" gutterBottom>
          Color de la Categoría
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
          {COMMON_COLORS.map((color) => (
            <Box
              key={color}
              sx={{
                width: 32,
                height: 32,
                bgcolor: color,
                borderRadius: 1,
                cursor: 'pointer',
                border: formData.color === color ? '3px solid #000' : '1px solid #ccc'
              }}
              onClick={() => onInputChange('color', color)}
            />
          ))}
        </Box>
        <TextField
          fullWidth
          size="small"
          value={formData.color}
          onChange={(e) => onInputChange('color', e.target.value)}
          placeholder="#000000"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PaletteIcon />
              </InputAdornment>
            )
          }}
        />
      </Grid>
    </Grid>
  )
}

export default BasicInfoTab
import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box,
  Avatar
} from '@mui/material'
import { EMPLOYEE_TYPES } from '@/shared/constants'
import { EmployeeBasicInfoProps } from '../types'
import { useActiveEmployeeCategories } from '../../../hooks/useEmployeeCategories'

const EmployeeBasicInfo: React.FC<EmployeeBasicInfoProps> = ({
  formData,
  onFormDataChange,
  errors
}) => {
  const { data: categories = [] } = useActiveEmployeeCategories()

  // Filter categories by employee type if one is selected
  const filteredCategories = formData.employee_type 
    ? categories.filter(cat => cat.category_type === formData.employee_type)
    : categories

  const selectedCategory = categories.find(cat => cat.id === formData.category_id)

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          📋 Información Básica
        </Typography>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Nombre completo"
          value={formData.name}
          onChange={(e) => onFormDataChange('name', e.target.value)}
          error={!!errors?.name}
          helperText={errors?.name}
          required
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required error={!!errors?.employee_type}>
          <InputLabel>Tipo de Empleado</InputLabel>
          <Select
            value={formData.employee_type}
            label="Tipo de Empleado"
            onChange={(e) => onFormDataChange('employee_type', e.target.value)}
          >
            {EMPLOYEE_TYPES.map((type) => (
              <MenuItem key={type.value} value={type.value}>
                {type.icon} {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12}>
        <FormControl fullWidth error={!!errors?.category_id}>
          <InputLabel>Categoría del Empleado</InputLabel>
          <Select
            value={formData.category_id || ''}
            label="Categoría del Empleado"
            onChange={(e) => onFormDataChange('category_id', e.target.value ? Number(e.target.value) : null)}
            disabled={!formData.employee_type}
          >
            <MenuItem value="">
              <em>Sin categoría específica</em>
            </MenuItem>
            {filteredCategories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                <Box display="flex" alignItems="center" gap={1} width="100%">
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      bgcolor: category.color,
                      fontSize: '12px'
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="body2">
                      {category.name}
                    </Typography>
                    {category.description && (
                      <Typography variant="caption" color="text.secondary">
                        {category.description}
                      </Typography>
                    )}
                  </Box>
                  <Chip 
                    size="small" 
                    label={`${category.default_hourly_rates.length} tarifa(s)`}
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
          {!formData.employee_type && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, ml: 2 }}>
              Selecciona primero un tipo de empleado
            </Typography>
          )}
          {selectedCategory && (
            <Box sx={{ mt: 1, ml: 2 }}>
              <Chip 
                avatar={
                  <Avatar sx={{ bgcolor: selectedCategory.color, fontSize: '10px' }}>
                    {selectedCategory.icon}
                  </Avatar>
                }
                label={`${selectedCategory.name} - ${selectedCategory.default_hourly_rates.length} tarifa(s)`}
                size="small"
                color="primary"
                variant="outlined"
              />
              {selectedCategory.default_certifications.length > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Incluye: {selectedCategory.default_certifications.join(', ')}
                </Typography>
              )}
            </Box>
          )}
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Cédula"
          value={formData.identification_number}
          onChange={(e) => onFormDataChange('identification_number', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Teléfono"
          value={formData.phone}
          onChange={(e) => onFormDataChange('phone', e.target.value)}
          placeholder="+57 300 123 4567"
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => onFormDataChange('email', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Dirección"
          value={formData.address}
          onChange={(e) => onFormDataChange('address', e.target.value)}
        />
      </Grid>
    </>
  )
}

export default EmployeeBasicInfo
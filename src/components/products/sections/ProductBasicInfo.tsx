import React from 'react'
import {
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { PRODUCT_UNITS as UNITS_BY_TYPE } from '@/shared/constants'
import { ProductBasicInfoProps } from '../types'
import { useActiveCategories } from '../../../hooks/useCategories'

const ProductBasicInfo: React.FC<ProductBasicInfoProps> = ({
  formData,
  onFormDataChange,
  errors
}) => {
  const { data: categories = [] } = useActiveCategories()
  
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
          label="Nombre del producto"
          value={formData.name}
          onChange={(e) => onFormDataChange('name', e.target.value)}
          error={!!errors?.name}
          helperText={errors?.name}
          required
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={formData.category_id || ''}
            label="Categoría"
            onChange={(e) => onFormDataChange('category_id', Number(e.target.value))}
          >
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.icon ? `${category.icon} ` : ''}{category.display_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Subcategoría"
          value={formData.subcategory}
          onChange={(e) => onFormDataChange('subcategory', e.target.value)}
        />
      </Grid>
      
      <Grid item xs={12} md={6}>
        <FormControl fullWidth required>
          <InputLabel>
            {formData.pricing_type === 'measurement' ? 'Unidad de medida' : 'Tipo de producto'}
          </InputLabel>
          <Select
            value={formData.unit}
            label={formData.pricing_type === 'measurement' ? 'Unidad de medida' : 'Tipo de producto'}
            onChange={(e) => onFormDataChange('unit', e.target.value)}
          >
            {UNITS_BY_TYPE[formData.pricing_type].map((unit) => (
              <MenuItem key={unit} value={unit}>
                {unit}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      
      <Grid item xs={12}>
        <TextField
          fullWidth
          label="Descripción"
          multiline
          rows={3}
          value={formData.description}
          onChange={(e) => onFormDataChange('description', e.target.value)}
        />
      </Grid>
    </>
  )
}

export default ProductBasicInfo
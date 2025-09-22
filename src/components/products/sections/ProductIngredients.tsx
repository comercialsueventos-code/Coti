import React, { useState } from 'react'
import {
  Grid,
  Typography,
  Box,
  TextField,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { COMMON_ALLERGENS } from '@/shared/constants'
import { ProductIngredientsProps } from '../types'

const ProductIngredients: React.FC<ProductIngredientsProps> = ({
  formData,
  onFormDataChange
}) => {
  const [newIngredient, setNewIngredient] = useState('')

  const addIngredient = () => {
    if (newIngredient && !formData.ingredients.includes(newIngredient)) {
      onFormDataChange('ingredients', [...formData.ingredients, newIngredient])
      setNewIngredient('')
    }
  }

  const removeIngredient = (ingredient: string) => {
    onFormDataChange('ingredients', formData.ingredients.filter(i => i !== ingredient))
  }

  const toggleAllergen = (allergen: string) => {
    const updatedAllergens = formData.allergens.includes(allergen)
      ? formData.allergens.filter(a => a !== allergen)
      : [...formData.allergens, allergen]
    onFormDataChange('allergens', updatedAllergens)
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          🥄 Ingredientes y Alérgenos
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Box display="flex" gap={1} mb={2}>
          <TextField
            label="Agregar ingrediente"
            size="small"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <IconButton onClick={addIngredient} disabled={!newIngredient}>
            <AddIcon />
          </IconButton>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {formData.ingredients.map((ingredient) => (
            <Chip
              key={ingredient}
              label={ingredient}
              onDelete={() => removeIngredient(ingredient)}
              deleteIcon={<DeleteIcon />}
            />
          ))}
        </Box>
      </Grid>
      
      <Grid item xs={12}>
        <Typography variant="subtitle2" gutterBottom>
          Alérgenos comunes:
        </Typography>
        <FormGroup row>
          {COMMON_ALLERGENS.map((allergen) => (
            <FormControlLabel
              key={allergen}
              control={
                <Checkbox
                  checked={formData.allergens.includes(allergen)}
                  onChange={() => toggleAllergen(allergen)}
                />
              }
              label={allergen}
            />
          ))}
        </FormGroup>
      </Grid>
    </>
  )
}

export default ProductIngredients
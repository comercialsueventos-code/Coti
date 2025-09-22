import React, { useState } from 'react'
import {
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  TextField,
  IconButton,
  Chip,
  Autocomplete,
  Divider
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Build as BuildIcon } from '@mui/icons-material'
import { COMMON_EQUIPMENT } from '@/shared/constants'
import { ProductEquipmentProps } from '../types'

const ProductEquipment: React.FC<ProductEquipmentProps> = ({
  formData,
  onFormDataChange
}) => {
  const [newEquipment, setNewEquipment] = useState('')

  const addEquipment = () => {
    if (newEquipment && !formData.equipment_needed.includes(newEquipment)) {
      onFormDataChange('equipment_needed', [...formData.equipment_needed, newEquipment])
      setNewEquipment('')
    }
  }

  const removeEquipment = (equipment: string) => {
    onFormDataChange('equipment_needed', formData.equipment_needed.filter(e => e !== equipment))
  }

  return (
    <>
      <Grid item xs={12}>
        <Divider />
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          🔧 Equipos y Recursos
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={formData.requires_equipment}
              onChange={(e) => onFormDataChange('requires_equipment', e.target.checked)}
            />
          }
          label="Requiere equipos especiales"
        />
      </Grid>
      
      {formData.requires_equipment && (
        <Grid item xs={12}>
          <Box display="flex" gap={1} mb={2}>
            <Autocomplete
              freeSolo
              options={COMMON_EQUIPMENT}
              value={newEquipment}
              onChange={(_, value) => setNewEquipment(value || '')}
              onInputChange={(_, value) => setNewEquipment(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Agregar equipo"
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              )}
            />
            <IconButton onClick={addEquipment} disabled={!newEquipment}>
              <AddIcon />
            </IconButton>
          </Box>
          
          <Box display="flex" flexWrap="wrap" gap={1}>
            {formData.equipment_needed.map((equipment) => (
              <Chip
                key={equipment}
                label={equipment}
                onDelete={() => removeEquipment(equipment)}
                deleteIcon={<DeleteIcon />}
                icon={<BuildIcon />}
              />
            ))}
          </Box>
        </Grid>
      )}
    </>
  )
}

export default ProductEquipment
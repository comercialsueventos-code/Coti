import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  useCreateMachinery,
  useUpdateMachinery,
  useMachineryUtils
} from '../../../hooks/useMachinery'
import { CreateMachineryData } from '../../../types'
import { MachineryDialogProps } from '../types'

const MachineryFormDialog: React.FC<MachineryDialogProps> = ({
  open,
  onClose,
  machinery,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateMachineryData>({
    name: '',
    category: 'otros',
    description: '',
    hourly_rate: 0,
    daily_rate: 0,
    setup_cost: 0,
    requires_operator: false,
    operator_hourly_rate: 0
  })

  const createMutation = useCreateMachinery()
  const updateMutation = useUpdateMachinery()
  const { getCategoryOptions, validateMachineryData } = useMachineryUtils()

  useEffect(() => {
    if (machinery && isEdit) {
      setFormData({
        name: machinery.name,
        category: machinery.category as any,
        description: machinery.description || '',
        hourly_rate: machinery.hourly_rate,
        daily_rate: machinery.daily_rate,
        setup_cost: machinery.setup_cost || 0,
        requires_operator: machinery.requires_operator,
        operator_hourly_rate: machinery.operator_hourly_rate || 0
      })
    } else {
      setFormData({
        name: '',
        category: 'otros',
        description: '',
        hourly_rate: 0,
        daily_rate: 0,
        setup_cost: 0,
        requires_operator: false,
        operator_hourly_rate: 0
      })
    }
  }, [machinery, isEdit, open])

  const handleSubmit = async () => {
    const validation = validateMachineryData(formData)
    if (!validation.isValid) {
      alert('Errores:\n' + validation.errors.join('\n'))
      return
    }

    try {
      if (isEdit && machinery) {
        await updateMutation.mutateAsync({
          id: machinery.id,
          updateData: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving machinery:', error)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Editar Maquinaria' : 'Nueva Maquinaria'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Categoría</InputLabel>
              <Select
                value={formData.category}
                label="Categoría"
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              >
                {getCategoryOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tarifa por Hora"
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Tarifa por Día"
              type="number"
              value={formData.daily_rate}
              onChange={(e) => setFormData({ ...formData, daily_rate: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Costo de Instalación"
              type="number"
              value={formData.setup_cost}
              onChange={(e) => setFormData({ ...formData, setup_cost: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requires_operator}
                  onChange={(e) => setFormData({ ...formData, requires_operator: e.target.checked })}
                />
              }
              label="Requiere Operador"
            />
          </Grid>
          {formData.requires_operator && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Tarifa del Operador por Hora"
                type="number"
                value={formData.operator_hourly_rate}
                onChange={(e) => setFormData({ ...formData, operator_hourly_rate: Number(e.target.value) })}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {isEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MachineryFormDialog
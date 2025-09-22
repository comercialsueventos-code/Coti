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
  FormControlLabel,
  Autocomplete
} from '@mui/material'
import {
  useCreateSupplier,
  useUpdateSupplier,
  useSuppliersUtils
} from '../../../hooks/useSuppliers'
import { CreateSupplierData } from '../../../types'
import { SupplierDialogProps } from '../types'

const SupplierFormDialog: React.FC<SupplierDialogProps> = ({
  open,
  onClose,
  supplier,
  isEdit = false
}) => {
  const [formData, setFormData] = useState<CreateSupplierData>({
    name: '',
    type: 'otros',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    tax_id: '',
    specialties: [],
    service_areas: []
  })

  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()
  const { getTypeOptions, getServiceAreas, getCommonSpecialties, validateSupplierData } = useSuppliersUtils()

  useEffect(() => {
    if (supplier && isEdit) {
      setFormData({
        name: supplier.name,
        type: supplier.type as any,
        contact_person: supplier.contact_person || '',
        phone: supplier.phone || '',
        email: supplier.email || '',
        address: supplier.address || '',
        tax_id: supplier.tax_id || '',
        payment_terms_days: supplier.payment_terms_days,
        requires_advance_payment: supplier.requires_advance_payment,
        advance_payment_percentage: supplier.advance_payment_percentage,
        commission_percentage: supplier.commission_percentage,
        specialties: supplier.specialties || [],
        service_areas: supplier.service_areas || []
      })
    } else {
      setFormData({
        name: '',
        type: 'otros',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        tax_id: '',
        specialties: [],
        service_areas: []
      })
    }
  }, [supplier, isEdit, open])

  const handleSubmit = async () => {
    const validation = validateSupplierData(formData)
    if (!validation.isValid) {
      alert('Errores:\n' + validation.errors.join('\n'))
      return
    }

    try {
      if (isEdit && supplier) {
        await updateMutation.mutateAsync({
          id: supplier.id,
          updateData: formData
        })
      } else {
        await createMutation.mutateAsync(formData)
      }
      onClose()
    } catch (error) {
      console.error('Error saving supplier:', error)
    }
  }

  const availableSpecialties = getCommonSpecialties(formData.type)

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {isEdit ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre del Proveedor"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Proveedor</InputLabel>
              <Select
                value={formData.type}
                label="Tipo de Proveedor"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              >
                {getTypeOptions().map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Persona de Contacto"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="NIT/Cédula"
              value={formData.tax_id}
              onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={availableSpecialties}
              value={formData.specialties || []}
              onChange={(_, newValue) => setFormData({ ...formData, specialties: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Especialidades" placeholder="Selecciona especialidades" />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={getServiceAreas()}
              value={formData.service_areas || []}
              onChange={(_, newValue) => setFormData({ ...formData, service_areas: newValue })}
              renderInput={(params) => (
                <TextField {...params} label="Áreas de Servicio" placeholder="Selecciona ciudades/regiones" />
              )}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Días de Pago"
              type="number"
              value={formData.payment_terms_days || 30}
              onChange={(e) => setFormData({ ...formData, payment_terms_days: Number(e.target.value) })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.requires_advance_payment || false}
                  onChange={(e) => setFormData({ ...formData, requires_advance_payment: e.target.checked })}
                />
              }
              label="Requiere Anticipo"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="% Comisión Sue Events"
              type="number"
              value={formData.commission_percentage || 0}
              onChange={(e) => setFormData({ ...formData, commission_percentage: Number(e.target.value) })}
              inputProps={{ min: 0, max: 100 }}
            />
          </Grid>
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

export default SupplierFormDialog
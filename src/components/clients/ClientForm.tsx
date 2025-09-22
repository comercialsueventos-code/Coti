import React, { useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  Divider,
  InputAdornment,
  Typography,
  IconButton,
  Chip
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useCreateClient, useUpdateClient, useClientValidation, useClientBusinessLogic } from '../../hooks/useClients'
import { useCityDropdownData } from '../../hooks/useCities'
import { Client, CreateClientData, UpdateClientData, ClientContact } from '../../types'

interface ClientFormProps {
  client?: Client | null
  onClose: () => void
  onSuccess: () => void
}

// Validation schema
const createValidationSchema = (validateTaxId: any, validateEmail: any, validatePhone: any) => yup.object({
  name: yup.string().required('El nombre es requerido').min(2, 'Mínimo 2 caracteres'),
  type: yup.string().oneOf(['social', 'corporativo']).required('El tipo es requerido'),
  contact_person: yup.string(),
  phone: yup.string().test('phone-validation', 'Formato de teléfono inválido', 
    (value) => !value || validatePhone(value)),
  email: yup.string().test('email-validation', 'Email inválido', 
    (value) => !value || validateEmail(value)),
  tax_id: yup.string().test('tax-id-validation', 'NIT inválido', function(value) {
    const { type } = this.parent
    return validateTaxId(value || '', type)
  }),
  payment_terms_days: yup.number().min(0, 'Los días deben ser positivos').max(365, 'Máximo 365 días'),
  advance_payment_percentage: yup.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
  city: yup.string().max(100, 'Máximo 100 caracteres'),
  address: yup.string().max(500, 'Máximo 500 caracteres'),
  notes: yup.string().max(1000, 'Máximo 1000 caracteres'),
  contacts: yup.array().of(
    yup.object({
      name: yup.string().required('El nombre es requerido'),
      phone: yup.string().test('phone-validation', 'Formato de teléfono inválido', 
        (value) => !value || validatePhone(value)),
      email: yup.string().test('email-validation', 'Email inválido', 
        (value) => !value || validateEmail(value)),
      position: yup.string(),
      is_primary: yup.boolean()
    })
  ).min(1, 'Debe agregar al menos un contacto')
})

const ClientForm: React.FC<ClientFormProps> = ({ client, onClose, onSuccess }) => {
  const isEditing = !!client
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const { validateTaxId, validateEmail, validatePhone } = useClientValidation()
  const { getDefaultValues } = useClientBusinessLogic()
  const { cities, dropdownOptions, isLoading: citiesLoading } = useCityDropdownData()

  const validationSchema = createValidationSchema(validateTaxId, validateEmail, validatePhone)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateClientData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      name: '',
      type: 'social',
      contact_person: '',
      phone: '',
      email: '',
      city: '',
      city_id: undefined,
      address: '',
      tax_id: '',
      payment_terms_days: 0,
      requires_advance_payment: true,
      advance_payment_percentage: 50,
      notes: '',
      contacts: [{
        name: '',
        phone: '',
        email: '',
        position: '',
        is_primary: true
      }]
    }
  })

  // Watch client type to update default values
  const watchedType = watch('type')

  useEffect(() => {
    if (client) {
      // Migrar contactos legacy a nuevo formato si es necesario
      const contacts = client.contacts || []
      if ((!client.contacts || client.contacts.length === 0) && (client.contact_person || client.phone || client.email)) {
        contacts.push({
          name: client.contact_person || 'Contacto Principal',
          phone: client.phone || '',
          email: client.email || '',
          position: '',
          is_primary: true
        })
      }
      
      reset({
        name: client.name,
        type: client.type,
        contact_person: client.contact_person || '',
        phone: client.phone || '',
        email: client.email || '',
        city: client.city || '',
        city_id: client.city_id || undefined,
        address: client.address || '',
        tax_id: client.tax_id || '',
        payment_terms_days: client.payment_terms_days,
        requires_advance_payment: client.requires_advance_payment,
        advance_payment_percentage: client.advance_payment_percentage,
        notes: client.notes || '',
        contacts: contacts
      })
    }
  }, [client, reset])

  // Update default values when client type changes (only for new clients)
  useEffect(() => {
    if (!isEditing && watchedType) {
      const defaults = getDefaultValues(watchedType)
      setValue('payment_terms_days', defaults.payment_terms_days || 0)
      setValue('requires_advance_payment', defaults.requires_advance_payment || false)
      setValue('advance_payment_percentage', defaults.advance_payment_percentage || 50)
      
      // Ensure there's at least one contact for new clients
      const currentContacts = getValues('contacts') || []
      if (currentContacts.length === 0) {
        setValue('contacts', [{
          name: '',
          phone: '',
          email: '',
          position: '',
          is_primary: true
        }])
      }
    }
  }, [watchedType, isEditing, getDefaultValues, setValue, getValues])

  const onSubmit = async (data: CreateClientData) => {
    try {
      if (isEditing) {
        await updateClient.mutateAsync({ 
          id: client!.id, 
          data: data as UpdateClientData 
        })
      } else {
        await createClient.mutateAsync(data)
      }
      onSuccess()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const formatPhoneInput = (value: string) => {
    // Return the value as entered, allowing full editing freedom
    return value
  }

  const addContact = () => {
    const currentContacts = getValues('contacts') || []
    setValue('contacts', [
      ...currentContacts,
      {
        name: '',
        phone: '',
        email: '',
        position: '',
        is_primary: currentContacts.length === 0 // First contact is primary by default
      }
    ])
  }

  const removeContact = (index: number) => {
    const currentContacts = getValues('contacts') || []
    const newContacts = currentContacts.filter((_, i) => i !== index)
    
    // If we removed the primary contact, make the first remaining contact primary
    if (newContacts.length > 0 && currentContacts[index]?.is_primary) {
      newContacts[0].is_primary = true
    }
    
    setValue('contacts', newContacts)
  }

  const setPrimaryContact = (index: number) => {
    const currentContacts = getValues('contacts') || []
    const newContacts = currentContacts.map((contact, i) => ({
      ...contact,
      is_primary: i === index
    }))
    setValue('contacts', newContacts)
  }

  return (
    <Card>
      <CardHeader 
        title={isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
        subheader={isEditing ? `Editando: ${client?.name}` : 'Crear un nuevo cliente'}
      />
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Información Básica
              </Typography>
            </Grid>

            <Grid item xs={12} md={8}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Nombre del Cliente *"
                    placeholder="Ej: Empresa TechCorp S.A.S"
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Tipo de Cliente *</InputLabel>
                    <Select {...field} label="Tipo de Cliente *">
                      <MenuItem value="social">Social</MenuItem>
                      <MenuItem value="corporativo">Corporativo</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="tax_id"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={watchedType === 'corporativo' ? 'NIT *' : 'Cédula'}
                    placeholder="Ej: 900123456-1"
                    error={!!errors.tax_id}
                    helperText={errors.tax_id?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Controller
                name="city_id"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.city}>
                    <InputLabel>Ciudad</InputLabel>
                    <Select
                      {...field}
                      label="Ciudad"
                      value={field.value || ''}
                      onChange={(e) => {
                        const cityId = e.target.value as number
                        field.onChange(cityId)
                        
                        // Also update the legacy city field for compatibility
                        const selectedCity = cities.find(c => c.id === cityId)
                        if (selectedCity) {
                          setValue('city', `${selectedCity.name}, ${selectedCity.department}`)
                        }
                      }}
                      disabled={citiesLoading}
                    >
                      <MenuItem value="">
                        <em>Seleccionar ciudad</em>
                      </MenuItem>
                      {dropdownOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.city && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                        {errors.city.message}
                      </Typography>
                    )}
                  </FormControl>
                )}
              />
            </Grid>

            {/* Contact Information */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Contactos
                </Typography>
                <Button
                  onClick={addContact}
                  startIcon={<AddIcon />}
                  variant="outlined"
                  size="small"
                >
                  Agregar Contacto
                </Button>
              </Box>
            </Grid>

            {watch('contacts')?.length === 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="body2">
                    ⚠️ Debe agregar al menos un contacto. Use el botón "Agregar Contacto" arriba.
                  </Typography>
                </Alert>
              </Grid>
            )}

            {watch('contacts')?.map((contact, index) => (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box display="flex" gap={1} alignItems="center">
                      <Typography variant="subtitle2">
                        Contacto {index + 1}
                      </Typography>
                      {contact.is_primary && (
                        <Chip 
                          label="Principal" 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box>
                      {!contact.is_primary && (
                        <Button
                          onClick={() => setPrimaryContact(index)}
                          size="small"
                          variant="text"
                        >
                          Hacer Principal
                        </Button>
                      )}
                      <IconButton
                        onClick={() => removeContact(index)}
                        size="small"
                        color="error"
                        disabled={watch('contacts')?.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`contacts.${index}.name`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Nombre *"
                            placeholder="Ej: María Fernández"
                            error={!!(errors.contacts?.[index] as any)?.name}
                            helperText={(errors.contacts?.[index] as any)?.name?.message}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`contacts.${index}.position`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Cargo"
                            placeholder="Ej: Gerente General, Coordinador"
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`contacts.${index}.phone`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Teléfono"
                            placeholder="Ej: +57 300 123 4567"
                            error={!!(errors.contacts?.[index] as any)?.phone}
                            helperText={(errors.contacts?.[index] as any)?.phone?.message}
                            onChange={(e) => {
                              const formatted = formatPhoneInput(e.target.value)
                              field.onChange(formatted)
                            }}
                          />
                        )}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Controller
                        name={`contacts.${index}.email`}
                        control={control}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Correo Electrónico"
                            placeholder="correo@ejemplo.com"
                            error={!!(errors.contacts?.[index] as any)?.email}
                            helperText={(errors.contacts?.[index] as any)?.email?.message}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                </Card>
              </Grid>
            ))}

            {/* Error de validación general para contactos */}
            {errors.contacts && typeof errors.contacts === 'object' && 'message' in errors.contacts && (
              <Grid item xs={12}>
                <Alert severity="error">
                  <Typography variant="body2">
                    {errors.contacts.message}
                  </Typography>
                </Alert>
              </Grid>
            )}


            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={2}
                    label="Dirección"
                    placeholder="Dirección completa del cliente"
                    error={!!errors.address}
                    helperText={errors.address?.message}
                  />
                )}
              />
            </Grid>

            {/* Payment Terms */}
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Términos de Pago
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="payment_terms_days"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Días de Pago"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">días</InputAdornment>
                    }}
                    error={!!errors.payment_terms_days}
                    helperText={errors.payment_terms_days?.message || '0 = Pago inmediato'}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="requires_advance_payment"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} checked={field.value} />}
                    label="Requiere Anticipo"
                    sx={{ mt: 2 }}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Controller
                name="advance_payment_percentage"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    label="Porcentaje de Anticipo"
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>
                    }}
                    error={!!errors.advance_payment_percentage}
                    helperText={errors.advance_payment_percentage?.message}
                    disabled={!watch('requires_advance_payment')}
                  />
                )}
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    multiline
                    rows={3}
                    label="Notas"
                    placeholder="Notas adicionales sobre el cliente"
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />
            </Grid>

            {/* Form Actions */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                <Button
                  onClick={onClose}
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Cliente')}
                </Button>
              </Box>
            </Grid>

            {/* Error Display */}
            {(createClient.error || updateClient.error) && (
              <Grid item xs={12}>
                <Alert severity="error">
                  Error: {createClient.error?.message || updateClient.error?.message}
                </Alert>
              </Grid>
            )}
          </Grid>
        </form>
      </CardContent>
    </Card>
  )
}

export default ClientForm
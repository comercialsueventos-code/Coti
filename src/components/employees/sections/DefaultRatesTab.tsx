import React from 'react'
import {
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Alert,
  Box,
  InputAdornment
} from '@mui/material'
import { FormData } from '../utils/categoryFormValidation'
import { getPricingTypeDisplay } from '../utils/categoryFormValidation'
import EmployeeFlexibleRates from './EmployeeFlexibleRates'

interface DefaultRatesTabProps {
  formData: FormData
  errors: Record<string, string>
  onInputChange: (field: keyof FormData, value: any) => void
}

const DefaultRatesTab: React.FC<DefaultRatesTabProps> = ({
  formData,
  errors,
  onInputChange
}) => {
  const pricingDisplay = getPricingTypeDisplay(formData.pricing_type)

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          {pricingDisplay.icon} Configuración de {pricingDisplay.label}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Estas tarifas se aplicarán automáticamente a los nuevos empleados de esta categoría.
        </Typography>
      </Grid>

      {/* Mostrar configuración según tipo de tarifa */}
      {formData.pricing_type === 'plana' ? (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tarifa Plana:</strong> Todos los empleados de esta categoría tendrán 
              la misma tarifa por hora sin importar las horas trabajadas.
            </Typography>
          </Alert>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h4" color="primary">
              ${formData.flat_rate.toLocaleString('es-CO')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              por hora
            </Typography>
          </Box>
          
          {formData.flat_rate === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                ⚠️ Configura la tarifa plana en la pestaña "Información Básica"
              </Typography>
            </Alert>
          )}
        </Grid>
      ) : (
        <Grid item xs={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tarifa Flexible:</strong> Los empleados tendrán diferentes tarifas 
              según los rangos de horas trabajadas (escalones).
            </Typography>
          </Alert>
          
          <EmployeeFlexibleRates
            formData={{ hourly_rates: formData.default_hourly_rates } as any}
            onFormDataChange={(field, value) => onInputChange('default_hourly_rates', value)}
            errors={errors}
          />
        </Grid>
      )}

      {/* ARL Configuration */}
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          🛡️ Configuración de ARL
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Configuración por defecto para Administradora de Riesgos Laborales.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={formData.default_has_arl}
              onChange={(e) => onInputChange('default_has_arl', e.target.checked)}
            />
          }
          label="ARL por defecto"
        />
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Nota:</strong> El ARL se puede activar o desactivar individualmente 
            para cada empleado durante la cotización.
          </Typography>
        </Alert>
      </Grid>

      {formData.default_has_arl && (
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Proveedor ARL por defecto"
            value={formData.default_arl_provider}
            onChange={(e) => onInputChange('default_arl_provider', e.target.value)}
            placeholder="ej: SURA, Positiva, Liberty"
            helperText="Opcional - Proveedor de ARL preferido para esta categoría"
          />
        </Grid>
      )}

      {/* Información adicional sobre ARL */}
      <Grid item xs={12}>
        <Alert severity="info">
          <Typography variant="body2">
            <strong>💡 Información sobre ARL:</strong> En Colombia, el ARL representa 
            aproximadamente el 0.522% del salario base. Este costo puede incluirse 
            opcionalmente en las cotizaciones según las necesidades del cliente.
          </Typography>
        </Alert>
      </Grid>
    </Grid>
  )
}

export default DefaultRatesTab
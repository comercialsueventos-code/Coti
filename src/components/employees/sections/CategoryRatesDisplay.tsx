import React from 'react'
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Avatar,
  Alert
} from '@mui/material'
import { MonetizationOn as MoneyIcon, Info as InfoIcon } from '@mui/icons-material'
import { EmployeeBasicInfoProps } from '../types'
import { useActiveEmployeeCategories } from '../../../hooks/useEmployeeCategories'

const CategoryRatesDisplay: React.FC<EmployeeBasicInfoProps> = ({
  formData
}) => {
  const { data: categories = [] } = useActiveEmployeeCategories()
  
  const selectedCategory = categories.find(cat => cat.id === formData.category_id)

  if (!selectedCategory) {
    return (
      <Grid item xs={12}>
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            💰 <strong>Tarifas por Hora</strong>
          </Typography>
          <Typography variant="caption">
            Selecciona una categoría de empleado para ver las tarifas aplicables
          </Typography>
        </Alert>
      </Grid>
    )
  }

  return (
    <>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MoneyIcon color="primary" />
          Tarifas de la Categoría
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Estas tarifas se aplicarán automáticamente basadas en la categoría seleccionada
        </Typography>
      </Grid>
      
      <Grid item xs={12}>
        <Box sx={{ mb: 2 }}>
          <Chip 
            avatar={
              <Avatar sx={{ bgcolor: selectedCategory.color, fontSize: '10px' }}>
                {selectedCategory.icon}
              </Avatar>
            }
            label={`${selectedCategory.name} - ${selectedCategory.default_hourly_rates.length} tarifa(s)`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Grid container spacing={2}>
          {selectedCategory.default_hourly_rates.map((rate, index) => (
            <Grid item xs={12} sm={6} md={4} key={rate.id || index}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      {rate.min_hours}h - {rate.max_hours ? `${rate.max_hours}h` : '∞'}
                    </Typography>
                    <Chip 
                      label={`$${rate.rate.toLocaleString('es-CO')}`}
                      size="small"
                      color="primary"
                      variant="filled"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                    por hora
                  </Typography>
                  
                  {rate.description && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {rate.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {selectedCategory.default_hourly_rates.length === 0 && (
          <Alert severity="warning">
            <Typography variant="body2">
              Esta categoría no tiene tarifas configuradas
            </Typography>
          </Alert>
        )}
      </Grid>
    </>
  )
}

export default CategoryRatesDisplay
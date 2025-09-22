import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Box,
  Chip
} from '@mui/material'
import { LocationOn as LocationIcon } from '@mui/icons-material'
import { useSuppliersUtils } from '../../../hooks/useSuppliers'
import { SuppliersTabProps } from '../types'

const SuppliersStatistics: React.FC<SuppliersTabProps> = ({
  statistics
}) => {
  const {
    getTypeIcon,
    getTypeDisplayName
  } = useSuppliersUtils()

  if (!statistics) {
    return (
      <Typography variant="body1" color="text.secondary">
        Cargando estadísticas...
      </Typography>
    )
  }

  return (
    <Grid container spacing={3}>
      {/* Main Statistics Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="primary">
              {statistics.total_suppliers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Proveedores
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="success.main">
              {statistics.active_suppliers}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Activos
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="info.main">
              {statistics.average_quality_rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Calidad Promedio
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {statistics.average_reliability_rating.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confiabilidad Promedio
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Suppliers by Type */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Por Tipo de Servicio
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(statistics.by_type).map(([type, count]) => (
              <Grid item xs={12} sm={6} key={type}>
                <Chip
                  label={`${getTypeIcon(type)} ${getTypeDisplayName(type)}: ${count}`}
                  variant="outlined"
                  sx={{ width: '100%', justifyContent: 'flex-start' }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>

      {/* Geographic Coverage */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Cobertura Geográfica
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {statistics.service_coverage.map((area: string, index: number) => (
              <Chip
                key={index}
                label={area}
                icon={<LocationIcon />}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Paper>
      </Grid>

      {/* Top Specialties */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Principales Especialidades
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {statistics.top_specialties.map((specialty: string, index: number) => (
              <Chip
                key={index}
                label={specialty}
                variant="outlined"
                color="primary"
              />
            ))}
          </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default SuppliersStatistics
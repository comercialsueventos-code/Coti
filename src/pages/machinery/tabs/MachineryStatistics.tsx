import React from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Chip
} from '@mui/material'
import { useMachineryUtils } from '../../../hooks/useMachinery'
import { MachineryTabProps } from '../types'

const MachineryStatistics: React.FC<MachineryTabProps> = ({
  statistics
}) => {
  const {
    getCategoryIcon,
    formatCurrency
  } = useMachineryUtils()

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
              {statistics.total_machinery}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Maquinaria
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="success.main">
              {statistics.available_machinery}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Disponible
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="info.main">
              {formatCurrency(statistics.average_hourly_rate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Promedio/Hora
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Typography variant="h4" color="warning.main">
              {statistics.requires_operator_count}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Requiere Operador
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Categories breakdown */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Por Categoría
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(statistics.by_category).map(([category, count]) => (
              <Grid item xs={6} md={3} key={category}>
                <Chip
                  label={`${getCategoryIcon(category)} ${category}: ${count}`}
                  variant="outlined"
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default MachineryStatistics
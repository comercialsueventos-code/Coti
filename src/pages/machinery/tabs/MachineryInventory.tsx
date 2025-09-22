import React from 'react'
import {
  Grid,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardHeader,
  CardContent,
  Box,
  Chip,
  Divider,
  IconButton,
  Alert,
  Button
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Build as BuildIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { useMachineryUtils } from '../../../hooks/useMachinery'
import { MachineryTabProps } from '../types'

const MachineryInventory: React.FC<MachineryTabProps> = ({
  filteredMachinery,
  statistics,
  selectedCategory,
  onCategoryChange,
  onEditMachinery,
  onDeleteMachinery,
  onScheduleMaintenance
}) => {
  const {
    getCategoryOptions,
    getCategoryIcon,
    formatCurrency,
    getMaintenanceStatusColor,
    getMaintenanceStatusMessage
  } = useMachineryUtils()

  return (
    <Grid container spacing={3}>
      {/* Filters */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Categoría"
                  onChange={(e) => onCategoryChange(e.target.value)}
                >
                  <MenuItem value="">Todas las categorías</MenuItem>
                  {getCategoryOptions().map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="body2" color="text.secondary">
                Total: {filteredMachinery.length} equipos
                {statistics && (
                  <>
                    {' • '}
                    Disponibles: {statistics.available_machinery}
                    {' • '}
                    Activos: {statistics.active_machinery}
                  </>
                )}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Machinery Grid */}
      {filteredMachinery.map((machine) => (
        <Grid item xs={12} md={6} lg={4} key={machine.id}>
          <Card>
            <CardHeader
              title={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">
                    {getCategoryIcon(machine.category)} {machine.name}
                  </Typography>
                </Box>
              }
              action={
                <Box>
                  <Chip
                    label={machine.is_available ? 'Disponible' : 'No disponible'}
                    color={machine.is_available ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
              }
              subheader={machine.category}
            />
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {machine.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Tarifa/Hora
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(machine.hourly_rate)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Tarifa/Día
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(machine.daily_rate)}
                  </Typography>
                </Grid>
                {machine.requires_operator && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">
                        Operador
                      </Typography>
                      <Typography variant="body2">
                        {formatCurrency(machine.operator_hourly_rate || 0)}/hora
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              {machine.next_maintenance_date && (
                <Alert
                  severity={getMaintenanceStatusColor(machine)}
                  sx={{ mt: 2 }}
                  size="small"
                >
                  {getMaintenanceStatusMessage(machine)}
                </Alert>
              )}

              <Box display="flex" gap={1} mt={2}>
                <IconButton
                  size="small"
                  onClick={() => onEditMachinery(machine)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDeleteMachinery(machine.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onScheduleMaintenance(machine)}
                >
                  <BuildIcon fontSize="small" />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {filteredMachinery.length === 0 && (
        <Grid item xs={12}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No hay maquinaria disponible
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega tu primera maquinaria para empezar
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 2 }}
              onClick={() => {/* This would be handled by parent */}}
            >
              Agregar Maquinaria
            </Button>
          </Paper>
        </Grid>
      )}
    </Grid>
  )
}

export default MachineryInventory
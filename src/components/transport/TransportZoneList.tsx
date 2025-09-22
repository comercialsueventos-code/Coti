import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Grid,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  AttachMoney as MoneyIcon,
  Search as SearchIcon,
  DirectionsCar as CarIcon,
  Build as ToolIcon
} from '@mui/icons-material'
import { 
  useTransportZones, 
  useDeleteTransportZone, 
  useDeactivateTransportZone,
  useTransportCostCalculator 
} from '../../hooks/useTransport'
import { TransportZone } from '../../types'
import TransportZoneForm from './TransportZoneForm'

const TransportZoneList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedZone, setSelectedZone] = useState<TransportZone | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [zoneToDelete, setZoneToDelete] = useState<TransportZone | null>(null)
  
  const { data: zones = [], isLoading, error, refetch } = useTransportZones()
  const deleteZoneMutation = useDeleteTransportZone()
  const deactivateZoneMutation = useDeactivateTransportZone()
  const { calculateCostForZone } = useTransportCostCalculator()

  // Filter zones based on search term
  const filteredZones = zones.filter(zone =>
    zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCreateNew = () => {
    setSelectedZone(null)
    setIsFormOpen(true)
  }

  const handleEdit = (zone: TransportZone) => {
    setSelectedZone(zone)
    setIsFormOpen(true)
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setSelectedZone(null)
    refetch()
  }

  const handleDeleteClick = (zone: TransportZone) => {
    setZoneToDelete(zone)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!zoneToDelete) return
    
    try {
      if (zoneToDelete.is_active) {
        // First deactivate, then delete
        await deactivateZoneMutation.mutateAsync(zoneToDelete.id)
      }
      await deleteZoneMutation.mutateAsync(zoneToDelete.id)
      setDeleteDialogOpen(false)
      setZoneToDelete(null)
    } catch (error) {
      console.error('Error deleting zone:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTravelTime = (minutes?: number) => {
    if (!minutes) return 'No especificado'
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`
    }
    return `${minutes}min`
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error cargando zonas de transporte: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">
          🚚 Zonas de Transporte ULTRATHINK
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{ minWidth: 200 }}
        >
          Nueva Zona
        </Button>
      </Box>

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Buscar zonas por nombre o descripción..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 3 }}
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light' }}>
            <Typography variant="h4" color="primary.dark">
              {zones.length}
            </Typography>
            <Typography variant="body2" color="primary.dark">
              Total Zonas
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light' }}>
            <Typography variant="h4" color="success.dark">
              {zones.filter(z => z.is_active).length}
            </Typography>
            <Typography variant="body2" color="success.dark">
              Activas
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light' }}>
            <Typography variant="h4" color="info.dark">
              {formatCurrency(zones.reduce((sum, z) => sum + z.base_cost, 0) / (zones.length || 1))}
            </Typography>
            <Typography variant="body2" color="info.dark">
              Costo Promedio
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light' }}>
            <Typography variant="h4" color="warning.dark">
              {Math.round(zones.reduce((sum, z) => sum + (z.estimated_travel_time_minutes || 0), 0) / (zones.length || 1))}min
            </Typography>
            <Typography variant="body2" color="warning.dark">
              Tiempo Promedio
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Loading */}
      {isLoading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      )}

      {/* Zone List */}
      {!isLoading && (
        <Grid container spacing={3}>
          {filteredZones.length === 0 ? (
            <Grid item xs={12}>
              <Alert severity="info">
                {searchTerm 
                  ? `No se encontraron zonas que coincidan con "${searchTerm}"` 
                  : 'No hay zonas de transporte creadas. Crea la primera zona.'}
              </Alert>
            </Grid>
          ) : (
            filteredZones.map((zone) => {
              const costBreakdown = calculateCostForZone(zone.id, true, 1)
              
              return (
                <Grid item xs={12} md={6} lg={4} key={zone.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader
                      title={
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationIcon color="primary" />
                          {zone.name}
                        </Box>
                      }
                      action={
                        <Box>
                          <Chip
                            label={zone.is_active ? 'Activa' : 'Inactiva'}
                            color={zone.is_active ? 'success' : 'default'}
                            size="small"
                            sx={{ mr: 1 }}
                          />
                        </Box>
                      }
                      subheader={zone.description}
                    />
                    <CardContent>
                      <List dense>
                        <ListItem>
                          <MoneyIcon color="action" sx={{ mr: 1 }} />
                          <ListItemText
                            primary="Costo Base"
                            secondary={formatCurrency(zone.base_cost)}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <ToolIcon color="action" sx={{ mr: 1 }} />
                          <ListItemText
                            primary="Costo Equipo Adicional"
                            secondary={formatCurrency(zone.additional_equipment_cost)}
                          />
                        </ListItem>
                        
                        <ListItem>
                          <TimeIcon color="action" sx={{ mr: 1 }} />
                          <ListItemText
                            primary="Tiempo Estimado"
                            secondary={formatTravelTime(zone.estimated_travel_time_minutes)}
                          />
                        </ListItem>

                        {costBreakdown && (
                          <ListItem>
                            <CarIcon color="action" sx={{ mr: 1 }} />
                            <ListItemText
                              primary="Costo con Equipo"
                              secondary={
                                <Typography variant="body2" color="primary.main">
                                  <strong>{costBreakdown.formatted_total}</strong>
                                </Typography>
                              }
                            />
                          </ListItem>
                        )}
                      </List>

                      <Box display="flex" gap={1} mt={2}>
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEdit(zone)}
                          size="small"
                          fullWidth
                        >
                          Editar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteClick(zone)}
                          size="small"
                          fullWidth
                          disabled={deleteZoneMutation.isPending}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })
          )}
        </Grid>
      )}

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onClose={handleFormClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedZone ? '🤖 Editar Zona' : '🤖 Nueva Zona'} de Transporte
        </DialogTitle>
        <DialogContent>
          <TransportZoneForm
            zone={selectedZone}
            onClose={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar la zona "{zoneToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteZoneMutation.isPending}
          >
            {deleteZoneMutation.isPending ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TransportZoneList
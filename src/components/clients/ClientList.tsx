import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Fab,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { useClients, useDeleteClient, useDeactivateClient } from '../../hooks/useClients'
import ClientForm from './ClientForm'
import ScrollableDialog from '../common/ScrollableDialog'
import { Client, ClientFilters } from '../../types'
import { formatPhoneNumber, getClientTypeDisplayName } from '../../services/supabase'

interface ClientListProps {
  onClientClick?: (client: Client) => void
  filterType?: 'social' | 'corporativo'
  selectionMode?: boolean
  selectedClient?: Client
}

const ClientList: React.FC<ClientListProps> = ({ 
  onClientClick, 
  filterType, 
  selectionMode = false,
  selectedClient 
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [filters, setFilters] = useState<ClientFilters>({
    type: filterType,
    is_active: true
  })

  const { data: clients = [], isLoading, error } = useClients(filters)
  const deleteClient = useDeleteClient()
  const deactivateClient = useDeactivateClient()

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsFormOpen(true)
  }

  const handleDelete = async (client: Client) => {
    const action = client.is_active ? 'desactivar' : 'eliminar permanentemente'
    if (window.confirm(`¿Estás seguro de que deseas ${action} este cliente?`)) {
      try {
        if (client.is_active) {
          await deactivateClient.mutateAsync(client.id)
        } else {
          await deleteClient.mutateAsync(client.id)
        }
      } catch (error) {
        console.error('Error deleting client:', error)
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingClient(null)
  }

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined
    }))
  }

  const clearSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: undefined
    }))
  }

  const getClientTypeIcon = (type: string) => {
    return type === 'corporativo' ? <BusinessIcon /> : <PersonIcon />
  }

  const getClientTypeColor = (type: string) => {
    return type === 'corporativo' ? 'primary' : 'secondary'
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Error cargando clientes: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      {!selectionMode && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" gutterBottom>
            👥 Gestión de Clientes
          </Typography>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar clientes..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton onClick={clearSearch} size="small">
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            {!filterType && (
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Cliente</InputLabel>
                  <Select
                    value={filters.type || ''}
                    label="Tipo de Cliente"
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      type: e.target.value as any || undefined
                    }))}
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="social">Social</MenuItem>
                    <MenuItem value="corporativo">Corporativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filters.is_active !== undefined ? (filters.is_active ? 'active' : 'inactive') : ''}
                  label="Estado"
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    is_active: e.target.value === '' ? undefined : e.target.value === 'active'
                  }))}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Activos</MenuItem>
                  <MenuItem value="inactive">Inactivos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Client Grid */}
      <Grid container spacing={2}>
        {clients.map((client) => (
          <Grid item xs={12} sm={6} md={4} key={client.id}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: onClientClick ? 'pointer' : 'default',
                border: selectedClient?.id === client.id ? 2 : 0,
                borderColor: 'primary.main',
                opacity: client.is_active ? 1 : 0.7,
                '&:hover': onClientClick ? { 
                  transform: 'translateY(-2px)',
                  boxShadow: 3 
                } : {}
              }}
              onClick={() => onClientClick?.(client)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Box mr={2}>
                    {getClientTypeIcon(client.type)}
                  </Box>
                  <Box flex={1}>
                    <Typography variant="h6" component="h3">
                      {client.name}
                    </Typography>
                    <Chip 
                      label={getClientTypeDisplayName(client.type)}
                      color={getClientTypeColor(client.type) as any}
                      size="small"
                      icon={getClientTypeIcon(client.type)}
                    />
                  </Box>
                  {!client.is_active && (
                    <Chip 
                      label="Inactivo" 
                      color="default" 
                      size="small" 
                    />
                  )}
                </Box>

                {(() => {
                  const primaryContact = client.contacts?.find(contact => contact.is_primary)
                  const phone = primaryContact?.phone || client.phone
                  const email = primaryContact?.email || client.email
                  
                  return (
                    <>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        👤 {primaryContact ? primaryContact.name : 'Sin contacto principal'}
                      </Typography>
                      
                      {phone && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📞 {formatPhoneNumber(phone)}
                        </Typography>
                      )}
                      
                      {email && (
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          📧 {email}
                        </Typography>
                      )}
                    </>
                  )
                })()}

                {/* Payment Terms */}
                <Box mt={2}>
                  {client.payment_terms_days > 0 ? (
                    <Chip 
                      label={`${client.payment_terms_days} días`}
                      color="info"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ) : (
                    <Chip 
                      label="Pago inmediato"
                      color="success"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}

                  {client.requires_advance_payment && (
                    <Chip 
                      label={`Anticipo ${client.advance_payment_percentage}%`}
                      color="warning"
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}

                  {client.tax_id && (
                    <Tooltip title={`NIT: ${client.tax_id}`}>
                      <Chip 
                        label="NIT"
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    </Tooltip>
                  )}
                </Box>

                {!onClientClick && !selectionMode && (
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(client)
                      }}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(client)
                      }}
                      color="error"
                      size="small"
                    >
                      {client.is_active ? 'Desactivar' : 'Eliminar'}
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {clients.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No se encontraron clientes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {filters.search ? 'Intenta con otros términos de búsqueda' : 'Crea tu primer cliente para empezar'}
          </Typography>
        </Box>
      )}

      {!onClientClick && !selectionMode && (
        <Fab
          color="primary"
          aria-label="add client"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setIsFormOpen(true)}
        >
          <AddIcon />
        </Fab>
      )}

      <ScrollableDialog 
        open={isFormOpen} 
        onClose={handleCloseForm} 
        maxWidth="md" 
        fullWidth
      >
        <ClientForm
          client={editingClient}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      </ScrollableDialog>
    </Box>
  )
}

export default ClientList
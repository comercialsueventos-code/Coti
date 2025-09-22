import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Fab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory2 as InventoryIcon,
  Nature as EcoIcon,
  Recycling as RecycleIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon
} from '@mui/icons-material'
import { useForm, Controller } from 'react-hook-form'
import {
  useActiveDisposableItems,
  useCreateDisposableItem,
  useUpdateDisposableItem,
  useDeleteDisposableItem,
  useDisposableItemUtils
} from '../hooks/useDisposableItems'
import { CreateDisposableItemData, DisposableItem, DisposableItemFilters } from '../types'

const DisposableItems: React.FC = () => {
  const [filters, setFilters] = useState<DisposableItemFilters>({ is_active: true })
  const [openDialog, setOpenDialog] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DisposableItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const { data: items = [], isLoading } = useActiveDisposableItems(filters)
  const createMutation = useCreateDisposableItem()
  const updateMutation = useUpdateDisposableItem()
  const deleteMutation = useDeleteDisposableItem()
  const utils = useDisposableItemUtils()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateDisposableItemData>({
    defaultValues: {
      name: '',
      category: 'desechables',
      unit: 'unidad',
      cost_price: 0,
      sale_price: 0,
      minimum_quantity: 1,
      is_recyclable: false,
      is_biodegradable: false
    }
  })

  const handleCreate = () => {
    setSelectedItem(null)
    setIsEditing(false)
    reset({
      name: '',
      category: 'desechables',
      unit: 'unidad',
      cost_price: 0,
      sale_price: 0,
      minimum_quantity: 1,
      is_recyclable: false,
      is_biodegradable: false
    })
    setOpenDialog(true)
  }

  const handleEdit = (item: DisposableItem) => {
    setSelectedItem(item)
    setIsEditing(true)
    reset({
      name: item.name,
      category: item.category,
      subcategory: item.subcategory || '',
      description: item.description || '',
      unit: item.unit,
      cost_price: item.cost_price,
      sale_price: item.sale_price,
      minimum_quantity: item.minimum_quantity,
      storage_requirements: item.storage_requirements || '',
      shelf_life_days: item.shelf_life_days || undefined,
      is_recyclable: item.is_recyclable,
      is_biodegradable: item.is_biodegradable
    })
    setOpenDialog(true)
  }

  const handleDelete = (item: DisposableItem) => {
    setSelectedItem(item)
    setOpenDeleteDialog(true)
  }

  const onSubmit = async (data: CreateDisposableItemData) => {
    try {
      if (isEditing && selectedItem) {
        await updateMutation.mutateAsync({
          id: selectedItem.id,
          updateData: data
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      setOpenDialog(false)
      reset()
    } catch (error) {
      console.error('Error saving disposable item:', error)
    }
  }

  const confirmDelete = async () => {
    if (selectedItem) {
      try {
        await deleteMutation.mutateAsync(selectedItem.id)
        setOpenDeleteDialog(false)
        setSelectedItem(null)
      } catch (error) {
        console.error('Error deleting disposable item:', error)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getSubcategoryIcon = (subcategory?: string) => {
    return utils.getSubcategoryIcon(subcategory)
  }

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 2 }}>
          <Typography>Cargando elementos desechables...</Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              📦 Elementos Desechables
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Gestión de elementos desechables e independientes para eventos
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            size="large"
          >
            Nuevo Elemento
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon /> Filtros
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Buscar"
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                      placeholder="Nombre, descripción, subcategoría..."
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Subcategoría</InputLabel>
                      <Select
                        value={filters.subcategory || ''}
                        label="Subcategoría"
                        onChange={(e) => setFilters({ ...filters, subcategory: e.target.value || undefined })}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {utils.getSubcategoryOptions().map(sub => (
                          <MenuItem key={sub.value} value={sub.value}>
                            {sub.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.is_recyclable || false}
                          onChange={(e) => setFilters({ ...filters, is_recyclable: e.target.checked || undefined })}
                        />
                      }
                      label="Solo Reciclables"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={filters.is_biodegradable || false}
                          onChange={(e) => setFilters({ ...filters, is_biodegradable: e.target.checked || undefined })}
                        />
                      }
                      label="Solo Biodegradables"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>

        {/* Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary.main">
                  {items.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Elementos
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="success.main">
                  {items.filter(item => item.is_biodegradable).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Biodegradables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {items.filter(item => item.is_recyclable).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reciclables
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {formatCurrency(items.reduce((acc, item) => acc + item.sale_price, 0) / items.length || 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Precio Promedio
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Items List */}
        {items.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No hay elementos desechables
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Comienza agregando tu primer elemento desechable
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Agregar Primer Elemento
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                        {getSubcategoryIcon(item.subcategory)} {item.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleEdit(item)} color="primary">
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(item)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {item.subcategory ? `📦 ${item.subcategory}` : '📦 Desechables'}
                    </Typography>

                    {item.description && (
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        {item.description}
                      </Typography>
                    )}

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Precio:</strong> {formatCurrency(item.sale_price)} / {item.unit}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <strong>Cantidad mínima:</strong> {item.minimum_quantity} {item.unit}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {item.is_biodegradable && (
                        <Chip
                          icon={<EcoIcon />}
                          label="Biodegradable"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                      {item.is_recyclable && (
                        <Chip
                          icon={<RecycleIcon />}
                          label="Reciclable"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      )}
                      {item.shelf_life_days && (
                        <Chip
                          label={`${item.shelf_life_days}d vida`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <form onSubmit={handleSubmit(onSubmit)}>
            <DialogTitle>
              {isEditing ? 'Editar Elemento Desechable' : 'Nuevo Elemento Desechable'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={8}>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'El nombre es requerido' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Nombre *"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Unidad"
                        placeholder="ej: unidad, paquete, kg"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="subcategory"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth>
                        <InputLabel>Subcategoría</InputLabel>
                        <Select {...field} label="Subcategoría">
                          <MenuItem value="">Sin subcategoría</MenuItem>
                          {utils.getSubcategoryOptions().map(sub => (
                            <MenuItem key={sub.value} value={sub.value}>
                              {sub.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Descripción"
                        multiline
                        rows={2}
                        placeholder="Descripción detallada del elemento..."
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="cost_price"
                    control={control}
                    rules={{ required: 'El precio de costo es requerido', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Precio de Costo *"
                        error={!!errors.cost_price}
                        helperText={errors.cost_price?.message}
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="sale_price"
                    control={control}
                    rules={{ required: 'El precio de venta es requerido', min: 0 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Precio de Venta *"
                        error={!!errors.sale_price}
                        helperText={errors.sale_price?.message}
                        InputProps={{ startAdornment: '$' }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Controller
                    name="minimum_quantity"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Cantidad Mínima"
                        inputProps={{ min: 1 }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="storage_requirements"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Requerimientos de Almacenamiento"
                        placeholder="ej: Lugar seco y fresco"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="shelf_life_days"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label="Vida Útil (días)"
                        placeholder="Dejar vacío si no aplica"
                        inputProps={{ min: 0 }}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="is_recyclable"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Es Reciclable"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Controller
                    name="is_biodegradable"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Checkbox {...field} checked={field.value} />}
                        label="Es Biodegradable"
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Confirmar Eliminación</DialogTitle>
          <DialogContent>
            <Typography>
              ¿Estás seguro de que deseas eliminar "{selectedItem?.name}"?
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              Esta acción no se puede deshacer.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button
              onClick={confirmDelete}
              color="error"
              variant="contained"
              disabled={deleteMutation.isPending}
            >
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  )
}

export default DisposableItems
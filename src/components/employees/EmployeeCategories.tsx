import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  Filter as FilterIcon
} from '@mui/icons-material'
import { 
  useEmployeeCategories, 
  useDeleteEmployeeCategory, 
  useDuplicateEmployeeCategory,
  useEmployeeCategoryUtils 
} from '../../hooks/useEmployeeCategories'
import { EmployeeCategory } from '../../types'
import EmployeeCategoryForm from './EmployeeCategoryForm'

const EmployeeCategories: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<EmployeeCategory | null>(null)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Hooks
  const { data: categories = [], isLoading, error } = useEmployeeCategories({
    search: searchTerm || undefined,
    category_type: filterType || undefined,
    is_active: true
  })
  const deleteCategory = useDeleteEmployeeCategory()
  const duplicateCategory = useDuplicateEmployeeCategory()
  const { getCategoryDisplay, formatCategoryType, canDeleteCategory, getCategoryRequirements } = useEmployeeCategoryUtils()

  const handleCreateCategory = () => {
    setSelectedCategory(null)
    setFormMode('create')
    setShowForm(true)
  }

  const handleEditCategory = (category: EmployeeCategory) => {
    setSelectedCategory(category)
    setFormMode('edit')
    setShowForm(true)
  }

  const handleDuplicateCategory = async (category: EmployeeCategory) => {
    try {
      await duplicateCategory.mutateAsync({
        id: category.id,
        newName: `${category.name} (Copia)`
      })
    } catch (error) {
      console.error('Error duplicating category:', error)
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategory.mutateAsync(id)
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setSelectedCategory(null)
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchTerm || 
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = !filterType || category.category_type === filterType
    
    return matchesSearch && matchesType
  })

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar las categorías de empleados: {error.message}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          🏷️ Categorías de Empleados
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateCategory}
          size="large"
        >
          Nueva Categoría
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={filterType}
                  label="Filtrar por tipo"
                  onChange={(e) => setFilterType(e.target.value)}
                  startAdornment={<FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="">Todos los tipos</MenuItem>
                  <MenuItem value="operario">Operario</MenuItem>
                  <MenuItem value="chef">Chef</MenuItem>
                  <MenuItem value="mesero">Mesero</MenuItem>
                  <MenuItem value="supervisor">Supervisor</MenuItem>
                  <MenuItem value="conductor">Conductor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary">
                {filteredCategories.length} categoría(s)
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Categories Grid */}
      <Grid container spacing={3}>
        {filteredCategories.map((category) => {
          const display = getCategoryDisplay(category)
          const requirements = getCategoryRequirements(category)
          const employeeCount = typeof (category as any).employee_count === 'object' 
            ? (category as any).employee_count?.count || 0 
            : (category as any).employee_count || 0

          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: `2px solid ${category.color}`,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Header */}
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ bgcolor: category.color, width: 48, height: 48 }}>
                      <Typography variant="h5">{category.icon}</Typography>
                    </Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6" component="h3" noWrap>
                        {category.name}
                      </Typography>
                      <Chip 
                        label={formatCategoryType(category.category_type)}
                        size="small"
                        sx={{ bgcolor: category.color + '20', color: category.color }}
                      />
                    </Box>
                  </Box>

                  {/* Description */}
                  {category.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {category.description}
                    </Typography>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Stats */}
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PeopleIcon color="action" fontSize="small" />
                    <Typography variant="body2">
                      {employeeCount} empleado(s)
                    </Typography>
                  </Box>

                  {/* Pricing Type and Rates Preview */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Tipo de tarifa:
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip 
                      label={category.pricing_type === 'plana' ? '💰 Tarifa Plana' : '📊 Tarifa Flexible'}
                      size="small"
                      color={category.pricing_type === 'plana' ? 'warning' : 'info'}
                      variant="outlined"
                    />
                  </Box>
                  
                  {category.pricing_type === 'plana' ? (
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Typography variant="h6" color="primary">
                        ${category.flat_rate?.toLocaleString('es-CO')}/hora
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Escalones de tarifa:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5} mb={2}>
                        {category.default_hourly_rates.slice(0, 2).map((rate, index) => (
                          <Chip 
                            key={index}
                            label={`${rate.min_hours}${rate.max_hours ? `-${rate.max_hours}` : '+'}h: $${rate.rate.toLocaleString()}`}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {category.default_hourly_rates.length > 2 && (
                          <Chip 
                            label={`+${category.default_hourly_rates.length - 2}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </>
                  )}

                  {/* Requirements */}
                  {requirements.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        Requisitos:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        {requirements.map((req, index) => (
                          <Chip 
                            key={index}
                            label={req}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Box>
                    <Tooltip title="Editar categoría">
                      <IconButton 
                        onClick={() => handleEditCategory(category)}
                        color="primary"
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicar categoría">
                      <IconButton 
                        onClick={() => handleDuplicateCategory(category)}
                        color="info"
                        size="small"
                        disabled={duplicateCategory.isPending}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {canDeleteCategory(category) && (
                    <Tooltip title="Eliminar categoría">
                      <IconButton 
                        onClick={() => setDeleteConfirmId(category.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Empty State */}
      {filteredCategories.length === 0 && !isLoading && (
        <Box textAlign="center" py={8}>
          <SettingsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No se encontraron categorías
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {searchTerm || filterType 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primera categoría de empleados para comenzar'
            }
          </Typography>
          {!searchTerm && !filterType && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCategory}
            >
              Crear Primera Categoría
            </Button>
          )}
        </Box>
      )}

      {/* Category Form Dialog */}
      <EmployeeCategoryForm
        open={showForm}
        onClose={handleCloseForm}
        category={selectedCategory}
        mode={formMode}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => deleteConfirmId && handleDeleteCategory(deleteConfirmId)}
            color="error"
            variant="contained"
            disabled={deleteCategory.isPending}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default EmployeeCategories
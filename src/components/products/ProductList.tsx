import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Grid,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Tooltip,
  Badge
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Schedule as ScheduleIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Euro as EuroIcon,
  LocalOffer as PriceIcon
} from '@mui/icons-material'
import { useProducts, useDeleteProduct, useProductUtils } from '../../hooks/useProducts'
import { useActiveCategories } from '../../hooks/useCategories'
import { ProductFilters } from '../../shared/services/ConsolidatedProductsService'
import { Product } from '../../types'

interface ProductListProps {
  onEditProduct?: (product: Product) => void
  onCreateProduct?: () => void
  showActions?: boolean
}

const ProductList: React.FC<ProductListProps> = ({
  onEditProduct,
  onCreateProduct,
  showActions = true
}) => {
  const [filters, setFilters] = useState<ProductFilters>({ is_active: true })
  const [searchTerm, setSearchTerm] = useState('')
  
  const { data: products = [], isLoading, error } = useProducts(filters)
  const { data: dbCategories = [] } = useActiveCategories()
  const deleteProduct = useDeleteProduct()
  const {
    getCategoryIcon,
    getCategoryDisplayName,
    formatPrice,
    formatUnit,
    getSeasonalStatus,
    checkInventoryAlert,
    calculateMargin
  } = useProductUtils()

  // Filtrar productos por término de búsqueda local
  const filteredProducts = products.filter(product => {
    const searchLower = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower) ||
      product.category_info?.display_name.toLowerCase().includes(searchLower) ||
      product.category_info?.name.toLowerCase().includes(searchLower)
    )
  })

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar ${product.name}?`)) {
      try {
        await deleteProduct.mutateAsync(product.id)
      } catch (error) {
        console.error('Error al eliminar producto:', error)
      }
    }
  }

  const getProductStatusColor = (product: Product) => {
    if (!product.is_active) return 'error'
    const seasonal = getSeasonalStatus(product)
    if (!seasonal.isInSeason) return 'warning'
    return 'success'
  }

  const getProductStatusText = (product: Product) => {
    if (!product.is_active) return 'Inactivo'
    const seasonal = getSeasonalStatus(product)
    return seasonal.message
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return 'success'
    if (margin >= 30) return 'warning'
    return 'error'
  }

  // No se necesita más - usar dbCategories de la base de datos

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error">
        Error al cargar productos: {error.message}
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header con controles */}
      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            🛍️ Productos ({filteredProducts.length})
          </Typography>
          {showActions && onCreateProduct && (
            <Button
              variant="contained"
              onClick={onCreateProduct}
              startIcon={<AddIcon />}
            >
              Nuevo Producto
            </Button>
          )}
        </Box>

        {/* Filtros */}
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, descripción o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filters.category_id || ''}
                label="Categoría"
                onChange={(e) => setFilters({ 
                  ...filters, 
                  category_id: e.target.value ? Number(e.target.value) : undefined,
                  category: undefined // Limpiar filtro legacy
                })}
              >
                <MenuItem value="">Todas</MenuItem>
                {dbCategories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.icon ? `${category.icon} ` : ''}{category.display_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
                label="Estado"
                onChange={(e) => {
                  const value = e.target.value
                  setFilters({
                    ...filters,
                    is_active: value === '' ? undefined : value === 'true'
                  })
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Activos</MenuItem>
                <MenuItem value="false">Inactivos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Equipos</InputLabel>
              <Select
                value={filters.requires_equipment !== undefined ? filters.requires_equipment.toString() : ''}
                label="Equipos"
                onChange={(e) => {
                  const value = e.target.value
                  setFilters({
                    ...filters,
                    requires_equipment: value === '' ? undefined : value === 'true'
                  })
                }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Requiere equipos</MenuItem>
                <MenuItem value="false">Sin equipos</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Lista de productos */}
      {filteredProducts.length === 0 ? (
        <Alert severity="info">
          No se encontraron productos con los filtros aplicados.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map((product) => {
            const seasonal = getSeasonalStatus(product)
            const margin = calculateMargin(product.base_price, product.cost_price)
            const inventoryAlert = checkInventoryAlert(product, 1)
            
            return (
              <Grid item xs={12} md={6} lg={4} key={product.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  {/* Badge de estado estacional */}
                  {product.is_seasonal && (
                    <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
                      <Tooltip title={seasonal.message}>
                        <Badge 
                          color={seasonal.isInSeason ? 'success' : 'warning'}
                          variant="dot"
                        >
                          <ScheduleIcon fontSize="small" />
                        </Badge>
                      </Tooltip>
                    </Box>
                  )}

                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Header con avatar y nombre */}
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {product.category_info?.icon || getCategoryIcon(product.category)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="div">
                          {product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.category_info?.display_name || getCategoryDisplayName(product.category)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Descripción */}
                    {product.description && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        {product.description}
                      </Typography>
                    )}

                    {/* Estado */}
                    <Box mb={2}>
                      <Chip
                        label={getProductStatusText(product)}
                        color={getProductStatusColor(product)}
                        size="small"
                      />
                      {inventoryAlert.hasAlert && (
                        <Chip
                          label={inventoryAlert.message}
                          color={inventoryAlert.severity}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>

                    {/* Información de precios */}
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6" color="primary">
                          {formatPrice(product.base_price)}
                        </Typography>
                        <Box textAlign="right">
                          <Typography variant="body2" color="text.secondary">
                            {product.pricing_type === 'measurement' 
                              ? `por ${formatUnit(product.unit)}` 
                              : `por ${formatUnit(product.unit)}`
                            }
                          </Typography>
                          <Chip
                            label={product.pricing_type === 'measurement' ? '📏 Por medida' : '📦 Precio fijo'}
                            color={product.pricing_type === 'measurement' ? 'info' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                      
                      {product.pricing_type === 'measurement' && (
                        <Alert severity="info" sx={{ mt: 1, py: 0.5 }}>
                          <Typography variant="caption">
                            En cotización: cantidad × {product.unit} × {formatPrice(product.base_price)}
                          </Typography>
                        </Alert>
                      )}
                      
                      {product.cost_price && (
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="body2" color="text.secondary">
                            Costo: {formatPrice(product.cost_price)}
                          </Typography>
                          <Chip
                            label={`Margen: ${margin.toFixed(1)}%`}
                            color={getMarginColor(margin)}
                            size="small"
                          />
                        </Box>
                      )}
                    </Box>

                    {/* Información adicional */}
                    <Stack spacing={1} mb={2}>
                      <Box display="flex" alignItems="center">
                        <InventoryIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2">
                          Mínimo: {product.minimum_order} {formatUnit(product.unit, product.minimum_order)}
                        </Typography>
                      </Box>
                      
                      {product.preparation_time_minutes && (
                        <Box display="flex" alignItems="center">
                          <ScheduleIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Preparación: {product.preparation_time_minutes} min
                          </Typography>
                        </Box>
                      )}
                      
                      {product.shelf_life_hours && (
                        <Box display="flex" alignItems="center">
                          <WarningIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            Vida útil: {product.shelf_life_hours}h
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* Equipos requeridos */}
                    {product.requires_equipment && product.equipment_needed && (
                      <Box mt={2}>
                        <Typography variant="subtitle2" gutterBottom>
                          🔧 Equipos necesarios:
                        </Typography>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {product.equipment_needed.map((equipment, index) => (
                            <Chip
                              key={index}
                              label={equipment}
                              size="small"
                              variant="outlined"
                              icon={<BuildIcon />}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Ingredientes/Alérgenos */}
                    {(product.ingredients?.length || product.allergens?.length) && (
                      <Box mt={2}>
                        {product.ingredients && product.ingredients.length > 0 && (
                          <Box mb={1}>
                            <Typography variant="caption" display="block">
                              🥄 Ingredientes: {product.ingredients.slice(0, 3).join(', ')}
                              {product.ingredients.length > 3 && '...'}
                            </Typography>
                          </Box>
                        )}
                        
                        {product.allergens && product.allergens.length > 0 && (
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {product.allergens.map((allergen, index) => (
                              <Chip
                                key={index}
                                label={allergen}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    )}
                  </CardContent>

                  {/* Acciones */}
                  {showActions && (
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                      <Box>
                        <Tooltip title="Editar producto">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => onEditProduct?.(product)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar producto">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteProduct(product)}
                            disabled={deleteProduct.isPending}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      
                      <Button
                        size="small"
                        startIcon={<PriceIcon />}
                        variant="outlined"
                        disabled
                      >
                        Historial
                      </Button>
                    </CardActions>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}
    </Box>
  )
}

export default ProductList
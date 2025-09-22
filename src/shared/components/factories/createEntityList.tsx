/**
 * Entity List Factory - Story 2.7: Component Standardization
 * 
 * Factory function for generating standardized entity list components
 * Eliminates duplication across ProductList, EmployeeList, ClientList, etc.
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  InputAdornment,
  Fab,
  Divider
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material'
import type {
  BaseEntity,
  EntityListProps,
  FieldConfig,
  FilterConfig,
  ActionConfig,
  ListCustomizations
} from './types'

/**
 * Configuration for entity list factory
 */
export interface EntityListConfig<TEntity extends BaseEntity = BaseEntity> {
  entityName: string
  entityDisplayName: string
  entityIcon: string
  fields: FieldConfig[]
  layout?: {
    cardView?: boolean
    tableView?: boolean
    gridCols?: number
  }
  features?: {
    searchEnabled?: boolean
    filtersEnabled?: boolean
    exportEnabled?: boolean
    bulkActionsEnabled?: boolean
  }
  customizations?: ListCustomizations
}

/**
 * Create entity list component using factory pattern
 * 
 * @param config - List configuration  
 * @returns Generated list component
 */
export default function createEntityList<TEntity extends BaseEntity = BaseEntity>(
  config: EntityListConfig<TEntity>
) {
  
  const EntityList: React.FC<EntityListProps<TEntity>> = ({
    onEditEntity,
    onCreateEntity,
    onDeleteEntity,
    showActions = true,
    showFilters = true,
    showSearch = true,
    customFilters = [],
    customActions = [],
    selectable = false,
    onSelectionChange,
    hideInactive = false
  }) => {
    
    // State management
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card')
    const [searchTerm, setSearchTerm] = useState('')
    const [filters, setFilters] = useState<Record<string, any>>({})
    const [selectedEntities, setSelectedEntities] = useState<TEntity[]>([])
    const [showFiltersPanel, setShowFiltersPanel] = useState(false)
    
    // Get list hook (will integrate with consolidated hooks from Story 2.5)
    const {
      entities,
      loading,
      error,
      refetch
    } = useEntityListHook<TEntity>({
      entityName: config.entityName,
      searchTerm,
      filters: { ...filters, is_active: hideInactive ? true : undefined }
    })
    
    // Filter entities based on search and filters
    const filteredEntities = useMemo(() => {
      let result = entities
      
      // Apply search filter
      if (searchTerm && searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim()
        result = result.filter(entity => 
          entity.name?.toLowerCase().includes(search) ||
          Object.values(entity).some(value => 
            typeof value === 'string' && value.toLowerCase().includes(search)
          )
        )
      }
      
      return result
    }, [entities, searchTerm])
    
    // Handle search changes
    const handleSearchChange = useCallback((value: string) => {
      setSearchTerm(value)
    }, [])
    
    // Handle filter changes
    const handleFilterChange = useCallback((filterKey: string, value: any) => {
      setFilters(prev => ({
        ...prev,
        [filterKey]: value
      }))
    }, [])
    
    // Handle selection changes
    const handleSelectionChange = useCallback((entity: TEntity, selected: boolean) => {
      if (!selectable) return
      
      setSelectedEntities(prev => {
        const newSelection = selected
          ? [...prev, entity]
          : prev.filter(e => e.id !== entity.id)
        
        onSelectionChange?.(newSelection)
        return newSelection
      })
    }, [selectable, onSelectionChange])
    
    // Generate default actions
    const defaultActions: ActionConfig<TEntity>[] = [
      {
        id: 'edit',
        label: 'Editar',
        icon: 'EditIcon',
        color: 'primary',
        onClick: (entity) => onEditEntity?.(entity),
        visible: () => !!onEditEntity
      },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: 'DeleteIcon', 
        color: 'error',
        onClick: (entity) => onDeleteEntity?.(entity),
        visible: () => !!onDeleteEntity
      }
    ]
    
    const allActions = [...defaultActions, ...customActions]
    
    // Render entity card
    const renderEntityCard = useCallback((entity: TEntity) => (
      <Card 
        key={entity.id}
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 3
          }
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Entity Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'primary.main',
                width: 40,
                height: 40,
                fontSize: '1.2rem',
                mr: 2
              }}
            >
              {config.entityIcon}
            </Avatar>
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                component="div"
                noWrap
                sx={{ fontWeight: 'bold' }}
              >
                {entity.name || `${config.entityDisplayName} #${entity.id}`}
              </Typography>
              
              {/* Entity Status */}
              {entity.is_active !== undefined && (
                <Chip
                  size="small"
                  label={entity.is_active ? 'Activo' : 'Inactivo'}
                  color={entity.is_active ? 'success' : 'default'}
                  variant="outlined"
                />
              )}
            </Box>
            
            {/* Selection checkbox */}
            {selectable && (
              <Box>
                {/* TODO: Add checkbox for selection */}
              </Box>
            )}
          </Box>
          
          {/* Entity Fields */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {config.fields
              .filter(field => field.section !== 'actions')
              .slice(0, 4) // Show only first 4 fields in card view
              .map(field => (
                <Box key={field.field} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                    {field.label}:
                  </Typography>
                  <Typography variant="body2" sx={{ ml: 1, flexGrow: 1 }}>
                    {formatFieldValue(entity[field.field as keyof TEntity], field)}
                  </Typography>
                </Box>
              ))}
          </Box>
        </CardContent>
        
        {/* Card Actions */}
        {showActions && (
          <CardActions sx={{ p: 2, pt: 0 }}>
            <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'flex-end' }}>
              {allActions
                .filter(action => !action.visible || action.visible(entity))
                .map(action => (
                  <Tooltip key={action.id} title={action.label}>
                    <IconButton
                      size="small"
                      color={action.color || 'default'}
                      onClick={() => action.onClick(entity)}
                      disabled={action.disabled?.(entity)}
                    >
                      {getActionIcon(action.icon)}
                    </IconButton>
                  </Tooltip>
                ))
              }
            </Stack>
          </CardActions>
        )}
      </Card>
    ), [config, showActions, allActions, selectable])
    
    return (
      <Box sx={{ p: 2 }}>
        {/* Toolbar */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px', fontSize: '28px' }}>
                {config.entityIcon}
              </span>
              {config.entityDisplayName}
            </Typography>
            
            {/* View Mode Toggle */}
            <Stack direction="row" spacing={1}>
              <IconButton
                onClick={() => setViewMode('card')}
                color={viewMode === 'card' ? 'primary' : 'default'}
              >
                <ViewModuleIcon />
              </IconButton>
              <IconButton
                onClick={() => setViewMode('table')}
                color={viewMode === 'table' ? 'primary' : 'default'}
              >
                <ViewListIcon />
              </IconButton>
            </Stack>
          </Box>
          
          {/* Search and Filters */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
            {/* Search Field */}
            {showSearch && config.features?.searchEnabled !== false && (
              <TextField
                placeholder={`Buscar ${config.entityDisplayName.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }}
                sx={{ flexGrow: 1, maxWidth: { xs: '100%', sm: '400px' } }}
              />
            )}
            
            {/* Filter Toggle */}
            {showFilters && config.features?.filtersEnabled !== false && (
              <Button
                startIcon={<FilterIcon />}
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                variant={showFiltersPanel ? 'contained' : 'outlined'}
                size="large"
              >
                Filtros
              </Button>
            )}
            
            {/* Active/Inactive Toggle */}
            <Button
              startIcon={hideInactive ? <ViewIcon /> : <HideIcon />}
              onClick={() => {
                // This would normally update a filter state
                console.log('Toggle active/inactive filter')
              }}
              variant="outlined"
              size="large"
            >
              {hideInactive ? 'Mostrar Todos' : 'Solo Activos'}
            </Button>
          </Stack>
          
          {/* Filters Panel */}
          {showFiltersPanel && (
            <Card sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>Filtros</Typography>
              <Grid container spacing={2}>
                {customFilters.map(filter => (
                  <Grid item xs={12} sm={6} md={4} key={filter.field}>
                    {renderFilter(filter, filters[filter.field], (value) => 
                      handleFilterChange(filter.field, value)
                    )}
                  </Grid>
                ))}
              </Grid>
            </Card>
          )}
        </Box>
        
        {/* Custom Toolbar */}
        {config.customizations?.customToolbar && (
          <Box sx={{ mb: 2 }}>
            {config.customizations.customToolbar}
          </Box>
        )}
        
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Cargando {config.entityDisplayName.toLowerCase()}...
            </Typography>
          </Box>
        )}
        
        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Error al cargar {config.entityDisplayName.toLowerCase()}: {error}
          </Alert>
        )}
        
        {/* Entity Grid/List */}
        {!loading && !error && (
          <>
            {filteredEntities.length > 0 ? (
              <Grid container spacing={2}>
                {filteredEntities.map(entity => (
                  <Grid 
                    item 
                    key={entity.id}
                    xs={12} 
                    sm={viewMode === 'card' ? 6 : 12} 
                    md={viewMode === 'card' ? 4 : 12}
                    lg={viewMode === 'card' ? 3 : 12}
                  >
                    {renderEntityCard(entity)}
                  </Grid>
                ))}
              </Grid>
            ) : (
              // Empty State
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '300px',
                  textAlign: 'center'
                }}
              >
                {config.customizations?.customEmptyState || (
                  <>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No se encontraron {config.entityDisplayName.toLowerCase()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {searchTerm || Object.keys(filters).length > 0
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : `No hay ${config.entityDisplayName.toLowerCase()} registrados aún`
                      }
                    </Typography>
                    {onCreateEntity && (
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={onCreateEntity}
                        sx={{ mt: 2 }}
                      >
                        Crear Primer {config.entityDisplayName}
                      </Button>
                    )}
                  </>
                )}
              </Box>
            )}
          </>
        )}
        
        {/* Floating Action Button */}
        {onCreateEntity && (
          <Fab
            color="primary"
            aria-label={`Crear ${config.entityDisplayName}`}
            onClick={onCreateEntity}
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Box>
    )
  }
  
  // Set display name for debugging
  EntityList.displayName = `EntityList(${config.entityDisplayName})`
  
  return EntityList
}

/**
 * Placeholder hook for entity lists
 * This will be replaced with integration to consolidated hooks from Story 2.5
 */
function useEntityListHook<TEntity extends BaseEntity = BaseEntity>(options: {
  entityName: string
  searchTerm: string
  filters: Record<string, any>
}) {
  
  // TODO: Integrate with consolidated hooks from Story 2.5
  // For now, return placeholder implementation
  
  return {
    entities: [] as TEntity[],
    loading: false,
    error: null as string | null,
    refetch: () => Promise.resolve()
  }
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any, field: FieldConfig): string {
  if (value === null || value === undefined) return '-'
  
  switch (field.type) {
    case 'currency':
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(Number(value) || 0)
      
    case 'percentage':
      return `${Number(value) || 0}%`
      
    case 'date':
      return new Date(value).toLocaleDateString('es-CO')
      
    case 'boolean':
      return value ? 'Sí' : 'No'
      
    case 'select':
      const option = field.options?.find(opt => opt.value === value)
      return option?.label || String(value)
      
    default:
      return String(value)
  }
}

/**
 * Render filter component
 */
function renderFilter(
  filter: FilterConfig,
  value: any,
  onChange: (value: any) => void
) {
  switch (filter.type) {
    case 'select':
      return (
        <FormControl fullWidth>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            label={filter.label}
          >
            <MenuItem value="">Todos</MenuItem>
            {filter.options?.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )
      
    case 'boolean':
      return (
        <FormControl fullWidth>
          <InputLabel>{filter.label}</InputLabel>
          <Select
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            label={filter.label}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="true">Sí</MenuItem>
            <MenuItem value="false">No</MenuItem>
          </Select>
        </FormControl>
      )
      
    default:
      return (
        <TextField
          fullWidth
          label={filter.label}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          type={filter.type === 'number' ? 'number' : 'text'}
        />
      )
  }
}

/**
 * Get icon component from string
 */
function getActionIcon(iconName?: string) {
  switch (iconName) {
    case 'EditIcon':
      return <EditIcon />
    case 'DeleteIcon':
      return <DeleteIcon />
    case 'ViewIcon':
      return <ViewIcon />
    default:
      return <EditIcon />
  }
}
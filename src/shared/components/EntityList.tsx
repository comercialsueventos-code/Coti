import React from 'react'
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  Typography,
  Alert,
  CircularProgress,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material'
import { EMPTY_STATES } from '../constants'

/**
 * Entity Action Configuration
 */
export interface EntityAction<T = any> {
  /** Action key */
  key: string
  /** Action label */
  label: string
  /** Action icon */
  icon: React.ReactNode
  /** Action handler */
  onClick: (entity: T) => void
  /** Action color */
  color?: 'inherit' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
  /** Show action condition */
  show?: (entity: T) => boolean
  /** Disable action condition */
  disabled?: (entity: T) => boolean
  /** Action tooltip */
  tooltip?: string
}

/**
 * Entity List Props
 */
export interface EntityListProps<T = any> {
  /** List title */
  title?: string
  
  /** List subtitle */
  subtitle?: string
  
  /** Entities to display */
  entities: T[]
  
  /** Loading state */
  isLoading?: boolean
  
  /** Error message */
  error?: string | null
  
  /** Empty state message */
  emptyMessage?: string
  
  /** Render function for each entity */
  renderEntity: (entity: T, index: number) => React.ReactNode
  
  /** Enable create action */
  enableCreate?: boolean
  
  /** Create action handler */
  onCreateNew?: () => void
  
  /** Create button text */
  createButtonText?: string
  
  /** Entity actions (edit, delete, etc.) */
  actions?: EntityAction<T>[]
  
  /** Enable search */
  enableSearch?: boolean
  
  /** Search value */
  searchValue?: string
  
  /** Search handler */
  onSearchChange?: (value: string) => void
  
  /** Enable filtering */
  enableFiltering?: boolean
  
  /** Filter handler */
  onFilterToggle?: () => void
  
  /** Show floating action button instead of top button */
  useFloatingActionButton?: boolean
  
  /** Custom header actions */
  customHeaderActions?: React.ReactNode
  
  /** Custom empty state content */
  customEmptyState?: React.ReactNode
  
  /** Grid layout (default: false for list layout) */
  gridLayout?: boolean
  
  /** Grid columns (for grid layout) */
  gridColumns?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number }
}

/**
 * Default entity actions
 */
export const createDefaultActions = <T extends { id: number }>(
  onEdit: (entity: T) => void,
  onDelete: (entity: T) => void,
  onView?: (entity: T) => void
): EntityAction<T>[] => {
  const actions: EntityAction<T>[] = []
  
  if (onView) {
    actions.push({
      key: 'view',
      label: 'Ver',
      icon: <ViewIcon />,
      onClick: onView,
      color: 'info',
      tooltip: 'Ver detalles'
    })
  }
  
  actions.push(
    {
      key: 'edit',
      label: 'Editar',
      icon: <EditIcon />,
      onClick: onEdit,
      color: 'primary',
      tooltip: 'Editar elemento'
    },
    {
      key: 'delete',
      label: 'Eliminar',
      icon: <DeleteIcon />,
      onClick: onDelete,
      color: 'error',
      tooltip: 'Eliminar elemento'
    }
  )
  
  return actions
}

/**
 * Entity List Component
 * 
 * A standardized list component that provides:
 * - Consistent styling and layout
 * - Loading and error states
 * - CRUD actions
 * - Search and filtering
 * - Empty states
 * 
 * @example
 * ```tsx
 * <EntityList
 *   title="Clientes"
 *   entities={clients}
 *   isLoading={isLoading}
 *   renderEntity={(client) => <ClientCard client={client} />}
 *   actions={createDefaultActions(handleEdit, handleDelete)}
 *   onCreateNew={() => setCreateDialogOpen(true)}
 * />
 * ```
 */
export const EntityList = <T extends { id: number }>({
  title,
  subtitle,
  entities,
  isLoading = false,
  error,
  emptyMessage,
  renderEntity,
  enableCreate = true,
  onCreateNew,
  createButtonText = 'Crear Nuevo',
  actions = [],
  enableSearch = false,
  searchValue = '',
  onSearchChange,
  enableFiltering = false,
  onFilterToggle,
  useFloatingActionButton = false,
  customHeaderActions,
  customEmptyState,
  gridLayout = false,
  gridColumns = { xs: 1, sm: 2, md: 3, lg: 4 }
}: EntityListProps<T>) => {
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  
  // Render header
  const renderHeader = () => (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      mb: 3,
      flexWrap: 'wrap',
      gap: 2
    }}>
      {/* Title */}
      <Box>
        {title && (
          <Typography variant="h4" component="h1" fontWeight={600}>
            {title}
          </Typography>
        )}
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      
      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {customHeaderActions}
        
        {enableSearch && onSearchChange && (
          <Tooltip title="Buscar">
            <IconButton onClick={() => onSearchChange('')}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {enableFiltering && onFilterToggle && (
          <Tooltip title="Filtrar">
            <IconButton onClick={onFilterToggle}>
              <FilterIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {enableCreate && onCreateNew && !useFloatingActionButton && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onCreateNew}
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'Crear' : createButtonText}
          </Button>
        )}
      </Box>
    </Box>
  )
  
  // Render loading state
  if (isLoading) {
    return (
      <Box>
        {renderHeader()}
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Box>
    )
  }
  
  // Render error state
  if (error) {
    return (
      <Box>
        {renderHeader()}
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    )
  }
  
  // Render empty state
  if (entities.length === 0) {
    return (
      <Box>
        {renderHeader()}
        {customEmptyState || (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            color: 'text.secondary'
          }}>
            <Typography variant="h6" gutterBottom>
              {emptyMessage || EMPTY_STATES.NO_DATA}
            </Typography>
            {enableCreate && onCreateNew && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={onCreateNew}
                sx={{ mt: 2 }}
              >
                {createButtonText}
              </Button>
            )}
          </Box>
        )}
      </Box>
    )
  }
  
  return (
    <Box sx={{ position: 'relative' }}>
      {renderHeader()}
      
      {/* Entity List */}
      <Box sx={{
        ...(gridLayout && {
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: `repeat(${gridColumns.xs || 1}, 1fr)`,
            sm: `repeat(${gridColumns.sm || 2}, 1fr)`,
            md: `repeat(${gridColumns.md || 3}, 1fr)`,
            lg: `repeat(${gridColumns.lg || 4}, 1fr)`,
            xl: `repeat(${gridColumns.xl || 4}, 1fr)`
          }
        }),
        ...(!gridLayout && {
          display: 'flex',
          flexDirection: 'column',
          gap: 2
        })
      }}>
        {entities.map((entity, index) => (
          <Box 
            key={entity.id} 
            sx={{ 
              position: 'relative',
              '&:hover .entity-actions': {
                opacity: 1,
                visibility: 'visible'
              }
            }}
          >
            {renderEntity(entity, index)}
            
            {/* Entity Actions Overlay */}
            {actions.length > 0 && (
              <Box
                className="entity-actions"
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  display: 'flex',
                  gap: 0.5,
                  opacity: isMobile ? 1 : 0,
                  visibility: isMobile ? 'visible' : 'hidden',
                  transition: 'opacity 0.2s, visibility 0.2s',
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  boxShadow: 1,
                  p: 0.5
                }}
              >
                {actions.map((action) => {
                  const shouldShow = action.show ? action.show(entity) : true
                  const isDisabled = action.disabled ? action.disabled(entity) : false
                  
                  if (!shouldShow) return null
                  
                  return (
                    <Tooltip key={action.key} title={action.tooltip || action.label}>
                      <span>
                        <IconButton
                          size="small"
                          color={action.color || 'default'}
                          onClick={() => action.onClick(entity)}
                          disabled={isDisabled}
                        >
                          {action.icon}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )
                })}
              </Box>
            )}
          </Box>
        ))}
      </Box>
      
      {/* Floating Action Button */}
      {enableCreate && onCreateNew && useFloatingActionButton && (
        <Fab
          color="primary"
          aria-label={createButtonText}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.speedDial
          }}
          onClick={onCreateNew}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  )
}

export default EntityList
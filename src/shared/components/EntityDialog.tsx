import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
  Typography,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material'
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { BaseDialogProps } from '../types'

/**
 * Entity Dialog Types
 */
export type EntityDialogType = 'create' | 'edit' | 'delete' | 'view' | 'custom'

/**
 * Entity Dialog Props
 */
export interface EntityDialogProps extends BaseDialogProps {
  /** Dialog type */
  type: EntityDialogType
  
  /** Entity name (e.g., "cliente", "producto") */
  entityName: string
  
  /** Entity being edited/deleted (for edit/delete modes) */
  entity?: any
  
  /** Dialog title (auto-generated if not provided) */
  title?: string
  
  /** Dialog subtitle */
  subtitle?: string
  
  /** Dialog content */
  children: React.ReactNode
  
  /** Loading state */
  isLoading?: boolean
  
  /** Disable actions */
  disableActions?: boolean
  
  /** Custom action buttons */
  customActions?: React.ReactNode
  
  /** Hide default action buttons */
  hideDefaultActions?: boolean
  
  /** Confirm action handler (for delete dialogs) */
  onConfirm?: () => void
  
  /** Submit action handler (for create/edit dialogs) */
  onSubmit?: () => void
  
  /** Dialog size */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  
  /** Full width */
  fullWidth?: boolean
  
  /** Full screen on mobile */
  fullScreenOnMobile?: boolean
}

/**
 * Entity Dialog Component
 * 
 * A standardized dialog component that handles common entity operations:
 * - Create/Edit forms
 * - Delete confirmations
 * - View-only dialogs
 * - Custom content dialogs
 * 
 * @example
 * ```tsx
 * <EntityDialog
 *   open={isOpen}
 *   onClose={onClose}
 *   type="create"
 *   entityName="cliente"
 *   onSubmit={handleSubmit}
 * >
 *   <ClientForm />
 * </EntityDialog>
 * ```
 */
export const EntityDialog: React.FC<EntityDialogProps> = ({
  open,
  onClose,
  type,
  entityName,
  entity,
  title,
  subtitle,
  children,
  isLoading = false,
  disableActions = false,
  customActions,
  hideDefaultActions = false,
  onConfirm,
  onSubmit,
  maxWidth = 'md',
  fullWidth = true,
  fullScreenOnMobile = true
}) => {
  
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const shouldBeFullScreen = fullScreenOnMobile && isMobile
  
  // Auto-generate title if not provided
  const getDialogTitle = () => {
    if (title) return title
    
    switch (type) {
      case 'create':
        return `Crear ${entityName}`
      case 'edit':
        return `Editar ${entityName}`
      case 'delete':
        return `Eliminar ${entityName}`
      case 'view':
        return `Ver ${entityName}`
      default:
        return entityName
    }
  }
  
  // Auto-generate subtitle if not provided
  const getDialogSubtitle = () => {
    if (subtitle) return subtitle
    
    if (type === 'edit' && entity) {
      const name = entity.name || entity.title || entity.label
      if (name) return `Editando: ${name}`
    }
    
    if (type === 'delete' && entity) {
      return '¿Está seguro que desea eliminar este elemento?'
    }
    
    return undefined
  }
  
  const dialogTitle = getDialogTitle()
  const dialogSubtitle = getDialogSubtitle()
  
  const handleConfirm = () => {
    if (onConfirm && !isLoading && !disableActions) {
      onConfirm()
    }
  }
  
  const handleSubmit = () => {
    if (onSubmit && !isLoading && !disableActions) {
      onSubmit()
    }
  }
  
  const renderActions = () => {
    if (hideDefaultActions) {
      return customActions || null
    }
    
    return (
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        {customActions}
        
        {type === 'delete' && (
          <>
            <Button
              onClick={onClose}
              disabled={isLoading}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || disableActions}
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
            >
              {isLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        )}
        
        {(type === 'create' || type === 'edit') && (
          <>
            <Button
              onClick={onClose}
              disabled={isLoading}
              color="inherit"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || disableActions}
              variant="contained"
              color="primary"
            >
              {isLoading ? 
                (type === 'create' ? 'Creando...' : 'Actualizando...') : 
                (type === 'create' ? 'Crear' : 'Actualizar')
              }
            </Button>
          </>
        )}
        
        {type === 'view' && (
          <Button
            onClick={onClose}
            variant="contained"
            color="primary"
          >
            Cerrar
          </Button>
        )}
      </Box>
    )
  }
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      fullScreen={shouldBeFullScreen}
      PaperProps={{
        sx: {
          // Add some nice styling
          borderRadius: shouldBeFullScreen ? 0 : 2,
          ...(type === 'delete' && {
            border: `2px solid ${theme.palette.error.main}20`,
          })
        }
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="h2" fontWeight={600}>
            {type === 'delete' && <WarningIcon sx={{ mr: 1, color: 'error.main' }} />}
            {dialogTitle}
          </Typography>
          {dialogSubtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {dialogSubtitle}
            </Typography>
          )}
        </Box>
        
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ ml: 1 }}
          disabled={isLoading}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      {/* Content */}
      <DialogContent sx={{ p: 3 }}>
        {children}
      </DialogContent>
      
      {/* Actions */}
      {!hideDefaultActions || customActions ? (
        <>
          <Divider />
          <DialogActions sx={{ p: 3, pt: 2 }}>
            {renderActions()}
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  )
}

export default EntityDialog
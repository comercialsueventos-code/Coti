/**
 * Quick Add Dialog Factory - Story 2.7: Component Standardization
 * 
 * Factory function for generating standardized quick add dialog components
 * Eliminates duplication across QuickAddProductDialog, QuickAddMachineryRentalDialog, etc.
 */

import React, { useState, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Box
} from '@mui/material'
import {
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import type {
  BaseEntity,
  BaseFormData,
  QuickAddDialogProps,
  QuickAddConfig,
  QuickAddField,
  DialogCustomizations
} from './types'

/**
 * Configuration for quick add dialog factory
 */
export interface QuickAddDialogConfig<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
> {
  entityName: string
  entityDisplayName: string
  icon: string
  fields: QuickAddField[]
  defaultValues?: Partial<TFormData>
  validation?: (data: Partial<TFormData>) => Record<string, string>
  customizations?: DialogCustomizations
}

/**
 * Create quick add dialog component using factory pattern
 * 
 * @param config - Quick add dialog configuration
 * @returns Generated quick add dialog component
 */
export default function createQuickAddDialog<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(config: QuickAddDialogConfig<TEntity, TFormData>) {
  
  const QuickAddDialog: React.FC<QuickAddDialogProps<TEntity>> = ({
    open,
    onClose,
    onEntityCreated,
    initialData,
    customTitle
  }) => {
    
    // Form state
    const [formData, setFormData] = useState<Partial<TFormData>>(() => ({
      ...config.defaultValues,
      ...initialData
    }))
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(false)
    
    // Handle field changes
    const handleFieldChange = useCallback((field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
      
      // Clear error when field is modified
      if (errors[field]) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors[field]
          return newErrors
        })
      }
    }, [errors])
    
    // Validate form
    const validateForm = useCallback((): boolean => {
      const newErrors: Record<string, string> = {}
      
      // Required field validation
      config.fields.forEach(field => {
        if (field.required && !formData[field.field as keyof TFormData]) {
          newErrors[field.field] = `${field.label} es requerido`
        }
      })
      
      // Custom validation
      if (config.validation) {
        const customErrors = config.validation(formData)
        Object.assign(newErrors, customErrors)
      }
      
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }, [formData])
    
    // Handle form submission
    const handleSubmit = useCallback(async () => {
      if (!validateForm()) return
      
      setIsLoading(true)
      
      try {
        // TODO: Integrate with consolidated mutation hooks from Story 2.5
        // For now, simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock created entity
        const createdEntity = {
          id: Date.now(),
          ...formData,
          created_at: new Date().toISOString()
        } as TEntity
        
        onEntityCreated(createdEntity)
        handleReset()
        onClose()
        
      } catch (error) {
        console.error('Error creating entity:', error)
        setErrors({ submit: 'Error al crear el elemento. Inténtalo de nuevo.' })
      } finally {
        setIsLoading(false)
      }
    }, [formData, validateForm, onEntityCreated, onClose])
    
    // Reset form
    const handleReset = useCallback(() => {
      setFormData({
        ...config.defaultValues,
        ...initialData
      })
      setErrors({})
    }, [initialData])
    
    // Handle dialog close
    const handleClose = useCallback(() => {
      if (!isLoading) {
        handleReset()
        onClose()
      }
    }, [isLoading, onClose, handleReset])
    
    // Generate dialog title
    const dialogTitle = customTitle || `${config.icon} Agregar ${config.entityDisplayName}`
    
    return (
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth={config.customizations?.maxWidth || 'sm'}
        fullWidth={config.customizations?.fullWidth ?? true}
        PaperProps={{
          sx: {
            minHeight: '400px'
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" component="div">
            {dialogTitle}
          </Typography>
          
          <IconButton
            onClick={handleClose}
            disabled={isLoading}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        {/* Custom Header */}
        {config.customizations?.customHeader && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            {config.customizations.customHeader}
          </Box>
        )}
        
        {/* Dialog Content */}
        <DialogContent sx={{ pt: 3 }}>
          {/* Loading State */}
          {isLoading && (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: '200px'
              }}
            >
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Creando {config.entityDisplayName.toLowerCase()}...
              </Typography>
            </Box>
          )}
          
          {/* Error Display */}
          {Object.keys(errors).length > 0 && !isLoading && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errors.submit || 'Por favor corrige los errores en el formulario'}
            </Alert>
          )}
          
          {/* Form Fields */}
          {!isLoading && (
            <Grid container spacing={2}>
              {config.fields.map(field => (
                <Grid item xs={12} key={field.field}>
                  {renderField(
                    field,
                    formData[field.field as keyof TFormData],
                    (value) => handleFieldChange(field.field, value),
                    errors[field.field]
                  )}
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
        
        {/* Custom Footer */}
        {config.customizations?.customFooter && (
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            {config.customizations.customFooter}
          </Box>
        )}
        
        {/* Dialog Actions */}
        <DialogActions
          sx={{
            borderTop: 1,
            borderColor: 'divider',
            p: 2
          }}
        >
          <Button
            onClick={handleClose}
            disabled={isLoading}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
          >
            {isLoading ? 'Creando...' : `Crear ${config.entityDisplayName}`}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
  
  // Set display name for debugging
  QuickAddDialog.displayName = `QuickAddDialog(${config.entityDisplayName})`
  
  return QuickAddDialog
}

/**
 * Render individual form field based on field configuration
 */
function renderField(
  field: QuickAddField,
  value: any,
  onChange: (value: any) => void,
  error?: string
) {
  const commonProps = {
    fullWidth: true,
    error: !!error,
    helperText: error || field.helperText,
    label: field.label,
    placeholder: field.placeholder
  }
  
  switch (field.type) {
    case 'text':
      return (
        <TextField
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )
      
    case 'number':
      return (
        <TextField
          {...commonProps}
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
          required={field.required}
        />
      )
      
    case 'select':
      return (
        <FormControl fullWidth error={!!error} required={field.required}>
          <InputLabel>{field.label}</InputLabel>
          <Select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            label={field.label}
          >
            {!field.required && (
              <MenuItem value="">
                <em>Seleccionar...</em>
              </MenuItem>
            )}
            {field.options?.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {(error || field.helperText) && (
            <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, mx: 1.75 }}>
              {error || field.helperText}
            </Typography>
          )}
        </FormControl>
      )
      
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Switch
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
          }
          label={field.label}
          sx={{
            width: '100%',
            ml: 0,
            '& .MuiFormControlLabel-label': {
              width: '100%'
            }
          }}
        />
      )
      
    case 'date':
      return (
        <TextField
          {...commonProps}
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          InputLabelProps={{
            shrink: true
          }}
        />
      )
      
    default:
      return (
        <TextField
          {...commonProps}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      )
  }
}

/**
 * Create default quick add configuration for common entities
 */
export function createDefaultQuickAddConfig(entityName: string): Partial<QuickAddDialogConfig> {
  const configs: Record<string, Partial<QuickAddDialogConfig>> = {
    product: {
      fields: [
        {
          field: 'name',
          label: 'Nombre del Producto',
          type: 'text',
          required: true,
          placeholder: 'Ej: Pastel de Chocolate'
        },
        {
          field: 'base_price',
          label: 'Precio Base',
          type: 'number',
          required: true,
          placeholder: '0'
        }
      ]
    },
    
    employee: {
      fields: [
        {
          field: 'name',
          label: 'Nombre Completo',
          type: 'text',
          required: true,
          placeholder: 'Ej: Juan Pérez'
        },
        {
          field: 'phone',
          label: 'Teléfono',
          type: 'text',
          placeholder: 'Ej: 300 123 4567'
        }
      ]
    },
    
    client: {
      fields: [
        {
          field: 'name',
          label: 'Nombre o Razón Social',
          type: 'text',
          required: true,
          placeholder: 'Ej: Empresa ABC S.A.S'
        },
        {
          field: 'email',
          label: 'Email',
          type: 'text',
          placeholder: 'contacto@empresa.com'
        }
      ]
    }
  }
  
  return configs[entityName.toLowerCase()] || {
    fields: [
      {
        field: 'name',
        label: 'Nombre',
        type: 'text',
        required: true
      }
    ]
  }
}

/**
 * Helper function to merge field configurations
 */
export function mergeQuickAddFields(
  defaultFields: QuickAddField[],
  customFields: QuickAddField[]
): QuickAddField[] {
  const merged = [...defaultFields]
  
  customFields.forEach(customField => {
    const existingIndex = merged.findIndex(f => f.field === customField.field)
    
    if (existingIndex >= 0) {
      // Replace existing field
      merged[existingIndex] = customField
    } else {
      // Add new field
      merged.push(customField)
    }
  })
  
  return merged
}
/**
 * Entity Form Factory - Story 2.7: Component Standardization
 * 
 * Factory function for generating standardized entity form components
 * Eliminates duplication across ProductForm, EmployeeForm, ClientForm, etc.
 */

import React, { useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  IconButton,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon
} from '@mui/icons-material'
import type {
  BaseEntity,
  BaseFormData,
  EntityFormProps,
  EntitySection,
  FormCustomizations
} from './types'

/**
 * Configuration for entity form factory
 */
export interface EntityFormConfig<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
> {
  entityName: string
  entityDisplayName: string
  entityIcon: string
  sections: EntitySection<TFormData>[]
  layout?: {
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false
    fullWidth?: boolean
  }
  features?: {
    createEnabled?: boolean
    editEnabled?: boolean
  }
  customizations?: FormCustomizations
}

/**
 * Create entity form component using factory pattern
 * 
 * @param config - Form configuration
 * @returns Generated form component
 */
export default function createEntityForm<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(config: EntityFormConfig<TEntity, TFormData>) {
  
  // Create the form component
  const EntityForm: React.FC<EntityFormProps<TEntity>> = ({
    open,
    onClose,
    entity,
    mode,
    onSaved,
    customTitle,
    readOnly = false,
    hideActions = false
  }) => {
    
    // Get form hook (will integrate with consolidated hooks from Story 2.5)
    // For now, we'll use a placeholder until we implement the actual hook integration
    const {
      formData,
      errors,
      isLoading,
      handleFormDataChange,
      handleSubmit,
      handleReset
    } = useEntityFormHook<TEntity, TFormData>({
      entity,
      mode,
      entityName: config.entityName,
      onSaved,
      onClose
    })
    
    // Generate title with icon and mode
    const generateTitle = useCallback(() => {
      if (customTitle) return customTitle
      
      if (mode === 'create') {
        return `${config.entityIcon} Crear Nuevo ${config.entityDisplayName}`
      } else {
        return `✏️ Editar ${entity?.name || config.entityDisplayName}`
      }
    }, [mode, entity, customTitle])
    
    // Handle form submission
    const onSubmit = useCallback(async () => {
      if (config.customizations?.onBeforeSave) {
        try {
          const processedData = await config.customizations.onBeforeSave(formData)
          await handleSubmit(processedData)
        } catch (error) {
          console.error('Error in onBeforeSave:', error)
        }
      } else {
        await handleSubmit()
      }
    }, [formData, handleSubmit])
    
    // Sort sections by order
    const sortedSections = config.sections
      .filter(section => !section.visible || section.visible(formData, mode))
      .sort((a, b) => a.order - b.order)
    
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={config.layout?.maxWidth || 'lg'}
        fullWidth={config.layout?.fullWidth ?? true}
        PaperProps={{
          sx: {
            minHeight: '60vh',
            maxHeight: '90vh'
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
            borderColor: 'divider',
            pb: 2
          }}
        >
          <Typography variant="h6" component="div">
            {generateTitle()}
          </Typography>
          
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: 'grey.500',
              '&:hover': {
                backgroundColor: 'grey.100'
              }
            }}
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
        <DialogContent
          dividers
          sx={{
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.100'
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.400',
              borderRadius: '4px'
            }
          }}
        >
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
                {mode === 'create' ? 'Creando...' : 'Guardando cambios...'}
              </Typography>
            </Box>
          )}
          
          {/* Error Display */}
          {Object.keys(errors).length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Por favor corrige los siguientes errores:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>
                    <Typography variant="caption">
                      {error}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          
          {/* Form Sections */}
          {!isLoading && (
            <Grid container spacing={3}>
              {sortedSections.map((section, index) => (
                <React.Fragment key={section.id}>
                  {/* Section Header */}
                  <Grid item xs={12}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        color: 'primary.main',
                        fontWeight: 'bold'
                      }}
                    >
                      {section.icon && (
                        <span style={{ marginRight: '8px', fontSize: '20px' }}>
                          {section.icon}
                        </span>
                      )}
                      {section.title}
                    </Typography>
                    {index > 0 && <Divider sx={{ mt: 1, mb: 2 }} />}
                  </Grid>
                  
                  {/* Section Content */}
                  <Grid item xs={12}>
                    <section.component
                      formData={formData}
                      onFormDataChange={handleFormDataChange}
                      errors={errors}
                      mode={mode}
                      readOnly={readOnly}
                    />
                  </Grid>
                </React.Fragment>
              ))}
              
              {/* No Sections Fallback */}
              {sortedSections.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No se han configurado secciones para este formulario.
                    Configure las secciones en la configuración del componente.
                  </Alert>
                </Grid>
              )}
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
        {!hideActions && (
          <DialogActions
            sx={{
              borderTop: 1,
              borderColor: 'divider',
              p: 2,
              gap: 1
            }}
          >
            {/* Reset Button (only in edit mode) */}
            {mode === 'edit' && (
              <Button
                onClick={handleReset}
                disabled={isLoading}
                startIcon={<CancelIcon />}
                sx={{ mr: 'auto' }}
              >
                Restablecer
              </Button>
            )}
            
            {/* Cancel Button */}
            <Button
              onClick={onClose}
              disabled={isLoading}
              color="inherit"
              startIcon={<CancelIcon />}
            >
              Cancelar
            </Button>
            
            {/* Save Button */}
            {!readOnly && (
              <Button
                onClick={onSubmit}
                disabled={isLoading}
                variant="contained"
                startIcon={isLoading ? <CircularProgress size={16} /> : <SaveIcon />}
              >
                {isLoading 
                  ? (mode === 'create' ? 'Creando...' : 'Guardando...') 
                  : (mode === 'create' ? 'Crear' : 'Guardar Cambios')
                }
              </Button>
            )}
          </DialogActions>
        )}
      </Dialog>
    )
  }
  
  // Set display name for debugging
  EntityForm.displayName = `EntityForm(${config.entityDisplayName})`
  
  return EntityForm
}

/**
 * Placeholder hook for entity forms
 * This will be replaced with integration to consolidated hooks from Story 2.5
 */
function useEntityFormHook<
  TEntity extends BaseEntity = BaseEntity,
  TFormData extends BaseFormData = BaseFormData
>(options: {
  entity?: TEntity
  mode: 'create' | 'edit'
  entityName: string
  onSaved?: (entity: TEntity) => void
  onClose: () => void
}) {
  
  // TODO: Integrate with consolidated hooks from Story 2.5
  // For now, return placeholder implementation
  
  return {
    formData: {} as TFormData,
    errors: {} as Record<string, string>,
    isLoading: false,
    
    handleFormDataChange: (updates: Partial<TFormData>) => {
      console.log('Form data change:', updates)
    },
    
    handleSubmit: async (processedData?: TFormData) => {
      console.log('Form submit:', processedData)
      // Integration with mutation hooks from Story 2.5 will be added here
    },
    
    handleReset: () => {
      console.log('Form reset')
    }
  }
}

/**
 * Utility function to create default sections for common entities
 */
export function createDefaultSections<TFormData extends BaseFormData>(
  entityName: string
): EntitySection<TFormData>[] {
  
  const defaultSections: Record<string, EntitySection<any>[]> = {
    product: [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: () => null, // Will be replaced with actual components
        order: 1
      },
      {
        id: 'pricing',
        title: 'Precios y Costos',
        icon: '💰',
        component: () => null,
        order: 2
      }
    ],
    
    employee: [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: () => null,
        order: 1
      },
      {
        id: 'rates',
        title: 'Tarifas por Categoría',
        icon: '💰',
        component: () => null,
        order: 2
      }
    ],
    
    client: [
      {
        id: 'basic',
        title: 'Información Básica',
        icon: '📋',
        component: () => null,
        order: 1
      },
      {
        id: 'contact',
        title: 'Información de Contacto',
        icon: '📞',
        component: () => null,
        order: 2
      }
    ]
  }
  
  return defaultSections[entityName.toLowerCase()] || [
    {
      id: 'basic',
      title: 'Información Básica',
      icon: '📋',
      component: () => null,
      order: 1
    }
  ]
}

/**
 * Helper function to merge sections with defaults
 */
export function mergeSections<TFormData extends BaseFormData>(
  defaultSections: EntitySection<TFormData>[],
  customSections: EntitySection<TFormData>[]
): EntitySection<TFormData>[] {
  
  const merged = [...defaultSections]
  
  customSections.forEach(customSection => {
    const existingIndex = merged.findIndex(s => s.id === customSection.id)
    
    if (existingIndex >= 0) {
      // Replace existing section
      merged[existingIndex] = customSection
    } else {
      // Add new section
      merged.push(customSection)
    }
  })
  
  return merged.sort((a, b) => a.order - b.order)
}
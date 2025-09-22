import React from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Grid,
  Divider,
  CircularProgress,
  Typography
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Error as ErrorIcon
} from '@mui/icons-material'

/**
 * Base Form Props
 */
export interface BaseFormProps {
  /** Form title */
  title: string
  
  /** Form subtitle/description (optional) */
  subtitle?: string
  
  /** Form children (form fields) */
  children: React.ReactNode
  
  /** Is form in edit mode */
  isEdit?: boolean
  
  /** Loading state */
  isSubmitting?: boolean
  
  /** Error message */
  error?: string | null
  
  /** Success message */
  success?: string | null
  
  /** Submit handler */
  onSubmit: (event: React.FormEvent) => void
  
  /** Cancel handler */
  onCancel: () => void
  
  /** Custom submit button text */
  submitText?: string
  
  /** Custom cancel button text */
  cancelText?: string
  
  /** Disable submit button */
  disableSubmit?: boolean
  
  /** Hide cancel button */
  hideCancelButton?: boolean
  
  /** Show as card (default: true) */
  showAsCard?: boolean
  
  /** Card elevation */
  elevation?: number
  
  /** Custom form actions */
  customActions?: React.ReactNode
  
  /** Additional form props */
  formProps?: React.FormHTMLAttributes<HTMLFormElement>
}

/**
 * Base Form Component
 * 
 * A standardized form container that provides:
 * - Consistent styling and layout
 * - Loading states and error handling
 * - Submit/cancel actions
 * - Flexible content rendering
 * 
 * @example
 * ```tsx
 * <BaseForm
 *   title="Create Client"
 *   subtitle="Add a new client to the system"
 *   isEdit={false}
 *   isSubmitting={isLoading}
 *   error={error}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * >
 *   <TextField name="name" label="Name" />
 *   <TextField name="email" label="Email" />
 * </BaseForm>
 * ```
 */
export const BaseForm: React.FC<BaseFormProps> = ({
  title,
  subtitle,
  children,
  isEdit = false,
  isSubmitting = false,
  error,
  success,
  onSubmit,
  onCancel,
  submitText,
  cancelText = 'Cancelar',
  disableSubmit = false,
  hideCancelButton = false,
  showAsCard = true,
  elevation = 1,
  customActions,
  formProps,
  ...other
}) => {
  
  const defaultSubmitText = isEdit ? 'Actualizar' : 'Crear'
  const finalSubmitText = submitText || (isSubmitting ? 
    (isEdit ? 'Actualizando...' : 'Creando...') : 
    defaultSubmitText
  )
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isSubmitting && !disableSubmit) {
      onSubmit(event)
    }
  }
  
  const formContent = (
    <>
      {/* Header */}
      {showAsCard && (
        <CardHeader
          title={title}
          subheader={subtitle}
          titleTypographyProps={{ variant: 'h5', fontWeight: 600 }}
          subheaderTypographyProps={{ color: 'text.secondary', sx: { mt: 0.5 } }}
        />
      )}
      
      {!showAsCard && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      
      {/* Messages */}
      {error && (
        <Box sx={{ mb: 2 }}>
          <Alert 
            severity="error" 
            icon={<ErrorIcon />}
            sx={{ 
              '& .MuiAlert-message': { 
                display: 'flex', 
                alignItems: 'center' 
              } 
            }}
          >
            {error}
          </Alert>
        </Box>
      )}
      
      {success && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success">
            {success}
          </Alert>
        </Box>
      )}
      
      {/* Form */}
      <Box 
        component="form" 
        onSubmit={handleSubmit}
        noValidate
        {...formProps}
      >
        {/* Form Fields */}
        <Grid container spacing={3}>
          {children}
        </Grid>
        
        {/* Divider */}
        <Divider sx={{ mt: 4, mb: 3 }} />
        
        {/* Actions */}
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}>
          {customActions}
          
          {!hideCancelButton && (
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<CancelIcon />}
              onClick={onCancel}
              disabled={isSubmitting}
              size="large"
            >
              {cancelText}
            </Button>
          )}
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={isSubmitting || disableSubmit}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {finalSubmitText}
          </Button>
        </Box>
      </Box>
    </>
  )
  
  if (showAsCard) {
    return (
      <Card elevation={elevation} {...other}>
        <CardContent sx={{ p: 3 }}>
          {formContent}
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Box {...other}>
      {formContent}
    </Box>
  )
}

export default BaseForm
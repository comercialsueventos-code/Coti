import React from 'react'
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material'
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material'
import ProductBasicInfo from './sections/ProductBasicInfo'
import ProductPricing from './sections/ProductPricing'
import { useProductForm } from './hooks/useProductForm'
import { ProductFormProps } from './types'
import ScrollableDialog from '../common/ScrollableDialog'

const ProductForm: React.FC<ProductFormProps> = ({
  open,
  onClose,
  product,
  mode
}) => {
  const {
    formData,
    errors,
    isLoading,
    handleFormDataChange,
    handleSubmit
  } = useProductForm(product, mode, onClose)

  return (
    <ScrollableDialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {mode === 'create' ? '🛍️ Crear Nuevo Producto' : `✏️ Editar ${product?.name}`}
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <ProductBasicInfo
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />

          {/* Simplified Pricing - Only for quotations */}
          <ProductPricing
            formData={formData}
            onFormDataChange={handleFormDataChange}
            errors={errors}
          />

          {/* Active Status (only in edit mode) */}
          {mode === 'edit' && (
            <>
              <Grid item xs={12}>
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleFormDataChange('is_active', e.target.checked)}
                    />
                  }
                  label="Producto activo"
                />
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CancelIcon />}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={isLoading}
        >
          {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
        </Button>
      </DialogActions>
    </ScrollableDialog>
  )
}

export default ProductForm
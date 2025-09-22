import { useState, useEffect } from 'react'
import { useCreateProduct, useUpdateProduct, useProductUtils, useProductValidation } from '../../../hooks/useProducts'
import { CreateProductData } from '../../../shared/services/ConsolidatedProductsService'
import { Product } from '../../../types'
import { defaultProductFormData as defaultFormData, type ProductFormData } from '@/shared'

export const useProductForm = (
  product?: Product | null,
  mode: 'create' | 'edit' = 'create',
  onClose?: () => void
) => {
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const { getDefaultValues } = useProductUtils()
  const { validateProductData } = useProductValidation()

  // Load product data when opening in edit mode
  useEffect(() => {
    if (mode === 'edit' && product) {
      setFormData({
        category: product.category || '', // Mantener por compatibilidad
        category_id: product.category_id,
        subcategory: product.subcategory || '',
        name: product.name || '',
        description: product.description || '',
        pricing_type: product.pricing_type || 'unit',
        base_price: product.base_price || 0,
        unit: product.unit || 'unidad',
        requires_equipment: product.requires_equipment || false,
        equipment_needed: product.equipment_needed || [],
        preparation_time_minutes: product.preparation_time_minutes || 0,
        shelf_life_hours: product.shelf_life_hours || 0,
        ingredients: product.ingredients || [],
        allergens: product.allergens || [],
        nutritional_info: product.nutritional_info || {},
        supplier_info: product.supplier_info || {},
        cost_price: product.cost_price || 0,
        minimum_order: product.minimum_order || 1,
        is_seasonal: product.is_seasonal || false,
        seasonal_months: product.seasonal_months || [],
        image_url: product.image_url || '',
        is_active: product.is_active ?? true
      })
    } else {
      setFormData(defaultFormData)
    }
    setErrors({})
  }, [mode, product])

  // Apply default values when category is selected
  useEffect(() => {
    if (formData.category && mode === 'create') {
      const defaults = getDefaultValues(formData.category)
      setFormData(prev => ({
        ...prev,
        unit: defaults.unit || prev.unit,
        minimum_order: defaults.minimum_order || prev.minimum_order,
        requires_equipment: defaults.requires_equipment ?? prev.requires_equipment,
        equipment_needed: defaults.equipment_needed || prev.equipment_needed,
        shelf_life_hours: defaults.shelf_life_hours || prev.shelf_life_hours,
        preparation_time_minutes: defaults.preparation_time_minutes || prev.preparation_time_minutes
      }))
    }
  }, [formData.category, mode, getDefaultValues])

  const handleFormDataChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for the field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    try {
      const productData: CreateProductData = {
        category_id: formData.category_id || 0, // Requerido ahora
        subcategory: formData.subcategory || undefined,
        name: formData.name,
        description: formData.description || undefined,
        pricing_type: formData.pricing_type,
        base_price: formData.base_price,
        unit: formData.unit,
        requires_equipment: formData.requires_equipment,
        equipment_needed: formData.equipment_needed.length > 0 ? formData.equipment_needed : undefined,
        preparation_time_minutes: formData.preparation_time_minutes || undefined,
        shelf_life_hours: formData.shelf_life_hours || undefined,
        ingredients: formData.ingredients.length > 0 ? formData.ingredients : undefined,
        allergens: formData.allergens.length > 0 ? formData.allergens : undefined,
        cost_price: formData.cost_price || undefined,
        minimum_order: formData.minimum_order,
        is_seasonal: formData.is_seasonal,
        seasonal_months: formData.seasonal_months.length > 0 ? formData.seasonal_months : undefined,
        image_url: formData.image_url || undefined
      }

      const validation = validateProductData(productData)
      if (!validation.isValid) {
        console.error('Validation errors:', validation.errors)
        return
      }

      if (mode === 'create') {
        await createProduct.mutateAsync(productData)
      } else if (product) {
        await updateProduct.mutateAsync({
          id: product.id,
          data: { ...productData, is_active: formData.is_active }
        })
      }

      onClose?.()
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const isLoading = createProduct.isPending || updateProduct.isPending

  return {
    formData,
    errors,
    isLoading,
    handleFormDataChange,
    handleSubmit
  }
}
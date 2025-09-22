// Custom hook for managing category form state and logic

import { useState, useEffect } from 'react'
import { EmployeeCategory } from '../../../types'
import { 
  useCreateEmployeeCategory, 
  useUpdateEmployeeCategory,
  useEmployeeCategoryUtils
} from '../../../hooks/useEmployeeCategories'
import { FormData, validateCategoryData } from '../utils/categoryFormValidation'
import { DEFAULT_FORM_VALUES } from '@/shared/constants'

interface UseCategoryFormProps {
  open: boolean
  onClose: () => void
  category?: EmployeeCategory | null
  mode: 'create' | 'edit'
}

export const useCategoryForm = ({ open, onClose, category, mode }: UseCategoryFormProps) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_VALUES)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentTab, setCurrentTab] = useState(0)

  const createCategory = useCreateEmployeeCategory()
  const updateCategory = useUpdateEmployeeCategory()
  const { validateCategoryData: utilsValidation } = useEmployeeCategoryUtils()

  // Load category data when opening in edit mode
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && category) {
        setFormData({
          name: category.name,
          category_type: category.category_type,
          description: category.description || '',
          icon: category.icon,
          color: category.color,
          pricing_type: (category as any).pricing_type || 'flexible',
          flat_rate: (category as any).flat_rate || 0,
          default_hourly_rates: category.default_hourly_rates.map(rate => ({
            ...rate,
            id: rate.id || crypto.randomUUID()
          })),
          default_has_arl: category.default_has_arl,
          default_arl_provider: category.default_arl_provider || '',
          default_certifications: [...category.default_certifications],
          requires_certification: category.requires_certification,
          required_certifications: [...category.required_certifications],
          min_experience_months: category.min_experience_months,
          special_skills: [...category.special_skills],
          equipment_access: [...category.equipment_access]
        })
      } else {
        setFormData(DEFAULT_FORM_VALUES)
      }
      setErrors({})
      setCurrentTab(0)
    }
  }, [open, mode, category])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // When changing pricing type, reset rates
    if (field === 'pricing_type') {
      if (value === 'plana') {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          flat_rate: 0,
          default_hourly_rates: []
        }))
      } else {
        setFormData(prev => ({ 
          ...prev, 
          [field]: value,
          flat_rate: 0,
          default_hourly_rates: DEFAULT_FORM_VALUES.default_hourly_rates
        }))
      }
    }
  }

  const handleSubmit = async () => {
    try {
      // Validate data
      const validation = validateCategoryData(formData)
      if (!validation.isValid) {
        const newErrors: Record<string, string> = {}
        validation.errors.forEach((error, index) => {
          newErrors[`error_${index}`] = error
        })
        setErrors(newErrors)
        return
      }

      // Prepare data for submission
      const categoryData: any = {
        name: formData.name,
        category_type: formData.category_type,
        description: formData.description || undefined,
        icon: formData.icon,
        color: formData.color,
        pricing_type: formData.pricing_type,
        flat_rate: formData.pricing_type === 'plana' ? formData.flat_rate : null,
        default_hourly_rates: formData.pricing_type === 'flexible' ? formData.default_hourly_rates : [],
        default_has_arl: formData.default_has_arl,
        default_arl_provider: formData.default_arl_provider || undefined,
        default_certifications: formData.default_certifications,
        requires_certification: formData.requires_certification,
        required_certifications: formData.required_certifications,
        min_experience_months: formData.min_experience_months,
        special_skills: formData.special_skills,
        equipment_access: formData.equipment_access
      }

      if (mode === 'create') {
        await createCategory.mutateAsync(categoryData)
      } else if (category) {
        await updateCategory.mutateAsync({
          id: category.id,
          updateData: categoryData
        })
      }

      onClose()
    } catch (error) {
      console.error('Error saving category:', error)
      setErrors({ submit: 'Error al guardar la categoría' })
    }
  }

  const isLoading = createCategory.isPending || updateCategory.isPending

  return {
    formData,
    errors,
    currentTab,
    setCurrentTab,
    handleInputChange,
    handleSubmit,
    isLoading
  }
}
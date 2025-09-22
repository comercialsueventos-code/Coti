import { useState, useEffect } from 'react'
import { useCreateEmployee, useUpdateEmployee, useEmployeeUtils, useEmployeeValidation } from '../../../hooks/useEmployees'
import { useEmployeeCategory } from '../../../hooks/useEmployeeCategories'
import { CreateEmployeeData } from '../../../services/employees.service'
import { Employee } from '../../../types'
import { EmployeeFormData } from '../types'


const defaultFormData: EmployeeFormData = {
  name: '',
  employee_type: '',
  category_id: null,
  phone: '',
  email: '',
  identification_number: '',
  address: '',
  has_arl: true,
  arl_provider: '',
  certifications: [],
  is_active: true
}

export const useEmployeeForm = (
  open: boolean,
  employee: Employee | null | undefined,
  mode: 'create' | 'edit',
  onClose: () => void
) => {
  const [formData, setFormData] = useState<EmployeeFormData>(defaultFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()
  const { getDefaultValues } = useEmployeeUtils()
  const { validateEmployeeData } = useEmployeeValidation()
  
  // Get category data if category_id is selected
  const { data: selectedCategoryData } = useEmployeeCategory(formData.category_id || 0)

  // Load employee data when opening in edit mode
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && employee) {
        setFormData({
          name: employee.name || '',
          employee_type: employee.employee_type || '',
          category_id: employee.category_id || null,
          phone: employee.phone || '',
          email: employee.email || '',
          identification_number: employee.identification_number || '',
          address: employee.address || '',
          has_arl: employee.has_arl ?? true,
          arl_provider: employee.arl_provider || '',
          certifications: employee.certifications || [],
          is_active: employee.is_active ?? true
        })
      } else {
        setFormData(defaultFormData)
      }
      setErrors({})
    }
  }, [open, mode, employee])

  // Apply category defaults when category is selected
  useEffect(() => {
    if (formData.category_id && selectedCategoryData && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        employee_type: selectedCategoryData.category_type,
        has_arl: selectedCategoryData.default_has_arl,
        arl_provider: selectedCategoryData.default_arl_provider || '',
        certifications: [...selectedCategoryData.default_certifications]
      }))
    }
  }, [formData.category_id, selectedCategoryData, mode])

  const handleFormDataChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSubmit = async () => {
    try {
      // Validate data
      if (!formData.employee_type) {
        setErrors({ employee_type: 'El tipo de empleado es requerido' })
        return
      }

      const employeeData: CreateEmployeeData = {
        name: formData.name,
        employee_type: formData.employee_type,
        category_id: formData.category_id || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        identification_number: formData.identification_number || undefined,
        address: formData.address || undefined,
        has_arl: formData.has_arl,
        arl_provider: formData.arl_provider || undefined,
        certifications: formData.certifications
      }

      const validation = validateEmployeeData(employeeData)
      if (!validation.isValid) {
        console.error('Errores de validación:', validation.errors)
        return
      }

      if (mode === 'create') {
        await createEmployee.mutateAsync(employeeData)
      } else if (employee) {
        await updateEmployee.mutateAsync({
          id: employee.id,
          data: { ...employeeData, is_active: formData.is_active }
        })
      }

      onClose()
    } catch (error) {
      console.error('Error al guardar empleado:', error)
    }
  }

  const isLoading = createEmployee.isPending || updateEmployee.isPending

  return {
    formData,
    errors,
    isLoading,
    handleFormDataChange,
    handleSubmit
  }
}
import { Employee } from '../../../types'

export interface EmployeeFormData {
  name: string
  employee_type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor' | ''
  category_id: number | null
  phone: string
  email: string
  identification_number: string
  address: string
  has_arl: boolean
  arl_provider: string
  certifications: string[]
  is_active: boolean
}

export interface EmployeeFormProps {
  open: boolean
  onClose: () => void
  employee?: Employee | null
  mode: 'create' | 'edit'
}

export interface EmployeeFormSectionProps {
  formData: EmployeeFormData
  onFormDataChange: (field: keyof EmployeeFormData, value: any) => void
  errors?: Record<string, string>
}

export interface EmployeeBasicInfoProps extends EmployeeFormSectionProps {}
export interface EmployeeArlProps extends EmployeeFormSectionProps {}
export interface EmployeeCertificationsProps extends EmployeeFormSectionProps {}
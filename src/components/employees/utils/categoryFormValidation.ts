// Validation utilities for EmployeeCategoryForm

import { HourlyRateRange } from '../../../types'

export interface FormData {
  name: string
  category_type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor' | ''
  description: string
  icon: string
  color: string
  pricing_type: 'plana' | 'flexible'
  flat_rate: number
  default_hourly_rates: HourlyRateRange[]
  default_has_arl: boolean
  default_arl_provider: string
  default_certifications: string[]
  requires_certification: boolean
  required_certifications: string[]
  min_experience_months: number
  special_skills: string[]
  equipment_access: string[]
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const validateCategoryData = (formData: FormData): ValidationResult => {
  const errors: string[] = []

  // Validar nombre
  if (!formData.name.trim()) {
    errors.push('El nombre es requerido')
  } else if (formData.name.trim().length < 2) {
    errors.push('El nombre debe tener al menos 2 caracteres')
  }

  // Validar tipo de categoría
  if (!formData.category_type) {
    errors.push('El tipo de categoría es requerido')
  }

  // Validar color
  if (formData.color && !/^#[0-9A-F]{6}$/i.test(formData.color)) {
    errors.push('El color debe ser un código hexadecimal válido')
  }

  // Validar tarifa según tipo
  if (formData.pricing_type === 'plana') {
    if (!formData.flat_rate || formData.flat_rate <= 0) {
      errors.push('La tarifa plana debe ser mayor a 0')
    }
  } else if (formData.pricing_type === 'flexible') {
    if (!formData.default_hourly_rates || formData.default_hourly_rates.length === 0) {
      errors.push('Debe definir al menos una tarifa por defecto para tarifa flexible')
    } else {
      // Validar rangos de tarifas
      const rateErrors = validateHourlyRates(formData.default_hourly_rates)
      errors.push(...rateErrors)
    }
  }

  // Validar experiencia mínima
  if (formData.min_experience_months < 0) {
    errors.push('Los meses de experiencia no pueden ser negativos')
  }

  // Validar certificaciones requeridas
  if (formData.requires_certification && formData.required_certifications.length === 0) {
    errors.push('Si requiere certificaciones, debe especificar al menos una')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateHourlyRates = (rates: HourlyRateRange[]): string[] => {
  const errors: string[] = []
  const sortedRates = [...rates].sort((a, b) => a.min_hours - b.min_hours)
  
  for (let i = 0; i < sortedRates.length; i++) {
    const current = sortedRates[i]
    const next = sortedRates[i + 1]
    
    // Validar que min_hours sea menor que max_hours
    if (current.max_hours !== null && current.min_hours >= current.max_hours) {
      errors.push(`Rango ${i + 1}: La hora mínima debe ser menor que la máxima`)
    }
    
    // Validar que las tarifas sean positivas
    if (current.rate <= 0) {
      errors.push(`Rango ${i + 1}: La tarifa debe ser mayor a 0`)
    }
    
    // Validar continuidad entre rangos
    if (next) {
      if (current.max_hours === null) {
        errors.push(`Rango ${i + 1}: No puede tener más rangos después de un rango infinito`)
      } else if (current.max_hours !== next.min_hours) {
        if (current.max_hours < next.min_hours) {
          errors.push(`Gap entre rangos: ${current.max_hours}h - ${next.min_hours}h no está cubierto`)
        } else {
          errors.push(`Solapamiento entre rangos: ${current.max_hours}h y ${next.min_hours}h`)
        }
      }
    }
  }
  
  return errors
}

export const formatCategoryType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'operario': 'Operario',
    'chef': 'Chef',
    'mesero': 'Mesero',
    'supervisor': 'Supervisor',
    'conductor': 'Conductor'
  }
  return typeMap[type] || type
}

export const getPricingTypeDisplay = (type: 'plana' | 'flexible'): { label: string; icon: string } => {
  return type === 'plana' 
    ? { label: 'Tarifa Plana', icon: '💰' }
    : { label: 'Tarifa Flexible', icon: '📊' }
}
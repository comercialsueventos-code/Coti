import { supabase } from './supabase'
import { EmployeeCategory, HourlyRateRange } from '../types'

export interface CreateEmployeeCategoryData {
  name: string
  category_type: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'
  description?: string
  icon?: string
  color?: string
  pricing_type: 'plana' | 'flexible'
  flat_rate?: number
  default_hourly_rates: HourlyRateRange[]
  default_has_arl?: boolean
  default_arl_provider?: string
  default_certifications?: string[]
  requires_certification?: boolean
  required_certifications?: string[]
  min_experience_months?: number
  availability_restrictions?: Record<string, any>
  special_skills?: string[]
  equipment_access?: string[]
}

export interface UpdateEmployeeCategoryData {
  name?: string
  description?: string
  icon?: string
  color?: string
  pricing_type?: 'plana' | 'flexible'
  flat_rate?: number
  default_hourly_rates?: HourlyRateRange[]
  default_has_arl?: boolean
  default_arl_provider?: string
  default_certifications?: string[]
  requires_certification?: boolean
  required_certifications?: string[]
  min_experience_months?: number
  availability_restrictions?: Record<string, any>
  special_skills?: string[]
  equipment_access?: string[]
  is_active?: boolean
}

export interface EmployeeCategoryFilters {
  category_type?: string
  is_active?: boolean
  search?: string
}

export class EmployeeCategoriesService {
  /**
   * Get all employee categories with optional filters
   */
  static async getAll(filters?: EmployeeCategoryFilters): Promise<EmployeeCategory[]> {
    let query = supabase
      .from('employee_categories')
      .select(`
        *,
        employee_count:employees(count)
      `)
      .order('name')

    if (filters?.category_type) {
      query = query.eq('category_type', filters.category_type)
    }

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error

    return data || []
  }

  /**
   * Get active employee categories only
   */
  static async getActive(): Promise<EmployeeCategory[]> {
    return this.getAll({ is_active: true })
  }

  /**
   * Get employee categories by type
   */
  static async getByType(category_type: string): Promise<EmployeeCategory[]> {
    return this.getAll({ category_type, is_active: true })
  }

  /**
   * Get a single employee category by ID
   */
  static async getById(id: number): Promise<EmployeeCategory> {
    const { data, error } = await supabase
      .from('employee_categories')
      .select(`
        *,
        employee_count:employees(count)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    if (!data) throw new Error('Employee category not found')

    return data
  }

  /**
   * Create a new employee category
   */
  static async create(categoryData: CreateEmployeeCategoryData): Promise<EmployeeCategory> {
    // Validate the data
    const validation = this.validateCategoryData(categoryData)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    const { data, error } = await supabase
      .from('employee_categories')
      .insert([categoryData])
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Failed to create employee category')

    return data
  }

  /**
   * Update an employee category
   */
  static async update(id: number, updateData: UpdateEmployeeCategoryData): Promise<EmployeeCategory> {
    const { data, error } = await supabase
      .from('employee_categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) throw new Error('Employee category not found')

    return data
  }

  /**
   * Delete an employee category (soft delete by setting is_active = false)
   */
  static async delete(id: number): Promise<void> {
    // Check if there are employees using this category
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('category_id', id)
      .eq('is_active', true)
      .limit(1)

    if (employeeError) throw employeeError

    if (employees && employees.length > 0) {
      throw new Error('Cannot delete category with active employees. Please reassign employees first.')
    }

    const { error } = await supabase
      .from('employee_categories')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }

  /**
   * Duplicate an employee category with a new name
   */
  static async duplicate(id: number, newName: string): Promise<EmployeeCategory> {
    const original = await this.getById(id)
    
    const duplicateData: CreateEmployeeCategoryData = {
      name: newName,
      category_type: original.category_type,
      description: original.description ? `${original.description} (Copia)` : undefined,
      icon: original.icon,
      color: original.color,
      pricing_type: original.pricing_type,
      flat_rate: original.flat_rate,
      default_hourly_rates: original.default_hourly_rates.map(rate => ({
        ...rate,
        id: crypto.randomUUID() // Generate new IDs for the rates
      })),
      default_has_arl: original.default_has_arl,
      default_arl_provider: original.default_arl_provider,
      default_certifications: [...original.default_certifications],
      requires_certification: original.requires_certification,
      required_certifications: [...original.required_certifications],
      min_experience_months: original.min_experience_months,
      availability_restrictions: { ...original.availability_restrictions },
      special_skills: [...original.special_skills],
      equipment_access: [...original.equipment_access]
    }

    return this.create(duplicateData)
  }

  /**
   * Get statistics about employee categories
   */
  static async getStatistics() {
    const { data, error } = await supabase
      .from('employee_categories_summary')
      .select('*')

    if (error) throw error

    const stats = {
      total_categories: data?.length || 0,
      active_categories: data?.filter(cat => cat.is_active).length || 0,
      categories_by_type: {} as Record<string, number>,
      total_employees: data?.reduce((sum, cat) => sum + (cat.employee_count || 0), 0) || 0
    }

    data?.forEach(category => {
      if (category.is_active) {
        stats.categories_by_type[category.category_type] = 
          (stats.categories_by_type[category.category_type] || 0) + 1
      }
    })

    return stats
  }

  /**
   * Validate employee category data
   */
  static validateCategoryData(data: CreateEmployeeCategoryData | UpdateEmployeeCategoryData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if ('name' in data && data.name) {
      if (data.name.trim().length < 2) {
        errors.push('El nombre debe tener al menos 2 caracteres')
      }
      if (data.name.length > 100) {
        errors.push('El nombre no puede exceder 100 caracteres')
      }
    }

    if ('color' in data && data.color) {
      if (!/^#[0-9A-F]{6}$/i.test(data.color)) {
        errors.push('El color debe ser un código hexadecimal válido')
      }
    }

    // Validate pricing type and related fields
    if ('pricing_type' in data && data.pricing_type) {
      if (data.pricing_type === 'plana') {
        if (!('flat_rate' in data) || !data.flat_rate || data.flat_rate <= 0) {
          errors.push('La tarifa plana debe ser mayor a 0')
        }
      } else if (data.pricing_type === 'flexible') {
        if ('default_hourly_rates' in data && data.default_hourly_rates) {
          if (!Array.isArray(data.default_hourly_rates)) {
            errors.push('Las tarifas por defecto deben ser un array')
          } else if (data.default_hourly_rates.length === 0) {
            errors.push('Debe definir al menos una tarifa por defecto para tarifa flexible')
          }
        }
      }
    }

    if ('min_experience_months' in data && data.min_experience_months !== undefined) {
      if (data.min_experience_months < 0) {
        errors.push('Los meses de experiencia no pueden ser negativos')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Get default configurations for creating an employee in this category
   */
  static async getCategoryDefaults(categoryId: number) {
    const category = await this.getById(categoryId)
    
    return {
      pricing_type: category.pricing_type,
      flat_rate: category.flat_rate,
      hourly_rates: category.pricing_type === 'flexible' 
        ? category.default_hourly_rates.map(rate => ({
            ...rate,
            id: crypto.randomUUID() // Generate new IDs for the employee
          }))
        : [],
      has_arl: category.default_has_arl,
      arl_provider: category.default_arl_provider,
      certifications: [...category.default_certifications],
      employee_type: category.category_type
    }
  }
}
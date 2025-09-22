/**
 * Employees Service - Second Migration to BaseEntityService
 * 
 * BEFORE: ~180 lines of duplicated CRUD patterns
 * AFTER: ~40 lines using generic service
 */

import BaseEntityService from './BaseEntityService'
import { Employee, CreateEmployeeData, UpdateEmployeeData, EmployeeFilters } from '../../types'

/**
 * Employees Service using BaseEntityService
 * Eliminates ~140 lines of duplicated CRUD code
 */
export class ConsolidatedEmployeesService extends BaseEntityService<
  Employee, 
  CreateEmployeeData, 
  UpdateEmployeeData, 
  EmployeeFilters
> {
  
  constructor() {
    super({
      tableName: 'employees',
      defaultSelect: `
        *,
        category:employee_categories(
          id, name, icon, color, description, default_hourly_rates
        )
      `,
      defaultOrderBy: 'name',
      filterActiveByDefault: true
    })
  }

  /**
   * Apply employee-specific filters
   */
  protected applyCustomFilters(query: any, filters?: EmployeeFilters): any {
    if (filters?.employee_type) {
      query = query.eq('employee_type', filters.employee_type)
    }
    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters?.has_arl !== undefined) {
      query = query.eq('has_arl', filters.has_arl)
    }
    return query
  }

  /**
   * Process create data with employee-specific defaults
   */
  protected async processCreateData(data: CreateEmployeeData): Promise<any> {
    return {
      ...data,
      has_arl: data.has_arl ?? true, // Default to true
      is_active: true
    }
  }

  /**
   * Get employees by type (convenience method)
   */
  async getByType(employeeType: 'operario' | 'chef' | 'mesero' | 'supervisor' | 'conductor'): Promise<Employee[]> {
    return this.getAll({ employee_type: employeeType })
  }

  /**
   * Get employees by category (convenience method)
   */
  async getByCategory(categoryId: number): Promise<Employee[]> {
    return this.getAll({ category_id: categoryId })
  }

  /**
   * Get employees with ARL (convenience method)
   */
  async getWithARL(): Promise<Employee[]> {
    return this.getAll({ has_arl: true })
  }
}

// Create and export singleton instance
export const consolidatedEmployeesService = new ConsolidatedEmployeesService()

export default ConsolidatedEmployeesService

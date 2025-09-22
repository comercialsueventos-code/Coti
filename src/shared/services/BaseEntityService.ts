/**
 * Base Entity Service - Generic CRUD Operations
 * 
 * Eliminates 33+ duplicated CRUD functions across services
 */

import { supabase } from '../../services/supabase'
import { BaseEntity, CreateData, UpdateData } from '../types'

export interface EntityServiceConfig {
  tableName: string
  defaultSelect?: string
  defaultOrderBy?: string
  defaultOrderDirection?: 'asc' | 'desc'
  filterActiveByDefault?: boolean
}

export interface BaseEntityFilters {
  search?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
  limit?: number
  offset?: number
  order_by?: string
  order_direction?: 'asc' | 'desc'
}

export class BaseEntityService<
  T extends BaseEntity,
  CreateT = CreateData<T>,
  UpdateT = UpdateData<T>,
  FiltersT extends BaseEntityFilters = BaseEntityFilters
> {
  protected config: EntityServiceConfig

  constructor(config: EntityServiceConfig) {
    this.config = {
      defaultSelect: '*',
      defaultOrderBy: 'id',
      defaultOrderDirection: 'asc',
      filterActiveByDefault: true,
      ...config
    }
  }

  async getAll(filters?: FiltersT): Promise<T[]> {
    let query = supabase
      .from(this.config.tableName)
      .select(this.config.defaultSelect!)

    const isActiveFilter = filters?.is_active !== undefined 
      ? filters.is_active 
      : this.config.filterActiveByDefault

    if (isActiveFilter !== undefined) {
      query = query.eq('is_active', isActiveFilter)
    }

    if (filters?.search) {
      query = this.applySearchFilter(query, filters.search)
    }

    query = this.applyCustomFilters(query, filters)

    const orderBy = filters?.order_by || this.config.defaultOrderBy!
    const orderDirection = filters?.order_direction || this.config.defaultOrderDirection!
    query = query.order(orderBy, { ascending: orderDirection === 'asc' })

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async getById(id: number): Promise<T> {
    const { data, error } = await supabase
      .from(this.config.tableName)
      .select(this.config.defaultSelect!)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(entityData: CreateT): Promise<T> {
    const processedData = await this.processCreateData(entityData)

    const { data, error } = await supabase
      .from(this.config.tableName)
      .insert(processedData)
      .select(this.config.defaultSelect!)
      .single()

    if (error) throw error
    return data
  }

  async update(id: number, entityData: UpdateT): Promise<T> {
    const processedData = await this.processUpdateData(id, entityData)

    const { data, error } = await supabase
      .from(this.config.tableName)
      .update(processedData)
      .eq('id', id)
      .select(this.config.defaultSelect!)
      .single()

    if (error) throw error
    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from(this.config.tableName)
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  }

  protected applySearchFilter(query: any, search: string): any {
    return query.ilike('name', `%${search}%`)
  }

  protected applyCustomFilters(query: any, filters?: FiltersT): any {
    return query
  }

  protected async processCreateData(data: CreateT): Promise<any> {
    return { ...data, is_active: true }
  }

  protected async processUpdateData(id: number, data: UpdateT): Promise<any> {
    return data
  }
}

export default BaseEntityService

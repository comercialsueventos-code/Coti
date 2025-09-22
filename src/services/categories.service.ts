import { supabase } from './supabase'

export interface Category {
  id: number
  name: string
  display_name: string
  icon: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CreateCategoryData {
  name: string
  display_name: string
  icon?: string
  description?: string
  sort_order?: number
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  is_active?: boolean
}

export class CategoriesService {
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order, display_name')

    if (error) throw error
    return data || []
  }

  static async getActive(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order, display_name')

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(categoryData: CreateCategoryData): Promise<Category> {
    const processedData = {
      ...categoryData,
      icon: categoryData.icon || '📦',
      sort_order: categoryData.sort_order || 0,
      is_active: true
    }

    const { data, error } = await supabase
      .from('categories')
      .insert(processedData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: number, categoryData: UpdateCategoryData): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...categoryData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<void> {
    // Check if category has products
    const { data: products, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('category_id', id)
      .limit(1)

    if (checkError) throw checkError

    if (products && products.length > 0) {
      throw new Error('No se puede eliminar una categoría que tiene productos asociados')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async reorder(categoryIds: number[]): Promise<void> {
    const updates = categoryIds.map((id, index) => ({
      id,
      sort_order: index + 1
    }))

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id)
    }
  }

  static validateCategoryData(data: CreateCategoryData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.name || data.name.trim().length < 2) {
      errors.push('El nombre debe tener al menos 2 caracteres')
    }

    if (!data.display_name || data.display_name.trim().length < 2) {
      errors.push('El nombre para mostrar debe tener al menos 2 caracteres')
    }

    if (data.sort_order !== undefined && data.sort_order < 0) {
      errors.push('El orden no puede ser negativo')
    }

    // El icono es opcional, solo validar si está presente
    if (data.icon && data.icon.trim().length === 0) {
      errors.push('Si se proporciona un icono, no puede estar vacío')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static async getProductCount(categoryId: number): Promise<number> {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  }

  static async getCategoriesWithProductCount(): Promise<(Category & { product_count: number })[]> {
    const { data, error } = await supabase
      .from('categories')
      .select(`
        *,
        products!inner(count)
      `)
      .eq('is_active', true)
      .order('sort_order, display_name')

    if (error) throw error
    
    // Transform the data to include product count
    const categories = await this.getActive()
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => ({
        ...category,
        product_count: await this.getProductCount(category.id)
      }))
    )

    return categoriesWithCount
  }
}
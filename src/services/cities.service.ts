import { supabase } from './supabase'
import { City, CreateCityData, UpdateCityData, CityFilters } from '../types'

export class CitiesService {
  static async getAll(filters?: CityFilters): Promise<City[]> {
    let query = supabase
      .from('cities')
      .select('*')
      .order('name')

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    if (filters?.department) {
      query = query.eq('department', filters.department)
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%, department.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async getById(id: number): Promise<City> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async create(cityData: CreateCityData): Promise<City> {
    const { data, error } = await supabase
      .from('cities')
      .insert(cityData)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async update(id: number, cityData: UpdateCityData): Promise<City> {
    const { data, error } = await supabase
      .from('cities')
      .update(cityData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('cities')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  static async getActive(): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getByDepartment(department: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .eq('department', department)
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data || []
  }

  static async getDepartments(): Promise<string[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('department')
      .eq('is_active', true)
      .order('department')

    if (error) throw error
    
    // Extract unique departments
    const departments = [...new Set(data?.map(item => item.department) || [])]
    return departments
  }

  static async search(searchTerm: string): Promise<City[]> {
    const { data, error } = await supabase
      .from('cities')
      .select('*')
      .or(`name.ilike.%${searchTerm}%, department.ilike.%${searchTerm}%`)
      .eq('is_active', true)
      .order('name')
      .limit(20)

    if (error) throw error
    return data || []
  }

  static async getWithClientCount(): Promise<Array<City & { client_count: number }>> {
    const { data, error } = await supabase
      .from('cities')
      .select(`
        *,
        clients!inner(count)
      `)
      .eq('is_active', true)
      .order('name')

    if (error) throw error

    // Transform the result to include client_count
    return (data || []).map(city => ({
      ...city,
      client_count: city.clients?.[0]?.count || 0
    }))
  }

  // Validation helpers
  static validateCityName(name: string): boolean {
    if (!name || name.trim().length < 2) {
      return false
    }
    
    // Should only contain letters, spaces, hyphens, and accented characters
    return /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\-']+$/.test(name.trim())
  }

  static validateDepartment(department: string): boolean {
    if (!department || department.trim().length < 2) {
      return false
    }
    
    // Should only contain letters, spaces, periods, and accented characters
    return /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s\.\-']+$/.test(department.trim())
  }

  static validatePostalCode(postalCode: string): boolean {
    if (!postalCode) return true // Optional field
    
    // Colombian postal codes are typically 6 digits
    return /^\d{6}$/.test(postalCode.trim())
  }

  // Business logic helpers
  static getCityDisplayName(city: City): string {
    return city.department && city.department !== city.name 
      ? `${city.name}, ${city.department}`
      : city.name
  }

  static groupCitiesByDepartment(cities: City[]): Record<string, City[]> {
    return cities.reduce((groups, city) => {
      const department = city.department || 'Sin departamento'
      if (!groups[department]) {
        groups[department] = []
      }
      groups[department].push(city)
      return groups
    }, {} as Record<string, City[]>)
  }

  static getDefaultValues(): Partial<CreateCityData> {
    return {
      country: 'Colombia',
      is_active: true
    }
  }

  static formatCityForDropdown(city: City): { value: number; label: string; department: string } {
    return {
      value: city.id,
      label: this.getCityDisplayName(city),
      department: city.department
    }
  }

  static findCityByName(cities: City[], name: string): City | undefined {
    return cities.find(city => 
      city.name.toLowerCase() === name.toLowerCase() ||
      this.getCityDisplayName(city).toLowerCase() === name.toLowerCase()
    )
  }
}
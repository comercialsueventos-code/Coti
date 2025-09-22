import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { EmployeeCategoriesService, CreateEmployeeCategoryData, UpdateEmployeeCategoryData, EmployeeCategoryFilters } from '../services/employeeCategories.service'
import { EmployeeCategory } from '../types'

// Query keys
export const EMPLOYEE_CATEGORIES_QUERY_KEYS = {
  all: ['employee_categories'] as const,
  lists: () => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: EmployeeCategoryFilters) => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.details(), id] as const,
  statistics: () => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.all, 'statistics'] as const,
  defaults: (categoryId: number) => [...EMPLOYEE_CATEGORIES_QUERY_KEYS.all, 'defaults', categoryId] as const
}

/**
 * Hook for fetching all employee categories with optional filters
 */
export function useEmployeeCategories(filters?: EmployeeCategoryFilters) {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.list(filters),
    queryFn: () => EmployeeCategoriesService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching active employee categories only
 */
export function useActiveEmployeeCategories() {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.list({ is_active: true }),
    queryFn: () => EmployeeCategoriesService.getActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching employee categories by type
 */
export function useEmployeeCategoriesByType(category_type: string) {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.list({ category_type, is_active: true }),
    queryFn: () => EmployeeCategoriesService.getByType(category_type),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching a single employee category by ID
 */
export function useEmployeeCategory(id: number) {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.detail(id),
    queryFn: () => EmployeeCategoriesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for fetching employee categories statistics
 */
export function useEmployeeCategoriesStatistics() {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.statistics(),
    queryFn: () => EmployeeCategoriesService.getStatistics(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook for getting category defaults for creating employees
 */
export function useEmployeeCategoryDefaults(categoryId: number) {
  return useQuery({
    queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.defaults(categoryId),
    queryFn: () => EmployeeCategoriesService.getCategoryDefaults(categoryId),
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook for creating a new employee category
 */
export function useCreateEmployeeCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryData: CreateEmployeeCategoryData) => {
      return EmployeeCategoriesService.create(categoryData)
    },
    onSuccess: (newCategory) => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.statistics() })
      
      // Add the new category to cache
      queryClient.setQueryData(EMPLOYEE_CATEGORIES_QUERY_KEYS.detail(newCategory.id), newCategory)
    },
  })
}

/**
 * Hook for updating an employee category
 */
export function useUpdateEmployeeCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: number; updateData: UpdateEmployeeCategoryData }) => {
      return EmployeeCategoriesService.update(id, updateData)
    },
    onSuccess: (updatedCategory) => {
      // Update specific category in cache
      queryClient.setQueryData(EMPLOYEE_CATEGORIES_QUERY_KEYS.detail(updatedCategory.id), updatedCategory)
      
      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for deleting an employee category
 */
export function useDeleteEmployeeCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => EmployeeCategoriesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.statistics() })
    },
  })
}

/**
 * Hook for duplicating an employee category
 */
export function useDuplicateEmployeeCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, newName }: { id: number; newName: string }) => {
      return EmployeeCategoriesService.duplicate(id, newName)
    },
    onSuccess: (newCategory) => {
      // Invalidate and refetch categories list
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_CATEGORIES_QUERY_KEYS.statistics() })
      
      // Add the new category to cache
      queryClient.setQueryData(EMPLOYEE_CATEGORIES_QUERY_KEYS.detail(newCategory.id), newCategory)
    },
  })
}

/**
 * Utility hook for category management operations
 */
export function useEmployeeCategoryUtils() {
  return {
    validateCategoryData: EmployeeCategoriesService.validateCategoryData,
    
    // Helper to get category icon and color
    getCategoryDisplay: (category: EmployeeCategory) => ({
      icon: category.icon || '👤',
      color: category.color || '#2196F3',
      displayName: `${category.icon || '👤'} ${category.name}`
    }),

    // Helper to format category type
    formatCategoryType: (type: string) => {
      const typeMap: Record<string, string> = {
        operario: 'Operario',
        chef: 'Chef',
        mesero: 'Mesero',
        supervisor: 'Supervisor',
        conductor: 'Conductor'
      }
      return typeMap[type] || type
    },

    // Helper to check if category can be deleted
    canDeleteCategory: (category: EmployeeCategory) => {
      const employeeCount = typeof (category as any).employee_count === 'object' 
        ? (category as any).employee_count?.count || 0 
        : (category as any).employee_count || 0
      return category.is_active && employeeCount === 0
    },

    // Helper to get category requirements summary
    getCategoryRequirements: (category: EmployeeCategory) => {
      const requirements = []
      
      if (category.min_experience_months > 0) {
        requirements.push(`${category.min_experience_months} meses de experiencia`)
      }
      
      if (category.requires_certification && category.required_certifications.length > 0) {
        requirements.push(`Certificaciones: ${category.required_certifications.join(', ')}`)
      }
      
      return requirements
    }
  }
}
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CategoriesService, CreateCategoryData, UpdateCategoryData } from '../services/categories.service'
import { ProductCategory } from '../types'

// Query keys
export const CATEGORIES_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORIES_QUERY_KEYS.all, 'list'] as const,
  active: () => [...CATEGORIES_QUERY_KEYS.all, 'active'] as const,
  details: () => [...CATEGORIES_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number) => [...CATEGORIES_QUERY_KEYS.details(), id] as const,
  withProductCount: () => [...CATEGORIES_QUERY_KEYS.all, 'with-product-count'] as const,
}

// Hook para obtener todas las categorías
export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEYS.lists(),
    queryFn: () => CategoriesService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}

// Hook para obtener categorías activas
export function useActiveCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEYS.active(),
    queryFn: () => CategoriesService.getActive(),
    staleTime: 10 * 60 * 1000,
  })
}

// Hook para obtener una categoría por ID
export function useCategory(id: number) {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEYS.detail(id),
    queryFn: () => CategoriesService.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Hook para obtener categorías con conteo de productos
export function useCategoriesWithProductCount() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEYS.withProductCount(),
    queryFn: () => CategoriesService.getCategoriesWithProductCount(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear categoría
export function useCreateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: CreateCategoryData) => CategoriesService.create(data),
    onSuccess: () => {
      // Invalidar todas las queries de categorías
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all })
    },
  })
}

// Hook para actualizar categoría
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) => 
      CategoriesService.update(id, data),
    onSuccess: (updatedCategory) => {
      // Actualizar cache específico
      queryClient.setQueryData(
        CATEGORIES_QUERY_KEYS.detail(updatedCategory.id),
        updatedCategory
      )
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.active() })
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.withProductCount() })
    },
  })
}

// Hook para eliminar categoría
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: number) => CategoriesService.delete(id),
    onSuccess: () => {
      // Invalidar todas las queries de categorías
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all })
    },
  })
}

// Hook para reordenar categorías
export function useReorderCategories() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (categoryIds: number[]) => CategoriesService.reorder(categoryIds),
    onSuccess: () => {
      // Invalidar todas las queries de categorías
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.all })
    },
  })
}

// Hook para validación de categorías
export function useCategoryValidation() {
  return {
    validateCategoryData: CategoriesService.validateCategoryData,
  }
}

// Hook para utilidades de categorías
export function useCategoryUtils() {
  const { data: categories = [] } = useActiveCategories()

  const getCategoryById = (id: number): ProductCategory | undefined => {
    return categories.find(cat => cat.id === id)
  }

  const getCategoryByName = (name: string): ProductCategory | undefined => {
    return categories.find(cat => cat.name === name)
  }

  const getCategoryOptions = () => {
    return categories.map(category => ({
      value: category.id,
      label: category.display_name,
      icon: category.icon
    }))
  }

  const getCategorySelectOptions = () => {
    return categories.map(category => ({
      value: category.id.toString(),
      label: `${category.icon} ${category.display_name}`
    }))
  }

  return {
    getCategoryById,
    getCategoryByName,
    getCategoryOptions,
    getCategorySelectOptions,
    categories
  }
}
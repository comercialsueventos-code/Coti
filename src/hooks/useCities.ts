import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CitiesService } from '../services/cities.service'
import { City, CreateCityData, UpdateCityData, CityFilters } from '../types'

// Query keys
export const citiesQueryKeys = {
  all: ['cities'] as const,
  lists: () => [...citiesQueryKeys.all, 'list'] as const,
  list: (filters?: CityFilters) => [...citiesQueryKeys.lists(), filters] as const,
  details: () => [...citiesQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...citiesQueryKeys.details(), id] as const,
  active: () => [...citiesQueryKeys.all, 'active'] as const,
  departments: () => [...citiesQueryKeys.all, 'departments'] as const,
  byDepartment: (department: string) => [...citiesQueryKeys.all, 'department', department] as const,
  search: (term: string) => [...citiesQueryKeys.all, 'search', term] as const,
  withClientCount: () => [...citiesQueryKeys.all, 'with_client_count'] as const,
}

// Get all cities with optional filters
export const useCities = (filters?: CityFilters) => {
  return useQuery({
    queryKey: citiesQueryKeys.list(filters),
    queryFn: () => CitiesService.getAll(filters),
    staleTime: 1000 * 60 * 30, // 30 minutes - cities don't change often
  })
}

// Get single city by ID
export const useCity = (id: number) => {
  return useQuery({
    queryKey: citiesQueryKeys.detail(id),
    queryFn: () => CitiesService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Get active cities only (most commonly used)
export const useActiveCities = () => {
  return useQuery({
    queryKey: citiesQueryKeys.active(),
    queryFn: () => CitiesService.getActive(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Get departments list for filtering/grouping
export const useDepartments = () => {
  return useQuery({
    queryKey: citiesQueryKeys.departments(),
    queryFn: () => CitiesService.getDepartments(),
    staleTime: 1000 * 60 * 60, // 1 hour - departments change very rarely
  })
}

// Get cities by department
export const useCitiesByDepartment = (department: string) => {
  return useQuery({
    queryKey: citiesQueryKeys.byDepartment(department),
    queryFn: () => CitiesService.getByDepartment(department),
    enabled: !!department,
    staleTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Search cities
export const useCitySearch = (searchTerm: string) => {
  return useQuery({
    queryKey: citiesQueryKeys.search(searchTerm),
    queryFn: () => CitiesService.search(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 60 * 10, // 10 minutes for search results
  })
}

// Get cities with client count (for analytics/reporting)
export const useCitiesWithClientCount = () => {
  return useQuery({
    queryKey: citiesQueryKeys.withClientCount(),
    queryFn: () => CitiesService.getWithClientCount(),
    staleTime: 1000 * 60 * 5, // 5 minutes - this includes dynamic client data
  })
}

// Create city mutation
export const useCreateCity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (cityData: CreateCityData) => CitiesService.create(cityData),
    onSuccess: (newCity) => {
      // Invalidate and refetch cities lists
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.active() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.departments() })
      
      // Add the new city to the cache
      queryClient.setQueryData(citiesQueryKeys.detail(newCity.id), newCity)
      
      // Update department-specific lists
      if (newCity.department) {
        queryClient.invalidateQueries({ 
          queryKey: citiesQueryKeys.byDepartment(newCity.department) 
        })
      }
    },
    onError: (error) => {
      console.error('Error creating city:', error)
    }
  })
}

// Update city mutation
export const useUpdateCity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateCityData }) => 
      CitiesService.update(id, data),
    onSuccess: (updatedCity) => {
      // Update the city in cache
      queryClient.setQueryData(citiesQueryKeys.detail(updatedCity.id), updatedCity)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.active() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.departments() })
      
      // Update department-specific lists
      if (updatedCity.department) {
        queryClient.invalidateQueries({ 
          queryKey: citiesQueryKeys.byDepartment(updatedCity.department) 
        })
      }
    },
    onError: (error) => {
      console.error('Error updating city:', error)
    }
  })
}

// Delete city mutation
export const useDeleteCity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => CitiesService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove city from cache
      queryClient.removeQueries({ queryKey: citiesQueryKeys.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error deleting city:', error)
    }
  })
}

// Deactivate city mutation (soft delete)
export const useDeactivateCity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => CitiesService.update(id, { is_active: false }),
    onSuccess: (updatedCity) => {
      // Update the city in cache
      queryClient.setQueryData(citiesQueryKeys.detail(updatedCity.id), updatedCity)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error deactivating city:', error)
    }
  })
}

// Reactivate city mutation
export const useReactivateCity = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => CitiesService.update(id, { is_active: true }),
    onSuccess: (updatedCity) => {
      // Update the city in cache
      queryClient.setQueryData(citiesQueryKeys.detail(updatedCity.id), updatedCity)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: citiesQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error reactivating city:', error)
    }
  })
}

// Custom hook for city validation
export const useCityValidation = () => {
  const validateCityName = (name: string) => 
    CitiesService.validateCityName(name)
  
  const validateDepartment = (department: string) => 
    CitiesService.validateDepartment(department)
  
  const validatePostalCode = (postalCode: string) => 
    CitiesService.validatePostalCode(postalCode)

  return {
    validateCityName,
    validateDepartment,
    validatePostalCode
  }
}

// Custom hook for city formatting and display
export const useCityFormatting = () => {
  const getCityDisplayName = (city: City) =>
    CitiesService.getCityDisplayName(city)
  
  const groupCitiesByDepartment = (cities: City[]) =>
    CitiesService.groupCitiesByDepartment(cities)
  
  const formatCityForDropdown = (city: City) =>
    CitiesService.formatCityForDropdown(city)
  
  const findCityByName = (cities: City[], name: string) =>
    CitiesService.findCityByName(cities, name)

  return {
    getCityDisplayName,
    groupCitiesByDepartment,
    formatCityForDropdown,
    findCityByName
  }
}

// Custom hook for dropdown data - most commonly used for forms
export const useCityDropdownData = () => {
  const { data: cities = [], isLoading, error } = useActiveCities()
  const { groupCitiesByDepartment, formatCityForDropdown } = useCityFormatting()

  const dropdownOptions = cities.map(formatCityForDropdown)
  const groupedCities = groupCitiesByDepartment(cities)
  const departments = Object.keys(groupedCities).sort()

  return {
    cities,
    dropdownOptions,
    groupedCities,
    departments,
    isLoading,
    error
  }
}

// Custom hook for city business logic
export const useCityBusinessLogic = () => {
  const getDefaultValues = () =>
    CitiesService.getDefaultValues()

  return {
    getDefaultValues
  }
}
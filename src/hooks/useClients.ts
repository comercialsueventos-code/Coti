import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ClientsService } from '../services/clients.service'
import { Client, CreateClientData, UpdateClientData, ClientFilters } from '../types'

// Query keys
export const clientsQueryKeys = {
  all: ['clients'] as const,
  lists: () => [...clientsQueryKeys.all, 'list'] as const,
  list: (filters?: ClientFilters) => [...clientsQueryKeys.lists(), filters] as const,
  details: () => [...clientsQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...clientsQueryKeys.details(), id] as const,
  search: (term: string) => [...clientsQueryKeys.all, 'search', term] as const,
  byType: (type: 'social' | 'corporativo') => [...clientsQueryKeys.all, 'type', type] as const,
}

// Get all clients with optional filters
export const useClients = (filters?: ClientFilters) => {
  return useQuery({
    queryKey: clientsQueryKeys.list(filters),
    queryFn: () => ClientsService.getAll(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get single client by ID
export const useClient = (id: number) => {
  return useQuery({
    queryKey: clientsQueryKeys.detail(id),
    queryFn: () => ClientsService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get active clients only
export const useActiveClients = () => {
  return useQuery({
    queryKey: clientsQueryKeys.list({ is_active: true }),
    queryFn: () => ClientsService.getActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get clients by type
export const useClientsByType = (type: 'social' | 'corporativo') => {
  return useQuery({
    queryKey: clientsQueryKeys.byType(type),
    queryFn: () => ClientsService.getByType(type),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Search clients
export const useClientSearch = (searchTerm: string) => {
  return useQuery({
    queryKey: clientsQueryKeys.search(searchTerm),
    queryFn: () => ClientsService.search(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 1000 * 30, // 30 seconds for search results
  })
}

// Create client mutation
export const useCreateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (clientData: CreateClientData) => ClientsService.create(clientData),
    onSuccess: (newClient) => {
      // Invalidate and refetch clients list
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists() })
      
      // Add the new client to the cache
      queryClient.setQueryData(clientsQueryKeys.detail(newClient.id), newClient)
      
      // Update relevant filtered lists
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.byType(newClient.type) })
    },
    onError: (error) => {
      console.error('Error creating client:', error)
    }
  })
}

// Update client mutation
export const useUpdateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateClientData }) => 
      ClientsService.update(id, data),
    onSuccess: (updatedClient) => {
      // Update the client in cache
      queryClient.setQueryData(clientsQueryKeys.detail(updatedClient.id), updatedClient)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.byType(updatedClient.type) })
    },
    onError: (error) => {
      console.error('Error updating client:', error)
    }
  })
}

// Delete client mutation
export const useDeleteClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ClientsService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove client from cache
      queryClient.removeQueries({ queryKey: clientsQueryKeys.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists() })
    },
    onError: (error) => {
      console.error('Error deleting client:', error)
    }
  })
}

// Soft delete (deactivate) client mutation
export const useDeactivateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ClientsService.update(id, { is_active: false }),
    onSuccess: (updatedClient) => {
      // Update the client in cache
      queryClient.setQueryData(clientsQueryKeys.detail(updatedClient.id), updatedClient)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists() })
    },
    onError: (error) => {
      console.error('Error deactivating client:', error)
    }
  })
}

// Reactivate client mutation
export const useReactivateClient = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => ClientsService.update(id, { is_active: true }),
    onSuccess: (updatedClient) => {
      // Update the client in cache
      queryClient.setQueryData(clientsQueryKeys.detail(updatedClient.id), updatedClient)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: clientsQueryKeys.lists() })
    },
    onError: (error) => {
      console.error('Error reactivating client:', error)
    }
  })
}

// Custom hook for client validation
export const useClientValidation = () => {
  const validateTaxId = (taxId: string, clientType: 'social' | 'corporativo') => 
    ClientsService.validateTaxId(taxId, clientType)
  
  const validateEmail = (email: string) => 
    ClientsService.validateEmail(email)
  
  const validatePhone = (phone: string) => 
    ClientsService.validatePhone(phone)

  return {
    validateTaxId,
    validateEmail,
    validatePhone
  }
}

// Custom hook for client business logic
export const useClientBusinessLogic = () => {
  const calculatePaymentTerms = (client: Client) =>
    ClientsService.calculatePaymentTerms(client)
  
  const getDefaultValues = (clientType: 'social' | 'corporativo') =>
    ClientsService.getDefaultValues(clientType)

  return {
    calculatePaymentTerms,
    getDefaultValues
  }
}
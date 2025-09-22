import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TransportService } from '../services/transport.service'
import { TransportZone, CreateTransportZoneData, UpdateTransportZoneData, TransportFilters } from '../types'

// Query keys
export const transportQueryKeys = {
  all: ['transport_zones'] as const,
  lists: () => [...transportQueryKeys.all, 'list'] as const,
  list: (filters?: TransportFilters) => [...transportQueryKeys.lists(), filters] as const,
  details: () => [...transportQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...transportQueryKeys.details(), id] as const,
  active: () => [...transportQueryKeys.all, 'active'] as const,
  costs: () => [...transportQueryKeys.all, 'costs'] as const,
  calculate: (zoneId: number, equipment: boolean, count: number) => 
    [...transportQueryKeys.costs(), zoneId, equipment, count] as const,
}

// Get all transport zones
export const useTransportZones = (filters?: TransportFilters) => {
  return useQuery({
    queryKey: transportQueryKeys.list(filters),
    queryFn: () => TransportService.getAll(filters),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get single transport zone
export const useTransportZone = (id: number) => {
  return useQuery({
    queryKey: transportQueryKeys.detail(id),
    queryFn: () => TransportService.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get active transport zones only
export const useActiveTransportZones = () => {
  return useQuery({
    queryKey: transportQueryKeys.active(),
    queryFn: () => TransportService.getActive(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Calculate transport cost
export const useTransportCost = (
  zoneId: number, 
  requiresEquipment: boolean = false, 
  equipmentCount: number = 1
) => {
  return useQuery({
    queryKey: transportQueryKeys.calculate(zoneId, requiresEquipment, equipmentCount),
    queryFn: () => TransportService.calculateCost(zoneId, requiresEquipment, equipmentCount),
    enabled: !!zoneId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Get zones ordered by distance
export const useTransportZonesByDistance = () => {
  return useQuery({
    queryKey: [...transportQueryKeys.all, 'by_distance'],
    queryFn: () => TransportService.getZonesByDistance(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get zones ordered by cost
export const useTransportZonesByCost = () => {
  return useQuery({
    queryKey: [...transportQueryKeys.all, 'by_cost'],
    queryFn: () => TransportService.getZonesByCost(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Create transport zone mutation
export const useCreateTransportZone = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (zoneData: CreateTransportZoneData) => TransportService.create(zoneData),
    onSuccess: (newZone) => {
      // Invalidate and refetch lists
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.active() })
      
      // Add the new zone to cache
      queryClient.setQueryData(transportQueryKeys.detail(newZone.id), newZone)
    },
    onError: (error) => {
      console.error('Error creating transport zone:', error)
    }
  })
}

// Update transport zone mutation
export const useUpdateTransportZone = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: UpdateTransportZoneData }) => 
      TransportService.update(id, data),
    onSuccess: (updatedZone) => {
      // Update the zone in cache
      queryClient.setQueryData(transportQueryKeys.detail(updatedZone.id), updatedZone)
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error updating transport zone:', error)
    }
  })
}

// Delete transport zone mutation
export const useDeleteTransportZone = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => TransportService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove zone from cache
      queryClient.removeQueries({ queryKey: transportQueryKeys.detail(deletedId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error deleting transport zone:', error)
    }
  })
}

// Deactivate transport zone mutation
export const useDeactivateTransportZone = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => TransportService.update(id, { is_active: false }),
    onSuccess: (updatedZone) => {
      // Update the zone in cache
      queryClient.setQueryData(transportQueryKeys.detail(updatedZone.id), updatedZone)
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: transportQueryKeys.active() })
    },
    onError: (error) => {
      console.error('Error deactivating transport zone:', error)
    }
  })
}

// Custom hook for transport validation
export const useTransportValidation = () => {
  const validateZoneData = (data: CreateTransportZoneData) => 
    TransportService.validateZoneData(data)

  return {
    validateZoneData
  }
}

// Custom hook for transport calculations
export const useTransportCalculations = () => {
  const calculateDistanceBasedCost = (zone: TransportZone, multiplier: number) =>
    TransportService.calculateDistanceBasedCost(zone, multiplier)
  
  const estimateTimeWithTraffic = (baseTime: number, factor?: number) =>
    TransportService.estimateTimeWithTraffic(baseTime, factor)
  
  const formatTravelTime = (minutes: number) =>
    TransportService.formatTravelTime(minutes)
  
  const findOptimalZone = (zones: TransportZone[], maxBudget?: number, maxTime?: number) =>
    TransportService.findOptimalZone(zones, maxBudget, maxTime)

  return {
    calculateDistanceBasedCost,
    estimateTimeWithTraffic,
    formatTravelTime,
    findOptimalZone
  }
}

// Custom hook for transport reports
export const useTransportReport = () => {
  const { data: zones = [] } = useTransportZones()

  const report = TransportService.generateCostReport(zones)

  return {
    report,
    isLoading: false, // zones already loaded
    refetch: () => {
      // This will trigger a refetch of zones which will update the report
    }
  }
}

// Real-time transport cost calculator
export const useTransportCostCalculator = () => {
  const { data: zones = [] } = useActiveTransportZones()

  const calculateCostForZone = (
    zoneId: number,
    requiresEquipment: boolean = false,
    equipmentCount: number = 1
  ) => {
    const zone = zones.find(z => z.id === zoneId)
    if (!zone) return null

    const baseCost = zone.base_cost
    const equipmentCost = requiresEquipment 
      ? zone.additional_equipment_cost * equipmentCount 
      : 0
    const totalCost = baseCost + equipmentCost

    return {
      zone,
      base_cost: baseCost,
      equipment_cost: equipmentCost,
      total_cost: totalCost,
      formatted_total: new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
      }).format(totalCost)
    }
  }

  return {
    zones,
    calculateCostForZone,
    isLoading: false
  }
}
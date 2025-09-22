/**
 * Unit Tests for Transport Manual Distribution Functions
 * TMD-CONSOLIDATED story - QA testing requirement
 * 
 * Tests the transport calculation functions with manual and automatic distribution
 */

import { PricingService, TransportCalculationInput, TransportAllocation } from '../pricing.service'

describe('PricingService Transport Distribution', () => {
  
  // Mock transport zone data
  const mockTransportZone = {
    id: 1,
    name: 'Zona Norte',
    base_cost: 50000,
    additional_equipment_cost: 25000,
    estimated_travel_time_minutes: 45
  }

  describe('calculateManualTransportDistribution', () => {
    
    it('should calculate manual distribution correctly with basic input', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 3,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 50000 // 1 * 50000 (base cost)
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 2,
        cost: 100000 // 2 * 50000 (base cost)
      })
    })

    it('should include equipment cost when include_equipment is true', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: true,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 75000 // 1 * (50000 + 25000)
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 1,
        cost: 75000 // 1 * (50000 + 25000)
      })
    })

    it('should handle zero quantity allocations', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 0 },
          { productId: 2, quantity: 2 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 0,
        cost: 0
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 2,
        cost: 100000
      })
    })

    it('should handle empty allocations array', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: []
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toEqual([])
    })

    it('should handle missing additional_equipment_cost in zone', () => {
      const zoneWithoutEquipmentCost = {
        ...mockTransportZone,
        additional_equipment_cost: undefined
      }

      const input: TransportCalculationInput = {
        zone: zoneWithoutEquipmentCost,
        transport_count: 1,
        include_equipment: true,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 50000 // base_cost + 0 (missing equipment cost)
      })
    })
  })

  describe('calculateAutomaticTransportDistribution', () => {
    
    it('should distribute evenly among selected products', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 4,
        include_equipment: false,
        selected_product_ids: [1, 2]
      }

      const result = PricingService.calculateAutomaticTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 2, // 4 transports / 2 products
        cost: 100000 // (4 * 50000) / 2 products
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 2,
        cost: 100000
      })
    })

    it('should include equipment cost in automatic distribution', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: true,
        selected_product_ids: [1]
      }

      const result = PricingService.calculateAutomaticTransportDistribution(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 2,
        cost: 150000 // 2 * (50000 + 25000)
      })
    })

    it('should return single entry when no products selected', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 3,
        include_equipment: false,
        selected_product_ids: []
      }

      const result = PricingService.calculateAutomaticTransportDistribution(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        product_id: null,
        quantity: 3,
        cost: 150000 // 3 * 50000
      })
    })

    it('should handle undefined selected_product_ids', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false
        // selected_product_ids is undefined
      }

      const result = PricingService.calculateAutomaticTransportDistribution(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        product_id: null,
        quantity: 2,
        cost: 100000
      })
    })

    it('should handle fractional distribution correctly', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 3,
        include_equipment: false,
        selected_product_ids: [1, 2]
      }

      const result = PricingService.calculateAutomaticTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1.5, // 3 / 2
        cost: 75000 // 150000 / 2
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 1.5,
        cost: 75000
      })
    })
  })

  describe('calculateTransportCosts', () => {
    
    it('should use manual distribution when use_flexible_transport is true', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 1 }
        ]
      }

      const result = PricingService.calculateTransportCosts(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 50000
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 1,
        cost: 50000
      })
    })

    it('should use automatic distribution when use_flexible_transport is false', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: false,
        selected_product_ids: [1, 2]
      }

      const result = PricingService.calculateTransportCosts(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 50000
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 1,
        cost: 50000
      })
    })

    it('should use automatic distribution when transport_allocations is empty', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [],
        selected_product_ids: [1]
      }

      const result = PricingService.calculateTransportCosts(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 2,
        cost: 100000
      })
    })

    it('should default to automatic when use_flexible_transport is undefined', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 1,
        include_equipment: false,
        selected_product_ids: [1]
      }

      const result = PricingService.calculateTransportCosts(input)

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 50000
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    
    it('should handle zone with zero base cost', () => {
      const zeroBaseZone = {
        ...mockTransportZone,
        base_cost: 0
      }

      const input: TransportCalculationInput = {
        zone: zeroBaseZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 2 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 2,
        cost: 0
      })
    })

    it('should handle very large quantities', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 1000,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1000 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1000,
        cost: 50000000 // 1000 * 50000
      })
    })

    it('should handle decimal quantities in manual distribution', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 2,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 0.5 },
          { productId: 2, quantity: 1.5 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 0.5,
        cost: 25000 // 0.5 * 50000
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 1.5,
        cost: 75000 // 1.5 * 50000
      })
    })

    it('should handle negative productId gracefully', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 1,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: -1, quantity: 1 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: -1,
        quantity: 1,
        cost: 50000
      })
    })
  })

  describe('Real-world Scenarios', () => {
    
    it('should handle typical wedding scenario with multiple products', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 3,
        include_equipment: true,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 }, // Cake transport
          { productId: 2, quantity: 1 }, // Drinks transport
          { productId: 3, quantity: 1 }  // Decorations transport
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toHaveLength(3)
      
      // Each should get equal distribution with equipment
      result.forEach(allocation => {
        expect(allocation.quantity).toBe(1)
        expect(allocation.cost).toBe(75000) // base_cost + equipment_cost
      })
    })

    it('should handle corporate event with uneven distribution', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 5,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 3 }, // Main catering needs 3 transports
          { productId: 2, quantity: 2 }  // Coffee break needs 2 transports
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 3,
        cost: 150000
      })
      expect(result[1]).toEqual({
        product_id: 2,
        quantity: 2,
        cost: 100000
      })
    })

    it('should validate total allocation matches transport count', () => {
      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 4,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 2 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)
      
      const totalAllocated = result.reduce((sum, allocation) => sum + allocation.quantity, 0)
      expect(totalAllocated).toBe(4)
      
      const totalCost = result.reduce((sum, allocation) => sum + allocation.cost, 0)
      expect(totalCost).toBe(200000) // 4 * 50000
    })
  })

  describe('Performance Tests', () => {
    
    it('should handle large number of allocations efficiently', () => {
      const allocations: TransportAllocation[] = []
      for (let i = 1; i <= 100; i++) {
        allocations.push({ productId: i, quantity: 1 })
      }

      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 100,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: allocations
      }

      const start = performance.now()
      const result = PricingService.calculateManualTransportDistribution(input)
      const duration = performance.now() - start

      expect(result).toHaveLength(100)
      expect(duration).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should handle large automatic distribution efficiently', () => {
      const productIds = Array.from({ length: 50 }, (_, i) => i + 1)

      const input: TransportCalculationInput = {
        zone: mockTransportZone,
        transport_count: 100,
        include_equipment: true,
        selected_product_ids: productIds
      }

      const start = performance.now()
      const result = PricingService.calculateAutomaticTransportDistribution(input)
      const duration = performance.now() - start

      expect(result).toHaveLength(50)
      expect(duration).toBeLessThan(50) // Should complete in under 50ms
    })
  })

  describe('Input Validation Edge Cases', () => {
    
    it('should handle missing zone gracefully', () => {
      const input: TransportCalculationInput = {
        zone: null as any,
        transport_count: 1,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 }
        ]
      }

      expect(() => {
        PricingService.calculateManualTransportDistribution(input)
      }).toThrow()
    })

    it('should handle zone without base_cost', () => {
      const incompleteZone = {
        id: 1,
        name: 'Test Zone'
        // missing base_cost
      }

      const input: TransportCalculationInput = {
        zone: incompleteZone as any,
        transport_count: 1,
        include_equipment: false,
        use_flexible_transport: true,
        transport_allocations: [
          { productId: 1, quantity: 1 }
        ]
      }

      const result = PricingService.calculateManualTransportDistribution(input)

      expect(result[0]).toEqual({
        product_id: 1,
        quantity: 1,
        cost: 0 // should default to 0 when base_cost is missing
      })
    })
  })
})
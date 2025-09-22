# Story 3: Calculation Logic - Custom Transport Distribution
**Epic:** Transport Manual Distribution  
**Story ID:** TMD-003  
**Tipo:** Backend Logic  
**Prioridad:** High  

## User Story
**Como** sistema de pricing  
**Quiero** calcular costos de transporte usando cantidades específicas por producto  
**Para** generar cotizaciones precisas con distribución manual de transportes

## Background
El sistema actual distribuye costos equitativamente: `total_transport_cost / product_count`.  
Se necesita calcular usando asignaciones específicas: `(base_cost + equipment_cost) * quantity_assigned_per_product`.

## Acceptance Criteria

### ✅ AC1: Cálculo con Distribución Manual
**Dado** que use_flexible_transport = true y tengo transport_allocations  
**Cuando** calculo costos de transporte  
**Entonces** cada producto debe recibir:
- `cost_per_transport = (zone.base_cost + equipment_cost)`
- `product_transport_cost = cost_per_transport * allocation.quantity`
- Suma total debe igualar transport_count * cost_per_transport

### ✅ AC2: Fallback a Distribución Legacy  
**Dado** que use_flexible_transport = false o transport_allocations está vacío  
**Cuando** calculo costos de transporte  
**Entonces** el sistema debe:
- Usar lógica existente de distribución equitativa
- Mantener backward compatibility completa
- No romper cotizaciones existentes

### ✅ AC3: Validación Pre-cálculo
**Dado** que tengo transport_allocations configuradas  
**Cuando** inicio el cálculo  
**Entonces** el sistema debe validar:
- Suma de quantities = transport_count
- Todos los productIds existen en la cotización
- Ninguna quantity es negativa o cero
- Rechazar cálculo si validaciones fallan

### ✅ AC4: PDF Generation Actualizado
**Dado** que genero PDF de cotización con distribución manual  
**Cuando** se calcula el breakdown por producto  
**Entonces** cada producto debe mostrar:
- Su costo de transporte específico
- Cantidad de transportes asignados
- Costo unitario de transporte claramente desglosado

### ✅ AC5: Logging y Debugging
**Dado** que ejecuto cálculos de transporte  
**Cuando** hay distribución manual activa  
**Entonces** el sistema debe loggear:
- Modo de distribución utilizado (manual vs automático)
- Asignaciones específicas por producto
- Resultados de cálculo detallados
- Cualquier error o inconsistencia

### ✅ AC6: Performance Optimization
**Dado** que tengo cotizaciones con múltiples productos  
**Cuando** calculo con distribución manual  
**Entonces** el sistema debe:
- Procesar cálculos eficientemente (< 100ms)
- No degradar performance vs. modo automático
- Manejar hasta 50 productos sin degradación

## Technical Implementation

### Service Layer Updates

#### pricing.service.ts - New Functions
```typescript
interface TransportCalculationInput {
  zone: TransportZone;
  transport_count: number;
  include_equipment: boolean;
  use_flexible_transport: boolean;
  transport_allocations?: TransportAllocation[];
  product_ids?: number[]; // legacy fallback
}

interface TransportCalculationResult {
  mode: 'manual' | 'automatic';
  total_cost: number;
  cost_per_transport: number;
  allocations: {
    product_id: number;
    quantity: number;
    cost: number;
  }[];
  validation_errors?: string[];
}

export const calculateTransportCosts = (
  input: TransportCalculationInput
): TransportCalculationResult => {
  // Implementation details in tasks
}
```

#### PricingCalculationSummary.tsx - Updated Logic
```typescript
// Replace existing transport distribution logic
if (formData.useFlexibleTransport && formData.transportAllocations.length > 0) {
  // Use manual allocations
  result = calculateTransportCosts({
    zone: formData.selectedTransportZone,
    transport_count: formData.transportCount,
    include_equipment: formData.includeEquipmentTransport,
    use_flexible_transport: true,
    transport_allocations: formData.transportAllocations
  });
} else {
  // Use legacy automatic distribution
  result = calculateTransportCosts({
    zone: formData.selectedTransportZone,
    transport_count: formData.transportCount,
    include_equipment: formData.includeEquipmentTransport,
    use_flexible_transport: false,
    product_ids: formData.transportProductIds
  });
}
```

## Calculation Logic Details

### Manual Distribution Algorithm
```typescript
function calculateManualTransportCosts(
  zone: TransportZone,
  allocations: TransportAllocation[],
  includeEquipment: boolean
): TransportCalculationResult {
  
  // Step 1: Calculate cost per transport unit
  const baseCost = zone.base_cost;
  const equipmentCost = includeEquipment ? zone.additional_equipment_cost : 0;
  const costPerTransport = baseCost + equipmentCost;
  
  // Step 2: Validate allocations
  const totalQuantity = allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
  if (totalQuantity !== expectedTransportCount) {
    throw new Error(`Transport allocation mismatch: ${totalQuantity} vs ${expectedTransportCount}`);
  }
  
  // Step 3: Calculate cost per product
  const productCosts = allocations.map(alloc => ({
    product_id: alloc.productId,
    quantity: alloc.quantity,
    cost: alloc.quantity * costPerTransport
  }));
  
  // Step 4: Return structured result
  return {
    mode: 'manual',
    total_cost: totalQuantity * costPerTransport,
    cost_per_transport: costPerTransport,
    allocations: productCosts
  };
}
```

### Validation Functions
```typescript
function validateTransportAllocations(
  allocations: TransportAllocation[],
  expectedTotal: number,
  availableProductIds: number[]
): ValidationResult {
  
  const errors: string[] = [];
  
  // Check sum equals expected
  const sum = allocations.reduce((total, alloc) => total + alloc.quantity, 0);
  if (sum !== expectedTotal) {
    errors.push(`Allocation sum ${sum} does not equal expected total ${expectedTotal}`);
  }
  
  // Check all products exist
  allocations.forEach(alloc => {
    if (!availableProductIds.includes(alloc.productId)) {
      errors.push(`Product ID ${alloc.productId} not found in quote`);
    }
    if (alloc.quantity <= 0) {
      errors.push(`Invalid quantity ${alloc.quantity} for product ${alloc.productId}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Technical Tasks

### Task 3.1: Implement Core Calculation Logic
- [ ] Create `calculateTransportCosts()` function in pricing.service.ts
- [ ] Implement manual distribution algorithm
- [ ] Implement validation functions
- [ ] Add comprehensive error handling

### Task 3.2: Update PricingCalculationSummary
- [ ] Replace existing transport distribution logic
- [ ] Add mode detection (manual vs automatic)
- [ ] Update PDF generation with new cost breakdown
- [ ] Maintain backward compatibility

### Task 3.3: Database Integration
- [ ] Update quote save/load logic for new fields
- [ ] Ensure transport_allocations and use_flexible_transport are persisted
- [ ] Handle migration of existing quotes gracefully

### Task 3.4: Add Comprehensive Logging
```typescript
console.log('🚚 Transport Calculation:', {
  mode: result.mode,
  zone: zone.name,
  transport_count: input.transport_count,
  allocations: result.allocations,
  total_cost: result.total_cost
});
```

### Task 3.5: Performance Testing
- [ ] Benchmark calculation time with different product counts
- [ ] Optimize for large datasets (50+ products)
- [ ] Add performance monitoring

### Task 3.6: Unit Testing
```typescript
describe('Transport Cost Calculation', () => {
  it('should calculate manual distribution correctly', () => {
    const input = {
      zone: mockTransportZone,
      transport_count: 20,
      include_equipment: false,
      use_flexible_transport: true,
      transport_allocations: [
        { productId: 1, quantity: 15 },
        { productId: 2, quantity: 5 }
      ]
    };
    
    const result = calculateTransportCosts(input);
    
    expect(result.mode).toBe('manual');
    expect(result.total_cost).toBe(20 * mockTransportZone.base_cost);
    expect(result.allocations[0].cost).toBe(15 * mockTransportZone.base_cost);
    expect(result.allocations[1].cost).toBe(5 * mockTransportZone.base_cost);
  });
  
  it('should fallback to automatic distribution when manual is disabled', () => {
    // Test automatic mode fallback
  });
  
  it('should validate allocations and throw errors for invalid data', () => {
    // Test validation logic
  });
});
```

## Edge Cases to Handle

### Case 1: Empty Allocations with Manual Mode
```typescript
if (use_flexible_transport && (!transport_allocations || transport_allocations.length === 0)) {
  // Auto-fallback to equitable distribution
  return calculateAutomaticDistribution(input);
}
```

### Case 2: Allocation Sum Mismatch
```typescript
const allocationSum = transport_allocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
if (allocationSum !== transport_count) {
  throw new ValidationError(`Transport allocation sum ${allocationSum} does not match transport count ${transport_count}`);
}
```

### Case 3: Products Not Found
```typescript
const invalidProductIds = transport_allocations
  .map(alloc => alloc.productId)
  .filter(id => !validProductIds.includes(id));
  
if (invalidProductIds.length > 0) {
  throw new ValidationError(`Invalid product IDs: ${invalidProductIds.join(', ')}`);
}
```

### Case 4: Legacy Quote Compatibility
```typescript
// For quotes without use_flexible_transport field
if (use_flexible_transport === undefined || use_flexible_transport === null) {
  return calculateLegacyDistribution(input);
}
```

## Definition of Done
- [ ] Manual transport cost calculation implemented and tested
- [ ] Automatic distribution fallback working
- [ ] Validation logic prevents invalid configurations
- [ ] PDF generation updated with new cost breakdown
- [ ] Comprehensive logging implemented
- [ ] Performance benchmarks meet requirements (< 100ms)
- [ ] Unit tests cover all scenarios and edge cases
- [ ] Integration tests with UI components passing
- [ ] Legacy quote compatibility maintained
- [ ] Code review and QA completed

## Files to Create/Modify

### Modified Files
- `src/services/pricing.service.ts` - Core calculation logic
- `src/components/pricing/sections/PricingCalculationSummary.tsx` - Updated cost calculation
- `src/hooks/usePricing.ts` - Integration with new calculation
- `src/components/pricing/hooks/usePricingForm.ts` - Data persistence

### New Test Files
- `tests/services/transport-calculation.test.ts`
- `tests/integration/manual-transport-flow.test.ts`

## Dependencies
- ✅ Story 1 (Database Validation) completed
- ✅ Story 2 (UI Implementation) completed
- Existing pricing.service.ts architecture
- PDF generation service

## Estimation
**Story Points:** 13  
**Time Estimate:** 16-20 hours  

## Risk Mitigation
- **Risk**: Breaking existing calculations
  **Mitigation**: Comprehensive backward compatibility testing
  
- **Risk**: Performance degradation
  **Mitigation**: Benchmark testing and optimization
  
- **Risk**: Data inconsistency
  **Mitigation**: Robust validation and error handling

## Success Metrics
- All existing quotes continue to calculate correctly
- New manual distribution calculations are mathematically accurate
- Performance remains under 100ms for typical use cases
- Zero data corruption in production
- User can successfully use manual distribution end-to-end
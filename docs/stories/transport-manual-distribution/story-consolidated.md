# Transport Manual Distribution - Brownfield Story (CONSOLIDATED)

**Story ID:** TMD-CONSOLIDATED  
**Priority:** High  
**Story Points:** 8  
**Estimated Time:** 6-8 hours  
**Status:** Ready for Development  

---

## User Story

**Como** usuario del sistema de pricing,  
**Quiero** distribuir manualmente los transportes entre productos específicos,  
**Para que** pueda asignar cantidades precisas (ej: 15 a producto A, 5 a producto B) en lugar de división automática equitativa.

---

## Story Context

**Existing System Integration:**
- **Integrates with:** `PricingClientSelection.tsx` (sección de transporte existente)
- **Technology:** React + TypeScript + Material-UI + Supabase  
- **Follows pattern:** Toggle components con conditional rendering + validation hooks
- **Touch points:** `formData.transportProductIds`, `pricing.service.ts`, DB `transport_allocations`

---

## Acceptance Criteria

### ✅ Functional Requirements

1. **Toggle Control:** Usuario puede alternar entre "Distribución Automática" y "Distribución Manual"

2. **Manual Controls:** En modo manual, mostrar input numérico por cada producto seleccionado

3. **Real-time Validation:** Suma de cantidades manuales debe igualar `transportCount` total

4. **Cost Calculation:** Sistema calcula costo usando cantidades específicas en lugar de división equitativa

### ✅ Integration Requirements

5. **Existing Functionality:** Distribución automática existente continúa funcionando sin cambios

6. **Pattern Consistency:** Nuevos controles siguen patrones Material-UI existentes

7. **Service Integration:** `pricing.service.ts` mantiene comportamiento actual como fallback

### ✅ Quality Requirements

8. **Testing:** Cambios cubiertos con tests unitarios apropiados  

9. **Documentation:** Comments añadidos en funciones de cálculo modificadas

10. **Regression:** Zero regresión en funcionalidad de transporte existente verificada

---

## Technical Implementation

### Files to Modify

#### 1. `src/components/pricing/sections/PricingClientSelection.tsx`
```typescript
// Add to transport section
const [useManualDistribution, setUseManualDistribution] = useState(false);
const [manualAllocations, setManualAllocations] = useState<TransportAllocation[]>([]);

// Add toggle control
<FormControlLabel
  control={
    <Switch
      checked={useManualDistribution}
      onChange={(e) => setUseManualDistribution(e.target.checked)}
    />
  }
  label="Distribución Manual de Transportes"
/>

// Add manual inputs when enabled
{useManualDistribution && formData.productInputs.map((product, index) => (
  <TextField
    key={product.product.id}
    type="number"
    label={`Transportes para ${product.product.name}`}
    value={manualAllocations[index]?.quantity || 0}
    onChange={(e) => updateAllocation(product.product.id, Number(e.target.value))}
    inputProps={{ min: 0, max: formData.transportCount }}
  />
))}
```

#### 2. `src/services/pricing.service.ts`
```typescript
// Update transport calculation logic
export const calculateTransportCosts = (input: TransportCalculationInput) => {
  if (input.use_flexible_transport && input.transport_allocations?.length > 0) {
    // Use manual allocations
    return calculateManualTransportDistribution(input);
  } else {
    // Use existing automatic distribution
    return calculateAutomaticTransportDistribution(input);
  }
};

const calculateManualTransportDistribution = (input: TransportCalculationInput) => {
  const costPerTransport = input.zone.base_cost + 
    (input.include_equipment ? input.zone.additional_equipment_cost : 0);
    
  return input.transport_allocations.map(allocation => ({
    product_id: allocation.productId,
    quantity: allocation.quantity,
    cost: allocation.quantity * costPerTransport
  }));
};
```

#### 3. `src/components/pricing/types/index.ts`
```typescript
// Add to PricingFormData interface
interface PricingFormData {
  // ... existing fields
  useFlexibleTransport: boolean;
  transportAllocations: TransportAllocation[];
}

interface TransportAllocation {
  productId: number;
  quantity: number;
}
```

---

## Technical Notes

- **Integration Approach:** Extensión de componente existente con conditional rendering basado en toggle state
- **Existing Pattern Reference:** Similar al pattern de `includeEquipmentTransport` toggle en la misma sección
- **Key Constraints:** 
  - Usar `transport_allocations` JSONB field existente en DB
  - Mantener `transport_product_ids` para backward compatibility
  - Target performance <100ms para validación en tiempo real

---

## Definition of Done

- [ ] Toggle "Manual/Automático" implementado en UI
- [ ] Inputs numéricos por producto funcionando
- [ ] Validación en tiempo real implementada (suma = total)
- [ ] Cálculo de costos usando cantidades específicas  
- [ ] Distribución automática existente funciona sin cambios
- [ ] Tests unitarios para nueva funcionalidad
- [ ] Zero regresión en quotes/PDFs existentes verificada
- [ ] Campos DB `transport_allocations` y `use_flexible_transport` utilizados correctamente

---

## Risk Mitigation

**Primary Risk:** Romper cálculos de transporte en quotes existentes  
**Mitigation:** Feature flag `use_flexible_transport` permite fallback inmediato  
**Rollback Plan:** Set `use_flexible_transport = false` para todas las quotes

**Compatibility Verification:**
- ✅ No breaking changes: Usar campos DB existentes + fallback logic
- ✅ Database additive only: `transport_allocations` es campo opcional existente  
- ✅ UI patterns: Material-UI Toggle + TextField siguiendo estilo existente
- ✅ Performance negligible: Validación simple de suma + cálculo directo

---

## Testing Strategy

### Unit Tests Required
```typescript
describe('Transport Manual Distribution', () => {
  it('should toggle between manual and automatic modes', () => {
    // Test toggle functionality
  });
  
  it('should validate sum equals transport count', () => {
    // Test real-time validation
  });
  
  it('should calculate costs using manual allocations', () => {
    // Test manual cost calculation
  });
  
  it('should fallback to automatic when manual disabled', () => {
    // Test backward compatibility
  });
});
```

### Integration Tests
- Verify existing quote calculations remain unchanged
- Test PDF generation with both manual and automatic distribution
- Validate database field usage

---

## Success Metrics

**Functional Success:**
- ✅ User can specify custom transport quantities
- ✅ Real-time validation prevents invalid configurations
- ✅ Cost calculations are mathematically correct

**Technical Success:**
- ✅ Zero regression in existing functionality
- ✅ Performance remains under 100ms
- ✅ Backward compatibility maintained

**Business Success:**
- 🎯 Improved pricing accuracy for complex events
- 🎯 Enhanced user control and satisfaction
- 🎯 Maintains system stability and reliability

---

**Story Created:** 2025-01-09  
**Ready for Sprint:** ✅ Immediately  
**Developer Handoff:** Esta story está completamente definida y lista para implementación  

---

*Esta story consolidada reemplaza la épica original de 3 stories, simplificando el approach mientras mantiene todo el valor funcional requerido.*
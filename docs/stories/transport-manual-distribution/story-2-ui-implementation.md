# Story 2: UI Implementation - Manual Transport Distribution Controls
**Epic:** Transport Manual Distribution  
**Story ID:** TMD-002  
**Tipo:** Frontend Feature  
**Prioridad:** High  

## User Story
**Como** usuario del sistema de pricing  
**Quiero** especificar cuántos transportes asignar a cada producto individualmente  
**Para** tener control granular sobre la distribución de costos de transporte

## Background
Actualmente el sistema distribuye transportes equitativamente (20 transportes ÷ 2 productos = 10 y 10).  
Se necesita permitir distribución manual (ej: 15 para producto A, 5 para producto B).

## Acceptance Criteria

### ✅ AC1: Toggle Distribución Manual/Automática
**Dado** que he seleccionado una zona de transporte y productos  
**Cuando** veo la sección de transporte  
**Entonces** debo ver un switch "Distribución Manual" / "Distribución Automática"  
**Y** por defecto debe estar en modo "Distribución Automática"

### ✅ AC2: Controles de Cantidad Individual
**Dado** que activo "Distribución Manual"  
**Cuando** la UI se actualiza  
**Entonces** debo ver:
- Input numérico con stepper (+/-) por cada producto seleccionado
- Nombre del producto claramente visible
- Cantidad actual asignada a cada producto
- Indicador de suma total vs. objetivo (ej: "18/20 transportes asignados")

### ✅ AC3: Validación en Tiempo Real
**Dado** que estoy en modo manual  
**Cuando** modifico las cantidades  
**Entonces** el sistema debe:
- Mostrar error si suma > transport_count total
- Mostrar warning si suma < transport_count total  
- Mostrar éxito cuando suma = transport_count total
- Deshabilitar guardar cotización si hay errores

### ✅ AC4: Auto-ajuste Inteligente
**Dado** que tengo asignaciones manuales configuradas  
**Cuando** cambio el transport_count total  
**Entonces** el sistema debe:
- Re-distribuir proporcionalmente las asignaciones existentes
- Mantener la suma igual al nuevo total
- Mostrar los cambios claramente al usuario

### ✅ AC5: Responsive Design
**Dado** que accedo desde diferentes dispositivos  
**Cuando** uso los controles de distribución  
**Entonces** la UI debe:
- Funcionar correctamente en móvil, tablet y desktop
- Mantener usabilidad en pantallas pequeñas
- Seguir patrones de Material-UI existentes

### ✅ AC6: Estados de Edge Cases
**Dado** diferentes escenarios de uso  
**Cuando** me encuentro en situaciones especiales  
**Entonces** la UI debe manejar:
- Transport_count = 0: ocultar controles de distribución
- Solo 1 producto: permitir asignar todo el transporte
- Sin productos: deshabilitar distribución manual
- Cambio de productos: reset automático de asignaciones

## Technical Requirements

### Frontend Architecture
```
PricingClientSelection.tsx (existing)
├── TransportSection (existing - to be enhanced)
    ├── TransportAllocationControl.tsx (new component)
    ├── ProductTransportInput.tsx (new component)
    └── TransportSummaryIndicator.tsx (new component)
```

### Component Specs

#### TransportAllocationControl.tsx
```typescript
interface TransportAllocationControlProps {
  products: ProductInput[];
  transportCount: number;
  allocations: TransportAllocation[];
  onAllocationsChange: (allocations: TransportAllocation[]) => void;
  isManualMode: boolean;
  onModeChange: (isManual: boolean) => void;
}
```

#### ProductTransportInput.tsx
```typescript
interface ProductTransportInputProps {
  product: ProductInput;
  allocation: number;
  maxAllocation: number;
  onAllocationChange: (productId: number, quantity: number) => void;
}
```

### State Management Updates
```typescript
// Add to PricingFormData in types/index.ts
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

## UI/UX Design Specs

### Visual Layout
```
┌─ Zona de Transporte: Centro ─────────────┐
│ Costo unitario: $50,000 COP             │
│ Cantidad: [20] transportes               │
│                                          │
│ ☐ Incluir equipo adicional              │
│                                          │
│ Distribución: ○ Automática ● Manual     │
│ ┌────────────────────────────────────┐   │
│ │ Manual Distribution Controls       │   │
│ │ ┌─ Producto A ─┐ ┌─ Producto B ─┐ │   │
│ │ │ [-] 15 [+]   │ │ [-] 05 [+]   │ │   │
│ │ └─────────────┘ └─────────────────┘ │   │
│ │ Estado: ✅ 20/20 transportes       │   │
│ └────────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Color Coding
- ✅ Verde: Suma correcta (igual a total)
- ⚠️ Amarillo: Suma menor que total
- ❌ Rojo: Suma mayor que total
- 🔒 Gris: Controles deshabilitados

## Technical Tasks

### Task 2.1: Crear componentes base
- [ ] `TransportAllocationControl.tsx` - Componente principal
- [ ] `ProductTransportInput.tsx` - Input individual por producto  
- [ ] `TransportSummaryIndicator.tsx` - Indicador de estado

### Task 2.2: Integrar en PricingClientSelection
- [ ] Añadir toggle manual/automático
- [ ] Integrar nuevos componentes
- [ ] Mantener lógica existente para modo automático

### Task 2.3: Actualizar state management
- [ ] Añadir `useFlexibleTransport` y `transportAllocations` a formData
- [ ] Actualizar `usePricingForm.ts` con nueva lógica
- [ ] Crear helpers para validación y auto-ajuste

### Task 2.4: Implementar validaciones
- [ ] Validación en tiempo real de sumas
- [ ] Estados de error/success/warning
- [ ] Integrar con validación general del formulario

### Task 2.5: Testing
- [ ] Tests unitarios para cada componente
- [ ] Tests de integración para el flujo completo
- [ ] Tests de responsive design

## Definition of Done
- [ ] Toggle manual/automático funciona correctamente
- [ ] Inputs individuales por producto implementados
- [ ] Validación en tiempo real funcionando
- [ ] Auto-ajuste al cambiar transport_count
- [ ] Responsive design en mobile/tablet/desktop
- [ ] Edge cases manejados correctamente
- [ ] Tests unitarios y de integración pasando
- [ ] Code review completado
- [ ] Sin regresiones en funcionalidad existente

## Files to Create/Modify

### New Files
- `src/components/pricing/sections/transport/TransportAllocationControl.tsx`
- `src/components/pricing/sections/transport/ProductTransportInput.tsx`
- `src/components/pricing/sections/transport/TransportSummaryIndicator.tsx`

### Modified Files
- `src/components/pricing/sections/PricingClientSelection.tsx`
- `src/components/pricing/types/index.ts`
- `src/components/pricing/hooks/usePricingForm.ts`

## Dependencies
- ✅ Story 1 (Database Validation) must be completed
- Material-UI components and theme
- React Hook Form integration

## Estimation
**Story Points:** 8  
**Time Estimate:** 12-16 hours  

## Mockups/Wireframes
Ver diseños adjuntos en `/docs/designs/transport-manual-ui.figma`

## Notes
- Seguir exactamente patrones de Material-UI existentes
- Mantener consistencia con resto de la aplicación
- Priorizar usabilidad sobre funcionalidad avanzada
- Considerar accesibilidad (keyboard navigation, screen readers)
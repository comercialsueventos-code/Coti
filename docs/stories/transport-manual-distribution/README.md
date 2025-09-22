# Epic: Transport Manual Distribution

**Epic ID:** TMD  
**Status:** Ready for Development  
**Priority:** High  
**Created:** 2025-01-09  

## 🎯 Epic Summary

Permitir a los usuarios especificar manualmente la cantidad de transportes asignados a cada producto en lugar de la distribución automática equitativa actual en la página de pricing.

## 🎯 Problem Statement

**Situación actual:** Cuando hay múltiples productos seleccionados, el transporte se distribuye equitativamente (20 transportes ÷ 2 productos = 10 y 10).

**Necesidad:** Control manual de distribución (ej: 15 transportes para producto A, 5 para producto B, totalizando 20).

## 🔍 Epic Goal

Implementar distribución manual de transportes por producto manteniendo retrocompatibilidad completa con el sistema existente.

## 🏗️ System Context

- **Frontend:** React + TypeScript + Material-UI
- **Backend:** Supabase + PostgreSQL
- **Files:** `/pricing` página (`src/pages/Pricing.tsx`)
- **Database:** Table `quotes` con infraestructura existente

## 🗃️ Database Infrastructure (Already Exists!)

✅ **DISCOVERED:** La base de datos YA TIENE la infraestructura necesaria:

```sql
-- quotes table
transport_allocations     JSONB     -- [{productId: number, quantity: number}]
use_flexible_transport    BOOLEAN   -- Toggle manual vs automatic
transport_product_ids     INTEGER[] -- Legacy system (keep for compatibility)  
transport_count          INTEGER   -- Total transport count
```

## 📋 Stories

### [Story 1: Database Validation](./story-1-database-validation.md)
**Priority:** High | **Story Points:** 3 | **Status:** Ready

Validar que la infraestructura de DB existente funciona correctamente para implementar distribución manual sin cambios de schema.

**Key Tasks:**
- Validar estructura `transport_allocations`
- Verificar flag `use_flexible_transport`
- Confirmar retrocompatibilidad
- Crear tests de validación

### [Story 2: UI Implementation](./story-2-ui-implementation.md)
**Priority:** High | **Story Points:** 8 | **Status:** Blocked by Story 1

Implementar controles UI para asignar cantidad específica de transportes por producto con toggle manual/automático.

**Key Features:**
- Toggle Distribución Manual/Automática
- Inputs numéricos por producto con steppers
- Validación en tiempo real
- Auto-ajuste al cambiar transport_count
- Responsive design siguiendo patrones Material-UI

### [Story 3: Calculation Logic](./story-3-calculation-logic.md)
**Priority:** High | **Story Points:** 13 | **Status:** Blocked by Story 1, 2

Implementar lógica de cálculo usando asignaciones personalizadas manteniendo backward compatibility.

**Key Features:**
- Cálculo con distribución manual
- Fallback a distribución legacy
- Validación pre-cálculo
- PDF generation actualizado
- Logging comprehensivo

## 🎯 Success Criteria

- ✅ Usuario puede asignar cantidades específicas (ej: 15 y 5 en lugar de 10 y 10)
- ✅ Validación: suma de cantidades = total de transportes
- ✅ Cálculos de costos funcionan correctamente
- ✅ Cotizaciones existentes no se afectan (backward compatibility)
- ✅ Sin regresiones en funcionalidad de transporte existente

## 🛡️ Risk Mitigation

- **Primary Risk:** Romper cálculos existentes
  **Mitigation:** Feature flag para rollback inmediato

- **Secondary Risk:** Datos inconsistentes  
  **Mitigation:** Validación robusta y fallback a modo automático

## 📊 Estimation Summary

| Story | Story Points | Time Estimate |
|-------|-------------|---------------|
| Story 1 | 3 | 4-6 hours |  
| Story 2 | 8 | 12-16 hours |
| Story 3 | 13 | 16-20 hours |
| **Total** | **24** | **32-42 hours** |

## 🔗 Dependencies

```
Story 1 (Database) → Story 2 (UI) → Story 3 (Logic)
```

- Story 1 is prerequisite for Stories 2 and 3
- Stories 2 and 3 can be developed in parallel after Story 1 completion

## 🎨 Design References

- Existing transport section in `PricingClientSelection.tsx`
- Material-UI patterns used throughout the app
- Responsive design following current app standards

## 📝 Technical Notes

- Database schema changes: **NONE** (infrastructure exists)
- New TypeScript interfaces needed for `transport_allocations`
- Comprehensive testing required for backward compatibility
- Feature flag: `use_flexible_transport` boolean

## 🚀 Deployment Strategy

1. **Phase 1:** Deploy with feature flag OFF (Story 1)
2. **Phase 2:** Deploy UI with feature flag ON for testing (Story 2)  
3. **Phase 3:** Deploy calculation logic and enable for production (Story 3)

## 📞 Contacts

- **Product Manager:** John (PM Agent)
- **Technical Lead:** Development Team
- **Business Analyst:** Mary (Analyst Agent)

---

**Last Updated:** 2025-01-09  
**Next Review:** After Story 1 completion
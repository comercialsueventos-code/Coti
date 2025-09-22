# Story 1: Database Schema Validation
**Epic:** Transport Manual Distribution  
**Story ID:** TMD-001  
**Tipo:** Technical Validation  
**Prioridad:** High  

## User Story
**Como** desarrollador del sistema  
**Quiero** validar que la infraestructura de base de datos existente funciona correctamente  
**Para** implementar la distribución manual de transportes sin cambios de schema

## Context
El análisis de la base de datos reveló que ya existe infraestructura parcial:
- ✅ `transport_allocations` (jsonb) - Para asignaciones personalizadas
- ✅ `use_flexible_transport` (boolean) - Toggle entre modos
- ✅ `transport_product_ids` (array) - Sistema legacy
- ✅ `transport_count` (integer) - Cantidad total

## Acceptance Criteria

### ✅ AC1: Validar estructura transport_allocations
**Dado** que existe el campo `transport_allocations` en la tabla `quotes`  
**Cuando** inserto datos con formato `[{productId: number, quantity: number}]`  
**Entonces** los datos se guardan correctamente sin errores

### ✅ AC2: Validar flag use_flexible_transport
**Dado** que existe el campo `use_flexible_transport` en la tabla `quotes`  
**Cuando** cambio el valor entre `true` y `false`  
**Entonces** el sistema puede distinguir entre modo manual y automático

### ✅ AC3: Garantizar retrocompatibilidad
**Dado** que existen cotizaciones legacy con solo `transport_product_ids`  
**Cuando** accedo a estas cotizaciones  
**Entonces** el sistema funciona sin errores usando el modo legacy

### ✅ AC4: Validar integridad de datos
**Dado** que tengo asignaciones en `transport_allocations`  
**Cuando** la suma de `quantity` no iguala `transport_count`  
**Entonces** el sistema debe detectar esta inconsistencia

## Technical Tasks

### Task 1.1: Crear tests de validación de schema
```sql
-- Test 1: Insertar transport_allocations válidas
INSERT INTO quotes (transport_allocations, use_flexible_transport) 
VALUES ('[{"productId": 1, "quantity": 15}, {"productId": 2, "quantity": 5}]', true);

-- Test 2: Validar formato JSON
SELECT transport_allocations->>0 FROM quotes WHERE use_flexible_transport = true;
```

### Task 1.2: Documentar estructura JSON
Crear documentación para `transport_allocations`:
```typescript
interface TransportAllocation {
  productId: number;  // ID del producto
  quantity: number;   // Cantidad de transportes asignados
}
```

### Task 1.3: Verificar constraints existentes
- Validar que no hay constraints que impidan el formato propuesto
- Verificar índices en campos relevantes
- Confirmar que campos son nullables como se espera

### Task 1.4: Probar migración de datos
```sql
-- Simular migración de legacy a nuevo formato
UPDATE quotes 
SET 
  use_flexible_transport = false,
  transport_allocations = '[]'::jsonb
WHERE transport_allocations IS NULL;
```

## Definition of Done
- [ ] Tests de validación de schema pasan exitosamente
- [ ] Documentación de estructura JSON creada
- [ ] Verificación de constraints completada
- [ ] Migración de datos probada sin errores
- [ ] Zero impacto en cotizaciones existentes confirmado

## Files Affected
- `src/types/database.types.ts` - Actualizar tipos si es necesario
- `tests/database/transport-schema.test.sql` - Tests de validación

## Dependencies
- Ninguna (pre-requisito para Stories 2 y 3)

## Estimation
**Story Points:** 3  
**Time Estimate:** 4-6 hours  

## Notes
- Esta es una story de validación técnica, no involucra UI
- Critical path: debe completarse antes de Stories 2 y 3
- Si encuentra problemas de schema, escalar inmediatamente
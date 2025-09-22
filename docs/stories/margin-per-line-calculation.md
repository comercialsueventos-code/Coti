# Margin Per Line Mode - Story

**Story ID:** MARGIN-PER-LINE
**Priority:** High
**Story Points:** 5
**Estimated Time:** 4-6 hours
**Status:** Ready for Development

---

## User Story

**Como** vendedor que arma cotizaciones,
**Quiero** aplicar el margen por renglón (sin prorrateos globales),
**Para** que el precio de cada producto refleje exactamente su costo directo más margen.

---

## Story Context

- En la calculadora existe un campo global "Margen de ganancia (%)" en `src/components/pricing/sections/PricingClientSelection.tsx` (líneas ~764-766).
- El resumen `src/components/pricing/sections/PricingCalculationSummary.tsx` calcula margen total con `actualResult.margin_percentage` y `subtotal` (líneas ~835+), y hace fallback si no viene del backend.
- El reparto/prorrateo global actual redistribuye montos entre líneas, generando diferencias con el cálculo esperado por ítem.

---

## Acceptance Criteria

1. Modo de margen: selector "Global" vs "Por línea" en la sección de cliente/cotización.
2. En modo "Por línea": `precio_ítem = (costo_base + flete + operarios + otros costos directos del ítem) × (1 + margen%)`.
3. Caso de ejemplo validado en UI y tests:
   - P1: 840,000 + 50,000 + 240,000 = 1,130,000 → x2 = 2,260,000
   - P2: 150,000 + 90,000 + 360,000 = 600,000 → x2 = 1,200,000
   - Total: 3,460,000 (sin redistribuciones entre líneas)
4. En modo "Global": mantener comportamiento actual, pero mostrar método de prorrateo usado (por costo como default; si aplica: por cantidad/peso/valor base).
5. Visualización: indicar claramente el modo activo y el método de prorrateo cuando sea Global.
6. Redondeo: 2 decimales por ítem, sin compensaciones entre líneas.
7. Impuestos/Descuentos: margen se calcula sobre valores netos; IVA se aplica luego; descuentos globales prorrateados con el mismo método elegido; en modo Por línea no deben alterar los totales por línea.
8. Pruebas: unitarias de cálculo + integración de resumen/guardado de cotización.

---

## Tasks / Subtasks

- [ ] UI: Agregar selector `marginMode` ("Global" | "Por línea") junto al campo de margen
  - [ ] `PricingClientSelection.tsx`: estado/control y persistencia en `formData`
  - [ ] Etiquetas y ayuda contextual: explicar diferencias de ambos modos
- [ ] Modelo/FormData: agregar `marginMode: 'global' | 'per_line'` (default: 'global')
  - [ ] `src/types/index.ts` y cualquier tipo relacionado a quote/result que lo requiera
- [ ] Cálculo: implementar cálculo de margen por línea
  - [ ] Servicio/aggregator: función que compute margen total sumando márgenes por ítem
  - [ ] Resumen: en `PricingCalculationSummary.tsx`, si `marginMode === 'per_line'`, usar el total de margen sumado por línea
- [ ] Backend/API (si aplica): soportar `margin_mode` y margen por línea
  - [ ] Extender DTOs/types en `src/types/database.types.ts` (columna opcional `margin_mode` con default 'global')
- [ ] PDF/Distribución de costos: asegurar que no se re-prorrateen los montos cuando el modo es "Por línea"
- [ ] Tests
  - [ ] Unit: función de cálculo de margen por línea (incluye caso de ejemplo)
  - [ ] Integration: selector de modo, resumen muestra 2,260,000 y 1,200,000 para el ejemplo
  - [ ] Regressions: modo Global conserva comportamiento actual

---

## Dev Notes

- Ubicación del margen actual en UI: `src/components/pricing/sections/PricingClientSelection.tsx` (campo "Margen de ganancia (%)").
- Resumen usa `actualResult.margin_percentage`/`margin_amount` y `subtotal` para fallback: `src/components/pricing/sections/PricingCalculationSummary.tsx` (~835-885).
- Tipos con campos de margen ya existen en `src/types/index.ts` y `src/types/database.types.ts`.
- Recomendación: mantener el valor de margen como porcentaje único aplicado por línea; en futuro permitir márgenes distintos por ítem (fuera de alcance aquí).

### Testing
- Ubicar tests de integración existentes: `src/components/pricing/sections/__tests__/PricingClientSelection.integration.test.tsx` (usa zonas de transporte y valida UI/ARIA).
- Añadir casos para `marginMode` y verificación de totales en resumen.

---

## PO Validation

Decision: PASS — Ready for Development

Summary:
- ACs son claros y verificables (fórmula por ítem y ejemplo).
- Se preserva modo Global con visualización de método de prorrateo.
- Se requieren pruebas unitarias y de integración como se indica.

Notas:
- IVA/retención se aplican después del margen; descuentos siguen el método elegido.
- Sin dependencias bloqueantes identificadas.

Owner: Sarah (PO)
Date: 2025-09-10

## Change Log

| Date       | Version | Description                                         | Author |
|------------|---------|-----------------------------------------------------|--------|
| 2025-09-10 | 0.2     | PO validation: Approved; Ready for Development     | Sarah  |
| 2025-09-10 | 0.1     | Draft inicial: modo margen por línea vs global     | Bob    |

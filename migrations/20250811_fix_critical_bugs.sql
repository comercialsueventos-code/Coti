-- MIGRACIÓN CRÍTICA: Corregir bugs encontrados en análisis
-- Fecha: 2025-01-11
-- APLICAR INMEDIATAMENTE ANTES DE PRODUCCIÓN

-- ======================================================
-- BUG FIX #1: Arreglar función calculate_hourly_rate
-- PROBLEMA: Usaba hours < max_h en lugar de hours <= max_h
-- ======================================================

CREATE OR REPLACE FUNCTION calculate_hourly_rate(employee_rates JSONB, hours NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    rate_item JSONB;
    min_h NUMERIC;
    max_h NUMERIC;
    rate_value NUMERIC;
BEGIN
    -- Loop through rate ranges to find matching one
    FOR rate_item IN SELECT jsonb_array_elements(employee_rates)
    LOOP
        min_h := (rate_item->>'min_hours')::numeric;
        max_h := CASE 
            WHEN rate_item->>'max_hours' = 'null' OR rate_item->>'max_hours' IS NULL 
            THEN NULL 
            ELSE (rate_item->>'max_hours')::numeric 
        END;
        rate_value := (rate_item->>'rate')::numeric;
        
        -- ARREGLADO: Cambiar hours < max_h por hours <= max_h
        -- Esto permite que funcionen correctamente rangos como [2,4] horas
        IF hours >= min_h AND (max_h IS NULL OR hours <= max_h) THEN
            RETURN rate_value;
        END IF;
    END LOOP;
    
    -- If no range found, return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- BUG FIX #2: Arreglar validación de rangos en validate_hourly_rates
-- PROBLEMA: max_h <= min_h no permite rangos [2,2]
-- ======================================================

CREATE OR REPLACE FUNCTION validate_hourly_rates(rates JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    rate_item JSONB;
    min_h NUMERIC;
    max_h NUMERIC;
    rate_value NUMERIC;
BEGIN
    -- Check if rates is an array
    IF jsonb_typeof(rates) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    -- Validate each rate range
    FOR rate_item IN SELECT jsonb_array_elements(rates)
    LOOP
        -- Check required fields
        IF NOT (rate_item ? 'min_hours' AND rate_item ? 'rate') THEN
            RETURN FALSE;
        END IF;
        
        -- Extract values
        min_h := (rate_item->>'min_hours')::numeric;
        max_h := CASE 
            WHEN rate_item->>'max_hours' = 'null' OR rate_item->>'max_hours' IS NULL 
            THEN NULL 
            ELSE (rate_item->>'max_hours')::numeric 
        END;
        rate_value := (rate_item->>'rate')::numeric;
        
        -- Validate ranges
        IF min_h < 0 OR rate_value < 0 THEN
            RETURN FALSE;
        END IF;
        
        -- ARREGLADO: Cambiar max_h <= min_h por max_h < min_h
        -- Esto permite rangos exactos como [2,2] horas
        IF max_h IS NOT NULL AND max_h < min_h THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ======================================================
-- BUG FIX #3: Agregar foreign keys faltantes críticas
-- PROBLEMA: No hay integridad referencial en el sistema
-- ======================================================

-- Agregar foreign key para quotes -> clients
DO $$ 
BEGIN
    -- Solo agregar si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_quotes_client_id'
    ) THEN
        ALTER TABLE quotes 
        ADD CONSTRAINT fk_quotes_client_id 
        FOREIGN KEY (client_id) REFERENCES clients(id) 
        ON DELETE RESTRICT;
        
        CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
    END IF;
END $$;

-- Agregar foreign key para quotes -> transport_zones
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_quotes_transport_zone_id'
    ) THEN
        ALTER TABLE quotes 
        ADD CONSTRAINT fk_quotes_transport_zone_id 
        FOREIGN KEY (transport_zone_id) REFERENCES transport_zones(id) 
        ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_quotes_transport_zone_id ON quotes(transport_zone_id);
    END IF;
END $$;

-- Verificar que la tabla quote_items existe antes de agregar FKs
DO $$ 
BEGIN
    -- Solo proceder si la tabla existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quote_items') THEN
        
        -- quote_items -> quotes
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_quote_items_quote_id'
        ) THEN
            ALTER TABLE quote_items 
            ADD CONSTRAINT fk_quote_items_quote_id 
            FOREIGN KEY (quote_id) REFERENCES quotes(id) 
            ON DELETE CASCADE;
            
            CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);
        END IF;
        
        -- quote_items -> employees
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_quote_items_employee_id'
        ) THEN
            ALTER TABLE quote_items 
            ADD CONSTRAINT fk_quote_items_employee_id 
            FOREIGN KEY (employee_id) REFERENCES employees(id) 
            ON DELETE SET NULL;
            
            CREATE INDEX IF NOT EXISTS idx_quote_items_employee_id ON quote_items(employee_id);
        END IF;
        
        -- quote_items -> products
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_quote_items_product_id'
        ) THEN
            ALTER TABLE quote_items 
            ADD CONSTRAINT fk_quote_items_product_id 
            FOREIGN KEY (product_id) REFERENCES products(id) 
            ON DELETE SET NULL;
            
            CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items(product_id);
        END IF;
    END IF;
END $$;

-- ======================================================
-- BUG FIX #4: Arreglar campos de fecha en quotes
-- PROBLEMA: Los tipos no coinciden entre frontend y backend
-- ======================================================

-- Verificar si necesitamos agregar campos de fecha
DO $$ 
BEGIN
    -- Agregar event_start_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'event_start_date'
    ) THEN
        ALTER TABLE quotes ADD COLUMN event_start_date DATE;
    END IF;
    
    -- Agregar event_end_date si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'event_end_date'
    ) THEN
        ALTER TABLE quotes ADD COLUMN event_end_date DATE;
    END IF;
    
    -- Si existe event_date pero no los otros, migrar datos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'event_date'
    ) AND NOT EXISTS (
        SELECT 1 FROM quotes WHERE event_start_date IS NOT NULL LIMIT 1
    ) THEN
        -- Migrar event_date a event_start_date y event_end_date
        UPDATE quotes 
        SET 
            event_start_date = event_date::date,
            event_end_date = event_date::date
        WHERE event_date IS NOT NULL;
    END IF;
END $$;

-- ======================================================
-- VERIFICACIONES FINALES
-- ======================================================

-- Mostrar un resumen de las correcciones aplicadas
DO $$
BEGIN
    RAISE NOTICE '=== RESUMEN DE CORRECCIONES APLICADAS ===';
    RAISE NOTICE '✓ Función calculate_hourly_rate corregida (hours <= max_h)';
    RAISE NOTICE '✓ Función validate_hourly_rates corregida (max_h < min_h)';
    RAISE NOTICE '✓ Foreign keys agregadas para integridad referencial';
    RAISE NOTICE '✓ Campos de fecha sincronizados';
    RAISE NOTICE '✓ Índices de performance creados';
    RAISE NOTICE '=== MIGRACIÓN COMPLETADA EXITOSAMENTE ===';
END $$;
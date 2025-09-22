-- Migration: Implement flexible hourly rate ranges for employees
-- This allows defining custom time ranges like 0-1h, 1-2h, 3-8h, etc.

-- First, let's see the current structure and migrate existing data
DO $$
DECLARE
    employee_record RECORD;
    new_rates JSONB;
BEGIN
    -- For each employee, convert old fixed structure to new flexible structure
    FOR employee_record IN 
        SELECT id, hourly_rates FROM employees WHERE hourly_rates IS NOT NULL
    LOOP
        -- Convert old format to new flexible format
        new_rates := jsonb_build_array(
            jsonb_build_object(
                'id', gen_random_uuid()::text,
                'min_hours', 1,
                'max_hours', 4,
                'rate', COALESCE((employee_record.hourly_rates->>'1-4h')::numeric, 0),
                'description', 'Servicio básico (1-4 horas)'
            ),
            jsonb_build_object(
                'id', gen_random_uuid()::text,
                'min_hours', 4,
                'max_hours', 8,
                'rate', COALESCE((employee_record.hourly_rates->>'4-8h')::numeric, 0),
                'description', 'Servicio medio (4-8 horas)'
            ),
            jsonb_build_object(
                'id', gen_random_uuid()::text,
                'min_hours', 8,
                'max_hours', NULL,
                'rate', COALESCE((employee_record.hourly_rates->>'8h+')::numeric, 0),
                'description', 'Servicio extendido (8+ horas)'
            )
        );
        
        -- Update the employee record with new format
        UPDATE employees 
        SET hourly_rates = new_rates 
        WHERE id = employee_record.id;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % employee hourly rates to flexible format', 
        (SELECT COUNT(*) FROM employees WHERE hourly_rates IS NOT NULL);
END $$;

-- Add comments to the hourly_rates column for documentation
COMMENT ON COLUMN employees.hourly_rates IS 
'Flexible hourly rate ranges stored as JSONB array. Each range has: min_hours, max_hours (null = infinity), rate, optional description. Examples:
[
  {"id": "uuid", "min_hours": 0, "max_hours": 1, "rate": 50000, "description": "Primera hora"},
  {"id": "uuid", "min_hours": 1, "max_hours": 3, "rate": 45000, "description": "Horas adicionales"},
  {"id": "uuid", "min_hours": 3, "max_hours": null, "rate": 40000, "description": "Tarifa extendida"}
]';

-- Create a function to validate hourly rate ranges
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
        
        IF max_h IS NOT NULL AND max_h <= min_h THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint to ensure valid hourly rates
ALTER TABLE employees 
ADD CONSTRAINT valid_hourly_rates 
CHECK (hourly_rates IS NULL OR validate_hourly_rates(hourly_rates));

-- Create helper function to calculate rate for given hours
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
        
        -- Check if hours fall within this range
        IF hours >= min_h AND (max_h IS NULL OR hours < max_h) THEN
            RETURN rate_value;
        END IF;
    END LOOP;
    
    -- If no range found, return 0
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_hourly_rates 
ON employees USING GIN (hourly_rates);

-- Example of inserting an employee with flexible rates:
-- INSERT INTO employees (name, employee_type, hourly_rates, has_arl, is_active) VALUES
-- ('Juan Pérez', 'chef', '[
--   {"id": "550e8400-e29b-41d4-a716-446655440001", "min_hours": 0, "max_hours": 2, "rate": 60000, "description": "Primeras 2 horas"},
--   {"id": "550e8400-e29b-41d4-a716-446655440002", "min_hours": 2, "max_hours": 6, "rate": 50000, "description": "Horas intermedias"},
--   {"id": "550e8400-e29b-41d4-a716-446655440003", "min_hours": 6, "max_hours": null, "rate": 45000, "description": "Tarifa extendida"}
-- ]'::jsonb, true, true);
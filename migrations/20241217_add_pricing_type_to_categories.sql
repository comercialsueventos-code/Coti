-- Migration: Add pricing type and flat rate support to employee categories
-- This allows categories to have either flat rates or flexible rates

-- Add pricing_type column to employee_categories
ALTER TABLE employee_categories 
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(10) DEFAULT 'flexible' 
CHECK (pricing_type IN ('plana', 'flexible'));

-- Add flat_rate column for flat pricing
ALTER TABLE employee_categories 
ADD COLUMN IF NOT EXISTS flat_rate NUMERIC DEFAULT NULL;

-- Add comment to explain the new fields
COMMENT ON COLUMN employee_categories.pricing_type IS 'Type of pricing: plana (flat rate) or flexible (hourly ranges)';
COMMENT ON COLUMN employee_categories.flat_rate IS 'Flat rate per hour (only used when pricing_type = plana)';

-- Update existing categories to use flexible pricing (current behavior)
UPDATE employee_categories 
SET pricing_type = 'flexible' 
WHERE pricing_type IS NULL;

-- Add validation constraint to ensure data consistency
ALTER TABLE employee_categories 
ADD CONSTRAINT pricing_type_validation 
CHECK (
  (pricing_type = 'plana' AND flat_rate IS NOT NULL AND flat_rate > 0) OR
  (pricing_type = 'flexible' AND jsonb_array_length(default_hourly_rates) > 0)
);

-- Update the existing validation function to support new pricing types
CREATE OR REPLACE FUNCTION validate_employee_category_config(
    rates JSONB,
    certifications JSONB,
    required_certs JSONB,
    pricing_type VARCHAR(10) DEFAULT 'flexible',
    flat_rate NUMERIC DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate pricing type
    IF pricing_type NOT IN ('plana', 'flexible') THEN
        RETURN FALSE;
    END IF;
    
    -- Validate flat rate pricing
    IF pricing_type = 'plana' THEN
        IF flat_rate IS NULL OR flat_rate <= 0 THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate flexible pricing
    IF pricing_type = 'flexible' THEN
        -- Validate hourly rates using existing function
        IF NOT validate_hourly_rates(rates) THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Validate that all arrays are actually arrays
    IF jsonb_typeof(certifications) != 'array' OR 
       jsonb_typeof(required_certs) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update the constraint to use the new validation function
ALTER TABLE employee_categories 
DROP CONSTRAINT IF EXISTS valid_category_config;

ALTER TABLE employee_categories 
ADD CONSTRAINT valid_category_config 
CHECK (validate_employee_category_config(
    default_hourly_rates, 
    default_certifications, 
    required_certifications,
    pricing_type,
    flat_rate
));

-- Create index for pricing_type queries
CREATE INDEX IF NOT EXISTS idx_employee_categories_pricing_type 
ON employee_categories(pricing_type);

-- Update the summary view to include pricing information
CREATE OR REPLACE VIEW employee_categories_summary AS
SELECT 
    ec.id,
    ec.name,
    ec.category_type,
    ec.pricing_type,
    ec.flat_rate,
    ec.description,
    ec.icon,
    ec.color,
    ec.is_active,
    COUNT(e.id) as employee_count,
    ec.created_at,
    ec.updated_at,
    -- Add pricing summary
    CASE 
        WHEN ec.pricing_type = 'plana' THEN 
            CONCAT('$', ec.flat_rate::text, '/hora')
        ELSE 
            CONCAT(jsonb_array_length(ec.default_hourly_rates), ' escalones')
    END as pricing_summary
FROM employee_categories ec
LEFT JOIN employees e ON e.category_id = ec.id AND e.is_active = true
GROUP BY ec.id, ec.name, ec.category_type, ec.pricing_type, ec.flat_rate, ec.description, ec.icon, ec.color, ec.is_active, ec.created_at, ec.updated_at, ec.default_hourly_rates
ORDER BY ec.name;

-- Create helper function to get pricing display for a category
CREATE OR REPLACE FUNCTION get_category_pricing_display(category_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    category_record RECORD;
    rates_count INTEGER;
    min_rate NUMERIC;
    max_rate NUMERIC;
BEGIN
    SELECT pricing_type, flat_rate, default_hourly_rates
    INTO category_record
    FROM employee_categories
    WHERE id = category_id;
    
    IF category_record.pricing_type = 'plana' THEN
        RETURN CONCAT('Tarifa Plana: $', category_record.flat_rate::text, '/hora');
    ELSE
        -- Get rate range info
        SELECT 
            jsonb_array_length(category_record.default_hourly_rates),
            MIN((rate->>'rate')::numeric),
            MAX((rate->>'rate')::numeric)
        INTO rates_count, min_rate, max_rate
        FROM jsonb_array_elements(category_record.default_hourly_rates) AS rate;
        
        RETURN CONCAT('Tarifa Flexible: ', rates_count, ' escalones ($', min_rate::text, ' - $', max_rate::text, ')');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Example usage for testing:
-- SELECT id, name, get_category_pricing_display(id) as pricing_info FROM employee_categories;

-- Add sample data for testing (optional)
-- INSERT INTO employee_categories (name, category_type, pricing_type, flat_rate, icon, color, default_has_arl)
-- VALUES ('Chef Premium', 'chef', 'plana', 85000, '⭐', '#FFD700', true);

RAISE NOTICE 'Successfully added pricing type support to employee categories';
RAISE NOTICE 'Categories can now have either flat rates or flexible hourly ranges';
RAISE NOTICE 'All existing categories have been set to flexible pricing type';
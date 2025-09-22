-- Migration: Create employee categories system
-- This allows defining categories with default configurations and creating multiple employees per category

-- Create employee_categories table
CREATE TABLE IF NOT EXISTS employee_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- ej: "Chef Senior", "Operario Nivel 1", "Mesero Premium"
    category_type VARCHAR(50) NOT NULL, -- ej: "chef", "operario", "mesero", "supervisor", "conductor"  
    description TEXT,
    icon VARCHAR(10) DEFAULT '👤', -- Emoji for UI
    color VARCHAR(7) DEFAULT '#2196F3', -- Hex color for UI
    
    -- Default configurations for this category
    default_hourly_rates JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of HourlyRateRange
    default_has_arl BOOLEAN DEFAULT true,
    default_arl_provider VARCHAR(100),
    default_certifications JSONB DEFAULT '[]'::jsonb, -- Array of strings
    
    -- Category-specific settings
    requires_certification BOOLEAN DEFAULT false, -- Category requires specific certifications
    required_certifications JSONB DEFAULT '[]'::jsonb, -- Array of required certification names
    min_experience_months INTEGER DEFAULT 0, -- Minimum experience required
    
    -- Pricing and availability settings
    availability_restrictions JSONB DEFAULT '{}'::jsonb, -- Days, times, etc.
    special_skills JSONB DEFAULT '[]'::jsonb, -- Array of special skills this category offers
    equipment_access JSONB DEFAULT '[]'::jsonb, -- Equipment this category can use
    
    -- Administrative
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_employee_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_employee_categories_updated_at
    BEFORE UPDATE ON employee_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_categories_updated_at();

-- Add category_id to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES employee_categories(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_category_id ON employees(category_id);
CREATE INDEX IF NOT EXISTS idx_employee_categories_type ON employee_categories(category_type);
CREATE INDEX IF NOT EXISTS idx_employee_categories_active ON employee_categories(is_active);

-- Insert default categories based on existing employee types
INSERT INTO employee_categories (name, category_type, description, icon, color, default_hourly_rates, default_certifications) VALUES
(
    'Operario Estándar',
    'operario',
    'Operario para servicios generales de eventos',
    '🔧',
    '#FF9800',
    '[
        {"id": "' || gen_random_uuid() || '", "min_hours": 0, "max_hours": 2, "rate": 25000, "description": "Primeras 2 horas"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 2, "max_hours": 6, "rate": 22000, "description": "Horas adicionales"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 6, "max_hours": null, "rate": 20000, "description": "Tarifa extendida"}
    ]'::jsonb,
    '["alturas", "primeros_auxilios"]'::jsonb
),
(
    'Chef Profesional',
    'chef',
    'Chef especializado en eventos corporativos y sociales',
    '👨‍🍳',
    '#4CAF50',
    '[
        {"id": "' || gen_random_uuid() || '", "min_hours": 0, "max_hours": 1, "rate": 80000, "description": "Primera hora"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 1, "max_hours": 4, "rate": 70000, "description": "Horas adicionales"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 4, "max_hours": null, "rate": 65000, "description": "Tarifa extendida"}
    ]'::jsonb,
    '["manipulacion_alimentos", "chef_profesional"]'::jsonb
),
(
    'Mesero de Eventos',
    'mesero',
    'Mesero especializado en atención para eventos',
    '🍽️',
    '#2196F3',
    '[
        {"id": "' || gen_random_uuid() || '", "min_hours": 1, "max_hours": 4, "rate": 18000, "description": "Servicio básico"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 4, "max_hours": 8, "rate": 16000, "description": "Servicio medio"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 8, "max_hours": null, "rate": 15000, "description": "Servicio extendido"}
    ]'::jsonb,
    '["manipulacion_alimentos", "atencion_cliente"]'::jsonb
),
(
    'Supervisor de Evento',
    'supervisor',
    'Supervisor encargado de coordinar el evento',
    '👔',
    '#9C27B0',
    '[
        {"id": "' || gen_random_uuid() || '", "min_hours": 0, "max_hours": 2, "rate": 45000, "description": "Supervisión básica"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 2, "max_hours": 6, "rate": 40000, "description": "Supervisión media"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 6, "max_hours": null, "rate": 35000, "description": "Supervisión extendida"}
    ]'::jsonb,
    '["liderazgo", "primeros_auxilios"]'::jsonb
),
(
    'Conductor de Transporte',
    'conductor',
    'Conductor para transporte de equipos y personal',
    '🚐',
    '#607D8B',
    '[
        {"id": "' || gen_random_uuid() || '", "min_hours": 1, "max_hours": 3, "rate": 30000, "description": "Transporte corto"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 3, "max_hours": 8, "rate": 25000, "description": "Transporte medio"},
        {"id": "' || gen_random_uuid() || '", "min_hours": 8, "max_hours": null, "rate": 22000, "description": "Transporte largo"}
    ]'::jsonb,
    '["licencia_c2", "manejo_defensivo"]'::jsonb
);

-- Migrate existing employees to use categories
DO $$
DECLARE
    emp_record RECORD;
    category_id_val INTEGER;
BEGIN
    -- For each employee, assign them to the corresponding default category
    FOR emp_record IN 
        SELECT id, employee_type FROM employees WHERE employee_type IS NOT NULL AND category_id IS NULL
    LOOP
        -- Find the corresponding category
        SELECT id INTO category_id_val 
        FROM employee_categories 
        WHERE category_type = emp_record.employee_type 
        LIMIT 1;
        
        -- Update the employee if category found
        IF category_id_val IS NOT NULL THEN
            UPDATE employees 
            SET category_id = category_id_val 
            WHERE id = emp_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated % employees to categories', 
        (SELECT COUNT(*) FROM employees WHERE category_id IS NOT NULL);
END $$;

-- Add validation function for category configurations
CREATE OR REPLACE FUNCTION validate_employee_category_config(
    rates JSONB,
    certifications JSONB,
    required_certs JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate hourly rates using existing function
    IF NOT validate_hourly_rates(rates) THEN
        RETURN FALSE;
    END IF;
    
    -- Validate that all arrays are actually arrays
    IF jsonb_typeof(certifications) != 'array' OR 
       jsonb_typeof(required_certs) != 'array' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to ensure valid category configurations
ALTER TABLE employee_categories 
ADD CONSTRAINT valid_category_config 
CHECK (validate_employee_category_config(default_hourly_rates, default_certifications, required_certifications));

-- Create helpful views
CREATE OR REPLACE VIEW employee_categories_summary AS
SELECT 
    ec.id,
    ec.name,
    ec.category_type,
    ec.description,
    ec.icon,
    ec.color,
    ec.is_active,
    COUNT(e.id) as employee_count,
    ec.created_at,
    ec.updated_at
FROM employee_categories ec
LEFT JOIN employees e ON e.category_id = ec.id AND e.is_active = true
GROUP BY ec.id, ec.name, ec.category_type, ec.description, ec.icon, ec.color, ec.is_active, ec.created_at, ec.updated_at
ORDER BY ec.name;

-- Comments for documentation
COMMENT ON TABLE employee_categories IS 'Categories of employees with default configurations and templates';
COMMENT ON COLUMN employee_categories.category_type IS 'Base type: operario, chef, mesero, supervisor, conductor';
COMMENT ON COLUMN employee_categories.default_hourly_rates IS 'Default hourly rate ranges for this category (flexible format)';
COMMENT ON COLUMN employee_categories.required_certifications IS 'Certifications required for this category';
COMMENT ON COLUMN employee_categories.availability_restrictions IS 'JSON with availability restrictions for this category';
COMMENT ON COLUMN employees.category_id IS 'Reference to employee category with default configurations';
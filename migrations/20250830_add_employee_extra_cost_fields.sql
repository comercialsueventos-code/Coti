-- Migration: Add extra cost fields to employees table
-- This allows employees to have default extra costs (ARL, bonifications, etc.)

-- Add extra cost fields to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS default_extra_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS default_extra_cost_reason TEXT DEFAULT NULL;

-- Create index for performance when filtering by extra costs
CREATE INDEX IF NOT EXISTS idx_employees_has_extra_cost ON employees(default_extra_cost) WHERE default_extra_cost > 0;

-- Add comments for documentation
COMMENT ON COLUMN employees.default_extra_cost IS 'Default extra cost for this employee (ARL, bonifications, etc.)';
COMMENT ON COLUMN employees.default_extra_cost_reason IS 'Reason for the extra cost (optional description)';

-- Add validation constraint to ensure extra cost is not negative
ALTER TABLE employees 
ADD CONSTRAINT check_default_extra_cost_non_negative 
CHECK (default_extra_cost >= 0);
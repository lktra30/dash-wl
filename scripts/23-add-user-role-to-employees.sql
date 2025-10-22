-- Migration: Add user_role column to employees table
-- This allows defining access levels for employees: admin, gestor, colaborador
-- The user_role determines what parts of the system the employee can access

-- Add user_role column to employees table
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_role TEXT DEFAULT 'colaborador' CHECK (user_role IN ('admin', 'gestor', 'colaborador'));

-- Create index for user_role for better performance
CREATE INDEX IF NOT EXISTS idx_employees_user_role ON employees(user_role);

-- Update existing employees to have 'colaborador' role if not set
UPDATE employees 
SET user_role = 'colaborador' 
WHERE user_role IS NULL;

-- Add comment to explain the column
COMMENT ON COLUMN employees.user_role IS 'Access level: admin (full access), gestor (access to goals, teams, employees), colaborador (CRM only)';

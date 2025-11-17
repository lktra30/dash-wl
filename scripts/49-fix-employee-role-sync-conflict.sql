-- Migration: Fix employee role synchronization conflict
-- This fixes the issue where the role field in employees was being overwritten
-- by the users.role field when it should only sync user_role
--
-- Problem:
-- When creating an employee with role="SDR" and user_role="admin", the trigger
-- on public.users was overwriting the employee.role field with users.role,
-- causing "SDR" to become "admin".
--
-- Solution:
-- Remove the role field from the UPDATE clause in the trigger function.
-- The employee.role field (job title: SDR, Closer, etc.) should be managed
-- independently from users.role (access level: admin, manager, sales).
-- Only user_role should be synced between the two tables.

BEGIN;

-- Drop and recreate the function to fix the conflict
DROP FUNCTION IF EXISTS public.handle_user_to_employee() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_user_to_employee()
RETURNS TRIGGER AS $$
DECLARE
  v_department TEXT;
  v_employee_role TEXT;
BEGIN
  -- Only create employee records for non-SuperAdmin users
  IF NEW.role != 'SuperAdmin' THEN
    
    -- Determine department based on role
    v_department := CASE 
      WHEN NEW.role = 'admin' THEN 'Management'
      WHEN NEW.role = 'manager' THEN 'Management'
      WHEN NEW.role = 'sales' THEN 'Sales'
      ELSE 'General'
    END;
    
    -- Determine employee access level (user_role)
    v_employee_role := CASE 
      WHEN NEW.role = 'admin' THEN 'admin'
      WHEN NEW.role = 'manager' THEN 'gestor'
      ELSE 'colaborador'
    END;
    
    -- Insert or update employee record
    INSERT INTO public.employees (
      id, 
      name, 
      email, 
      role, 
      department, 
      hire_date, 
      status, 
      avatar_url, 
      whitelabel_id,
      user_role,
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id, -- Use same ID as user for easy mapping
      NEW.name,
      NEW.email,
      NEW.role, -- Initial role from users table (will be updated manually later)
      v_department,
      CURRENT_DATE,
      'active',
      NEW.avatar_url,
      NEW.whitelabel_id,
      v_employee_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      -- DO NOT update role - it should be managed independently in employees table
      -- role = EXCLUDED.role,  -- REMOVED: This was causing the conflict
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.employees.avatar_url),
      whitelabel_id = EXCLUDED.whitelabel_id,
      user_role = EXCLUDED.user_role, -- Keep user_role in sync
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_user_to_employee
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_to_employee();

COMMENT ON FUNCTION public.handle_user_to_employee() IS 'Syncs public.users to public.employees. Note: employee.role is managed independently, only user_role is synced';

COMMIT;

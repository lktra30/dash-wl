-- Migration: Employee to Auth User Synchronization
-- When an employee is created, automatically create auth.users and public.users
-- Password is set to the employee's email for initial access

BEGIN;

-- ============================================================================
-- FUNCTION: Create auth user from employee
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_employee_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role TEXT;
  v_auth_user_id UUID;
  v_existing_auth UUID;
BEGIN
  -- Check if auth user already exists with this email
  SELECT id INTO v_existing_auth 
  FROM auth.users 
  WHERE email = NEW.email;
  
  -- Only create auth user if it doesn't exist
  IF v_existing_auth IS NULL THEN
    
    -- Determine the role for the user table (from employee.user_role or default)
    v_user_role := COALESCE(NEW.user_role, 'colaborador');
    
    -- Map employee user_role to users.role
    -- colaborador -> sales
    -- gestor -> manager
    -- admin -> admin
    v_user_role := CASE 
      WHEN v_user_role = 'colaborador' THEN 'sales'
      WHEN v_user_role = 'gestor' THEN 'manager'
      WHEN v_user_role = 'admin' THEN 'admin'
      ELSE 'sales'
    END;
    
    -- Create auth user with password = email
    -- The auth.users trigger will automatically create public.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      NEW.id, -- Use employee ID as auth user ID for easy mapping
      'authenticated',
      'authenticated',
      NEW.email,
      crypt(NEW.email, gen_salt('bf')), -- Password = email (use bcrypt)
      NOW(), -- Auto-confirm email
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'name', NEW.name,
        'role', v_user_role,
        'whitelabel_id', NEW.whitelabel_id::text,
        'is_superadmin', false
      ),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Created auth user for employee: % (%) with password = email', NEW.name, NEW.email;
    
  ELSE
    RAISE NOTICE 'Auth user already exists for email: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: On employee INSERT
-- ============================================================================

DROP TRIGGER IF EXISTS on_employee_create_auth ON public.employees;
CREATE TRIGGER on_employee_create_auth
  AFTER INSERT ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_employee_to_auth();

COMMENT ON FUNCTION public.handle_employee_to_auth() IS 'Automatically creates auth.users when employee is created. Password is set to email. The auth trigger will then create public.users.';

-- ============================================================================
-- BACKFILL: Create auth users for existing employees without them
-- ============================================================================

-- This will create auth.users for all existing employees that don't have auth
DO $$
DECLARE
  employee_record RECORD;
  v_user_role TEXT;
  v_count INTEGER := 0;
BEGIN
  FOR employee_record IN 
    SELECT e.id, e.email, e.name, e.user_role, e.whitelabel_id
    FROM public.employees e
    LEFT JOIN auth.users au ON e.email = au.email
    WHERE au.id IS NULL
  LOOP
    -- Determine role mapping
    v_user_role := COALESCE(employee_record.user_role, 'colaborador');
    v_user_role := CASE 
      WHEN v_user_role = 'colaborador' THEN 'sales'
      WHEN v_user_role = 'gestor' THEN 'manager'
      WHEN v_user_role = 'admin' THEN 'admin'
      ELSE 'sales'
    END;
    
    -- Create auth user
    BEGIN
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000',
        employee_record.id,
        'authenticated',
        'authenticated',
        employee_record.email,
        crypt(employee_record.email, gen_salt('bf')), -- Password = email
        NOW(),
        '{"provider":"email","providers":["email"]}',
        jsonb_build_object(
          'name', employee_record.name,
          'role', v_user_role,
          'whitelabel_id', employee_record.whitelabel_id::text,
          'is_superadmin', false
        ),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      );
      
      v_count := v_count + 1;
      RAISE NOTICE 'Created auth user for existing employee: % (%)', employee_record.name, employee_record.email;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to create auth user for %: %', employee_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete. Created % auth users for existing employees.', v_count;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check sync status after migration
SELECT 
  'Employees without auth users' as status,
  COUNT(*) as count
FROM public.employees e
LEFT JOIN auth.users au ON e.email = au.email
WHERE au.id IS NULL

UNION ALL

SELECT 
  'Employees without public users' as status,
  COUNT(*) as count
FROM public.employees e
LEFT JOIN public.users u ON e.email = u.email
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Total employees' as status,
  COUNT(*) as count
FROM public.employees;

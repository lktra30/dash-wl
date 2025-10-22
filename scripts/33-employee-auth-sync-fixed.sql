-- Migration: Employee to Auth User Synchronization
-- MODIFIED: All users (including admins) must have whitelabel_id
-- When an employee is created, automatically create auth.users and public.users
-- Password is set to the employee's email for initial access

BEGIN;

-- ============================================================================
-- FUNCTION: Create auth user from employee
-- MODIFIED: Ensures whitelabel_id is always set
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_employee_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role TEXT;
  v_auth_user_id UUID;
  v_existing_auth UUID;
  v_whitelabel_id UUID;
BEGIN
  -- Check if auth user already exists with this email
  SELECT id INTO v_existing_auth
  FROM auth.users
  WHERE email = NEW.email;

  -- Only create auth user if it doesn't exist
  IF v_existing_auth IS NULL THEN

    -- CRITICAL: Ensure whitelabel_id is set
    v_whitelabel_id := NEW.whitelabel_id;

    IF v_whitelabel_id IS NULL THEN
      -- Get first available whitelabel
      SELECT id INTO v_whitelabel_id FROM public.whitelabels ORDER BY created_at LIMIT 1;

      IF v_whitelabel_id IS NULL THEN
        RAISE EXCEPTION 'Cannot create auth user for employee %: no whitelabels exist', NEW.email;
      END IF;
    END IF;

    -- Determine the role for the user table (from employee.user_role or default)
    v_user_role := COALESCE(NEW.user_role, 'colaborador');

    -- Map employee user_role to users.role
    -- colaborador -> sales
    -- gestor -> manager
    -- admin -> admin
    -- SuperAdmin -> SuperAdmin
    v_user_role := CASE
      WHEN v_user_role = 'colaborador' THEN 'sales'
      WHEN v_user_role = 'gestor' THEN 'manager'
      WHEN v_user_role = 'admin' THEN 'admin'
      WHEN v_user_role = 'SuperAdmin' THEN 'SuperAdmin'
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
        'whitelabel_id', v_whitelabel_id::text  -- Always set
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

COMMENT ON FUNCTION public.handle_employee_to_auth() IS
'Automatically creates auth.users when employee is created. Password is set to email. All users have whitelabel_id.';

-- ============================================================================
-- BACKFILL: Create auth users for existing employees without them
-- ============================================================================

DO $$
DECLARE
  employee_record RECORD;
  v_user_role TEXT;
  v_whitelabel_id UUID;
  v_count INTEGER := 0;
  v_first_whitelabel UUID;
BEGIN
  -- Get first whitelabel for fallback
  SELECT id INTO v_first_whitelabel FROM public.whitelabels ORDER BY created_at LIMIT 1;

  IF v_first_whitelabel IS NULL THEN
    RAISE EXCEPTION 'No whitelabels found - cannot create auth users';
  END IF;

  FOR employee_record IN
    SELECT e.id, e.email, e.name, e.user_role, e.whitelabel_id
    FROM public.employees e
    LEFT JOIN auth.users au ON e.email = au.email
    WHERE au.id IS NULL
  LOOP
    -- Ensure whitelabel_id
    v_whitelabel_id := COALESCE(employee_record.whitelabel_id, v_first_whitelabel);

    -- Determine role mapping
    v_user_role := COALESCE(employee_record.user_role, 'colaborador');
    v_user_role := CASE
      WHEN v_user_role = 'colaborador' THEN 'sales'
      WHEN v_user_role = 'gestor' THEN 'manager'
      WHEN v_user_role = 'admin' THEN 'admin'
      WHEN v_user_role = 'SuperAdmin' THEN 'SuperAdmin'
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
          'whitelabel_id', v_whitelabel_id::text  -- Always set
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

SELECT
  'Employees without auth users' as status,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '⚠️ REVIEW' END as check_status
FROM public.employees e
LEFT JOIN auth.users au ON e.email = au.email
WHERE au.id IS NULL

UNION ALL

SELECT
  'Employees without public users' as status,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '⚠️ REVIEW' END as check_status
FROM public.employees e
LEFT JOIN public.users u ON e.email = u.email
WHERE u.id IS NULL

UNION ALL

SELECT
  'Total employees' as status,
  COUNT(*) as count,
  '📊 INFO' as check_status
FROM public.employees

UNION ALL

SELECT
  'Auth users without whitelabel_id' as status,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as check_status
FROM auth.users au
JOIN public.users u ON au.id = u.id
WHERE u.whitelabel_id IS NULL;

-- Migration: Complete synchronization functions for auth, users, employees and whitelabels
-- MODIFIED: SuperAdmin MUST have whitelabel_id (not null)
-- This ensures data consistency and proper RLS enforcement

BEGIN;

-- ============================================================================
-- PART 1: Improved auth.users -> public.users synchronization
-- MODIFIED: All users (including SuperAdmin) must have whitelabel_id
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_whitelabel_id UUID;
BEGIN
  -- Extract role
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'sales');

  -- Extract whitelabel_id from metadata
  v_whitelabel_id := (NEW.raw_user_meta_data->>'whitelabel_id')::uuid;

  -- CRITICAL CHANGE: ALL users (including SuperAdmin) MUST have whitelabel_id
  IF v_whitelabel_id IS NULL THEN
    -- Get first available whitelabel
    SELECT id INTO v_whitelabel_id FROM public.whitelabels ORDER BY created_at LIMIT 1;

    IF v_whitelabel_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create user: no whitelabels exist in the system';
    END IF;
  END IF;

  -- Insert or update user in public.users table
  INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_whitelabel_id,  -- Never NULL
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = EXCLUDED.role,
    whitelabel_id = EXCLUDED.whitelabel_id,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Automatically syncs auth.users to public.users. ALL users must have whitelabel_id';

-- ============================================================================
-- PART 2: public.users -> public.employees synchronization
-- MODIFIED: Create employees for ALL non-SuperAdmin users
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_to_employee()
RETURNS TRIGGER AS $$
DECLARE
  v_department TEXT;
  v_employee_role TEXT;
BEGIN
  -- Create employee records for all users EXCEPT SuperAdmin
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
      NEW.id,
      NEW.name,
      NEW.email,
      NEW.role,
      v_department,
      CURRENT_DATE,
      'active',
      NEW.avatar_url,
      NEW.whitelabel_id,  -- Always has value
      v_employee_role,
      NOW(),
      NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      department = EXCLUDED.department,
      avatar_url = COALESCE(EXCLUDED.avatar_url, public.employees.avatar_url),
      whitelabel_id = EXCLUDED.whitelabel_id,
      user_role = EXCLUDED.user_role,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on public.users
DROP TRIGGER IF EXISTS on_user_to_employee ON public.users;
CREATE TRIGGER on_user_to_employee
  AFTER INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_to_employee();

COMMENT ON FUNCTION public.handle_user_to_employee() IS
'Automatically syncs public.users to public.employees for non-SuperAdmin users';

-- ============================================================================
-- PART 3: Auto-create commission_settings when whitelabel is created
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_whitelabel()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default commission settings for the new whitelabel
  INSERT INTO public.commissions_settings (
    whitelabel_id,
    checkpoint_1_percent,
    checkpoint_2_percent,
    checkpoint_3_percent,
    checkpoint_1_commission_percent,
    checkpoint_2_commission_percent,
    checkpoint_3_commission_percent,
    sdr_meeting_commission,
    sdr_meetings_target,
    sdr_bonus_closed_meeting,
    closer_commission_percent,
    closer_sales_target,
    closer_fixed_commission,
    closer_per_sale_commission,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    50.00,  -- 50% of target for tier 1
    75.00,  -- 75% of target for tier 2
    100.00, -- 100% of target for tier 3
    50.00,  -- 50% commission at tier 1
    75.00,  -- 75% commission at tier 2
    100.00, -- 100% commission at tier 3
    50.00,  -- R$ 50 per meeting for SDRs
    20,     -- 20 meetings target per month
    100.00, -- R$ 100 bonus when meeting converts
    10.00,  -- 10% commission on sales
    10000.00, -- R$ 10,000 sales target
    0.00,   -- No fixed commission by default
    0.00,   -- No per-sale commission by default
    NOW(),
    NOW()
  )
  ON CONFLICT (whitelabel_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on whitelabels
DROP TRIGGER IF EXISTS on_whitelabel_created ON public.whitelabels;
CREATE TRIGGER on_whitelabel_created
  AFTER INSERT ON public.whitelabels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_whitelabel();

COMMENT ON FUNCTION public.handle_new_whitelabel() IS
'Automatically creates default commission settings when a whitelabel is created';

-- ============================================================================
-- PART 4: Backfill existing data
-- ============================================================================

DO $$
DECLARE
  v_first_whitelabel UUID;
BEGIN
  -- Get first whitelabel
  SELECT id INTO v_first_whitelabel FROM public.whitelabels ORDER BY created_at LIMIT 1;

  IF v_first_whitelabel IS NULL THEN
    RAISE EXCEPTION 'No whitelabels found - cannot proceed with backfill';
  END IF;

  -- Update any users without whitelabel_id
  UPDATE public.users
  SET whitelabel_id = v_first_whitelabel,
      updated_at = NOW()
  WHERE whitelabel_id IS NULL;

  RAISE NOTICE 'Backfill: Updated users without whitelabel_id';
END $$;

-- Sync existing auth users to public.users (if any are missing)
INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'role', 'sales'),
  COALESCE(
    (au.raw_user_meta_data->>'whitelabel_id')::uuid,
    (SELECT id FROM public.whitelabels ORDER BY created_at LIMIT 1)
  ),
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Sync existing users to employees (if any are missing)
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
SELECT
  u.id,
  u.name,
  u.email,
  u.role,
  CASE
    WHEN u.role = 'admin' THEN 'Management'
    WHEN u.role = 'manager' THEN 'Management'
    WHEN u.role = 'sales' THEN 'Sales'
    ELSE 'General'
  END,
  CURRENT_DATE,
  'active',
  u.avatar_url,
  u.whitelabel_id,
  CASE
    WHEN u.role = 'admin' THEN 'admin'
    WHEN u.role = 'manager' THEN 'gestor'
    ELSE 'colaborador'
  END,
  u.created_at,
  NOW()
FROM public.users u
LEFT JOIN public.employees e ON u.email = e.email
WHERE u.role != 'SuperAdmin'
  AND e.id IS NULL
ON CONFLICT (email) DO NOTHING;

-- Create default commission settings for existing whitelabels (if missing)
INSERT INTO public.commissions_settings (
  whitelabel_id,
  checkpoint_1_percent,
  checkpoint_2_percent,
  checkpoint_3_percent,
  checkpoint_1_commission_percent,
  checkpoint_2_commission_percent,
  checkpoint_3_commission_percent,
  sdr_meeting_commission,
  sdr_meetings_target,
  sdr_bonus_closed_meeting,
  closer_commission_percent,
  closer_sales_target,
  closer_fixed_commission,
  closer_per_sale_commission,
  created_at,
  updated_at
)
SELECT
  w.id,
  50.00, 75.00, 100.00,
  50.00, 75.00, 100.00,
  50.00, 20, 100.00,
  10.00, 10000.00,
  0.00, 0.00,
  NOW(), NOW()
FROM public.whitelabels w
LEFT JOIN public.commissions_settings cs ON w.id = cs.whitelabel_id
WHERE cs.id IS NULL
ON CONFLICT (whitelabel_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users

UNION ALL

SELECT
  'Public Users' as table_name,
  COUNT(*) as count
FROM public.users

UNION ALL

SELECT
  'Employees' as table_name,
  COUNT(*) as count
FROM public.employees

UNION ALL

SELECT
  'Commission Settings' as table_name,
  COUNT(*) as count
FROM public.commissions_settings

UNION ALL

SELECT
  'Users without whitelabel (should be 0)' as table_name,
  COUNT(*) as count
FROM public.users
WHERE whitelabel_id IS NULL

UNION ALL

SELECT
  'SuperAdmins without whitelabel (should be 0)' as table_name,
  COUNT(*) as count
FROM public.users
WHERE role = 'SuperAdmin' AND whitelabel_id IS NULL;

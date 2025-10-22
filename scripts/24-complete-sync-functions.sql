-- Migration: Complete synchronization functions for auth, users, employees and whitelabels
-- This ensures data consistency across all tables

BEGIN;

-- ============================================================================
-- PART 1: Improved auth.users -> public.users synchronization
-- ============================================================================

-- Drop existing trigger and function to recreate with improvements
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create improved function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_whitelabel_id UUID;
  v_is_superadmin BOOLEAN;
BEGIN
  -- Extract metadata
  v_is_superadmin := COALESCE((NEW.raw_user_meta_data->>'is_superadmin')::boolean, false);
  
  -- Determine role
  IF v_is_superadmin THEN
    v_role := 'SuperAdmin';
    v_whitelabel_id := NULL; -- SuperAdmin doesn't belong to a specific whitelabel
  ELSE
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'sales');
    v_whitelabel_id := (NEW.raw_user_meta_data->>'whitelabel_id')::uuid;
    
    -- If whitelabel_id is missing for non-superadmin, try to get the first available whitelabel
    IF v_whitelabel_id IS NULL THEN
      SELECT id INTO v_whitelabel_id FROM public.whitelabels LIMIT 1;
    END IF;
  END IF;

  -- Insert or update user in public.users table
  INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_whitelabel_id,
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

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically syncs auth.users to public.users, handling SuperAdmin detection';

-- ============================================================================
-- PART 2: public.users -> public.employees synchronization
-- ============================================================================

-- Create function to sync public.users to public.employees
-- Only creates employees for non-SuperAdmin users
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
      NEW.role,
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

COMMENT ON FUNCTION public.handle_user_to_employee() IS 'Automatically syncs public.users to public.employees for non-SuperAdmin users';

-- ============================================================================
-- PART 3: Auto-create commission_settings when whitelabel is created
-- ============================================================================

-- Create function to initialize commission settings for new whitelabels
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
    NOW(),
    NOW()
  )
  ON CONFLICT (whitelabel_id) DO NOTHING; -- Don't overwrite if already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on whitelabels
DROP TRIGGER IF EXISTS on_whitelabel_created ON public.whitelabels;
CREATE TRIGGER on_whitelabel_created
  AFTER INSERT ON public.whitelabels
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_whitelabel();

COMMENT ON FUNCTION public.handle_new_whitelabel() IS 'Automatically creates default commission settings when a whitelabel is created';

-- ============================================================================
-- PART 4: Backfill existing data
-- ============================================================================

-- Sync existing auth users to public.users (if any are missing)
INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  CASE 
    WHEN COALESCE((au.raw_user_meta_data->>'is_superadmin')::boolean, false) THEN 'SuperAdmin'
    ELSE COALESCE(au.raw_user_meta_data->>'role', 'sales')
  END,
  CASE 
    WHEN COALESCE((au.raw_user_meta_data->>'is_superadmin')::boolean, false) THEN NULL
    ELSE (au.raw_user_meta_data->>'whitelabel_id')::uuid
  END,
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
  created_at,
  updated_at
)
SELECT 
  w.id,
  50.00,
  75.00,
  100.00,
  50.00,
  75.00,
  100.00,
  50.00,
  20,
  100.00,
  10.00,
  10000.00,
  NOW(),
  NOW()
FROM public.whitelabels w
LEFT JOIN public.commissions_settings cs ON w.id = cs.whitelabel_id
WHERE cs.id IS NULL
ON CONFLICT (whitelabel_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Verification queries (for manual testing)
-- ============================================================================

-- Uncomment these to verify the migration worked:

-- SELECT 'Auth Users Count:', COUNT(*) FROM auth.users;
-- SELECT 'Public Users Count:', COUNT(*) FROM public.users;
-- SELECT 'Employees Count:', COUNT(*) FROM public.employees;
-- SELECT 'Commission Settings Count:', COUNT(*) FROM public.commissions_settings;

-- SELECT 'SuperAdmins:', COUNT(*) FROM public.users WHERE role = 'SuperAdmin';
-- SELECT 'Users without whitelabel (should only be SuperAdmins):', COUNT(*) FROM public.users WHERE whitelabel_id IS NULL;

-- SELECT 'Employees that are SuperAdmin (should be 0):', COUNT(*) FROM public.employees e
-- INNER JOIN public.users u ON e.email = u.email
-- WHERE u.role = 'SuperAdmin';

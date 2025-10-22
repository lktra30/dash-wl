-- ====================================================================
-- FIX RLS POLICIES - Support both users and employees tables
-- ====================================================================
-- This script fixes RLS policies to check BOTH users and employees tables
-- for role verification, solving the 404 error for users that only exist
-- in the employees table
--
-- Problem: Policies only checked users.role, but some users have their
-- role in employees.user_role instead
-- ====================================================================

-- ====================================================================
-- STEP 1: Drop existing policies
-- ====================================================================
DROP POLICY IF EXISTS "Admins and SuperAdmins can insert commission settings" ON commissions_settings;
DROP POLICY IF EXISTS "Admins and SuperAdmins can update commission settings" ON commissions_settings;
DROP POLICY IF EXISTS "Admins and SuperAdmins can delete commission settings" ON commissions_settings;

-- ====================================================================
-- STEP 2: Create improved policies that check BOTH tables
-- ====================================================================

-- Helper function to check if user is admin (checks both tables)
CREATE OR REPLACE FUNCTION is_admin_or_superadmin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check employees table first (user_role column)
  IF EXISTS (
    SELECT 1 FROM employees
    WHERE id = user_id
    AND status = 'active'
    AND (
      user_role = 'admin'
      OR user_role = 'SuperAdmin'
      OR LOWER(user_role) = 'admin'
      OR LOWER(user_role) = 'superadmin'
    )
  ) THEN
    RETURN true;
  END IF;

  -- Then check users table (role column)
  IF EXISTS (
    SELECT 1 FROM users
    WHERE id = user_id
    AND (
      role = 'admin'
      OR role = 'SuperAdmin'
      OR LOWER(role) = 'admin'
      OR LOWER(role) = 'superadmin'
    )
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Helper function to get user's whitelabel_id (checks both tables)
CREATE OR REPLACE FUNCTION get_user_whitelabel_id(user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  wl_id uuid;
BEGIN
  -- Try employees table first
  SELECT whitelabel_id INTO wl_id
  FROM employees
  WHERE id = user_id AND status = 'active'
  LIMIT 1;

  IF wl_id IS NOT NULL THEN
    RETURN wl_id;
  END IF;

  -- Then try users table
  SELECT whitelabel_id INTO wl_id
  FROM users
  WHERE id = user_id
  LIMIT 1;

  RETURN wl_id;
END;
$$;

-- ====================================================================
-- INSERT Policy: Check both tables for admin role
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can insert commission settings"
  ON commissions_settings
  FOR INSERT
  WITH CHECK (
    is_admin_or_superadmin(auth.uid())
    AND whitelabel_id = get_user_whitelabel_id(auth.uid())
  );

-- ====================================================================
-- UPDATE Policy: Check both tables for admin role
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can update commission settings"
  ON commissions_settings
  FOR UPDATE
  USING (
    is_admin_or_superadmin(auth.uid())
    AND whitelabel_id = get_user_whitelabel_id(auth.uid())
  )
  WITH CHECK (
    is_admin_or_superadmin(auth.uid())
    AND whitelabel_id = get_user_whitelabel_id(auth.uid())
  );

-- ====================================================================
-- DELETE Policy: Check both tables for admin role
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can delete commission settings"
  ON commissions_settings
  FOR DELETE
  USING (
    is_admin_or_superadmin(auth.uid())
    AND whitelabel_id = get_user_whitelabel_id(auth.uid())
  );

-- ====================================================================
-- Verify the changes
-- ====================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '1. Created helper function: is_admin_or_superadmin()';
  RAISE NOTICE '2. Created helper function: get_user_whitelabel_id()';
  RAISE NOTICE '3. Updated INSERT policy to check both users and employees tables';
  RAISE NOTICE '4. Updated UPDATE policy to check both users and employees tables';
  RAISE NOTICE '5. Updated DELETE policy to check both users and employees tables';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security maintained: Users can only access their own whitelabel data';
  RAISE NOTICE '👥 Now supports users in both users and employees tables';
END $$;

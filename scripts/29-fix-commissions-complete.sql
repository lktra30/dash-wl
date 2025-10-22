-- ====================================================================
-- FIX COMMISSIONS SETTINGS - Complete Solution
-- ====================================================================
-- This script fixes the 404 error when updating commission settings
--
-- Problems fixed:
-- 1. Adds missing columns (closer_fixed_commission, closer_per_sale_commission)
-- 2. Fixes RLS policies to support both 'admin' and 'SuperAdmin' roles
-- 3. Ensures proper SELECT after UPDATE/INSERT operations
-- ====================================================================

-- ====================================================================
-- STEP 1: Add missing columns to commissions_settings table
-- ====================================================================

-- Add closer_fixed_commission column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_settings'
    AND column_name = 'closer_fixed_commission'
  ) THEN
    ALTER TABLE commissions_settings
    ADD COLUMN closer_fixed_commission DECIMAL(10,2) DEFAULT 0
    CHECK (closer_fixed_commission >= 0);

    RAISE NOTICE 'Added column: closer_fixed_commission';
  ELSE
    RAISE NOTICE 'Column closer_fixed_commission already exists';
  END IF;
END $$;

-- Add closer_per_sale_commission column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'commissions_settings'
    AND column_name = 'closer_per_sale_commission'
  ) THEN
    ALTER TABLE commissions_settings
    ADD COLUMN closer_per_sale_commission DECIMAL(10,2) DEFAULT 0
    CHECK (closer_per_sale_commission >= 0);

    RAISE NOTICE 'Added column: closer_per_sale_commission';
  ELSE
    RAISE NOTICE 'Column closer_per_sale_commission already exists';
  END IF;
END $$;

-- ====================================================================
-- STEP 2: Fix RLS policies to support both 'admin' and 'SuperAdmin'
-- ====================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert commission settings" ON commissions_settings;
DROP POLICY IF EXISTS "Admins can update commission settings" ON commissions_settings;
DROP POLICY IF EXISTS "Admins can delete commission settings" ON commissions_settings;

-- ====================================================================
-- INSERT Policy: Allow admin and SuperAdmin to insert
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can insert commission settings"
  ON commissions_settings
  FOR INSERT
  WITH CHECK (
    whitelabel_id IN (
      SELECT whitelabel_id
      FROM users
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR role = 'SuperAdmin'
        OR LOWER(role) = 'admin'
        OR LOWER(role) = 'superadmin'
      )
    )
  );

-- ====================================================================
-- UPDATE Policy: Allow admin and SuperAdmin to update
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can update commission settings"
  ON commissions_settings
  FOR UPDATE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id
      FROM users
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR role = 'SuperAdmin'
        OR LOWER(role) = 'admin'
        OR LOWER(role) = 'superadmin'
      )
    )
  )
  WITH CHECK (
    whitelabel_id IN (
      SELECT whitelabel_id
      FROM users
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR role = 'SuperAdmin'
        OR LOWER(role) = 'admin'
        OR LOWER(role) = 'superadmin'
      )
    )
  );

-- ====================================================================
-- DELETE Policy: Allow admin and SuperAdmin to delete
-- ====================================================================
CREATE POLICY "Admins and SuperAdmins can delete commission settings"
  ON commissions_settings
  FOR DELETE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id
      FROM users
      WHERE id = auth.uid()
      AND (
        role = 'admin'
        OR role = 'SuperAdmin'
        OR LOWER(role) = 'admin'
        OR LOWER(role) = 'superadmin'
      )
    )
  );

-- ====================================================================
-- Verify the changes
-- ====================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '1. Added closer_fixed_commission column';
  RAISE NOTICE '2. Added closer_per_sale_commission column';
  RAISE NOTICE '3. Updated INSERT policy to support admin and SuperAdmin';
  RAISE NOTICE '4. Updated UPDATE policy to support admin and SuperAdmin';
  RAISE NOTICE '5. Updated DELETE policy to support admin and SuperAdmin';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 Security maintained: Users can only access their own whitelabel data';
END $$;

-- ====================================================================
-- Optional: Update existing records to set default values
-- ====================================================================
UPDATE commissions_settings
SET
  closer_fixed_commission = COALESCE(closer_fixed_commission, 0),
  closer_per_sale_commission = COALESCE(closer_per_sale_commission, 0)
WHERE
  closer_fixed_commission IS NULL
  OR closer_per_sale_commission IS NULL;

-- Fix RLS policies for commissions_settings
-- Allow all authenticated users to read commission settings for their whitelabel
-- Only admins can modify (insert/update/delete)

-- Drop existing restrictive SELECT policy
DROP POLICY IF EXISTS "Admins can view commission settings" ON commissions_settings;

-- Create new policy: All authenticated users can view commission settings in their whitelabel
CREATE POLICY "Users can view commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
    )
  );

-- Ensure superadmins can view all commission settings
CREATE POLICY "Superadmins can view all commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Keep admin-only policies for modifications (already exist, but ensure they're correct)
-- Note: The insert/update/delete policies already exist and are correct

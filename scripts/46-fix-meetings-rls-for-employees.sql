-- Fix RLS policies for meetings table to work with employees table
-- Drop old policies that reference users table
DROP POLICY IF EXISTS "Users can view meetings" ON meetings;
DROP POLICY IF EXISTS "SDRs can create meetings" ON meetings;
DROP POLICY IF EXISTS "Users can update meetings" ON meetings;
DROP POLICY IF EXISTS "Admins and managers can delete meetings" ON meetings;

-- Create new policies that work with both users and employees tables

-- Policy: Users/Employees can view meetings in their whitelabel
CREATE POLICY "Users can view meetings"
  ON meetings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
      UNION
      SELECT whitelabel_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: SDRs can create meetings in their whitelabel
CREATE POLICY "SDRs can create meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
      UNION
      SELECT whitelabel_id FROM employees WHERE id = auth.uid()
    )
  );

-- Policy: Users can update their own meetings, admins/managers can update all
CREATE POLICY "Users can update meetings"
  ON meetings
  FOR UPDATE
  USING (
    sdr_id = auth.uid() OR
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
      UNION
      SELECT whitelabel_id FROM employees WHERE id = auth.uid() AND user_role IN ('admin', 'gestor')
    )
  );

-- Policy: Admins and managers can delete meetings
CREATE POLICY "Admins and managers can delete meetings"
  ON meetings
  FOR DELETE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
      UNION
      SELECT whitelabel_id FROM employees WHERE id = auth.uid() AND user_role IN ('admin', 'gestor')
    )
  );

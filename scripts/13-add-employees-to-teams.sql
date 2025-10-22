-- Migration: Add employee support to team_members table
-- This allows teams to include employees (SDRs, Closers, etc.) in addition to or instead of users

-- Step 1: Add employee_id column to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- Step 2: Create index for employee_id
CREATE INDEX IF NOT EXISTS idx_team_members_employee ON team_members(employee_id);

-- Step 3: Make user_id nullable (since we can now have team members that are employees only)
ALTER TABLE team_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Step 4: Add constraint to ensure either user_id or employee_id is provided (but not both null)
ALTER TABLE team_members 
ADD CONSTRAINT team_members_user_or_employee_check 
CHECK (
  (user_id IS NOT NULL AND employee_id IS NULL) OR 
  (user_id IS NULL AND employee_id IS NOT NULL) OR
  (user_id IS NOT NULL AND employee_id IS NOT NULL)
);

-- Step 5: Update the unique constraint to include employee_id scenarios
-- First, drop the old constraint
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_team_id_user_id_key;

-- Add new unique constraints
-- One employee cannot be added to the same team twice
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_employee_unique 
ON team_members(team_id, employee_id) 
WHERE employee_id IS NOT NULL;

-- One user cannot be added to the same team twice (keeping existing behavior)
CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_user_unique 
ON team_members(team_id, user_id) 
WHERE user_id IS NOT NULL;

-- Step 6: Update RLS policies for team_members to include employee access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view team members from their whitelabel" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members from their whitelabel" ON team_members;

-- Create new policies that work with both users and employees
CREATE POLICY "Users can view team members from their whitelabel"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can manage team members"
ON team_members FOR ALL
USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE whitelabel_id IN (
      SELECT whitelabel_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

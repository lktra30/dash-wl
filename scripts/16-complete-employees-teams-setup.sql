-- Comprehensive migration to add employees to teams feature
-- Run this script in your Supabase SQL Editor

-- ============================================
-- STEP 1: Update team_members table structure
-- ============================================

-- Add employee_id column to team_members table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id) ON DELETE CASCADE;

-- Create index for employee_id
CREATE INDEX IF NOT EXISTS idx_team_members_employee ON team_members(employee_id);

-- Make user_id nullable (since we can now have team members that are employees only)
ALTER TABLE team_members 
ALTER COLUMN user_id DROP NOT NULL;

-- Add constraint to ensure either user_id or employee_id is provided
ALTER TABLE team_members 
DROP CONSTRAINT IF EXISTS team_members_user_or_employee_check;

ALTER TABLE team_members 
ADD CONSTRAINT team_members_user_or_employee_check 
CHECK (
  (user_id IS NOT NULL AND employee_id IS NULL) OR 
  (user_id IS NULL AND employee_id IS NOT NULL) OR
  (user_id IS NOT NULL AND employee_id IS NOT NULL)
);

-- Update unique constraints
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_team_id_user_id_key;

-- One employee cannot be added to the same team twice
DROP INDEX IF EXISTS team_members_team_employee_unique;
CREATE UNIQUE INDEX team_members_team_employee_unique 
ON team_members(team_id, employee_id) 
WHERE employee_id IS NOT NULL;

-- One user cannot be added to the same team twice
DROP INDEX IF EXISTS team_members_team_user_unique;
CREATE UNIQUE INDEX team_members_team_user_unique 
ON team_members(team_id, user_id) 
WHERE user_id IS NOT NULL;

-- ============================================
-- STEP 2: Update team_members RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view team members from their whitelabel" ON team_members;
DROP POLICY IF EXISTS "Users can manage team members from their whitelabel" ON team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON team_members;

-- Create new policies that work with both users and employees
CREATE POLICY "Users can view team members from their whitelabel"
ON team_members FOR SELECT
TO authenticated
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
TO authenticated
USING (
  team_id IN (
    SELECT id FROM teams 
    WHERE whitelabel_id IN (
      SELECT whitelabel_id FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
);

-- ============================================
-- STEP 3: Fix employees RLS policies
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access employees from their whitelabel" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Users can view employees from their whitelabel" ON employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON employees;
DROP POLICY IF EXISTS "Admins can update employees" ON employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON employees;

-- Create new comprehensive RLS policies

-- Policy 1: Users can view employees from their whitelabel
CREATE POLICY "Users can view employees from their whitelabel"
ON employees FOR SELECT
TO authenticated
USING (
  whitelabel_id IN (
    SELECT whitelabel_id 
    FROM users 
    WHERE id = auth.uid()
  )
);

-- Policy 2: Admins can insert employees
CREATE POLICY "Admins can insert employees"
ON employees FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND whitelabel_id = employees.whitelabel_id
  )
);

-- Policy 3: Admins can update employees
CREATE POLICY "Admins can update employees"
ON employees FOR UPDATE
TO authenticated
USING (
  whitelabel_id IN (
    SELECT whitelabel_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  whitelabel_id IN (
    SELECT whitelabel_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Policy 4: Admins can delete employees
CREATE POLICY "Admins can delete employees"
ON employees FOR DELETE
TO authenticated
USING (
  whitelabel_id IN (
    SELECT whitelabel_id 
    FROM users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 4: Seed test employees (OPTIONAL)
-- ============================================

-- Insert SDRs
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'João Silva' as name,
  'joao.silva@example.com' as email,
  '+55 11 98765-4321' as phone,
  'SDR' as role,
  'Sales' as department,
  '2024-01-15' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Maria Santos' as name,
  'maria.santos@example.com' as email,
  '+55 11 98765-4322' as phone,
  'SDR' as role,
  'Sales' as department,
  '2024-02-20' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Insert Closers
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Pedro Oliveira' as name,
  'pedro.oliveira@example.com' as email,
  '+55 11 98765-4323' as phone,
  'Closer' as role,
  'Sales' as department,
  '2024-01-10' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
LIMIT 1
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Ana Costa' as name,
  'ana.costa@example.com' as email,
  '+55 11 98765-4324' as phone,
  'Closer' as role,
  'Sales' as department,
  '2024-03-01' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
LIMIT 1
ON CONFLICT (email) DO NOTHING;

-- Insert employee who does both roles (SDR/Closer)
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Carlos Mendes' as name,
  'carlos.mendes@example.com' as email,
  '+55 11 98765-4325' as phone,
  'SDR/Closer' as role,
  'Sales' as department,
  '2023-11-15' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
LIMIT 1
ON CONFLICT (email) DO NOTHING;

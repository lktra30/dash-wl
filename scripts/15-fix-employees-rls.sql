-- Fix employees RLS policies to allow proper access
-- This ensures employees can be fetched by authenticated users from their whitelabel

-- Drop existing policies
DROP POLICY IF EXISTS "Users can only access employees from their whitelabel" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;

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

-- Migration: Sync users table IDs with Supabase Auth UIDs
-- This fixes RLS policies by ensuring users.id matches auth.uid()

BEGIN;

-- Step 1: Update existing user that has an auth account
-- We need to update foreign key references first, then the primary key

-- Update team_members references
UPDATE team_members 
SET user_id = '10047a97-02db-4876-91ca-6e98b04ed3f6'::uuid
WHERE user_id = 'a1111111-1111-1111-1111-111111111111'::uuid;

-- Update activities references
UPDATE activities 
SET user_id = '10047a97-02db-4876-91ca-6e98b04ed3f6'::uuid
WHERE user_id = 'a1111111-1111-1111-1111-111111111111'::uuid;

-- Update meetings.sdr_id references
UPDATE meetings 
SET sdr_id = '10047a97-02db-4876-91ca-6e98b04ed3f6'::uuid
WHERE sdr_id = 'a1111111-1111-1111-1111-111111111111'::uuid;

-- Update user_commissions references
UPDATE user_commissions 
SET user_id = '10047a97-02db-4876-91ca-6e98b04ed3f6'::uuid
WHERE user_id = 'a1111111-1111-1111-1111-111111111111'::uuid;

-- Step 2: Now update the users table primary key
UPDATE users 
SET id = '10047a97-02db-4876-91ca-6e98b04ed3f6'::uuid
WHERE email = 'admin@acme.com';

-- Step 3: Create a function to automatically sync new auth users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user in public.users table
  INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales'),
    (NEW.raw_user_meta_data->>'whitelabel_id')::uuid,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 5: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;

COMMIT;

-- Verification queries (run these manually to check):
-- SELECT 'Auth Users:', id, email FROM auth.users;
-- SELECT 'Public Users:', id, email FROM public.users;
-- SELECT 'Team Members:', COUNT(*) FROM team_members WHERE user_id = '10047a97-02db-4876-91ca-6e98b04ed3f6';

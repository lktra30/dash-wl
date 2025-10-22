-- Migration: Sync users table IDs with Supabase Auth UIDs
-- MODIFIED: SuperAdmin MUST have whitelabel_id (not null)
-- This ensures consistent RLS and data isolation

BEGIN;

-- ============================================================================
-- FUNCTION: Sync auth.users to public.users
-- MODIFIED: SuperAdmin gets first whitelabel (or specified one)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT;
  v_whitelabel_id UUID;
BEGIN
  -- Extract role from metadata
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'sales');

  -- Extract whitelabel_id from metadata
  v_whitelabel_id := (NEW.raw_user_meta_data->>'whitelabel_id')::uuid;

  -- IMPORTANT CHANGE: SuperAdmin MUST have a whitelabel_id
  -- If not provided, use the first available whitelabel
  IF v_whitelabel_id IS NULL THEN
    SELECT id INTO v_whitelabel_id FROM public.whitelabels ORDER BY created_at LIMIT 1;

    -- If still null (no whitelabels exist), this will fail - which is correct
    -- because every user MUST belong to a whitelabel
    IF v_whitelabel_id IS NULL THEN
      RAISE EXCEPTION 'Cannot create user: no whitelabels exist in the system';
    END IF;
  END IF;

  -- Insert or update user in public.users table
  -- ALL users (including SuperAdmin) now have whitelabel_id
  INSERT INTO public.users (id, email, name, role, whitelabel_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_role,
    v_whitelabel_id,  -- Always has a value now
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    role = EXCLUDED.role,
    whitelabel_id = EXCLUDED.whitelabel_id,  -- Can be updated
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
'Syncs auth.users to public.users. ALL users (including SuperAdmin) must have whitelabel_id';

-- ============================================================================
-- BACKFILL: Update existing users to have whitelabel_id
-- ============================================================================

DO $$
DECLARE
  v_first_whitelabel UUID;
BEGIN
  -- Get the first whitelabel
  SELECT id INTO v_first_whitelabel FROM public.whitelabels ORDER BY created_at LIMIT 1;

  IF v_first_whitelabel IS NOT NULL THEN
    -- Update any users without whitelabel_id
    UPDATE public.users
    SET whitelabel_id = v_first_whitelabel,
        updated_at = NOW()
    WHERE whitelabel_id IS NULL;

    RAISE NOTICE 'Updated % users to have whitelabel_id', (SELECT COUNT(*) FROM public.users WHERE whitelabel_id = v_first_whitelabel);
  ELSE
    RAISE WARNING 'No whitelabels found - cannot update users';
  END IF;
END $$;

-- ============================================================================
-- CONSTRAINT: Ensure whitelabel_id is NOT NULL
-- ============================================================================

-- Add NOT NULL constraint if it doesn't exist
DO $$
BEGIN
  -- First check if there are any NULL values
  IF EXISTS (SELECT 1 FROM public.users WHERE whitelabel_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: some users have NULL whitelabel_id. Run backfill first.';
  END IF;

  -- Add constraint
  ALTER TABLE public.users
    ALTER COLUMN whitelabel_id SET NOT NULL;

  RAISE NOTICE '✅ Added NOT NULL constraint to users.whitelabel_id';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Constraint may already exist or other error: %', SQLERRM;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  'Users without whitelabel_id' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM public.users
WHERE whitelabel_id IS NULL

UNION ALL

SELECT
  'SuperAdmins without whitelabel_id' as check_name,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅ PASS' ELSE '❌ FAIL' END as status
FROM public.users
WHERE role = 'SuperAdmin' AND whitelabel_id IS NULL;

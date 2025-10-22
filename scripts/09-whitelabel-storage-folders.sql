-- ============================================================================
-- Whitelabel Storage Folder Isolation
-- ============================================================================
-- This script sets up automatic folder creation and access control for the
-- Images bucket, ensuring each whitelabel can only access their own folder.
--
-- Folder structure: Images/{whitelabel_id}/
--
-- Features:
-- 1. Automatic folder creation when a whitelabel is created
-- 2. RLS policies to enforce folder isolation
-- 3. Each whitelabel can only access files in their own folder
-- ============================================================================

-- Create Images bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'Images'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('Images', 'Images', false);
  END IF;
END $$;

-- ============================================================================
-- Step 1: Create trigger function to automatically create folders
-- ============================================================================

-- This function creates a folder marker file when a new whitelabel is created
-- The folder marker ensures the folder exists in the storage bucket
CREATE OR REPLACE FUNCTION public.create_whitelabel_storage_folder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a .keep file to create the folder structure
  -- This is a marker file that ensures the folder exists
  INSERT INTO storage.objects (bucket_id, name, owner, metadata)
  VALUES (
    'Images',
    NEW.id::text || '/.keep',
    NULL, -- System-created, no owner
    '{"folder_marker": true}'::jsonb
  )
  ON CONFLICT (bucket_id, name) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger to call the function on whitelabel insert
DROP TRIGGER IF EXISTS create_whitelabel_folder_trigger ON whitelabels;

CREATE TRIGGER create_whitelabel_folder_trigger
  AFTER INSERT ON whitelabels
  FOR EACH ROW
  EXECUTE FUNCTION public.create_whitelabel_storage_folder();

-- ============================================================================
-- Step 2: Create RLS policies for folder isolation
-- ============================================================================

-- Note: RLS is already enabled on storage.objects table by default
-- We only need to create the policies

-- Drop existing policies if they exist (use DROP POLICY instead of DROP POLICY IF EXISTS)
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Whitelabel folder access for SELECT" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Whitelabel folder access for INSERT" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Whitelabel folder access for UPDATE" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Whitelabel folder access for DELETE" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Policy 1: Allow users to SELECT (view/download) files in their whitelabel folder
CREATE POLICY "Whitelabel folder access for SELECT"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'Images' 
  AND 
  -- Extract the whitelabel_id from the path (first folder in the path)
  (storage.foldername(name))[1] = (
    SELECT users.whitelabel_id::text
    FROM users
    WHERE users.id = auth.uid()
  )
);

-- Policy 2: Allow users to INSERT (upload) files to their whitelabel folder
CREATE POLICY "Whitelabel folder access for INSERT"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Images'
  AND
  -- Ensure the file is being uploaded to the user's whitelabel folder
  (storage.foldername(name))[1] = (
    SELECT users.whitelabel_id::text
    FROM users
    WHERE users.id = auth.uid()
  )
);

-- Policy 3: Allow users to UPDATE files in their whitelabel folder
CREATE POLICY "Whitelabel folder access for UPDATE"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Images'
  AND
  (storage.foldername(name))[1] = (
    SELECT users.whitelabel_id::text
    FROM users
    WHERE users.id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'Images'
  AND
  (storage.foldername(name))[1] = (
    SELECT users.whitelabel_id::text
    FROM users
    WHERE users.id = auth.uid()
  )
);

-- Policy 4: Allow users to DELETE files from their whitelabel folder
CREATE POLICY "Whitelabel folder access for DELETE"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Images'
  AND
  (storage.foldername(name))[1] = (
    SELECT users.whitelabel_id::text
    FROM users
    WHERE users.id = auth.uid()
  )
);

-- ============================================================================
-- Step 3: Create folders for existing whitelabels
-- ============================================================================

-- For any existing whitelabels that don't have folders yet, create them
DO $$
DECLARE
  whitelabel_record RECORD;
BEGIN
  FOR whitelabel_record IN 
    SELECT w.id 
    FROM whitelabels w
    LEFT JOIN storage.objects so ON 
      so.bucket_id = 'Images' AND 
      so.name = w.id::text || '/.keep'
    WHERE so.name IS NULL
  LOOP
    INSERT INTO storage.objects (bucket_id, name, owner, metadata)
    VALUES (
      'Images',
      whitelabel_record.id::text || '/.keep',
      NULL,
      '{"folder_marker": true}'::jsonb
    )
    ON CONFLICT (bucket_id, name) DO NOTHING;
  END LOOP;
END $$;

-- ============================================================================
-- Verification queries (for testing)
-- ============================================================================

-- Query to verify folder creation
-- SELECT name, created_at FROM storage.objects 
-- WHERE bucket_id = 'Images' AND name LIKE '%/.keep';

-- Query to test if a user can access their folder
-- SELECT 
--   users.id as user_id,
--   users.whitelabel_id,
--   storage.objects.name as file_path
-- FROM users
-- LEFT JOIN storage.objects ON 
--   storage.objects.bucket_id = 'Images' AND
--   (storage.foldername(storage.objects.name))[1] = users.whitelabel_id::text
-- WHERE users.id = auth.uid();

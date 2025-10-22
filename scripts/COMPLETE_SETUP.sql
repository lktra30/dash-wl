-- =============================================
-- TEAMS INTEGRATION - COMPLETE SQL SETUP
-- =============================================
-- Run these commands in order in your Supabase SQL Editor
-- Dashboard > SQL Editor > New Query

-- =============================================
-- STEP 1: Update Teams Table
-- =============================================

-- Add new columns to teams table
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for leader_id for better performance
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);

-- =============================================
-- STEP 2: Create Storage Bucket
-- =============================================

-- Create the bucket for team logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  5242880, -- 5MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STEP 3: Storage RLS Policies
-- =============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload team logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for team logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update team logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete team logos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload team logos
CREATE POLICY "Authenticated users can upload team logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-logos');

-- Policy 2: Allow public read access to team logos
CREATE POLICY "Public read access for team logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Policy 3: Allow authenticated users to update team logos
CREATE POLICY "Authenticated users can update team logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'team-logos');

-- Policy 4: Allow authenticated users to delete team logos
CREATE POLICY "Authenticated users can delete team logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'team-logos');

-- =============================================
-- STEP 4: Verify Setup (Optional)
-- =============================================

-- Check if columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'teams'
ORDER BY ordinal_position;

-- Check if storage bucket was created
SELECT * FROM storage.buckets WHERE id = 'team-logos';

-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'team-logos';

-- =============================================
-- COMPLETE! 
-- =============================================
-- Your database is now ready for the Teams integration.
-- Next steps:
-- 1. Restart your Next.js development server
-- 2. Test creating a new team
-- 3. Try uploading a team logo
-- =============================================

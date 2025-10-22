-- Add additional fields to teams table
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS leader_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for leader_id for better performance
CREATE INDEX IF NOT EXISTS idx_teams_leader ON teams(leader_id);

-- Create storage bucket for team logos (this needs to be done via Supabase dashboard or API)
-- Bucket name: team-logos
-- Public: true (for easy access to logos)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/svg+xml, image/webp

-- To create the bucket, run this in your Supabase SQL editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('team-logos', 'team-logos', true);

-- Set up RLS policies for team logos storage
-- These policies should be applied in Supabase dashboard under Storage > team-logos > Policies:

-- Policy 1: Allow authenticated users to upload
-- CREATE POLICY "Authenticated users can upload team logos"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'team-logos');

-- Policy 2: Allow public read access
-- CREATE POLICY "Public read access for team logos"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'team-logos');

-- Policy 3: Allow team admins to update/delete
-- CREATE POLICY "Team admins can update/delete team logos"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'team-logos');

-- Policy 4: Allow team admins to delete
-- CREATE POLICY "Team admins can delete team logos"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'team-logos');

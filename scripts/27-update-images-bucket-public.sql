-- ============================================================================
-- Update Images bucket to be public for logo display
-- ============================================================================
-- This script updates the Images bucket to allow public read access
-- This is necessary for logos to be displayed in the UI
-- ============================================================================

-- Update the Images bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'Images';

-- Verify the update
SELECT id, name, public, created_at, updated_at
FROM storage.buckets
WHERE id = 'Images';

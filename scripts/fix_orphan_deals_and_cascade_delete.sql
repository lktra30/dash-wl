-- ============================================================================
-- Migration: Fix Orphan Deals and Add Cascade Delete
-- Description: 
--   1. Delete orphan deals (deals without a valid contact)
--   2. Add ON DELETE CASCADE to deals.contact_id foreign key
--   3. Prevent future orphan deals when contacts are deleted
-- ============================================================================

-- Step 1: Delete all orphan deals (deals with NULL contact_id or non-existent contact)
DELETE FROM deals 
WHERE contact_id IS NULL 
   OR contact_id NOT IN (SELECT id FROM contacts);

-- Step 2: Drop existing foreign key constraint (if exists)
ALTER TABLE deals 
DROP CONSTRAINT IF EXISTS deals_contact_id_fkey;

-- Step 3: Recreate foreign key with CASCADE delete
-- When a contact is deleted, all related deals are automatically deleted
ALTER TABLE deals
ADD CONSTRAINT deals_contact_id_fkey 
FOREIGN KEY (contact_id) 
REFERENCES contacts(id) 
ON DELETE CASCADE;

-- Step 4: Add index for better performance on cascade deletes
CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id);

-- Verification: Show remaining deals count per whitelabel
-- This helps confirm the cleanup worked
SELECT 
  w.name as whitelabel_name,
  COUNT(d.id) as remaining_deals
FROM whitelabels w
LEFT JOIN deals d ON d.whitelabel_id = w.id
GROUP BY w.id, w.name
ORDER BY w.name;

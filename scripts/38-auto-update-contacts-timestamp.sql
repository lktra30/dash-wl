-- Script to automatically update the updated_at timestamp for contacts table
-- This ensures that whenever a contact is modified (status change, stage change, etc),
-- the updated_at field is automatically updated to the current timestamp

-- Create function to update the updated_at field
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it already exists (to allow re-running this script)
DROP TRIGGER IF EXISTS contacts_updated_at_trigger ON contacts;

-- Create trigger that fires before any UPDATE on contacts table
CREATE TRIGGER contacts_updated_at_trigger
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Verify trigger was created successfully
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'contacts_updated_at_trigger';

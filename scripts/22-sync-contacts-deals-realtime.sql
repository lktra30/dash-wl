-- Migration: Sync Contacts to Deals in Real-time
-- This migration creates a comprehensive sync system between contacts and deals
-- When contact.funnel_stage = 'won' or 'lost', automatically create/update/delete deals

-- Step 1: Add 'won' to the funnel_stage enum constraint
-- First, we need to drop and recreate the constraint to include 'won'
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_funnel_stage_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_funnel_stage_check 
  CHECK (funnel_stage = ANY (ARRAY['new_lead'::text, 'contacted'::text, 'meeting'::text, 'negotiation'::text, 'won'::text, 'closed'::text, 'lost'::text]));

-- Step 2: Add deal_duration column to contacts (nullable, default NULL means no duration set)
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deal_duration INTEGER;
COMMENT ON COLUMN contacts.deal_duration IS 'Expected duration of the deal in days';

-- Step 3: Add duration column to deals (nullable)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS duration INTEGER;
COMMENT ON COLUMN deals.duration IS 'Deal duration in days';

-- Step 4: Add unique constraint on deals.contact_id to prevent duplicate deals per contact
-- Drop existing constraint if it exists
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_contact_id_unique;
-- Add unique constraint (allows NULL, so contacts without deals won't conflict)
CREATE UNIQUE INDEX IF NOT EXISTS deals_contact_id_unique_idx ON deals(contact_id) WHERE contact_id IS NOT NULL;

-- Step 5: Drop old trigger and function
DROP TRIGGER IF EXISTS trigger_create_deal_from_closed_contact ON contacts;
DROP FUNCTION IF EXISTS create_deal_from_closed_contact();

-- Step 6: Create comprehensive sync function
CREATE OR REPLACE FUNCTION sync_contact_to_deal()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    
    -- Case 1: Contact status changed TO 'won' or 'lost' (was not won/lost before)
    IF (OLD.funnel_stage NOT IN ('won', 'lost') OR OLD.funnel_stage IS NULL) 
       AND NEW.funnel_stage IN ('won', 'lost') THEN
      
      -- Create or update deal
      INSERT INTO deals (
        whitelabel_id,
        contact_id,
        title,
        value,
        status,
        duration,
        sdr_id,
        closer_id,
        created_at,
        updated_at
      ) VALUES (
        NEW.whitelabel_id,
        NEW.id,
        COALESCE(NEW.name, 'Unnamed Contact') || ' - Deal',
        COALESCE(NEW.deal_value, 0),
        NEW.funnel_stage, -- 'won' or 'lost'
        NEW.deal_duration,
        NEW.sdr_id,
        NEW.closer_id,
        NOW(),
        NOW()
      )
      ON CONFLICT ON CONSTRAINT deals_contact_id_unique_idx
      DO UPDATE SET
        title = EXCLUDED.title,
        value = EXCLUDED.value,
        status = EXCLUDED.status,
        duration = EXCLUDED.duration,
        sdr_id = EXCLUDED.sdr_id,
        closer_id = EXCLUDED.closer_id,
        updated_at = NOW();
      
      RAISE NOTICE 'Created/Updated deal for contact % with status %', NEW.name, NEW.funnel_stage;
      
    -- Case 2: Contact status changed FROM won/lost TO another won/lost (e.g., won -> lost)
    ELSIF OLD.funnel_stage IN ('won', 'lost') 
          AND NEW.funnel_stage IN ('won', 'lost')
          AND OLD.funnel_stage != NEW.funnel_stage THEN
      
      -- Update existing deal status
      UPDATE deals
      SET 
        status = NEW.funnel_stage,
        value = COALESCE(NEW.deal_value, 0),
        duration = NEW.deal_duration,
        sdr_id = NEW.sdr_id,
        closer_id = NEW.closer_id,
        updated_at = NOW()
      WHERE contact_id = NEW.id;
      
      RAISE NOTICE 'Updated deal status for contact % from % to %', NEW.name, OLD.funnel_stage, NEW.funnel_stage;
      
    -- Case 3: Contact status changed FROM 'won' or 'lost' TO another status (not won/lost)
    ELSIF OLD.funnel_stage IN ('won', 'lost') 
          AND (NEW.funnel_stage NOT IN ('won', 'lost') OR NEW.funnel_stage IS NULL) THEN
      
      -- Delete the deal
      DELETE FROM deals WHERE contact_id = NEW.id;
      
      RAISE NOTICE 'Deleted deal for contact % (status changed from % to %)', NEW.name, OLD.funnel_stage, NEW.funnel_stage;
      
    -- Case 4: Contact is still won/lost, but other fields changed (update deal data)
    ELSIF OLD.funnel_stage IN ('won', 'lost') AND NEW.funnel_stage IN ('won', 'lost') THEN
      
      UPDATE deals
      SET 
        title = COALESCE(NEW.name, 'Unnamed Contact') || ' - Deal',
        value = COALESCE(NEW.deal_value, 0),
        duration = NEW.deal_duration,
        sdr_id = NEW.sdr_id,
        closer_id = NEW.closer_id,
        updated_at = NOW()
      WHERE contact_id = NEW.id;
      
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE operations
  IF TG_OP = 'DELETE' THEN
    -- If contact had a deal, delete it (CASCADE should handle this, but be explicit)
    DELETE FROM deals WHERE contact_id = OLD.id;
    RAISE NOTICE 'Deleted deal for deleted contact %', OLD.name;
    RETURN OLD;
  END IF;
  
  -- INSERT operations - do nothing, deals are only created when status changes to won/lost
  IF TG_OP = 'INSERT' THEN
    -- If a contact is created directly with won/lost status, create deal immediately
    IF NEW.funnel_stage IN ('won', 'lost') THEN
      INSERT INTO deals (
        whitelabel_id,
        contact_id,
        title,
        value,
        status,
        duration,
        sdr_id,
        closer_id,
        created_at,
        updated_at
      ) VALUES (
        NEW.whitelabel_id,
        NEW.id,
        COALESCE(NEW.name, 'Unnamed Contact') || ' - Deal',
        COALESCE(NEW.deal_value, 0),
        NEW.funnel_stage,
        NEW.deal_duration,
        NEW.sdr_id,
        NEW.closer_id,
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Created deal for new contact % with status %', NEW.name, NEW.funnel_stage;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger on contacts table
CREATE TRIGGER trigger_sync_contact_to_deal
  AFTER INSERT OR UPDATE OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_deal();

-- Step 8: Enable realtime for deals table
ALTER PUBLICATION supabase_realtime ADD TABLE deals;

-- Step 9: Migrate existing 'closed' contacts to 'won' status
-- This ensures backward compatibility with existing data
UPDATE contacts 
SET funnel_stage = 'won' 
WHERE funnel_stage = 'closed';

-- Step 10: Update existing deals for contacts that are now 'won'
-- Ensure all existing deals are properly linked
UPDATE deals d
SET contact_id = c.id,
    status = 'won'
FROM contacts c
WHERE d.title ILIKE '%' || c.name || '%'
  AND d.contact_id IS NULL
  AND c.funnel_stage = 'won';

COMMENT ON FUNCTION sync_contact_to_deal() IS 'Automatically sync contacts to deals when funnel_stage changes to/from won/lost';
COMMENT ON TRIGGER trigger_sync_contact_to_deal ON contacts IS 'Real-time sync trigger for contact-deal synchronization';

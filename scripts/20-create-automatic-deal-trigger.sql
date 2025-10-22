-- Migration 20: Create automatic deal creation when contact is marked as 'closed'
-- This trigger automatically creates a deal when a contact's funnel_stage changes to 'closed'

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.create_deal_from_closed_contact()
RETURNS TRIGGER AS $$
DECLARE
  existing_deal_count INTEGER;
BEGIN
  -- Only proceed if funnel_stage changed to 'closed'
  IF (OLD.funnel_stage IS DISTINCT FROM 'closed' AND NEW.funnel_stage = 'closed') THEN
    
    -- Check if a deal already exists for this contact to prevent duplicates
    SELECT COUNT(*) INTO existing_deal_count
    FROM public.deals
    WHERE contact_id = NEW.id AND status = 'won';
    
    -- Only create a deal if one doesn't already exist
    IF existing_deal_count = 0 THEN
      INSERT INTO public.deals (
        whitelabel_id,
        contact_id,
        title,
        value,
        status,
        sdr_id,
        closer_id,
        expected_close_date,
        created_at,
        updated_at
      ) VALUES (
        NEW.whitelabel_id,
        NEW.id,
        'Deal with ' || NEW.name,
        COALESCE(NEW.deal_value, 0), -- Use deal_value from contact or default to 0
        'won', -- Set as won since contact is closed
        NEW.sdr_id,
        NEW.closer_id,
        CURRENT_DATE,
        NOW(),
        NOW()
      );
      
      -- Log the action (optional - for debugging)
      RAISE NOTICE 'Created deal for contact %: %', NEW.id, NEW.name;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_deal_from_closed_contact ON public.contacts;

CREATE TRIGGER trigger_create_deal_from_closed_contact
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.create_deal_from_closed_contact();

-- Add comment for documentation
COMMENT ON FUNCTION public.create_deal_from_closed_contact() IS 
  'Automatically creates a won deal when a contact funnel_stage is set to closed';

COMMENT ON TRIGGER trigger_create_deal_from_closed_contact ON public.contacts IS
  'Triggers automatic deal creation when contact is marked as closed';

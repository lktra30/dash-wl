-- Migration 50: Fix meeting creation when sdr_id is null
-- This fixes the NOT NULL constraint violation when creating meetings from deals
-- that don't have an SDR assigned (only a closer)

-- ============================================================================
-- Update the trigger function to use closer_id as fallback when sdr_id is null
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_meeting_from_won_deal()
RETURNS TRIGGER AS $$
DECLARE
  existing_meeting_count INTEGER;
  meeting_title TEXT;
  meeting_sdr_id UUID;
  contact_sdr_id UUID;
  contact_closer_id UUID;
BEGIN
  -- Only proceed if deal status changed to 'won' OR if it's a new deal with status 'won'
  IF (TG_OP = 'INSERT' AND NEW.status = 'won') OR
     (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM 'won' AND NEW.status = 'won') THEN

    -- Check if a meeting already exists for this deal to prevent duplicates
    SELECT COUNT(*) INTO existing_meeting_count
    FROM public.meetings
    WHERE deal_id = NEW.id;

    -- Only create a meeting if one doesn't already exist
    IF existing_meeting_count = 0 THEN

      -- Determine the SDR ID to use for the meeting
      -- Priority: 1) deal.sdr_id, 2) deal.closer_id, 3) contact.sdr_id, 4) contact.closer_id
      meeting_sdr_id := NEW.sdr_id;
      
      IF meeting_sdr_id IS NULL THEN
        meeting_sdr_id := NEW.closer_id;
      END IF;

      -- If still null, try to get from the contact
      IF meeting_sdr_id IS NULL AND NEW.contact_id IS NOT NULL THEN
        SELECT sdr_id, closer_id INTO contact_sdr_id, contact_closer_id
        FROM public.contacts
        WHERE id = NEW.contact_id;
        
        meeting_sdr_id := COALESCE(contact_sdr_id, contact_closer_id);
      END IF;

      -- Only create meeting if we have a valid user ID
      -- If still null, skip meeting creation with a warning
      IF meeting_sdr_id IS NULL THEN
        RAISE WARNING 'Cannot create meeting for deal % - no SDR or Closer assigned', NEW.id;
        RETURN NEW;
      END IF;

      -- Create a descriptive title
      meeting_title := COALESCE(
        'Reunião - ' || NEW.title,
        'Reunião de Venda #' || NEW.id
      );

      -- Insert the meeting
      INSERT INTO public.meetings (
        whitelabel_id,
        sdr_id,
        contact_id,
        deal_id,
        title,
        scheduled_at,
        completed_at,
        status,
        converted_to_sale,
        notes,
        created_at,
        updated_at
      ) VALUES (
        NEW.whitelabel_id,
        meeting_sdr_id,  -- Use the determined ID (sdr or closer)
        NEW.contact_id,
        NEW.id,  -- Link to the deal
        meeting_title,
        COALESCE(NEW.updated_at - INTERVAL '1 hour', NEW.created_at), -- Schedule 1h before deal was won
        NEW.updated_at,  -- Complete at the same time the deal was won
        'completed',
        true,  -- Mark as converted to sale
        'Reunião criada automaticamente a partir da venda fechada',
        NOW(),
        NOW()
      );

      -- Log the action for debugging
      RAISE NOTICE 'Created meeting for deal %: % (assigned to user %)', NEW.id, NEW.title, meeting_sdr_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Add comment explaining the fallback logic
-- ============================================================================

COMMENT ON FUNCTION public.create_meeting_from_won_deal() IS
  'Automatically creates a completed meeting when a deal status is set to won. Uses closer_id as fallback if sdr_id is not set. Ensures every sale is counted as a meeting.';

-- Migration 34: Auto-create meetings when deals are marked as won
-- This ensures that every sale (won deal) is also counted as a completed meeting

-- ============================================================================
-- PART 1: Create trigger function to auto-create meetings from won deals
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_meeting_from_won_deal()
RETURNS TRIGGER AS $$
DECLARE
  existing_meeting_count INTEGER;
  meeting_title TEXT;
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
        NEW.sdr_id,
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
      RAISE NOTICE 'Created meeting for deal %: %', NEW.id, NEW.title;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 2: Create the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_create_meeting_from_won_deal ON public.deals;

CREATE TRIGGER trigger_create_meeting_from_won_deal
  AFTER INSERT OR UPDATE ON public.deals
  FOR EACH ROW
  EXECUTE FUNCTION public.create_meeting_from_won_deal();

-- ============================================================================
-- PART 3: Create meetings retroactively for existing won deals without meetings
-- ============================================================================

DO $$
DECLARE
  deal_record RECORD;
  meeting_title TEXT;
  meetings_created INTEGER := 0;
BEGIN
  -- Loop through all won deals that don't have an associated meeting
  FOR deal_record IN
    SELECT d.*
    FROM public.deals d
    LEFT JOIN public.meetings m ON m.deal_id = d.id
    WHERE d.status = 'won'
      AND m.id IS NULL
  LOOP
    -- Create a descriptive title
    meeting_title := COALESCE(
      'Reunião - ' || deal_record.title,
      'Reunião de Venda #' || deal_record.id
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
      deal_record.whitelabel_id,
      deal_record.sdr_id,
      deal_record.contact_id,
      deal_record.id,
      meeting_title,
      COALESCE(deal_record.updated_at - INTERVAL '1 hour', deal_record.created_at),
      deal_record.updated_at,
      'completed',
      true,
      'Reunião criada retroativamente a partir da venda fechada existente',
      NOW(),
      NOW()
    );

    meetings_created := meetings_created + 1;
  END LOOP;

  RAISE NOTICE 'Criadas % reuniões retroativas para deals existentes', meetings_created;
END $$;

-- ============================================================================
-- PART 4: Add documentation comments
-- ============================================================================

COMMENT ON FUNCTION public.create_meeting_from_won_deal() IS
  'Automatically creates a completed meeting when a deal status is set to won. Ensures every sale is counted as a meeting.';

COMMENT ON TRIGGER trigger_create_meeting_from_won_deal ON public.deals IS
  'Triggers automatic meeting creation when deal is marked as won, ensuring sales are always counted as meetings';

-- ============================================================================
-- PART 5: Verification query
-- ============================================================================

-- Run this to verify the migration worked correctly
SELECT
  'Deals won without meetings' as check_type,
  COUNT(*) as count
FROM public.deals d
LEFT JOIN public.meetings m ON m.deal_id = d.id
WHERE d.status = 'won' AND m.id IS NULL

UNION ALL

SELECT
  'Total deals won' as check_type,
  COUNT(*) as count
FROM public.deals
WHERE status = 'won'

UNION ALL

SELECT
  'Meetings linked to won deals' as check_type,
  COUNT(*) as count
FROM public.meetings
WHERE deal_id IS NOT NULL
  AND status = 'completed'
  AND converted_to_sale = true;

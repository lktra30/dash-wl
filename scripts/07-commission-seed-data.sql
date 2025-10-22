-- Seed data for commission system testing
-- Run this after creating the commission tables

-- Insert default commission settings for the first whitelabel
-- Adjust the whitelabel_id to match your actual whitelabel
INSERT INTO commissions_settings (
  whitelabel_id,
  checkpoint_1_percent,
  checkpoint_2_percent,
  checkpoint_3_percent,
  checkpoint_1_commission_percent,
  checkpoint_2_commission_percent,
  checkpoint_3_commission_percent,
  sdr_meeting_commission,
  sdr_meetings_target,
  sdr_bonus_closed_meeting,
  closer_commission_percent,
  closer_sales_target
)
SELECT 
  id,
  50.00,   -- Checkpoint 1: 50% of target
  75.00,   -- Checkpoint 2: 75% of target
  100.00,  -- Checkpoint 3: 100% of target
  50.00,   -- 50% commission at checkpoint 1
  75.00,   -- 75% commission at checkpoint 2
  100.00,  -- 100% commission at checkpoint 3
  50.00,   -- $50 per meeting for SDRs
  20,      -- 20 meetings target per month
  100.00,  -- $100 bonus for converted meetings
  10.00,   -- 10% commission for Closers
  10000.00 -- $10,000 sales target per month
FROM whitelabels
WHERE NOT EXISTS (
  SELECT 1 FROM commissions_settings cs WHERE cs.whitelabel_id = whitelabels.id
)
LIMIT 1;

-- Example: Create some test meetings for SDRs
-- This assumes you have users with role='sales' who will act as SDRs
-- Adjust as needed for your actual user structure

-- Get the first whitelabel and a sales user
DO $$
DECLARE
  v_whitelabel_id UUID;
  v_sdr_id UUID;
  v_contact_id UUID;
BEGIN
  -- Get first whitelabel
  SELECT id INTO v_whitelabel_id FROM whitelabels LIMIT 1;
  
  -- Get first sales user (assuming they're an SDR)
  SELECT id INTO v_sdr_id FROM users 
  WHERE role = 'sales' AND whitelabel_id = v_whitelabel_id 
  LIMIT 1;
  
  -- Get first contact
  SELECT id INTO v_contact_id FROM contacts 
  WHERE whitelabel_id = v_whitelabel_id 
  LIMIT 1;
  
  -- Only proceed if we have the necessary IDs
  IF v_whitelabel_id IS NOT NULL AND v_sdr_id IS NOT NULL THEN
    -- Insert sample meetings for current month
    INSERT INTO meetings (
      whitelabel_id, 
      sdr_id, 
      contact_id, 
      title, 
      scheduled_at, 
      completed_at, 
      status, 
      converted_to_sale,
      notes
    ) VALUES
    -- Completed meetings that converted
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Discovery Call - Acme Corp', 
     NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days', 'completed', TRUE,
     'Great meeting, moved to proposal stage'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Demo - TechStart Inc', 
     NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days', 'completed', TRUE,
     'Impressed with product, ready to close'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Consultation - Global Services', 
     NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', 'completed', TRUE,
     'Identified clear pain points'),
    
    -- Completed meetings that didn't convert
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Initial Call - LocalBiz', 
     NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days', 'completed', FALSE,
     'Not ready to buy yet'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Follow-up - SmallCo', 
     NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days', 'completed', FALSE,
     'Budget concerns'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Discovery - MidMarket LLC', 
     NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days', 'completed', FALSE,
     'Need to discuss with team'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Demo - StartupXYZ', 
     NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', 'completed', FALSE,
     'Interested but timing is off'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Consultation - Enterprise Co', 
     NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 'completed', FALSE,
     'Complex decision process'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Discovery - BigCorp', 
     NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'completed', FALSE,
     'Evaluating competitors'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Follow-up - RetailChain', 
     NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'completed', FALSE,
     'Waiting on approval'),
    
    -- Additional completed meetings to reach target
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Check-in Call', 
     NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', 'completed', FALSE,
     'Building relationship'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Product Demo', 
     NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days', 'completed', FALSE,
     'Showed key features'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Needs Analysis', 
     NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', 'completed', FALSE,
     'Gathering requirements'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Strategy Session', 
     NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', 'completed', FALSE,
     'Discussed implementation'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Q&A Meeting', 
     NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'completed', FALSE,
     'Answered technical questions'),
    
    -- Upcoming/scheduled meetings
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Discovery Call - New Lead', 
     NOW() + INTERVAL '2 days', NULL, 'scheduled', FALSE,
     'First contact'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Demo - Prospect Alpha', 
     NOW() + INTERVAL '5 days', NULL, 'scheduled', FALSE,
     'Requested product demo'),
    
    (v_whitelabel_id, v_sdr_id, v_contact_id, 'Follow-up - Previous Lead', 
     NOW() + INTERVAL '7 days', NULL, 'scheduled', FALSE,
     'Checking in after trial');
    
    RAISE NOTICE 'Successfully created sample meetings for SDR: %', v_sdr_id;
  ELSE
    RAISE NOTICE 'Skipping sample data creation - missing required data (whitelabel or sales user)';
  END IF;
END $$;

-- Note: For Closer commission testing, you'll need to:
-- 1. Create deals in the deals table
-- 2. Set status = 'won' and stage = 'closed-won'
-- 3. Assign them to users with role that represents closers
-- 4. Ensure they have a created_at date in the current month

COMMENT ON TABLE commissions_settings IS 'Commission configuration per whitelabel - admin access only';
COMMENT ON TABLE meetings IS 'SDR meetings for commission tracking';
COMMENT ON TABLE user_commissions IS 'Calculated commission data per user per period';

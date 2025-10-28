-- Migration: Create facebook_leads tracking table
-- This table stores raw lead data from Facebook Lead Ads webhooks
-- Allows tracking which leads were successfully processed and debugging failures

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create facebook_leads table
CREATE TABLE IF NOT EXISTS facebook_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  facebook_lead_id VARCHAR(255) UNIQUE NOT NULL,
  page_id VARCHAR(255),
  form_id VARCHAR(255),
  ad_id VARCHAR(255),
  form_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_leads_whitelabel ON facebook_leads(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_contact ON facebook_leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_facebook_lead_id ON facebook_leads(facebook_lead_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_processed ON facebook_leads(processed);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_page_id ON facebook_leads(page_id);
CREATE INDEX IF NOT EXISTS idx_facebook_leads_created_at ON facebook_leads(created_at);

-- Add comments
COMMENT ON TABLE facebook_leads IS 'Tracks leads received from Facebook Lead Ads webhooks';
COMMENT ON COLUMN facebook_leads.whitelabel_id IS 'Whitelabel that received this lead';
COMMENT ON COLUMN facebook_leads.contact_id IS 'Contact created from this lead (NULL if processing failed)';
COMMENT ON COLUMN facebook_leads.facebook_lead_id IS 'Unique Facebook Lead ID';
COMMENT ON COLUMN facebook_leads.page_id IS 'Facebook Page ID that received the lead';
COMMENT ON COLUMN facebook_leads.form_id IS 'Facebook Form ID that was filled';
COMMENT ON COLUMN facebook_leads.ad_id IS 'Facebook Ad ID that generated the lead';
COMMENT ON COLUMN facebook_leads.form_data IS 'Raw form data from Facebook (JSON)';
COMMENT ON COLUMN facebook_leads.processed IS 'Whether the lead was successfully processed';
COMMENT ON COLUMN facebook_leads.error_message IS 'Error message if processing failed';
COMMENT ON COLUMN facebook_leads.processed_at IS 'Timestamp when the lead was processed';

-- Enable Row Level Security
ALTER TABLE facebook_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see leads from their whitelabel
CREATE POLICY "Users can view their whitelabel's Facebook leads"
  ON facebook_leads
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id
      FROM users
      WHERE email = auth.jwt()->>'email'
    )
  );

-- RLS Policy: Only system can insert (webhooks use service role)
-- No INSERT policy needed since webhooks use service role key

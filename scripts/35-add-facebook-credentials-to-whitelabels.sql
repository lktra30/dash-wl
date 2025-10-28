-- Migration: Add Facebook Lead Ads credentials to whitelabels table
-- This allows storing Facebook Page ID and Access Token for each whitelabel

-- Add Facebook credentials columns to whitelabels table
ALTER TABLE whitelabels
ADD COLUMN IF NOT EXISTS facebook_page_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_access_token_encrypted TEXT;

-- Create index for facebook_page_id for better performance (webhook lookups)
CREATE INDEX IF NOT EXISTS idx_whitelabels_facebook_page_id ON whitelabels(facebook_page_id);

-- Add comments to explain the columns
COMMENT ON COLUMN whitelabels.facebook_page_id IS 'Facebook Page ID for Lead Ads integration';
COMMENT ON COLUMN whitelabels.facebook_access_token_encrypted IS 'Encrypted Facebook Page Access Token for API calls';

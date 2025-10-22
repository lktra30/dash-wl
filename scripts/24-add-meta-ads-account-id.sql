-- Migration: Add meta_ads_account_id column to whitelabels table
-- This allows storing the Meta Ads Account ID for each whitelabel

-- Add meta_ads_account_id column to whitelabels table
ALTER TABLE whitelabels 
ADD COLUMN IF NOT EXISTS meta_ads_account_id TEXT;

-- Create index for meta_ads_account_id for better performance
CREATE INDEX IF NOT EXISTS idx_whitelabels_meta_ads_account_id ON whitelabels(meta_ads_account_id);

-- Add comment to explain the column
COMMENT ON COLUMN whitelabels.meta_ads_account_id IS 'Meta/Facebook Ads Account ID used for fetching campaign data';

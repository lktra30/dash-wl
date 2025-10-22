-- Add new columns to whitelabels table for business model and encrypted API keys
ALTER TABLE whitelabels 
ADD COLUMN IF NOT EXISTS business_model TEXT CHECK (business_model IN ('TCV', 'MRR')) DEFAULT 'MRR',
ADD COLUMN IF NOT EXISTS meta_ads_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS google_ads_key_encrypted TEXT;

-- Add comment for documentation
COMMENT ON COLUMN whitelabels.business_model IS 'Business model type: TCV (Total Contract Value) or MRR (Monthly Recurring Revenue)';
COMMENT ON COLUMN whitelabels.meta_ads_key_encrypted IS 'Encrypted Meta Ads API access token';
COMMENT ON COLUMN whitelabels.google_ads_key_encrypted IS 'Encrypted Google Ads API key';

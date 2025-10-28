-- Migration: Add lead_source column to contacts table and make email nullable
-- This allows tracking where leads come from (e.g., 'inbound', 'outbound', 'facebook', etc.)

-- Add lead_source column to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS lead_source VARCHAR(50);

-- Make email nullable since Facebook leads might not always have email
-- First drop the NOT NULL constraint if it exists
ALTER TABLE contacts
ALTER COLUMN email DROP NOT NULL;

-- Create index for lead_source for better filtering/reporting
CREATE INDEX IF NOT EXISTS idx_contacts_lead_source ON contacts(lead_source);

-- Add comment to explain the column
COMMENT ON COLUMN contacts.lead_source IS 'Source of the lead (e.g., inbound, outbound, facebook, instagram, etc.)';

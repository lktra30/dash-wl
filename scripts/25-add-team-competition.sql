-- Migration: Add team competition feature to whitelabels
-- Description: Adds a boolean field to enable/disable team competition display on main dashboard
-- Requirements: Only available when whitelabel has 2+ teams

-- Add team_competition column to whitelabels table
ALTER TABLE whitelabels 
ADD COLUMN IF NOT EXISTS team_competition BOOLEAN DEFAULT FALSE;

-- Add comment for documentation
COMMENT ON COLUMN whitelabels.team_competition IS 'Enable team competition feature on main dashboard (requires 2+ teams)';

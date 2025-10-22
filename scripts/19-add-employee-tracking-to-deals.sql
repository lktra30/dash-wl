-- Migration 19: Add employee tracking columns to deals table
-- This tracks which SDR and Closer were responsible for the deal

-- Add sdr_id column (Sales Development Representative)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS sdr_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add closer_id column (Closer/Account Executive)
ALTER TABLE public.deals 
ADD COLUMN IF NOT EXISTS closer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_sdr_id ON public.deals(sdr_id);
CREATE INDEX IF NOT EXISTS idx_deals_closer_id ON public.deals(closer_id);

-- Add comments for documentation
COMMENT ON COLUMN public.deals.sdr_id IS 'SDR (Sales Development Representative) who sourced this deal';
COMMENT ON COLUMN public.deals.closer_id IS 'Closer/Account Executive who closed this deal';

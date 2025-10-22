-- Migration 18: Add employee tracking columns to contacts table
-- This allows tracking which SDR and Closer are responsible for each contact

-- Add sdr_id column (Sales Development Representative)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS sdr_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add closer_id column (Closer/Account Executive)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS closer_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

-- Add deal_value column (expected deal value when closed)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS deal_value numeric(10, 2) DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contacts_sdr_id ON public.contacts(sdr_id);
CREATE INDEX IF NOT EXISTS idx_contacts_closer_id ON public.contacts(closer_id);

-- Add comments for documentation
COMMENT ON COLUMN public.contacts.sdr_id IS 'SDR (Sales Development Representative) responsible for this contact';
COMMENT ON COLUMN public.contacts.closer_id IS 'Closer/Account Executive responsible for closing this deal';
COMMENT ON COLUMN public.contacts.deal_value IS 'Expected deal value when contact is closed';

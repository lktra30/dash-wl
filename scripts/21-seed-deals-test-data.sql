-- Migration 21: Seed test data for deals
-- This assigns SDRs and Closers to existing contacts and creates sample deals

-- First, let's get some employee IDs to use as SDRs and Closers
-- We'll update existing contacts with random employees from the database

-- Update existing contacts with SDR and Closer assignments and deal values
WITH random_employees AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn
  FROM public.employees
  WHERE status = 'active'
  LIMIT 10
),
sdr_employees AS (
  SELECT id FROM random_employees WHERE rn <= 5
),
closer_employees AS (
  SELECT id FROM random_employees WHERE rn > 5
)
UPDATE public.contacts
SET 
  sdr_id = (SELECT id FROM sdr_employees ORDER BY RANDOM() LIMIT 1),
  closer_id = (SELECT id FROM closer_employees ORDER BY RANDOM() LIMIT 1),
  deal_value = (RANDOM() * 50000 + 5000)::numeric(10,2) -- Random value between 5k-55k
WHERE sdr_id IS NULL AND closer_id IS NULL;

-- Now let's manually create some deals for contacts that aren't 'closed' yet
-- This gives us a mix of deals in different stages

INSERT INTO public.deals (
  whitelabel_id,
  contact_id,
  title,
  value,
  status,
  sdr_id,
  closer_id,
  expected_close_date,
  created_at,
  updated_at
)
SELECT 
  c.whitelabel_id,
  c.id,
  'Deal with ' || c.name,
  COALESCE(c.deal_value, (RANDOM() * 40000 + 10000)::numeric(10,2)),
  CASE 
    WHEN c.funnel_stage IN ('closed') THEN 'won'
    WHEN c.funnel_stage = 'lost' THEN 'lost'
    ELSE 'open'
  END,
  c.sdr_id,
  c.closer_id,
  CASE 
    WHEN c.funnel_stage IN ('closed', 'lost') THEN CURRENT_DATE - (RANDOM() * 30)::INTEGER
    ELSE CURRENT_DATE + (RANDOM() * 60)::INTEGER
  END,
  NOW() - (RANDOM() * INTERVAL '90 days'),
  NOW()
FROM public.contacts c
WHERE c.sdr_id IS NOT NULL 
  AND c.closer_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.deals d WHERE d.contact_id = c.id
  )
LIMIT 5;

-- Add some additional standalone deals for variety (deals that might not have been triggered)
INSERT INTO public.deals (
  whitelabel_id,
  contact_id,
  title,
  value,
  status,
  sdr_id,
  closer_id,
  expected_close_date,
  created_at,
  updated_at
)
SELECT 
  c.whitelabel_id,
  c.id,
  'Enterprise Deal - ' || c.company,
  (RANDOM() * 100000 + 50000)::numeric(10,2), -- Larger enterprise deals
  'open',
  c.sdr_id,
  c.closer_id,
  CURRENT_DATE + (RANDOM() * 90)::INTEGER,
  NOW() - (RANDOM() * INTERVAL '30 days'),
  NOW()
FROM public.contacts c
WHERE c.sdr_id IS NOT NULL 
  AND c.closer_id IS NOT NULL
  AND c.company IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.deals d WHERE d.contact_id = c.id
  )
LIMIT 3;

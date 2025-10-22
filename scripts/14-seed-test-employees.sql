-- Seed test employees with SDR and Closer roles
-- This script adds test data for the employee-based team feature

-- Insert SDRs
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'João Silva' as name,
  'joao.silva@example.com' as email,
  '+55 11 98765-4321' as phone,
  'SDR' as role,
  'Sales' as department,
  '2024-01-15' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
WHERE name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Maria Santos' as name,
  'maria.santos@example.com' as email,
  '+55 11 98765-4322' as phone,
  'SDR' as role,
  'Sales' as department,
  '2024-02-20' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
WHERE name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

-- Insert Closers
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Pedro Oliveira' as name,
  'pedro.oliveira@example.com' as email,
  '+55 11 98765-4323' as phone,
  'Closer' as role,
  'Sales' as department,
  '2024-01-10' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
WHERE name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Ana Costa' as name,
  'ana.costa@example.com' as email,
  '+55 11 98765-4324' as phone,
  'Closer' as role,
  'Sales' as department,
  '2024-03-01' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
WHERE name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

-- Insert employee who does both roles (SDR/Closer)
INSERT INTO employees (name, email, phone, role, department, hire_date, status, whitelabel_id)
SELECT 
  'Carlos Mendes' as name,
  'carlos.mendes@example.com' as email,
  '+55 11 98765-4325' as phone,
  'SDR/Closer' as role,
  'Sales' as department,
  '2023-11-15' as hire_date,
  'active' as status,
  id as whitelabel_id
FROM whitelabels
WHERE name = 'Acme Corp'
ON CONFLICT (email) DO NOTHING;

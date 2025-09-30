-- Insert demo whitelabels
INSERT INTO whitelabels (id, name, domain, brand_color) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Acme Corp CRM', 'acme.example.com', '#3b82f6'),
  ('22222222-2222-2222-2222-222222222222', 'TechStart CRM', 'techstart.example.com', '#10b981')
ON CONFLICT (id) DO NOTHING;

-- Insert demo users
INSERT INTO users (id, whitelabel_id, email, name, role) VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'admin@acme.com', 'Admin Acme', 'admin'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'sales@acme.com', 'Sales Acme', 'sales'),
  ('b1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'admin@techstart.com', 'Admin TechStart', 'admin'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'sales@techstart.com', 'Sales TechStart', 'sales')
ON CONFLICT (id) DO NOTHING;

-- Insert demo teams
INSERT INTO teams (id, whitelabel_id, name, color) VALUES
  ('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'Tigres de Vendas', '#f97316'),
  ('t2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Leões do Fechamento', '#eab308'),
  ('t3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'Águias Negociadoras', '#06b6d4'),
  ('t4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Falcões da Prospecção', '#8b5cf6')
ON CONFLICT (id) DO NOTHING;

-- Insert demo contacts
INSERT INTO contacts (whitelabel_id, name, email, phone, company, position, funnel_stage) VALUES
  ('11111111-1111-1111-1111-111111111111', 'João Silva', 'joao@empresa.com', '(11) 98765-4321', 'Empresa ABC', 'CEO', 'new_lead'),
  ('11111111-1111-1111-1111-111111111111', 'Maria Santos', 'maria@tech.com', '(21) 99876-5432', 'Tech Solutions', 'CTO', 'contacted'),
  ('11111111-1111-1111-1111-111111111111', 'Pedro Costa', 'pedro@startup.com', '(31) 97654-3210', 'StartUp XYZ', 'Founder', 'meeting'),
  ('11111111-1111-1111-1111-111111111111', 'Ana Oliveira', 'ana@corp.com', '(41) 96543-2109', 'Corp Industries', 'Director', 'negotiation'),
  ('11111111-1111-1111-1111-111111111111', 'Carlos Ferreira', 'carlos@digital.com', '(51) 95432-1098', 'Digital Agency', 'Manager', 'closed'),
  ('22222222-2222-2222-2222-222222222222', 'Lucia Mendes', 'lucia@example.com', '(11) 94321-0987', 'Example Co', 'VP Sales', 'new_lead'),
  ('22222222-2222-2222-2222-222222222222', 'Roberto Lima', 'roberto@test.com', '(21) 93210-9876', 'Test Inc', 'CEO', 'contacted')
ON CONFLICT DO NOTHING;

-- Insert demo deals
INSERT INTO deals (whitelabel_id, title, value, status, expected_close_date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Contrato Anual - Empresa ABC', 50000.00, 'open', '2025-10-15'),
  ('11111111-1111-1111-1111-111111111111', 'Licenças Software - Tech Solutions', 75000.00, 'open', '2025-10-30'),
  ('11111111-1111-1111-1111-111111111111', 'Consultoria - StartUp XYZ', 30000.00, 'won', '2025-09-20'),
  ('22222222-2222-2222-2222-222222222222', 'Implementação - Example Co', 100000.00, 'open', '2025-11-01')
ON CONFLICT DO NOTHING;

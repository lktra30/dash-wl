-- =====================================================
-- 40: PERFORMANCE OPTIMIZATION - INDEXES AND VIEWS
-- Otimizações de performance do banco de dados
-- - Índices compostos para queries frequentes
-- - Views materializadas para analytics
-- - Partial indexes para queries filtradas
-- - Índices de timestamp para relatórios
-- =====================================================

-- =====================================================
-- PARTE 1: ÍNDICES COMPOSTOS PARA QUERIES FREQUENTES
-- =====================================================

-- Contacts: whitelabel_id + funnel_stage (queries de dashboard por status)
CREATE INDEX IF NOT EXISTS idx_contacts_whitelabel_funnel_stage 
ON contacts(whitelabel_id, funnel_stage);

-- Contacts: whitelabel_id + stage_id (queries de pipeline por estágio)
CREATE INDEX IF NOT EXISTS idx_contacts_whitelabel_stage 
ON contacts(whitelabel_id, stage_id);

-- Deals: whitelabel_id + status (queries de analytics por status)
CREATE INDEX IF NOT EXISTS idx_deals_whitelabel_status 
ON deals(whitelabel_id, status);

-- Employees: whitelabel_id + user_role (queries de permissão por papel)
CREATE INDEX IF NOT EXISTS idx_employees_whitelabel_user_role 
ON employees(whitelabel_id, user_role);

-- Meetings: sdr_id + status (queries de comissão por SDR)
CREATE INDEX IF NOT EXISTS idx_meetings_sdr_status 
ON meetings(sdr_id, status);

-- Meetings: whitelabel_id + status (relatórios de reuniões por status)
CREATE INDEX IF NOT EXISTS idx_meetings_whitelabel_status 
ON meetings(whitelabel_id, status);


-- =====================================================
-- PARTE 2: ÍNDICES DE TIMESTAMP PARA RELATÓRIOS
-- =====================================================

-- Contacts: created_at para relatórios de novos leads por período
CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
ON contacts(created_at);

-- Contacts: sale_date para relatórios de vendas por período
CREATE INDEX IF NOT EXISTS idx_contacts_sale_date 
ON contacts(sale_date) WHERE sale_date IS NOT NULL;

-- Deals: created_at para relatórios de deals por período
CREATE INDEX IF NOT EXISTS idx_deals_created_at 
ON deals(created_at);

-- Deals: sale_date para relatórios de fechamento
CREATE INDEX IF NOT EXISTS idx_deals_sale_date 
ON deals(sale_date) WHERE sale_date IS NOT NULL;

-- Meetings: completed_at para relatórios de reuniões realizadas
CREATE INDEX IF NOT EXISTS idx_meetings_completed_at 
ON meetings(completed_at) WHERE completed_at IS NOT NULL;

-- User Commissions: whitelabel_id + period para relatórios de comissão
CREATE INDEX IF NOT EXISTS idx_user_commissions_whitelabel_period 
ON user_commissions(whitelabel_id, period_year, period_month);


-- =====================================================
-- PARTE 3: PARTIAL INDEXES PARA QUERIES FILTRADAS
-- =====================================================

-- Deals ganhos (won) - usado frequentemente em relatórios de revenue
CREATE INDEX IF NOT EXISTS idx_deals_won 
ON deals(whitelabel_id, sale_date) 
WHERE status = 'won';

-- Deals abertos (open) - usado para cálculo de pipeline value
CREATE INDEX IF NOT EXISTS idx_deals_open 
ON deals(whitelabel_id, value) 
WHERE status = 'open';

-- Contacts com stage definido (novo sistema de pipeline)
CREATE INDEX IF NOT EXISTS idx_contacts_with_stage 
ON contacts(whitelabel_id, stage_id, created_at) 
WHERE stage_id IS NOT NULL;

-- Meetings completados - usado para cálculo de comissões
CREATE INDEX IF NOT EXISTS idx_meetings_completed 
ON meetings(sdr_id, completed_at, converted_to_sale) 
WHERE status = 'completed';

-- Employees ativos - queries frequentes filtram por status ativo
CREATE INDEX IF NOT EXISTS idx_employees_active 
ON employees(whitelabel_id, user_role, team_id) 
WHERE status = 'active';


-- =====================================================
-- PARTE 4: VIEW MATERIALIZADA PARA ANALYTICS DE DASHBOARD
-- =====================================================

-- Drop existing view if exists (para poder recriar)
DROP MATERIALIZED VIEW IF EXISTS dashboard_analytics_mv CASCADE;

-- Criar materialized view com métricas precalculadas
CREATE MATERIALIZED VIEW dashboard_analytics_mv AS
SELECT 
    w.id AS whitelabel_id,
    w.name AS whitelabel_name,
    
    -- Métricas de Contacts
    COUNT(DISTINCT c.id) AS total_contacts,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'new_lead') AS new_leads_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'contacted') AS contacted_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'meeting') AS meeting_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'negotiation') AS negotiation_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'won') AS won_contacts_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.funnel_stage = 'lost') AS lost_count,
    
    -- Métricas de Deals
    COUNT(DISTINCT d.id) AS total_deals,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'open') AS open_deals_count,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'won') AS won_deals_count,
    COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'lost') AS lost_deals_count,
    
    -- Métricas Financeiras (Deals)
    COALESCE(SUM(d.value) FILTER (WHERE d.status = 'won'), 0) AS total_revenue,
    COALESCE(SUM(d.value) FILTER (WHERE d.status = 'open'), 0) AS pipeline_value,
    COALESCE(AVG(d.value) FILTER (WHERE d.status = 'won'), 0) AS avg_deal_value,
    
    -- Métricas de Meetings
    COUNT(DISTINCT m.id) AS total_meetings,
    COUNT(DISTINCT m.id) FILTER (WHERE m.status = 'completed') AS completed_meetings,
    COUNT(DISTINCT m.id) FILTER (WHERE m.converted_to_sale = true) AS converted_meetings,
    
    -- Métricas de Equipe
    COUNT(DISTINCT e.id) AS total_employees,
    COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'active') AS active_employees,
    COUNT(DISTINCT t.id) AS total_teams,
    
    -- Timestamp de última atualização
    NOW() AS last_updated
FROM 
    whitelabels w
    LEFT JOIN contacts c ON c.whitelabel_id = w.id
    LEFT JOIN deals d ON d.whitelabel_id = w.id
    LEFT JOIN meetings m ON m.whitelabel_id = w.id
    LEFT JOIN employees e ON e.whitelabel_id = w.id
    LEFT JOIN teams t ON t.whitelabel_id = w.id
GROUP BY 
    w.id, w.name;

-- Criar índice na materialized view para acesso rápido
CREATE UNIQUE INDEX idx_dashboard_analytics_mv_whitelabel 
ON dashboard_analytics_mv(whitelabel_id);

-- Comentário na view
COMMENT ON MATERIALIZED VIEW dashboard_analytics_mv IS 
'View materializada com métricas precalculadas do dashboard para melhor performance. Refresh automático via trigger ou manual via função refresh_dashboard_analytics().';


-- =====================================================
-- PARTE 5: FUNÇÃO PARA REFRESH DA VIEW MATERIALIZADA
-- =====================================================

-- Função para refresh manual da view
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics_mv;
    
    -- Log do refresh (opcional)
    RAISE NOTICE 'Dashboard analytics refreshed at %', NOW();
END;
$$;

-- Comentário na função
COMMENT ON FUNCTION refresh_dashboard_analytics() IS 
'Atualiza a view materializada de analytics do dashboard. Pode ser chamada manualmente ou via scheduled job.';


-- =====================================================
-- PARTE 6: TRIGGER PARA AUTO-REFRESH DA VIEW
-- =====================================================

-- Função trigger para refresh após mudanças
CREATE OR REPLACE FUNCTION trigger_refresh_dashboard_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Apenas agenda um refresh, não executa diretamente (evita locks)
    -- Em produção, usar pg_cron ou similar para refresh periódico
    PERFORM pg_notify('dashboard_analytics_refresh', NOW()::text);
    RETURN NEW;
END;
$$;

-- Triggers para atualizar a view quando dados mudarem
-- Nota: Em produção, considere usar refresh periódico (ex: a cada 5 minutos)
-- ao invés de triggers para evitar overhead em cada INSERT/UPDATE

-- Trigger em contacts
DROP TRIGGER IF EXISTS trigger_contacts_analytics_refresh ON contacts;
CREATE TRIGGER trigger_contacts_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON contacts
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_analytics();

-- Trigger em deals
DROP TRIGGER IF EXISTS trigger_deals_analytics_refresh ON deals;
CREATE TRIGGER trigger_deals_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON deals
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_analytics();

-- Trigger em meetings
DROP TRIGGER IF EXISTS trigger_meetings_analytics_refresh ON meetings;
CREATE TRIGGER trigger_meetings_analytics_refresh
    AFTER INSERT OR UPDATE OR DELETE ON meetings
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_dashboard_analytics();


-- =====================================================
-- PARTE 7: VIEW PARA PIPELINE METRICS POR ESTÁGIO
-- =====================================================

-- View (não materializada) para métricas de pipeline
CREATE OR REPLACE VIEW pipeline_stage_metrics AS
SELECT 
    ps.id AS stage_id,
    ps.pipeline_id,
    p.whitelabel_id,
    ps.name AS stage_name,
    ps.order_position,
    ps.color,
    ps.counts_as_meeting,
    ps.counts_as_sale,
    
    -- Métricas do estágio
    COUNT(c.id) AS contacts_count,
    COALESCE(AVG(c.deal_value), 0) AS avg_deal_value,
    COALESCE(SUM(c.deal_value), 0) AS total_deal_value,
    
    -- Tempo médio no estágio (em dias)
    COALESCE(
        AVG(EXTRACT(EPOCH FROM (COALESCE(c.updated_at, NOW()) - c.created_at)) / 86400),
        0
    ) AS avg_days_in_stage,
    
    -- Taxa de conversão para o próximo estágio
    -- (simplificado - assumindo que updated_at indica movimentação)
    CASE 
        WHEN COUNT(c.id) > 0 THEN
            (COUNT(c.id) FILTER (WHERE c.stage_id != ps.id)::FLOAT / COUNT(c.id)::FLOAT) * 100
        ELSE 0
    END AS conversion_rate_percent
    
FROM 
    pipeline_stages ps
    JOIN pipelines p ON p.id = ps.pipeline_id
    LEFT JOIN contacts c ON c.stage_id = ps.id
GROUP BY 
    ps.id, ps.pipeline_id, p.whitelabel_id, ps.name, 
    ps.order_position, ps.color, ps.counts_as_meeting, ps.counts_as_sale
ORDER BY 
    p.whitelabel_id, ps.pipeline_id, ps.order_position;

-- Comentário na view
COMMENT ON VIEW pipeline_stage_metrics IS 
'View com métricas agregadas por estágio de pipeline: contagem, valores médios, tempo médio, taxa de conversão.';


-- =====================================================
-- PARTE 8: ÍNDICES PARA OTIMIZAR RLS POLICIES
-- =====================================================

-- Índice para lookup de auth.uid() em users
-- (muitas policies fazem: SELECT whitelabel_id FROM users WHERE id = auth.uid())
CREATE INDEX IF NOT EXISTS idx_users_id_whitelabel 
ON users(id, whitelabel_id);

-- Índice para lookup de auth.uid() em employees via email
CREATE INDEX IF NOT EXISTS idx_employees_id_whitelabel 
ON employees(id, whitelabel_id);


-- =====================================================
-- PARTE 9: ANÁLISE E ESTATÍSTICAS
-- =====================================================

-- Atualizar estatísticas das tabelas para o query planner
ANALYZE contacts;
ANALYZE deals;
ANALYZE meetings;
ANALYZE employees;
ANALYZE user_commissions;
ANALYZE pipelines;
ANALYZE pipeline_stages;
ANALYZE teams;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================

-- Para atualizar manualmente a view materializada:
-- SELECT refresh_dashboard_analytics();

-- Para consultar analytics precalculados:
-- SELECT * FROM dashboard_analytics_mv WHERE whitelabel_id = 'xxx';

-- Para consultar métricas de pipeline:
-- SELECT * FROM pipeline_stage_metrics WHERE whitelabel_id = 'xxx';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Refresh inicial da view materializada
SELECT refresh_dashboard_analytics();

RAISE NOTICE 'Performance optimization completed successfully!';
RAISE NOTICE 'Created composite indexes, materialized views, and partial indexes.';
RAISE NOTICE 'Use refresh_dashboard_analytics() to manually update analytics or configure pg_cron for automatic refresh.';

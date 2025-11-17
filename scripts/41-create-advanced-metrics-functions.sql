-- Migration: Create functions for advanced metrics (business model agnostic)
-- These functions calculate metrics based on volume/counts, not monetary values
-- Applied on: 2024-01-XX via Supabase MCP

-- =====================================================
-- Function 1: Get Funnel Conversion Rates
-- Returns conversion rate between each stage in a pipeline
-- =====================================================
CREATE OR REPLACE FUNCTION get_funnel_conversion_rates(
  p_whitelabel_id UUID,
  p_pipeline_id UUID DEFAULT NULL,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  pipeline_id UUID,
  pipeline_name TEXT,
  stage_id UUID,
  stage_name TEXT,
  stage_order INTEGER,
  contacts_in_stage BIGINT,
  contacts_in_next_stage BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH stages_with_counts AS (
    SELECT 
      ps.pipeline_id,
      p.name as pipeline_name,
      ps.id as stage_id,
      ps.name as stage_name,
      ps.order_position,
      COUNT(DISTINCT c.id) FILTER (WHERE c.stage_id = ps.id)::BIGINT as contacts_count,
      LEAD(ps.id) OVER (PARTITION BY ps.pipeline_id ORDER BY ps.order_position) as next_stage_id
    FROM pipeline_stages ps
    JOIN pipelines p ON p.id = ps.pipeline_id
    LEFT JOIN contacts c ON c.stage_id = ps.id 
      AND c.whitelabel_id = p_whitelabel_id
      AND (p_from_date IS NULL OR c.created_at >= p_from_date)
      AND (p_to_date IS NULL OR c.created_at <= p_to_date)
    WHERE p.whitelabel_id = p_whitelabel_id
      AND (p_pipeline_id IS NULL OR p.id = p_pipeline_id)
    GROUP BY ps.pipeline_id, p.name, ps.id, ps.name, ps.order_position
  ),
  with_next_stage_counts AS (
    SELECT 
      swc.*,
      COUNT(DISTINCT c.id)::BIGINT as next_stage_count
    FROM stages_with_counts swc
    LEFT JOIN contacts c ON c.stage_id = swc.next_stage_id
      AND c.whitelabel_id = p_whitelabel_id
      AND (p_from_date IS NULL OR c.created_at >= p_from_date)
      AND (p_to_date IS NULL OR c.created_at <= p_to_date)
    GROUP BY swc.pipeline_id, swc.pipeline_name, swc.stage_id, swc.stage_name, 
             swc.order_position, swc.contacts_count, swc.next_stage_id
  )
  SELECT 
    wnsc.pipeline_id,
    wnsc.pipeline_name,
    wnsc.stage_id,
    wnsc.stage_name,
    wnsc.order_position as stage_order,
    wnsc.contacts_count as contacts_in_stage,
    wnsc.next_stage_count as contacts_in_next_stage,
    CASE 
      WHEN wnsc.contacts_count > 0 AND wnsc.next_stage_id IS NOT NULL
      THEN ROUND((wnsc.next_stage_count::NUMERIC / wnsc.contacts_count::NUMERIC) * 100, 2)
      ELSE NULL
    END as conversion_rate
  FROM with_next_stage_counts wnsc
  ORDER BY wnsc.pipeline_id, wnsc.order_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function 2: Get Channel Breakdown
-- Returns distribution of leads by source channel
-- =====================================================
CREATE OR REPLACE FUNCTION get_channel_breakdown(
  p_whitelabel_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  channel TEXT,
  total_leads BIGINT,
  converted_leads BIGINT,
  conversion_rate NUMERIC,
  percentage_of_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH channel_stats AS (
    SELECT 
      COALESCE(c.lead_source, 'Unknown') as source_channel,
      COUNT(*)::BIGINT as lead_count,
      COUNT(*) FILTER (
        WHERE EXISTS (
          SELECT 1 
          FROM pipeline_stages ps 
          WHERE ps.id = c.stage_id 
            AND ps.counts_as_sale = true
        )
      )::BIGINT as converted_count
    FROM contacts c
    WHERE c.whitelabel_id = p_whitelabel_id
      AND (p_from_date IS NULL OR c.created_at >= p_from_date)
      AND (p_to_date IS NULL OR c.created_at <= p_to_date)
    GROUP BY c.lead_source
  ),
  total_count AS (
    SELECT SUM(lead_count)::BIGINT as total FROM channel_stats
  )
  SELECT 
    cs.source_channel as channel,
    cs.lead_count as total_leads,
    cs.converted_count as converted_leads,
    CASE 
      WHEN cs.lead_count > 0 
      THEN ROUND((cs.converted_count::NUMERIC / cs.lead_count::NUMERIC) * 100, 2)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN tc.total > 0 
      THEN ROUND((cs.lead_count::NUMERIC / tc.total::NUMERIC) * 100, 2)
      ELSE 0
    END as percentage_of_total
  FROM channel_stats cs
  CROSS JOIN total_count tc
  ORDER BY cs.lead_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function 3: Get Customer Evolution (Monthly)
-- Returns count of new customers per month
-- =====================================================
CREATE OR REPLACE FUNCTION get_customer_evolution(
  p_whitelabel_id UUID,
  p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  month DATE,
  new_customers BIGINT,
  cumulative_customers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_customers AS (
    SELECT 
      DATE_TRUNC('month', c.sale_date)::DATE as month_date,
      COUNT(DISTINCT c.id)::BIGINT as customer_count
    FROM contacts c
    JOIN pipeline_stages ps ON ps.id = c.stage_id
    WHERE c.whitelabel_id = p_whitelabel_id
      AND ps.counts_as_sale = true
      AND c.sale_date IS NOT NULL
      AND c.sale_date >= NOW() - INTERVAL '1 month' * p_months
    GROUP BY DATE_TRUNC('month', c.sale_date)
  )
  SELECT 
    mc.month_date as month,
    mc.customer_count as new_customers,
    SUM(mc.customer_count) OVER (ORDER BY mc.month_date)::BIGINT as cumulative_customers
  FROM monthly_customers mc
  ORDER BY mc.month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION get_funnel_conversion_rates IS 'Calculate conversion rates between pipeline stages - business model agnostic';
COMMENT ON FUNCTION get_channel_breakdown IS 'Get lead distribution by source channel with conversion metrics';
COMMENT ON FUNCTION get_customer_evolution IS 'Get monthly new customer counts over time';

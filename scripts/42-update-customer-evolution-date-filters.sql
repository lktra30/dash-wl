-- Migration: Update get_customer_evolution to accept date range filters
-- This allows the function to be filtered by fromDate/toDate instead of just months
-- Applied on: 2024-01-XX

-- =====================================================
-- Drop old version of function
-- =====================================================
DROP FUNCTION IF EXISTS get_customer_evolution(UUID, INTEGER);

-- =====================================================
-- Update Function: Get Customer Evolution (with date range support)
-- Returns count of new customers per month, now with optional date filters
-- =====================================================
CREATE OR REPLACE FUNCTION get_customer_evolution(
  p_whitelabel_id UUID,
  p_months INTEGER DEFAULT 12,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_to_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  month DATE,
  new_customers BIGINT,
  cumulative_customers BIGINT
) AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  -- Determine date range: use provided dates or calculate from months
  IF p_from_date IS NOT NULL AND p_to_date IS NOT NULL THEN
    v_start_date := p_from_date;
    v_end_date := p_to_date;
  ELSE
    v_start_date := NOW() - INTERVAL '1 month' * p_months;
    v_end_date := NOW();
  END IF;

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
      AND c.sale_date >= v_start_date
      AND c.sale_date <= v_end_date
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

-- Update comment for documentation
COMMENT ON FUNCTION get_customer_evolution IS 'Get monthly new customer counts over time - now supports date range filters';

-- Migration 47: Create Monthly Metrics Table
-- Purpose: Store aggregated monthly metrics per whitelabel for performance tracking
-- Metrics: Total sales value, new customers count, deals count, average deal value

-- ============================================================================
-- 1. CREATE TABLE: monthly_metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS monthly_metrics (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
    
    -- Period identification
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    period_year INTEGER NOT NULL CHECK (period_year >= 2020),
    
    -- METRIC 1: Total sales value for the month
    total_sales_value NUMERIC DEFAULT 0 CHECK (total_sales_value >= 0),
    
    -- METRIC 2: Count of new customers/contacts acquired in the month
    new_customers_count INTEGER DEFAULT 0 CHECK (new_customers_count >= 0),
    
    -- Additional metrics for comprehensive analysis
    total_deals_won INTEGER DEFAULT 0 CHECK (total_deals_won >= 0),
    total_deals_lost INTEGER DEFAULT 0 CHECK (total_deals_lost >= 0),
    average_deal_value NUMERIC DEFAULT 0 CHECK (average_deal_value >= 0),
    conversion_rate NUMERIC DEFAULT 0 CHECK (conversion_rate >= 0 AND conversion_rate <= 100),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure only one record per whitelabel per month/year
    CONSTRAINT unique_whitelabel_period UNIQUE (whitelabel_id, period_month, period_year)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_whitelabel ON monthly_metrics(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_period ON monthly_metrics(period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_whitelabel_period ON monthly_metrics(whitelabel_id, period_year DESC, period_month DESC);

-- Add comment
COMMENT ON TABLE monthly_metrics IS 'Aggregated monthly sales and customer metrics per whitelabel';
COMMENT ON COLUMN monthly_metrics.total_sales_value IS 'Total value of all won deals in the month';
COMMENT ON COLUMN monthly_metrics.new_customers_count IS 'Count of new contacts/customers acquired in the month';
COMMENT ON COLUMN monthly_metrics.conversion_rate IS 'Percentage of deals won vs total deals in the month';

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE monthly_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view metrics from their whitelabel
CREATE POLICY "Users can view monthly metrics from their whitelabel"
    ON monthly_metrics
    FOR SELECT
    USING (
        whitelabel_id IN (
            SELECT whitelabel_id FROM employees WHERE email = auth.jwt()->>'email'
            UNION
            SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
        )
        OR
        -- SuperAdmins can view all metrics
        EXISTS (
            SELECT 1 FROM employees 
            WHERE email = auth.jwt()->>'email' 
            AND user_role = 'SuperAdmin'
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND role = 'SuperAdmin'
        )
    );

-- Policy: Only admins and service_role can insert/update metrics
CREATE POLICY "Admins can insert monthly metrics"
    ON monthly_metrics
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND user_role IN ('admin', 'SuperAdmin')
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND role IN ('admin', 'SuperAdmin')
        )
    );

CREATE POLICY "Admins can update monthly metrics"
    ON monthly_metrics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND user_role IN ('admin', 'SuperAdmin')
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND role IN ('admin', 'SuperAdmin')
        )
    );

CREATE POLICY "Admins can delete monthly metrics"
    ON monthly_metrics
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND user_role IN ('admin', 'SuperAdmin')
        )
        OR
        EXISTS (
            SELECT 1 FROM users 
            WHERE email = auth.jwt()->>'email' 
            AND whitelabel_id = monthly_metrics.whitelabel_id
            AND role IN ('admin', 'SuperAdmin')
        )
    );

-- ============================================================================
-- 3. FUNCTION: Calculate monthly metrics for a specific period
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_monthly_metrics(
    p_whitelabel_id UUID,
    p_month INTEGER,
    p_year INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_sales_value NUMERIC;
    v_new_customers_count INTEGER;
    v_total_deals_won INTEGER;
    v_total_deals_lost INTEGER;
    v_average_deal_value NUMERIC;
    v_conversion_rate NUMERIC;
    v_period_start DATE;
    v_period_end DATE;
BEGIN
    -- Calculate period boundaries
    v_period_start := DATE(p_year || '-' || p_month || '-01');
    v_period_end := (v_period_start + INTERVAL '1 month')::DATE;
    
    -- Calculate total sales value from won deals in the period
    SELECT COALESCE(SUM(value), 0)
    INTO v_total_sales_value
    FROM deals
    WHERE whitelabel_id = p_whitelabel_id
        AND status = 'won'
        AND sale_date >= v_period_start
        AND sale_date < v_period_end;
    
    -- Count new customers/contacts created in the period
    SELECT COUNT(*)
    INTO v_new_customers_count
    FROM contacts
    WHERE whitelabel_id = p_whitelabel_id
        AND created_at >= v_period_start
        AND created_at < v_period_end;
    
    -- Count won deals in the period
    SELECT COUNT(*)
    INTO v_total_deals_won
    FROM deals
    WHERE whitelabel_id = p_whitelabel_id
        AND status = 'won'
        AND sale_date >= v_period_start
        AND sale_date < v_period_end;
    
    -- Count lost deals in the period
    SELECT COUNT(*)
    INTO v_total_deals_lost
    FROM deals
    WHERE whitelabel_id = p_whitelabel_id
        AND status = 'lost'
        AND updated_at >= v_period_start
        AND updated_at < v_period_end;
    
    -- Calculate average deal value
    IF v_total_deals_won > 0 THEN
        v_average_deal_value := v_total_sales_value / v_total_deals_won;
    ELSE
        v_average_deal_value := 0;
    END IF;
    
    -- Calculate conversion rate
    IF (v_total_deals_won + v_total_deals_lost) > 0 THEN
        v_conversion_rate := (v_total_deals_won::NUMERIC / (v_total_deals_won + v_total_deals_lost)) * 100;
    ELSE
        v_conversion_rate := 0;
    END IF;
    
    -- Insert or update the metrics record
    INSERT INTO monthly_metrics (
        whitelabel_id,
        period_month,
        period_year,
        total_sales_value,
        new_customers_count,
        total_deals_won,
        total_deals_lost,
        average_deal_value,
        conversion_rate,
        updated_at
    ) VALUES (
        p_whitelabel_id,
        p_month,
        p_year,
        v_total_sales_value,
        v_new_customers_count,
        v_total_deals_won,
        v_total_deals_lost,
        v_average_deal_value,
        v_conversion_rate,
        NOW()
    )
    ON CONFLICT (whitelabel_id, period_month, period_year)
    DO UPDATE SET
        total_sales_value = EXCLUDED.total_sales_value,
        new_customers_count = EXCLUDED.new_customers_count,
        total_deals_won = EXCLUDED.total_deals_won,
        total_deals_lost = EXCLUDED.total_deals_lost,
        average_deal_value = EXCLUDED.average_deal_value,
        conversion_rate = EXCLUDED.conversion_rate,
        updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION calculate_monthly_metrics IS 'Calculates and stores monthly metrics for a specific whitelabel and period';

-- ============================================================================
-- 4. FUNCTION: Refresh all historical monthly metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_monthly_metrics(p_whitelabel_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_min_date DATE;
    v_current_date DATE;
    v_month INTEGER;
    v_year INTEGER;
BEGIN
    -- Find the earliest date from deals or contacts
    SELECT LEAST(
        COALESCE((SELECT MIN(created_at)::DATE FROM deals WHERE whitelabel_id = p_whitelabel_id), CURRENT_DATE),
        COALESCE((SELECT MIN(created_at)::DATE FROM contacts WHERE whitelabel_id = p_whitelabel_id), CURRENT_DATE)
    ) INTO v_min_date;
    
    -- If no data found, start from current month
    IF v_min_date IS NULL THEN
        v_min_date := DATE_TRUNC('month', CURRENT_DATE)::DATE;
    END IF;
    
    -- Loop through each month from min_date to current date
    v_current_date := DATE_TRUNC('month', v_min_date)::DATE;
    
    WHILE v_current_date <= DATE_TRUNC('month', CURRENT_DATE)::DATE LOOP
        v_month := EXTRACT(MONTH FROM v_current_date);
        v_year := EXTRACT(YEAR FROM v_current_date);
        
        -- Calculate metrics for this month
        PERFORM calculate_monthly_metrics(p_whitelabel_id, v_month, v_year);
        
        -- Move to next month
        v_current_date := (v_current_date + INTERVAL '1 month')::DATE;
    END LOOP;
    
    RAISE NOTICE 'Successfully refreshed monthly metrics for whitelabel %', p_whitelabel_id;
END;
$$;

COMMENT ON FUNCTION refresh_all_monthly_metrics IS 'Recalculates all historical monthly metrics for a whitelabel from the earliest data to current month';

-- ============================================================================
-- 5. FUNCTION: Auto-update trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_update_monthly_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_month INTEGER;
    v_year INTEGER;
    v_whitelabel_id UUID;
BEGIN
    -- Determine whitelabel_id and period based on trigger
    IF TG_TABLE_NAME = 'deals' THEN
        v_whitelabel_id := COALESCE(NEW.whitelabel_id, OLD.whitelabel_id);
        IF NEW.sale_date IS NOT NULL THEN
            v_month := EXTRACT(MONTH FROM NEW.sale_date);
            v_year := EXTRACT(YEAR FROM NEW.sale_date);
        ELSIF OLD.sale_date IS NOT NULL THEN
            v_month := EXTRACT(MONTH FROM OLD.sale_date);
            v_year := EXTRACT(YEAR FROM OLD.sale_date);
        ELSE
            RETURN NEW;
        END IF;
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        v_whitelabel_id := COALESCE(NEW.whitelabel_id, OLD.whitelabel_id);
        v_month := EXTRACT(MONTH FROM COALESCE(NEW.created_at, OLD.created_at));
        v_year := EXTRACT(YEAR FROM COALESCE(NEW.created_at, OLD.created_at));
    ELSE
        RETURN NEW;
    END IF;
    
    -- Recalculate metrics for the affected period (async, won't block the transaction)
    PERFORM calculate_monthly_metrics(v_whitelabel_id, v_month, v_year);
    
    RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. CREATE TRIGGERS for auto-update
-- ============================================================================

-- Trigger on deals table
DROP TRIGGER IF EXISTS trigger_update_monthly_metrics_on_deals ON deals;
CREATE TRIGGER trigger_update_monthly_metrics_on_deals
    AFTER INSERT OR UPDATE OR DELETE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_monthly_metrics();

-- Trigger on contacts table
DROP TRIGGER IF EXISTS trigger_update_monthly_metrics_on_contacts ON contacts;
CREATE TRIGGER trigger_update_monthly_metrics_on_contacts
    AFTER INSERT OR DELETE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_monthly_metrics();

-- ============================================================================
-- 7. Populate initial data for existing whitelabels
-- ============================================================================

-- Call refresh function for each existing whitelabel
DO $$
DECLARE
    v_whitelabel RECORD;
BEGIN
    FOR v_whitelabel IN SELECT id FROM whitelabels LOOP
        PERFORM refresh_all_monthly_metrics(v_whitelabel.id);
    END LOOP;
    
    RAISE NOTICE 'Initial monthly metrics populated for all whitelabels';
END;
$$;

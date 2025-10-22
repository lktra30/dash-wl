-- Commissions Settings Table
-- Stores commission structure and targets for SDRs and Closers

CREATE TABLE IF NOT EXISTS commissions_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
  
  -- Checkpoint thresholds (% of target to reach each tier)
  checkpoint_1_percent DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  checkpoint_2_percent DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  checkpoint_3_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  
  -- Checkpoint commission multipliers (% of base commission they receive at each tier)
  checkpoint_1_commission_percent DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  checkpoint_2_commission_percent DECIMAL(5,2) NOT NULL DEFAULT 75.00,
  checkpoint_3_commission_percent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
  
  -- SDR Settings
  sdr_meeting_commission DECIMAL(10,2) NOT NULL DEFAULT 50.00, -- Fixed value per meeting
  sdr_meetings_target INTEGER NOT NULL DEFAULT 20, -- Monthly meetings target
  sdr_bonus_closed_meeting DECIMAL(10,2) NOT NULL DEFAULT 100.00, -- Additional bonus when meeting converts to sale
  
  -- Closer Settings
  closer_commission_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00, -- % of sale value
  closer_sales_target DECIMAL(12,2) NOT NULL DEFAULT 10000.00, -- Monthly sales target
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one settings record per whitelabel
  UNIQUE(whitelabel_id),
  
  -- Validation constraints
  CHECK (checkpoint_1_percent >= 0 AND checkpoint_1_percent <= 100),
  CHECK (checkpoint_2_percent >= checkpoint_1_percent AND checkpoint_2_percent <= 100),
  CHECK (checkpoint_3_percent >= checkpoint_2_percent AND checkpoint_3_percent <= 100),
  CHECK (checkpoint_1_commission_percent >= 0 AND checkpoint_1_commission_percent <= 100),
  CHECK (checkpoint_2_commission_percent >= 0 AND checkpoint_2_commission_percent <= 100),
  CHECK (checkpoint_3_commission_percent >= 0 AND checkpoint_3_commission_percent <= 100),
  CHECK (sdr_meeting_commission >= 0),
  CHECK (sdr_meetings_target > 0),
  CHECK (sdr_bonus_closed_meeting >= 0),
  CHECK (closer_commission_percent >= 0 AND closer_commission_percent <= 100),
  CHECK (closer_sales_target > 0)
);

-- Meetings Table (for tracking SDR meetings)
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
  sdr_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  converted_to_sale BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Commissions Table (stores calculated commissions per period)
CREATE TABLE IF NOT EXISTS user_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  whitelabel_id UUID NOT NULL REFERENCES whitelabels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
  period_year INTEGER NOT NULL CHECK (period_year >= 2020),
  user_role TEXT NOT NULL CHECK (user_role IN ('sdr', 'closer')),
  
  -- SDR Metrics
  meetings_held INTEGER DEFAULT 0,
  meetings_converted INTEGER DEFAULT 0,
  
  -- Closer Metrics
  total_sales DECIMAL(12,2) DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  
  -- Commission Calculations
  base_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  checkpoint_tier INTEGER NOT NULL DEFAULT 0 CHECK (checkpoint_tier >= 0 AND checkpoint_tier <= 3),
  checkpoint_multiplier DECIMAL(5,2) NOT NULL DEFAULT 0,
  final_commission DECIMAL(12,2) NOT NULL DEFAULT 0,
  target_achievement_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user per period
  UNIQUE(user_id, period_month, period_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_commissions_settings_whitelabel ON commissions_settings(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_meetings_whitelabel ON meetings(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_meetings_sdr ON meetings(sdr_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled ON meetings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_user_commissions_whitelabel ON user_commissions(whitelabel_id);
CREATE INDEX IF NOT EXISTS idx_user_commissions_user ON user_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_commissions_period ON user_commissions(period_year, period_month);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_commissions_settings_updated_at BEFORE UPDATE ON commissions_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_commissions_updated_at BEFORE UPDATE ON user_commissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

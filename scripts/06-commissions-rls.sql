-- Row Level Security (RLS) for Commissions Settings
-- Only admins can view and modify commission settings

-- Enable RLS on commissions_settings
ALTER TABLE commissions_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all commission settings in their whitelabel
CREATE POLICY "Admins can view commission settings"
  ON commissions_settings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert commission settings for their whitelabel
CREATE POLICY "Admins can insert commission settings"
  ON commissions_settings
  FOR INSERT
  WITH CHECK (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update commission settings in their whitelabel
CREATE POLICY "Admins can update commission settings"
  ON commissions_settings
  FOR UPDATE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete commission settings in their whitelabel
CREATE POLICY "Admins can delete commission settings"
  ON commissions_settings
  FOR DELETE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS for Meetings Table
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view meetings in their whitelabel
CREATE POLICY "Users can view meetings"
  ON meetings
  FOR SELECT
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: SDRs can create their own meetings
CREATE POLICY "SDRs can create meetings"
  ON meetings
  FOR INSERT
  WITH CHECK (
    sdr_id = auth.uid() AND
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid()
    )
  );

-- Policy: SDRs can update their own meetings, admins/managers can update all
CREATE POLICY "Users can update meetings"
  ON meetings
  FOR UPDATE
  USING (
    sdr_id = auth.uid() OR
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: Admins and managers can delete meetings
CREATE POLICY "Admins and managers can delete meetings"
  ON meetings
  FOR DELETE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- RLS for User Commissions Table
ALTER TABLE user_commissions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own commissions, admins/managers can view all
CREATE POLICY "Users can view commissions"
  ON user_commissions
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Policy: System/Admins can insert commission records
CREATE POLICY "Admins can insert commissions"
  ON user_commissions
  FOR INSERT
  WITH CHECK (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update commission records
CREATE POLICY "Admins can update commissions"
  ON user_commissions
  FOR UPDATE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can delete commission records
CREATE POLICY "Admins can delete commissions"
  ON user_commissions
  FOR DELETE
  USING (
    whitelabel_id IN (
      SELECT whitelabel_id FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

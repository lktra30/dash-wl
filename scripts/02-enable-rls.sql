-- Enable Row Level Security on all tables
ALTER TABLE whitelabels ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for whitelabels
CREATE POLICY "Users can view their own whitelabel"
  ON whitelabels FOR SELECT
  USING (id IN (SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Admins can update their whitelabel"
  ON whitelabels FOR UPDATE
  USING (id IN (
    SELECT whitelabel_id FROM users 
    WHERE email = auth.jwt()->>'email' AND role = 'admin'
  ));

-- Create RLS policies for users
CREATE POLICY "Users can view users in their whitelabel"
  ON users FOR SELECT
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

-- Create RLS policies for contacts
CREATE POLICY "Users can view contacts in their whitelabel"
  ON contacts FOR SELECT
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can insert contacts in their whitelabel"
  ON contacts FOR INSERT
  WITH CHECK (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can update contacts in their whitelabel"
  ON contacts FOR UPDATE
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can delete contacts in their whitelabel"
  ON contacts FOR DELETE
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

-- Create RLS policies for deals
CREATE POLICY "Users can view deals in their whitelabel"
  ON deals FOR SELECT
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can insert deals in their whitelabel"
  ON deals FOR INSERT
  WITH CHECK (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can update deals in their whitelabel"
  ON deals FOR UPDATE
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can delete deals in their whitelabel"
  ON deals FOR DELETE
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

-- Create RLS policies for teams
CREATE POLICY "Users can view teams in their whitelabel"
  ON teams FOR SELECT
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Admins can manage teams in their whitelabel"
  ON teams FOR ALL
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users 
    WHERE email = auth.jwt()->>'email' AND role IN ('admin', 'manager')
  ));

-- Create RLS policies for team_members
CREATE POLICY "Users can view team members in their whitelabel"
  ON team_members FOR SELECT
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON t.whitelabel_id = u.whitelabel_id
    WHERE u.email = auth.jwt()->>'email'
  ));

CREATE POLICY "Admins can manage team members in their whitelabel"
  ON team_members FOR ALL
  USING (team_id IN (
    SELECT t.id FROM teams t
    JOIN users u ON t.whitelabel_id = u.whitelabel_id
    WHERE u.email = auth.jwt()->>'email' AND u.role IN ('admin', 'manager')
  ));

-- Create RLS policies for activities
CREATE POLICY "Users can view activities in their whitelabel"
  ON activities FOR SELECT
  USING (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

CREATE POLICY "Users can insert activities in their whitelabel"
  ON activities FOR INSERT
  WITH CHECK (whitelabel_id IN (
    SELECT whitelabel_id FROM users WHERE email = auth.jwt()->>'email'
  ));

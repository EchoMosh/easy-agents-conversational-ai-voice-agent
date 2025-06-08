-- Create phone_numbers table for Twilio phone number management
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  twilio_phone_number TEXT NOT NULL UNIQUE, -- E.164 format: +1234567890
  twilio_sid TEXT NOT NULL UNIQUE, -- Twilio's phone number SID
  friendly_name TEXT, -- User-friendly name
  capabilities JSONB DEFAULT '{"voice": true, "sms": false, "mms": false}'::jsonb,
  area_code TEXT, -- Extracted area code for display
  country_code TEXT DEFAULT 'US',
  monthly_cost DECIMAL(10,2) DEFAULT 1.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'released')),
  inbound_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  outbound_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  vapi_phone_number_id TEXT, -- VAPI's phone number ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_phone_numbers_workspace ON phone_numbers(workspace_id);
CREATE INDEX idx_phone_numbers_inbound_agent ON phone_numbers(inbound_agent_id);
CREATE INDEX idx_phone_numbers_outbound_agent ON phone_numbers(outbound_agent_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_phone_numbers_updated_at BEFORE UPDATE
    ON phone_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add column to agents table for primary phone number tracking
ALTER TABLE agents ADD COLUMN IF NOT EXISTS primary_phone_number_id UUID REFERENCES phone_numbers(id);

-- Enable Row Level Security
ALTER TABLE phone_numbers ENABLE ROW LEVEL SECURITY;

-- Create policies for phone_numbers table
-- Users can view phone numbers in their workspace
CREATE POLICY "Users can view phone numbers in their workspace"
  ON phone_numbers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert phone numbers in their workspace (admin only)
CREATE POLICY "Workspace admins can insert phone numbers"
  ON phone_numbers
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update phone numbers in their workspace (admin only)
CREATE POLICY "Workspace admins can update phone numbers"
  ON phone_numbers
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Users can delete phone numbers in their workspace (admin only)
CREATE POLICY "Workspace admins can delete phone numbers"
  ON phone_numbers
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

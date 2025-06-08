-- Create table for storing voice preview URLs
CREATE TABLE IF NOT EXISTS voice_previews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  voice_id TEXT NOT NULL UNIQUE,
  voice_name TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index on voice_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_voice_previews_voice_id ON voice_previews(voice_id);

-- Enable RLS
ALTER TABLE voice_previews ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read voice previews
CREATE POLICY "Users can view voice previews" ON voice_previews
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert voice previews
CREATE POLICY "Users can create voice previews" ON voice_previews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update voice previews
CREATE POLICY "Users can update voice previews" ON voice_previews
  FOR UPDATE
  TO authenticated
  USING (true);

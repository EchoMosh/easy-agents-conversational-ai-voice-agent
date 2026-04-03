-- Add missing config columns to agents table for settings save
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS voice_config jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS transcriber_config jsonb DEFAULT NULL;

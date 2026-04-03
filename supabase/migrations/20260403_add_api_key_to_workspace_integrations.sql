-- Add api_key and display_name columns for generic provider integrations
ALTER TABLE public.workspace_integrations
  ADD COLUMN IF NOT EXISTS api_key text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS display_name text DEFAULT NULL;

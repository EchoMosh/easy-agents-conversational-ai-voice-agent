-- Add trieve_dataset_id column to agents table
ALTER TABLE agents ADD COLUMN IF NOT EXISTS trieve_dataset_id TEXT;

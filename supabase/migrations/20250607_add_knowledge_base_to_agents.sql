-- Add columns for Vapi knowledge base support
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS vapi_knowledge_base_id TEXT,
ADD COLUMN IF NOT EXISTS vapi_file_ids TEXT[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN agents.vapi_knowledge_base_id IS 'The ID of the Vapi knowledge base associated with this agent';
COMMENT ON COLUMN agents.vapi_file_ids IS 'Array of Vapi file IDs that have been uploaded for this agent';

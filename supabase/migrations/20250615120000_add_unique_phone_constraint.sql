-- Add unique constraint for phone numbers within each workspace
-- This prevents duplicate phone numbers within the same workspace
-- but allows the same phone number across different workspaces

-- First, let's create a partial unique index that only applies to non-null phone numbers
-- This allows multiple leads with null phone numbers but prevents duplicate non-null phone numbers
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS leads_phone_workspace_unique 
ON leads (phone, workspace_id) 
WHERE phone IS NOT NULL;

-- Add a comment to document the constraint
COMMENT ON INDEX leads_phone_workspace_unique IS 'Ensures phone numbers are unique within each workspace, excluding null values';

-- Add the maxDurationSeconds column to the agents table
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS "maxDurationSeconds" INTEGER DEFAULT 600;

-- Add a comment to document the column
COMMENT ON COLUMN agents."maxDurationSeconds" IS 'Maximum duration in seconds for agent conversations (default: 600 seconds / 10 minutes)';

-- Optional: Add a check constraint to ensure reasonable values
ALTER TABLE agents 
ADD CONSTRAINT check_max_duration_seconds 
CHECK ("maxDurationSeconds" > 0 AND "maxDurationSeconds" <= 3600);

-- Update any existing rows that might have NULL values
UPDATE agents 
SET "maxDurationSeconds" = 600 
WHERE "maxDurationSeconds" IS NULL;

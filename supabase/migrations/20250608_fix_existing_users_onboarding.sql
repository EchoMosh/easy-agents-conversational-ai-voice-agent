-- Fix existing users who might be missing onboarding_completed flag
-- This migration ensures that users who have workspaces or agents are marked as having completed onboarding

-- Update profiles for users who have workspace memberships but missing onboarding_completed
UPDATE profiles
SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM workspace_members
) 
AND (onboarding_completed IS NULL OR onboarding_completed = false);

-- Also update profiles for users who own workspaces
UPDATE profiles
SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT owner_id 
  FROM workspaces
  WHERE owner_id IS NOT NULL
) 
AND (onboarding_completed IS NULL OR onboarding_completed = false);

-- Update profiles for users who have created agents
UPDATE profiles
SET onboarding_completed = true
WHERE id IN (
  SELECT DISTINCT created_by 
  FROM agents
  WHERE created_by IS NOT NULL
) 
AND (onboarding_completed IS NULL OR onboarding_completed = false);

-- Add a comment to track this fix
COMMENT ON COLUMN profiles.onboarding_completed IS 'Indicates if user has completed onboarding. Fixed for existing users on 2025-06-08';

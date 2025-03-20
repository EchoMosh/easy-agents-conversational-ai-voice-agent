-- ===============================================================================
-- Supabase Auth User Trigger Setup
-- ===============================================================================
-- This script creates a trigger on auth.users to automatically create a profile
-- when a new user signs up. It resolves the "Database error saving new user" issue.
-- ===============================================================================

-- Check if the function already exists to provide diagnostic information
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN
        RAISE NOTICE 'The handle_new_user function already exists. It will be replaced.';
    ELSE
        RAISE NOTICE 'Creating new handle_new_user function.';
    END IF;
END
$$;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a new row into the profiles table
    INSERT INTO public.profiles (
        id,
        email,
        username,
        avatar_url,
        created_at
    ) VALUES (
        NEW.id,                          -- Use the auth user ID as the profile ID
        NEW.email,                       -- Copy the email address
        COALESCE(                        -- Use the raw_user_meta_data username if available
            NEW.raw_user_meta_data->>'username',
            SPLIT_PART(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',  -- Copy avatar if available
        NOW()                            -- Current timestamp
    );

    RAISE NOTICE 'Created profile for user: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating profile for user %: %', NEW.email, SQLERRM;
        RETURN NEW; -- Still return NEW to allow the auth user to be created
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if the trigger already exists and drop it if it does
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'Dropping existing on_auth_user_created trigger';
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    END IF;
END
$$;

-- Create the trigger on auth.users table
-- This will execute the handle_new_user function after a new user is inserted
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        RAISE NOTICE 'Successfully created on_auth_user_created trigger';
    ELSE
        RAISE NOTICE 'Failed to create on_auth_user_created trigger';
    END IF;
END
$$;

-- ===============================================================================
-- INSTRUCTIONS:
-- ===============================================================================
-- 1. Open the Supabase Dashboard for your project
-- 2. Go to the SQL Editor
-- 3. Create a new query
-- 4. Paste the entire contents of this file
-- 5. Run the query
--
-- After running this script, when a new user signs up:
-- - The trigger will automatically create a corresponding profile
-- - The "Database error saving new user" error should no longer occur
-- ===============================================================================

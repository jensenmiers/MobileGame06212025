-- Remove automatic profile sync on user signup
-- This prevents interference with OAuth login flow

-- Drop the trigger that automatically syncs profiles on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the trigger function since we won't need it anymore
DROP FUNCTION IF EXISTS handle_new_user();

-- Keep the sync_user_profile and ensure_user_profile functions
-- These will be used manually when needed (like when submitting predictions)

-- Add a comment to document the change
COMMENT ON FUNCTION sync_user_profile(uuid) IS 'Manual profile sync function - call explicitly when needed, not automatically on signup';
COMMENT ON FUNCTION ensure_user_profile(uuid) IS 'Ensures profile exists - call before operations that require profiles'; 
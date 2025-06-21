-- SQL Function: Sync Single User Profile
-- This function syncs one user's profile from auth system to profiles table

CREATE OR REPLACE FUNCTION sync_user_profile(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(ai.identity_data->>'name', ai.identity_data->>'full_name', au.email) as display_name,
    au.email,
    au.created_at,
    NOW() as updated_at
  FROM auth.users au
  LEFT JOIN auth.identities ai ON au.id = ai.user_id
  WHERE au.id = user_id
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    updated_at = NOW();
END;
$$; 
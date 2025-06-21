-- Migration Script: Populate Profiles Table
-- Run this ONCE after creating the profiles table

-- Insert all existing users into profiles table
INSERT INTO profiles (id, display_name, email, created_at, updated_at)
SELECT 
  au.id,
  COALESCE(ai.identity_data->>'name', ai.identity_data->>'full_name', au.email) as display_name,
  au.email,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN auth.identities ai ON au.id = ai.user_id
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Show results
SELECT COUNT(*) as profiles_created FROM profiles; 
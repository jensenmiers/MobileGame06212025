-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to store user profile information
-- This syncs with auth.users table
CREATE TABLE IF NOT EXISTS profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    display_name text,
    email text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Safe migration to add missing profile sync components
-- This will NOT affect existing profiles table or data

-- Create function to sync user profile from auth.users (if it doesn't exist)
CREATE OR REPLACE FUNCTION sync_user_profile(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record record;
BEGIN
    -- Get user data from auth.users
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE id = user_id;
    
    -- Only proceed if user exists
    IF user_record.id IS NOT NULL THEN
        -- Upsert the profile
        INSERT INTO profiles (id, display_name, email, created_at, updated_at)
        VALUES (
            user_record.id,
            COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name',
                user_record.raw_user_meta_data->>'username',
                split_part(user_record.email, '@', 1),
                'Anonymous User'
            ),
            user_record.email,
            now(),
            now()
        )
        ON CONFLICT (id) DO UPDATE SET
            display_name = COALESCE(
                user_record.raw_user_meta_data->>'full_name',
                user_record.raw_user_meta_data->>'name', 
                user_record.raw_user_meta_data->>'username',
                split_part(user_record.email, '@', 1),
                'Anonymous User'
            ),
            email = user_record.email,
            updated_at = now();
    END IF;
END;
$$;

-- Create function to ensure profile exists (returns success/failure)
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    -- If not, create it
    IF NOT profile_exists THEN
        PERFORM sync_user_profile(user_id);
    END IF;
    
    -- Verify it exists now
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    RETURN profile_exists;
END;
$$;

-- Create trigger function to automatically sync profile when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM sync_user_profile(NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger on auth.users for automatic profile creation (if it doesn't exist)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Sync any existing auth users who don't have profiles yet
DO $$
DECLARE
    user_record record;
    sync_count integer := 0;
BEGIN
    FOR user_record IN 
        SELECT u.id FROM auth.users u 
        LEFT JOIN profiles p ON u.id = p.id 
        WHERE p.id IS NULL
    LOOP
        PERFORM sync_user_profile(user_record.id);
        sync_count := sync_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Synced % existing users without profiles', sync_count;
END $$;

-- Create tournaments table if it doesn't exist
CREATE TABLE IF NOT EXISTS tournaments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    game_title text NOT NULL,
    description text,
    start_time timestamptz NOT NULL,
    cutoff_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
    max_participants integer DEFAULT 128,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create participants table if it doesn't exist
CREATE TABLE IF NOT EXISTS participants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
    name text NOT NULL,
    seed integer,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create predictions table if it doesn't exist
CREATE TABLE IF NOT EXISTS predictions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
    slot_1_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_2_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_3_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_4_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    cutoff_submission_1 timestamptz,
    cutoff_submission_2 timestamptz,
    is_complete boolean DEFAULT false,
    score integer DEFAULT -1, -- -1 means unprocessed
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, tournament_id) -- One prediction per user per tournament
);

-- Enable RLS on predictions table
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Create policies for predictions table  
CREATE POLICY "Users can view all predictions" ON predictions
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions" ON predictions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create results table if it doesn't exist
CREATE TABLE IF NOT EXISTS results (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id uuid REFERENCES tournaments(id) ON DELETE CASCADE,
    slot_1_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_2_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_3_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    slot_4_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(tournament_id) -- One result per tournament
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_tournament_id ON predictions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_participants_tournament_id ON participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Function to calculate prediction scores (basic implementation)
CREATE OR REPLACE FUNCTION calculate_prediction_score(
    prediction_row predictions,
    result_row results
) RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    total_score integer := 0;
BEGIN
    -- Award points for correct predictions
    -- Slot 1 (1st place): 8 points
    IF prediction_row.slot_1_participant_id = result_row.slot_1_participant_id THEN
        total_score := total_score + 8;
    END IF;
    
    -- Slot 2 (2nd place): 4 points  
    IF prediction_row.slot_2_participant_id = result_row.slot_2_participant_id THEN
        total_score := total_score + 4;
    END IF;
    
    -- Slot 3 (3rd place): 2 points
    IF prediction_row.slot_3_participant_id = result_row.slot_3_participant_id THEN
        total_score := total_score + 2;
    END IF;
    
    -- Slot 4 (4th place): 1 point
    IF prediction_row.slot_4_participant_id = result_row.slot_4_participant_id THEN
        total_score := total_score + 1;
    END IF;
    
    RETURN total_score;
END;
$$;

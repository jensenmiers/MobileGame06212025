-- SAFE VERSION: Multi-Tournament Database Schema for Supabase
-- Run this version if the main schema.sql has any issues

-- Enable UUID extension (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  game_title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  cutoff_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  max_participants INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed INTEGER,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, name)
);

-- Predictions table (referencing auth.users which exists in Supabase)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Using participant IDs for referential integrity
  slot_1_participant_id UUID REFERENCES participants(id),
  slot_2_participant_id UUID REFERENCES participants(id),
  slot_3_participant_id UUID REFERENCES participants(id),
  slot_4_participant_id UUID REFERENCES participants(id),
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, tournament_id)
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  position_1_participant_id UUID REFERENCES participants(id),
  position_2_participant_id UUID REFERENCES participants(id),
  position_3_participant_id UUID REFERENCES participants(id),
  position_4_participant_id UUID REFERENCES participants(id),
  position_5_participant_id UUID REFERENCES participants(id),
  position_6_participant_id UUID REFERENCES participants(id),
  position_7_participant_id UUID REFERENCES participants(id),
  position_8_participant_id UUID REFERENCES participants(id),
  
  entered_by UUID REFERENCES auth.users(id),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tournament_id)
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  position_1_points INTEGER DEFAULT 0,
  position_2_points INTEGER DEFAULT 0,
  position_3_points INTEGER DEFAULT 0,
  position_4_points INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tournament_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_tournament ON predictions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_tournament ON scores(tournament_id);
CREATE INDEX IF NOT EXISTS idx_scores_user ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_tournament ON participants(tournament_id);

-- Row Level Security (enable on tables we created)
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Users can view their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can insert their own predictions" ON predictions;
DROP POLICY IF EXISTS "Users can update their own predictions" ON predictions;
DROP POLICY IF EXISTS "Anyone can view scores" ON scores;

-- RLS Policies
CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON predictions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view scores" ON scores
  FOR SELECT USING (true);

-- Insert sample tournament (only if none exists)
INSERT INTO tournaments (name, game_title, start_time, cutoff_time, status) 
SELECT 'EVO 2024 Championship', 'Street Fighter 6', NOW() + INTERVAL '7 days', NOW() + INTERVAL '6 days', 'upcoming'
WHERE NOT EXISTS (SELECT 1 FROM tournaments WHERE name = 'EVO 2024 Championship'); 
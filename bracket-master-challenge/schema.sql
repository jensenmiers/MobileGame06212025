-- Enhanced Multi-Tournament Database Schema
-- Supports multiple simultaneous tournaments with separate leaderboards

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tournaments table - Core tournament metadata
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                           -- "EVO 2024", "CEO 2024", etc.
  game_title TEXT,                             -- "Street Fighter 6", "Tekken 8", etc.
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  cutoff_time TIMESTAMPTZ NOT NULL,            -- When predictions lock
  end_time TIMESTAMPTZ,                        -- When tournament finishes
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')) DEFAULT 'upcoming',
  max_participants INTEGER DEFAULT 16,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Participants table - Players in each tournament  
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  seed INTEGER,                                -- Tournament seeding (1-16)
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure no duplicate participants per tournament
  UNIQUE(tournament_id, name)
);

-- Predictions table - User predictions per tournament
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Prediction slots (using participant IDs for referential integrity)
  slot_1_participant_id UUID REFERENCES participants(id),  -- 1st place prediction
  slot_2_participant_id UUID REFERENCES participants(id),  -- 2nd place prediction  
  slot_3_participant_id UUID REFERENCES participants(id),  -- 3rd place prediction
  slot_4_participant_id UUID REFERENCES participants(id),  -- 4th place prediction
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Critical constraint: ONE prediction per user per tournament
  UNIQUE(user_id, tournament_id),
  
  -- Ensure all predictions are unique within same tournament prediction
  CHECK (slot_1_participant_id != slot_2_participant_id 
     AND slot_1_participant_id != slot_3_participant_id 
     AND slot_1_participant_id != slot_4_participant_id
     AND slot_2_participant_id != slot_3_participant_id 
     AND slot_2_participant_id != slot_4_participant_id
     AND slot_3_participant_id != slot_4_participant_id)
);

-- Results table - Official tournament outcomes
CREATE TABLE results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Official final rankings (using participant IDs)
  position_1_participant_id UUID REFERENCES participants(id),  -- 1st place
  position_2_participant_id UUID REFERENCES participants(id),  -- 2nd place
  position_3_participant_id UUID REFERENCES participants(id),  -- 3rd place
  position_4_participant_id UUID REFERENCES participants(id),  -- 4th place
  position_5_participant_id UUID REFERENCES participants(id),  -- 5th place
  position_6_participant_id UUID REFERENCES participants(id),  -- 6th place
  position_7_participant_id UUID REFERENCES participants(id),  -- 7th place
  position_8_participant_id UUID REFERENCES participants(id),  -- 8th place
  
  entered_by UUID REFERENCES auth.users(id),                  -- Admin who entered results
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One result set per tournament
  UNIQUE(tournament_id)
);

-- Scores table - Calculated scores per user per tournament
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  
  -- Score breakdown
  position_1_points INTEGER DEFAULT 0,        -- Points for correct 1st place
  position_2_points INTEGER DEFAULT 0,        -- Points for correct 2nd place  
  position_3_points INTEGER DEFAULT 0,        -- Points for correct 3rd place
  position_4_points INTEGER DEFAULT 0,        -- Points for correct 4th place
  total_score INTEGER DEFAULT 0,              -- Sum of all position points
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- One score record per user per tournament
  UNIQUE(user_id, tournament_id)
);

-- Leaderboard view - Easy querying of rankings per tournament
CREATE VIEW leaderboard AS
SELECT 
  s.tournament_id,
  t.name as tournament_name,
  u.id as user_id,
  u.email as user_email,
  u.raw_user_meta_data->>'full_name' as display_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  s.total_score,
  s.position_1_points,
  s.position_2_points, 
  s.position_3_points,
  s.position_4_points,
  RANK() OVER (PARTITION BY s.tournament_id ORDER BY s.total_score DESC) as rank
FROM scores s
JOIN tournaments t ON s.tournament_id = t.id  
JOIN auth.users u ON s.user_id = u.id
ORDER BY s.tournament_id, s.total_score DESC;

-- Indexes for performance
CREATE INDEX idx_predictions_tournament ON predictions(tournament_id);
CREATE INDEX idx_predictions_user ON predictions(user_id);
CREATE INDEX idx_scores_tournament ON scores(tournament_id);
CREATE INDEX idx_scores_user ON scores(user_id);
CREATE INDEX idx_participants_tournament ON participants(tournament_id);

-- Row Level Security (RLS) Policies
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own predictions
CREATE POLICY "Users can view their own predictions" ON predictions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own predictions" ON predictions  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own predictions" ON predictions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view all scores/leaderboards (read-only)
CREATE POLICY "Anyone can view scores" ON scores
  FOR SELECT USING (true);

-- Sample tournament data
INSERT INTO tournaments (id, name, game_title, start_time, cutoff_time, status) VALUES 
(
  uuid_generate_v4(),
  'EVO 2024 Championship', 
  'Street Fighter 6',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '6 days', 
  'upcoming'
); 
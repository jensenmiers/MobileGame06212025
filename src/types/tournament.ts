export interface Player {
  id: string;
  name: string;
  seed: number;
  avatarUrl?: string;
}

export interface Tournament {
  id: string; // uuid from Supabase
  name: string;
  game_title: string;
  description: string;
  start_time: string;
  cutoff_time: string;
  end_time: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
  players?: Player[];
}

// Represents a player/competitor in a tournament
export interface Participant {
  id: string;
  tournament_id: string;
  name: string;
  seed?: number;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

// User profile information
export interface Profile {
  id: string;
  display_name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Prediction with profile information
export interface Prediction {
  id: string;
  tournament_id: string;
  user_id: string;
  slot_1_participant_id: string;
  slot_2_participant_id: string;
  slot_3_participant_id: string;
  slot_4_participant_id: string;
  first_submitted_at: string;
  last_updated_at: string;
  submission_count: number;
  score: number; // Calculated score field (-1 for unprocessed, actual score when calculated)
  created_at: string;
  // Legacy fields for backward compatibility
  cutoff_submission_1?: string;
  cutoff_submission_2?: string;
  is_complete?: boolean;
  updated_at?: string;
  profiles?: Profile;
}

// Represents the final results of a completed tournament
export interface TournamentResult {
  id: string;
  tournament_id: string;
  position_1_participant_id: string;
  position_2_participant_id: string;
  position_3_participant_id: string;
  position_4_participant_id: string;
  entered_by?: string;
  entered_at: string;
}

// Represents a single entry in the leaderboard UI
export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  userId?: string; // Optional since we may not always need to expose user IDs
}

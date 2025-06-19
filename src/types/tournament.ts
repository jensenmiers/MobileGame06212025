export interface Player {
  id: string;
  name: string;
  seed: number;
  avatarUrl?: string;
}

export type TournamentStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export interface Tournament {
  id: string; // uuid from Supabase
  name: string;
  game_title: string;
  description: string;
  start_time: string;
  cutoff_time: string;
  end_time: string;
  status: TournamentStatus;
  max_participants: number;
  created_at: string;
  updated_at: string;
  players?: Player[];
}

// Represents a user's set of predictions for a tournament
export interface Prediction {
  id: string; // uuid
  user_id: string; // uuid
  tournament_id: string; // uuid
  slot_1_participant_id: string; // uuid
  slot_2_participant_id: string; // uuid
  slot_3_participant_id: string; // uuid
  slot_4_participant_id: string; // uuid
  first_submitted_at?: string; // timestamp with time zone
  last_updated_at?: string; // timestamp with time zone
  submission_count?: number; // integer
  created_at?: string; // timestamp with time zone
  // This field can be populated by a join to the profiles table
  profiles?: {
    username: string;
  };
}

// Represents the final results of a completed tournament
export interface TournamentResult {
  id: string;
  tournament_id: string;
  first_place_participant_id: string;
  second_place_participant_id: string;
  third_place_participant_id: string;
  fourth_place_participant_id: string;
}

// Represents a single entry in the leaderboard UI
export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
  userId: string;
}

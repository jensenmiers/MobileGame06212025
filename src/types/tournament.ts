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

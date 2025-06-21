import { supabase } from './supabase';
import { Tournament, Participant, Prediction, TournamentResult, LeaderboardEntry } from '../types/tournament';

// Sync user profile from auth system to profiles table
// Call this when user logs in or when you need to ensure profile exists
export async function syncUserProfile(userId: string): Promise<void> {
  console.log('🔄 Syncing profile for user:', userId);
  
  // This query needs to run server-side or with elevated permissions
  // For now, we'll handle this through the migration script and manual updates
  const { data, error } = await supabase.rpc('sync_user_profile', { user_id: userId });
  
  if (error) {
    console.error('Error syncing user profile:', error);
  } else {
    console.log('✅ Profile synced successfully');
  }
}

/**
 * Fetches all participants for a specific tournament from Supabase
 * @param tournamentId The ID of the tournament to fetch participants for
 * @returns Promise<Player[]> Array of players in the tournament
 */
export async function getTournamentParticipants(tournamentId: string): Promise<Participant[]> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (error) {
      console.error('Error fetching tournament participants:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching tournament participants:', error);
    return [];
  }
}

/**
 * Fetches a single participant by ID
 * @param participantId The ID of the participant to fetch
 * @returns Promise<Player | null> The participant or null if not found
 */
export async function getParticipantById(participantId: string): Promise<Participant | null> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error) {
      console.error('Error fetching participant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching participant:', error);
    return null;
  }
}

/**
 * Fetches all tournaments from Supabase
 * @returns Promise<Tournament[]> Array of tournaments
 */
export async function getTournaments(): Promise<Tournament[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTournaments:', error);
    return [];
  }
}

// Fetches all user predictions for a specific tournament
async function getPredictionsForTournament(tournamentId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, profiles(display_name)') // Join with profiles to get display name
    .eq('tournament_id', tournamentId);

  if (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
  
  return data || [];
}

// Fetches the final results for a specific tournament
async function getResultsForTournament(tournamentId: string): Promise<TournamentResult | null> {
  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('tournament_id', tournamentId)
    .single(); // There should only be one result entry per tournament

  if (error) {
    console.error('Error fetching tournament results:', error);
    return null;
  }
  return data;
}

// Calculates scores and generates a ranked leaderboard for a tournament
export async function getLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
  const [predictions, results] = await Promise.all([
    getPredictionsForTournament(tournamentId),
    getResultsForTournament(tournamentId),
  ]);

  if (!results) {
    return []; // Return an empty leaderboard if results are not in
  }

  const pointsSystem = { first: 10, second: 6, third: 4, fourth: 2 };
  const userScores = new Map<string, { username: string; points: number }>();

  for (const p of predictions) {
    let score = 0;
    if (p.slot_1_participant_id === results.position_1_participant_id) score += pointsSystem.first;
    if (p.slot_2_participant_id === results.position_2_participant_id) score += pointsSystem.second;
    if (p.slot_3_participant_id === results.position_3_participant_id) score += pointsSystem.third;
    if (p.slot_4_participant_id === results.position_4_participant_id) score += pointsSystem.fourth;

    const username = p.profiles?.display_name || 'Anonymous';
    userScores.set(p.user_id, { username, points: score });
  }

  return Array.from(userScores.values())
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      points: entry.points,
    }));
}

export const tournamentService = {
  /**
   * Submits a user's prediction for a tournament.
   * If a prediction already exists for the user and tournament, it will be updated.
   * Otherwise, a new prediction will be created.
   * @param predictionData - The prediction data to submit.
   */
  async submitPrediction(predictionData: {
    user_id: string;
    tournament_id: string;
    slot_1_participant_id: string;
    slot_2_participant_id: string;
    slot_3_participant_id: string;
    slot_4_participant_id: string;
  }): Promise<Prediction | null> {
    // Check if a prediction already exists for this user and tournament
    const { data: existingPrediction, error: selectError } = await supabase
      .from('predictions')
      .select('id, submission_count')
      .eq('user_id', predictionData.user_id)
      .eq('tournament_id', predictionData.tournament_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows were found, which is fine.
      // Any other error should be thrown.
      console.error('Error checking for existing prediction:', selectError);
      throw selectError;
    }

    if (existingPrediction) {
      // --- UPDATE existing prediction ---
      const { data, error } = await supabase
        .from('predictions')
        .update({
          ...predictionData,
          last_updated_at: new Date().toISOString(),
          submission_count: (existingPrediction.submission_count || 0) + 1,
        })
        .eq('id', existingPrediction.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prediction:', error);
        throw error;
      }
      return data;
    } else {
      // --- INSERT new prediction ---
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          ...predictionData,
          first_submitted_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          submission_count: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting prediction:', error);
        throw error;
      }
      return data;
    }
  },

  getTournaments,
  getTournamentParticipants,
  getParticipantById,
  getLeaderboard,
};

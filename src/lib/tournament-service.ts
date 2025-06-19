import { supabase } from './supabase';
import { Player, Tournament, Prediction, TournamentResult, LeaderboardEntry } from '@/types/tournament';

/**
 * Fetches all participants for a specific tournament from Supabase
 * @param tournamentId The ID of the tournament to fetch participants for
 * @returns Promise<Player[]> Array of players in the tournament
 */
export async function getTournamentParticipants(tournamentId: string): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (error) {
      console.error('Error fetching tournament participants:', error);
      throw error;
    }

    // Map the database fields to our Player interface
    return data.map(participant => ({
      id: participant.id,
      name: participant.name,
      seed: participant.seed,
      avatarUrl: participant.avatar_url || undefined,
    }));
  } catch (error) {
    console.error('Error in getTournamentParticipants:', error);
    return [];
  }
}

/**
 * Fetches a single participant by ID
 * @param participantId The ID of the participant to fetch
 * @returns Promise<Player | null> The participant or null if not found
 */
export async function getParticipantById(participantId: string): Promise<Player | null> {
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

    return {
      id: data.id,
      name: data.name,
      seed: data.seed,
      avatarUrl: data.avatar_url || undefined,
    };
  } catch (error) {
    console.error('Error in getParticipantById:', error);
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
    .select('*, profiles(username)') // Join with profiles table to get username
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
    .from('tournament_results')
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
    console.log('No results found for this tournament yet.');
    return []; // Return an empty leaderboard if results are not in
  }

  const pointsSystem = {
    first: 10,
    second: 7,
    third: 5,
    fourth: 3,
  };

  const userScores: Map<string, { username: string; points: number }> = new Map();

  for (const p of predictions) {
    let score = 0;
    if (p.slot_1_participant_id === results.first_place_participant_id) score += pointsSystem.first;
    if (p.slot_2_participant_id === results.second_place_participant_id) score += pointsSystem.second;
    if (p.slot_3_participant_id === results.third_place_participant_id) score += pointsSystem.third;
    if (p.slot_4_participant_id === results.fourth_place_participant_id) score += pointsSystem.fourth;

    const username = p.profiles?.username || 'Anonymous';
    userScores.set(p.user_id, { username, points: score });
  }

  const sortedScores = Array.from(userScores.entries()).sort((a, b) => b[1].points - a[1].points);

  const leaderboard: LeaderboardEntry[] = sortedScores.map((entry, index) => ({
    rank: index + 1,
    userId: entry[0],
    username: entry[1].username,
    points: entry[1].points,
  }));

  return leaderboard;
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
    console.log('[submitPrediction] Received data:', JSON.stringify(predictionData, null, 2));

    // Check if a prediction already exists for this user and tournament
    console.log('[submitPrediction] Checking for existing prediction...');
    const { data: existingPrediction, error: selectError } = await supabase
      .from('predictions')
      .select('id, submission_count')
      .eq('user_id', predictionData.user_id)
      .eq('tournament_id', predictionData.tournament_id)
      .single();

    console.log('[submitPrediction] Existing prediction check complete.');
    console.log('[submitPrediction] Existing prediction data:', existingPrediction);
    console.log('[submitPrediction] Select error:', selectError);


    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows were found, which is fine.
      // Any other error should be thrown.
      console.error('[submitPrediction] CRITICAL: Error checking for existing prediction:', selectError);
      throw selectError;
    }

    if (existingPrediction) {
      console.log(`[submitPrediction] Found existing prediction with ID: ${existingPrediction.id}. Proceeding with UPDATE.`);
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
        console.error('[submitPrediction] CRITICAL: Error updating prediction:', error);
        throw error;
      }
      console.log('[submitPrediction] UPDATE successful. Returning data:', data);
      return data;
    } else {
      console.log('[submitPrediction] No existing prediction found. Proceeding with INSERT.');
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
        console.error('[submitPrediction] CRITICAL: Error inserting prediction:', error);
        throw error;
      }
      console.log('[submitPrediction] INSERT successful. Returning data:', data);
      return data;
    }
  },

  getTournaments,
  getTournamentParticipants,
  getParticipantById,
  getLeaderboard,
};

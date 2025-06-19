import { supabase } from './supabase';
import { Player, Tournament, Prediction, TournamentResult, LeaderboardEntry, CutoffPeriod } from '@/types/tournament';

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

/**
 * Fetches user's prediction for a specific tournament and cutoff period
 * @param userId User ID
 * @param tournamentId Tournament ID
 * @param cutoffPeriod Cutoff period ('first' or 'second')
 * @returns Promise<Prediction | null>
 */
export async function getUserPrediction(
  userId: string,
  tournamentId: string,
  cutoffPeriod: CutoffPeriod
): Promise<Prediction | null> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('tournament_id', tournamentId)
      .eq('cutoff_period', cutoffPeriod)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user prediction:', error);
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getUserPrediction:', error);
    return null;
  }
}

/**
 * Auto-saves a draft prediction (allows partial predictions)
 * @param predictionData Prediction data (slots can be null)
 * @returns Promise<Prediction | null>
 */
export async function savePredictionDraft(predictionData: {
  user_id: string;
  tournament_id: string;
  cutoff_period: CutoffPeriod;
  slot_1_participant_id: string | null;
  slot_2_participant_id: string | null;
  slot_3_participant_id: string | null;
  slot_4_participant_id: string | null;
}): Promise<Prediction | null> {
  try {
    const isComplete = predictionData.slot_1_participant_id !== null &&
                      predictionData.slot_2_participant_id !== null &&
                      predictionData.slot_3_participant_id !== null &&
                      predictionData.slot_4_participant_id !== null;

    // Check if prediction already exists
    const { data: existingPrediction, error: selectError } = await supabase
      .from('predictions')
      .select('id')
      .eq('user_id', predictionData.user_id)
      .eq('tournament_id', predictionData.tournament_id)
      .eq('cutoff_period', predictionData.cutoff_period)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking for existing prediction:', selectError);
      throw selectError;
    }

    if (existingPrediction) {
      // Update existing prediction
      const { data, error } = await supabase
        .from('predictions')
        .update({
          ...predictionData,
          is_complete: isComplete,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', existingPrediction.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prediction draft:', error);
        throw error;
      }
      return data;
    } else {
      // Insert new prediction
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          ...predictionData,
          is_complete: isComplete,
          first_submitted_at: new Date().toISOString(),
          last_updated_at: new Date().toISOString(),
          submission_count: 1,
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting prediction draft:', error);
        throw error;
      }
      return data;
    }
  } catch (error) {
    console.error('Error in savePredictionDraft:', error);
    return null;
  }
}

/**
 * Retry logic wrapper for API calls
 * @param fn Function to retry
 * @param maxRetries Maximum number of retry attempts
 * @returns Promise with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on validation errors (4xx)
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: 500ms, 1s, 2s
      const delay = Math.pow(2, attempt - 1) * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Fetches all user predictions for a specific tournament (both cutoff periods)
async function getPredictionsForTournament(tournamentId: string): Promise<Prediction[]> {
  const { data, error } = await supabase
    .from('predictions')
    .select('*, profiles(username)') // Join with profiles table to get username
    .eq('tournament_id', tournamentId)
    .eq('is_complete', true); // Only count complete predictions for leaderboard

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
    console.log('No results found for this tournament yet.');
    return []; // Return an empty leaderboard if results are not in
  }

  const pointsSystem = {
    first: 10,
    second: 7,
    third: 5,
    fourth: 3,
  };

  // Group predictions by user and sum points from both cutoff periods
  const userScores: Map<string, { username: string; points: number }> = new Map();

  for (const p of predictions) {
    let score = 0;
    if (p.slot_1_participant_id === results.position_1_participant_id) score += pointsSystem.first;
    if (p.slot_2_participant_id === results.position_2_participant_id) score += pointsSystem.second;
    if (p.slot_3_participant_id === results.position_3_participant_id) score += pointsSystem.third;
    if (p.slot_4_participant_id === results.position_4_participant_id) score += pointsSystem.fourth;

    const username = p.profiles?.username || 'Anonymous';
    const existingScore = userScores.get(p.user_id)?.points || 0;
    
    // Add points from this cutoff period to any existing points
    userScores.set(p.user_id, { username, points: existingScore + score });
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
   * Submits a complete prediction for a tournament with retry logic
   * @param predictionData - The complete prediction data to submit
   */
  async submitPrediction(predictionData: {
    user_id: string;
    tournament_id: string;
    cutoff_period: CutoffPeriod;
    slot_1_participant_id: string;
    slot_2_participant_id: string;
    slot_3_participant_id: string;
    slot_4_participant_id: string;
  }): Promise<Prediction | null> {
    return withRetry(async () => {
      // Check if a prediction already exists for this user and tournament
      const { data: existingPrediction, error: selectError } = await supabase
        .from('predictions')
        .select('id, submission_count')
        .eq('user_id', predictionData.user_id)
        .eq('tournament_id', predictionData.tournament_id)
        .eq('cutoff_period', predictionData.cutoff_period)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking for existing prediction:', selectError);
        throw selectError;
      }

      if (existingPrediction) {
        // --- UPDATE existing prediction ---
        const { data, error } = await supabase
          .from('predictions')
          .update({
            ...predictionData,
            is_complete: true,
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
            is_complete: true,
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
    });
  },

  getTournaments,
  getTournamentParticipants,
  getParticipantById,
  getUserPrediction,
  savePredictionDraft,
  getLeaderboard,
};

import { supabase } from './supabase';
import { backendService } from './backend-service';
import { Tournament, Participant, Prediction, TournamentResult, LeaderboardEntry } from '../types/tournament';

// Feature flag to control migration
const USE_BACKEND_API = process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true';

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
 * Fetches all participants for a specific tournament
 * Uses backend API if enabled, falls back to Supabase
 */
export async function getTournamentParticipants(tournamentId: string): Promise<Participant[]> {
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for participants');
      return await backendService.getTournamentParticipants(tournamentId);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
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
 * Fetches all tournaments
 * Uses backend API if enabled, falls back to Supabase
 */
export async function getTournaments(): Promise<Tournament[]> {
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for tournaments');
      return await backendService.getTournaments();
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
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
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for predictions');
      return await backendService.getPredictions(tournamentId);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  const { data, error } = await supabase
    .from('predictions')
    .select('*, profiles(display_name)') // Join with profiles to get display name
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: false }); // Order by timestamp, newest first

  if (error) {
    console.error('Error fetching predictions:', error);
    return [];
  }
  
  return data || [];
}

// Fetches the final results for a specific tournament
async function getResultsForTournament(tournamentId: string): Promise<TournamentResult | null> {
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for results');
      return await backendService.getResults(tournamentId);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
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
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for leaderboard');
      return await backendService.getLeaderboard(tournamentId);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to existing Supabase logic
  const predictions = await getPredictionsForTournament(tournamentId);

  if (!predictions || predictions.length === 0) {
    return []; // Return empty leaderboard if no predictions
  }

  // Get only the latest prediction per user (by timestamp)
  const latestPredictionsByUser = new Map<string, Prediction>();
  
  for (const prediction of predictions) {
    const userId = prediction.user_id;
    if (!latestPredictionsByUser.has(userId)) {
      latestPredictionsByUser.set(userId, prediction);
    }
  }

  // Build leaderboard from latest predictions with valid scores
  const leaderboard: LeaderboardEntry[] = [];
  
  Array.from(latestPredictionsByUser.entries()).forEach(([userId, prediction]) => {
    // Only include predictions with calculated scores (not -1)
    if (prediction.score !== undefined && prediction.score !== -1) {
      const username = prediction.profiles?.display_name || 'Anonymous';
      leaderboard.push({
        rank: 0, // Will be set after sorting
        username,
        points: prediction.score,
      });
    }
  });

  // Sort by score (highest first) and assign ranks
  leaderboard.sort((a, b) => b.points - a.points);
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

export const tournamentService = {
  /**
   * Submits a user's prediction for a tournament.
   * Uses backend API if enabled, falls back to Supabase
   */
  async submitPrediction(predictionData: {
    user_id: string;
    tournament_id: string;
    slot_1_participant_id: string;
    slot_2_participant_id: string;
    slot_3_participant_id: string;
    slot_4_participant_id: string;
  }): Promise<Prediction | null> {
    if (USE_BACKEND_API) {
      try {
        console.log('🚀 Using Backend API for prediction submission');
        return await backendService.submitPrediction(predictionData.tournament_id, predictionData);
      } catch (error) {
        console.error('Backend API failed, falling back to Supabase:', error);
      }
    }

    // Fallback to existing Supabase logic
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

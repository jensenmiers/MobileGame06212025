import { createClient } from './supabase';
const supabase = createClient();
import { backendService } from './backend-service';
import { Tournament, Participant, Prediction, TournamentResult, LeaderboardEntry, CommunityFavorite } from '../types/tournament';

// Feature flag to control migration
const USE_BACKEND_API = process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true';

// Sync user profile from auth system to profiles table
// Call this when user logs in or when you need to ensure profile exists
export async function syncUserProfile(userId: string): Promise<void> {
  console.log('🔄 Syncing profile for user:', userId);
  
  try {
    // First try the RPC function
    const { data, error } = await supabase.rpc('sync_user_profile', { user_id: userId });
    
    if (error) {
      console.error('Error syncing user profile via RPC:', error);
      
      // Fallback: manually ensure profile exists
      console.log('🔧 Attempting manual profile sync...');
      
      // Get user data from auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error('Cannot get user for manual sync:', authError);
        throw new Error(`Failed to get user data: ${authError?.message || 'Unknown error'}`);
      }
      
      // Upsert profile manually
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          display_name: user.user_metadata?.full_name || 
                       user.user_metadata?.name || 
                       user.user_metadata?.username ||
                       user.email?.split('@')[0] || 
                       'Anonymous User',
          email: user.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });
      
      if (upsertError) {
        console.error('Manual profile upsert failed:', upsertError);
        throw new Error(`Profile sync failed: ${upsertError.message}`);
      } else {
        console.log('✅ Manual profile sync successful');
      }
    } else {
      console.log('✅ Profile synced successfully via RPC');
    }
    
    // Verify the profile was created/updated
    const { data: profile, error: verifyError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', userId)
      .single();
    
    if (verifyError || !profile) {
      console.error('Profile verification failed:', verifyError);
      throw new Error('Profile sync appeared to succeed but profile not found');
    } else {
      console.log('✅ Profile verified:', profile);
    }
    
  } catch (error) {
    console.error('❌ Critical error in syncUserProfile:', error);
    throw error; // Re-throw so calling code can handle appropriately
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
 * Fetches a specific user's prediction for a tournament
 * Uses backend API if enabled, falls back to Supabase
 */
export async function getUserPrediction(tournamentId: string, userId: string): Promise<Prediction | null> {
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for user prediction');
      return await backendService.getUserPrediction(tournamentId, userId);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error fetching user prediction:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Unexpected error fetching user prediction:', error);
    return null;
  }
}

/**
 * Fetches tournaments with optional filtering by active status
 * Uses backend API if enabled, falls back to Supabase
 * @param onlyActive - When true, only returns active tournaments. When false, returns all tournaments.
 */
export async function getTournaments(onlyActive: boolean = true): Promise<Tournament[]> {
  if (USE_BACKEND_API) {
    try {
      console.log('🚀 Using Backend API for tournaments');
      return await backendService.getTournaments(onlyActive);
    } catch (error) {
      console.error('Backend API failed, falling back to Supabase:', error);
    }
  }

  // Fallback to Supabase
  try {
    let query = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: true });

    // Filter by active status if onlyActive is true
    if (onlyActive) {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

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
export async function getPredictionsForTournament(tournamentId: string): Promise<Prediction[]> {
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
        userId: userId,
        firstSubmittedAt: prediction.first_submitted_at, // Add submission time for tie-breaking
      });
    }
  });

  // Sort by score (highest first), then by submission time (earlier first) for ties
  leaderboard.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points; // Higher points first
    }
    // If points are equal, sort by submission time (earlier first)
    return new Date(a.firstSubmittedAt).getTime() - new Date(b.firstSubmittedAt).getTime();
  });
  
  leaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return leaderboard;
}

// Fetches community favorites based on aggregated prediction data
export async function getCommunityFavorites(tournamentId: string): Promise<{ favorites: CommunityFavorite[], total_predictions: number }> {
  try {
    const response = await fetch(`/api/tournaments/${tournamentId}/favorites`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch community favorites: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      favorites: data.favorites || [],
      total_predictions: data.total_predictions || 0
    };
  } catch (error) {
    console.error('Error fetching community favorites:', error);
    return { favorites: [], total_predictions: 0 };
  }
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
    bracket_reset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null;
    grand_finals_score?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
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
    // SERVER-SIDE VALIDATION: Check if predictions are allowed
    // 1. Check if tournament exists and get cutoff time
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('cutoff_time')
      .eq('id', predictionData.tournament_id)
      .single();

    if (tournamentError || !tournament) {
      throw new Error('Tournament not found');
    }

    // 2. Check if results exist (overrides cutoff time)
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('id')
      .eq('tournament_id', predictionData.tournament_id)
      .single();

    if (resultsError && resultsError.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is fine
      console.error('Error checking results:', resultsError);
      throw new Error('Failed to validate tournament status');
    }

    if (results) {
      throw new Error('Tournament has results - predictions are closed');
    }

    // 3. Check cutoff time
    const now = new Date();
    const cutoffTime = new Date(tournament.cutoff_time);
    
    if (now >= cutoffTime) {
      throw new Error('Prediction cutoff time has passed');
    }

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
  getUserPrediction,
  getLeaderboard,
  getCommunityFavorites,
  getResultsForTournament,
  getPredictionsForTournament, // Add this here for named import
};

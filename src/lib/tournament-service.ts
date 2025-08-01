import { createClient } from './supabase';
const supabase = createClient();
import { backendService } from './backend-service';
import { Tournament, Participant, Prediction, TournamentResult, LeaderboardEntry, CommunityFavorite } from '../types/tournament';

// Feature flag to control migration
const USE_BACKEND_API = process.env.NEXT_PUBLIC_USE_BACKEND_API === 'true';

// Map of game names to Start.gg videogame IDs (copied from sync-entrants route)
const STARTGG_GAME_IDS: Record<string, number> = {
  'Street Fighter 6': 43868,
  'Tekken 8': 49783,
  'Dragon Ball FighterZ': 287,
  'Mortal Kombat 1': 48599,
  'Guilty Gear Strive': 33945,
  'Fatal Fury: City of the Wolves': 73221,
  'Under Night In Birth II': 50203,
  'THE KING OF FIGHTERS XV': 36963,
  'Samurai Shodown': 3568,
};

interface PhaseStatus {
  currentPhase: string;
  activeEntrantCount: number | null;
  shouldSync: boolean;
  phaseLastChecked: string;
  activeEntrantIds?: string[]; // Add active entrant IDs to the interface
}

interface PhaseData {
  id: string;
  name: string;
  phaseGroups: {
    nodes: { 
      id: string;
      sets?: {
        nodes: {
          id: string;
          state: number;
        }[];
      };
    }[];
  };
  state: number; // 1 = waiting, 2 = in-progress, 3 = complete
}

interface EntrantSlot {
  entrant: { 
    id: string;
    name: string;
  } | null;
}

interface SetData {
  id: string;
  state: number; // 1 = waiting, 2 = in-progress, 3 = completed
  slots: EntrantSlot[];
}

interface PhaseGroupData {
  id: string;
  sets: {
    nodes: SetData[];
  };
}

// GraphQL query to fetch phase metadata only (lightweight)
const GET_PHASE_META_QUERY = `
  query PhaseMeta($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      events(filter: {videogameId: $videogameId}) {
        phases {
          id
          name
          phaseGroups {
            nodes {
              id
              sets(perPage: 10) {
                nodes {
                  id
                  state
                }
              }
            }
          }
          state
        }
      }
    }
  }
`;

// GraphQL query to fetch all sets in a phase group for debugging
const GET_ALL_SETS_QUERY = `
  query AllSets($groupId: ID!) {
    phaseGroup(id: $groupId) {
      id
      sets(perPage: 512) {
        nodes {
          id
          state
          slots {
            entrant { 
              id 
              name
            }
          }
        }
      }
    }
  }
`;

// GraphQL query to get phase group IDs for a specific phase
const GET_PHASE_GROUPS_QUERY = `
  query PhaseGroups($phaseId: ID!) {
    phase(id: $phaseId) {
      phaseGroups {
        nodes {
          id
        }
      }
    }
  }
`;

/**
 * Gets the current phase status and active entrant count for a tournament
 * Returns shouldSync: true only when there are 32 or fewer active entrants
 */
export async function getPhaseStatus(tournamentSlug: string, gameTitle: string): Promise<PhaseStatus> {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
  console.log(`🔍 [getPhaseStatus] Checking phase status for tournament: ${tournamentSlug}, game: ${gameTitle}`);
  
  // Get game ID for Start.gg API
  const gameId = STARTGG_GAME_IDS[gameTitle];
  if (!gameId) {
    throw new Error(`No Start.gg game ID configured for "${gameTitle}"`);
  }

  if (!process.env.START_GG_API_KEY) {
    throw new Error('Start.gg API key not configured');
  }

  // Step 1: Fetch phase metadata (lightweight)
  const phaseResponse = await fetch(START_GG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
    },
    body: JSON.stringify({
      query: GET_PHASE_META_QUERY,
      variables: {
        slug: tournamentSlug,
        videogameId: gameId,
      },
    }),
  });

  if (!phaseResponse.ok) {
    throw new Error(`Start.gg API error: ${phaseResponse.status}`);
  }

  const { data: phaseData, errors: phaseErrors } = await phaseResponse.json();

  if (phaseErrors) {
    console.error('GraphQL Errors:', phaseErrors);
    throw new Error('Failed to fetch phase data from Start.gg');
  }

  // Find all phases and identify the current one (latest non-complete phase)
  const allPhases: PhaseData[] = [];
  for (const event of phaseData.tournament.events || []) {
    allPhases.push(...(event.phases || []));
  }

  if (allPhases.length === 0) {
    throw new Error('No phases found for this tournament');
  }

  // 🔍 DEBUG: Log all phases to understand tournament structure
  console.log(`🔍 [PHASE INVESTIGATION] Found ${allPhases.length} total phases:`);
  allPhases.forEach((phase, index) => {
    console.log(`  ${index + 1}. "${phase.name}" - State: ${phase.state} (1=waiting, 2=active, 3=complete) - Groups: ${phase.phaseGroups.nodes.length}`);
  });

  // Enhanced phase selection logic
  // First, check if tournament has started by looking at set states
  const allPhaseGroups = allPhases.flatMap(phase => phase.phaseGroups.nodes);
  const hasStartedSets = allPhaseGroups.some(pg => 
    pg.sets?.nodes?.some(set => set.state === 2) // In progress sets
  );
  const hasWaitingSets = allPhaseGroups.some(pg => 
    pg.sets?.nodes?.some(set => set.state === 1) // Waiting sets
  );
  const hasCompletedSets = allPhaseGroups.some(pg => 
    pg.sets?.nodes?.some(set => set.state === 3) // Completed sets
  );

  console.log(`🔍 [getPhaseStatus] Tournament state - Started: ${hasStartedSets}, Waiting: ${hasWaitingSets}, Completed: ${hasCompletedSets}`);

  // If tournament hasn't started yet, select the first phase (typically Round 1)
  if (!hasStartedSets && !hasCompletedSets) {
    console.log(`🔍 [getPhaseStatus] Tournament hasn't started yet, selecting first phase`);
    const currentPhase = allPhases[0]; // First phase is typically Round 1
    console.log(`🔍 [getPhaseStatus] Current phase: ${currentPhase.name} (${currentPhase.phaseGroups.nodes.length} groups, state: ${currentPhase.state})`);
    
    // For unstarted tournaments, we should block sync
    return {
      currentPhase: currentPhase.name,
      activeEntrantCount: null, // No active entrants in unstarted tournament
      shouldSync: false,
      phaseLastChecked: new Date().toISOString(),
      activeEntrantIds: [], // No active entrants in unstarted tournament
    };
  }

  // For tournaments in progress, use improved phase selection
  console.log(`🔍 [PHASE INVESTIGATION] Analyzing phase selection logic...`);
  
  // First, categorize all phases by their state and active sets
  const phaseAnalysis = allPhases.map(phase => {
    const hasActiveSets = phase.phaseGroups.nodes.some(pg => 
      pg.sets?.nodes?.some(set => set.state === 1 || set.state === 2)
    );
    const hasCompletedSets = phase.phaseGroups.nodes.some(pg => 
      pg.sets?.nodes?.some(set => set.state === 3)
    );
    return {
      phase,
      hasActiveSets,
      hasCompletedSets,
      isComplete: phase.state === 3,
      isActive: phase.state === 2,
      isWaiting: phase.state === 1
    };
  });
  
  console.log(`🔍 [PHASE INVESTIGATION] Phase analysis:`);
  phaseAnalysis.forEach((analysis, index) => {
    const { phase, hasActiveSets, hasCompletedSets, isComplete, isActive, isWaiting } = analysis;
    console.log(`  ${index + 1}. "${phase.name}": State=${phase.state} (Complete=${isComplete}, Active=${isActive}, Waiting=${isWaiting}), ActiveSets=${hasActiveSets}, CompletedSets=${hasCompletedSets}`);
  });
  
  // NEW LOGIC: Look for the most advanced phase that has entrants
  // Priority: 1) Active phases with active sets, 2) Active phases with completed sets, 3) Waiting phases
  const phasesWithActiveSets = phaseAnalysis.filter(a => a.hasActiveSets);
  const activePhasesWithCompletedSets = phaseAnalysis.filter(a => a.isActive && a.hasCompletedSets && !a.hasActiveSets);
  const waitingPhases = phaseAnalysis.filter(a => a.isWaiting);
  
  console.log(`🔍 [PHASE INVESTIGATION] Categorized phases:`);
  console.log(`  - Phases with active sets: ${phasesWithActiveSets.length}`);
  console.log(`  - Active phases with only completed sets: ${activePhasesWithCompletedSets.length}`);
  console.log(`  - Waiting phases: ${waitingPhases.length}`);

  let currentPhase: PhaseData;
  let selectedAnalysis: any;
  
  // NEW IMPROVED SELECTION LOGIC
  if (phasesWithActiveSets.length > 0) {
    // Priority 1: Phases with currently active sets (ongoing matches)
    selectedAnalysis = phasesWithActiveSets[0];
    currentPhase = selectedAnalysis.phase;
    console.log(`🔍 [PHASE INVESTIGATION] ✅ Selected "${currentPhase.name}" - has active sets (ongoing matches)`);
  } else if (activePhasesWithCompletedSets.length > 0) {
    // Priority 2: Active phases where all sets are complete (phase is done, entrants have advanced)
    selectedAnalysis = activePhasesWithCompletedSets[0];
    currentPhase = selectedAnalysis.phase;
    console.log(`🔍 [PHASE INVESTIGATION] ✅ Selected "${currentPhase.name}" - active phase with completed sets (recently finished)`);
  } else if (waitingPhases.length > 0) {
    // Priority 3: Waiting phases (next phase in progression)
    selectedAnalysis = waitingPhases[0];
    currentPhase = selectedAnalysis.phase;
    console.log(`🔍 [PHASE INVESTIGATION] ✅ Selected "${currentPhase.name}" - waiting phase (next in progression)`);
  } else {
    // Fallback: Use old logic with better logging
    console.log(`🔍 [PHASE INVESTIGATION] ⚠️  NO SUITABLE PHASES FOUND - Using fallback logic...`);
    const fallbackPhases = allPhases.sort((a, b) => b.phaseGroups.nodes.length - a.phaseGroups.nodes.length);
    console.log(`🔍 [PHASE INVESTIGATION] Fallback candidates:`);
    fallbackPhases.forEach((phase, index) => {
      console.log(`  ${index + 1}. "${phase.name}" - State: ${phase.state}, Groups: ${phase.phaseGroups.nodes.length}`);
    });
    currentPhase = fallbackPhases[0];
    selectedAnalysis = { hasActiveSets: false, hasCompletedSets: true }; // Default to looking for advanced entrants
    console.log(`🔍 [PHASE INVESTIGATION] ⚠️  FALLBACK: Selected "${currentPhase.name}" - This might be the wrong phase!`);
  }

  console.log(`🔍 [getPhaseStatus] Current phase: ${currentPhase.name} (${currentPhase.phaseGroups.nodes.length} groups, state: ${currentPhase.state})`);

  // Step 2: Guard by phase name - check if it's a "Top N" phase with N > 32
  const topNMatch = currentPhase.name.match(/Top\s*(\d+)/i);
  if (topNMatch) {
    const topN = parseInt(topNMatch[1], 10);
    console.log(`🔍 [getPhaseStatus] Detected Top ${topN} phase`);
    
    if (topN > 32) {
      console.log(`🚫 [getPhaseStatus] Top ${topN} exceeds 32-entrant limit, blocking sync`);
      return {
        currentPhase: currentPhase.name,
        activeEntrantCount: null, // We didn't count because it would be too many
        shouldSync: false,
        phaseLastChecked: new Date().toISOString(),
        activeEntrantIds: [], // Too many to count safely
      };
    }
  }

  // Step 2.5: Additional guards for tournament state
  // Check if this is an early round with too many phase groups (likely too many entrants)
  if (currentPhase.phaseGroups.nodes.length > 32) {
    console.log(`🚫 [getPhaseStatus] Phase "${currentPhase.name}" has ${currentPhase.phaseGroups.nodes.length} groups, likely too many entrants for safe syncing`);
    return {
      currentPhase: currentPhase.name,
      activeEntrantCount: null, // Too many to count safely
      shouldSync: false,
      phaseLastChecked: new Date().toISOString(),
      activeEntrantIds: [], // Too many to count safely
    };
  }

  // Step 3: Count active entrants by fetching active sets
  // First get phase group IDs
  const groupResponse = await fetch(START_GG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
    },
    body: JSON.stringify({
      query: GET_PHASE_GROUPS_QUERY,
      variables: {
        phaseId: currentPhase.id,
      },
    }),
  });

  if (!groupResponse.ok) {
    throw new Error(`Start.gg API error fetching phase groups: ${groupResponse.status}`);
  }

  const { data: groupData, errors: groupErrors } = await groupResponse.json();

  if (groupErrors) {
    console.error('GraphQL Errors:', groupErrors);
    throw new Error('Failed to fetch phase groups from Start.gg');
  }

  const phaseGroupIds = groupData.phase.phaseGroups.nodes.map((group: any) => group.id);
  console.log(`🔍 [getPhaseStatus] Found ${phaseGroupIds.length} phase groups`);

  // Step 4: Count unique active entrants by querying each phase group individually
  const activeEntrantIds = new Set<string>();
  
  // Determine which entrants to include based on the selected phase analysis
  const includeActiveWaiting = selectedAnalysis?.hasActiveSets || false;
  const includeAdvanced = selectedAnalysis?.hasCompletedSets || false;
  
  console.log(`🔍 [ENTRANT DETECTION] Detection strategy:`);
  console.log(`  - Include entrants in active/waiting sets: ${includeActiveWaiting}`);
  console.log(`  - Include entrants who advanced from completed sets: ${includeAdvanced}`);
  
  for (const groupId of phaseGroupIds) {
    const entrantsResponse = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
              body: JSON.stringify({
          query: GET_ALL_SETS_QUERY,
          variables: {
            groupId: groupId,
          },
        }),
      });

      if (!entrantsResponse.ok) {
        throw new Error(`Start.gg API error fetching active sets for group ${groupId}: ${entrantsResponse.status}`);
      }

      const { data: setsData, errors: setsErrors } = await entrantsResponse.json();

      if (setsErrors) {
        console.error(`GraphQL Errors for group ${groupId}:`, setsErrors);
        throw new Error(`Failed to fetch active sets for phase group ${groupId}: ${setsErrors[0]?.message || 'Unknown error'}`);
      }

      // Process all sets from this phase group
      const phaseGroup = setsData.phaseGroup as PhaseGroupData;
      if (phaseGroup && phaseGroup.sets && phaseGroup.sets.nodes) {
        for (const set of phaseGroup.sets.nodes) {
          // IMPROVED LOGIC: Include different entrants based on phase analysis
          const shouldIncludeSet = 
            (includeActiveWaiting && (set.state === 1 || set.state === 2)) || // Active/waiting sets
            (includeAdvanced && set.state === 3); // Completed sets (entrants who advanced)
            
          if (shouldIncludeSet) {
            for (const slot of set.slots) {
              if (slot.entrant && slot.entrant.id) {
                activeEntrantIds.add(slot.entrant.id);
                if (set.state === 3) {
                  console.log(`🔍 [ADVANCED] Found entrant who advanced: ${slot.entrant.name} (ID: ${slot.entrant.id})`);
                }
              }
            }
          }
        }
      }
  }

  const activeEntrantCount = activeEntrantIds.size;
  console.log(`🔍 [getPhaseStatus] Found ${activeEntrantCount} active entrants`);

  // Step 5: Determine if sync should proceed
  const shouldSync = activeEntrantCount > 0 && activeEntrantCount <= 32;

  return {
    currentPhase: currentPhase.name,
    activeEntrantCount,
    shouldSync,
    phaseLastChecked: new Date().toISOString(),
    activeEntrantIds: Array.from(activeEntrantIds), // Include the active entrant IDs
  };
}

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
    const aTime = a.firstSubmittedAt ? new Date(a.firstSubmittedAt).getTime() : 0;
    const bTime = b.firstSubmittedAt ? new Date(b.firstSubmittedAt).getTime() : 0;
    return aTime - bTime;
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

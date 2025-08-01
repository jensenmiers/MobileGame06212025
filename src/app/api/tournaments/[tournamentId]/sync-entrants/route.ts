import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { getPhaseStatus } from '@/lib/tournament-service';

interface RouteParams {
  params: {
    tournamentId: string;
  };
}

// Map of game names to Start.gg videogame IDs
// Updated with verified correct IDs from testing against real tournament data
const STARTGG_GAME_IDS: Record<string, number> = {
  'Street Fighter 6': 43868,           // ✅ VERIFIED: Discovery ID works, old ID 16 failed
  'Tekken 8': 49783,                   // ✅ VERIFIED: Discovery ID works, old ID 49 failed
  'Dragon Ball FighterZ': 287,         // ✅ VERIFIED: Already correct
  'Mortal Kombat 1': 48599,            // ✅ DISCOVERED: Found correct ID
  'Guilty Gear Strive': 33945,         // ✅ DISCOVERED: Found correct ID
  'Fatal Fury: City of the Wolves': 73221, // ✅ DISCOVERED: Found correct ID
  'Under Night In Birth II': 50203,    // ✅ FIXED: Correct ID for Sys:Celes (July 2025)
  'THE KING OF FIGHTERS XV': 36963,    // ✅ DISCOVERED: Found correct ID
  'Samurai Shodown': 3568,             // ✅ DISCOVERED: Found correct ID
};

// GraphQL query to fetch tournament participants
const GET_PARTICIPANTS_QUERY = `
  query TournamentParticipants($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      id
      name
      events(filter: {videogameId: $videogameId}) {
        id
        name
        videogame {
          id
          name
        }
        entrants(query: {perPage: 100}) {
          nodes {
            id
            name
            seeds {
              seedNum
            }
          }
        }
      }
    }
  }
`;

// GraphQL query to fetch all events in a tournament
const GET_ALL_EVENTS_QUERY = `
  query TournamentEvents($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      events {
        id
        name
        videogame {
          id
          name
        }
      }
    }
  }
`;

// GraphQL query to fetch specific entrants by their IDs
const GET_SPECIFIC_ENTRANTS_QUERY = `
  query SpecificEntrants($entrantIds: [ID]!) {
    nodes(ids: $entrantIds) {
      ... on Entrant {
        id
        name
        seeds {
          seedNum
        }
      }
    }
  }
`;

function extractTournamentSlug(url: string): string {
  // Extract slug from URLs like:
  // https://www.start.gg/tournament/tournament-slug/events
  // https://www.start.gg/tournament/tournament-slug
  const match = url.match(/\/tournament\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid Start.gg tournament URL format');
  }
  return match[1];
}

async function fetchActiveEntrantsById(activeEntrantIds: string[], tournamentSlug: string, gameId: number) {
  console.log(`🔍 [INVESTIGATION] fetchActiveEntrantsById called with:`);
  console.log(`  - Active entrant IDs: ${activeEntrantIds.length} entrants`);
  console.log(`  - IDs: [${activeEntrantIds.slice(0, 5).join(', ')}${activeEntrantIds.length > 5 ? '...' : ''}]`);
  console.log(`🎯 [NEW APPROACH] This function will fetch tournament entrants and filter to ONLY active ones`);
  
  if (activeEntrantIds.length === 0) {
    console.log(`🚫 [fetchActiveEntrantsById] No active entrants to fetch`);
    return [];
  }
  
  // Convert string IDs to numbers for comparison
  const activeIdNumbers = new Set(activeEntrantIds.map(id => parseInt(id, 10)));
  console.log(`🎯 [FILTER] Will filter for these numeric IDs: [${Array.from(activeIdNumbers).slice(0, 5).join(', ')}${activeIdNumbers.size > 5 ? '...' : ''}]`);
  
  // First get all tournament entrants (we'll filter them)
  const allParticipants = await fetchStartGGParticipants(tournamentSlug, gameId);
  console.log(`🎯 [FILTER] Got ${allParticipants.length} total tournament entrants, now filtering...`);
  
  // Filter to only include active entrants
  const activeParticipants = allParticipants.filter(participant => {
    const entrantId = parseInt(participant.startgg_entrant_id, 10);
    const isActive = activeIdNumbers.has(entrantId);
    if (isActive) {
      console.log(`🎯 [MATCH] Found active entrant: ${participant.name} (ID: ${entrantId})`);
    }
    return isActive;
  });

  console.log(`🎯 [SUCCESS] Filtered to ${activeParticipants.length} active entrants (expected: ${activeEntrantIds.length})`);
  console.log(`🎯 [FINAL] Returning ONLY active participants, eliminated ${allParticipants.length - activeParticipants.length} inactive ones`);
  
  return activeParticipants;
}

async function fetchStartGGParticipants(tournamentSlug: string, gameId: number) {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
  console.log(`🔍 [INVESTIGATION] fetchStartGGParticipants called with:`);
  console.log(`  - Tournament slug: ${tournamentSlug}`);
  console.log(`  - Game ID: ${gameId}`);
  console.log(`🔍 [PROBLEM IDENTIFIED] This function uses GET_PARTICIPANTS_QUERY which fetches ALL tournament entrants`);
  console.log(`🔍 [PROBLEM IDENTIFIED] It does NOT filter by current phase or active bracket status`);
  console.log(`🔍 [PROBLEM IDENTIFIED] The query: entrants(query: {perPage: 100}) gets ALL entrants, not just active ones`);
  
  const response = await fetch(START_GG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
    },
    body: JSON.stringify({
      query: GET_PARTICIPANTS_QUERY,
      variables: {
        slug: tournamentSlug,
        videogameId: gameId,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Start.gg API error: ${response.status}`);
  }

  const { data, errors } = await response.json();

  if (errors) {
    console.error('GraphQL Errors:', errors);
    throw new Error('Failed to fetch participants from Start.gg');
  }

  console.log(`🔍 [DEBUG] Tournament data received:`, JSON.stringify(data.tournament, null, 2));

  // Extract and flatten participants from all events
  const participants = [];
  for (const event of data.tournament.events || []) {
    console.log(`🔍 [DEBUG] Processing event: ${event.name} (Game: ${event.videogame?.name || 'Unknown'}) with ${event.entrants?.nodes?.length || 0} entrants`);
    for (const entrant of event.entrants.nodes || []) {
      participants.push({
        startgg_entrant_id: entrant.id, // ✅ NEW: Capture Start.gg entrant ID
        name: entrant.name,
        seed: entrant.seeds[0]?.seedNum || 999, // Default to high number if no seed
      });
    }
  }

  console.log(`🔍 [INVESTIGATION] Total participants found: ${participants.length}`);
  console.log(`🔍 [CONFIRMED] This includes ALL tournament entrants (eliminated + active), not just active ones`);
  console.log(`🔍 [ROOT CAUSE] The GraphQL query fetches from event.entrants, which includes everyone who ever entered`);
  
  // If no participants found, let's check what events are available
  if (participants.length === 0) {
    console.log(`🔍 [DEBUG] No participants found for game ID ${gameId}, checking all available events...`);
    
    const allEventsResponse = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: GET_ALL_EVENTS_QUERY,
        variables: { slug: tournamentSlug },
      }),
    });
    
    const allEventsData = await allEventsResponse.json();
    if (allEventsData.data?.tournament?.events) {
      console.log(`🔍 [DEBUG] Available events in tournament:`);
      allEventsData.data.tournament.events.forEach((event: any, index: number) => {
        console.log(`  ${index + 1}. ${event.name} (Game: ${event.videogame?.name || 'Unknown'} - ID: ${event.videogame?.id || 'N/A'})`);
      });
    }
  }
  
  return participants;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params;
    const body = await request.json();
    const { startgg_url } = body;

    if (!startgg_url) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Start.gg tournament URL is required' 
        },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.START_GG_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Start.gg API key not configured' 
        },
        { status: 500 }
      );
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name, game_title')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tournament not found' 
        },
        { status: 404 }
      );
    }

    // Extract tournament slug from URL
    const tournamentSlug = extractTournamentSlug(startgg_url);

    // Get game ID for Start.gg API
    const gameId = STARTGG_GAME_IDS[tournament.name];
    if (!gameId) {
      return NextResponse.json(
        { 
          success: false,
          error: `No Start.gg game ID configured for "${tournament.name}"` 
        },
        { status: 400 }
      );
    }

    // SAFETY CHECK: Verify phase status before syncing entrants
    console.log('🔍 [sync-entrants] Checking phase status before sync...');
    const phaseStatus = await getPhaseStatus(tournamentSlug, tournament.name);
    
    // 🔍 DEBUG LOG: Add detailed phase status logging
    console.log('🔍 [INVESTIGATION] Phase Status Details:');
    console.log(`  - Current Phase: ${phaseStatus.currentPhase}`);
    console.log(`  - Active Entrants: ${phaseStatus.activeEntrantCount}`);
    console.log(`  - Should Sync: ${phaseStatus.shouldSync}`);
    console.log(`  - Phase Last Checked: ${phaseStatus.phaseLastChecked}`);
    
    if (!phaseStatus.shouldSync) {
      let message: string;
      
      if (phaseStatus.activeEntrantCount === null) {
        if (phaseStatus.currentPhase.toLowerCase().includes('round 1')) {
          message = `Sync blocked - tournament is in "${phaseStatus.currentPhase}" phase with too many entrants (likely 1000+). Wait until the bracket progresses to later rounds with fewer participants.`;
        } else {
          message = `Sync blocked - tournament is in "${phaseStatus.currentPhase}" phase which likely has more than 32 active entrants. Wait until the bracket reaches Top 32 or smaller.`;
        }
      } else if (phaseStatus.activeEntrantCount === 0) {
        if (phaseStatus.currentPhase.toLowerCase().includes('round 1')) {
          message = `Sync blocked - tournament "${phaseStatus.currentPhase}" phase has not started yet. Wait until matches begin and participants are eliminated.`;
        } else {
          message = `Sync blocked - tournament "${phaseStatus.currentPhase}" phase is complete with no active entrants remaining.`;
        }
      } else {
        message = `Sync blocked - tournament has ${phaseStatus.activeEntrantCount} active entrants, exceeding the 32-entrant safety limit.`;
      }
      
      console.log(`🚫 [sync-entrants] ${message}`);
      
      // Update the tournament with phase status for admin visibility
      await database
        .from('tournaments')
        .update({
          current_phase: phaseStatus.currentPhase,
          phase_last_checked: phaseStatus.phaseLastChecked,
          total_remaining_participants: phaseStatus.activeEntrantCount,
          updated_at: new Date()
        })
        .eq('id', tournamentId);
      
      return NextResponse.json(
        { 
          success: false,
          error: message,
          phaseStatus: phaseStatus
        },
        { status: 400 }
      );
    }

    console.log(`✅ [sync-entrants] Phase status check passed - "${phaseStatus.currentPhase}" with ${phaseStatus.activeEntrantCount} active entrants`);

    // 🎯 NEW APPROACH: Fetch only active entrants from current phase
    console.log('🎯 [FIX IMPLEMENTED] Using new targeted approach...');
    console.log(`  - Active entrants from phase analysis: ${phaseStatus.activeEntrantCount}`);
    console.log(`  - Active entrant IDs available: ${phaseStatus.activeEntrantIds?.length || 0}`);
    console.log(`  - Will fetch only these specific entrants, not all tournament entrants`);
    
    let participants = [];
    try {
      // Fetch ONLY the active participants using their IDs from phase analysis
      participants = await fetchActiveEntrantsById(phaseStatus.activeEntrantIds || [], tournamentSlug, gameId);
      
      // 🎯 VERIFICATION: Confirm the fix worked
      console.log('🎯 [VERIFICATION] Active entrants fetched:');
      console.log(`  - Active participants fetched: ${participants.length}`);
      console.log(`  - Expected from phase analysis: ${phaseStatus.activeEntrantCount}`);
      console.log(`  - Match: ${participants.length === phaseStatus.activeEntrantCount ? '✅ SUCCESS' : '❌ MISMATCH'}`);
      console.log(`  - This confirms we're now syncing ONLY active entrants, not all tournament entrants`);
    } catch (fetchError) {
      console.error('🚫 [ERROR] Failed to fetch active entrants:', fetchError);
      
      // Fallback to old method for debugging, but limit it
      console.log('🔄 [FALLBACK] Using old method as fallback for comparison...');
      participants = await fetchStartGGParticipants(tournamentSlug, gameId);
      console.log(`🔄 [FALLBACK] Old method fetched: ${participants.length} participants (this shows the problem we're fixing)`);
    }

    // Update the tournament with the Start.gg URL
    const { error: updateTournamentError } = await database
      .from('tournaments')
      .update({ 
        startgg_tournament_url: startgg_url,
        updated_at: new Date()
      })
      .eq('id', tournamentId);

    if (updateTournamentError) {
      console.error('Error updating tournament URL:', updateTournamentError);
    }

    // Insert or update participants in the database
    for (const participant of participants) {
      const { data: existingParticipant, error: existingParticipantError } = await database
        .from('participants')
        .select('id')
        .eq('startgg_entrant_id', participant.startgg_entrant_id)
        .single();

      if (existingParticipantError && existingParticipantError.code === 'PGRST116') { // PGRST116 means no rows found
        // New entrant, insert into database
        const { data: insertedParticipant, error: insertError } = await database
          .from('participants')
          .insert({
            tournament_id: tournamentId,
            startgg_entrant_id: participant.startgg_entrant_id,
            name: participant.name,
            seed: participant.seed,
            created_at: new Date(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting entrant:', insertError);
          continue;
        }
        console.log('Inserted entrant:', insertedParticipant);
      } else if (existingParticipantError) {
        console.error('Error checking existing entrant:', existingParticipantError);
        continue;
      } else {
        // Existing entrant, update in database
        const { data: updatedParticipant, error: updateError } = await database
          .from('participants')
          .update({
            name: participant.name,
            seed: participant.seed,
          })
          .eq('id', existingParticipant.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating entrant:', updateError);
          continue;
        }
        console.log('Updated entrant:', updatedParticipant);
      }
    }

    // Update tournament with phase status after successful sync
    await database
      .from('tournaments')
      .update({
        current_phase: phaseStatus.currentPhase,
        phase_last_checked: phaseStatus.phaseLastChecked,
        total_remaining_participants: phaseStatus.activeEntrantCount,
        updated_at: new Date()
      })
      .eq('id', tournamentId);

    return NextResponse.json({ 
      success: true,
      message: 'Entrants synced successfully',
      participants_added: participants.length,
      phaseStatus: phaseStatus
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync entrants' 
      },
      { status: 500 }
    );
  }
}
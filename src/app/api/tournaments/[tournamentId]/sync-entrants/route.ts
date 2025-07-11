import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

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

async function fetchStartGGParticipants(tournamentSlug: string, gameId: number) {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
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

  // Extract and flatten participants from all events
  const participants = [];
  for (const event of data.tournament.events || []) {
    for (const entrant of event.entrants.nodes || []) {
      participants.push({
        startgg_entrant_id: entrant.id, // ✅ NEW: Capture Start.gg entrant ID
        name: entrant.name,
        seed: entrant.seeds[0]?.seedNum || 999, // Default to high number if no seed
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
        { error: 'Start.gg tournament URL is required' },
        { status: 400 }
      );
    }

    // Check if API key is configured
    if (!process.env.START_GG_API_KEY) {
      return NextResponse.json(
        { error: 'Start.gg API key not configured' },
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
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Extract tournament slug from URL
    const tournamentSlug = extractTournamentSlug(startgg_url);

    // Get game ID for Start.gg API
    const gameId = STARTGG_GAME_IDS[tournament.name];
    if (!gameId) {
      return NextResponse.json(
        { error: `No Start.gg game ID configured for "${tournament.name}"` },
        { status: 400 }
      );
    }

    // Fetch participants from Start.gg
    const startggParticipants = await fetchStartGGParticipants(tournamentSlug, gameId);

    if (startggParticipants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No entrants found in this tournament',
        participants_added: 0,
        participants_removed: 0,
      });
    }

    console.log(`🔄 [API DEBUG] Starting database operations for tournament ${tournamentId}`);
    console.log(`🔄 [API DEBUG] Using UPSERT approach (no more deletes!)`);
    
    // NEW APPROACH: UPSERT instead of DELETE/INSERT
    // This preserves existing participants and their foreign key relationships
    const upsertStartTime = Date.now();
    
    // Prepare participant data for upsert
    const participantData = startggParticipants.map(p => ({
      tournament_id: tournamentId,
      startgg_entrant_id: p.startgg_entrant_id, // ✅ NEW: Use stable Start.gg ID
      name: p.name,
      seed: p.seed,
      created_at: new Date().toISOString(),
    }));

    console.log(`🔄 [API DEBUG] Prepared ${participantData.length} participants for upsert`);

    // UPSERT participants in batches using Start.gg entrant ID
    const batchSize = 50;
    let totalUpdated = 0;
    let totalCreated = 0;
    
    for (let i = 0; i < participantData.length; i += batchSize) {
      const batch = participantData.slice(i, i + batchSize);
      console.log(`🔄 [API DEBUG] Upserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(participantData.length/batchSize)} (${batch.length} participants)`);
      
      // Use individual upserts to get proper conflict resolution
      for (const participant of batch) {
        // Check for existing participant by startgg_entrant_id first
        let existingParticipant = null;
        
        if (participant.startgg_entrant_id) {
          const { data, error: selectError } = await database
            .from('participants')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('startgg_entrant_id', participant.startgg_entrant_id)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            console.error(`❌ [API DEBUG] Error checking existing participant by startgg_entrant_id:`, selectError);
            throw new Error(`Failed to check existing participant: ${selectError.message}`);
          }
          existingParticipant = data;
        }

        // If not found by startgg_entrant_id, check by (tournament_id, name) due to unique constraint
        if (!existingParticipant) {
          const { data, error: selectError } = await database
            .from('participants')
            .select('id')
            .eq('tournament_id', tournamentId)
            .eq('name', participant.name)
            .single();

          if (selectError && selectError.code !== 'PGRST116') {
            console.error(`❌ [API DEBUG] Error checking existing participant by name:`, selectError);
            throw new Error(`Failed to check existing participant by name: ${selectError.message}`);
          }
          existingParticipant = data;
        }

        if (existingParticipant) {
          // Update existing participant with new data including startgg_entrant_id
          const { error: updateError } = await database
            .from('participants')
            .update({
              startgg_entrant_id: participant.startgg_entrant_id, // ✅ NEW: Populate the stable ID
              name: participant.name,
              seed: participant.seed,
            })
            .eq('id', existingParticipant.id);

          if (updateError) {
            console.error(`❌ [API DEBUG] Update failed:`, updateError);
            throw new Error(`Failed to update participant: ${updateError.message}`);
          }
          totalUpdated++;
          console.log(`🔄 [API DEBUG] Updated participant: ${participant.name} with startgg_entrant_id: ${participant.startgg_entrant_id}`);
        } else {
          // Insert new participant
          const { error: insertError } = await database
            .from('participants')
            .insert(participant);

          if (insertError) {
            console.error(`❌ [API DEBUG] Insert failed:`, insertError);
            throw new Error(`Failed to insert participant: ${insertError.message}`);
          }
          totalCreated++;
          console.log(`🔄 [API DEBUG] Created new participant: ${participant.name} with startgg_entrant_id: ${participant.startgg_entrant_id}`);
        }
      }
    }
    
    const upsertDuration = Date.now() - upsertStartTime;
    console.log(`✅ [API DEBUG] Upsert completed in ${upsertDuration}ms: ${totalUpdated} updated, ${totalCreated} created`);
    
    // Add a small delay to ensure database consistency
    console.log(`🔄 [API DEBUG] Adding 500ms delay for database consistency...`);
    await new Promise(resolve => setTimeout(resolve, 500));

    // Update tournament with Start.gg URL
    const { error: updateError } = await database
      .from('tournaments')
      .update({ startgg_tournament_url: startgg_url })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Failed to update tournament URL:', updateError);
      // Don't fail the whole operation for this
    }

    console.log(`✅ [API DEBUG] Sync operation completed successfully - returning response`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${startggParticipants.length} entrants from Start.gg`,
      participants_updated: totalUpdated,
      participants_created: totalCreated,
      total_participants: startggParticipants.length,
      tournament_slug: tournamentSlug,
      migration_note: "✅ Using stable Start.gg IDs - no more foreign key conflicts!",
    });

  } catch (error) {
    console.error('Start.gg sync error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to sync entrants from Start.gg',
        success: false 
      },
      { status: 500 }
    );
  }
} 
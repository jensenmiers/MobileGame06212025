import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

interface RouteParams {
  params: {
    tournamentId: string;
  };
}

// Map of game names to Start.gg videogame IDs
const STARTGG_GAME_IDS: Record<string, number> = {
  'Street Fighter 6': 16,
  'Tekken 8': 49,
  'Dragon Ball FighterZ': 287,
  'Mortal Kombat 1': 287, // TODO: Verify correct ID
  'Guilty Gear Strive': 287, // TODO: Verify correct ID  
  'Fatal Fury: City of the Wolves': 287, // TODO: Verify correct ID
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
    console.log(`🔄 [API DEBUG] About to clear existing participants`);
    
    // Clear existing participants (clean slate approach)
    const deleteStartTime = Date.now();
    const { error: deleteError } = await database
      .from('participants')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) {
      console.error(`❌ [API DEBUG] Delete failed:`, deleteError);
      throw new Error(`Failed to clear existing participants: ${deleteError.message}`);
    }
    
    const deleteDuration = Date.now() - deleteStartTime;
    console.log(`✅ [API DEBUG] Participants cleared in ${deleteDuration}ms`);

    // Prepare participant data for insertion
    const participantData = startggParticipants.map(p => ({
      tournament_id: tournamentId,
      name: p.name,
      seed: p.seed,
      created_at: new Date().toISOString(),
    }));

    console.log(`🔄 [API DEBUG] Prepared ${participantData.length} participants for insertion`);

    // Insert new participants in batches
    const insertStartTime = Date.now();
    const batchSize = 50;
    for (let i = 0; i < participantData.length; i += batchSize) {
      const batch = participantData.slice(i, i + batchSize);
      console.log(`🔄 [API DEBUG] Inserting batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(participantData.length/batchSize)} (${batch.length} participants)`);
      
      const { error: insertError } = await database
        .from('participants')
        .insert(batch);

      if (insertError) {
        console.error(`❌ [API DEBUG] Insert batch failed:`, insertError);
        throw new Error(`Failed to insert participants: ${insertError.message}`);
      }
    }
    
    const insertDuration = Date.now() - insertStartTime;
    console.log(`✅ [API DEBUG] All participants inserted in ${insertDuration}ms`);
    
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
      participants_added: startggParticipants.length,
      tournament_slug: tournamentSlug,
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
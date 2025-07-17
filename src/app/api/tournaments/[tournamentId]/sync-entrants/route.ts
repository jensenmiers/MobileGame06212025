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
  'Under Night In Birth II': 74072,    // ✅ DISCOVERED: Sys:Celes (latest version)
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

    // Fetch participants from Start.gg
    const participants = await fetchStartGGParticipants(tournamentSlug, gameId);

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

    return NextResponse.json({ 
      success: true,
      message: 'Entrants synced successfully',
      participants_added: participants.length
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
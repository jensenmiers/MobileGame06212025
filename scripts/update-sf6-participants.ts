import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Start.gg API configuration
const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
const TOURNAMENT_SLUG = 'full-combo-fights-at-buffalo-wild-wings-glendale-jun-21st';
const GAME_ID = 16; // Street Fighter 6

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

async function fetchTournamentParticipants() {
  console.log('Fetching participants from Start.gg...');
  
  const response = await fetch(START_GG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
    },
    body: JSON.stringify({
      query: GET_PARTICIPANTS_QUERY,
      variables: {
        slug: TOURNAMENT_SLUG,
        videogameId: GAME_ID,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const { data, errors } = await response.json();

  if (errors) {
    console.error('GraphQL Errors:', errors);
    throw new Error('Failed to fetch participants');
  }

  // Extract and flatten participants from all events
  const participants = [];
  for (const event of data.tournament.events) {
    for (const entrant of event.entrants.nodes) {
      participants.push({
        id: entrant.id,
        name: entrant.name,
        seed: entrant.seeds[0]?.seedNum || 999, // Default to high number if no seed
      });
    }
  }

  console.log(`Found ${participants.length} participants`);
  return participants;
}

async function updateSupabaseParticipants(participants: any[]) {
  const TOURNAMENT_ID = '030054c3-59e5-4b1c-88ed-c2ca7501aa4d'; // Your SF6 tournament ID
  
  console.log('Updating Supabase participants...');
  
  // First, delete existing participants for this tournament
  const { error: deleteError } = await supabase
    .from('participants')
    .delete()
    .eq('tournament_id', TOURNAMENT_ID);

  if (deleteError) {
    console.error('Error deleting existing participants:', deleteError);
    throw deleteError;
  }

  // Prepare participant data for insertion
  const participantData = participants.map(p => ({
    tournament_id: TOURNAMENT_ID,
    name: p.name,
    seed: p.seed,
    created_at: new Date().toISOString(),
  }));

  // Insert new participants in batches of 50 (Supabase limit)
  const batchSize = 50;
  for (let i = 0; i < participantData.length; i += batchSize) {
    const batch = participantData.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('participants')
      .insert(batch);

    if (insertError) {
      console.error('Error inserting participants:', insertError);
      throw insertError;
    }
    
    console.log(`Inserted batch ${i / batchSize + 1} of ${Math.ceil(participantData.length / batchSize)}`);
  }

  console.log(`Successfully updated ${participantData.length} participants`);
}

async function main() {
  try {
    // Check required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.START_GG_API_KEY) {
      throw new Error('Missing required environment variables. Please check .env file.');
    }

    const participants = await fetchTournamentParticipants();
    await updateSupabaseParticipants(participants);
    
    console.log('✅ Done! Participants have been updated.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

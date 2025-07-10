#!/usr/bin/env npx tsx

/**
 * Utility script to inspect what games are available in a Start.gg tournament
 * Usage: npx tsx scripts/inspect-tournament-games.ts "https://www.start.gg/tournament/tournament-slug"
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

interface TournamentInspectionResult {
  tournament: {
    id: string;
    name: string;
    events: Array<{
      id: string;
      name: string;
      videogame: {
        id: number;
        name: string;
        displayName: string;
      };
      numEntrants: number;
    }>;
  };
}

const INSPECT_TOURNAMENT_QUERY = `
  query InspectTournament($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      events {
        id
        name
        videogame {
          id
          name
          displayName
        }
        numEntrants
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

async function inspectTournament(tournamentUrl: string) {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
  console.log(`🔍 Inspecting tournament: ${tournamentUrl}\n`);
  
  try {
    const tournamentSlug = extractTournamentSlug(tournamentUrl);
    console.log(`📍 Tournament slug: "${tournamentSlug}"`);
    
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: INSPECT_TOURNAMENT_QUERY,
        variables: { slug: tournamentSlug }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { data, errors }: { data: TournamentInspectionResult; errors?: any } = await response.json();

    if (errors) {
      console.error('GraphQL Errors:', errors);
      return;
    }

    if (!data.tournament) {
      console.log(`❌ Tournament not found: "${tournamentSlug}"`);
      return;
    }

    const tournament = data.tournament;
    console.log(`\n🏆 Tournament: "${tournament.name}"`);
    console.log(`📊 Total Events: ${tournament.events.length}\n`);

    if (tournament.events.length === 0) {
      console.log('❌ No events found in this tournament');
      return;
    }

    console.log('🎮 GAMES AVAILABLE IN THIS TOURNAMENT:');
    console.log('=' .repeat(60));

    // Group events by game
    const gameGroups: Record<number, { game: any; events: any[] }> = {};
    
    tournament.events.forEach(event => {
      const gameId = event.videogame.id;
      if (!gameGroups[gameId]) {
        gameGroups[gameId] = {
          game: event.videogame,
          events: []
        };
      }
      gameGroups[gameId].events.push(event);
    });

    // Display each game
    Object.values(gameGroups).forEach(({ game, events }) => {
      console.log(`\n🎯 Game ID: ${game.id}`);
      console.log(`   Name: "${game.name}"`);
      console.log(`   Display: "${game.displayName}"`);
      console.log(`   Events (${events.length}):`);
      
      events.forEach(event => {
        console.log(`     - "${event.name}" (${event.numEntrants} entrants)`);
      });
    });

    console.log('\n' + '=' .repeat(60));
    console.log('💡 MAPPING REFERENCE:');
    console.log('const STARTGG_GAME_IDS: Record<string, number> = {');
    
    Object.values(gameGroups).forEach(({ game }) => {
      console.log(`  '${game.displayName}': ${game.id},`);
    });
    
    console.log('};');

  } catch (error) {
    console.error(`❌ Error inspecting tournament:`, error);
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🎮 Tournament Game Inspector\n');
    console.log('Usage: npx tsx scripts/inspect-tournament-games.ts "TOURNAMENT_URL"\n');
    console.log('Example URLs:');
    console.log('  https://www.start.gg/tournament/evo-2024');
    console.log('  https://www.start.gg/tournament/combo-breaker-2024/events');
    console.log('  https://www.start.gg/tournament/your-tournament-slug\n');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  await inspectTournament(tournamentUrl);
}

if (require.main === module) {
  main().catch(console.error);
}

export { inspectTournament, extractTournamentSlug }; 
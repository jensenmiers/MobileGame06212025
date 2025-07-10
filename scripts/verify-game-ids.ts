#!/usr/bin/env npx tsx

/**
 * Utility script to verify which game IDs actually work with real tournament data
 * Usage: npx tsx scripts/verify-game-ids.ts "TOURNAMENT_URL"
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

interface TournamentTestResult {
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
      entrants: {
        nodes: Array<{
          id: string;
          name: string;
        }>;
      };
    }>;
  };
}

const TEST_PARTICIPANTS_QUERY = `
  query TestParticipants($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      id
      name
      events(filter: {videogameId: $videogameId}) {
        id
        name
        videogame {
          id
          name
          displayName
        }
        entrants(query: {perPage: 5}) {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;

function extractTournamentSlug(url: string): string {
  const match = url.match(/\/tournament\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid Start.gg tournament URL format');
  }
  return match[1];
}

async function testGameId(tournamentSlug: string, gameId: number, gameName: string) {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
  console.log(`🧪 Testing Game ID ${gameId} for "${gameName}"`);
  
  try {
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: TEST_PARTICIPANTS_QUERY,
        variables: {
          slug: tournamentSlug,
          videogameId: gameId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { data, errors }: { data: TournamentTestResult; errors?: any } = await response.json();

    if (errors) {
      console.error('   ❌ GraphQL Errors:', errors);
      return null;
    }

    if (!data.tournament) {
      console.log('   ❌ Tournament not found');
      return null;
    }

    const events = data.tournament.events || [];
    
    if (events.length === 0) {
      console.log(`   ❌ No events found for Game ID ${gameId}`);
      return null;
    }

    // Summarize results
    let totalParticipants = 0;
    events.forEach(event => {
      totalParticipants += event.entrants.nodes.length;
      console.log(`   ✅ Found event: "${event.name}" (${event.entrants.nodes.length} participants shown)`);
      console.log(`      Game: "${event.videogame.displayName}" (ID: ${event.videogame.id})`);
    });

    console.log(`   📊 Total: ${events.length} events, ${totalParticipants} participants found\n`);
    
    return {
      gameId,
      gameName,
      eventsFound: events.length,
      participantsFound: totalParticipants,
      actualGameName: events[0]?.videogame.displayName
    };

  } catch (error) {
    console.error(`   ❌ Error testing Game ID ${gameId}:`, error);
    return null;
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🧪 Game ID Verification Script\n');
    console.log('Usage: npx tsx scripts/verify-game-ids.ts "TOURNAMENT_URL"\n');
    console.log('Example: npx tsx scripts/verify-game-ids.ts "https://www.start.gg/tournament/evo-2024"\n');
    console.log('This will test both current and discovered Game IDs against the tournament to see which ones work.');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    process.exit(1);
  }

  console.log(`🧪 Verifying Game IDs against tournament: ${tournamentUrl}\n`);
  
  const tournamentSlug = extractTournamentSlug(tournamentUrl);
  console.log(`📍 Tournament slug: "${tournamentSlug}"\n`);

  // Test scenarios: Current vs Discovery IDs
  const testCases = [
    // Street Fighter 6
    { currentId: 16, discoveryId: 43868, game: 'Street Fighter 6' },
    // Tekken 8  
    { currentId: 49, discoveryId: 49783, game: 'Tekken 8' },
    // Dragon Ball FighterZ (should match)
    { currentId: 287, discoveryId: 287, game: 'Dragon Ball FighterZ' }
  ];

  for (const testCase of testCases) {
    console.log(`🎮 TESTING: ${testCase.game}`);
    console.log('='.repeat(50));
    
    // Test current ID
    console.log(`📋 CURRENT ID (used in your app):`);
    const currentResult = await testGameId(tournamentSlug, testCase.currentId, testCase.game);
    
    // Test discovery ID (only if different)
    if (testCase.currentId !== testCase.discoveryId) {
      console.log(`📋 DISCOVERY ID (found by script):`);
      const discoveryResult = await testGameId(tournamentSlug, testCase.discoveryId, testCase.game);
      
      // Compare results
      if (currentResult && discoveryResult) {
        console.log(`🏆 WINNER: `);
        if (currentResult.participantsFound > discoveryResult.participantsFound) {
          console.log(`   Current ID ${testCase.currentId} returned MORE participants (${currentResult.participantsFound} vs ${discoveryResult.participantsFound})`);
        } else if (discoveryResult.participantsFound > currentResult.participantsFound) {
          console.log(`   Discovery ID ${testCase.discoveryId} returned MORE participants (${discoveryResult.participantsFound} vs ${currentResult.participantsFound})`);
        } else {
          console.log(`   Both IDs returned the same number of participants (${currentResult.participantsFound})`);
        }
      } else if (currentResult && !discoveryResult) {
        console.log(`   Current ID ${testCase.currentId} WORKS, Discovery ID ${testCase.discoveryId} FAILED`);
      } else if (!currentResult && discoveryResult) {
        console.log(`   Discovery ID ${testCase.discoveryId} WORKS, Current ID ${testCase.currentId} FAILED`);
      } else {
        console.log(`   Both IDs failed to return data`);
      }
    } else {
      console.log(`✅ Current and Discovery IDs match (${testCase.currentId})`);
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { testGameId }; 
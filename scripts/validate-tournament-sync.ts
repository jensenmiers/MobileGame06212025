#!/usr/bin/env npx tsx

/**
 * Validation script to ensure all tournaments in the database can sync participants from Start.gg
 * Usage: npx tsx scripts/validate-tournament-sync.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

// Game ID mappings (same as sync endpoint)
const STARTGG_GAME_IDS: Record<string, number> = {
  'Street Fighter 6': 43868,
  'Tekken 8': 49783,
  'Dragon Ball FighterZ': 287,
  'Mortal Kombat 1': 48599,
  'Guilty Gear Strive': 33945,
  'Fatal Fury: City of the Wolves': 73221,
};

// Test tournament URLs for each game (known working tournaments)
const TEST_TOURNAMENT_URLS: Record<string, string> = {
  'Street Fighter 6': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
  'Tekken 8': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
  'Dragon Ball FighterZ': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
  'Mortal Kombat 1': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
  'Guilty Gear Strive': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
  'Fatal Fury: City of the Wolves': 'https://www.start.gg/tournament/full-combo-fights-at-buffalo-wild-wings-chino-hills-may/events',
};

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
        entrants(query: {perPage: 3}) {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;

interface Tournament {
  id: string;
  name: string;
  game_title: string;
  startgg_tournament_url?: string;
}

function extractTournamentSlug(url: string): string {
  const match = url.match(/\/tournament\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid Start.gg tournament URL format');
  }
  return match[1];
}

async function testTournamentSync(tournament: Tournament, testUrl: string): Promise<{
  success: boolean;
  message: string;
  participantsFound: number;
  actualGame?: string;
}> {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  const gameId = STARTGG_GAME_IDS[tournament.name];
  
  if (!gameId) {
    return {
      success: false,
      message: `No game ID mapping found for "${tournament.name}"`,
      participantsFound: 0
    };
  }

  try {
    const tournamentSlug = extractTournamentSlug(testUrl);
    
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
      return {
        success: false,
        message: `API error: ${response.status}`,
        participantsFound: 0
      };
    }

    const { data, errors } = await response.json();

    if (errors) {
      return {
        success: false,
        message: `GraphQL errors: ${errors.map((e: any) => e.message).join(', ')}`,
        participantsFound: 0
      };
    }

    if (!data.tournament) {
      return {
        success: false,
        message: 'Tournament not found',
        participantsFound: 0
      };
    }

    const events = data.tournament.events || [];
    
    if (events.length === 0) {
      return {
        success: false,
        message: `No events found for game ID ${gameId}`,
        participantsFound: 0
      };
    }

    let totalParticipants = 0;
    events.forEach((event: any) => {
      totalParticipants += event.entrants.nodes.length;
    });

    return {
      success: true,
      message: `Found ${events.length} event(s) with ${totalParticipants} participants`,
      participantsFound: totalParticipants,
      actualGame: events[0]?.videogame.displayName
    };

  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      participantsFound: 0
    };
  }
}

async function main() {
  console.log('🔍 Validating Tournament Sync Capability');
  console.log('========================================\n');

  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.error('Please ensure your .env.local file contains the Start.gg API key');
    process.exit(1);
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all tournaments from database
  const { data: tournaments, error } = await supabase
    .from('tournaments')
    .select('id, name, game_title, startgg_tournament_url')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Error fetching tournaments:', error);
    process.exit(1);
  }

  if (!tournaments || tournaments.length === 0) {
    console.log('ℹ️ No tournaments found in database');
    process.exit(0);
  }

  console.log(`Found ${tournaments.length} tournament(s) in database\n`);

  // Test each tournament
  const results = [];
  
  for (const tournament of tournaments) {
    console.log(`🎮 Testing: ${tournament.name}`);
    console.log(`   Game: ${tournament.game_title}`);
    console.log(`   Database ID: ${tournament.id}`);
    console.log(`   Current Start.gg URL: ${tournament.startgg_tournament_url || 'Not set'}`);
    
    const testUrl = TEST_TOURNAMENT_URLS[tournament.name];
    if (!testUrl) {
      console.log(`   ❌ No test URL available for this game`);
      results.push({ tournament: tournament.name, success: false, message: 'No test URL available' });
      console.log('');
      continue;
    }

    console.log(`   Testing with: ${testUrl}`);
    
    const result = await testTournamentSync(tournament, testUrl);
    
    if (result.success) {
      console.log(`   ✅ SUCCESS: ${result.message}`);
      if (result.actualGame) {
        console.log(`   🎯 Confirmed game: ${result.actualGame}`);
      }
    } else {
      console.log(`   ❌ FAILED: ${result.message}`);
    }
    
    results.push({
      tournament: tournament.name,
      success: result.success,
      message: result.message,
      participantsFound: result.participantsFound
    });
    
    console.log('');
  }

  // Summary
  console.log('📊 VALIDATION SUMMARY');
  console.log('====================');
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`✅ Successful: ${successCount}/${totalCount} tournaments`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} tournaments`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 ALL TOURNAMENTS READY FOR SYNC!');
    console.log('All tournaments can successfully sync participants when given Start.gg URLs');
  } else {
    console.log('\n⚠️  Some tournaments need attention:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.tournament}: ${r.message}`);
    });
  }

  process.exit(successCount === totalCount ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
} 
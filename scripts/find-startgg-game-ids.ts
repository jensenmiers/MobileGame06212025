#!/usr/bin/env npx tsx

/**
 * Utility script to find Start.gg videogame IDs for fighting games
 * Usage: npx tsx scripts/find-startgg-game-ids.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

interface VideogameQueryResult {
  videogames: {
    nodes: Array<{
      id: number;
      name: string;
      displayName: string;
    }>;
  };
}

const FIND_VIDEOGAMES_QUERY = `
  query FindVideogames($name: String!) {
    videogames(query: {
      filter: {
        name: $name
      }
      perPage: 10
    }) {
      nodes {
        id
        name
        displayName
      }
    }
  }
`;

async function findGameId(gameName: string): Promise<number | null> {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  
  console.log(`🔍 Searching for: "${gameName}"`);
  
  try {
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: FIND_VIDEOGAMES_QUERY,
        variables: { name: gameName }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { data, errors }: { data: VideogameQueryResult; errors?: any } = await response.json();

    if (errors) {
      console.error('GraphQL Errors:', errors);
      return null;
    }

    const games = data.videogames.nodes;
    
    if (games.length === 0) {
      console.log(`❌ No games found for "${gameName}"`);
      return null;
    }

    console.log(`✅ Found ${games.length} match(es):`);
    games.forEach(game => {
      console.log(`   ID: ${game.id} | Name: "${game.name}" | Display: "${game.displayName}"`);
    });

    // Return the first match (most relevant)
    return games[0].id;

  } catch (error) {
    console.error(`❌ Error searching for "${gameName}":`, error);
    return null;
  }
}

async function main() {
  console.log('🎮 Finding Start.gg Videogame IDs for Fighting Games\n');
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  const gamesToFind = [
    'Mortal Kombat 1',
    'Guilty Gear Strive', 
    'Fatal Fury: City of the Wolves',
    // Also verify existing ones
    'Street Fighter 6',
    'Tekken 8',
    'Dragon Ball FighterZ'
  ];

  const results: Record<string, number | null> = {};

  for (const game of gamesToFind) {
    results[game] = await findGameId(game);
    console.log(''); // Add spacing
  }

  console.log('\n📊 SUMMARY - Correct Game ID Mappings:');
  console.log('const STARTGG_GAME_IDS: Record<string, number> = {');
  
  Object.entries(results).forEach(([game, id]) => {
    if (id !== null) {
      console.log(`  '${game}': ${id},`);
    } else {
      console.log(`  '${game}': UNKNOWN, // ❌ NEEDS MANUAL LOOKUP`);
    }
  });
  
  console.log('};');

  // Check for missing IDs
  const missingIds = Object.entries(results).filter(([_, id]) => id === null);
  if (missingIds.length > 0) {
    console.log('\n⚠️  MANUAL LOOKUP REQUIRED for:');
    missingIds.forEach(([game]) => {
      console.log(`   - ${game}`);
    });
    console.log('\n💡 Try alternative search terms or check Start.gg directly');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { findGameId }; 
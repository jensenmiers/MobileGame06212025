#!/usr/bin/env npx tsx

/**
 * Script to inspect Start.gg ID structure for primary key feasibility
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const GET_PARTICIPANTS_QUERY = `
  query TournamentParticipants($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      id
      name
      events(filter: {videogameId: $videogameId}) {
        id
        name
        entrants(query: {perPage: 10}) {
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

async function inspectStartGGIds() {
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY not found in environment');
    return;
  }

  console.log('🔍 Start.gg ID Structure Analysis');
  console.log('===================================');

  const response = await fetch(START_GG_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
    },
    body: JSON.stringify({
      query: GET_PARTICIPANTS_QUERY,
      variables: {
        slug: 'full-combo-fights-at-buffalo-wild-wings-chino-hills-may',
        videogameId: 43868, // SF6
      },
    }),
  });

  if (!response.ok) {
    console.error('❌ API Request failed:', response.status);
    return;
  }

  const { data, errors } = await response.json();

  if (errors) {
    console.error('❌ GraphQL Errors:', errors);
    return;
  }

  if (!data?.tournament?.events[0]?.entrants?.nodes) {
    console.log('❌ No entrants found in tournament');
    return;
  }

  const entrants = data.tournament.events[0].entrants.nodes;
  
  console.log(`📊 Found ${entrants.length} entrants:`);
  console.log('');

  entrants.forEach((entrant, index) => {
    console.log(`Entrant ${index + 1}:`);
    console.log(`  ID: ${entrant.id} (type: ${typeof entrant.id})`);
    console.log(`  Name: ${entrant.name}`);
    console.log(`  Seed: ${entrant.seeds[0]?.seedNum || 'N/A'}`);
    console.log('');
  });

  // Analysis
  console.log('🔍 ID Analysis:');
  console.log('==============');
  console.log(`✅ ID Type: ${typeof entrants[0].id}`);
  console.log(`✅ ID Length: ${entrants[0].id.toString().length} digits`);
  console.log(`✅ All IDs are unique: ${new Set(entrants.map(e => e.id)).size === entrants.length}`);
  console.log(`✅ ID Pattern: ${entrants[0].id.toString().match(/^\d+$/) ? 'Numeric' : 'Non-numeric'}`);
  
  // Check if IDs are sequential or random
  const ids = entrants.map(e => parseInt(e.id.toString())).sort((a, b) => a - b);
  console.log(`✅ ID Range: ${ids[0]} to ${ids[ids.length - 1]}`);
  
  console.log('');
  console.log('🎯 Primary Key Feasibility:');
  console.log('===========================');
  console.log(`✅ Can be used as primary key: ${typeof entrants[0].id === 'number' || /^\d+$/.test(entrants[0].id.toString())}`);
  console.log(`✅ PostgreSQL compatible: ${entrants[0].id.toString().length <= 19}`); // Max BIGINT
}

inspectStartGGIds().catch(console.error); 
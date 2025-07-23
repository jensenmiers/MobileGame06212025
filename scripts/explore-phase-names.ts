/**
 * Script to explore phase group names in Start.gg API
 * Looking for specific phase groups like "Top 8", "Top 16", etc.
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const EXPLORE_PHASE_NAMES_QUERY = `
  query ExplorePhaseNames($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      events {
        id
        name
        numEntrants
        phases {
          id
          name
          numSeeds
          groupCount
        }
        phaseGroups {
          id
          displayIdentifier
          phase {
            id
            name
          }
          numRounds
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

async function explorePhaseNames(tournamentUrl: string) {
  console.log(`🔍 Exploring phase names for tournament: ${tournamentUrl}\n`);
  
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
        query: EXPLORE_PHASE_NAMES_QUERY,
        variables: { slug: tournamentSlug }
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('GraphQL Errors:', errors);
      return;
    }

    if (!data.tournament) {
      console.log(`❌ Tournament not found: "${tournamentSlug}"`);
      return;
    }

    const tournament = data.tournament;
    console.log(`🏆 Tournament: "${tournament.name}"`);
    console.log(`📊 Total Events: ${tournament.events.length}\n`);

    // Show the raw API response for phase names
    console.log('🔍 RAW API RESPONSE FOR PHASE NAMES:');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('=' .repeat(80));

    // Also show a structured breakdown
    console.log('\n📋 PHASE NAME ANALYSIS:');
    console.log('=' .repeat(80));

    tournament.events.forEach((event: any, eventIndex: number) => {
      console.log(`\n🎮 Event ${eventIndex + 1}: "${event.name}" (${event.numEntrants} entrants)`);
      console.log(`   Event ID: ${event.id}`);
      
      if (event.phases && event.phases.length > 0) {
        console.log(`   📊 Phases (${event.phases.length}):`);
        
        event.phases.forEach((phase: any, phaseIndex: number) => {
          console.log(`\n      Phase ${phaseIndex + 1}: "${phase.name}"`);
          console.log(`         Phase ID: ${phase.id}`);
          console.log(`         Num Seeds: ${phase.numSeeds}`);
          console.log(`         Group Count: ${phase.groupCount}`);
        });
      }

      if (event.phaseGroups && event.phaseGroups.length > 0) {
        console.log(`\n   🏆 Phase Groups (${event.phaseGroups.length}):`);
        
        event.phaseGroups.forEach((phaseGroup: any, groupIndex: number) => {
          console.log(`\n      Phase Group ${groupIndex + 1}:`);
          console.log(`         Group ID: ${phaseGroup.id}`);
          console.log(`         Display Identifier: "${phaseGroup.displayIdentifier}"`);
          console.log(`         Phase: "${phaseGroup.phase.name}" (ID: ${phaseGroup.phase.id})`);
          console.log(`         Num Rounds: ${phaseGroup.numRounds}`);
        });
      }
    });

    // Analysis
    console.log('\n🔍 ANALYSIS:');
    console.log('=' .repeat(80));
    console.log('Looking for patterns in phase group names that could indicate Top 8, Top 16, etc.');
    
    const allPhaseGroups = tournament.events.flatMap((event: any) => event.phaseGroups || []);
    const phaseGroupNames = allPhaseGroups.map((pg: any) => ({
      displayIdentifier: pg.displayIdentifier,
      phaseName: pg.phase.name,
      numRounds: pg.numRounds
    }));
    
    console.log('\nAll Phase Group Names Found:');
    phaseGroupNames.forEach((pg, index) => {
      console.log(`   ${index + 1}. Display: "${pg.displayIdentifier}", Phase: "${pg.phaseName}", Rounds: ${pg.numRounds}`);
    });

  } catch (error) {
    console.error('❌ Error exploring phase names:', error);
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🔍 Phase Name Explorer\n');
    console.log('Usage: npx tsx scripts/explore-phase-names.ts "TOURNAMENT_URL"\n');
    console.log('Example: npx tsx scripts/explore-phase-names.ts "https://www.start.gg/tournament/down-back-tuesdays-mama-lion-7-biweekly-fighting-game-tournament/events"\n');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  await explorePhaseNames(tournamentUrl);
}

main().catch(console.error); 
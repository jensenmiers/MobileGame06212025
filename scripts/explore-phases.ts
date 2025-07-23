/**
 * Script to explore the phases field in Start.gg API
 * Shows actual bracket structure and progression data
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const EXPLORE_PHASES_QUERY = `
  query ExploreTournamentPhases($slug: String!) {
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
          sets(perPage: 50) {
            nodes {
              id
              round
              fullRoundText
              state
              winnerId
              slots {
                id
                entrant {
                  id
                  name
                }
                standing {
                  placement
                }
              }
            }
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

async function explorePhases(tournamentUrl: string) {
  console.log(`🔍 Exploring phases for tournament: ${tournamentUrl}\n`);
  
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
        query: EXPLORE_PHASES_QUERY,
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

    // Show the raw API response for phases
    console.log('🔍 RAW API RESPONSE FOR PHASES:');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('=' .repeat(80));

    // Also show a structured breakdown
    console.log('\n📋 STRUCTURED PHASES BREAKDOWN:');
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
      } else {
        console.log(`   📊 Phases: None found`);
      }

      if (event.phaseGroups && event.phaseGroups.length > 0) {
        console.log(`\n   🏆 Phase Groups (${event.phaseGroups.length}):`);
        
        event.phaseGroups.forEach((phaseGroup: any, groupIndex: number) => {
          console.log(`\n      Phase Group ${groupIndex + 1}: "${phaseGroup.displayIdentifier}"`);
          console.log(`         Group ID: ${phaseGroup.id}`);
          console.log(`         Phase: "${phaseGroup.phase.name}" (ID: ${phaseGroup.phase.id})`);
          
          if (phaseGroup.sets && phaseGroup.sets.nodes && phaseGroup.sets.nodes.length > 0) {
            console.log(`         Sets (${phaseGroup.sets.nodes.length}):`);
            
            phaseGroup.sets.nodes.forEach((set: any, setIndex: number) => {
              console.log(`\n            Set ${setIndex + 1}:`);
              console.log(`               Set ID: ${set.id}`);
              console.log(`               Round: ${set.round}`);
              console.log(`               Full Round Text: "${set.fullRoundText}"`);
              console.log(`               State: ${set.state}`);
              console.log(`               Winner ID: ${set.winnerId || 'N/A'}`);
              
              if (set.slots && set.slots.length > 0) {
                console.log(`               Slots:`);
                set.slots.forEach((slot: any, slotIndex: number) => {
                  console.log(`                  Slot ${slotIndex + 1}:`);
                  console.log(`                     Slot ID: ${slot.id}`);
                  if (slot.entrant) {
                    console.log(`                     Entrant: ${slot.entrant.name} (ID: ${slot.entrant.id})`);
                  }
                  if (slot.standing) {
                    console.log(`                     Placement: ${slot.standing.placement}`);
                  }
                });
              }
            });
          } else {
            console.log(`         Sets: None found`);
          }
        });
      } else {
        console.log(`   🏆 Phase Groups: None found`);
      }
    });

  } catch (error) {
    console.error('❌ Error exploring phases:', error);
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🔍 Tournament Phases Explorer\n');
    console.log('Usage: npx tsx scripts/explore-phases.ts "TOURNAMENT_URL"\n');
    console.log('Example: npx tsx scripts/explore-phases.ts "https://www.start.gg/tournament/down-back-tuesdays-mama-lion-7-biweekly-fighting-game-tournament/events"\n');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  await explorePhases(tournamentUrl);
}

main().catch(console.error); 
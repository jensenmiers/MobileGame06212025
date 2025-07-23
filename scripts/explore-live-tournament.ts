/**
 * Script to explore live tournament data
 * Shows current standings, eliminations, and active participants
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const LIVE_TOURNAMENT_QUERY = `
  query LiveTournamentData($slug: String!) {
    tournament(slug: $slug) {
      id
      name
      events {
        id
        name
        numEntrants
        entrants(query: {perPage: 20}) {
          nodes {
            id
            name
          }
        }
        phaseGroups {
          id
          displayIdentifier
          sets(perPage: 20) {
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

function extractEventId(url: string): string {
  const match = url.match(/\/event\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid Start.gg event URL format');
  }
  return match[1];
}

async function exploreLiveTournament(tournamentUrl: string) {
  console.log(`🔍 Exploring live tournament data: ${tournamentUrl}\n`);
  
  try {
    const tournamentSlug = extractTournamentSlug(tournamentUrl);
    const targetEventId = extractEventId(tournamentUrl);
    
    console.log(`📍 Tournament slug: "${tournamentSlug}"`);
    console.log(`🎮 Target Event ID: "${targetEventId}"`);
    
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: LIVE_TOURNAMENT_QUERY,
        variables: { 
          slug: tournamentSlug
        }
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

    if (!data.tournament || !data.tournament.events || data.tournament.events.length === 0) {
      console.log(`❌ Tournament not found: "${tournamentSlug}"`);
      return;
    }

    // Find the specific event we're looking for
    const event = data.tournament.events.find((e: any) => 
      e.id.toString() === targetEventId || e.name.toLowerCase().includes('street fighter 6')
    );

    if (!event) {
      console.log(`❌ Event not found: "${targetEventId}"`);
      console.log('Available events:');
      data.tournament.events.forEach((e: any) => {
        console.log(`   - ${e.name} (ID: ${e.id})`);
      });
      return;
    }

    console.log(`🏆 Tournament: "${data.tournament.name}"`);
    console.log(`🎮 Event: "${event.name}" (${event.numEntrants} entrants)\n`);

    // Show the raw API response
    console.log('🔍 RAW API RESPONSE:');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(data, null, 2));
    console.log('=' .repeat(80));

    // Analyze current tournament state
    console.log('\n📊 CURRENT TOURNAMENT STATE ANALYSIS:');
    console.log('=' .repeat(80));

    // Get all sets
    const allSets = event.phaseGroups.flatMap((pg: any) => pg.sets.nodes || []);
    console.log(`📋 Total Sets Retrieved: ${allSets.length}`);

    // Analyze by round
    const setsByRound = {};
    allSets.forEach((set: any) => {
      const roundKey = `${set.round} (${set.fullRoundText})`;
      if (!setsByRound[roundKey]) {
        setsByRound[roundKey] = [];
      }
      setsByRound[roundKey].push(set);
    });

    console.log('\n🎯 SETS BY ROUND:');
    Object.entries(setsByRound).forEach(([round, sets]: [string, any]) => {
      console.log(`\n   ${round}: ${sets.length} sets`);
      
      const completedSets = sets.filter((s: any) => s.state === 3);
      const inProgressSets = sets.filter((s: any) => s.state === 2);
      const waitingSets = sets.filter((s: any) => s.state === 1);
      
      console.log(`      ✅ Completed: ${completedSets.length}`);
      console.log(`      🔄 In Progress: ${inProgressSets.length}`);
      console.log(`      ⏳ Waiting: ${waitingSets.length}`);
    });

    // Track active vs eliminated entrants
    const allEntrants = new Set(event.entrants.nodes.map((e: any) => e.id));
    const activeEntrants = new Set();
    const eliminatedEntrants = new Set();
    const entrantsWithPlacements = new Map();

    allSets.forEach((set: any) => {
      set.slots.forEach((slot: any) => {
        if (slot.entrant) {
          const entrantId = slot.entrant.id;
          
          if (set.state === 3) { // Completed set
            if (slot.standing && slot.standing.placement) {
              entrantsWithPlacements.set(entrantId, {
                name: slot.entrant.name,
                placement: slot.standing.placement
              });
              
              // If they have a placement, they're eliminated (except 1st place)
              if (slot.standing.placement > 1) {
                eliminatedEntrants.add(entrantId);
              }
            }
          } else { // Not completed - still active
            activeEntrants.add(entrantId);
          }
        }
      });
    });

    // Remove active entrants from eliminated list
    activeEntrants.forEach(id => eliminatedEntrants.delete(id));

    console.log('\n👥 PARTICIPANT STATUS:');
    console.log(`   Total Entrants: ${allEntrants.size}`);
    console.log(`   Still Active: ${activeEntrants.size}`);
    console.log(`   Eliminated: ${eliminatedEntrants.size}`);

    // Show active entrants
    console.log('\n🔥 STILL ACTIVE PARTICIPANTS:');
    const activeEntrantNames = Array.from(activeEntrants).map(id => {
      const entrant = event.entrants.nodes.find((e: any) => e.id === id);
      return entrant ? entrant.name : `Unknown (${id})`;
    }).sort();
    
    activeEntrantNames.forEach((name, index) => {
      console.log(`   ${index + 1}. ${name}`);
    });

    // Show eliminated entrants with placements
    console.log('\n❌ ELIMINATED PARTICIPANTS:');
    const eliminatedWithPlacements = Array.from(eliminatedEntrants).map(id => {
      const placement = entrantsWithPlacements.get(id);
      const entrant = event.entrants.nodes.find((e: any) => e.id === id);
      return {
        name: entrant ? entrant.name : `Unknown (${id})`,
        placement: placement ? placement.placement : 'Unknown'
      };
    }).sort((a, b) => a.placement - b.placement);

    eliminatedWithPlacements.forEach((entrant) => {
      console.log(`   ${entrant.placement}. ${entrant.name}`);
    });

    // Analyze current round progression
    console.log('\n📈 BRACKET PROGRESSION ANALYSIS:');
    
    // Find the highest round with active sets
    const activeRounds = Object.keys(setsByRound).filter(round => {
      const sets = setsByRound[round];
      return sets.some((s: any) => s.state !== 3); // Has non-completed sets
    });

    if (activeRounds.length > 0) {
      console.log(`   Current Active Rounds: ${activeRounds.join(', ')}`);
      
      // Determine if we're at Top 8, Top 4, etc.
      const hasQuarterFinals = activeRounds.some(round => round.includes('Quarter-Final'));
      const hasSemiFinals = activeRounds.some(round => round.includes('Semi-Final'));
      const hasFinals = activeRounds.some(round => round.includes('Final'));
      
      if (hasQuarterFinals) {
        console.log(`   🎯 Status: At or approaching Top 8`);
      }
      if (hasSemiFinals) {
        console.log(`   🎯 Status: At or approaching Top 4`);
      }
      if (hasFinals) {
        console.log(`   🎯 Status: At Finals`);
      }
    }

    // Show current standings
    console.log('\n🏆 CURRENT STANDINGS:');
    const sortedPlacements = Array.from(entrantsWithPlacements.values())
      .sort((a, b) => a.placement - b.placement);
    
    sortedPlacements.forEach(entrant => {
      console.log(`   ${entrant.placement}. ${entrant.name}`);
    });

  } catch (error) {
    console.error('❌ Error exploring live tournament:', error);
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🔍 Live Tournament Explorer\n');
    console.log('Usage: npx tsx scripts/explore-live-tournament.ts "TOURNAMENT_URL"\n');
    console.log('Example: npx tsx scripts/explore-live-tournament.ts "https://www.start.gg/tournament/down-back-tuesdays-mama-lion-7-biweekly-fighting-game-tournament/event/street-fighter-6-bracket-pc/brackets/2024327/2963968"\n');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  await exploreLiveTournament(tournamentUrl);
}

main().catch(console.error); 
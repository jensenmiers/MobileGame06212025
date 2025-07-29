/**
 * Script to debug EVO 2025 Tekken 8 phase detection issue
 * This will help us understand why "Top 24" is being selected as current phase
 * when the tournament hasn't started yet
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const DEBUG_EVO_TEKKEN8_QUERY = `
  query DebugEVOTekken8($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      id
      name
      events(filter: {videogameId: $videogameId}) {
        id
        name
        numEntrants
        phases {
          id
          name
          numSeeds
          groupCount
          state
          phaseGroups {
            nodes {
              id
              displayIdentifier
              state
              sets(perPage: 5) {
                nodes {
                  id
                  state
                  round
                  fullRoundText
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

async function debugEVOTekken8Phases(tournamentUrl: string) {
  console.log(`🔍 Debugging EVO 2025 Tekken 8 Phases: ${tournamentUrl}\n`);
  
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
        query: DEBUG_EVO_TEKKEN8_QUERY,
        variables: { 
          slug: tournamentSlug,
          videogameId: 49783 // Tekken 8 game ID
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error ${response.status}: ${errorText}`);
      throw new Error(`API error: ${response.status} - ${errorText}`);
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

    const tournament = data.tournament;
    console.log(`🏆 Tournament: "${tournament.name}"`);
    console.log(`📊 Total Events: ${tournament.events.length}\n`);

    // Find the Tekken 8 event
    const tekken8Event = tournament.events.find((event: any) => 
      event.name.toLowerCase().includes('tekken 8') ||
      event.name.toLowerCase().includes('tk8')
    );

    if (!tekken8Event) {
      console.log('❌ Tekken 8 event not found');
      console.log('Available events:');
      tournament.events.forEach((event: any, index: number) => {
        console.log(`   ${index + 1}. ${event.name} (${event.numEntrants} entrants)`);
      });
      return;
    }

    console.log(`🎮 Tekken 8 Event: "${tekken8Event.name}"`);
    console.log(`👥 Total Entrants: ${tekken8Event.numEntrants}\n`);

    // Analyze phases in detail
    console.log('📋 DETAILED PHASE ANALYSIS:');
    console.log('=' .repeat(80));

    const phases = tekken8Event.phases || [];
    console.log(`Found ${phases.length} phases:\n`);

    phases.forEach((phase: any, index: number) => {
      console.log(`${index + 1}. "${phase.name}"`);
      console.log(`   • ID: ${phase.id}`);
      console.log(`   • State: ${phase.state} (${getStateDescription(phase.state)})`);
      console.log(`   • Phase Groups: ${phase.phaseGroups.nodes.length}`);
      console.log(`   • Num Seeds: ${phase.numSeeds || 'N/A'}`);
      console.log(`   • Group Count: ${phase.groupCount || 'N/A'}`);
      
      // Show phase group details
      if (phase.phaseGroups.nodes.length > 0) {
        console.log(`   • Phase Groups:`);
        phase.phaseGroups.nodes.slice(0, 3).forEach((pg: any, pgIndex: number) => {
          console.log(`     ${pgIndex + 1}. ${pg.displayIdentifier} (state: ${pg.state})`);
          if (pg.sets && pg.sets.nodes.length > 0) {
            const setStates = pg.sets.nodes.map((s: any) => s.state);
            console.log(`        Sets: ${pg.sets.nodes.length} total, states: [${setStates.join(', ')}]`);
          }
        });
        if (phase.phaseGroups.nodes.length > 3) {
          console.log(`     ... and ${phase.phaseGroups.nodes.length - 3} more`);
        }
      }
      console.log('');
    });

    // Simulate the current phase selection logic
    console.log('🔍 SIMULATING CURRENT PHASE SELECTION LOGIC:');
    console.log('=' .repeat(80));

    const allPhases = phases;
    const incompletePhases = allPhases.filter((phase: any) => phase.state !== 3);
    
    console.log(`Total phases: ${allPhases.length}`);
    console.log(`Incomplete phases (state !== 3): ${incompletePhases.length}`);
    
    if (incompletePhases.length > 0) {
      console.log('\nIncomplete phases sorted by phase group count (ascending):');
      const sortedIncomplete = incompletePhases.sort((a: any, b: any) => 
        a.phaseGroups.nodes.length - b.phaseGroups.nodes.length
      );
      
      sortedIncomplete.forEach((phase: any, index: number) => {
        console.log(`${index + 1}. "${phase.name}" - ${phase.phaseGroups.nodes.length} groups (state: ${phase.state})`);
      });
      
      const selectedPhase = sortedIncomplete[0];
      console.log(`\n🎯 SELECTED PHASE: "${selectedPhase.name}"`);
      console.log(`   • Phase Groups: ${selectedPhase.phaseGroups.nodes.length}`);
      console.log(`   • State: ${selectedPhase.state} (${getStateDescription(selectedPhase.state)})`);
      
      // Check if this is a "Top N" phase
      const topNMatch = selectedPhase.name.match(/Top\s*(\d+)/i);
      if (topNMatch) {
        const topN = parseInt(topNMatch[1], 10);
        console.log(`   • Top N Detection: Top ${topN}`);
        console.log(`   • Would block sync: ${topN > 32 ? 'YES' : 'NO'}`);
      }
    } else {
      console.log('All phases are complete (state === 3)');
    }

    // Analyze tournament state
    console.log('\n📊 TOURNAMENT STATE ANALYSIS:');
    console.log('=' .repeat(80));

    const allPhaseGroups = phases.flatMap((phase: any) => phase.phaseGroups.nodes);
    const allSets = allPhaseGroups.flatMap((pg: any) => pg.sets?.nodes || []);
    
    console.log(`Total phase groups: ${allPhaseGroups.length}`);
    console.log(`Total sets: ${allSets.length}`);
    
    if (allSets.length > 0) {
      const setStates = allSets.map((s: any) => s.state);
      const stateCounts = setStates.reduce((acc: any, state: number) => {
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {});
      
      console.log('Set states:');
      Object.entries(stateCounts).forEach(([state, count]) => {
        console.log(`  State ${state} (${getStateDescription(parseInt(state))}): ${count} sets`);
      });
    }

    // Check if tournament has started
    const hasStartedSets = allSets.some((s: any) => s.state === 2); // In progress
    const hasWaitingSets = allSets.some((s: any) => s.state === 1); // Waiting
    const hasCompletedSets = allSets.some((s: any) => s.state === 3); // Completed
    
    console.log('\nTournament Status:');
    console.log(`  • Has in-progress sets: ${hasStartedSets ? 'YES' : 'NO'}`);
    console.log(`  • Has waiting sets: ${hasWaitingSets ? 'YES' : 'NO'}`);
    console.log(`  • Has completed sets: ${hasCompletedSets ? 'YES' : 'NO'}`);
    
    if (!hasStartedSets && !hasWaitingSets && !hasCompletedSets) {
      console.log('  • CONCLUSION: Tournament has not started yet');
    } else if (hasStartedSets) {
      console.log('  • CONCLUSION: Tournament is in progress');
    } else if (hasCompletedSets && !hasStartedSets) {
      console.log('  • CONCLUSION: Tournament is complete');
    }

  } catch (error) {
    console.error('❌ Error debugging EVO Tekken 8 phases:', error);
  }
}

function getStateDescription(state: number): string {
  switch (state) {
    case 0: return 'NOT_STARTED';
    case 1: return 'WAITING';
    case 2: return 'IN_PROGRESS';
    case 3: return 'COMPLETE';
    default: return `UNKNOWN(${state})`;
  }
}

// Run the debug script
if (require.main === module) {
  const tournamentUrl = process.argv[2];
  if (!tournamentUrl) {
    console.error('Usage: npx tsx scripts/debug-evo-2025-tekken8-phases.ts <tournament-url>');
    console.error('Example: npx tsx scripts/debug-evo-2025-tekken8-phases.ts https://www.start.gg/tournament/evo-2025/event/tekken-8');
    process.exit(1);
  }
  
  debugEVOTekken8Phases(tournamentUrl);
} 
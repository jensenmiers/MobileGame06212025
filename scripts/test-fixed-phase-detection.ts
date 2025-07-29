/**
 * Test script to verify the fixed phase detection logic
 * This simulates the updated getPhaseStatus function
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const TEST_PHASE_QUERY = `
  query TestPhaseDetection($slug: String!, $videogameId: [ID]!) {
    tournament(slug: $slug) {
      events(filter: {videogameId: $videogameId}) {
        phases {
          id
          name
          phaseGroups {
            nodes {
              id
              sets(perPage: 10) {
                nodes {
                  id
                  state
                }
              }
            }
          }
          state
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

async function testFixedPhaseDetection(tournamentUrl: string) {
  console.log(`🧪 Testing Fixed Phase Detection: ${tournamentUrl}\n`);
  
  try {
    const tournamentSlug = extractTournamentSlug(tournamentUrl);
    
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: TEST_PHASE_QUERY,
        variables: { 
          slug: tournamentSlug,
          videogameId: 49783 // Tekken 8 game ID
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('GraphQL Errors:', errors);
      return;
    }

    // Simulate the updated getPhaseStatus logic
    const allPhases = data.tournament.events[0].phases || [];
    
    console.log('🔍 SIMULATING UPDATED PHASE SELECTION LOGIC:');
    console.log('=' .repeat(80));

    // Check tournament state by looking at set states
    const allPhaseGroups = allPhases.flatMap((phase: any) => phase.phaseGroups.nodes);
    const hasStartedSets = allPhaseGroups.some((pg: any) => 
      pg.sets?.nodes?.some((set: any) => set.state === 2) // In progress sets
    );
    const hasWaitingSets = allPhaseGroups.some((pg: any) => 
      pg.sets?.nodes?.some((set: any) => set.state === 1) // Waiting sets
    );
    const hasCompletedSets = allPhaseGroups.some((pg: any) => 
      pg.sets?.nodes?.some((set: any) => set.state === 3) // Completed sets
    );

    console.log(`Tournament state - Started: ${hasStartedSets}, Waiting: ${hasWaitingSets}, Completed: ${hasCompletedSets}`);

    // If tournament hasn't started yet, select the first phase (typically Round 1)
    if (!hasStartedSets && !hasCompletedSets) {
      console.log(`🎯 RESULT: Tournament hasn't started yet, selecting first phase`);
      const currentPhase = allPhases[0]; // First phase is typically Round 1
      console.log(`   • Selected Phase: "${currentPhase.name}"`);
      console.log(`   • Phase Groups: ${currentPhase.phaseGroups.nodes.length}`);
      console.log(`   • State: ${currentPhase.state}`);
      console.log(`   • Active Entrants: 0 (tournament not started)`);
      console.log(`   • Should Sync: false (tournament not started)`);
      return;
    }

    // For tournaments in progress, use improved phase selection
    const incompletePhases = allPhases.filter((phase: any) => {
      // Check if phase has any active sets (waiting or in-progress)
      const hasActiveSets = phase.phaseGroups.nodes.some((pg: any) => 
        pg.sets?.nodes?.some((set: any) => set.state === 1 || set.state === 2)
      );
      return phase.state !== 3 && hasActiveSets;
    });

    console.log(`Incomplete phases with active sets: ${incompletePhases.length}`);
    
    if (incompletePhases.length > 0) {
      // Sort phases by tournament progression order
      const phaseOrder = ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Top 24', 'Top 16', 'Top 8', 'Top 4', 'Grand Finals'];
      
      const sortedPhases = incompletePhases.sort((a: any, b: any) => {
        const aIndex = phaseOrder.findIndex(name => a.name.toLowerCase().includes(name.toLowerCase()));
        const bIndex = phaseOrder.findIndex(name => b.name.toLowerCase().includes(name.toLowerCase()));
        
        // If both phases are in our known order, sort by that
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // If only one is in our known order, prioritize it
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        // Fallback to phase group count (smaller = later in tournament)
        return a.phaseGroups.nodes.length - b.phaseGroups.nodes.length;
      });
      
      const currentPhase = sortedPhases[0];
      console.log(`🎯 RESULT: Tournament in progress, selected phase by progression order`);
      console.log(`   • Selected Phase: "${currentPhase.name}"`);
      console.log(`   • Phase Groups: ${currentPhase.phaseGroups.nodes.length}`);
      console.log(`   • State: ${currentPhase.state}`);
      
      // Check guards
      const topNMatch = currentPhase.name.match(/Top\s*(\d+)/i);
      if (topNMatch) {
        const topN = parseInt(topNMatch[1], 10);
        console.log(`   • Top N Detection: Top ${topN}`);
        console.log(`   • Would block sync: ${topN > 32 ? 'YES' : 'NO'}`);
      }
      
      if (currentPhase.phaseGroups.nodes.length > 32) {
        console.log(`   • Would block sync: YES (too many phase groups)`);
      }
    } else {
      console.log(`🎯 RESULT: No incomplete phases with active sets found`);
    }

  } catch (error) {
    console.error('❌ Error testing phase detection:', error);
  }
}

// Run the test
if (require.main === module) {
  const tournamentUrl = process.argv[2];
  if (!tournamentUrl) {
    console.error('Usage: npx tsx scripts/test-fixed-phase-detection.ts <tournament-url>');
    console.error('Example: npx tsx scripts/test-fixed-phase-detection.ts https://www.start.gg/tournament/evo-2025/event/tekken-8');
    process.exit(1);
  }
  
  testFixedPhaseDetection(tournamentUrl);
} 
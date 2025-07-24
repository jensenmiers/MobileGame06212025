/**
 * Simplified script to investigate phase field options for EVO 2025 Street Fighter 6
 * Focuses on essential phase information to avoid API timeouts
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const SIMPLE_EVO_PHASES_QUERY = `
  query SimpleEVOPhases($slug: String!) {
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
          groupCount
          state
        }
        phaseGroups {
          id
          displayIdentifier
          phase {
            id
            name
          }
          numRounds
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

async function exploreEVOPhasesSimple(tournamentUrl: string) {
  console.log(`🔍 Exploring EVO 2025 Phases (Simple): ${tournamentUrl}\n`);
  
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
        query: SIMPLE_EVO_PHASES_QUERY,
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

    if (!data.tournament || !data.tournament.events || data.tournament.events.length === 0) {
      console.log(`❌ Tournament not found: "${tournamentSlug}"`);
      return;
    }

    const tournament = data.tournament;
    console.log(`🏆 Tournament: "${tournament.name}"`);
    console.log(`📊 Total Events: ${tournament.events.length}\n`);

    // Find the Street Fighter 6 event
    const sf6Event = tournament.events.find((event: any) => 
      event.name.toLowerCase().includes('street fighter 6') ||
      event.name.toLowerCase().includes('sf6')
    );

    if (!sf6Event) {
      console.log('❌ Street Fighter 6 event not found');
      console.log('Available events:');
      tournament.events.forEach((event: any, index: number) => {
        console.log(`   ${index + 1}. ${event.name} (${event.numEntrants} entrants)`);
      });
      return;
    }

    console.log(`🎮 Street Fighter 6 Event: "${sf6Event.name}"`);
    console.log(`👥 Total Entrants: ${sf6Event.numEntrants}\n`);

    // Analyze phases
    console.log('📋 PHASE ANALYSIS:');
    console.log('=' .repeat(80));

    if (sf6Event.phases && sf6Event.phases.length > 0) {
      console.log(`📊 Total Phases: ${sf6Event.phases.length}\n`);

      sf6Event.phases.forEach((phase: any, index: number) => {
        console.log(`Phase ${index + 1}: "${phase.name}"`);
        console.log(`   Phase ID: ${phase.id}`);
        console.log(`   Group Count: ${phase.groupCount}`);
        console.log(`   State: ${phase.state}`);
        console.log('');
      });
    } else {
      console.log('❌ No phases found');
    }

    // Analyze phase groups
    console.log('🏆 PHASE GROUPS ANALYSIS:');
    console.log('=' .repeat(80));

    if (sf6Event.phaseGroups && sf6Event.phaseGroups.length > 0) {
      console.log(`📊 Total Phase Groups: ${sf6Event.phaseGroups.length}\n`);

      // Group phase groups by phase
      const phaseGroupsByPhase = {};
      sf6Event.phaseGroups.forEach((phaseGroup: any) => {
        const phaseName = phaseGroup.phase.name;
        if (!phaseGroupsByPhase[phaseName]) {
          phaseGroupsByPhase[phaseName] = [];
        }
        phaseGroupsByPhase[phaseName].push(phaseGroup);
      });

      Object.entries(phaseGroupsByPhase).forEach(([phaseName, phaseGroups]: [string, any]) => {
        console.log(`📋 Phase: "${phaseName}"`);
        console.log(`   Number of Phase Groups: ${phaseGroups.length}`);
        
        phaseGroups.forEach((phaseGroup: any, index: number) => {
          console.log(`\n   Phase Group ${index + 1}: "${phaseGroup.displayIdentifier}"`);
          console.log(`      Group ID: ${phaseGroup.id}`);
          console.log(`      Num Rounds: ${phaseGroup.numRounds}`);
          console.log(`      State: ${phaseGroup.state}`);
        });
        console.log('');
      });
    } else {
      console.log('❌ No phase groups found');
    }

    // Show raw API response for detailed analysis
    console.log('🔍 RAW API RESPONSE FOR DETAILED ANALYSIS:');
    console.log('=' .repeat(80));
    console.log(JSON.stringify(data, null, 2));

    // Analyze tournament progression based on the screenshot
    console.log('\n🎯 TOURNAMENT PROGRESSION ANALYSIS (Based on Screenshot):');
    console.log('=' .repeat(80));

    console.log(`
EVO 2025 Street Fighter 6 - Tournament Structure:

Round 1: 256 Pools, 4,230 Entrants
├── 3 players per pool advance to Round 2
└── 256 pools × 3 players = 768 players advance

Round 2: 32 Pools, ~768 Entrants  
├── 6 players per pool advance to Round 3
└── 32 pools × 6 players = 192 players advance

Round 3: 8 Pools, ~192 Entrants
├── 6 players per pool advance to Round 4  
└── 8 pools × 6 players = 48 players advance

Round 4: 2 Pools, ~48 Entrants
├── 12 players per pool advance to Top 24
└── 2 pools × 12 players = 24 players advance

Top 24: 1 Pool, 24 Entrants
├── 8 players advance to Top 8
└── 1 pool × 8 players = 8 players advance

Top 8: 1 Pool, 8 Entrants
└── Final bracket to determine winner
`);

    console.log('\n💡 EFFICIENT FILTERING IMPLICATIONS:');
    console.log('=' .repeat(80));

    console.log(`
At Different Tournament Stages:

1. ROUND 1 (4,230 entrants):
   • Active sets: ~1,000+ (256 pools × ~4 sets per pool)
   • Active participants: ~4,230
   • Data reduction: 0% (all participants still active)

2. ROUND 2 (768 entrants):
   • Active sets: ~200+ (32 pools × ~6 sets per pool)
   • Active participants: ~768
   • Data reduction: 82% (from 4,230 to 768)

3. ROUND 3 (192 entrants):
   • Active sets: ~50+ (8 pools × ~6 sets per pool)
   • Active participants: ~192
   • Data reduction: 95% (from 4,230 to 192)

4. ROUND 4 (48 entrants):
   • Active sets: ~15+ (2 pools × ~8 sets per pool)
   • Active participants: ~48
   • Data reduction: 99% (from 4,230 to 48)

5. TOP 24 (24 entrants):
   • Active sets: ~8+ (1 pool × ~8 sets)
   • Active participants: ~24
   • Data reduction: 99.4% (from 4,230 to 24)

6. TOP 8 (8 entrants):
   • Active sets: ~4+ (1 pool × ~4 sets)
   • Active participants: ~8
   • Data reduction: 99.8% (from 4,230 to 8)
`);

    console.log('\n🎯 PHASE FIELD OPTIONS SUMMARY:');
    console.log('=' .repeat(80));

    console.log(`
Based on the EVO 2025 structure, the phase field could return:

1. "Round 1" - Pool phase with 256 groups
2. "Round 2" - Pool phase with 32 groups  
3. "Round 3" - Pool phase with 8 groups
4. "Round 4" - Pool phase with 2 groups
5. "Top 24" - Bracket phase with 1 group
6. "Top 8" - Bracket phase with 1 group

Each phase represents a distinct stage of the tournament with:
• Different number of phase groups
• Different number of participants
• Different progression rules
• Different set structures
`);

  } catch (error) {
    console.error('❌ Error exploring EVO phases:', error);
  }
}

async function main() {
  const tournamentUrl = process.argv[2];
  
  if (!tournamentUrl) {
    console.log('🔍 EVO 2025 Phase Explorer (Simple)\n');
    console.log('Usage: npx tsx scripts/explore-evo-phases-simple.ts "TOURNAMENT_URL"\n');
    console.log('Example: npx tsx scripts/explore-evo-phases-simple.ts "https://www.start.gg/tournament/evo-2025"\n');
    process.exit(1);
  }
  
  // Check API key
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    process.exit(1);
  }

  await exploreEVOPhasesSimple(tournamentUrl);
}

main().catch(console.error); 
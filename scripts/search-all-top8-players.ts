/**
 * Script to search for all top 8 players across all tournaments
 * Uses start.gg API to find players by name
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const SEARCH_TOURNAMENT_ENTRANTS_QUERY = `
  query SearchTournamentEntrants($slug: String!, $page: Int!) {
    tournament(slug: $slug) {
      id
      name
      events {
        id
        name
        slug
        entrants(query: {perPage: 50, page: $page}) {
          nodes {
            id
            name
            participants {
              id
              gamerTag
              prefix
            }
          }
        }
      }
    }
  }
`;

// Top 8 players for each tournament
const TOP8_DATA = {
  'Mortal Kombat 1': [
    'SonicFox', 'ONi|Kanimani', 'RBT|Nicolas', 'PAR|Rewind', 
    'RBT|Scorpionprocs', 'Grr', 'STG|Onlinecale213', '2G|SnakeDoe'
  ],
  'Tekken 8': [
    'DRX|Knee', 'DNF|Ulsan', 'Falcons|Atif', 'DNF|Mulgold', 
    'TM|Arslan Ash', 'Varrel|Rangchu', 'Yamasa|Nobi', 'DRX|LowHigh'
  ],
  'Street Fighter 6': [
    'DRX|Leshar', 'Zeta|Kakeru', 'FLY|Punk', 'WBG|MenaRD', 
    'Reject|Fuudo', 'Falcons|NL', 'Mouz|EndingWalker', '2G|Blaz'
  ],
  'Guilty Gear Strive': [
    'PAR|Daru', 'RedDitto', 'Tatuma', 'FLY|Nitro', 
    'PAR|Jack', 'Kshuewhatdamoo', 'TSM|Leffen', 'Verix'
  ],
  'Under Night In-Birth II [Sys:Celes]': [
    'Senaru', 'BBB|Defiant', 'PAR|BigBlack', 'BNP|Knotts', 
    '2GB Combo', 'Chobi', 'BBB|OmniDeag', 'Ugly|Shaly'
  ],
  'Fatal Fury: City of the Wolves': [
    'KSG|Xiaohai', 'DFM|Go1', 'CAG|Fenrich', 'Saishunkan|Nemo', 
    'Falcons|Kindevu', 'T1|ZJZ', 'ONIC|NYChrisG', 'AG|Reynald'
  ],
  'Samurai Shodown': [
    'XBF|ScrubSaibot', 'Watanabe Shachou', 'Guppii', 'XBF|Maki', 
    'Bubba000', 'Royalpsycho', 'BBoySonicX', 'Healing Vision'
  ],
  'THE KING OF FIGHTERS XV': [
    'GHZ|TheGio', 'Falcons|E.T.', 'LEV|Layec', 'QAD|Wero Asamiya', 
    'Liquid|ViolentKain', 'Falcons|Tamago', 'Comitê|PiterErn', 'LEV|Pako'
  ]
};

// Tournament slugs for EVO 2025
const TOURNAMENT_SLUGS = {
  'Mortal Kombat 1': 'evo-2025',
  'Tekken 8': 'evo-2025', 
  'Street Fighter 6': 'evo-2025',
  'Guilty Gear Strive': 'evo-2025',
  'Under Night In-Birth II [Sys:Celes]': 'evo-2025',
  'Fatal Fury: City of the Wolves': 'evo-2025',
  'Samurai Shodown': 'evo-2025',
  'THE KING OF FIGHTERS XV': 'evo-2025'
};

// Event slugs for each game
const EVENT_SLUGS = {
  'Mortal Kombat 1': 'tournament/evo-2025/event/mortal-kombat-1',
  'Tekken 8': 'tournament/evo-2025/event/tekken-8',
  'Street Fighter 6': 'tournament/evo-2025/event/street-fighter-6',
  'Guilty Gear Strive': 'tournament/evo-2025/event/guilty-gear-strive',
  'Under Night In-Birth II [Sys:Celes]': 'tournament/evo-2025/event/under-night-in-birth-ii-sys-celes',
  'Fatal Fury: City of the Wolves': 'tournament/evo-2025/event/fatal-fury-city-of-the-wolves',
  'Samurai Shodown': 'tournament/evo-2025/event/samurai-shodown',
  'THE KING OF FIGHTERS XV': 'tournament/evo-2025/event/the-king-of-fighters-xv'
};

async function searchTop8PlayersForTournament(tournamentName: string) {
  console.log(`🔍 Searching for Top 8 players in ${tournamentName}\n`);
  
  const players = TOP8_DATA[tournamentName as keyof typeof TOP8_DATA];
  const tournamentSlug = TOURNAMENT_SLUGS[tournamentName as keyof typeof TOURNAMENT_SLUGS];
  const eventSlug = EVENT_SLUGS[tournamentName as keyof typeof EVENT_SLUGS];
  
  if (!players || !tournamentSlug || !eventSlug) {
    console.error(`❌ Missing data for tournament: ${tournamentName}`);
    return [];
  }
  
  const foundPlayers: any[] = [];
  
  // Search through multiple pages to find all players
  for (let page = 1; page <= 10; page++) { // Search first 10 pages (500 entrants)
    try {
      console.log(`📄 Searching page ${page}...`);
      
      const response = await fetch(START_GG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
        },
        body: JSON.stringify({
          query: SEARCH_TOURNAMENT_ENTRANTS_QUERY,
          variables: { 
            slug: tournamentSlug,
            page: page
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error('GraphQL Errors:', errors);
        continue;
      }

      if (!data.tournament || !data.tournament.events || data.tournament.events.length === 0) {
        console.log(`❌ Tournament or event not found`);
        return [];
      }

      // Find the specific event
      const event = data.tournament.events.find((e: any) => e.slug === eventSlug);
      if (!event) {
        console.log(`❌ Event "${eventSlug}" not found in tournament`);
        return [];
      }

      if (page === 1) {
        console.log(`🏆 Tournament: ${data.tournament.name}`);
        console.log(`🎮 Event: ${event.name} (searching through entrants...)\n`);
      }

      // Search for top 8 players
      event.entrants.nodes.forEach((entrant: any) => {
        entrant.participants.forEach((participant: any) => {
          const fullName = `${participant.prefix || ''} ${participant.gamerTag}`.trim();
          const entrantName = entrant.name;
          
          // Check if this player matches any of the top 8
          players.forEach((playerName, index) => {
            const [teamPrefix, gamerTag] = playerName.split('|');
            
            // More precise matching
            const isMatch = 
              // Exact match for full name
              fullName.toLowerCase() === playerName.toLowerCase() ||
              entrantName.toLowerCase() === playerName.toLowerCase() ||
              // Match by team prefix and gamer tag
              (participant.prefix && participant.prefix.toLowerCase().includes(teamPrefix.toLowerCase()) &&
               participant.gamerTag.toLowerCase().includes(gamerTag.toLowerCase())) ||
              // Match just the gamer tag for players without team prefix
              (gamerTag && participant.gamerTag.toLowerCase().includes(gamerTag.toLowerCase()));
            
            if (isMatch) {
              // Check if we already found this specific player
              const alreadyFound = foundPlayers.find(p => p.playerName === playerName);
              if (!alreadyFound) {
                foundPlayers.push({
                  rank: index + 1,
                  playerName: playerName,
                  entrantId: entrant.id,
                  entrantName: entrant.name,
                  participantId: participant.id,
                  gamerTag: participant.gamerTag,
                  prefix: participant.prefix,
                  fullName: fullName,
                  tournamentName: tournamentName
                });
              }
            }
          });
        });
      });

      // If we found all 8 players, we can stop searching
      if (foundPlayers.length >= 8) {
        console.log(`✅ Found all ${foundPlayers.length} top 8 players!`);
        break;
      }

    } catch (error) {
      console.error(`❌ Error searching page ${page}:`, error);
    }
  }

  // Display results
  console.log('\n' + '=' .repeat(60));
  console.log(`🏆 TOP 8 ${tournamentName.toUpperCase()} PLAYERS FOUND`);
  console.log('=' .repeat(60));

  if (foundPlayers.length === 0) {
    console.log('❌ No top 8 players found in this tournament');
    return [];
  }

  // Sort by rank and display
  foundPlayers.sort((a, b) => a.rank - b.rank);
  
  foundPlayers.forEach((player, index) => {
    console.log(`\n${index + 1}. ${player.playerName}`);
    console.log(`   Entrant ID: ${player.entrantId}`);
    console.log(`   Entrant Name: ${player.entrantName}`);
    console.log(`   Participant ID: ${player.participantId}`);
    console.log(`   Gamer Tag: ${player.gamerTag}`);
    console.log(`   Prefix: ${player.prefix || 'None'}`);
    console.log(`   Full Name: ${player.fullName}`);
  });

  // Show missing players
  const foundPlayerNames = foundPlayers.map(p => p.playerName);
  const missingPlayers = players.filter(name => !foundPlayerNames.includes(name));
  
  if (missingPlayers.length > 0) {
    console.log('\n' + '=' .repeat(60));
    console.log('❌ MISSING PLAYERS');
    console.log('=' .repeat(60));
    missingPlayers.forEach((player, index) => {
      console.log(`${index + 1}. ${player}`);
    });
  }

  return foundPlayers;
}

async function searchAllTournaments() {
  console.log('🎮 Searching for Top 8 Players Across All Tournaments\n');
  console.log('=' .repeat(80));

  const allResults: Record<string, any[]> = {};

  for (const tournamentName of Object.keys(TOP8_DATA)) {
    console.log(`\n🎯 Processing ${tournamentName}...`);
    const results = await searchTop8PlayersForTournament(tournamentName);
    allResults[tournamentName] = results;
    
    // Add a delay between tournaments to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('=' .repeat(80));
  
  Object.entries(allResults).forEach(([tournament, players]) => {
    console.log(`${tournament}: ${players.length}/8 players found`);
  });

  return allResults;
}

async function main() {
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    return;
  }

  await searchAllTournaments();
}

main().catch(console.error); 
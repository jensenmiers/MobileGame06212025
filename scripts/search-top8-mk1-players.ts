/**
 * Script to search for top 8 players from Mortal Kombat 1 tournament
 * Based on the tournament bracket results
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

async function searchTop8Players(tournamentSlug: string, eventSlug: string) {
  console.log(`🔍 Searching for Top 8 MK1 players in tournament: ${tournamentSlug}\n`);
  
  // Top 8 players from the bracket
  const top8Players = [
    'SonicFox',
    'ONi|Kanimani',
    'RBT|Nicolas',
    'PAR|Rewind', 
    'RBT|Scorpionprocs',
    'Grr',
    'STG|Onlinecale213',
    '2G|SnakeDoe'
  ];
  
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
        return;
      }

      // Find the specific event
      const event = data.tournament.events.find((e: any) => e.slug === eventSlug);
      if (!event) {
        console.log(`❌ Event "${eventSlug}" not found in tournament`);
        return;
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
          top8Players.forEach((playerName, index) => {
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
                  fullName: fullName
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
  console.log('🏆 TOP 8 MORTAL KOMBAT 1 PLAYERS FOUND');
  console.log('=' .repeat(60));

  if (foundPlayers.length === 0) {
    console.log('❌ No top 8 players found in this tournament');
    return;
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
  const missingPlayers = top8Players.filter(name => !foundPlayerNames.includes(name));
  
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

async function main() {
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    return;
  }

  console.log('🎮 Top 8 MK1 Players Search\n');
  console.log('=' .repeat(50));

  // Search in EVO 2025 tournament
  await searchTop8Players('evo-2025', 'tournament/evo-2025/event/mortal-kombat-1');
}

main().catch(console.error); 
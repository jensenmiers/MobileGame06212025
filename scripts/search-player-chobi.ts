/**
 * Script to search for player "ONi Kanimani" in Mortal Kombat 1 tournament
 * ONi is his team name
 */

const START_GG_API_URL = 'https://api.start.gg/gql/alpha';

const SEARCH_PLAYER_QUERY = `
  query SearchPlayer($query: String!) {
    player(query: {filter: {name: $query}}) {
      id
      gamerTag
      prefix
      user {
        id
        name
      }
      events {
        nodes {
          id
          name
          tournament {
            id
            name
            slug
          }
          entrants(query: {perPage: 10}) {
            nodes {
              id
              name
              participants {
                nodes {
                  id
                  gamerTag
                  prefix
                }
              }
            }
          }
        }
      }
    }
  }
`;

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

async function searchPlayerByName(playerName: string) {
  console.log(`🔍 Searching for player: "${playerName}"\n`);
  
  try {
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query: SEARCH_PLAYER_QUERY,
        variables: { 
          query: playerName
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

    if (!data.player) {
      console.log(`❌ No player found matching: "${playerName}"`);
      return;
    }

    console.log(`✅ Found player matching "${playerName}":\n`);

    const player = data.player;
    console.log(`Player Details:`);
    console.log(`   ID: ${player.id}`);
    console.log(`   Gamer Tag: ${player.gamerTag}`);
    console.log(`   Prefix: ${player.prefix || 'None'}`);
    if (player.user) {
      console.log(`   User: ${player.user.name} (ID: ${player.user.id})`);
    }
    
    if (player.events && player.events.nodes && player.events.nodes.length > 0) {
      console.log(`   Recent Events: ${player.events.nodes.length}`);
      player.events.nodes.slice(0, 3).forEach((event: any) => {
        console.log(`     - ${event.name} (${event.tournament.name})`);
      });
    }
    console.log('');

    return [player];
  } catch (error) {
    console.error('❌ Error searching for player:', error);
  }
}

async function searchMortalKombat1Tournaments() {
  console.log(`🔍 Searching for Mortal Kombat 1 tournaments...\n`);
  
  // Common MK1 tournament slugs to check
  const mk1TournamentSlugs = [
    'evo-2025',
    'evo-2024',
    'ceo-2024',
    'combo-breaker-2024',
    'summer-jam-2024'
  ];

  for (const slug of mk1TournamentSlugs) {
    try {
      console.log(`Checking tournament: ${slug}`);
      
      const response = await fetch(START_GG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
        },
        body: JSON.stringify({
          query: `
            query TournamentEvents($slug: String!) {
              tournament(slug: $slug) {
                id
                name
                events {
                  id
                  name
                  slug
                  numEntrants
                }
              }
            }
          `,
          variables: { slug }
        }),
      });

      if (!response.ok) {
        console.log(`   ❌ Tournament not found or error: ${response.status}`);
        continue;
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.log(`   ❌ GraphQL errors for ${slug}`);
        continue;
      }

      if (data.tournament) {
        console.log(`   ✅ Found: ${data.tournament.name}`);
        
        const mk1Events = data.tournament.events.filter((event: any) => 
          event.name.toLowerCase().includes('mortal kombat') || 
          event.name.toLowerCase().includes('mk1') ||
          event.name.toLowerCase().includes('mk 1')
        );

        if (mk1Events.length > 0) {
          console.log(`   🎮 MK1 Events found:`);
          mk1Events.forEach((event: any) => {
            console.log(`      - ${event.name} (${event.numEntrants} entrants) - slug: ${event.slug}`);
          });
        } else {
          console.log(`   ❌ No MK1 events found in this tournament`);
        }
      }
      console.log('');
    } catch (error) {
      console.log(`   ❌ Error checking ${slug}:`, error instanceof Error ? error.message : String(error));
    }
  }
}

async function searchSpecificTournamentForPlayer(tournamentSlug: string, eventSlug: string, playerName: string) {
  console.log(`🔍 Searching for "${playerName}" in tournament: ${tournamentSlug}, event: ${eventSlug}\n`);
  
  // Try different search patterns
  const searchPatterns = [
    playerName,
    'Kanimani',
    'ONi',
    'ONi Kanimani',
    'ONi|Kanimani'
  ];
  
  for (let page = 1; page <= 5; page++) { // Search first 5 pages (250 entrants)
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
        console.log('Available events:');
        data.tournament.events.forEach((e: any) => {
          console.log(`   - ${e.name} (slug: ${e.slug})`);
        });
        return;
      }

      if (page === 1) {
        console.log(`🏆 Tournament: ${data.tournament.name}`);
        console.log(`🎮 Event: ${event.name} (searching through entrants...)\n`);
      }

      // Search for the player with multiple patterns
      const matchingEntrants = event.entrants.nodes.filter((entrant: any) => {
        return entrant.participants.some((participant: any) => {
          const fullName = `${participant.prefix || ''} ${participant.gamerTag}`.trim();
          const entrantName = entrant.name;
          
          // Check all search patterns
          return searchPatterns.some(pattern => 
            fullName.toLowerCase().includes(pattern.toLowerCase()) ||
            participant.gamerTag.toLowerCase().includes(pattern.toLowerCase()) ||
            entrantName.toLowerCase().includes(pattern.toLowerCase())
          );
        });
      });

      if (matchingEntrants.length > 0) {
        console.log(`✅ Found ${matchingEntrants.length} matching entrant(s) on page ${page}:\n`);

        matchingEntrants.forEach((entrant: any, index: number) => {
          console.log(`${index + 1}. Entrant Details:`);
          console.log(`   Entrant ID: ${entrant.id}`);
          console.log(`   Entrant Name: ${entrant.name}`);
          
          entrant.participants.forEach((participant: any) => {
            console.log(`   Participant ID: ${participant.id}`);
            console.log(`   Gamer Tag: ${participant.gamerTag}`);
            console.log(`   Prefix: ${participant.prefix || 'None'}`);
          });
          console.log('');
        });

        return matchingEntrants;
      }

      // If no matches found and this is the last page, show some sample entrants
      if (page === 5) {
        console.log(`❌ No entrants found matching any of the patterns: ${searchPatterns.join(', ')}`);
        console.log('\n📋 Sample entrants from this event:');
        event.entrants.nodes.slice(0, 10).forEach((entrant: any, index: number) => {
          const participant = entrant.participants[0];
          const fullName = `${participant.prefix || ''} ${participant.gamerTag}`.trim();
          console.log(`   ${index + 1}. ${fullName}`);
        });
      }

    } catch (error) {
      console.error(`❌ Error searching page ${page}:`, error);
    }
  }
}

async function main() {
  if (!process.env.START_GG_API_KEY) {
    console.error('❌ START_GG_API_KEY environment variable not set');
    console.log('💡 Make sure your .env.local file contains: START_GG_API_KEY=your_api_key_here');
    return;
  }

  console.log('🎮 ONi Kanimani Player Search\n');
  console.log('=' .repeat(50));

  // Search for MK1 tournaments
  await searchMortalKombat1Tournaments();
  
  console.log('\n' + '=' .repeat(50));
  
  // Try searching in a specific tournament (you can modify these values)
  await searchSpecificTournamentForPlayer('evo-2024', 'tournament/evo-2024/event/mortal-kombat-1', 'ONi|Kanimani');
  
  console.log('\n' + '=' .repeat(50));
  
  // Also search in EVO 2025
  await searchSpecificTournamentForPlayer('evo-2025', 'tournament/evo-2025/event/mortal-kombat-1', 'ONi|Kanimani');
}

main().catch(console.error); 
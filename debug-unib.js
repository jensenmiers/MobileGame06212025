const fetch = require('node-fetch');

async function debugUNIB() {
  const START_GG_API_URL = 'https://api.start.gg/gql/alpha';
  const START_GG_API_KEY = process.env.START_GG_API_KEY;
  
  if (!START_GG_API_KEY) {
    console.error('START_GG_API_KEY not found in environment');
    return;
  }

  const tournamentSlug = 'full-combo-fights-at-buffalo-wild-wings-glendale-jun-21st';
  const unibGameId = 74072; // Current UNIB II ID
  
  const query = `
    query TournamentParticipants($slug: String!, $videogameId: [ID]!) {
      tournament(slug: $slug) {
        id
        name
        events(filter: {videogameId: $videogameId}) {
          id
          name
          videogame {
            id
            name
          }
          entrants(query: {perPage: 100}) {
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

  try {
    console.log(`🔍 Testing UNIB II (ID: ${unibGameId}) for tournament: ${tournamentSlug}`);
    
    const response = await fetch(START_GG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${START_GG_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          slug: tournamentSlug,
          videogameId: unibGameId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Start.gg API error: ${response.status}`);
    }

    const { data, errors } = await response.json();

    if (errors) {
      console.error('❌ GraphQL Errors:', errors);
      return;
    }

    console.log('✅ Tournament data:', JSON.stringify(data.tournament, null, 2));
    
    if (data.tournament.events && data.tournament.events.length > 0) {
      console.log(`🎮 Found ${data.tournament.events.length} UNIB II events:`);
      data.tournament.events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.name} (Game: ${event.videogame?.name || 'Unknown'})`);
        console.log(`     Entrants: ${event.entrants?.nodes?.length || 0}`);
        if (event.entrants?.nodes?.length > 0) {
          event.entrants.nodes.slice(0, 3).forEach(entrant => {
            console.log(`       - ${entrant.name} (Seed: ${entrant.seeds[0]?.seedNum || 'N/A'})`);
          });
          if (event.entrants.nodes.length > 3) {
            console.log(`       ... and ${event.entrants.nodes.length - 3} more`);
          }
        }
      });
    } else {
      console.log('❌ No UNIB II events found in this tournament');
      
      // Let's also check what events ARE available
      console.log('\n🔍 Checking all events in tournament...');
      const allEventsQuery = `
        query TournamentEvents($slug: String!) {
          tournament(slug: $slug) {
            id
            name
            events {
              id
              name
              videogame {
                id
                name
              }
            }
          }
        }
      `;
      
      const allEventsResponse = await fetch(START_GG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${START_GG_API_KEY}`,
        },
        body: JSON.stringify({
          query: allEventsQuery,
          variables: { slug: tournamentSlug },
        }),
      });
      
      const allEventsData = await allEventsResponse.json();
      if (allEventsData.data?.tournament?.events) {
        console.log('📋 Available events:');
        allEventsData.data.tournament.events.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.name} (Game: ${event.videogame?.name || 'Unknown'} - ID: ${event.videogame?.id || 'N/A'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugUNIB(); 
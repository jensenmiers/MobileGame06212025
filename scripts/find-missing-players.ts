/**
 * Script to find missing players "Chobi" and "Falcons|E.T." 
 * and get their start.gg entrant IDs
 */

const API_URL = 'https://api.start.gg/gql/alpha';

const ENTRANTS_QUERY = `
  query SearchTournamentEntrants($slug: String!, $gameId: [ID], $page: Int!) {
    tournament(slug: $slug) {
      id
      name
      events(filter: {videogameId: $gameId}) {
        id
        name
        slug
        entrants(query: {perPage: 100, page: $page}) {
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

async function searchEvoEntrants(gameId: number, gameName: string, searchTerms: string[]) {
  console.log(`🔍 Searching EVO 2025 entrants for ${gameName} (Game ID: ${gameId})...\n`);
  
  const foundPlayers: any[] = [];
  
  try {
    let page = 1;
    let hasMorePages = true;
    
    while (hasMorePages && page <= 15) { // Search more pages
      console.log(`📄 Searching page ${page}...`);
      
             const response = await fetch(API_URL, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${process.env.START_GG_API_KEY}`,
         },
                  body: JSON.stringify({
           query: ENTRANTS_QUERY,
           variables: { 
             slug: 'evo-2025',
             gameId: [gameId.toString()],
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
        break;
      }

      if (!data.tournament || !data.tournament.events || data.tournament.events.length === 0) {
        console.log(`No events found for game ID ${gameId}`);
        break;
      }

      const event = data.tournament.events[0];
      const entrants = event.entrants.nodes;
      
      if (entrants.length === 0) {
        hasMorePages = false;
        break;
      }
      
      // Search for our target players in this page
      searchTerms.forEach(searchTerm => {
        const matchingEntrants = entrants.filter((entrant: any) => {
          // Check entrant name
          if (entrant.name.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true;
          }
          
          // Check participant gamerTags
          return entrant.participants.some((p: any) => {
            if (!p.gamerTag) return false;
            
            const gamerTag = p.gamerTag.toLowerCase();
            const search = searchTerm.toLowerCase();
            
            // Direct match
            if (gamerTag.includes(search)) return true;
            
            // Special handling for variations
            if (search === 'chobi' && (gamerTag.includes('ちょび') || gamerTag === 'chobi')) return true;
            if (search === 'falcons|e.t.' && (gamerTag.includes('falcons') && gamerTag.includes('e.t'))) return true;
            if (search === 'e.t.' && gamerTag.includes('e.t.')) return true;
            
            return false;
          });
        });
        
        matchingEntrants.forEach((entrant: any) => {
          const existing = foundPlayers.find(p => p.entrantId === entrant.id);
          if (!existing) {
            console.log(`🎯 Found potential match for "${searchTerm}":`);
            console.log(`   Entrant ID: ${entrant.id}`);
            console.log(`   Entrant Name: ${entrant.name}`);
            entrant.participants.forEach((p: any) => {
              console.log(`     - Participant: ${p.prefix ? p.prefix + ' | ' : ''}${p.gamerTag} (ID: ${p.id})`);
            });
            console.log('');
            
            foundPlayers.push({
              searchTerm,
              entrantId: entrant.id,
              entrantName: entrant.name,
              participants: entrant.participants,
              game: gameName
            });
          }
        });
      });
      
      page++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error('❌ Error searching EVO entrants:', error);
  }
  
  return foundPlayers;
}

async function main() {
  console.log('🚀 Starting search for missing players...\n');
  
  const allFoundPlayers: any[] = [];
  
  // Search Under Night In-Birth II for Chobi
  console.log('=== SEARCHING UNDER NIGHT IN-BIRTH II ===');
  const unibPlayers = await searchEvoEntrants(
    49783, // Under Night In-Birth II [Sys:Celes] game ID
    'Under Night In-Birth II [Sys:Celes]',
    ['chobi', 'ちょび', 'Chobi']
  );
  allFoundPlayers.push(...unibPlayers);
  
  console.log('\n=== SEARCHING THE KING OF FIGHTERS XV ===');
  const kofPlayers = await searchEvoEntrants(
    33945, // THE KING OF FIGHTERS XV game ID
    'THE KING OF FIGHTERS XV',
    ['falcons|e.t.', 'e.t.', 'ET', 'falcons e.t.', 'falcons et']
  );
  allFoundPlayers.push(...kofPlayers);
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 SEARCH RESULTS SUMMARY');
  console.log('='.repeat(80));
  
  if (allFoundPlayers.length === 0) {
    console.log('❌ No players found matching the search criteria');
  } else {
    console.log(`✅ Found ${allFoundPlayers.length} potential matches:\n`);
    
    allFoundPlayers.forEach((player, index) => {
      console.log(`${index + 1}. Search Term: "${player.searchTerm}" in ${player.game}`);
      console.log(`   Entrant ID: ${player.entrantId}`);
      console.log(`   Entrant Name: ${player.entrantName}`);
      player.participants.forEach((p: any) => {
        console.log(`   Participant: ${p.prefix ? p.prefix + ' | ' : ''}${p.gamerTag} (ID: ${p.id})`);
      });
      console.log('');
    });
    
    console.log('💡 Use these entrant IDs to update the import data in:');
    console.log('   src/app/api/admin/tournaments/[tournamentId]/import-top8-seeds/route.ts');
  }
  
  console.log('='.repeat(80));
  console.log('✅ Search complete!');
}

if (require.main === module) {
  main().catch(console.error);
} 
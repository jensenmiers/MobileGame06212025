/**
 * Script to import all found top 8 players into the database
 * Based on the search results from start.gg API
 */

import { database } from '../src/lib/database';

// Top 8 players data with start.gg entrant IDs (from search results)
const TOP8_IMPORT_DATA = {
  'Mortal Kombat 1': [
    { name: 'SonicFox', startgg_entrant_id: 19215814, seed: 1 },
    { name: 'ONi | Kanimani', startgg_entrant_id: 20525683, seed: 2 },
    { name: 'RBT/T7G | Nicolas', startgg_entrant_id: 20367422, seed: 3 },
    { name: 'PAR | Rewind', startgg_entrant_id: 19490080, seed: 4 },
    { name: 'RBT/T7G | Scorpionprocs', startgg_entrant_id: 20367543, seed: 5 },
    { name: 'Grr', startgg_entrant_id: 19578805, seed: 6 },
    { name: 'STG | Onlinecale213', startgg_entrant_id: 20342926, seed: 7 },
    { name: '2Game | SnakeDoe', startgg_entrant_id: 20368055, seed: 8 }
  ],
  'Tekken 8': [
    { name: 'Yamasa | Nobi', startgg_entrant_id: 20546937, seed: 8 }
  ],
  'Street Fighter 6': [
    { name: 'WBG RB | MenaRD', startgg_entrant_id: 20642179, seed: 4 },
    { name: 'REJECT | Fuudo', startgg_entrant_id: 20555368, seed: 5 },
    { name: 'Chapmanly', startgg_entrant_id: 20546719, seed: 6 },
    { name: 'MOUZ | EndingWalker', startgg_entrant_id: 20529509, seed: 7 },
    { name: 'Aeroblazer', startgg_entrant_id: 20554304, seed: 8 }
  ],
  'Guilty Gear Strive': [
    { name: 'PAR | Daru_I-No', startgg_entrant_id: 20354852, seed: 1 },
    { name: 'tatuma', startgg_entrant_id: 20562927, seed: 3 },
    { name: 'Fly | NitroNY', startgg_entrant_id: 20668803, seed: 4 },
    { name: 'PAR | Jack', startgg_entrant_id: 20361279, seed: 5 },
    { name: 'Kshuewhatdamoo', startgg_entrant_id: 20568667, seed: 6 },
    { name: 'TSM | Leffen', startgg_entrant_id: 20361308, seed: 7 }
  ],
  'Under Night In Birth II': [
    { name: 'Senaru', startgg_entrant_id: 20089096, seed: 1 },
    { name: 'BBB | Defiant', startgg_entrant_id: 20267027, seed: 2 },
    { name: 'PAR | BigBlack', startgg_entrant_id: 20338465, seed: 3 },
    { name: 'BNP | knotts', startgg_entrant_id: 19493587, seed: 4 },
    { name: '2GB Combo', startgg_entrant_id: 20309760, seed: 5 },
    { name: 'BBB | OmniDeag', startgg_entrant_id: 20545121, seed: 7 },
    { name: 'Ugly_ | Shaly', startgg_entrant_id: 20470451, seed: 8 }
  ],
  'Fatal Fury: City of the Wolves': [
    { name: 'DFM/PWS | GO1', startgg_entrant_id: 20336929, seed: 2 },
    { name: 'Falcons | Kindevu', startgg_entrant_id: 20555311, seed: 5 },
    { name: 'T1 | ZJZ', startgg_entrant_id: 20370525, seed: 6 },
    { name: 'ONIC | NYChrisG', startgg_entrant_id: 20371869, seed: 7 },
    { name: 'AG | Reynald', startgg_entrant_id: 20552498, seed: 8 }
  ],
  'Samurai Shodown': [
    { name: 'WATANABE SHACHOU', startgg_entrant_id: 20323514, seed: 2 },
    { name: 'XBF | Maki', startgg_entrant_id: 20370528, seed: 4 },
    { name: 'bubba000', startgg_entrant_id: 19497904, seed: 5 },
    { name: 'royalpsycho', startgg_entrant_id: 20549021, seed: 6 },
    { name: 'BBoySonicX', startgg_entrant_id: 20177592, seed: 7 },
    { name: 'Healing Vision', startgg_entrant_id: 20350949, seed: 8 }
  ],
  'THE KING OF FIGHTERS XV': [
    { name: 'GHZ | TheGio', startgg_entrant_id: 20562800, seed: 1 },
    { name: 'LEV | Layec', startgg_entrant_id: 20369380, seed: 2 },
    { name: 'QAD | Wero Asamiya', startgg_entrant_id: 20582800, seed: 3 },
    { name: 'Liquid | ViolentKain', startgg_entrant_id: 19455413, seed: 4 },
    { name: 'Falcon | Tamago', startgg_entrant_id: 19498430, seed: 5 },
    { name: 'Comitê | PiterErn', startgg_entrant_id: 20553115, seed: 6 },
    { name: 'LEV | PAKO', startgg_entrant_id: 20229890, seed: 7 }
  ]
};

async function importTop8SeedsForTournament(tournamentName: string) {
  console.log(`🎮 Importing Top 8 Seeds for ${tournamentName}\n`);
  console.log('=' .repeat(50));

  try {
    // Get the tournament ID from database
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name')
      .eq('name', tournamentName)
      .single();

    if (tournamentError) {
      console.error(`❌ Error fetching tournament ${tournamentName}:`, tournamentError);
      return { tournamentName, added: 0, skipped: 0, errors: 1 };
    }

    if (!tournament) {
      console.error(`❌ Tournament "${tournamentName}" not found in database`);
      return { tournamentName, added: 0, skipped: 0, errors: 1 };
    }

    console.log(`🏆 Found tournament: ${tournament.name} (ID: ${tournament.id})\n`);

    const players = TOP8_IMPORT_DATA[tournamentName as keyof typeof TOP8_IMPORT_DATA];
    if (!players || players.length === 0) {
      console.log(`❌ No players data found for ${tournamentName}`);
      return { tournamentName, added: 0, skipped: 0, errors: 0 };
    }

    const tournamentId = tournament.id;
    const addedParticipants: any[] = [];
    const skippedParticipants: any[] = [];
    let errorCount = 0;

    // Add each player
    for (const player of players) {
      try {
        // Check if player already exists
        const { data: existingPlayer, error: checkError } = await database
          .from('participants')
          .select('id, name')
          .eq('tournament_id', tournamentId)
          .eq('startgg_entrant_id', player.startgg_entrant_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error(`❌ Error checking existing player ${player.name}:`, checkError);
          errorCount++;
          continue;
        }

        if (existingPlayer) {
          console.log(`⏭️  Skipping ${player.name} - already exists (ID: ${existingPlayer.id})`);
          skippedParticipants.push({
            ...player,
            id: existingPlayer.id
          });
          continue;
        }

        // Insert new participant
        const { data: newParticipant, error: insertError } = await database
          .from('participants')
          .insert({
            tournament_id: tournamentId,
            name: player.name,
            seed: player.seed,
            startgg_entrant_id: player.startgg_entrant_id
          })
          .select('id, name, seed, startgg_entrant_id')
          .single();

        if (insertError) {
          console.error(`❌ Error adding ${player.name}:`, insertError);
          errorCount++;
          continue;
        }

        console.log(`✅ Added ${player.name} (ID: ${newParticipant.id}, Seed: ${player.seed})`);
        addedParticipants.push(newParticipant);

      } catch (error) {
        console.error(`❌ Unexpected error adding ${player.name}:`, error);
        errorCount++;
      }
    }

    // Summary for this tournament
    console.log('\n📊 TOURNAMENT SUMMARY:');
    console.log(`✅ Added: ${addedParticipants.length} participants`);
    console.log(`⏭️  Skipped: ${skippedParticipants.length} participants (already exist)`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total: ${addedParticipants.length + skippedParticipants.length}/${players.length} players processed`);

    return { 
      tournamentName, 
      added: addedParticipants.length, 
      skipped: skippedParticipants.length, 
      errors: errorCount 
    };

  } catch (error) {
    console.error(`❌ Unexpected error processing ${tournamentName}:`, error);
    return { tournamentName, added: 0, skipped: 0, errors: 1 };
  }
}

async function importAllTop8Seeds() {
  console.log('🎮 Importing Top 8 Seeds for All Tournaments\n');
  console.log('=' .repeat(80));

  const results: any[] = [];
  let totalAdded = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const tournamentName of Object.keys(TOP8_IMPORT_DATA)) {
    console.log(`\n🎯 Processing ${tournamentName}...`);
    const result = await importTop8SeedsForTournament(tournamentName);
    results.push(result);
    
    totalAdded += result.added;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    
    // Add a small delay between tournaments
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 FINAL SUMMARY');
  console.log('=' .repeat(80));
  
  results.forEach(result => {
    console.log(`${result.tournamentName}: ${result.added} added, ${result.skipped} skipped, ${result.errors} errors`);
  });
  
  console.log('\n' + '=' .repeat(80));
  console.log(`🎯 GRAND TOTAL: ${totalAdded} added, ${totalSkipped} skipped, ${totalErrors} errors`);
  console.log('=' .repeat(80));

  return results;
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Database credentials not found');
    console.log('💡 Make sure your .env.local file contains:');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    console.log('   or');
    console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key');
    return;
  }

  await importAllTop8Seeds();
}

main().catch(console.error); 
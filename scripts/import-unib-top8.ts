/**
 * Script to import Under Night In Birth II top 8 players
 */

import { database } from '../src/lib/database';

const UNIB_PLAYERS = [
  { name: 'Senaru', startgg_entrant_id: 20089096, seed: 1 },
  { name: 'BBB | Defiant', startgg_entrant_id: 20267027, seed: 2 },
  { name: 'PAR | BigBlack', startgg_entrant_id: 20338465, seed: 3 },
  { name: 'BNP | knotts', startgg_entrant_id: 19493587, seed: 4 },
  { name: '2GB Combo', startgg_entrant_id: 20309760, seed: 5 },
  { name: 'BBB | OmniDeag', startgg_entrant_id: 20545121, seed: 7 },
  { name: 'Ugly_ | Shaly', startgg_entrant_id: 20470451, seed: 8 }
];

async function importUNIBTop8() {
  console.log('🎮 Importing Under Night In Birth II Top 8 Players\n');
  console.log('=' .repeat(50));

  try {
    // Get the tournament ID from database
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name')
      .eq('name', 'Under Night In Birth II')
      .single();

    if (tournamentError) {
      console.error(`❌ Error fetching tournament:`, tournamentError);
      return;
    }

    if (!tournament) {
      console.error(`❌ Tournament "Under Night In Birth II" not found in database`);
      return;
    }

    console.log(`🏆 Found tournament: ${tournament.name} (ID: ${tournament.id})\n`);

    const tournamentId = tournament.id;
    const addedParticipants: any[] = [];
    const skippedParticipants: any[] = [];
    let errorCount = 0;

    // Add each player
    for (const player of UNIB_PLAYERS) {
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

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Added: ${addedParticipants.length} participants`);
    console.log(`⏭️  Skipped: ${skippedParticipants.length} participants (already exist)`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📋 Total: ${addedParticipants.length + skippedParticipants.length}/${UNIB_PLAYERS.length} players processed`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
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

  await importUNIBTop8();
}

main().catch(console.error); 
/**
 * Script to add top 8 MK1 players to the participants table
 * Based on the EVO 2025 tournament results
 */

import { database } from '../src/lib/database';

const TOP8_PLAYERS = [
  {
    name: 'SonicFox',
    startgg_entrant_id: 19215814,
    seed: 1
  },
  {
    name: 'ONi | Kanimani',
    startgg_entrant_id: 20525683,
    seed: 2
  },
  {
    name: 'RBT/T7G | Nicolas',
    startgg_entrant_id: 20367422,
    seed: 3
  },
  {
    name: 'PAR | Rewind',
    startgg_entrant_id: 19490080,
    seed: 4
  },
  {
    name: 'RBT/T7G | Scorpionprocs',
    startgg_entrant_id: 20367543,
    seed: 5
  },
  {
    name: 'Grr',
    startgg_entrant_id: 19578805,
    seed: 6
  },
  {
    name: 'STG | Onlinecale213',
    startgg_entrant_id: 20342926,
    seed: 7
  },
  {
    name: '2Game | SnakeDoe',
    startgg_entrant_id: 20368055,
    seed: 8
  }
];

async function addTop8Participants() {
  console.log('🎮 Adding Top 8 MK1 Players to Participants Table\n');
  console.log('=' .repeat(50));

  try {
    // First, get the MK1 tournament ID
    const { data: tournaments, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name')
      .eq('game_title', 'Mortal Kombat 1')
      .single();

    if (tournamentError) {
      console.error('❌ Error fetching tournament:', tournamentError);
      return;
    }

    if (!tournaments) {
      console.error('❌ Mortal Kombat 1 tournament not found in database');
      return;
    }

    console.log(`🏆 Found tournament: ${tournaments.name} (ID: ${tournaments.id})\n`);

    const tournamentId = tournaments.id;
    const addedParticipants: any[] = [];
    const skippedParticipants: any[] = [];

    // Add each player
    for (const player of TOP8_PLAYERS) {
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
          continue;
        }

        console.log(`✅ Added ${player.name} (ID: ${newParticipant.id}, Seed: ${player.seed})`);
        addedParticipants.push(newParticipant);

      } catch (error) {
        console.error(`❌ Unexpected error adding ${player.name}:`, error);
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(50));
    console.log('📊 SUMMARY');
    console.log('=' .repeat(50));
    console.log(`✅ Added: ${addedParticipants.length} participants`);
    console.log(`⏭️  Skipped: ${skippedParticipants.length} participants (already exist)`);
    console.log(`📋 Total: ${addedParticipants.length + skippedParticipants.length}/8 players processed`);

    if (addedParticipants.length > 0) {
      console.log('\n🎯 NEWLY ADDED PARTICIPANTS:');
      addedParticipants.forEach((participant, index) => {
        console.log(`${index + 1}. ${participant.name} (Seed: ${participant.seed})`);
      });
    }

    if (skippedParticipants.length > 0) {
      console.log('\n⏭️  EXISTING PARTICIPANTS:');
      skippedParticipants.forEach((participant, index) => {
        console.log(`${index + 1}. ${participant.name} (Seed: ${participant.seed})`);
      });
    }

    // Verify total count
    const { data: totalParticipants, error: countError } = await database
      .from('participants')
      .select('id', { count: 'exact' })
      .eq('tournament_id', tournamentId);

    if (!countError) {
      console.log(`\n📈 Total participants in ${tournaments.name}: ${totalParticipants?.length || 0}`);
    }

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

  await addTop8Participants();
}

main().catch(console.error); 
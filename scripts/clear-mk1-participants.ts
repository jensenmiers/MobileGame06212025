/**
 * Script to clear all Mortal Kombat 1 participants from the database
 */

import { database } from '../src/lib/database';

async function clearMK1Participants() {
  console.log('🗑️  Clearing all Mortal Kombat 1 participants\n');
  console.log('=' .repeat(50));

  try {
    // First, get the MK1 tournament ID
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name')
      .eq('name', 'Mortal Kombat 1')
      .single();

    if (tournamentError) {
      console.error('❌ Error fetching tournament:', tournamentError);
      return;
    }

    if (!tournament) {
      console.error('❌ Mortal Kombat 1 tournament not found in database');
      return;
    }

    console.log(`🏆 Found tournament: ${tournament.name} (ID: ${tournament.id})\n`);

    // Get current participant count
    const { data: currentParticipants, error: countError } = await database
      .from('participants')
      .select('id, name')
      .eq('tournament_id', tournament.id);

    if (countError) {
      console.error('❌ Error counting participants:', countError);
      return;
    }

    console.log(`📊 Current participants: ${currentParticipants?.length || 0}`);

    if (!currentParticipants || currentParticipants.length === 0) {
      console.log('✅ No participants to clear');
      return;
    }

    // Show participants that will be deleted
    console.log('\n🗑️  PARTICIPANTS TO BE DELETED:');
    currentParticipants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name} (ID: ${participant.id})`);
    });

    // Delete all participants for this tournament
    const { error: deleteError } = await database
      .from('participants')
      .delete()
      .eq('tournament_id', tournament.id);

    if (deleteError) {
      console.error('❌ Error deleting participants:', deleteError);
      return;
    }

    console.log(`\n✅ Successfully deleted ${currentParticipants.length} participants`);

    // Verify deletion
    const { data: remainingParticipants, error: verifyError } = await database
      .from('participants')
      .select('id')
      .eq('tournament_id', tournament.id);

    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError);
      return;
    }

    console.log(`📊 Remaining participants: ${remainingParticipants?.length || 0}`);

    if (remainingParticipants && remainingParticipants.length === 0) {
      console.log('✅ All participants successfully cleared!');
    } else {
      console.log('⚠️  Some participants may still remain');
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

  await clearMK1Participants();
}

main().catch(console.error); 
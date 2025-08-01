/**
 * Script to clear all Mortal Kombat 1 participants and their related predictions
 */

import { database } from '../src/lib/database';

async function clearMK1ParticipantsAndPredictions() {
  console.log('🗑️  Clearing all Mortal Kombat 1 participants and predictions\n');
  console.log('=' .repeat(60));

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

    // Get predictions count
    const { data: predictions, error: predictionsError } = await database
      .from('predictions')
      .select('id, user_id')
      .eq('tournament_id', tournament.id);

    if (predictionsError) {
      console.error('❌ Error counting predictions:', predictionsError);
      return;
    }

    console.log(`📊 Current predictions: ${predictions?.length || 0}`);

    // Show participants that will be deleted
    console.log('\n🗑️  PARTICIPANTS TO BE DELETED:');
    currentParticipants.forEach((participant, index) => {
      console.log(`${index + 1}. ${participant.name} (ID: ${participant.id})`);
    });

    if (predictions && predictions.length > 0) {
      console.log('\n🗑️  PREDICTIONS TO BE DELETED:');
      console.log(`📊 ${predictions.length} predictions will be deleted`);
    }

    // Step 1: Delete all predictions for this tournament first
    if (predictions && predictions.length > 0) {
      console.log('\n🔄 Step 1: Deleting predictions...');
      const { error: deletePredictionsError } = await database
        .from('predictions')
        .delete()
        .eq('tournament_id', tournament.id);

      if (deletePredictionsError) {
        console.error('❌ Error deleting predictions:', deletePredictionsError);
        return;
      }

      console.log(`✅ Successfully deleted ${predictions.length} predictions`);
    }

    // Step 2: Delete all participants for this tournament
    console.log('\n🔄 Step 2: Deleting participants...');
    const { error: deleteError } = await database
      .from('participants')
      .delete()
      .eq('tournament_id', tournament.id);

    if (deleteError) {
      console.error('❌ Error deleting participants:', deleteError);
      return;
    }

    console.log(`✅ Successfully deleted ${currentParticipants.length} participants`);

    // Verify deletion
    const { data: remainingParticipants, error: verifyError } = await database
      .from('participants')
      .select('id')
      .eq('tournament_id', tournament.id);

    if (verifyError) {
      console.error('❌ Error verifying participant deletion:', verifyError);
      return;
    }

    const { data: remainingPredictions, error: verifyPredictionsError } = await database
      .from('predictions')
      .select('id')
      .eq('tournament_id', tournament.id);

    if (verifyPredictionsError) {
      console.error('❌ Error verifying prediction deletion:', verifyPredictionsError);
      return;
    }

    console.log(`\n📊 FINAL VERIFICATION:`);
    console.log(`📊 Remaining participants: ${remainingParticipants?.length || 0}`);
    console.log(`📊 Remaining predictions: ${remainingPredictions?.length || 0}`);

    if ((!remainingParticipants || remainingParticipants.length === 0) && 
        (!remainingPredictions || remainingPredictions.length === 0)) {
      console.log('✅ All participants and predictions successfully cleared!');
    } else {
      console.log('⚠️  Some data may still remain');
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

  await clearMK1ParticipantsAndPredictions();
}

main().catch(console.error); 
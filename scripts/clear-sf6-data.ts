import { database } from '../src/lib/database';

async function clearSF6Data() {
  const tournamentId = '030054c3-59e5-4b1c-88ed-c2ca7501aa4d'; // Street Fighter 6 tournament ID
  
  console.log('🧹 Clearing Street Fighter 6 data...');
  
  try {
    // First, delete all predictions for this tournament
    console.log('📝 Deleting predictions...');
    const { error: predictionsError } = await database
      .from('predictions')
      .delete()
      .eq('tournament_id', tournamentId);
    
    if (predictionsError) {
      console.error('❌ Error deleting predictions:', predictionsError);
    } else {
      console.log('✅ Predictions deleted successfully');
    }
    
    // Then, delete all participants for this tournament
    console.log('👥 Deleting participants...');
    const { error: participantsError } = await database
      .from('participants')
      .delete()
      .eq('tournament_id', tournamentId);
    
    if (participantsError) {
      console.error('❌ Error deleting participants:', participantsError);
    } else {
      console.log('✅ Participants deleted successfully');
    }
    
    console.log('🎉 Street Fighter 6 data cleared successfully!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

clearSF6Data().catch(console.error); 
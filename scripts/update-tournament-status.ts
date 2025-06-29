import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing required environment variables.');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateTournamentStatus() {
  try {
    console.log('Searching for Street Fighter 6 tournament...');
    
    // First, find the Street Fighter 6 tournament
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('*')
      .or('name.ilike.%Street Fighter%,game_title.ilike.%Street Fighter%');
    
    if (fetchError) {
      throw new Error(`Error fetching tournaments: ${fetchError.message}`);
    }
    
    if (!tournaments || tournaments.length === 0) {
      console.log('No Street Fighter tournament found.');
      return;
    }
    
    const sfTournament = tournaments[0];
    console.log(`Found tournament: ${sfTournament.name} (ID: ${sfTournament.id})`);
    console.log(`Current status: ${sfTournament.status}`);
    
    // Update the status to 'active'
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', sfTournament.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Error updating tournament: ${updateError.message}`);
    }
    
    console.log('\n✅ Success! Tournament status updated:');
    console.log(`Name: ${updatedTournament.name}`);
    console.log(`New Status: ${updatedTournament.status}`);
    console.log('\nYou can now make predictions for this tournament.');
    
  } catch (error) {
    console.error('\n❌ Error:');
    console.error(error instanceof Error ? error.message : 'An unknown error occurred');
    process.exit(1);
  }
}

updateTournamentStatus();

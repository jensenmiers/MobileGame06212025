import { createClient } from '@supabase/supabase-js'

// Backend database client - can use service role key for full access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const database = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types for our database operations
export interface DbTournament {
  id: string
  name: string
  game_title: string
  description: string
  start_time: string
  cutoff_time: string
  end_time: string
  max_participants: number
  created_at: string
  updated_at: string
}

export interface DbParticipant {
  id: string
  tournament_id: string
  name: string
  seed?: number
  avatar_url?: string
  bio?: string
  created_at: string
}

export interface DbPrediction {
  id: string
  user_id: string
  tournament_id: string
  slot_1_participant_id: string
  slot_2_participant_id: string
  slot_3_participant_id: string
  slot_4_participant_id: string
  bracket_reset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null
  first_submitted_at: string
  last_updated_at: string
  submission_count: number
  score: number
  created_at: string
}

export interface DbResult {
  id: string
  tournament_id: string
  position_1_participant_id: string
  position_2_participant_id: string
  position_3_participant_id: string
  position_4_participant_id: string
  entered_by?: string
  entered_at: string
}

export interface DbProfile {
  id: string
  display_name: string
  email?: string
  created_at: string
  updated_at: string
}

interface TestConnectionResult {
  connected: boolean;
  error?: any;
  data?: any;
}

export async function testConnection(): Promise<TestConnectionResult> {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await database
      .from('tournaments')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      return { connected: false, error };
    }
    
    console.log('Supabase connected successfully');
    return { connected: true, data };
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return { 
      connected: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
} 
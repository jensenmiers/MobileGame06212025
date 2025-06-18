import { supabase } from './supabase';
import { Player, Tournament } from '@/types/tournament';

/**
 * Fetches all participants for a specific tournament from Supabase
 * @param tournamentId The ID of the tournament to fetch participants for
 * @returns Promise<Player[]> Array of players in the tournament
 */
export async function getTournamentParticipants(tournamentId: string): Promise<Player[]> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true });

    if (error) {
      console.error('Error fetching tournament participants:', error);
      throw error;
    }

    // Map the database fields to our Player interface
    return data.map(participant => ({
      id: participant.id,
      name: participant.name,
      seed: participant.seed,
      avatarUrl: participant.avatar_url || undefined,
    }));
  } catch (error) {
    console.error('Error in getTournamentParticipants:', error);
    return [];
  }
}

/**
 * Fetches a single participant by ID
 * @param participantId The ID of the participant to fetch
 * @returns Promise<Player | null> The participant or null if not found
 */
export async function getParticipantById(participantId: string): Promise<Player | null> {
  try {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error) {
      console.error('Error fetching participant:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      seed: data.seed,
      avatarUrl: data.avatar_url || undefined,
    };
  } catch (error) {
    console.error('Error in getParticipantById:', error);
    return null;
  }
}

/**
 * Fetches all tournaments from Supabase
 * @returns Promise<Tournament[]> Array of tournaments
 */
export async function getTournaments(): Promise<Tournament[]> {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTournaments:', error);
    return [];
  }
}

export const tournamentService = {
  getTournaments,
  getTournamentParticipants,
  getParticipantById,
};

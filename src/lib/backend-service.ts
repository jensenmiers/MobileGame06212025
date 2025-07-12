import { Tournament, Participant, Prediction, TournamentResult, LeaderboardEntry } from '../types/tournament'

// Backend service that uses Next.js API routes instead of direct Supabase calls
class BackendService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Tournament operations
  async getTournaments(): Promise<Tournament[]> {
    const { tournaments } = await this.request<{ tournaments: Tournament[] }>('/api/tournaments')
    return tournaments
  }

  async getTournament(tournamentId: string): Promise<Tournament> {
    const { tournament } = await this.request<{ tournament: Tournament }>(`/api/tournaments/${tournamentId}`)
    return tournament
  }

  async createTournament(tournamentData: Partial<Tournament>): Promise<Tournament> {
    const { tournament } = await this.request<{ tournament: Tournament }>('/api/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    })
    return tournament
  }

  async updateTournament(tournamentId: string, tournamentData: Partial<Tournament>): Promise<Tournament> {
    const { tournament } = await this.request<{ tournament: Tournament }>(`/api/tournaments/${tournamentId}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    })
    return tournament
  }

  // Participant operations
  async getTournamentParticipants(tournamentId: string): Promise<Participant[]> {
    const { participants } = await this.request<{ participants: Participant[] }>(`/api/tournaments/${tournamentId}/participants`)
    return participants
  }

  async createParticipant(tournamentId: string, participantData: Partial<Participant>): Promise<Participant> {
    const { participant } = await this.request<{ participant: Participant }>(`/api/tournaments/${tournamentId}/participants`, {
      method: 'POST',
      body: JSON.stringify(participantData),
    })
    return participant
  }

  // Prediction operations
  async getPredictions(tournamentId: string, userId?: string): Promise<Prediction[]> {
    const url = userId 
      ? `/api/tournaments/${tournamentId}/predictions?userId=${userId}`
      : `/api/tournaments/${tournamentId}/predictions`
    const { predictions } = await this.request<{ predictions: Prediction[] }>(url)
    return predictions
  }

  async submitPrediction(tournamentId: string, predictionData: {
    user_id: string
    slot_1_participant_id: string
    slot_2_participant_id: string
    slot_3_participant_id: string
    slot_4_participant_id: string
    bracket_reset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null;
    grand_finals_score?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
  }): Promise<Prediction> {
    const { prediction } = await this.request<{ prediction: Prediction }>(`/api/tournaments/${tournamentId}/predictions`, {
      method: 'POST',
      body: JSON.stringify(predictionData),
    })
    return prediction
  }

  async getUserPrediction(tournamentId: string, userId: string): Promise<Prediction | null> {
    try {
      const { predictions } = await this.request<{ predictions: Prediction[] }>(`/api/tournaments/${tournamentId}/predictions?userId=${userId}`)
      // Return the most recent prediction (API returns them ordered by created_at desc)
      return predictions.length > 0 ? predictions[0] : null
    } catch (error) {
      console.error('Error fetching user prediction from backend API:', error)
      return null
    }
  }

  // Results operations
  async getResults(tournamentId: string): Promise<TournamentResult | null> {
    const { results } = await this.request<{ results: TournamentResult | null }>(`/api/tournaments/${tournamentId}/results`)
    return results
  }

  async submitResults(tournamentId: string, resultData: {
    position_1_participant_id: string
    position_2_participant_id: string
    position_3_participant_id: string
    position_4_participant_id: string
    bracket_reset?: 'upper_no_reset' | 'upper_with_reset' | 'lower_bracket' | null;
    grand_finals_score?: 'score_3_0' | 'score_3_1' | 'score_3_2' | null;
    entered_by?: string
  }): Promise<TournamentResult> {
    const { results } = await this.request<{ results: TournamentResult }>(`/api/tournaments/${tournamentId}/results`, {
      method: 'POST',
      body: JSON.stringify(resultData),
    })
    return results
  }

  // Leaderboard operations
  async getLeaderboard(tournamentId: string): Promise<LeaderboardEntry[]> {
    const { leaderboard } = await this.request<{ leaderboard: LeaderboardEntry[] }>(`/api/tournaments/${tournamentId}/leaderboard`)
    return leaderboard
  }
}

// Create singleton instance
export const backendService = new BackendService()

// Export individual functions for backward compatibility
export const {
  getTournaments,
  getTournament,
  getTournamentParticipants,
  getPredictions,
  submitPrediction,
  getResults,
  submitResults,
  getLeaderboard,
} = backendService 
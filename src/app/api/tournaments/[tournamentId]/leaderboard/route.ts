import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

interface LeaderboardEntry {
  rank: number
  username: string
  points: number
  userId: string
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    // Fetch all predictions for this tournament with user profiles
    const { data: predictions, error } = await database
      .from('predictions')
      .select(`
        id,
        user_id,
        score,
        created_at,
        profiles!inner(
          id,
          display_name
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching predictions for leaderboard:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      )
    }

    if (!predictions || predictions.length === 0) {
      return NextResponse.json({ leaderboard: [] })
    }

    // Get only the latest prediction per user (by timestamp)
    const latestPredictionsByUser = new Map<string, any>()
    
    for (const prediction of predictions) {
      const userId = prediction.user_id
      if (!latestPredictionsByUser.has(userId)) {
        latestPredictionsByUser.set(userId, prediction)
      }
    }

    // Build leaderboard from latest predictions with valid scores
    const leaderboard: LeaderboardEntry[] = []
    
    Array.from(latestPredictionsByUser.entries()).forEach(([userId, prediction]) => {
      // Only include predictions with calculated scores (not -1)
      if (prediction.score !== undefined && prediction.score !== -1) {
        const username = prediction.profiles?.display_name || 'Anonymous'
        leaderboard.push({
          rank: 0, // Will be set after sorting
          username,
          points: prediction.score,
          userId,
        })
      }
    })

    // Sort by score (highest first) and assign ranks
    leaderboard.sort((a, b) => b.points - a.points)
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]/leaderboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

interface CommunityFavorite {
  participant_id: string
  participant_name: string
  total_points: number
  pick_count: number
  pick_percentage: number
  seed?: number
  avatar_url?: string
}

// Points awarded for each slot position [1st, 2nd, 3rd, 4th]
const SLOT_POINTS = [8, 5, 3, 2] as const

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    console.log(`🎯 Calculating community favorites for tournament: ${tournamentId}`)

    // Fetch all predictions for this tournament
    const { data: predictions, error: predError } = await database
      .from('predictions')
      .select(`
        id,
        slot_1_participant_id,
        slot_2_participant_id,
        slot_3_participant_id,
        slot_4_participant_id
      `)
      .eq('tournament_id', tournamentId)

    if (predError) {
      console.error('Error fetching predictions for favorites:', predError)
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      )
    }

    if (!predictions || predictions.length === 0) {
      console.log('📭 No predictions found for tournament')
      return NextResponse.json({ favorites: [] })
    }

    // Calculate points for each participant
    const participantPoints = new Map<string, { points: number, pickCount: number }>()

    predictions.forEach((prediction) => {
      const slots = [
        prediction.slot_1_participant_id,
        prediction.slot_2_participant_id,
        prediction.slot_3_participant_id,
        prediction.slot_4_participant_id
      ]

      slots.forEach((participantId, slotIndex) => {
        if (participantId) {
          const points = SLOT_POINTS[slotIndex]
          const current = participantPoints.get(participantId) || { points: 0, pickCount: 0 }
          participantPoints.set(participantId, {
            points: current.points + points,
            pickCount: current.pickCount + 1
          })
        }
      })
    })

    // Get participant details for all participants that received points
    const participantIds = Array.from(participantPoints.keys())
    
    if (participantIds.length === 0) {
      return NextResponse.json({ favorites: [] })
    }

    const { data: participants, error: partError } = await database
      .from('participants')
      .select('id, name, seed, avatar_url')
      .in('id', participantIds)

    if (partError) {
      console.error('Error fetching participants for favorites:', partError)
      return NextResponse.json(
        { error: 'Failed to fetch participant details' },
        { status: 500 }
      )
    }

    // Build favorites list with participant details
    const favorites: CommunityFavorite[] = []
    const totalPredictions = predictions.length

    participants?.forEach((participant) => {
      const stats = participantPoints.get(participant.id)
      if (stats) {
        favorites.push({
          participant_id: participant.id,
          participant_name: participant.name,
          total_points: stats.points,
          pick_count: stats.pickCount,
          pick_percentage: Math.round((stats.pickCount / totalPredictions) * 100),
          seed: participant.seed,
          avatar_url: participant.avatar_url
        })
      }
    })

    // Sort by total points (highest first) and return top 4
    favorites.sort((a, b) => b.total_points - a.total_points)
    const topFavorites = favorites.slice(0, 4)

    console.log(`✅ Community favorites calculated: ${topFavorites.length} favorites from ${predictions.length} predictions`)

    return NextResponse.json({ 
      favorites: topFavorites,
      total_predictions: totalPredictions 
    })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]/favorites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
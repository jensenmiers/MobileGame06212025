import { NextRequest, NextResponse } from 'next/server'
import { database, DbTournament } from '@/lib/database'

// Helper function to dynamically calculate tournament status
async function calculateTournamentStatus(tournamentId?: string, cutoffTime?: string): Promise<'upcoming' | 'active' | 'completed'> {
  // Check if tournament has results (only if we have a tournament ID)
  if (tournamentId) {
    const { data: results, error: resultsError } = await database
      .from('results')
      .select('id')
      .eq('tournament_id', tournamentId)
      .limit(1)

    if (!resultsError && results && results.length > 0) {
      return 'completed'
    }
  }

  // Calculate based on cutoff time
  if (cutoffTime) {
    const now = new Date()
    const cutoff = new Date(cutoffTime)
    
    if (cutoff > now) {
      return 'upcoming'  // Predictions still open
    } else {
      return 'active'    // Predictions closed, waiting for results
    }
  }

  // Default fallback
  return 'upcoming'
}

export async function GET(request: NextRequest) {
  try {
    const { data: tournaments, error } = await database
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tournaments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tournaments: tournaments || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'start_time', 'cutoff_time']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Calculate status dynamically based on cutoff_time
    const calculatedStatus = await calculateTournamentStatus(undefined, body.cutoff_time)

    const tournamentData: Partial<DbTournament> = {
      name: body.name,
      game_title: body.game_title,
      description: body.description,
      start_time: body.start_time,
      cutoff_time: body.cutoff_time,
      end_time: body.end_time,
      status: calculatedStatus,  // Use calculated status instead of body.status
      max_participants: body.max_participants || 16,
    }

    const { data: tournament, error } = await database
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single()

    if (error) {
      console.error('Error creating tournament:', error)
      return NextResponse.json(
        { error: 'Failed to create tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/tournaments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

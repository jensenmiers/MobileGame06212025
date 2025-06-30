import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

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

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    const { data: tournament, error } = await database
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (error) {
      console.error('Error fetching tournament:', error)
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params
    const body = await request.json()

    // Calculate status dynamically if cutoff_time is being updated
    let updateData = { ...body }
    if (body.cutoff_time) {
      const calculatedStatus = await calculateTournamentStatus(tournamentId, body.cutoff_time)
      updateData.status = calculatedStatus
    } else {
      // If cutoff_time isn't being updated, get current cutoff_time to calculate status
      const { data: currentTournament } = await database
        .from('tournaments')
        .select('cutoff_time')
        .eq('id', tournamentId)
        .single()
      
      if (currentTournament?.cutoff_time) {
        const calculatedStatus = await calculateTournamentStatus(tournamentId, currentTournament.cutoff_time)
        updateData.status = calculatedStatus
      }
    }

    const { data: tournament, error } = await database
      .from('tournaments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tournamentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tournament:', error)
      return NextResponse.json(
        { error: 'Failed to update tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Unexpected error in PUT /api/tournaments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    const { error } = await database
      .from('tournaments')
      .delete()
      .eq('id', tournamentId)

    if (error) {
      console.error('Error deleting tournament:', error)
      return NextResponse.json(
        { error: 'Failed to delete tournament' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/tournaments/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
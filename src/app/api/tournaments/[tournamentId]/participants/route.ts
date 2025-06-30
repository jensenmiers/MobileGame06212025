import { NextRequest, NextResponse } from 'next/server'
import { database, DbParticipant } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    const { data: participants, error } = await database
      .from('participants')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('seed', { ascending: true })

    if (error) {
      console.error('Error fetching participants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch participants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ participants: participants || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]/participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    const participantData: Partial<DbParticipant> = {
      tournament_id: tournamentId,
      name: body.name,
      seed: body.seed,
      avatar_url: body.avatar_url,
      bio: body.bio,
    }

    const { data: participant, error } = await database
      .from('participants')
      .insert(participantData)
      .select()
      .single()

    if (error) {
      console.error('Error creating participant:', error)
      return NextResponse.json(
        { error: 'Failed to create participant' },
        { status: 500 }
      )
    }

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST /api/tournaments/[id]/participants:', error)
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
      .from('participants')
      .delete()
      .eq('tournament_id', tournamentId)

    if (error) {
      console.error('Error deleting participants:', error)
      return NextResponse.json(
        { error: 'Failed to delete participants' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/tournaments/[id]/participants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
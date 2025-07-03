import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    const { data: tournament, error } = await database
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (error || !tournament) {
      console.error('Tournament not found:', tournamentId)
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params
    const body = await request.json()

    const { data: tournament, error } = await database
      .from('tournaments')
      .update({
        ...body,
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
    console.error('Unexpected error in PATCH /api/tournaments/[id]:', error)
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

    const { data: tournament, error } = await database
      .from('tournaments')
      .update({
        ...body,
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
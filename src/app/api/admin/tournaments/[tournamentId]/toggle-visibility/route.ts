import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { tournamentId: string } }
) {
  try {
    const { tournamentId } = params
    const body = await request.json()
    const { active } = body

    // Validate the active field
    if (typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Active field must be a boolean' },
        { status: 400 }
      )
    }

    // Update the tournament's active status
    const { data: tournament, error } = await database
      .from('tournaments')
      .update({ active, updated_at: new Date().toISOString() })
      .eq('id', tournamentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tournament visibility:', error)
      return NextResponse.json(
        { error: 'Failed to update tournament visibility' },
        { status: 500 }
      )
    }

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      tournament,
      message: `Tournament "${tournament.name}" is now ${active ? 'visible' : 'hidden'} to regular users`
    })
  } catch (error) {
    console.error('Unexpected error in PATCH /api/admin/tournaments/[tournamentId]/toggle-visibility:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
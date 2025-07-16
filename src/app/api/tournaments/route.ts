import { NextRequest, NextResponse } from 'next/server'
import { database, DbTournament } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const onlyActive = searchParams.get('onlyActive') !== 'false' // Default to true unless explicitly set to false

    let query = database
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })

    // Filter by active status if onlyActive is true
    if (onlyActive) {
      query = query.eq('active', true)
    }

    const { data: tournaments, error } = await query

    if (error) {
      console.error('Error fetching tournaments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tournaments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tournaments })
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

    const tournamentData: Partial<DbTournament> = {
      name: body.name,
      game_title: body.game_title,
      description: body.description,
      start_time: body.start_time,
      cutoff_time: body.cutoff_time,
      end_time: body.end_time,
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

import { NextRequest, NextResponse } from 'next/server'
import { database, DbPrediction } from '@/lib/database'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    let query = database
      .from('predictions')
      .select(`
        *,
        profiles!inner(
          id,
          display_name
        )
      `)
      .eq('tournament_id', tournamentId)

    // If userId is provided, filter for that user's predictions
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: predictions, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching predictions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ predictions: predictions || [] })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]/predictions:', error)
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
    const requiredFields = [
      'user_id',
      'slot_1_participant_id',
      'slot_2_participant_id', 
      'slot_3_participant_id',
      'slot_4_participant_id'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Check if prediction already exists for this user and tournament
    const { data: existingPrediction, error: selectError } = await database
      .from('predictions')
      .select('id, submission_count')
      .eq('user_id', body.user_id)
      .eq('tournament_id', tournamentId)
      .single()

    const now = new Date().toISOString()

    if (existingPrediction) {
      // Update existing prediction
      const { data: prediction, error } = await database
        .from('predictions')
        .update({
          slot_1_participant_id: body.slot_1_participant_id,
          slot_2_participant_id: body.slot_2_participant_id,
          slot_3_participant_id: body.slot_3_participant_id,
          slot_4_participant_id: body.slot_4_participant_id,
          bracket_reset: body.bracket_reset || null,
          last_updated_at: now,
          submission_count: (existingPrediction.submission_count || 0) + 1,
          // Note: We'll calculate score in the backend logic, not with triggers
          score: -1, // Temporarily set to -1, will be calculated later
        })
        .eq('id', existingPrediction.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating prediction:', error)
        return NextResponse.json(
          { error: 'Failed to update prediction' },
          { status: 500 }
        )
      }

      return NextResponse.json({ prediction })
    } else {
      // Create new prediction
      const predictionData: Partial<DbPrediction> = {
        user_id: body.user_id,
        tournament_id: tournamentId,
        slot_1_participant_id: body.slot_1_participant_id,
        slot_2_participant_id: body.slot_2_participant_id,
        slot_3_participant_id: body.slot_3_participant_id,
        slot_4_participant_id: body.slot_4_participant_id,
        bracket_reset: body.bracket_reset || null,
        first_submitted_at: now,
        last_updated_at: now,
        submission_count: 1,
        score: -1, // Will be calculated later
      }

      const { data: prediction, error } = await database
        .from('predictions')
        .insert(predictionData)
        .select()
        .single()

      if (error) {
        console.error('Error creating prediction:', error)
        return NextResponse.json(
          { error: 'Failed to create prediction' },
          { status: 500 }
        )
      }

      return NextResponse.json({ prediction }, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/tournaments/[id]/predictions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
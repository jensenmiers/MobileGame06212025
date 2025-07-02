import { NextRequest, NextResponse } from 'next/server'
import { database, DbResult } from '@/lib/database'
import { updateAllPredictionScores } from '@/lib/scoring-service'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    const { data: results, error } = await database
      .from('results')
      .select(`
        *,
        participant_1:participants!position_1_participant_id(id, name),
        participant_2:participants!position_2_participant_id(id, name),
        participant_3:participants!position_3_participant_id(id, name),
        participant_4:participants!position_4_participant_id(id, name)
      `)
      .eq('tournament_id', tournamentId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching results:', error)
      return NextResponse.json(
        { error: 'Failed to fetch results' },
        { status: 500 }
      )
    }

    return NextResponse.json({ results: results || null })
  } catch (error) {
    console.error('Unexpected error in GET /api/tournaments/[id]/results:', error)
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
      'position_1_participant_id',
      'position_2_participant_id',
      'position_3_participant_id',
      'position_4_participant_id'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate tournament exists
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentId)
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if results already exist for this tournament
    const { data: existingResults, error: selectError } = await database
      .from('results')
      .select('id')
      .eq('tournament_id', tournamentId)
      .single()

    const resultData: Partial<DbResult> = {
      tournament_id: tournamentId,
      position_1_participant_id: body.position_1_participant_id,
      position_2_participant_id: body.position_2_participant_id,
      position_3_participant_id: body.position_3_participant_id,
      position_4_participant_id: body.position_4_participant_id,
      entered_by: body.entered_by,
      entered_at: new Date().toISOString(),
    }

    if (existingResults) {
      // Update existing results
      const { data: results, error } = await database
        .from('results')
        .update(resultData)
        .eq('id', existingResults.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating results:', error)
        return NextResponse.json(
          { error: 'Failed to update results' },
          { status: 500 }
        )
      }

      console.log(`🏆 Results updated for tournament ${tournamentId}, calculating scores...`)
      
      // Calculate prediction scores using backend logic
      const updatedCount = await updateAllPredictionScores(tournamentId)
      
      if (updatedCount !== null) {
        console.log(`✅ Successfully updated ${updatedCount} prediction scores for tournament ${tournamentId}`)
      } else {
        console.error(`❌ Failed to update prediction scores for tournament ${tournamentId}`)
      }

      return NextResponse.json({ results })
    } else {
      // Create new results
      const { data: results, error } = await database
        .from('results')
        .insert(resultData)
        .select()
        .single()

      if (error) {
        console.error('Error creating results:', error)
        return NextResponse.json(
          { error: 'Failed to create results' },
          { status: 500 }
        )
      }

      console.log(`🏆 New results created for tournament ${tournamentId}, calculating scores...`)
      
      // Calculate prediction scores using backend logic
      const updatedCount = await updateAllPredictionScores(tournamentId)
      
      if (updatedCount !== null) {
        console.log(`✅ Successfully updated ${updatedCount} prediction scores for tournament ${tournamentId}`)
      } else {
        console.error(`❌ Failed to update prediction scores for tournament ${tournamentId}`)
      }

      return NextResponse.json({ results }, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/tournaments/[id]/results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    // Validate tournament exists
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentId)
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Delete the results
    const { error } = await database
      .from('results')
      .delete()
      .eq('tournament_id', tournamentId)

    if (error) {
      console.error('Error deleting results:', error)
      return NextResponse.json(
        { error: 'Failed to delete results' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Results deleted for tournament ${tournamentId}, resetting prediction scores...`)

    // Reset all prediction scores to -1 for this tournament
    const { data: resetResults, error: resetError } = await database
      .from('predictions')
      .update({ score: -1 })
      .eq('tournament_id', tournamentId)
      .select('id')

    if (resetError) {
      console.error('Error resetting prediction scores:', resetError)
      return NextResponse.json(
        { error: 'Results deleted but failed to reset prediction scores' },
        { status: 500 }
      )
    }

    const resetCount = resetResults?.length || 0
    console.log(`✅ Successfully reset ${resetCount} prediction scores to -1 for tournament ${tournamentId}`)

    return NextResponse.json({ 
      success: true, 
      message: `Results deleted and ${resetCount} prediction scores reset` 
    })
  } catch (error) {
    console.error('Unexpected error in DELETE /api/tournaments/[id]/results:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
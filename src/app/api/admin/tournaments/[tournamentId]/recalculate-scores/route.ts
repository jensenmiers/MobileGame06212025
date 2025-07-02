import { NextRequest, NextResponse } from 'next/server'
import { updateAllPredictionScoresWithDetails } from '@/lib/scoring-service'

interface RouteParams {
  params: {
    tournamentId: string
  }
}

/**
 * POST /api/admin/tournaments/[tournamentId]/recalculate-scores
 * Manually recalculates scores for all predictions in a tournament
 * Public endpoint for admin use
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params

    console.log(`🔧 Admin: Starting manual score recalculation for tournament ${tournamentId}`)

    // Use the detailed scoring function that continues on errors
    const result = await updateAllPredictionScoresWithDetails(tournamentId)

    // Log the results
    if (result.success) {
      console.log(`✅ Admin: Successfully recalculated ${result.predictionsUpdated} prediction scores for tournament ${tournamentId}`)
    } else {
      console.log(`⚠️ Admin: Recalculation completed with issues for tournament ${tournamentId}: ${result.predictionsUpdated} updated, ${result.errors.length} errors`)
      result.errors.forEach(error => console.error(`  - ${error}`))
    }

    // Return the structured response
    return NextResponse.json({
      success: true,
      message: result.errors.length === 0 
        ? `Successfully recalculated scores for ${result.predictionsUpdated} predictions` 
        : `Recalculation completed with ${result.errors.length} errors. ${result.predictionsUpdated} predictions were updated successfully.`,
      data: {
        tournamentId,
        predictionsUpdated: result.predictionsUpdated,
        errors: result.errors
      }
    })

  } catch (error) {
    console.error('Unexpected error in admin score recalculation:', error)
    return NextResponse.json(
      {
        success: false,
        predictionsUpdated: 0,
        errors: [`Unexpected server error: ${error instanceof Error ? error.message : 'Unknown error'}`],
        message: 'Internal server error during score recalculation'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/tournaments/[tournamentId]/recalculate-scores
 * Returns information about the tournament and prediction count
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params
    const { database } = await import('@/lib/database')
    const supabase = database

    // Get tournament info
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, name, status')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Get prediction count
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id, score')
      .eq('tournament_id', tournamentId)

    if (predError) {
      return NextResponse.json(
        { error: 'Failed to fetch predictions' },
        { status: 500 }
      )
    }

    const totalPredictions = predictions?.length || 0
    const unprocessedPredictions = predictions?.filter(p => p.score === -1).length || 0
    const processedPredictions = totalPredictions - unprocessedPredictions

    return NextResponse.json({
      tournament: {
        id: tournament.id,
        name: tournament.name,
        status: tournament.status
      },
      predictions: {
        total: totalPredictions,
        processed: processedPredictions,
        unprocessed: unprocessedPredictions
      },
      message: `Tournament has ${totalPredictions} predictions (${processedPredictions} processed, ${unprocessedPredictions} unprocessed)`
    })

  } catch (error) {
    console.error('Unexpected error in admin score info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
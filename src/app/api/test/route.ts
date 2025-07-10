import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Test basic database connection
    const { data: tournaments, error: tournamentsError } = await database
      .from('tournaments')
      .select('id, name')
      .limit(1)

    const { data: participants, error: participantsError } = await database
      .from('participants')
      .select('id, name')
      .limit(1)

    const { data: predictions, error: predictionsError } = await database
      .from('predictions')
      .select('id, score')
      .limit(1)

    return NextResponse.json({
      status: 'Backend migration test successful! 🚀',
      timestamp: new Date().toISOString(),
      database_tests: {
        tournaments: {
          success: !tournamentsError,
          count: tournaments?.length || 0,
          error: tournamentsError?.message
        },
        participants: {
          success: !participantsError,
          count: participants?.length || 0,
          error: participantsError?.message
        },
        predictions: {
          success: !predictionsError,
          count: predictions?.length || 0,
          error: predictionsError?.message
        }
      },
      environment: {
        use_backend_api: process.env.NEXT_PUBLIC_USE_BACKEND_API || 'false',
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_startgg_key: !!process.env.START_GG_API_KEY
      }
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { 
        status: 'Backend test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';
import { getPhaseStatus } from '@/lib/tournament-service';

interface RouteParams {
  params: {
    tournamentId: string;
  };
}

function extractTournamentSlug(url: string): string {
  // Extract slug from URLs like:
  // https://www.start.gg/tournament/tournament-slug/events
  // https://www.start.gg/tournament/tournament-slug
  const match = url.match(/\/tournament\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid Start.gg tournament URL format');
  }
  return match[1];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  return handlePhaseStatus(request, params, null);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { startgg_url } = body;
    return handlePhaseStatus(request, params, startgg_url);
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Invalid request body' 
      },
      { status: 400 }
    );
  }
}

async function handlePhaseStatus(request: NextRequest, params: RouteParams['params'], providedUrl: string | null) {
  try {
    const { tournamentId } = params;

    // Get tournament details including Start.gg URL
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('id, name, startgg_tournament_url')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tournament not found' 
        },
        { status: 404 }
      );
    }

    // Use provided URL if available, otherwise fall back to database URL
    const urlToUse = providedUrl || tournament.startgg_tournament_url;
    
    if (!urlToUse) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Tournament does not have a Start.gg URL configured' 
        },
        { status: 400 }
      );
    }

    // Extract tournament slug from URL
    const tournamentSlug = extractTournamentSlug(urlToUse);

    // Get phase status from Start.gg
    const phaseStatus = await getPhaseStatus(tournamentSlug, tournament.name);

    // Update the tournament with the phase status information
    const { error: updateError } = await database
      .from('tournaments')
      .update({
        current_phase: phaseStatus.currentPhase,
        phase_last_checked: phaseStatus.phaseLastChecked,
        total_remaining_participants: phaseStatus.activeEntrantCount,
        updated_at: new Date()
      })
      .eq('id', tournamentId);

    if (updateError) {
      console.error('Error updating tournament phase status:', updateError);
      // Don't fail the request just because we couldn't cache the data
    }

    return NextResponse.json({ 
      success: true,
      ...phaseStatus
    });
  } catch (error) {
    console.error('Phase status error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check phase status'
      },
      { status: 500 }
    );
  }
} 
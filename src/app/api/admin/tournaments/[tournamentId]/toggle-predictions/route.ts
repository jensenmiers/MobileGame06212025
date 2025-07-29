import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/lib/database';

interface RouteParams {
  params: {
    tournamentId: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { tournamentId } = params;

    // Get current tournament state
    const { data: tournament, error: tournamentError } = await database
      .from('tournaments')
      .select('predictions_open, name')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    // Toggle predictions_open
    const newPredictionsOpen = !tournament.predictions_open;

    // Update tournament
    const { data: updatedTournament, error: updateError } = await database
      .from('tournaments')
      .update({ predictions_open: newPredictionsOpen })
      .eq('id', tournamentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating tournament:', updateError);
      return NextResponse.json(
        { error: 'Failed to update tournament' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament: updatedTournament,
      predictions_open: newPredictionsOpen,
      message: `Predictions for "${tournament.name}" are now ${newPredictionsOpen ? 'open' : 'closed'}`
    });

  } catch (error) {
    console.error('Error in toggle predictions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
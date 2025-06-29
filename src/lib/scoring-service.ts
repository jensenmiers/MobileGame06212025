import { Prediction, TournamentResult } from '@/types/tournament';
import { createClient } from '@/lib/supabase/server';

// Base points for each position (1st to 4th)
const POSITION_POINTS = [100, 50, 30, 10] as const;

/**
 * Calculates the score for a single prediction based on actual results
 * @param prediction The prediction to score
 * @param results The actual tournament results
 * @returns The calculated score (0-100)
 */
export function calculatePredictionScore(
  prediction: Pick<Prediction, 
    'slot_1_participant_id' | 
    'slot_2_participant_id' | 
    'slot_3_participant_id' | 
    'slot_4_participant_id'
  >,
  results: TournamentResult | null
): number {
  if (!results) return 0; // No results yet

  // Create a map of participant_id to their actual position (1-4)
  const actualPositions = new Map<string, number>([
    [results.position_1_participant_id, 1],
    [results.position_2_participant_id, 2],
    [results.position_3_participant_id, 3],
    [results.position_4_participant_id, 4]
  ].filter(([id]) => id !== null) as [string, number][]);

  let totalScore = 0;

  // Check each prediction slot (1-4)
  for (let predictedPosition = 1; predictedPosition <= 4; predictedPosition++) {
    const participantId = prediction[`slot_${predictedPosition}_participant_id` as keyof typeof prediction];
    
    // Skip if no prediction in this slot
    if (!participantId) continue;

    const actualPosition = actualPositions.get(participantId);
    
    // If participant didn't place in top 4, no points
    if (actualPosition === undefined) continue;

    // Calculate how many positions off the prediction was
    const positionOff = Math.abs(predictedPosition - actualPosition);

    // Calculate points based on how close the prediction was
    let pointsEarned = 0;
    if (positionOff === 0) {
      // Exact match - 100% of base points
      pointsEarned = POSITION_POINTS[predictedPosition - 1];
    } else if (positionOff === 1) {
      // 1 position off - 50% of base points
      pointsEarned = POSITION_POINTS[predictedPosition - 1] * 0.5;
    } else if (positionOff === 2) {
      // 2 positions off - 25% of base points
      pointsEarned = POSITION_POINTS[predictedPosition - 1] * 0.25;
    } else if (positionOff === 3) {
      // 3 positions off - 10% of base points
      pointsEarned = POSITION_POINTS[predictedPosition - 1] * 0.1;
    }
    // More than 3 positions off - 0 points

    totalScore += pointsEarned;
  }

  // Round to nearest integer
  return Math.round(totalScore);
}

/**
 * Updates the score for a single prediction
 * @param predictionId The ID of the prediction to update
 * @returns The new score, or null if there was an error
 */
export async function updatePredictionScore(predictionId: string): Promise<number | null> {
  const supabase = createClient();
  
  try {
    // Get the prediction with all necessary data
    const { data: prediction, error: predError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .single();

    if (predError || !prediction) {
      console.error('Error fetching prediction:', predError);
      return null;
    }

    // Get the tournament results
    const { data: result, error: resultError } = await supabase
      .from('results')
      .select('*')
      .eq('tournament_id', prediction.tournament_id)
      .maybeSingle();

    if (resultError) {
      console.error('Error fetching results:', resultError);
      return null;
    }

    // Calculate the new score
    const newScore = calculatePredictionScore(prediction, result);

    // Update the prediction with the new score
    const { error: updateError } = await supabase
      .from('predictions')
      .update({ score: newScore })
      .eq('id', predictionId);

    if (updateError) {
      console.error('Error updating prediction score:', updateError);
      return null;
    }

    return newScore;
  } catch (error) {
    console.error('Unexpected error in updatePredictionScore:', error);
    return null;
  }
}

/**
 * Updates scores for all predictions in a tournament
 * @param tournamentId The ID of the tournament
 * @returns The number of predictions updated, or null if there was an error
 */
export async function updateAllPredictionScores(tournamentId: string): Promise<number | null> {
  const supabase = createClient();
  
  try {
    // Get all predictions for the tournament
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (predError) {
      console.error('Error fetching predictions:', predError);
      return null;
    }

    // Update each prediction
    let updatedCount = 0;
    for (const prediction of predictions) {
      const score = await updatePredictionScore(prediction.id);
      if (score !== null) {
        updatedCount++;
      }
    }

    return updatedCount;
  } catch (error) {
    console.error('Unexpected error in updateAllPredictionScores:', error);
    return null;
  }
}

/**
 * Gets the current scoring configuration
 * @returns The current scoring configuration
 */
export function getScoringConfig() {
  return {
    positionPoints: [...POSITION_POINTS],
    positionOffPoints: [1, 0.5, 0.25, 0.1], // 0, 1, 2, 3 positions off
  };
}

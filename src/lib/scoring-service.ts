import { Prediction, TournamentResult } from '@/types/tournament';
import { database } from '@/lib/database';

// Base points for each position (1st to 4th) - Scaled for 999 max: 431, 266, 165, 100
const POSITION_POINTS = [431, 266, 165, 100] as const;

// Proximity multipliers for different position accuracy
const PROXIMITY_MULTIPLIERS = [1.0, 0.61, 0.41, 0.17] as const; // 100%, 61%, 41%, 17%

// Points for correct bracket reset prediction
const BRACKET_RESET_POINTS = 24;

// Points for correct grand finals score prediction  
const GRAND_FINALS_SCORE_POINTS = 13;

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
    'slot_4_participant_id' |
    'bracket_reset' |
    'grand_finals_score'
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
    if (positionOff <= 3) {
      // Use proximity multiplier based on how many positions off
      pointsEarned = POSITION_POINTS[predictedPosition - 1] * PROXIMITY_MULTIPLIERS[positionOff];
    }
    // More than 3 positions off - 0 points (shouldn't happen with 4 positions)

    totalScore += pointsEarned;
  }

  // Bracket reset scoring logic
  if (results.bracket_reset !== null && results.bracket_reset !== undefined) {
    // Results have a bracket reset value - check if prediction matches
    if (prediction.bracket_reset === results.bracket_reset) {
      totalScore += BRACKET_RESET_POINTS;
    }
    // If prediction.bracket_reset is null/undefined, 0 points added (no bonus)
  }
  // If results.bracket_reset is null/undefined, no points for anyone regardless of their prediction

  // Grand finals score scoring logic
  if (results.grand_finals_score !== null && results.grand_finals_score !== undefined) {
    // Results have a grand finals score value - check if prediction matches
    if (prediction.grand_finals_score === results.grand_finals_score) {
      totalScore += GRAND_FINALS_SCORE_POINTS;
    }
    // If prediction.grand_finals_score is null/undefined, 0 points added (no bonus)
  }
  // If results.grand_finals_score is null/undefined, no points for anyone regardless of their prediction

  // Round to nearest integer
  return Math.round(totalScore);
}

/**
 * Updates the score for a single prediction
 * @param predictionId The ID of the prediction to update
 * @returns The new score, or null if there was an error
 */
export async function updatePredictionScore(predictionId: string): Promise<number | null> {
  const supabase = database;
  
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
 * Updates scores for all predictions in a tournament with detailed error reporting
 * Continues processing even if individual predictions fail
 * @param tournamentId The ID of the tournament
 * @returns Detailed results including success count and errors
 */
export async function updateAllPredictionScoresWithDetails(tournamentId: string): Promise<{
  success: boolean;
  predictionsUpdated: number;
  errors: string[];
}> {
  const supabase = database;
  
  try {
    // Validate tournament exists
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id')
      .eq('id', tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return {
        success: false,
        predictionsUpdated: 0,
        errors: [`Tournament not found: ${tournamentId}`]
      };
    }

    // Get all predictions for the tournament
    const { data: predictions, error: predError } = await supabase
      .from('predictions')
      .select('id')
      .eq('tournament_id', tournamentId);

    if (predError) {
      return {
        success: false,
        predictionsUpdated: 0,
        errors: [`Error fetching predictions: ${predError.message}`]
      };
    }

    if (!predictions || predictions.length === 0) {
      return {
        success: true,
        predictionsUpdated: 0,
        errors: []
      };
    }

    console.log(`🎯 Starting score calculation for ${predictions.length} predictions in tournament ${tournamentId}`);

    // Update each prediction, collecting errors but continuing processing
    let updatedCount = 0;
    const errors: string[] = [];

    for (const prediction of predictions) {
      try {
        const score = await updatePredictionScore(prediction.id);
        if (score !== null) {
          updatedCount++;
        } else {
          errors.push(`Failed to update prediction ${prediction.id}: updatePredictionScore returned null`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to update prediction ${prediction.id}: ${errorMessage}`);
        console.error(`❌ Error updating prediction ${prediction.id}:`, error);
      }
    }

    const success = errors.length === 0;
    
    console.log(`🎯 Score calculation completed: ${updatedCount}/${predictions.length} updated, ${errors.length} errors`);

    return {
      success,
      predictionsUpdated: updatedCount,
      errors
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error in updateAllPredictionScoresWithDetails:', error);
    return {
      success: false,
      predictionsUpdated: 0,
      errors: [`Unexpected error: ${errorMessage}`]
    };
  }
}

/**
 * Updates scores for all predictions in a tournament
 * @param tournamentId The ID of the tournament
 * @returns The number of predictions updated, or null if there was an error
 */
export async function updateAllPredictionScores(tournamentId: string): Promise<number | null> {
  const result = await updateAllPredictionScoresWithDetails(tournamentId);
  return result.success ? result.predictionsUpdated : null;
}

/**
 * Gets the current scoring configuration
 * @returns The current scoring configuration
 */
export function getScoringConfig() {
  return {
    positionPoints: [...POSITION_POINTS],
    positionOffPoints: PROXIMITY_MULTIPLIERS, // 0, 1, 2, 3 positions off
    bracketResetPoints: BRACKET_RESET_POINTS,
    grandFinalsScorePoints: GRAND_FINALS_SCORE_POINTS,
  };
}

-- Simple migration to fix prediction scores
-- Update all predictions to have correct scores based on tournament results

-- Update predictions for tournaments that have results
UPDATE predictions 
SET score = calculate_prediction_score(id)
WHERE tournament_id IN (
    SELECT DISTINCT tournament_id FROM results
);

-- Update predictions for tournaments that don't have results
UPDATE predictions 
SET score = -1
WHERE tournament_id NOT IN (
    SELECT DISTINCT tournament_id FROM results
); 
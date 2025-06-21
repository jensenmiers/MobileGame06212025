-- Migration: Recompute All Prediction Scores
-- Simple script to recalculate all prediction scores

DO $$
DECLARE
    prediction_id uuid;
    new_score integer;
    count integer := 0;
BEGIN
    -- Loop through all predictions and recalculate scores
    FOR prediction_id IN 
        SELECT id FROM predictions
    LOOP
        -- Calculate new score using existing function
        SELECT calculate_prediction_score(prediction_id) INTO new_score;
        
        -- Update the prediction
        UPDATE predictions 
        SET score = new_score 
        WHERE id = prediction_id;
        
        count := count + 1;
    END LOOP;
    
    RAISE NOTICE 'Updated % prediction scores', count;
END $$; 
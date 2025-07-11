-- Migration: Add Bonus Prediction to Predictions Table
-- Created: 2025-02-01 12:00:00
-- 
-- This migration adds an optional bonus prediction field for grand finals outcomes:
-- - Upper Bracket winner without bracket reset
-- - Upper Bracket winner with bracket reset  
-- - Lower Bracket winner
-- Worth 13 points when correct

-- Step 1: Create enum type for bonus prediction outcomes
CREATE TYPE bonus_prediction_outcome AS ENUM (
    'upper_no_reset',
    'upper_with_reset', 
    'lower_bracket'
);

-- Step 2: Add bonus prediction column to predictions table
ALTER TABLE predictions 
ADD COLUMN bonus_prediction bonus_prediction_outcome DEFAULT NULL;

-- Step 3: Add comment explaining the new column
COMMENT ON COLUMN predictions.bonus_prediction IS 
'Optional bonus prediction for grand finals outcome. Worth 13 points when correct. 
upper_no_reset: Upper bracket winner wins grand finals without bracket reset
upper_with_reset: Upper bracket winner wins grand finals after bracket reset
lower_bracket: Lower bracket winner wins grand finals';

-- Step 4: Add index for querying bonus predictions
CREATE INDEX idx_predictions_bonus_prediction 
ON predictions(bonus_prediction) 
WHERE bonus_prediction IS NOT NULL;

-- Step 5: Show current state
SELECT 
    'Bonus prediction column added successfully' as status,
    COUNT(*) as total_predictions,
    COUNT(bonus_prediction) as predictions_with_bonus
FROM predictions; 
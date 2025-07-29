-- Migration: Add predictions_open boolean column to tournaments table
-- Created: 2025-01-27 00:00:00
-- 
-- This migration adds a predictions_open boolean column that controls whether
-- predictions are allowed for a tournament. When false, the tournament shows
-- "Awaiting Top Bracket" status regardless of results or cutoff time.

-- Step 1: Add the predictions_open column with default value true
ALTER TABLE tournaments 
ADD COLUMN predictions_open BOOLEAN DEFAULT true;

-- Step 2: Add comment explaining the new column
COMMENT ON COLUMN tournaments.predictions_open IS 
'Controls whether predictions are open for this tournament. 
When false, shows "Awaiting Top Bracket" status regardless of results or cutoff time.
When true, uses existing logic (results submitted? leaderboard ready : (cutoff time past? results pending : predictions open))';

-- Step 3: Show current state
SELECT 
    'predictions_open column added successfully' as status,
    COUNT(*) as total_tournaments,
    COUNT(CASE WHEN predictions_open = true THEN 1 END) as tournaments_with_predictions_open,
    COUNT(CASE WHEN predictions_open = false THEN 1 END) as tournaments_with_predictions_closed
FROM tournaments; 
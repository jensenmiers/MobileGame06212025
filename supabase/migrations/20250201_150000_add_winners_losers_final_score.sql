-- Migration: Add Winners Final Score and Losers Final Score Bonus Picks
-- Created: 2025-02-01 15:00:00
-- 
-- This migration adds two new optional bonus prediction fields:
-- - Winners Final Score (7 points when correct)
-- - Losers Final Score (6 points when correct)
-- Both use the same score options as Grand Final Score (3-0, 3-1, 3-2)

-- Step 1: Rename the existing enum to be more generic
ALTER TYPE grand_finals_score RENAME TO finals_score;

-- Step 2: Add winners_final_score column to predictions table
ALTER TABLE predictions 
ADD COLUMN winners_final_score finals_score DEFAULT NULL;

-- Step 3: Add losers_final_score column to predictions table  
ALTER TABLE predictions 
ADD COLUMN losers_final_score finals_score DEFAULT NULL;

-- Step 4: Add winners_final_score column to results table
ALTER TABLE results 
ADD COLUMN winners_final_score finals_score DEFAULT NULL;

-- Step 5: Add losers_final_score column to results table
ALTER TABLE results 
ADD COLUMN losers_final_score finals_score DEFAULT NULL;

-- Step 6: Add comments explaining the new columns
COMMENT ON COLUMN predictions.winners_final_score IS 
'Optional winners final score prediction. Worth 7 points when correct. 
score_3_0: Winners final ends 3-0 (sweep)
score_3_1: Winners final ends 3-1 (close series)
score_3_2: Winners final ends 3-2 (very close series)';

COMMENT ON COLUMN predictions.losers_final_score IS 
'Optional losers final score prediction. Worth 6 points when correct. 
score_3_0: Losers final ends 3-0 (sweep)
score_3_1: Losers final ends 3-1 (close series)
score_3_2: Losers final ends 3-2 (very close series)';

COMMENT ON COLUMN results.winners_final_score IS 
'Actual winners final score result.
score_3_0: Winners final ended 3-0 (sweep)
score_3_1: Winners final ended 3-1 (close series)
score_3_2: Winners final ended 3-2 (very close series)';

COMMENT ON COLUMN results.losers_final_score IS 
'Actual losers final score result.
score_3_0: Losers final ended 3-0 (sweep)
score_3_1: Losers final ended 3-1 (close series)
score_3_2: Losers final ended 3-2 (very close series)';

-- Step 7: Add indexes for querying the new score predictions
CREATE INDEX idx_predictions_winners_final_score 
ON predictions(winners_final_score) 
WHERE winners_final_score IS NOT NULL;

CREATE INDEX idx_predictions_losers_final_score 
ON predictions(losers_final_score) 
WHERE losers_final_score IS NOT NULL;

CREATE INDEX idx_results_winners_final_score 
ON results(winners_final_score) 
WHERE winners_final_score IS NOT NULL;

CREATE INDEX idx_results_losers_final_score 
ON results(losers_final_score) 
WHERE losers_final_score IS NOT NULL;

-- Step 8: Update the results_ez view to include new score fields
DROP VIEW IF EXISTS results_ez;
CREATE VIEW results_ez AS
SELECT 
    t.name AS tournament_name,
    r.bracket_reset,
    r.grand_finals_score,
    r.winners_final_score,
    r.losers_final_score,
    p1.name AS position_1,
    p2.name AS position_2,
    p3.name AS position_3,
    p4.name AS position_4
FROM results r
LEFT JOIN tournaments t ON (r.tournament_id = t.id)
LEFT JOIN participants p1 ON (r.position_1_participant_id = p1.id)
LEFT JOIN participants p2 ON (r.position_2_participant_id = p2.id)
LEFT JOIN participants p3 ON (r.position_3_participant_id = p3.id)
LEFT JOIN participants p4 ON (r.position_4_participant_id = p4.id);

-- Step 9: Update the predictions_ez view to include new score fields
DROP VIEW IF EXISTS predictions_ez;
CREATE VIEW predictions_ez AS
SELECT 
    (i.identity_data ->> 'name'::text) AS user_name,
    t.name AS tournament_name,
    p.last_updated_at,
    p.score,
    p.bracket_reset,
    p.grand_finals_score,
    p.winners_final_score,
    p.losers_final_score,
    p1.name AS slot_1_name,
    p2.name AS slot_2_name,
    p3.name AS slot_3_name,
    p4.name AS slot_4_name,
    i.email AS user_email
FROM predictions p
LEFT JOIN participants p1 ON (p.slot_1_participant_id = p1.id)
LEFT JOIN participants p2 ON (p.slot_2_participant_id = p2.id)
LEFT JOIN participants p3 ON (p.slot_3_participant_id = p3.id)
LEFT JOIN participants p4 ON (p.slot_4_participant_id = p4.id)
LEFT JOIN tournaments t ON (p.tournament_id = t.id)
LEFT JOIN auth.identities i ON (p.user_id = i.user_id);

-- Step 10: Add comment explaining the updated view structure
COMMENT ON VIEW predictions_ez IS 
'Easy-to-read view of predictions with human-readable names. 
Includes all bonus score predictions: grand_finals_score, winners_final_score, losers_final_score.';

COMMENT ON VIEW results_ez IS 
'Easy-to-read view of tournament results with human-readable names.
Includes all bonus score results: grand_finals_score, winners_final_score, losers_final_score.';

-- Step 11: Show current state
SELECT 
    'New bonus score columns added successfully' as status,
    COUNT(*) as total_predictions,
    COUNT(winners_final_score) as predictions_with_winners_final_score,
    COUNT(losers_final_score) as predictions_with_losers_final_score
FROM predictions; 
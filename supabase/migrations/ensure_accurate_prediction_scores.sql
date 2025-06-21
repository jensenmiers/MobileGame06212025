-- Migration: Create function to ensure accurate prediction scores at all times
-- This function examines every prediction and sets the correct score based on tournament results

-- Drop function if it exists
DROP FUNCTION IF EXISTS ensure_accurate_prediction_scores();

-- Create the main function
CREATE OR REPLACE FUNCTION ensure_accurate_prediction_scores()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    prediction_record RECORD;
    calculated_score INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through every prediction in the database
    FOR prediction_record IN 
        SELECT 
            p.id,
            p.tournament_id,
            p.score as current_score,
            (SELECT COUNT(*) FROM results r WHERE r.tournament_id = p.tournament_id) as has_results
        FROM predictions p
    LOOP
        -- Check if tournament has results
        IF prediction_record.has_results > 0 THEN
            -- Tournament has results, calculate actual score
            SELECT calculate_prediction_score(prediction_record.id) INTO calculated_score;
        ELSE
            -- Tournament has no results, set score to -1
            calculated_score := -1;
        END IF;
        
        -- Update only if score has changed (to avoid unnecessary updates)
        IF prediction_record.current_score IS DISTINCT FROM calculated_score THEN
            UPDATE predictions 
            SET score = calculated_score 
            WHERE id = prediction_record.id;
            
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$;

-- Create a trigger function that automatically runs when results are inserted/updated/deleted
CREATE OR REPLACE FUNCTION auto_update_prediction_scores_on_results_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    affected_tournament_id UUID;
    updated_count INTEGER;
BEGIN
    -- Determine which tournament was affected
    IF TG_OP = 'DELETE' THEN
        affected_tournament_id := OLD.tournament_id;
    ELSE
        affected_tournament_id := NEW.tournament_id;
    END IF;
    
    -- Update all predictions for this tournament
    IF TG_OP = 'DELETE' THEN
        -- Results were deleted, set all predictions for this tournament to -1
        UPDATE predictions 
        SET score = -1 
        WHERE tournament_id = affected_tournament_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    ELSE
        -- Results were inserted or updated, calculate scores for all predictions
        UPDATE predictions 
        SET score = calculate_prediction_score(id)
        WHERE tournament_id = affected_tournament_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
    END IF;
    
    -- Log the update
    RAISE NOTICE 'Auto-updated % prediction scores for tournament %', updated_count, affected_tournament_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Create the trigger on the results table
DROP TRIGGER IF EXISTS trigger_auto_update_prediction_scores ON results;
CREATE TRIGGER trigger_auto_update_prediction_scores
    AFTER INSERT OR UPDATE OR DELETE ON results
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_prediction_scores_on_results_change();

-- Create a trigger function for when new predictions are inserted
CREATE OR REPLACE FUNCTION auto_set_prediction_score_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    has_results INTEGER;
    calculated_score INTEGER;
BEGIN
    -- Check if tournament has results
    SELECT COUNT(*) INTO has_results 
    FROM results 
    WHERE tournament_id = NEW.tournament_id;
    
    IF has_results > 0 THEN
        -- Tournament has results, calculate score
        SELECT calculate_prediction_score(NEW.id) INTO calculated_score;
        NEW.score := calculated_score;
    ELSE
        -- Tournament has no results, set to -1
        NEW.score := -1;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for new predictions
DROP TRIGGER IF EXISTS trigger_auto_set_prediction_score ON predictions;
CREATE TRIGGER trigger_auto_set_prediction_score
    BEFORE INSERT ON predictions
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_prediction_score_on_insert();

-- Run the function once to ensure all existing predictions have accurate scores
SELECT ensure_accurate_prediction_scores() as updated_predictions; 
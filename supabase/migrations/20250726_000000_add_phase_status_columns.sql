-- Add phase status tracking columns to tournaments table
-- These columns help track Start.gg bracket progression and prevent syncing too many entrants

ALTER TABLE tournaments 
ADD COLUMN current_phase TEXT,
ADD COLUMN phase_last_checked TIMESTAMPTZ,
ADD COLUMN total_remaining_participants INTEGER;

-- Add helpful comments
COMMENT ON COLUMN tournaments.current_phase IS 'Current bracket phase name from Start.gg (e.g., "Top 8", "Top 24")';
COMMENT ON COLUMN tournaments.phase_last_checked IS 'Last time we checked the phase status via Start.gg API';
COMMENT ON COLUMN tournaments.total_remaining_participants IS 'Number of active participants remaining in the bracket'; 
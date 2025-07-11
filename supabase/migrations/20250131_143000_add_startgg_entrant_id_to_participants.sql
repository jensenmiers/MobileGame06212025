-- Migration: Add Start.gg Entrant ID to Participants Table
-- Created: 2025-01-31 14:30:00
-- Phase 1: Add new column and prepare for stable ID system
-- 
-- This migration is part of solving the foreign key constraint issue when syncing
-- tournament participants. Instead of deleting and recreating participants (which
-- breaks existing predictions), we'll use Start.gg's stable entrant IDs.

-- Step 1: Add the new column for Start.gg entrant IDs
ALTER TABLE participants 
ADD COLUMN startgg_entrant_id BIGINT;

-- Step 2: Create index on the new column (will become primary key later)
CREATE INDEX CONCURRENTLY idx_participants_startgg_entrant_id 
ON participants(startgg_entrant_id);

-- Step 3: Add a comment explaining the new column
COMMENT ON COLUMN participants.startgg_entrant_id IS 
'Start.gg entrant ID - stable identifier from Start.gg API that persists across tournament updates';

-- Step 4: Create a function to help with the migration
CREATE OR REPLACE FUNCTION migrate_to_startgg_ids()
RETURNS TABLE(
    participant_id UUID,
    participant_name TEXT,
    tournament_name TEXT,
    needs_sync BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        t.name,
        (p.startgg_entrant_id IS NULL) as needs_sync
    FROM participants p
    JOIN tournaments t ON p.tournament_id = t.id
    ORDER BY t.name, p.name;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Show current state
SELECT 
    'Phase 1 Complete: startgg_entrant_id column added' as status,
    COUNT(*) as total_participants,
    COUNT(startgg_entrant_id) as participants_with_startgg_id,
    COUNT(*) - COUNT(startgg_entrant_id) as participants_needing_sync
FROM participants; 
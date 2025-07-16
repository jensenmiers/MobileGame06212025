-- Add active field to tournaments table
-- This field controls whether tournaments are visible to regular users
-- Default to true for backward compatibility (all existing tournaments remain visible)

ALTER TABLE tournaments 
ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;

-- Add an index on the active field for better query performance
CREATE INDEX idx_tournaments_active ON tournaments(active);

-- Update all existing tournaments to be active (backward compatibility)
UPDATE tournaments SET active = true WHERE active IS NULL;

-- Add a comment to document the field's purpose
COMMENT ON COLUMN tournaments.active IS 'Controls tournament visibility. When false, tournament is hidden from regular users but still visible to admins.';
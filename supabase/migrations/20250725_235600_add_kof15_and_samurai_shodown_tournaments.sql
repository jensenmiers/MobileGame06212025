-- Add THE KING OF FIGHTERS XV and Samurai Shodown tournaments
-- Also standardize all tournaments to have 64 max_participants

-- First, update all existing tournaments to have 64 max_participants for consistency
UPDATE tournaments SET max_participants = 64 WHERE max_participants != 64;

-- Add THE KING OF FIGHTERS XV tournament
INSERT INTO tournaments (
  name, 
  game_title, 
  description, 
  start_time, 
  cutoff_time, 
  end_time, 
  max_participants, 
  active, 
  created_at, 
  updated_at
) VALUES (
  'THE KING OF FIGHTERS XV',
  'THE KING OF FIGHTERS XV',
  'THE KING OF FIGHTERS XV tournament',
  '2025-08-01 00:00:00+00',
  '2025-08-30 23:59:59+00',
  '2025-08-31 23:59:59+00',
  64,
  true,
  NOW(),
  NOW()
);

-- Add Samurai Shodown tournament
INSERT INTO tournaments (
  name, 
  game_title, 
  description, 
  start_time, 
  cutoff_time, 
  end_time, 
  max_participants, 
  active, 
  created_at, 
  updated_at
) VALUES (
  'Samurai Shodown',
  'Samurai Shodown',
  'Samurai Shodown tournament',
  '2025-08-01 00:00:00+00',
  '2025-08-30 23:59:59+00',
  '2025-08-31 23:59:59+00',
  64,
  true,
  NOW(),
  NOW()
);

-- Add comments to document the changes
COMMENT ON TABLE tournaments IS 'Added THE KING OF FIGHTERS XV and Samurai Shodown tournaments. Standardized all tournaments to 64 max_participants.'; 
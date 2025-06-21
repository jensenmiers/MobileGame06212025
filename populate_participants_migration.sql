-- Migration: Populate Real Tournament Participants from start.gg data
-- This replaces dummy data with actual tournament entrants

-- Clear existing predictions first (they reference participants)
DELETE FROM predictions;

-- Clear existing results (they also reference participants)
DELETE FROM results;

-- Clear existing participants (dummy data)
DELETE FROM participants;

-- Insert real tournament participants from start.gg data
-- Each person gets a separate record for each tournament they're registered for

-- Street Fighter 6 participants (030054c3-59e5-4b1c-88ed-c2ca7501aa4d)
INSERT INTO participants (tournament_id, name, seed) VALUES
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'COMBO FIEND', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Chipp', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Hulagirly', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'MYES | FoHamr', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'OG_DASH', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'CobraSouls', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'EDLN | PhillerInstinct', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'MackFly', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'CL | Samaro', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Sicktastic', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Brivin', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'kioshi_black', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Fencer | Serenborn', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'FSP | DJ Nova', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'OnlineTony', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'FSP | Deus', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'ion', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'Bo_Berserker', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'WLF | Dodger', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'icecream', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'J-RED', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'ChrisWin.EX', NULL),
('030054c3-59e5-4b1c-88ed-c2ca7501aa4d', 'SushiHeaven', NULL);

-- Tekken 8 participants (0c6e0e95-201f-4ee9-a371-3312db3185fc)
INSERT INTO participants (tournament_id, name, seed) VALUES
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'New Metal Game | PaprcutRadiation', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'Jose | jbautabag', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'Surge', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'Sicktastic', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'Drac', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'SGC | ZumTiingWong', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'blubberbuttz', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'snowman', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'obiwan-shinobi37', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'Bo_Berserker', NULL),
('0c6e0e95-201f-4ee9-a371-3312db3185fc', 'HAMMER | ThaiChi', NULL);

-- Dragon Ball FighterZ participants (28e71bf7-2cbb-4151-9845-17a6dc2229ea)
INSERT INTO participants (tournament_id, name, seed) VALUES
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Everybodyluvsmilky', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Mistikal', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Shivanoodles', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'LEGEND | KDEX', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Jose | jbautabag', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Dad | Dpri', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Chimkin | JF Lunch', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Alekovich', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Endurical', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'Roldd', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'SGC | ZumTiingWong', NULL),
('28e71bf7-2cbb-4151-9845-17a6dc2229ea', 'BuffRayzp', NULL);

-- Mortal Kombat 1 participants (b5239b76-9386-4bbc-ba0a-06d8bfb92005)
INSERT INTO participants (tournament_id, name, seed) VALUES
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'COMBO FIEND', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'CobraSouls', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'lawsy', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'STG | Lankyness', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'BKL | SlowFast', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'STG | Onlinecale213', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'OnlineTony', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'FSP | Han Rashid', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'JFHBS | GuamoKun', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'StiloLA323', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'SYN | Plus', NULL),
('b5239b76-9386-4bbc-ba0a-06d8bfb92005', 'FSP | Saino', NULL);

-- Delete unused tournaments (Guilty Gear Strive & Fatal Fury: City of the Wolves)
DELETE FROM tournaments WHERE id IN (
  '742776c3-fc00-4c5c-a3de-9136d37ded7a', -- Guilty Gear Strive
  'cf64811f-c98a-4385-80c1-06f94ac79c9b'  -- Fatal Fury: City of the Wolves
); 
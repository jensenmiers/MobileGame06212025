-- Migration: Add Mortal Kombat 1 Tournament Results
-- Tournament UUID: b5239b76-9386-4bbc-ba0a-06d8bfb92005
-- Results: 1st CobraSouls, 2nd STG | Lankyness, 3rd StiloLA323, 4th JFHBS | GuamoKun

DO $$
DECLARE
    tournament_uuid uuid := 'b5239b76-9386-4bbc-ba0a-06d8bfb92005';
    tournament_name_check text;
    participant_1st uuid;
    participant_2nd uuid;
    participant_3rd uuid;
    participant_4th uuid;
    result_exists boolean;
BEGIN
    -- Check if tournament exists and get its name
    SELECT name INTO tournament_name_check 
    FROM tournaments 
    WHERE id = tournament_uuid;
    
    IF tournament_name_check IS NULL THEN
        RAISE EXCEPTION 'Tournament with UUID % not found', tournament_uuid;
    END IF;
    
    RAISE NOTICE 'Tournament found: %', tournament_name_check;
    
    -- Check if results already exist for this tournament
    SELECT EXISTS(
        SELECT 1 FROM results WHERE tournament_id = tournament_uuid
    ) INTO result_exists;
    
    IF result_exists THEN
        RAISE EXCEPTION 'Results already exist for tournament: %', tournament_name_check;
    END IF;
    
    -- Find or create participant: CobraSouls (1st place)
    SELECT id INTO participant_1st 
    FROM participants 
    WHERE LOWER(name) = LOWER('CobraSouls');
    
    IF participant_1st IS NULL THEN
        INSERT INTO participants (name, created_at, updated_at)
        VALUES ('CobraSouls', now(), now())
        RETURNING id INTO participant_1st;
        RAISE NOTICE 'Created new participant: CobraSouls';
    ELSE
        RAISE NOTICE 'Found existing participant: CobraSouls';
    END IF;
    
    -- Find or create participant: STG | Lankyness (2nd place)
    SELECT id INTO participant_2nd 
    FROM participants 
    WHERE LOWER(name) = LOWER('STG | Lankyness');
    
    IF participant_2nd IS NULL THEN
        INSERT INTO participants (name, created_at, updated_at)
        VALUES ('STG | Lankyness', now(), now())
        RETURNING id INTO participant_2nd;
        RAISE NOTICE 'Created new participant: STG | Lankyness';
    ELSE
        RAISE NOTICE 'Found existing participant: STG | Lankyness';
    END IF;
    
    -- Find or create participant: StiloLA323 (3rd place)
    SELECT id INTO participant_3rd 
    FROM participants 
    WHERE LOWER(name) = LOWER('StiloLA323');
    
    IF participant_3rd IS NULL THEN
        INSERT INTO participants (name, created_at, updated_at)
        VALUES ('StiloLA323', now(), now())
        RETURNING id INTO participant_3rd;
        RAISE NOTICE 'Created new participant: StiloLA323';
    ELSE
        RAISE NOTICE 'Found existing participant: StiloLA323';
    END IF;
    
    -- Find or create participant: JFHBS | GuamoKun (4th place)
    SELECT id INTO participant_4th 
    FROM participants 
    WHERE LOWER(name) = LOWER('JFHBS | GuamoKun');
    
    IF participant_4th IS NULL THEN
        INSERT INTO participants (name, created_at, updated_at)
        VALUES ('JFHBS | GuamoKun', now(), now())
        RETURNING id INTO participant_4th;
        RAISE NOTICE 'Created new participant: JFHBS | GuamoKun';
    ELSE
        RAISE NOTICE 'Found existing participant: JFHBS | GuamoKun';
    END IF;
    
    -- Insert the results using the correct column names
    INSERT INTO results (
        tournament_id,
        position_1_participant_id,
        position_2_participant_id,
        position_3_participant_id,
        position_4_participant_id,
        entered_at
    ) VALUES (
        tournament_uuid,
        participant_1st,
        participant_2nd,
        participant_3rd,
        participant_4th,
        now()
    );
    
    RAISE NOTICE 'Successfully inserted results for tournament: %', tournament_name_check;
    RAISE NOTICE '1st Place: CobraSouls';
    RAISE NOTICE '2nd Place: STG | Lankyness';
    RAISE NOTICE '3rd Place: StiloLA323';
    RAISE NOTICE '4th Place: JFHBS | GuamoKun';
    
END $$; 
CREATE OR REPLACE VIEW participants_ez AS
SELECT
    p.name AS participant,
    t.name AS tournament,
    p.startgg_entrant_id,
    p.seed
FROM
    participants p
JOIN
    tournaments t ON p.tournament_id = t.id;

-- 0050: Add Graaftest exercise
--
-- The Graaftest (digging test) is a Defensie assessment exercise testing
-- rotational power and endurance. The movement mimics a digging action:
-- rotate a weight from low on one side to high on the other side.
-- Any weighted implement can be used: medicine ball, dumbbell, or kettlebell.
--
-- Not present in defensie-matrix-clean.json (standalone assessment test,
-- not embedded in weekly programme templates).
--
-- Timestamp: 2026-05-03 UTC (1746230400000)

INSERT INTO exercises (id,slug,name,category,primary_muscles_json,secondary_muscles_json,tags_json,equipment_required_json,instructions_json,metrics_json,is_active,created_at_ms,updated_at_ms)
SELECT 'a347874a-e92f-500c-ab38-fc3660355a31','graaftest','Graaftest','skill','["obliques","shoulders"]','["glutes","quads"]','["rotation","core","military","functional"]','["dumbbell"]','{"steps":["Stand with feet shoulder-width apart, weight held in both hands","Lower the weight diagonally to hip height on one side — start position","In one explosive movement, rotate and lift the weight diagonally to shoulder height on the opposite side","Reverse under control back to start position — this is one repetition","Alternate sides each set or complete all reps on one side first"],"cues":["Use a medicine ball, dumbbell, or kettlebell — any weighted implement is valid","Drive the movement from your hips and core, not your arms","Keep a neutral spine throughout","Test is scored on power and control of the rotation"]}','{"supports":["reps","sets","time"]}',1,1746230400000,1746230400000
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE slug='graaftest');

-- 0048: Resolve hardlopen-zone-3-5-minuten (deferred from migrations 0045/0047)
--
-- Resolution of the 4 deferred exercises (re-assessed 2026-05-03):
--
--   hardlopen-zone-3-5-minuten (RESOLVED)
--     Conflict: one matrix occurrence had raw '1 set van 2 minuten' but name says 5 minuten.
--     Resolution: a second occurrence in defensie-matrix-clean.json (Keuring Cluster 3,
--     week 4 day 3) has raw '1 set van 5 minuten', confirming the name is correct.
--     A separate exercise hardlopen-zone-3-2-minuten already exists for the 2-minute variant.
--     The 2-minute source entry was a data entry error in the source matrix.
--
--   optillen-vanaf-de-grond (STILL DEFERRED)
--     Load/object completely unspecified — no additional context resolves this.
--     The rugzak variant (optillen-vanaf-de-grond-rugzak) is already imported.
--
--   til-draagtest-full-exercise (STILL DEFERRED)
--     Defensie Til/draagtest test load and object specification unavailable.
--
--   til-draagtest-gewicht-plaatsen-naar-heupen (STILL DEFERRED)
--     Load weight unspecified — no additional context resolves this.
--
-- Note: 0047 header stated 6 occurrences of hardlopen-zone-3-5-minuten;
-- actual count in defensie-matrix-clean.json is 2 (Keuring Cluster 2 and 3,
-- both at week=4, day=3, session_order=7). The 0047 header count was an overcount.
-- Remaining deferred template items after this migration: 34+6+6 = 46 (not 50).
--
-- Timestamp: 2026-05-03 UTC (1746230400000)

-- ---------------------------------------------------------------------------
-- Exercise: hardlopen-zone-3-5-minuten
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id,slug,name,category,primary_muscles_json,secondary_muscles_json,tags_json,equipment_required_json,instructions_json,metrics_json,is_active,created_at_ms,updated_at_ms)
SELECT '6d095bd9-607a-5288-9231-646fae5b5441','hardlopen-zone-3-5-minuten','Hardlopen zone 3 - 5 minuten','cardio','[]','[]','["running","zone-3","threshold","military"]','["none"]','{"steps":["Run at zone 3 intensity for 5 minutes","2 minutes zone 1 recovery"],"cues":["Zone 3 = threshold, comfortably hard"]}','{"supports":["time","sets"]}',1,1746230400000,1746230400000
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE slug='hardlopen-zone-3-5-minuten');

-- ---------------------------------------------------------------------------
-- Backfill 2 program_template_items (block_week=4, day_index=2, session_order=7)
-- Both sessions are Interval Training, week 4, day 3 in the matrix.
-- ---------------------------------------------------------------------------

-- Keuring Cluster 2 (id: 05027310-42c1-51d4-83c3-e3677988194c)
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '722de528-41ba-5da5-a1ee-badcaeee0a5f','05027310-42c1-51d4-83c3-e3677988194c',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1) IS NOT NULL;

-- Keuring Cluster 3 (id: 33cb93e8-a882-56c4-b116-a494ec9f7ea3)
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2fa5b262-46c6-5a00-a6d7-19a99f7932d7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1) IS NOT NULL;

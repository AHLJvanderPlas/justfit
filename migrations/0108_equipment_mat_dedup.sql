-- 0108_equipment_mat_dedup.sql — C-B20: exercise_mat duplicates yoga_mat.
--
-- Both appeared in ALL_EQUIPMENT, so a user saw two options meaning the same
-- thing and the planner treated them as distinct requirements. Measured before
-- the fix: 0 exercises require exercise_mat, 3 require yoga_mat — so it was a
-- dead option that survived the X-36 dead-option sweep.
--
-- yoga_mat is canonical. No exercise rows need rewriting (none use exercise_mat);
-- only user preferences carry it, and those are remapped so nobody silently loses
-- a piece of equipment they told us they own.
UPDATE user_preferences
   SET preferences_json = replace(preferences_json, '"exercise_mat"', '"yoga_mat"'),
       updated_at_ms = CAST(strftime('%s','now') AS INTEGER) * 1000
 WHERE preferences_json LIKE '%exercise_mat%';

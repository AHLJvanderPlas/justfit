-- 0111_dedupe_equipment.sql — repairs a defect introduced by 0108.
--
-- 0108 remapped exercise_mat → yoga_mat with a blind string replace on the
-- preferences blob. For anyone who already owned yoga_mat that produced a
-- duplicate, visible in Settings as "Yoga mat" listed twice.
--
-- The lesson is in the method, not the value: a set stored as a JSON array must
-- be rewritten as a set, never patched with string substitution. This dedupes
-- every user's equipment array rather than only the known case, since the same
-- replace ran for everyone.
UPDATE user_preferences
   SET preferences_json = json_set(
         preferences_json,
         '$.available_equipment',
         (SELECT json_group_array(v) FROM (
            SELECT DISTINCT je.value AS v
              FROM json_each(json_extract(user_preferences.preferences_json, '$.available_equipment')) je
         ))
       ),
       updated_at_ms = CAST(strftime('%s','now') AS INTEGER) * 1000
 WHERE json_extract(preferences_json, '$.available_equipment') IS NOT NULL;

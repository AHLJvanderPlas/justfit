-- 0110_dcp_situps.sql — C-F13: the DCP sit-up family.
--
-- The library had no sit-up. Across 478 active exercises, trunk flexion returned
-- only bicycle-crunch and reverse-crunch; everything else in the core set is
-- anti-extension or anti-rotation (planks, dead bugs, Pallof, bird dog). The app
-- could therefore measure a DCP sit-up score and had no way to train it.
--
-- Seeded as a ladder mirroring the push-up family that already exists, so the
-- planner can regress and progress the movement rather than only prescribing the
-- test version:
--   bent-knee-sit-up  volume rung — shorter lever, more clean reps
--   sit-up            the test movement, feet free
--   anchored-sit-up   feet held, as most DCP protocols allow
--   weighted-sit-up   overshoot rung; carries `weight` so C-F6 tracks the load
--
-- All four carry the `military` tag so R5xx selection can reach them, and
-- primary muscles use the canonical vocabulary in _shared/muscles.js so the
-- recovery map and exerciseWhy resolve them.

INSERT OR IGNORE INTO exercises
  (id, slug, name, category, primary_muscles_json, secondary_muscles_json,
   tags_json, equipment_required_json, instructions_json, metrics_json,
   alternatives_json, is_active, created_at_ms, updated_at_ms, visibility)
VALUES
  ('ex_situp', 'sit-up', 'Sit-Up', 'strength',
   '["rectus_abdominis","hip_flexors"]', '["obliques"]',
   '["bodyweight","floor","low_impact","core","military","dcp"]', '["none"]',
   '{"steps":["Lie on your back, knees bent about 90 degrees, feet flat","Hands crossed on your chest or fingertips at your temples","Curl up until your torso is vertical — chest toward your knees","Lower under control until your shoulder blades touch the floor","That is one repetition. Breathe out on the way up"],"cues":["Do not pull on your neck","A steady pace beats a fast start — this is a two-minute test"],"why":"The DCP test movement. Trains trunk flexion through full range, which planks and dead bugs do not."}',
   '{"supports":["reps","sets","time"],"base_duration_sec":120}',
   '{"substitutions":["bent-knee-sit-up","anchored-sit-up","bicycle-crunch"]}',
   1, 1790812800000, 1790812800000, 'global'),

  ('ex_situp_anchored', 'anchored-sit-up', 'Anchored Sit-Up', 'strength',
   '["rectus_abdominis","hip_flexors"]', '["obliques"]',
   '["bodyweight","floor","low_impact","core","military","dcp"]', '["none"]',
   '{"steps":["Hook your feet under something solid, or have a partner hold them","Knees bent about 90 degrees","Curl up until your torso is vertical","Lower under control until your shoulder blades touch the floor"],"cues":["Anchoring lets the hip flexors help — most DCP protocols allow it","Check which version your test uses before relying on it"],"why":"The anchored DCP variant. Usually allows more repetitions than feet-free."}',
   '{"supports":["reps","sets","time"],"base_duration_sec":120}',
   '{"substitutions":["sit-up","bent-knee-sit-up"]}',
   1, 1790812800000, 1790812800000, 'global'),

  ('ex_situp_bent_knee', 'bent-knee-sit-up', 'Bent-Knee Sit-Up', 'strength',
   '["rectus_abdominis"]', '["hip_flexors","obliques"]',
   '["bodyweight","floor","low_impact","core","military","dcp"]', '["none"]',
   '{"steps":["Lie on your back with your heels drawn close to your seat","Arms reaching forward past your knees","Curl up until your forearms pass your knees","Lower under control"],"cues":["The shorter lever makes this easier — use it to build volume","Reps here should be clean, not grinding"],"why":"Volume rung. When your max sit-up count is low, this builds the repetitions that move it."}',
   '{"supports":["reps","sets"]}',
   '{"substitutions":["sit-up","reverse-crunch"]}',
   1, 1790812800000, 1790812800000, 'global'),

  ('ex_situp_weighted', 'weighted-sit-up', 'Weighted Sit-Up', 'strength',
   '["rectus_abdominis","hip_flexors"]', '["obliques"]',
   '["core","military","dcp","weighted"]', '["dumbbell"]',
   '{"steps":["Hold a dumbbell against your chest with both hands","Knees bent, feet flat","Curl up until your torso is vertical, keeping the weight on your chest","Lower under control"],"cues":["Start lighter than you expect — the leverage is unforgiving","Stop the set the moment your lower back starts leading"],"why":"Overshoot rung. Training the pattern loaded makes the unloaded test version feel easy."}',
   '{"supports":["weight","reps","sets"],"load_type":"dumbbell_single"}',
   '{"substitutions":["sit-up","anchored-sit-up"]}',
   1, 1790812800000, 1790812800000, 'global');

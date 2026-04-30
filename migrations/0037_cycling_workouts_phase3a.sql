-- 0037: Phase 3a cycling workouts
-- Adds 6 new FIT-file-inspired workouts (cw24-cw29) and updates 3 existing
-- workouts (cw06, cw10, cw18) with min_sets/max_sets fields for time-budget
-- scaling. The scaleCyclingIntervals() helper in plan.js reads these fields
-- to adjust repetition count to the user's available time.
--
-- TSS estimates computed at 250W FTP reference using:
--   TSS = sum((duration_sec/3600) * IF^2 * 100 * sets)
--   where IF = (power_pct_low + power_pct_high) / 2 / 100
--
-- Workout sources (JOIN Cycling FIT files):
--   cw24 — 30_VO2Max_Piramid.fit   (power pyramid)
--   cw25 — 30_sprint_VO2MAX_Sprit.fit  (sprint-VO2-sprint blocks)
--   cw26 — 44_VO2MAX_sprint_piramid.fit  (neuromuscular pyramid ×2)
--   cw27/28 — 50_VO2MAX_40-20s.fit  (40-20 Tabata-style)
--   cw29 — 56_VO2MAX_Flamme_Rouge.fit  (mixed-intensity blocks)

-- ── New workouts ──────────────────────────────────────────────────────────────

INSERT INTO cycling_workouts (id, slug, name, sub_goal, workout_type, tss_estimate, duration_min, intervals_json) VALUES

-- VO2max Pyramid — structured ramp up/down through zones 3→4→5→4→3
-- Fixed structure (no scaling needed — each step is a distinct zone target)
('cw24','cw-vo2max-pyramid','VO2max Pyramid · 30 min','climbing','vo2max',26,30,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":75,"sets":1},{"label":"Zone 3 ramp","duration_sec":120,"power_pct_low":83,"power_pct_high":89,"sets":1},{"label":"Zone 4 ramp","duration_sec":120,"power_pct_low":93,"power_pct_high":99,"sets":1},{"label":"VO2max peak","duration_sec":120,"power_pct_low":103,"power_pct_high":109,"sets":1},{"label":"Zone 4 descent","duration_sec":120,"power_pct_low":93,"power_pct_high":99,"sets":1},{"label":"Zone 3 descent","duration_sec":120,"power_pct_low":83,"power_pct_high":89,"sets":1},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- Sprint–VO2–Sprint — two blocks of sprint + VO2 bridge + sprint
-- Fixed structure (2 blocks, not scalable — block count changes session character)
('cw25','cw-sprint-vo2-sprint-30','Sprint–VO2–Sprint · 30 min','sprint','anaerobic',26,30,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Sprint","duration_sec":10,"power_pct_low":160,"power_pct_high":200,"sets":4},{"label":"VO2 bridge","duration_sec":100,"power_pct_low":120,"power_pct_high":140,"sets":2},{"label":"Block recovery","duration_sec":360,"power_pct_low":45,"power_pct_high":55,"sets":1},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- Sprint Pyramid — 2 neuromuscular pyramids (6→12→20→12→6 s) approximated as
-- 10 average-duration sprints with recovery between, plus inter-pyramid rest
-- Fixed structure (pyramid shape is the stimulus — don't scale repetitions)
('cw26','cw-sprint-pyramid','Sprint Pyramid · 46 min','sprint','anaerobic',31,46,
 '[{"label":"Warm-up","duration_sec":900,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Sprint","duration_sec":11,"power_pct_low":160,"power_pct_high":200,"sets":10},{"label":"Sprint recovery","duration_sec":55,"power_pct_low":45,"power_pct_high":55,"sets":10},{"label":"Pyramid recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1},{"label":"Cool-down","duration_sec":900,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- 40-20 s VO2max (climbing) — Tabata-style 40s hard / 20s easy
-- SCALABLE: min 5 sets (25 min) → base 10 sets (30 min) → max 15 sets (35 min)
-- tss_estimate at base 10 sets
('cw27','cw-40-20-climbing','40-20 s VO2max · 30 min base','climbing','vo2max',29,30,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max interval","duration_sec":40,"power_pct_low":120,"power_pct_high":130,"sets":10,"min_sets":5,"max_sets":15},{"label":"Recovery","duration_sec":20,"power_pct_low":45,"power_pct_high":55,"sets":10,"min_sets":5,"max_sets":15},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- 40-20 s VO2max (race fitness) — same workout, different sub_goal assignment
-- SCALABLE: min 5 sets (25 min) → base 10 sets (30 min) → max 15 sets (35 min)
('cw28','cw-40-20-race','40-20 s VO2max · 30 min base','race_fitness','vo2max',29,30,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max interval","duration_sec":40,"power_pct_low":120,"power_pct_high":130,"sets":10,"min_sets":5,"max_sets":15},{"label":"Recovery","duration_sec":20,"power_pct_low":45,"power_pct_high":55,"sets":10,"min_sets":5,"max_sets":15},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- Flamme Rouge — mixed-intensity blocks (threshold + VO2 surge + sprint + recovery)
-- SCALABLE: min 6 reps (38 min) → base 12 reps (46 min) → max 18 reps (54 min)
-- tss_estimate at base 12 sets
('cw29','cw-flamme-rouge','Flamme Rouge · 46 min base','race_fitness','vo2max',40,46,
 '[{"label":"Warm-up","duration_sec":900,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Threshold","duration_sec":30,"power_pct_low":90,"power_pct_high":100,"sets":12,"min_sets":6,"max_sets":18},{"label":"VO2max surge","duration_sec":20,"power_pct_low":103,"power_pct_high":109,"sets":12,"min_sets":6,"max_sets":18},{"label":"Sprint","duration_sec":10,"power_pct_low":130,"power_pct_high":150,"sets":12,"min_sets":6,"max_sets":18},{"label":"Recovery","duration_sec":20,"power_pct_low":45,"power_pct_high":55,"sets":12,"min_sets":6,"max_sets":18},{"label":"Cool-down","duration_sec":900,"power_pct_low":45,"power_pct_high":55,"sets":1}]');

-- ── Update existing workouts with time-budget scaling ─────────────────────────

-- cw06: VO2max 4×4 min (climbing) — add min_sets:2 / max_sets:6
-- At 2 sets: ~34 min · At 4 sets (base): ~52 min · At 6 sets: ~66 min
UPDATE cycling_workouts SET intervals_json =
  '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max","duration_sec":240,"power_pct_low":106,"power_pct_high":120,"sets":4,"min_sets":2,"max_sets":6},{"label":"Recovery","duration_sec":240,"power_pct_low":45,"power_pct_high":55,"sets":4,"min_sets":2,"max_sets":6},{"label":"Cool-down","duration_sec":480,"power_pct_low":45,"power_pct_high":55,"sets":1}]'
WHERE id = 'cw06';

-- cw10: Anaerobic 6×30 s (sprint) — add min_sets:3 / max_sets:8
-- At 3 sets: ~28 min · At 6 sets (base): ~42 min · At 8 sets: ~52 min
UPDATE cycling_workouts SET intervals_json =
  '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Anaerobic","duration_sec":30,"power_pct_low":130,"power_pct_high":160,"sets":6,"min_sets":3,"max_sets":8},{"label":"Recovery","duration_sec":240,"power_pct_low":45,"power_pct_high":55,"sets":6,"min_sets":3,"max_sets":8},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'
WHERE id = 'cw10';

-- cw18: VO2max 5×5 min (race_fitness) — add min_sets:3 / max_sets:7
-- At 3 sets: ~50 min · At 5 sets (base): ~70 min · At 7 sets: ~90 min
UPDATE cycling_workouts SET intervals_json =
  '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max","duration_sec":300,"power_pct_low":106,"power_pct_high":120,"sets":5,"min_sets":3,"max_sets":7},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":5,"min_sets":3,"max_sets":7},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'
WHERE id = 'cw18';

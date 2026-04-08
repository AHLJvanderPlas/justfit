-- Migration 0015: Run/Walk interval exercises (Option A — safe running build-up)
--
-- Six progressive levels driven by the conditioning.endurance score.
-- Each exercise = one run interval. The walk recovery is encoded as
-- custom_rest_sec in metrics_json, which getDefaultRest() reads.
-- fixed_sets encodes the prescribed number of intervals per session.
-- run_level lets the planner pick the right exercise for the user's current score.
--
-- Level  Score    Run    Walk   Sets   Total active
-- ─────  ───────  ─────  ─────  ─────  ────────────
--   1    < 20     30 s   90 s     6    3 min
--   2    20–30    60 s   60 s     6    6 min
--   3    30–45    90 s   60 s     6    9 min
--   4    45–60   120 s   60 s     5   10 min
--   5    60–75   180 s   60 s     5   15 min
--   6    > 75    300 s   60 s     4   20 min

INSERT INTO exercises
  (id, slug, name, category,
   tags_json, equipment_required_json, equipment_advised_json,
   primary_muscles_json,
   metrics_json, instructions_json, alternatives_json,
   is_active, created_at_ms, updated_at_ms)
VALUES

-- Level 1 — Gentle Start (30s run / 90s walk × 6)
(
  'a1000001-run0-4000-8000-run000000001',
  'run-interval-level-1',
  'Run/Walk — Gentle Start',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":30,"custom_rest_sec":90,"fixed_sets":6,"run_level":1}',
  '{"steps":["Run gently for 30 seconds. Think of it as a fast shuffle — slow is exactly right.","When the rest timer starts, walk briskly for 90 seconds. Keep moving and breathe steadily.","Repeat for 6 rounds. If you need to stop early, that is your body giving you the right signal."],"cues":["💡 The walk recovery is not a break — it trains your aerobic system","💡 You should be able to say a full sentence while running. Slower if not."]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Level 2 — 1-Minute Intervals (60s run / 60s walk × 6)
(
  'a1000002-run0-4000-8000-run000000002',
  'run-interval-level-2',
  'Run/Walk — 1 Min Intervals',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":60,"custom_rest_sec":60,"fixed_sets":6,"run_level":2}',
  '{"steps":["Run for 60 seconds at a comfortable, conversational pace.","Walk steadily for 60 seconds when the rest timer starts. Do not stop — keep your legs moving.","Complete 6 rounds. Equal time running and walking."],"cues":["💡 Midfoot landing reduces joint stress — avoid landing on your heel","💡 If your breathing is too hard to speak, slow down"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Level 3 — Build 1 (90s run / 60s walk × 6)
(
  'a1000003-run0-4000-8000-run000000003',
  'run-interval-level-3',
  'Run/Walk — Build 1',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":90,"custom_rest_sec":60,"fixed_sets":6,"run_level":3}',
  '{"steps":["Run for 90 seconds. You should still be able to speak short sentences — back off if not.","Walk for 60 seconds when the rest timer begins. Breathe deep and settle your heart rate.","6 rounds total. Consistency over speed — every session counts."],"cues":["💡 Relax your shoulders and hands while running","💡 Land softly — quiet feet mean less impact"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Level 4 — Build 2 (120s run / 60s walk × 5)
(
  'a1000004-run0-4000-8000-run000000004',
  'run-interval-level-4',
  'Run/Walk — Build 2',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":120,"custom_rest_sec":60,"fixed_sets":5,"run_level":4}',
  '{"steps":["Run for 2 minutes at a steady, sustainable pace. Smooth breathing — not gasping.","Walk for 60 seconds when the rest timer starts. Use it to drop your heart rate.","5 rounds. You are building real aerobic base now."],"cues":["💡 Short stride, quick turnover beats long slow strides for efficiency","💡 Hips forward, body upright — not hunched"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Level 5 — Tempo Build (180s run / 60s walk × 5)
(
  'a1000005-run0-4000-8000-run000000005',
  'run-interval-level-5',
  'Run/Walk — Tempo Build',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":180,"custom_rest_sec":60,"fixed_sets":5,"run_level":5}',
  '{"steps":["Run for 3 minutes at a pace that challenges your breathing — speaking takes effort but is possible.","Walk for 60 seconds when the rest timer starts. Heart rate should drop noticeably.","5 rounds. You are building serious running fitness."],"cues":["💡 Your pace should feel like a 7 out of 10 effort","💡 Drive your arms forward — they set the rhythm for your legs"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- Level 6 — Extended Intervals (300s run / 60s walk × 4)
(
  'a1000006-run0-4000-8000-run000000006',
  'run-interval-level-6',
  'Run/Walk — Extended Intervals',
  'cardio',
  '["cardio","high_impact","outdoor","run_interval","running","no_floor"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":300,"custom_rest_sec":60,"fixed_sets":4,"run_level":6}',
  '{"steps":["Run for 5 minutes at a strong, controlled pace. You are approaching continuous running territory.","Walk for 60 seconds when the rest timer starts — use it actively to prepare for the next effort.","4 rounds. At this level the goal is continuous running — the walks are strategic, not recovery."],"cues":["💡 5-minute efforts build lactate threshold — this is where real fitness is made","💡 Keep form sharp even when tired — that is when injury risk is highest"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
);

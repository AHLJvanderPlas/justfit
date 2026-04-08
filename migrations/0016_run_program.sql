-- Migration 0016: Running Coach Program exercises
--
-- 4 warm-up exercises (category: mobility, tag: run_warmup)
-- 15 continuous run exercises for levels 7–21 (category: cardio, tag: run_continuous)
--
-- Warm-ups are inserted first and excluded from the main pool by the planner (R556).
-- Continuous runs extend the progressive interval ladder (levels 1–6 from migration 0015)
-- into full continuous running sessions: 20 min (level 7) through 180 min (level 21).
--
-- Level  Slug                       Name                      Duration
-- ─────  ─────────────────────────  ────────────────────────  ────────
--   7    run-continuous-level-7     Continuous Run — 20 min   1200 s
--   8    run-continuous-level-8     Continuous Run — 25 min   1500 s
--   9    run-continuous-level-9     Continuous Run — 30 min   1800 s
--  10    run-continuous-level-10    Continuous Run — 35 min   2100 s
--  11    run-continuous-level-11    Continuous Run — 40 min   2400 s
--  12    run-continuous-level-12    Continuous Run — 45 min   2700 s
--  13    run-continuous-level-13    Continuous Run — 50 min   3000 s
--  14    run-continuous-level-14    Continuous Run — 55 min   3300 s
--  15    run-continuous-level-15    Continuous Run — 60 min   3600 s
--  16    run-continuous-level-16    Long Run — 75 min         4500 s
--  17    run-continuous-level-17    Long Run — 90 min         5400 s
--  18    run-continuous-level-18    Long Run — 105 min        6300 s
--  19    run-continuous-level-19    Long Run — 120 min        7200 s
--  20    run-continuous-level-20    Long Run — 150 min        9000 s
--  21    run-continuous-level-21    Long Run — 180 min        10800 s

INSERT INTO exercises
  (id, slug, name, category,
   tags_json, equipment_required_json, equipment_advised_json,
   primary_muscles_json,
   metrics_json, instructions_json, alternatives_json,
   is_active, created_at_ms, updated_at_ms)
VALUES

-- ── Warm-up 1: Leg Swings ──────────────────────────────────────────────────
(
  'b2000001-warm-4000-8000-wrup00000001',
  'run-warmup-leg-swings',
  'Leg Swings',
  'mobility',
  '["cardio","low_impact","no_floor","outdoor","bodyweight","run_warmup"]',
  '["none"]',
  NULL,
  '["hip_flexors","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":30,"fixed_sets":1}',
  '{"steps":["Stand at arm''s length from a wall, resting one hand lightly on it for balance.","Swing your right leg forward and back in a controlled arc — 10 smooth repetitions, gradually increasing the range.","Switch legs and repeat. Keep your core lightly braced and your standing foot flat on the ground."],"cues":["💡 Let momentum do the work — this is a dynamic stretch, not a kick","💡 If your hip flexors feel tight, that is exactly what this is for — keep going"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Warm-up 2: Calf Raises ────────────────────────────────────────────────
(
  'b2000002-warm-4000-8000-wrup00000002',
  'run-warmup-calf-raises',
  'Calf Raises',
  'mobility',
  '["cardio","low_impact","no_floor","outdoor","bodyweight","run_warmup"]',
  '["none"]',
  NULL,
  '["calves","soleus"]',
  '{"supports":["time"],"base_duration_sec":30,"fixed_sets":1}',
  '{"steps":["Stand with feet hip-width apart, toes pointing forward. You can rest fingertips on a wall for balance.","Rise onto your toes as high as you comfortably can and hold for 1 second at the top.","Lower slowly and with control — aim for a 2-second descent. Repeat continuously for the full duration."],"cues":["💡 The slow lowering phase is where the calf strength is built — do not rush it","💡 Rise from the big toe side of your foot for better ankle stability when running"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Warm-up 3: High Knees March ──────────────────────────────────────────
(
  'b2000003-warm-4000-8000-wrup00000003',
  'run-warmup-high-knees-march',
  'High Knees March',
  'mobility',
  '["cardio","low_impact","no_floor","outdoor","bodyweight","run_warmup"]',
  '["none"]',
  NULL,
  '["hip_flexors","quadriceps","calves"]',
  '{"supports":["time"],"base_duration_sec":30,"fixed_sets":1}',
  '{"steps":["March in place at a steady rhythm, lifting each knee to hip height with each step.","Pump your arms in opposition — left arm forward with right knee up, right arm with left knee.","Keep your torso tall and your gaze forward. Breathe rhythmically with your movement."],"cues":["💡 This primes your hip flexors and gets your cardiovascular system online before the run","💡 Exaggerate the arm drive — your arms set the pace for your legs"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Warm-up 4: Hip Circles ────────────────────────────────────────────────
(
  'b2000004-warm-4000-8000-wrup00000004',
  'run-warmup-hip-circles',
  'Hip Circles',
  'mobility',
  '["cardio","low_impact","no_floor","outdoor","bodyweight","run_warmup"]',
  '["none"]',
  NULL,
  '["glutes","hip_flexors","adductors"]',
  '{"supports":["time"],"base_duration_sec":45,"fixed_sets":1}',
  '{"steps":["Stand with feet shoulder-width apart and place both hands on your hips.","Draw large, slow circles with your hips — 5 clockwise, then 5 counter-clockwise. Make each circle bigger than the last.","Keep your knees soft and your upper body as still as possible — the movement comes only from the hips and pelvis."],"cues":["💡 This opens the hip joint before impact loading — do not rush it","💡 Tightness or restriction in one direction tells you which side needs more mobility work"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 7 — Continuous Run 20 min ──────────────────────────────────────
(
  'a1000007-run0-4000-8000-run000000007',
  'run-continuous-level-7',
  'Continuous Run — 20 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":1200,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run continuously for 20 minutes at a conversational pace — if you cannot speak a few words, slow down.","Focus on relaxed form: upright posture, soft foot strike, arms swinging naturally at your sides.","If you need to walk for 30 seconds, do it — then resume running. The goal is continuous movement, not pace."],"cues":["💡 20 minutes of continuous running is a real milestone — you have earned this","💡 Land with your foot beneath your hip, not out in front — it reduces braking force"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 8 — Continuous Run 25 min ──────────────────────────────────────
(
  'a1000008-run0-4000-8000-run000000008',
  'run-continuous-level-8',
  'Continuous Run — 25 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":1500,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 25 minutes at a steady, comfortable effort. Use the first 5 minutes to settle into your rhythm before pushing the pace at all.","Maintain an upright posture and relax your hands — imagine holding a crisp between your thumb and finger without crushing it.","In the final 5 minutes, try to hold your form even as fatigue builds. Smooth is fast."],"cues":["💡 Your aerobic base is building — each session at this pace gets easier","💡 Breathe in a 2-2 or 3-3 rhythm (steps in : steps out) to regulate effort"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 9 — Continuous Run 30 min ──────────────────────────────────────
(
  'a1000009-run0-4000-8000-run000000009',
  'run-continuous-level-9',
  'Continuous Run — 30 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":1800,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 30 minutes. This is the classic benchmark — 30 minutes of continuous running signals real fitness. Start conservatively.","Divide the run mentally: the first 10 minutes are warm-up, the middle 10 are your working zone, the final 10 are where you earn it.","Finish at the same pace you started, or slightly faster — negative splits build confidence."],"cues":["💡 30 minutes of running burns serious calories and trains your fat metabolism efficiently","💡 Keep your gaze up and ahead — looking down compresses your airways and makes breathing harder"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 10 — Continuous Run 35 min ─────────────────────────────────────
(
  'a1000010-run0-4000-8000-run000000010',
  'run-continuous-level-10',
  'Continuous Run — 35 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":2100,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 35 minutes. You are now in proper distance runner territory. Pace yourself so the first half feels almost easy.","Use a mental landmark at the halfway point — turn around or change direction — to reset your focus for the second half.","In the last 5 minutes, check your form: shoulders relaxed, core lightly engaged, feet landing quietly."],"cues":["💡 The ability to hold pace when you want to slow down is the most trainable skill in running","💡 Midfoot or forefoot landing reduces heel strike stress on long runs"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 11 — Continuous Run 40 min ─────────────────────────────────────
(
  'a1000011-run0-4000-8000-run000000011',
  'run-continuous-level-11',
  'Continuous Run — 40 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":2400,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 40 minutes at an easy-to-moderate effort. At this duration, pacing is critical — go out 10-15% slower than you think you need to.","Check in on your body every 10 minutes: loosen your shoulders, drop your jaw, and take 3 deep belly breaths.","The last 10 minutes are the strength work of the run. Finish strong."],"cues":["💡 At 40 minutes you are burning predominantly fat as fuel — this is the aerobic sweet spot","💡 If your ankles or knees ache, slow to a walk for 60 seconds then re-assess"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 12 — Continuous Run 45 min ─────────────────────────────────────
(
  'a1000012-run0-4000-8000-run000000012',
  'run-continuous-level-12',
  'Continuous Run — 45 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":2700,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 45 minutes. Consider drinking water before you start if the temperature is above 15°C — at this duration, hydration starts to matter.","Break the run into three 15-minute blocks mentally. Treat each block as its own mini-goal.","In the third block, focus on cadence — aim for quick, light steps rather than trying to push harder."],"cues":["💡 Cadence (steps per minute) is more important than stride length for efficiency","💡 A light snack 90 minutes before a 45-minute run will give you better energy toward the end"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 13 — Continuous Run 50 min ─────────────────────────────────────
(
  'a1000013-run0-4000-8000-run000000013',
  'run-continuous-level-13',
  'Continuous Run — 50 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":3000,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 50 minutes. Hydrate before you go — at this duration, starting well-hydrated makes a real difference in the final 15 minutes.","Focus on relaxed running mechanics for the first 20 minutes: soft knees, relaxed shoulders, natural arm swing.","When effort starts to feel harder around minute 35, shorten your stride slightly and quicken your cadence — this is more efficient than pushing pace."],"cues":["💡 Running economy — how efficiently you use oxygen — improves significantly in this 40-60 minute training zone","💡 If you get a stitch, exhale forcefully when your left foot strikes the ground"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 14 — Continuous Run 55 min ─────────────────────────────────────
(
  'a1000014-run0-4000-8000-run000000014',
  'run-continuous-level-14',
  'Continuous Run — 55 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":3300,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 55 minutes. This is close to an hour — start at a pace that feels like a 5 out of 10 effort so you have something left at the end.","At the 25-minute mark, do a quick body scan: feet comfortable in shoes, no unexpected tightness or pain. If something hurts, slow down.","The final 10 minutes: maintain form over pace. Runners who finish strong build the mental resilience that carries into longer efforts."],"cues":["💡 Nearly one hour of running trains your body to store and use glycogen more efficiently","💡 Keep your arms below shoulder height and bent at roughly 90 degrees — higher arms waste energy"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 15 — Continuous Run 60 min ─────────────────────────────────────
(
  'a1000015-run0-4000-8000-run000000015',
  'run-continuous-level-15',
  'Continuous Run — 60 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":3600,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 60 minutes — one full hour. This is a significant aerobic training session. Hydrate properly beforehand and carry water if above 15°C.","Divide into four 15-minute blocks. Each block gets its own focus: settle in, find your rhythm, manage fatigue, and finish with intent.","After 45 minutes, the mental game matters as much as the physical. Stay present — focus on one kilometre at a time."],"cues":["💡 An hour of running significantly elevates your VO2 max over a training cycle","💡 Eat a small carbohydrate snack 2 hours before runs of this duration for sustained energy"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 16 — Long Run 75 min ────────────────────────────────────────────
(
  'a1000016-run0-4000-8000-run000000016',
  'run-continuous-level-16',
  'Long Run — 75 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":4500,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["This is your first long run. Run for 75 minutes at a very easy pace — you must be able to hold a full conversation throughout. If you cannot, slow down immediately.","Carry water or plan a route past a water source. At this duration, hydration is not optional.","Walk for 60–90 seconds at minutes 40 and 60 if needed — strategic walk breaks do not diminish the training benefit."],"cues":["💡 Long runs build aerobic base, improve fat metabolism, and strengthen tendons — keep the pace easy or the adaptation suffers","💡 Eat a proper meal 2–3 hours before a long run, not just a snack"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 17 — Long Run 90 min ────────────────────────────────────────────
(
  'a1000017-run0-4000-8000-run000000017',
  'run-continuous-level-17',
  'Long Run — 90 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":5400,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 90 minutes. This requires preparation: eat a proper meal 2–3 hours prior, carry water or an energy drink, and plan your route before you leave.","The first 20 minutes are warm-up — hold back even if you feel strong. You will need that energy later.","After 60 minutes, concentrate on running form. Tired runners slouch and land heavily — consciously lift your chest and quicken your cadence to compensate."],"cues":["💡 90 minutes is long enough to require glycogen replenishment — consider an energy gel at the 60-minute mark","💡 Sore legs the day after a long run are normal — it is adaptation, not damage"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 18 — Long Run 105 min ───────────────────────────────────────────
(
  'a1000018-run0-4000-8000-run000000018',
  'run-continuous-level-18',
  'Long Run — 105 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":6300,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 105 minutes. Plan nutrition: eat a full meal 2–3 hours before, and take an energy gel or small snack at the 45 and 75 minute marks.","This is a genuine long run — choose a route you know, tell someone your plan, and carry your phone.","Run the first half at a pace that feels almost too easy. The second half will feel harder regardless — the goal is to finish, not to sprint."],"cues":["💡 Long runs above 90 minutes train the body to conserve glycogen — critical for events of any distance","💡 Reduce your weekly volume by 30% the day before and after runs of this length"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 19 — Long Run 120 min ───────────────────────────────────────────
(
  'a1000019-run0-4000-8000-run000000019',
  'run-continuous-level-19',
  'Long Run — 120 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":7200,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 2 hours. Full preparation required: pre-run meal, water bottle or hydration vest, energy gels (take one every 45 minutes from the 45-minute mark), and a planned route.","Divide the run into 30-minute blocks. Each block has one job: run comfortably, check form, manage energy, and keep moving.","The final 30 minutes will be mentally difficult. Use a mantra, focus on the next lamp post, or slow your pace — but keep running."],"cues":["💡 Two-hour runs build the aerobic engine that makes all your other runs feel easier","💡 Wear well-fitted, well-worn shoes for long runs — new shoes on a 2-hour run is a recipe for blisters"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 20 — Long Run 150 min ───────────────────────────────────────────
(
  'a1000020-run0-4000-8000-run000000020',
  'run-continuous-level-20',
  'Long Run — 150 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":9000,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 2 hours 30 minutes. This is serious endurance training. Prepare the evening before: good sleep, proper dinner with carbohydrates, and lay out everything you need.","Take an energy gel every 30–45 minutes from the first hour onward. Do not wait until you feel depleted — it will be too late to recover mid-run.","From the 90-minute mark, shorten your stride, stay relaxed, and focus only on the next 10 minutes. Break the second half into small, manageable chunks."],"cues":["💡 Runs of 150 minutes simulate race conditions and train your body''s fat-to-carb fuel switch","💡 Plan your recovery: eat within 30 minutes of finishing and prioritise sleep tonight"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
),

-- ── Level 21 — Long Run 180 min ───────────────────────────────────────────
(
  'a1000021-run0-4000-8000-run000000021',
  'run-continuous-level-21',
  'Long Run — 180 min',
  'cardio',
  '["cardio","high_impact","outdoor","running","no_floor","run_continuous"]',
  '["running_shoes"]',
  NULL,
  '["quadriceps","calves","hamstrings","glutes"]',
  '{"supports":["time"],"base_duration_sec":10800,"custom_rest_sec":0,"fixed_sets":1}',
  '{"steps":["Run for 3 hours. This is peak endurance training. The preparation starts the day before: carbohydrate-rich dinner, 8 hours sleep, and a light but complete breakfast 3 hours before you leave.","Fuel aggressively: energy gel every 30 minutes, water or electrolyte drink at every available opportunity. At 3 hours, what you eat during the run determines the final hour.","The last hour is a test of character. Slow down if you must, but do not stop. Walking 2 minutes every 20 minutes in the final hour is fine — it is still a 3-hour training run."],"cues":["💡 Three-hour long runs build the foundation for half-marathon and marathon racing — this is elite-level training volume","💡 Recovery after a 3-hour run takes 48–72 hours — schedule easy days before and after in your week"]}',
  NULL,
  1,
  strftime('%s','now') * 1000,
  strftime('%s','now') * 1000
);

-- Migration 0012: Conditioning exercises — indoor bike, rowing machine, running, treadmill
-- Adds 9 duration-based conditioning exercises for cardio-equipment users
-- Uses metrics_json.base_duration_sec so the planner assigns correct durations
-- Planner sets sets=1 for exercises where base_duration_sec > 300 (long cardio blocks)

INSERT INTO exercises (id, slug, name, category, primary_muscles_json, tags_json, equipment_required_json, instructions_json, metrics_json, alternatives_json, is_active, created_at_ms, updated_at_ms) VALUES

-- ── INDOOR BIKE (smart trainer / direct-drive) ────────────────────────────────

('ex_steady_indoor_cycle','steady-indoor-cycle','Steady Indoor Cycling','cardio',
 '["quads","hamstrings","glutes","calves"]',
 '["cardio","low_impact","quiet","indoor"]',
 '["indoor_bike"]',
 '{"steps":["Set your bike up — saddle height so your knee has a slight bend at the bottom of the pedal stroke","Start with 5 minutes easy spinning at 80–90 rpm to warm up","Settle into your target power or perceived effort and hold it steadily","Check in every 5 minutes — adjust resistance if drifting","Keep cadence above 80 rpm throughout","Final 3–5 minutes: drop resistance and spin easy to cool down"],"cues":["Smooth circles — push forward over the top, pull back at the bottom","Relax your grip and shoulders — your legs do the work","Breathe rhythmically — match breath to pedal stroke","💡 Beginner: 70–100 W · 80–90 rpm · RPE 4–5","💡 Intermediate: 120–155 W · 85–95 rpm · RPE 6","💡 Advanced: 170–230 W · 90–100 rpm · RPE 7"],"pregnancy_note":"Keep effort conversational (RPE ≤ 5). Stop if you feel dizzy, short of breath, or any pelvic pressure."}',
 '{"supports":["time"],"base_duration_sec":1200}',
 '{"substitutions":["stationary-bike-steady","cycling-intervals-indoor"]}',
 1,1743897600000,1743897600000),

('ex_cycling_intervals_indoor','cycling-intervals-indoor','Cycling Intervals (Indoor)','cardio',
 '["quads","hamstrings","glutes","cardiovascular_system"]',
 '["cardio","low_impact","quiet","indoor","high_intensity"]',
 '["indoor_bike"]',
 '{"steps":["Warm up 4 minutes easy spinning, building to moderate pace in the last minute","Interval: push hard for 30 seconds — high resistance, high cadence","Recovery: easy spin 90 seconds, letting heart rate come back down","Repeat the 30s hard / 90s easy cycle for the duration","Final 3 minutes: easy spin cool-down"],"cues":["Hard effort = legs burning, speech difficult","Easy recovery = genuinely easy, not moderate","Count your reps — consistency across rounds matters","💡 Beginner: 8 rounds · hard effort 110–130% of steady power","💡 Intermediate: 10 rounds · hard effort 140–160% of steady power","💡 Advanced: 12 rounds · hard effort 170%+ / max cadence sprints"]}',
 '{"supports":["time"],"base_duration_sec":1080}',
 '{"substitutions":["steady-indoor-cycle","stationary-bike-steady"]}',
 1,1743897600000,1743897600000),

-- ── STATIONARY BIKE (gym upright / recumbent) ────────────────────────────────

('ex_stationary_bike_steady','stationary-bike-steady','Stationary Bike — Steady Ride','cardio',
 '["quads","hamstrings","glutes","calves"]',
 '["cardio","low_impact","quiet","indoor"]',
 '["exercise_bike"]',
 '{"steps":["Adjust seat height so your knee is almost straight at the bottom of the pedal stroke","Start at low resistance and spin for 3–4 minutes to warm up","Increase resistance to your target level and find a steady rhythm","Maintain a cadence of 70–90 rpm","Every 5 minutes, check your effort — increase resistance slightly if it feels too easy","Last 3 minutes: reduce resistance and cool down"],"cues":["Sit tall — don''t hunch over the handlebars","Engage your core lightly throughout","Focus on smooth, even pressure through both legs","💡 Beginner: light–moderate resistance · RPE 4–5 · ~30 min","💡 Intermediate: moderate resistance · RPE 6 · ~40 min","💡 Advanced: moderate–heavy resistance · RPE 7 · ~50 min"],"pregnancy_note":"Stay at conversational effort (RPE ≤ 5). Upright bikes are usually more comfortable than recumbent in late pregnancy."}',
 '{"supports":["time"],"base_duration_sec":1200}',
 '{"substitutions":["steady-indoor-cycle","cycling-intervals-indoor"]}',
 1,1743897600000,1743897600000),

-- ── ROWING MACHINE ────────────────────────────────────────────────────────────

('ex_rowing_steady','rowing-steady-state','Rowing — Steady State','cardio',
 '["legs","back","shoulders","arms","core"]',
 '["cardio","strength","low_impact","indoor","full_body"]',
 '["rowing_machine"]',
 '{"steps":["Sit with feet strapped in, shins vertical, grip the handle lightly","Drive sequence — LEGS first: push through your heels and extend your legs","As legs near straight, lean back slightly (11 o''clock) and draw the handle to lower chest","Recovery: arms extend first, then body comes forward, then knees bend","Find your split time target and hold it consistently","Cool down: last 2 minutes easy paddling at low rate"],"cues":["Legs 60% of the power · Back 30% · Arms 10%","Drive is one smooth acceleration — not a jerk","Catch with shins vertical, not overreaching","💡 Beginner: 2:25–2:45 /500 m · rate 18–20 spm · ~15 min","💡 Intermediate: 2:05–2:20 /500 m · rate 22–24 spm · ~20 min","💡 Advanced: 1:48–2:00 /500 m · rate 24–26 spm · ~25 min"],"pregnancy_note":"Rowing is generally safe in T1–T2. In T3 the belly may interfere with the catch position — shorten the stroke and stay at low rate. Stop if you feel any abdominal discomfort."}',
 '{"supports":["time"],"base_duration_sec":1200}',
 '{"substitutions":["rowing-intervals","steady-indoor-cycle"]}',
 1,1743897600000,1743897600000),

('ex_rowing_intervals','rowing-intervals','Rowing Intervals','cardio',
 '["legs","back","shoulders","arms","core","cardiovascular_system"]',
 '["cardio","strength","low_impact","indoor","full_body","high_intensity"]',
 '["rowing_machine"]',
 '{"steps":["Warm up 3 minutes easy rowing at rate 18","Work interval: row hard for 60 seconds — push the split down as far as possible","Rest interval: 2 minutes easy paddling or complete rest","Repeat for the session duration","Cool down: 2 minutes easy paddling"],"cues":["Hard interval = split 10–20 seconds faster than your steady pace","Rest genuinely — let heart rate recover before the next push","Keep drive sequence correct even when tired","💡 Beginner: 5 rounds · target -10s vs steady split","💡 Intermediate: 7 rounds · target -15s vs steady split","💡 Advanced: 10 rounds · target -20s vs steady split"]}',
 '{"supports":["time"],"base_duration_sec":1080}',
 '{"substitutions":["rowing-steady-state"]}',
 1,1743897600000,1743897600000),

-- ── OUTDOOR RUNNING ───────────────────────────────────────────────────────────

('ex_easy_run_outdoor','easy-run-outdoor','Easy Run (Outdoor)','cardio',
 '["quads","hamstrings","calves","glutes","cardiovascular_system"]',
 '["cardio","high_impact","outdoor"]',
 '["running_shoes"]',
 '{"steps":["5-minute brisk walk warm-up before you start running","Start at a pace where you can hold a full conversation — this is your easy pace","Land with your foot roughly under your hips, not far in front","Keep arms relaxed at 90°, hands loose","If you need to slow down or walk, do it — it''s still training","Finish with a 3–5 minute walk cool-down and light calf stretches"],"cues":["Talk test: if you can''t say a full sentence, slow down","Short strides are more efficient than long ones","Breathe in through your nose, out through your mouth","💡 Beginner: 7:00–8:30 min/km · ~20 min total","💡 Intermediate: 5:30–6:30 min/km · ~25 min total","💡 Advanced: 4:30–5:30 min/km · ~30 min total"]}',
 '{"supports":["time"],"base_duration_sec":1500}',
 '{"substitutions":["tempo-run-outdoor","run-intervals-outdoor","treadmill-run-steady"]}',
 1,1743897600000,1743897600000),

('ex_tempo_run_outdoor','tempo-run-outdoor','Tempo Run (Outdoor)','cardio',
 '["quads","hamstrings","calves","glutes","cardiovascular_system"]',
 '["cardio","high_impact","outdoor"]',
 '["running_shoes"]',
 '{"steps":["Walk or easy jog 5 minutes to warm up","Build to tempo pace — comfortably hard, not all-out","Maintain this pace for the bulk of the run","The two-word test: you can say two words but not a full sentence","Keep form: tall posture, slight forward lean, quick light steps","5-minute easy jog or walk cool-down at the end"],"cues":["Tempo = about 80% of max heart rate","If you can chat comfortably, go faster. If gasping, back off.","Think: controlled discomfort — not survival mode","💡 Beginner: 6:00–7:00 min/km · ~25 min (including warm-up/cool-down)","💡 Intermediate: 5:00–5:45 min/km · ~30 min total","💡 Advanced: 4:00–4:45 min/km · ~35 min total"]}',
 '{"supports":["time"],"base_duration_sec":1800}',
 '{"substitutions":["easy-run-outdoor","run-intervals-outdoor","treadmill-run-steady"]}',
 1,1743897600000,1743897600000),

('ex_run_intervals_outdoor','run-intervals-outdoor','Running Intervals (Outdoor)','cardio',
 '["quads","hamstrings","calves","glutes","cardiovascular_system"]',
 '["cardio","high_impact","outdoor","high_intensity"]',
 '["running_shoes"]',
 '{"steps":["Warm-up: 5-minute easy jog","Hard effort: run fast for 60 seconds — controlled but challenging","Recovery: 90 seconds walk or very easy jog","Repeat for the session","Cool-down: 3-minute easy walk"],"cues":["Hard effort = you could not have a conversation","Recovery must be genuinely easy — it prepares the next rep","Focus on keeping form during hard effort: tall, relaxed, quick feet","💡 Beginner: 5 rounds · hard pace 5:30–6:30 min/km","💡 Intermediate: 8 rounds · hard pace 4:30–5:00 min/km","💡 Advanced: 10–12 rounds · hard pace 3:45–4:15 min/km"]}',
 '{"supports":["time"],"base_duration_sec":1200}',
 '{"substitutions":["easy-run-outdoor","tempo-run-outdoor","treadmill-run-steady"]}',
 1,1743897600000,1743897600000),

-- ── TREADMILL ─────────────────────────────────────────────────────────────────

('ex_treadmill_run_steady','treadmill-run-steady','Treadmill Run — Steady Pace','cardio',
 '["quads","hamstrings","calves","glutes","cardiovascular_system"]',
 '["cardio","high_impact","indoor"]',
 '["treadmill"]',
 '{"steps":["Set incline to 1% — this better replicates outdoor running (compensates for no wind resistance)","Start at a slow walk for 2 minutes, then gradually increase speed","Find your target speed and lock it in","Keep your gaze forward and slightly down — not at your feet","Avoid holding the handrails unless needed for safety","Last 2–3 minutes: reduce speed to a walking cool-down"],"cues":["1% incline is the sweet spot for most runners","Don''t overstride — feet should land under your hips","Shorter, quicker steps are more efficient than long bounds","💡 Beginner: 7.5–8.5 km/h · 1% incline · ~20 min","💡 Intermediate: 9.5–11.0 km/h · 1% incline · ~25 min","💡 Advanced: 12.0–14.5 km/h · 1–2% incline · ~30 min"]}',
 '{"supports":["time"],"base_duration_sec":1500}',
 '{"substitutions":["easy-run-outdoor","tempo-run-outdoor"]}',
 1,1743897600000,1743897600000);

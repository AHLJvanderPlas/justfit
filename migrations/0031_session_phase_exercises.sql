-- Migration 0031: Session-phase exercises
-- Adds easy-jog-warmup and cooldown-walk as explicit timed steps in structured run sessions.
-- These are tagged 'session_phase' so they are excluded from the general exercise pool
-- but can be looked up by slug when building Cooper test, Running Coach, and Military run sessions.
-- Also cleans up the Cooper test instructions (warmup/cooldown steps removed — now separate plan steps).

INSERT INTO exercises (
  id, slug, name, category,
  tags_json, equipment_required_json,
  metrics_json, instructions_json,
  is_active, created_at_ms, updated_at_ms
) VALUES
(
  lower(hex(randomblob(16))),
  'easy-jog-warmup',
  'Easy Jog Warm-up',
  'cardio',
  '["cardio","low_impact","outdoor","no_floor","zone1","session_phase","loads_knee","loads_ankle"]',
  '["none"]',
  '{"supports":["time"],"base_duration_sec":420,"fixed_sets":1}',
  '{"steps":["Jog at a very easy, conversational pace — Zone 1 only (you could hold a full conversation)","Keep your breathing relaxed and posture tall, eyes looking ahead","This is preparation, not training — slow to a walk immediately if you feel breathless","After 7 minutes you should feel warm and loose, not winded"],"cues":["💡 Zone 1 means you can speak full sentences without effort — if you cannot, slow down","Use this time to mentally rehearse your pacing strategy for the effort ahead"]}',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
),
(
  lower(hex(randomblob(16))),
  'cooldown-walk',
  'Cool-down Walk',
  'cardio',
  '["cardio","low_impact","outdoor","no_floor","recovery","session_phase","loads_knee","loads_ankle"]',
  '["none"]',
  '{"supports":["time"],"base_duration_sec":300,"fixed_sets":1}',
  '{"steps":["Walk at a comfortable, relaxed pace — do not stop abruptly after an intensive effort","Let your heart rate come down naturally over 5 minutes","Focus on slow, deep breathing: inhale through the nose, exhale through the mouth","Shake out your legs gently and note how they feel — useful data for your next session"],"cues":["💡 Stopping abruptly after maximal effort can cause dizziness — keep moving","Your heart rate should drop below 120 bpm within 2–3 minutes at walking pace"]}',
  1,
  unixepoch() * 1000,
  unixepoch() * 1000
);

-- Update Cooper test: remove embedded warmup/cooldown instruction steps.
-- Warm-up jog and cool-down walk are now explicit separate plan steps, so the test
-- instructions only describe the test itself.
UPDATE exercises
SET
  instructions_json = '{"steps":["Start a 12-minute timer on a measured track or GPS route","Run as far as possible in 12 minutes — pace yourself so you do not blow up in the first 3 minutes","Record the total distance covered when the timer ends"],"cues":["Even pacing beats going out fast and dying — aim for a pace you can hold for 10 minutes, then push the final 2","Your distance maps to your fitness level: < 2000 m = below baseline, 2400–2800 m = Cluster 1–3, > 2800 m = Cluster 4–6","💡 Use this as a benchmark every 4–6 weeks — not as a training session in itself"],"pregnancy_note":"Not appropriate during pregnancy. Consult your healthcare provider for a modified cardiovascular assessment."}',
  updated_at_ms = unixepoch() * 1000
WHERE slug = '12-minute-cooper-test';

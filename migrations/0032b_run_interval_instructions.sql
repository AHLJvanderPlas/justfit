-- 0032: Remove hardcoded durations from run interval instruction steps
-- The workout screen already shows the correct prescribed time dynamically.

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run gently at an easy, controlled effort — think of it as a purposeful shuffle, not a sprint.",
  "When the rest timer starts, walk briskly. Keep moving and breathe steadily.",
  "Repeat for all rounds. If you need to stop early, that is your body giving you the right signal."
]}')) WHERE slug = 'run-interval-level-1';

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run at a strong, controlled effort — not a sprint, but clearly working hard.",
  "Walk steadily when the rest timer starts. Do not stop — keep your legs moving.",
  "Complete all rounds. Equal time running and walking."
]}')) WHERE slug = 'run-interval-level-2';

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run at a hard, sustained effort — your breathing should be clearly laboured.",
  "Walk when the rest timer begins. Breathe deep and settle your heart rate below 130 bpm.",
  "Complete all rounds. Consistency over speed — every round at the same effort."
]}')) WHERE slug = 'run-interval-level-3';

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run at a strong, sustainable pace — hard enough that speech requires effort.",
  "Walk when the rest timer starts. Drop your heart rate actively — breathe deep.",
  "Complete all rounds. You are building real aerobic power now."
]}')) WHERE slug = 'run-interval-level-4';

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run at a pace that challenges your breathing — speaking takes real effort but one word is possible.",
  "Walk when the rest timer starts. Heart rate should drop noticeably — aim for below 130.",
  "Complete all rounds. You are building serious HIIT fitness."
]}')) WHERE slug = 'run-interval-level-5';

UPDATE exercises SET instructions_json = json_patch(instructions_json, json('{"steps":[
  "Run at a strong, controlled pace. You are approaching lactate threshold — this should feel genuinely demanding.",
  "Walk when the rest timer starts — use it actively to prepare for the next effort.",
  "Complete all rounds. At this level the walks are strategic recovery, not a break."
]}')) WHERE slug = 'run-interval-level-6';

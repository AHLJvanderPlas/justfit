-- Migration 0005: Seed 8 session templates
-- These are used by plan.js to build structured workout sessions

INSERT INTO session_templates (id, slug, name, description, session_type, difficulty, duration_min, template_json, is_active, created_at_ms, updated_at_ms) VALUES

-- 1. Bodyweight strength (main, 30 min, moderate)
('tpl-bw-strength-main', 'bodyweight-strength-main', 'Bodyweight Strength', 'Full-body bodyweight strength session with compound movements.', 'workout', 'moderate', 30, '{"warm_up":{"duration_sec":180,"exercises":["arm-circles","leg-swings","hip-circles"]},"blocks":[{"name":"Main Block","sets":3,"rest_sec":60,"exercises":["squat","push-up","reverse-lunge","glute-bridge","plank"]},{"name":"Finisher","sets":1,"rest_sec":30,"exercises":["mountain-climbers","jumping-jacks"]}],"cool_down":{"duration_sec":180,"exercises":["standing-quad-stretch","standing-forward-fold","hip-flexor-stretch"]}}', 1, 1711670400000, 1711670400000),

-- 2. Bodyweight strength (short, 20 min, moderate)
('tpl-bw-strength-short', 'bodyweight-strength-short', 'Quick Bodyweight Strength', 'Compact bodyweight strength circuit when time is short.', 'workout', 'moderate', 20, '{"warm_up":{"duration_sec":120,"exercises":["arm-circles","leg-swings"]},"blocks":[{"name":"Main Circuit","sets":2,"rest_sec":45,"exercises":["squat","push-up","reverse-lunge","plank","glute-bridge"]}],"cool_down":{"duration_sec":120,"exercises":["standing-quad-stretch","standing-forward-fold"]}}', 1, 1711670400000, 1711670400000),

-- 3. Mobility & recovery (20 min, easy)
('tpl-mobility-recovery', 'mobility-recovery', 'Mobility Flow', 'Full-body mobility session targeting common tight areas.', 'mobility', 'easy', 20, '{"warm_up":{"duration_sec":60,"exercises":["gentle-hip-circles","wrist-ankle-circles"]},"blocks":[{"name":"Hip & Lower Body","sets":1,"rest_sec":15,"exercises":["hip-flexor-stretch","standing-quad-stretch","standing-forward-fold"]},{"name":"Upper Body & Spine","sets":1,"rest_sec":15,"exercises":["shoulder-roll-stretch","neck-stretch","thoracic-rotation","cat-cow-stretch"]}],"cool_down":{"duration_sec":120,"exercises":["box-breathing"]}}', 1, 1711670400000, 1711670400000),

-- 4. Micro strength (10 min, moderate) — R510 trigger
('tpl-micro-strength', 'micro-strength', 'Micro Strength', '10-minute strength burst — no excuses session.', 'workout', 'moderate', 10, '{"warm_up":{"duration_sec":60,"exercises":["arm-circles"]},"blocks":[{"name":"Quick Circuit","sets":2,"rest_sec":30,"exercises":["squat","push-up","plank"]}],"cool_down":{"duration_sec":60,"exercises":["standing-forward-fold"]}}', 1, 1711670400000, 1711670400000),

-- 5. Micro mobility (5 min, easy) — R510 + R513 trigger
('tpl-micro-mobility', 'micro-mobility', 'Micro Mobility', '5-minute movement break — desk or travel friendly.', 'mobility', 'easy', 5, '{"warm_up":{"duration_sec":0,"exercises":[]},"blocks":[{"name":"Mobility Snack","sets":1,"rest_sec":10,"exercises":["shoulder-roll-stretch","neck-stretch","gentle-hip-circles","wrist-ankle-circles"]}],"cool_down":{"duration_sec":30,"exercises":["box-breathing"]}}', 1, 1711670400000, 1711670400000),

-- 6. Dumbbell full-body (35 min, hard)
('tpl-dumbbell-main', 'full-body-dumbbell-main', 'Dumbbell Full Body', 'Progressive dumbbell session for strength and muscle.', 'workout', 'hard', 35, '{"warm_up":{"duration_sec":180,"exercises":["arm-circles","leg-swings","hip-circles"]},"blocks":[{"name":"Strength Block","sets":4,"rest_sec":75,"exercises":["dumbbell-goblet-squat","dumbbell-bent-over-row","dumbbell-shoulder-press","dumbbell-romanian-deadlift"]},{"name":"Accessory","sets":2,"rest_sec":45,"exercises":["dumbbell-bicep-curl","dumbbell-tricep-kickback","dumbbell-lateral-raise"]}],"cool_down":{"duration_sec":180,"exercises":["standing-quad-stretch","hip-flexor-stretch","standing-forward-fold","shoulder-roll-stretch"]}}', 1, 1711670400000, 1711670400000),

-- 7. Cardio blast (25 min, hard)
('tpl-cardio-blast', 'cardio-blast-main', 'Cardio Blast', 'High-energy cardio circuit to elevate heart rate and burn calories.', 'workout', 'hard', 25, '{"warm_up":{"duration_sec":180,"exercises":["jumping-jacks","arm-circles","leg-swings"]},"blocks":[{"name":"HIIT Circuit","sets":4,"rest_sec":30,"exercises":["jumping-jacks","mountain-climbers","burpee","high-knees"]},{"name":"Finisher","sets":1,"rest_sec":0,"exercises":["mountain-climbers"]}],"cool_down":{"duration_sec":180,"exercises":["standing-forward-fold","hip-flexor-stretch","standing-quad-stretch"]}}', 1, 1711670400000, 1711670400000),

-- 8. Active recovery (15 min, easy) — R514 adjacent
('tpl-active-recovery', 'active-recovery', 'Active Recovery', 'Gentle movement session to aid recovery without adding stress.', 'recovery', 'easy', 15, '{"warm_up":{"duration_sec":60,"exercises":["gentle-hip-circles"]},"blocks":[{"name":"Recovery Flow","sets":1,"rest_sec":20,"exercises":["cat-cow-stretch","childs-pose","thoracic-rotation","hip-flexor-stretch","standing-quad-stretch","progressive-muscle-relaxation"]}],"cool_down":{"duration_sec":120,"exercises":["box-breathing"]}}', 1, 1711670400000, 1711670400000);

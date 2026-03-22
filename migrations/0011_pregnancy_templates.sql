-- Migration 0011: Pregnancy & Postnatal Session Templates
-- Adds 8 new session templates for pregnancy and postnatal modes

INSERT INTO session_templates (id, slug, name, description, session_type, difficulty, duration_min, template_json, is_active, created_at_ms, updated_at_ms) VALUES

-- 1. Pregnancy gentle (T1/T2 — 25 min, easy)
('tpl-pregnancy-gentle', 'pregnancy-gentle', 'Today''s movement', 'Gentle pregnancy-safe session for T1 and T2. Low-impact strength and mobility with pelvic floor.', 'workout', 'easy', 25,
 '{"warm_up":{"duration_sec":180,"exercises":["ankle-mobility-circles","standing-side-stretch","cat-cow-pregnancy"]},"blocks":[{"name":"Pelvic Floor Foundation","sets":2,"rest_sec":30,"exercises":["kegel-hold","pelvic-tilt-standing","deep-core-activation"]},{"name":"Lower Body Strength","sets":2,"rest_sec":45,"exercises":["sumo-squat","standing-hip-abduction","donkey-kick"]},{"name":"Upper Body","sets":2,"rest_sec":45,"exercises":["dumbbell-seated-overhead-press","dumbbell-rear-delt-fly","cross-body-shoulder-stretch"]}],"cool_down":{"duration_sec":180,"exercises":["seated-butterfly","standing-figure-four","pelvic-floor-breathing"]}}',
 1, 1742860800000, 1742860800000),

-- 2. Pregnancy strong (T2 peak energy — 30 min, moderate)
('tpl-pregnancy-strong', 'pregnancy-strong', 'Strong & supported', 'T2 pregnancy session for higher-energy days. Supported strength movements, pelvic floor included.', 'workout', 'moderate', 30,
 '{"warm_up":{"duration_sec":240,"exercises":["ankle-mobility-circles","standing-side-stretch","cat-cow-pregnancy","standing-pelvic-rock"]},"blocks":[{"name":"Pelvic Floor","sets":2,"rest_sec":30,"exercises":["kegel-elevator","pelvic-floor-breathing","deep-core-activation"]},{"name":"Strength","sets":3,"rest_sec":60,"exercises":["sumo-squat","dumbbell-romanian-deadlift","knee-push-up","dumbbell-seated-overhead-press"]},{"name":"Hip & Glute","sets":2,"rest_sec":45,"exercises":["donkey-kick","fire-hydrant","standing-hip-abduction"]}],"cool_down":{"duration_sec":180,"exercises":["seated-butterfly","seated-spinal-twist","pelvic-floor-breathing","supported-side-lying-rest"]}}',
 1, 1742860800000, 1742860800000),

-- 3. Pregnancy T3 (third trimester — 20 min, easy)
('tpl-pregnancy-t3', 'pregnancy-T3', 'Strong & supported', 'Third trimester session. Short intervals, extra breathing focus, seated and standing only.', 'workout', 'easy', 20,
 '{"warm_up":{"duration_sec":180,"exercises":["ankle-pumps","standing-pelvic-rock","360-breathing"]},"blocks":[{"name":"Pelvic Floor","sets":2,"rest_sec":45,"exercises":["kegel-hold","exhalation-core-engagement","standing-pelvic-rock"]},{"name":"Gentle Movement","sets":2,"rest_sec":60,"exercises":["sumo-squat","standing-hip-abduction","low-impact-jumping-jacks"]},{"name":"Breathing & Rest","sets":1,"rest_sec":0,"exercises":["pursed-lip-breathing","labour-breathing-prep"]}],"cool_down":{"duration_sec":240,"exercises":["supported-wall-squat","side-lying-full-stretch","labour-breathing-prep"]}}',
 1, 1742860800000, 1742860800000),

-- 4. Nausea day (any trimester — 10 min, easy)
('tpl-nausea-day', 'nausea-day', 'Five minutes for you', 'For nausea days. Gentle breathing and seated movement only — no head-below-heart positions.', 'recovery', 'easy', 10,
 '{"warm_up":{"duration_sec":0,"exercises":[]},"blocks":[{"name":"Breathing","sets":1,"rest_sec":20,"exercises":["360-breathing","humming-bee-breath","pursed-lip-breathing"]},{"name":"Seated Movement","sets":1,"rest_sec":20,"exercises":["seated-pelvic-roll","ankle-pumps","seated-cardio-punch"]},{"name":"Rest","sets":1,"rest_sec":0,"exercises":["cooling-breath","mindful-body-check"]}],"cool_down":{"duration_sec":60,"exercises":["5-senses-grounding"]}}',
 1, 1742860800000, 1742860800000),

-- 5. Postnatal immediate (0–2 weeks — 10 min, easy)
('tpl-postnatal-immediate', 'postnatal-immediate', 'A gentle moment', 'First two weeks postnatal. Pelvic floor breathing and ankle pumps only. Rest is recovery.', 'recovery', 'easy', 10,
 '{"warm_up":{"duration_sec":0,"exercises":[]},"blocks":[{"name":"Pelvic Floor Breathing","sets":3,"rest_sec":30,"exercises":["pelvic-floor-breathing","360-breathing","exhalation-core-engagement"]},{"name":"Gentle Circulation","sets":1,"rest_sec":20,"exercises":["ankle-pumps","kegel-hold","mindful-body-check"]}],"cool_down":{"duration_sec":120,"exercises":["supported-side-lying-rest","breath-counting"]}}',
 1, 1742860800000, 1742860800000),

-- 6. Postnatal early (2–6/10 weeks — 15 min, easy)
('tpl-postnatal-early', 'postnatal-early', 'A gentle moment', 'Early postnatal recovery. Pelvic floor activation, heel slides, gentle mobility. No strength load.', 'recovery', 'easy', 15,
 '{"warm_up":{"duration_sec":60,"exercises":["pelvic-floor-breathing","ankle-pumps"]},"blocks":[{"name":"Pelvic Floor Foundation","sets":2,"rest_sec":30,"exercises":["kegel-hold","kegel-pulses","deep-core-activation"]},{"name":"Core Reconnection","sets":2,"rest_sec":30,"exercises":["heel-slides","pelvic-tilt-lying","modified-plank"]},{"name":"Gentle Mobility","sets":1,"rest_sec":20,"exercises":["cat-cow-pregnancy","standing-side-stretch","forearm-wrist-stretch"]}],"cool_down":{"duration_sec":120,"exercises":["supported-side-lying-rest","breath-counting"]}}',
 1, 1742860800000, 1742860800000),

-- 7. Postnatal rebuilding (6–16 weeks — 25 min, easy-moderate)
('tpl-postnatal-rebuild', 'postnatal-rebuild', 'Rebuilding your foundation', 'Rebuilding phase. Bodyweight strength reintroduced. Pelvic floor first, no crunch or high impact.', 'workout', 'moderate', 25,
 '{"warm_up":{"duration_sec":180,"exercises":["pelvic-floor-breathing","cat-cow-pregnancy","ankle-mobility-circles","standing-pelvic-rock"]},"blocks":[{"name":"Pelvic Floor First","sets":2,"rest_sec":30,"exercises":["kegel-elevator","deep-core-activation","exhalation-core-engagement"]},{"name":"Lower Body Strength","sets":3,"rest_sec":45,"exercises":["supported-glute-bridge","donkey-kick","clamshell","sumo-squat"]},{"name":"Upper Body","sets":2,"rest_sec":45,"exercises":["knee-push-up","dumbbell-seated-overhead-press","cross-body-shoulder-stretch"]}],"cool_down":{"duration_sec":180,"exercises":["seated-butterfly","standing-figure-four","pelvic-floor-breathing"]}}',
 1, 1742860800000, 1742860800000),

-- 8. Postnatal strengthening (16–26 weeks — 30 min, moderate)
('tpl-postnatal-strengthen', 'postnatal-strengthen', 'Today''s recovery', 'Strengthening phase. Dumbbells introduced. Progressive load with pelvic floor check-in.', 'workout', 'moderate', 30,
 '{"warm_up":{"duration_sec":180,"exercises":["pelvic-floor-breathing","cat-cow-pregnancy","standing-side-stretch","sumo-squat"]},"blocks":[{"name":"Pelvic Floor Activation","sets":1,"rest_sec":30,"exercises":["kegel-hold","deep-core-activation"]},{"name":"Strength","sets":3,"rest_sec":60,"exercises":["sumo-squat","dumbbell-romanian-deadlift","knee-push-up","dumbbell-lunge"]},{"name":"Accessory","sets":2,"rest_sec":45,"exercises":["side-plank","dumbbell-rear-delt-fly","single-leg-glute-bridge"]},{"name":"Pelvic Floor Cool-down","sets":1,"rest_sec":0,"exercises":["exhalation-core-engagement","pelvic-floor-breathing"]}],"cool_down":{"duration_sec":180,"exercises":["seated-butterfly","glute-piriformis-stretch","neck-shoulder-self-massage"]}}',
 1, 1742860800000, 1742860800000);

-- 0035: cycling_workouts table + seed (~23 structured workouts + 3 FTP tests)
-- Reference FTP for tss_estimate: 250W
-- Phase 1 foundation; Phase 3a uses this table for structured workout selection.
-- tss_estimate uses formula: sum of (duration_sec/3600 * IF^2 * 100) per interval block.

CREATE TABLE IF NOT EXISTS cycling_workouts (
  id             TEXT    PRIMARY KEY,
  slug           TEXT    UNIQUE NOT NULL,
  name           TEXT    NOT NULL,
  sub_goal       TEXT    NOT NULL, -- build_fitness|climbing|sprint|aerobic_base|race_fitness|any
  workout_type   TEXT    NOT NULL, -- endurance|sweet_spot|threshold|vo2max|anaerobic|test
  tss_estimate   REAL    NOT NULL, -- pre-computed at 250W FTP; scaled at plan time by user FTP
  duration_min   INTEGER NOT NULL, -- total session duration (minutes)
  intervals_json TEXT    NOT NULL, -- [{label,duration_sec,power_pct_low,power_pct_high,sets}]
  is_active      INTEGER NOT NULL DEFAULT 1
);

INSERT INTO cycling_workouts (id, slug, name, sub_goal, workout_type, tss_estimate, duration_min, intervals_json) VALUES

-- ── Build Fitness ──────────────────────────────────────────────────────────────

('cw01','cw-z2-45','Zone 2 · 45 min','build_fitness','endurance',32,45,
 '[{"label":"Zone 2","duration_sec":2700,"power_pct_low":55,"power_pct_high":75,"sets":1}]'),

('cw02','cw-ss-2x12','Sweet Spot · 2×12 min','build_fitness','sweet_spot',45,47,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":50,"power_pct_high":65,"sets":1},{"label":"Sweet spot","duration_sec":720,"power_pct_low":88,"power_pct_high":93,"sets":2},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":2},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw03','cw-tempo-30','Tempo · 30 min','build_fitness','threshold',42,45,
 '[{"label":"Warm-up","duration_sec":480,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Tempo","duration_sec":1800,"power_pct_low":76,"power_pct_high":90,"sets":1},{"label":"Cool-down","duration_sec":420,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw04','cw-cadence-pyramid','Cadence Pyramid · 35 min','build_fitness','endurance',25,35,
 '[{"label":"Warm-up","duration_sec":300,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Cadence block","duration_sec":300,"power_pct_low":60,"power_pct_high":75,"sets":5},{"label":"Recovery","duration_sec":120,"power_pct_low":50,"power_pct_high":60,"sets":5},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- ── Climbing ──────────────────────────────────────────────────────────────────

('cw05','cw-threshold-2x10','Threshold · 2×10 min','climbing','threshold',47,50,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Threshold","duration_sec":600,"power_pct_low":95,"power_pct_high":100,"sets":2},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":2},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw06','cw-vo2max-4x4','VO2max · 4×4 min','climbing','vo2max',50,52,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max","duration_sec":240,"power_pct_low":106,"power_pct_high":120,"sets":4},{"label":"Recovery","duration_sec":240,"power_pct_low":45,"power_pct_high":55,"sets":4},{"label":"Cool-down","duration_sec":480,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw07','cw-over-unders-3x9','Over-Unders · 3×9 min','climbing','threshold',60,55,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Over-under set","duration_sec":540,"power_pct_low":88,"power_pct_high":108,"sets":3},{"label":"Recovery","duration_sec":360,"power_pct_low":45,"power_pct_high":55,"sets":3},{"label":"Cool-down","duration_sec":420,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw08','cw-threshold-30','Long Threshold · 30 min','climbing','threshold',58,50,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Threshold","duration_sec":1800,"power_pct_low":95,"power_pct_high":100,"sets":1},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- ── Sprint Power ──────────────────────────────────────────────────────────────

('cw09','cw-sprint-vo2-sprint','Sprint–VO2–Sprint · 3 rounds','sprint','anaerobic',42,40,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Sprint","duration_sec":30,"power_pct_low":150,"power_pct_high":200,"sets":3},{"label":"VO2 effort","duration_sec":180,"power_pct_low":108,"power_pct_high":120,"sets":3},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":3},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw10','cw-anaerobic-6x30s','Anaerobic · 6×30 s','sprint','anaerobic',29,35,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Anaerobic","duration_sec":30,"power_pct_low":130,"power_pct_high":160,"sets":6},{"label":"Recovery","duration_sec":240,"power_pct_low":45,"power_pct_high":55,"sets":6},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw11','cw-cadence-builds','Cadence Builds · 5×4 min','sprint','endurance',25,35,
 '[{"label":"Warm-up","duration_sec":300,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Cadence build","duration_sec":240,"power_pct_low":60,"power_pct_high":75,"sets":5},{"label":"Recovery","duration_sec":120,"power_pct_low":45,"power_pct_high":55,"sets":5},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw12','cw-neuromuscular-10x10s','Neuromuscular · 10×10 s','sprint','anaerobic',25,30,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Sprint","duration_sec":10,"power_pct_low":150,"power_pct_high":200,"sets":10},{"label":"Recovery","duration_sec":120,"power_pct_low":45,"power_pct_high":55,"sets":10},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- ── Aerobic Base ──────────────────────────────────────────────────────────────

('cw13','cw-z2-45-base','Zone 2 · 45 min','aerobic_base','endurance',32,45,
 '[{"label":"Zone 2","duration_sec":2700,"power_pct_low":55,"power_pct_high":75,"sets":1}]'),

('cw14','cw-z2-60','Zone 2 · 60 min','aerobic_base','endurance',42,60,
 '[{"label":"Zone 2","duration_sec":3600,"power_pct_low":55,"power_pct_high":75,"sets":1}]'),

('cw15','cw-z2-90','Zone 2 · 90 min','aerobic_base','endurance',63,90,
 '[{"label":"Zone 2","duration_sec":5400,"power_pct_low":55,"power_pct_high":75,"sets":1}]'),

('cw16','cw-recovery-spin','Recovery Spin · 30 min','aerobic_base','endurance',15,30,
 '[{"label":"Recovery","duration_sec":1800,"power_pct_low":45,"power_pct_high":60,"sets":1}]'),

-- ── Race Fitness ──────────────────────────────────────────────────────────────

('cw17','cw-z2-60-race','Zone 2 · 60 min','race_fitness','endurance',42,60,
 '[{"label":"Zone 2","duration_sec":3600,"power_pct_low":55,"power_pct_high":75,"sets":1}]'),

('cw18','cw-vo2max-5x5','VO2max · 5×5 min','race_fitness','vo2max',74,65,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"VO2max","duration_sec":300,"power_pct_low":106,"power_pct_high":120,"sets":5},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":5},{"label":"Cool-down","duration_sec":600,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw19','cw-z2-sprints','Zone 2 + Sprints · 60 min','race_fitness','endurance',46,62,
 '[{"label":"Zone 2","duration_sec":3240,"power_pct_low":55,"power_pct_high":75,"sets":1},{"label":"Sprint","duration_sec":10,"power_pct_low":130,"power_pct_high":160,"sets":6},{"label":"Recovery","duration_sec":60,"power_pct_low":50,"power_pct_high":60,"sets":6}]'),

('cw20','cw-race-sim','Race Simulation · 60 min','race_fitness','threshold',62,60,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Race effort","duration_sec":2700,"power_pct_low":80,"power_pct_high":90,"sets":1},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

-- ── FTP Tests (sub_goal = any) ─────────────────────────────────────────────────
-- Formula: ramp → FTP = last_step_watts × 0.75
--          12min → FTP = avg_watts × 0.85
--          20min → FTP = avg_watts × 0.95

('cw21','cw-test-ramp','Ramp Test','any','test',45,25,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":50,"power_pct_high":65,"sets":1},{"label":"Ramp step","duration_sec":60,"power_pct_low":50,"power_pct_high":130,"sets":16},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw22','cw-test-12min','12-min FTP Test','any','test',38,32,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":70,"sets":1},{"label":"Pacing effort","duration_sec":300,"power_pct_low":100,"power_pct_high":110,"sets":1},{"label":"12-min all-out","duration_sec":720,"power_pct_low":95,"power_pct_high":110,"sets":1},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]'),

('cw23','cw-test-20min','20-min FTP Test','any','test',52,40,
 '[{"label":"Warm-up","duration_sec":600,"power_pct_low":55,"power_pct_high":70,"sets":1},{"label":"Pacing effort","duration_sec":300,"power_pct_low":100,"power_pct_high":110,"sets":1},{"label":"20-min all-out","duration_sec":1200,"power_pct_low":95,"power_pct_high":105,"sets":1},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]');

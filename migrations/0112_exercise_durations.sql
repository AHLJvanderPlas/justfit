-- 0112 — give every timed exercise a real duration.
--
-- The exercises table has no duration column; duration lives in
-- metrics_json.base_duration_sec, and 153 of 247 timed exercises simply did not
-- have it. plan.js falls back to `?? 30`, so "Marsen (6 km/u) - 40 minuten" was
-- prescribed as 2 x 18s with 40s rest: the only place the 40 minutes existed was
-- the name string. 57 exercises stated a duration in their name that the planner
-- could not see — 731 minutes of work in total.
--
-- It also disabled a guardrail silently: isLongCardio is `baseDuration > 300`,
-- so with everything defaulting to 30 a 50-minute Zone-2 run never qualified as
-- long cardio and never got its sets clamped to 1.
--
-- Two kinds of value are written here:
--   fixed_duration: true  — the NAME declares the prescription (a 40-minute
--     march is 40 minutes). The planner must not scale these; scaling a named
--     duration makes the card contradict the exercise title.
--   plain base_duration_sec — a station default by category/impact, which the
--     planner may scale by volume and experience as it always has.
--
-- Distance-target military runs are converted at zone pace (z1 6:30/km,
-- z2 5:45, z3 5:00, z4 4:30, z5 4:00). Interval names (3x1 minuut) set
-- base_duration_sec to the WORK interval and fixed_sets to the repeat count.

UPDATE exercises SET metrics_json = '{"supports": ["time", "intervals"], "base_duration_sec": 30}', updated_at_ms = 1790916159636 WHERE slug = 'jumping-jacks';
UPDATE exercises SET metrics_json = '{"supports": ["time", "intervals", "cadence"], "base_duration_sec": 30}', updated_at_ms = 1790916159636 WHERE slug = 'high-knees';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'step-touch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'shadow-boxing';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'heel-dig-march';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'grapevine-step';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'shuffle-tap';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'seated-cardio-punch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 30}', updated_at_ms = 1790916159636 WHERE slug = 'jump-rope-simulation';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'wide-step-touch';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30}', updated_at_ms = 1790916159636 WHERE slug = 'sprint-in-place';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 60}', updated_at_ms = 1790916159636 WHERE slug = 'weighted-march';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-5-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "distance"], "base_duration_sec": 720, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = '12-minuten-loop';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 300, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-5-minuten-warmup';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true, "fixed_sets": 1}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-1x5-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 420, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-7-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 600, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-10-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time"], "base_duration_sec": 858, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-2200-meter';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time"], "base_duration_sec": 1053, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-1-2700-meter';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 360, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-6-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 480, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-8-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 600, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-10-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 720, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-12-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1800, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-30-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 2100, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-35-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 2400, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-40-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 2700, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-45-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 3000, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-50-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 480, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-2x8-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 600, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-2x10-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 120, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-3x2-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-5x1-5-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time", "sets"], "base_duration_sec": 932, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-2-2700-meter';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 120, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-2-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 180, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-3-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 240, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-4-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 480, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-8-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 720, "fixed_duration": true}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-12-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 120, "fixed_duration": true, "fixed_sets": 1}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-1x2-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 180, "fixed_duration": true, "fixed_sets": 1}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-1x3-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 240, "fixed_duration": true, "fixed_sets": 1}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-1x4-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 180, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-2x3-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-2x5-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 360, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-2x6-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 60, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-3x1-minuut';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 120, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-3x2-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 180, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-3x3-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 360, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159636 WHERE slug = 'hardlopen-zone-3-3x6-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 480, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-3-3x8-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time", "sets"], "base_duration_sec": 810, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-3-2700-meter';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 120, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-3x2-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 60, "fixed_duration": true, "fixed_sets": 4}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-4x1-minuut';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 45, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-4x45-seconden';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 60, "fixed_duration": true, "fixed_sets": 5}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-5x1-minuut';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 60, "fixed_duration": true, "fixed_sets": 6}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-6x1-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time", "sets"], "base_duration_sec": 729, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-4-2700-meter';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-5-4x30-seconden';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-5-6x30-seconden';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 45, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-5-6x45-seconden';
UPDATE exercises SET metrics_json = '{"supports": ["distance", "time", "sets"], "base_duration_sec": 648, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'hardlopen-zone-5-2700-meter';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1500, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-25-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 600, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-10-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 600, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1200, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1200, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1500, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-25-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1800, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-30-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 300, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-5-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true, "fixed_sets": 3}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-5-5-km-u-3x5-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1800, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-30-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 600, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1200, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1200, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 480, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-2x8-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 480, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-8-minuten-rugzak-45kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1200, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-10kg';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 2400, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-40-minuten';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 1500, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-25-minuten-rugzak-10kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 300, "fixed_duration": true, "fixed_sets": 4}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-4x5-minuten-rugzak-10kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 600, "fixed_duration": true, "fixed_sets": 2}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-35kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 360, "fixed_duration": true}', updated_at_ms = 1790916159637 WHERE slug = 'marsen-6-km-u-6-minuten-rugzak-45kg';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30}', updated_at_ms = 1790916159637 WHERE slug = 'jump-rope-basic';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30}', updated_at_ms = 1790916159637 WHERE slug = 'jump-rope-intervals';
UPDATE exercises SET metrics_json = '{"supports": ["time", "distance"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'trail-hike-steady';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 30}', updated_at_ms = 1790916159637 WHERE slug = 'trail-hill-repeats';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = '90-90-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'hip-flexor-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'standing-quad-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'neck-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'standing-forward-fold';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'pigeon-pose';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'seated-spinal-twist';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'downward-dog';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'warrior-i-pose';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'thread-the-needle';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'chest-opener-arms';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'standing-figure-four';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'half-kneeling-hip-opener';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'cross-body-shoulder-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'side-lying-quad-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'seated-butterfly';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'standing-side-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'overhead-reach-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'wall-chest-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'seated-hamstring-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'standing-hamstring-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'supported-wall-squat';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'side-lying-full-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'forearm-wrist-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'glute-piriformis-stretch';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'mat-supine-spinal-twist';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'childs-pose';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'box-breathing';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'progressive-muscle-relaxation';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'body-scan-meditation';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'ocean-breath';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'breath-counting';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = '5-senses-grounding';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'tension-release-visualization';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'gratitude-reflection';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'savasana';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'supported-side-lying-rest';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'legs-up-wall';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'neck-shoulder-self-massage';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'self-massage-feet';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'labour-breathing-prep';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'mindful-body-check';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'eye-palming';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'cooling-down';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 60}', updated_at_ms = 1790916159637 WHERE slug = 'warming-up';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 45}', updated_at_ms = 1790916159637 WHERE slug = 'til-draagtest-gewicht-plaatsen-naar-heupen';
UPDATE exercises SET metrics_json = '{"supports": ["time"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'wall-sit';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'side-plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'modified-plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'sphinx-hold';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'flutter-kicks';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'optillen-vanaf-de-grond';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'heup-brug';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'optillen-vanaf-de-grond-rugzak';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'shoulder-tap';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'voorwaartse-plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'zijwaartse-plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'doorway-isometric-row';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'stability-ball-plank';
UPDATE exercises SET metrics_json = '{"supports": ["weight", "time", "sets"], "load_type": "dumbbell_single", "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'suitcase-carry';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'copenhagen-plank';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'bear-crawl-hold';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'soleus-wall-sit';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'toe-walk';
UPDATE exercises SET metrics_json = '{"supports": ["time", "sets"], "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'heel-walk';
UPDATE exercises SET metrics_json = '{"supports": ["weight", "time", "sets"], "load_type": "dumbbell_single", "base_duration_sec": 40}', updated_at_ms = 1790916159637 WHERE slug = 'kettlebell-farmers-carry';

-- Migration 0021: Exercise Injury Contraindication Tags (MVP)
--
-- Adds four tags to affected exercises so the planner can filter them
-- when a user reports specific area pain (R562–R563):
--
--   loads_knee      — squats, lunges, running, jumping, step-ups
--   loads_shoulder  — push-ups, pull-ups, planks, overhead pressing
--   loads_lower_back — deadlifts, bent-over rows, back extensions, rowing
--   loads_ankle     — running, jumping, calf raises, lateral movements
--
-- SQLite json_insert '$[#]' appends to an existing array without
-- overwriting any other tags. COALESCE handles any NULL tags_json.
-- Non-existent slugs in the IN list are silently ignored.

-- ── loads_knee ───────────────────────────────────────────────────
UPDATE exercises
SET tags_json     = json_insert(COALESCE(tags_json,'[]'), '$[#]', 'loads_knee'),
    updated_at_ms = 1744900000000
WHERE slug IN (
  -- bodyweight squats / lunges / jumps
  'air-squat','goblet-squat','sumo-squat','squat-pulse',
  'wall-sit','supported-wall-squat',
  'forward-lunge','reverse-lunge','curtsy-lunge','lateral-lunge',
  'jump-squat','tuck-jump','burpee','modified-burpee',
  'box-step-up','skater-hop',
  'jumping-jacks','low-impact-jumping-jacks',
  'stair-climb-simulation',
  -- dumbbell / band / kettlebell squat & lunge variants
  'dumbbell-lunge','dumbbell-goblet-squat','dumbbell-bulgarian-split-squat',
  'dumbbell-side-lunge','kettlebell-goblet-squat','band-squat',
  'pistol-squat-assist',
  -- cardio movements with knee load
  'jumping-jack','speed-skater','broad-jump','power-step-up-jump',
  'walking-lunge','reverse-lunge-kick',
  -- running — outdoor
  'easy-run-outdoor','tempo-run-outdoor','run-intervals-outdoor',
  'brisk-walk','trail-run-easy',
  -- running — treadmill (from 0012)
  'treadmill-run-steady','treadmill-hiit','treadmill-zone2',
  -- running — generic (from 0020)
  'zone2-easy-run','fartlek-run','hill-repeats-running',
  'stride-outs','treadmill-intervals','treadmill-hill-run',
  -- run interval levels (from 0015)
  'run-interval-level-1','run-interval-level-2','run-interval-level-3',
  'run-interval-level-4','run-interval-level-5','run-interval-level-6',
  -- run continuous levels (from 0016)
  'run-continuous-level-7','run-continuous-level-8','run-continuous-level-9',
  'run-continuous-level-10','run-continuous-level-11','run-continuous-level-12',
  'run-continuous-level-13','run-continuous-level-14','run-continuous-level-15',
  'run-continuous-level-16','run-continuous-level-17','run-continuous-level-18',
  'run-continuous-level-19','run-continuous-level-20','run-continuous-level-21',
  -- run warmups (from 0016)
  'run-warmup-high-knees-march','run-warmup-leg-swings',
  'run-warmup-hip-circles','run-warmup-calf-raises'
);

-- ── loads_shoulder ───────────────────────────────────────────────
UPDATE exercises
SET tags_json     = json_insert(COALESCE(tags_json,'[]'), '$[#]', 'loads_shoulder'),
    updated_at_ms = 1744900000000
WHERE slug IN (
  -- push variants
  'push-up','wall-push-up','knee-push-up','incline-push-up',
  'diamond-push-up','pike-push-up',
  -- planks (shoulder stability / pressing angle)
  'plank','modified-plank','side-plank','plank-shoulder-tap',
  -- compound movements with significant shoulder demand
  'mountain-climbers','bear-crawl',
  -- overhead pressing
  'dumbbell-shoulder-press','dumbbell-seated-overhead-press','dumbbell-arnold-press',
  'dumbbell-front-raise','dumbbell-upright-row',
  'band-overhead-press','kettlebell-single-arm-press',
  -- pull-up bar (shoulder joint load)
  'pull-up','chin-up','dead-hang','scapular-retraction-hang','hanging-leg-raise',
  -- rows with significant shoulder involvement
  'dumbbell-renegade-row','band-face-pull','band-pull-apart',
  -- chest press / fly
  'dumbbell-incline-chest-press','dumbbell-floor-press',
  'dumbbell-floor-chest-fly','dumbbell-chest-press-floor',
  -- lateral / rear delt
  'dumbbell-lateral-raise','dumbbell-rear-delt-fly',
  -- boxing / speed bag (shoulder endurance)
  'speed-bag-simulation','boxing-combination'
);

-- ── loads_lower_back ─────────────────────────────────────────────
UPDATE exercises
SET tags_json     = json_insert(COALESCE(tags_json,'[]'), '$[#]', 'loads_lower_back'),
    updated_at_ms = 1744900000000
WHERE slug IN (
  -- deadlift variants
  'dumbbell-deadlift','dumbbell-romanian-deadlift','dumbbell-sumo-deadlift',
  'kettlebell-deadlift','kettlebell-swing',
  -- good morning / hip hinge
  'good-morning-bodyweight',
  -- bent-over rows (lumbar in isometric extension)
  'dumbbell-row','dumbbell-bent-over-row','dumbbell-single-arm-row',
  -- back extensions / hypers
  'superman-hold','prone-hip-extension',
  -- rotational with spinal load
  'dumbbell-wood-chop',
  -- single-leg RDL (significant lumbar control demand)
  'dumbbell-single-leg-rdl','kettlebell-single-leg-rdl',
  -- rowing machine (lumbar flexion + drive)
  'rowing-steady-state','rowing-intervals',
  'rowing-2k-time-trial','rowing-pyramid-intervals',
  'rowing-power-strokes','rowing-zone2','rowing-technique-drill'
);

-- ── loads_ankle ──────────────────────────────────────────────────
UPDATE exercises
SET tags_json     = json_insert(COALESCE(tags_json,'[]'), '$[#]', 'loads_ankle'),
    updated_at_ms = 1744900000000
WHERE slug IN (
  -- running — all variants (same set as loads_knee)
  'easy-run-outdoor','tempo-run-outdoor','run-intervals-outdoor',
  'brisk-walk','trail-run-easy',
  'treadmill-run-steady','treadmill-hiit','treadmill-zone2',
  'zone2-easy-run','fartlek-run','hill-repeats-running',
  'stride-outs','treadmill-intervals','treadmill-hill-run',
  'run-interval-level-1','run-interval-level-2','run-interval-level-3',
  'run-interval-level-4','run-interval-level-5','run-interval-level-6',
  'run-continuous-level-7','run-continuous-level-8','run-continuous-level-9',
  'run-continuous-level-10','run-continuous-level-11','run-continuous-level-12',
  'run-continuous-level-13','run-continuous-level-14','run-continuous-level-15',
  'run-continuous-level-16','run-continuous-level-17','run-continuous-level-18',
  'run-continuous-level-19','run-continuous-level-20','run-continuous-level-21',
  'run-warmup-calf-raises',
  -- jumping movements
  'jump-squat','tuck-jump','burpee','modified-burpee','skater-hop',
  'jumping-jacks','jumping-jack','broad-jump','power-step-up-jump',
  'speed-skater',
  -- calf / ankle specific
  'calf-raise','single-leg-calf-raise',
  -- lateral ground movements
  'lateral-shuffle-drill','band-lateral-walk','grapevine-step',
  -- step ups
  'box-step-up',
  -- existing high-knees in DB
  'high-knees',
  -- stair
  'stair-climb-simulation',
  -- sprint
  'sprint-in-place'
);

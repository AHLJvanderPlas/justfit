-- Migration 0053: sport_support exercise tags
-- Adds sport_support:{sport} tags to exercises that specifically benefit athletes
-- doing that sport — used by R551 to prefer these within the gap-axis pool.
-- Tag format: "sport_support:running", "sport_support:cycling", etc.

-- ── Running ────────────────────────────────────────────────────────────────
-- Posterior chain, single-leg stability, and hip strength complement running's
-- high knee-dominant / repetitive loading pattern.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:running')
WHERE slug IN (
  'glute-bridge', 'dumbbell-hip-thrust', 'dumbbell-romanian-deadlift',
  'dumbbell-single-leg-rdl', 'kettlebell-single-leg-rdl', 'single-leg-deadlift',
  'nordic-hamstring-curl', 'good-morning-bodyweight', 'kettlebell-swing',
  'bird-dog', 'band-hip-abduction-standing', 'band-lateral-walk',
  'donkey-kick', 'fire-hydrant', 'single-leg-glute-bridge', 'dumbbell-bent-over-row'
)
AND tags_json NOT LIKE '%sport_support:running%';

-- ── Cycling ────────────────────────────────────────────────────────────────
-- Upper back, thoracic mobility, and core anti-extension complement cycling's
-- sustained hip-flexed, hunched-forward position.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:cycling')
WHERE slug IN (
  'dumbbell-bent-over-row', 'thread-the-needle', 'active-thoracic-rotation',
  'seated-thoracic-rotation', 'thoracic-extension-chair', 'bird-dog', 'cat-cow',
  'hip-flexor-stretch', 'couch-stretch', 'lunge-thoracic-rotation',
  'dumbbell-bent-over-row'
)
AND tags_json NOT LIKE '%sport_support:cycling%';

-- ── Swimming ───────────────────────────────────────────────────────────────
-- Shoulder stability and lower-body strength complement swimming's
-- shoulder-dominant pull pattern.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:swimming')
WHERE slug IN (
  'cross-body-shoulder-stretch', 'shoulder-circles-active', 'chest-opener-arms',
  'wall-chest-stretch', 'glute-bridge', 'dumbbell-single-leg-rdl',
  'band-lateral-walk', 'bird-dog'
)
AND tags_json NOT LIKE '%sport_support:swimming%';

-- ── Rowing ─────────────────────────────────────────────────────────────────
-- Hip hinge strength, thoracic extension, and core complement rowing's
-- repetitive spinal flexion under load.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:rowing')
WHERE slug IN (
  'dumbbell-bent-over-row', 'dumbbell-romanian-deadlift', 'glute-bridge',
  'bird-dog', 'cat-cow', 'active-thoracic-rotation', 'thoracic-extension-chair',
  'good-morning-bodyweight', 'lunge-thoracic-rotation'
)
AND tags_json NOT LIKE '%sport_support:rowing%';

-- ── Football ───────────────────────────────────────────────────────────────
-- Lateral hip stability and single-leg strength complement football's
-- explosive, multidirectional loading.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:football')
WHERE slug IN (
  'band-hip-abduction-standing', 'band-lateral-walk', 'nordic-hamstring-curl',
  'glute-bridge', 'single-leg-glute-bridge', 'dumbbell-single-leg-rdl',
  'kettlebell-swing', 'bird-dog', 'dumbbell-romanian-deadlift'
)
AND tags_json NOT LIKE '%sport_support:football%';

-- ── Climbing ───────────────────────────────────────────────────────────────
-- Pull strength, antagonist push balance, and core tension complement
-- climbing's grip-dominant, upper-body-pull pattern.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_support:climbing')
WHERE slug IN (
  'dumbbell-bent-over-row', 'bird-dog', 'cat-cow',
  'glute-bridge', 'band-hip-abduction-standing', 'shoulder-circles-active',
  'active-thoracic-rotation'
)
AND tags_json NOT LIKE '%sport_support:climbing%';

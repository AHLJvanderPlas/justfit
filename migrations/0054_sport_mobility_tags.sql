-- Migration 0054: sport_mobility exercise tags
-- Adds sport_mobility:{sport} tags to mobility/recovery exercises that specifically
-- address the flexibility and joint-health gaps created by each sport.
-- Used by R561 to inject one sport-specific mobility exercise per session.
-- Tag format: "sport_mobility:running", "sport_mobility:cycling", etc.

-- ── Running ────────────────────────────────────────────────────────────────
-- Hip flexors, hamstrings, calves, and thoracic spine are the primary tightness
-- areas caused by repetitive forward-locomotion patterns.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:running')
WHERE slug IN (
  'hip-flexor-stretch', 'couch-stretch', 'pigeon-pose',
  'lying-hamstring-stretch', 'calf-stretch-wall', '90-90-stretch',
  'ninety-ninety-hip-switch', 'half-kneeling-hip-opener',
  'lunge-thoracic-rotation', 'world-greatest-stretch', 'glute-piriformis-stretch'
)
AND tags_json NOT LIKE '%sport_mobility:running%';

-- ── Cycling ────────────────────────────────────────────────────────────────
-- Hip flexors, thoracic spine, and chest/shoulder are tight from sustained
-- aerodynamic position.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:cycling')
WHERE slug IN (
  'hip-flexor-stretch', 'couch-stretch', 'thoracic-extension-chair',
  'active-thoracic-rotation', 'seated-thoracic-rotation',
  'chest-opener-arms', 'wall-chest-stretch', 'thread-the-needle',
  'cat-cow', 'lunge-thoracic-rotation'
)
AND tags_json NOT LIKE '%sport_mobility:cycling%';

-- ── Swimming ───────────────────────────────────────────────────────────────
-- Shoulder internal rotation and thoracic extension are the primary stiffness
-- areas from repeated overhead pulling.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:swimming')
WHERE slug IN (
  'cross-body-shoulder-stretch', 'chest-opener-arms', 'wall-chest-stretch',
  'shoulder-circles-active', 'thread-the-needle', 'active-thoracic-rotation',
  'cat-cow'
)
AND tags_json NOT LIKE '%sport_mobility:swimming%';

-- ── Rowing ─────────────────────────────────────────────────────────────────
-- Thoracic spine and hip flexors are stressed by the repetitive spinal flexion
-- under load in rowing.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:rowing')
WHERE slug IN (
  'thoracic-extension-chair', 'active-thoracic-rotation', 'seated-thoracic-rotation',
  'thread-the-needle', 'cat-cow', 'hip-flexor-stretch', 'couch-stretch',
  'lunge-thoracic-rotation'
)
AND tags_json NOT LIKE '%sport_mobility:rowing%';

-- ── Football ───────────────────────────────────────────────────────────────
-- Hip rotators, groin, and ankle mobility are stressed by multidirectional
-- explosive movements.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:football')
WHERE slug IN (
  '90-90-stretch', 'ninety-ninety-hip-switch', 'pigeon-pose',
  'glute-piriformis-stretch', 'world-greatest-stretch', 'half-kneeling-hip-opener',
  'lunge-thoracic-rotation', 'lying-hamstring-stretch'
)
AND tags_json NOT LIKE '%sport_mobility:football%';

-- ── Skiing ─────────────────────────────────────────────────────────────────
-- Hip flexors, quads, and ankles are tight from sustained flexed-knee, forward-lean
-- skiing position.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:skiing')
WHERE slug IN (
  'hip-flexor-stretch', 'couch-stretch', '90-90-stretch',
  'pigeon-pose', 'world-greatest-stretch', 'cat-cow',
  'lunge-thoracic-rotation'
)
AND tags_json NOT LIKE '%sport_mobility:skiing%';

-- ── CrossFit ───────────────────────────────────────────────────────────────
-- Thoracic spine, hips, and shoulders need maintenance given the variety of
-- overhead, squat, and hinge movements.
UPDATE exercises
SET tags_json = json_insert(tags_json, '$[#]', 'sport_mobility:crossfit')
WHERE slug IN (
  'world-greatest-stretch', 'lunge-thoracic-rotation', 'active-thoracic-rotation',
  'cat-cow', 'pigeon-pose', '90-90-stretch',
  'chest-opener-arms', 'shoulder-circles-active'
)
AND tags_json NOT LIKE '%sport_mobility:crossfit%';

-- 0030_military_tags.sql
-- Add 'military' tag to all exercises used in military training sessions.
-- Already tagged (from 0029): hand-release-push-up, weighted-march, 12-minute-cooper-test
-- This migration tags the remaining 15 exercises used in military circuits/strength/assessment.

UPDATE exercises
SET tags_json     = json_insert(tags_json, '$[#]', 'military'),
    updated_at_ms = 1767830400000
WHERE slug IN (
  'push-up',
  'squat',
  'lunge',
  'plank',
  'mountain-climber',
  'bicycle-crunch',
  'flutter-kicks',
  'scissor-jump',
  'plyometric-push-up',
  'back-squat',
  'front-squat',
  'clean-pull',
  'high-pull',
  'counter-movement-jump',
  'single-leg-deadlift'
)
AND tags_json NOT LIKE '%military%';

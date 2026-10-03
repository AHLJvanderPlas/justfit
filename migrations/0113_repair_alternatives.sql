-- 0113 — repair the exercise substitution graph (W0.2).
--
-- `alternatives_json.substitutions` held 400 links, of which 29 targets do not
-- exist in the library at all. WorkoutView fetches alternatives by slug, so those
-- links resolve to nothing: 16 exercises offered fewer alternatives than they
-- advertised and 5 opened a completely empty sheet — a control that does nothing,
-- the same failure shape as the unreachable self-assessment screen.
--
-- Dangling targets are dropped. The five exercises left with nothing get curated
-- replacements, except the Cooper test: a standardised test has no substitute by
-- definition, since swapping it out invalidates the measurement it exists to
-- produce, so its alternatives are removed rather than replaced.

UPDATE exercises SET alternatives_json = '{"substitutions": ["mountain-climbers"]}', updated_at_ms = 1791030356363 WHERE slug = 'burpee';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees"]}', updated_at_ms = 1791030356363 WHERE slug = 'jumping-jacks';
UPDATE exercises SET alternatives_json = '{"substitutions": ["march-in-place", "jumping-jacks", "heel-dig-march"]}', updated_at_ms = 1791030356363 WHERE slug = 'high-knees';
UPDATE exercises SET alternatives_json = '{"substitutions": ["high-knees"]}', updated_at_ms = 1791030356363 WHERE slug = 'mountain-climbers';
UPDATE exercises SET alternatives_json = '{"substitutions": ["march-in-place", "heel-dig-march"]}', updated_at_ms = 1791030356363 WHERE slug = 'weighted-march';
UPDATE exercises SET alternatives_json = NULL, updated_at_ms = 1791030356363 WHERE slug = '12-minute-cooper-test';
UPDATE exercises SET alternatives_json = '{"substitutions": ["thread-the-needle"]}', updated_at_ms = 1791030356363 WHERE slug = 'cat-cow';
UPDATE exercises SET alternatives_json = '{"substitutions": ["pigeon-pose", "hip-flexor-stretch"]}', updated_at_ms = 1791030356363 WHERE slug = '90-90-stretch';
UPDATE exercises SET alternatives_json = '{"substitutions": ["cat-cow", "supine-knee-to-chest", "happy-baby-pose"]}', updated_at_ms = 1791030356363 WHERE slug = 'childs-pose';
UPDATE exercises SET alternatives_json = '{"substitutions": ["goblet-squat"]}', updated_at_ms = 1791030356363 WHERE slug = 'air-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["single-leg-glute-bridge"]}', updated_at_ms = 1791030356363 WHERE slug = 'glute-bridge';
UPDATE exercises SET alternatives_json = '{"substitutions": ["air-squat", "front-squat"]}', updated_at_ms = 1791030356363 WHERE slug = 'goblet-squat';
UPDATE exercises SET alternatives_json = '{"substitutions": ["push-up", "incline-push-up"]}', updated_at_ms = 1791030356363 WHERE slug = 'dumbbell-floor-press';
UPDATE exercises SET alternatives_json = '{"substitutions": ["band-row-seated", "band-bent-over-row", "doorway-isometric-row"]}', updated_at_ms = 1791030356363 WHERE slug = 'dumbbell-row';
UPDATE exercises SET alternatives_json = '{"substitutions": ["dumbbell-arnold-press"]}', updated_at_ms = 1791030356363 WHERE slug = 'kettlebell-halo';
UPDATE exercises SET alternatives_json = '{"substitutions": ["bird-dog"]}', updated_at_ms = 1791030356363 WHERE slug = 'single-leg-deadlift';

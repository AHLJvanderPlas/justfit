-- 0055: Seed why + muscle_target into instructions_json for all active exercises.
--
-- 'why'           : category-level explanation of why this exercise type helps.
--                   Client-side derivedWhy() already does this; seeding here makes it
--                   stable in API responses and available to any future client.
-- 'muscle_target' : broad anatomical target derived from category + tags.
--                   Name-based refinement (e.g. "Chest & Triceps" from slug patterns)
--                   remains client-side in deriveTarget() and is displayed on top of this.
--
-- Only updates rows where both fields are absent (idempotent re-run safe).

UPDATE exercises
SET instructions_json = json_patch(
  COALESCE(instructions_json, '{}'),
  json_object(
    'why', CASE category
      WHEN 'strength' THEN 'Progressive strength training builds lean muscle, improves bone density, and raises your resting metabolism — the returns compound over time.'
      WHEN 'cardio'   THEN 'Cardiovascular training strengthens your heart and lungs, expands aerobic capacity, and burns energy efficiently — the base that makes everything else feel easier.'
      WHEN 'mobility' THEN 'Mobility work keeps joints healthy, reduces injury risk, and improves the quality of every strength and cardio movement you do.'
      WHEN 'recovery' THEN 'Active recovery accelerates tissue repair, keeps blood moving, and prepares your body to train again sooner.'
      WHEN 'skill'    THEN 'Skill training builds neuromuscular coordination — the connection between brain and muscle that makes movement efficient and automatic.'
      WHEN 'mixed'    THEN 'Mixed-mode training challenges multiple energy systems and movement patterns simultaneously, building broad functional fitness.'
      ELSE 'Consistent movement in this pattern builds the physical capacity your goal requires.'
    END,
    'muscle_target', CASE
      WHEN instructions_json LIKE '%"pelvic_floor"%'
        OR tags_json LIKE '%"pelvic_floor"%'  THEN 'Pelvic Floor'
      WHEN tags_json LIKE '%"crunch"%'         THEN 'Core & Abs'
      WHEN tags_json LIKE '%"core"%'           THEN 'Core & Stability'
      WHEN category = 'recovery'               THEN 'Full Body — Recovery'
      WHEN category = 'mobility'               THEN 'Flexibility & Joints'
      WHEN category = 'cardio'                 THEN 'Cardiovascular System'
      WHEN tags_json LIKE '%"bodyweight"%'
        AND category = 'strength'              THEN 'Full Body Strength'
      WHEN category = 'strength'               THEN 'Muscle & Strength'
      WHEN category = 'skill'                  THEN 'Coordination & Control'
      ELSE 'Full Body'
    END
  )
)
WHERE is_active = 1
  AND json_extract(COALESCE(instructions_json, '{}'), '$.why') IS NULL
  AND json_extract(COALESCE(instructions_json, '{}'), '$.muscle_target') IS NULL;

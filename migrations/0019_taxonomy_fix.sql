-- Migration 0019: Equipment taxonomy normalization
--
-- Problems fixed:
--   1. cycling-intervals-indoor was indoor_bike only — exercise_bike users excluded
--   2. stationary-bike-steady was exercise_bike only — indoor_bike users excluded
--   3. easy-run-outdoor / tempo-run-outdoor: running_shoes only is correct (outdoor-specific instructions)
--      but we add a treadmill-usable zone2 run in 0020 to fill the gap
--
-- Rule: any cycling exercise whose instructions are valid on a stationary indoor setup
--       should list all indoor cycling equipment variants.

UPDATE exercises
SET equipment_required_json = '["indoor_bike","exercise_bike"]',
    updated_at_ms = 1744700000000
WHERE slug = 'cycling-intervals-indoor';

UPDATE exercises
SET equipment_required_json = '["exercise_bike","indoor_bike"]',
    updated_at_ms = 1744700000000
WHERE slug = 'stationary-bike-steady';

-- steady-indoor-cycle is smart-trainer / power-meter specific — keep as indoor_bike only.
-- easy-run-outdoor, tempo-run-outdoor, run-intervals-outdoor — outdoor instructions, keep running_shoes only.
-- treadmill-run-steady — keep treadmill only.
-- rowing exercises — correct as-is.

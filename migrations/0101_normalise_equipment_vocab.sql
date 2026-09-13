-- Migration 0101: normalise orphan equipment terms
--
-- Four cycling exercises required `stationary_bike` / `outdoor_bike`. Neither term
-- appears in EQUIPMENT_OPTIONS or ALL_EQUIPMENT, so no user could ever declare
-- them: the exercises were unreachable. They also fell outside CYCLING_EQUIPMENT,
-- so they never triggered the cycling coach (R557) either.
--
-- Canonical terms: exercise_bike (indoor/stationary), road_bike (outdoor).
-- Outdoor rides list both road and mountain so either bike satisfies them.

UPDATE exercises
   SET equipment_required_json = '["exercise_bike"]'
 WHERE is_active = 1 AND equipment_required_json LIKE '%stationary_bike%';

UPDATE exercises
   SET equipment_required_json = '["road_bike"]'
 WHERE is_active = 1 AND equipment_required_json LIKE '%outdoor_bike%';

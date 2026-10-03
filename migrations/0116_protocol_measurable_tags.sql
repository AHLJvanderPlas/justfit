-- 0116 — seed the `protocol` and `measurable` tags (W5.3).
--
-- R596 (civilian pool) and R598 (self-assessment) were inferring these two ideas
-- from category + equipment + fixed_duration. They are properties of the exercise,
-- so they are recorded as tags and the planner can read them instead.
--
--   protocol   a Defence programme PRESCRIPTION, not a general movement: the
--              marsen-* and hardlopen-* families, the Cooper test and its 12-minute
--              loop, weighted-march, the til-draagtest-* tests, graaftest,
--              optillen-vanaf-de-grond and its -rugzak sibling, and anything that
--              requires a rucksack. 77 exercises.
--              NOT tagged, although they carry `military`: push-up, plank, squat,
--              lunge, sit-up and the other general strength movements.
--   measurable the exercises the self-assessment (R598) scores: push-up,
--              knee-push-up, wall-push-up, sit-up, bent-knee-sit-up,
--              anchored-sit-up and the 12-minute Cooper test. 7 exercises.
--
-- Tags are appended to the existing tags_json and the array is de-duplicated
-- (several rows carried repeated loads_* tags, which are collapsed). Nothing else
-- in the array is removed or reordered. 83 rows written; 12-minute-cooper-test
-- receives both tags.
--
-- protocol:
--   weighted-march
--   12-minute-cooper-test
--   hardlopen-zone-3-5-minuten
--   12-minuten-loop
--   hardlopen-zone-1-5-minuten-warmup
--   hardlopen-zone-1-1x5-minuten
--   hardlopen-zone-1-7-minuten
--   hardlopen-zone-1-10-minuten
--   hardlopen-zone-1-2200-meter
--   hardlopen-zone-1-2700-meter
--   hardlopen-zone-2-6-minuten
--   hardlopen-zone-2-8-minuten
--   hardlopen-zone-2-10-minuten
--   hardlopen-zone-2-12-minuten
--   hardlopen-zone-2-30-minuten
--   hardlopen-zone-2-35-minuten
--   hardlopen-zone-2-40-minuten
--   hardlopen-zone-2-45-minuten
--   hardlopen-zone-2-50-minuten
--   hardlopen-zone-2-2x8-minuten
--   hardlopen-zone-2-2x10-minuten
--   hardlopen-zone-2-3x2-minuten
--   hardlopen-zone-2-5x1-5-minuten
--   hardlopen-zone-2-2700-meter
--   hardlopen-zone-3-2-minuten
--   hardlopen-zone-3-3-minuten
--   hardlopen-zone-3-4-minuten
--   hardlopen-zone-3-8-minuten
--   hardlopen-zone-3-12-minuten
--   hardlopen-zone-3-1x2-minuten
--   hardlopen-zone-3-1x3-minuten
--   hardlopen-zone-3-1x4-minuten
--   hardlopen-zone-3-2x3-minuten
--   hardlopen-zone-3-2x5-minuten
--   hardlopen-zone-3-2x6-minuten
--   hardlopen-zone-3-3x1-minuut
--   hardlopen-zone-3-3x2-minuten
--   hardlopen-zone-3-3x3-minuten
--   hardlopen-zone-3-3x6-minuten
--   hardlopen-zone-3-3x8-minuten
--   hardlopen-zone-3-2700-meter
--   hardlopen-zone-4-3x2-minuten
--   hardlopen-zone-4-4x1-minuut
--   hardlopen-zone-4-4x45-seconden
--   hardlopen-zone-4-5x1-minuut
--   hardlopen-zone-4-6x1-minuten
--   hardlopen-zone-4-2700-meter
--   hardlopen-zone-5-4x30-seconden
--   hardlopen-zone-5-6x30-seconden
--   hardlopen-zone-5-6x45-seconden
--   hardlopen-zone-5-2700-meter
--   marsen-5-5-km-u-25-minuten
--   marsen-5-5-km-u-10-minuten-rugzak-35kg
--   marsen-5-5-km-u-2x10-minuten-rugzak-25kg
--   marsen-5-5-km-u-20-minuten-rugzak-25kg
--   marsen-5-5-km-u-20-minuten-rugzak-35kg
--   marsen-5-5-km-u-25-minuten-rugzak-25kg
--   marsen-5-5-km-u-30-minuten-rugzak-25kg
--   marsen-5-5-km-u-5-minuten-rugzak-35kg
--   marsen-5-5-km-u-3x5-minuten-rugzak-35kg
--   marsen-6-km-u-30-minuten
--   marsen-6-km-u-2x10-minuten-rugzak-25kg
--   marsen-6-km-u-20-minuten-rugzak-25kg
--   marsen-6-km-u-20-minuten-rugzak-35kg
--   marsen-6-km-u-2x8-minuten-rugzak-35kg
--   marsen-6-km-u-8-minuten-rugzak-45kg
--   marsen-6-km-u-20-minuten-rugzak-10kg
--   marsen-6-km-u-40-minuten
--   marsen-6-km-u-25-minuten-rugzak-10kg
--   marsen-6-km-u-4x5-minuten-rugzak-10kg
--   marsen-6-km-u-2x10-minuten-rugzak-35kg
--   marsen-6-km-u-6-minuten-rugzak-45kg
--   til-draagtest-gewicht-plaatsen-naar-heupen
--   til-draagtest-full-exercise
--   graaftest
--   optillen-vanaf-de-grond
--   optillen-vanaf-de-grond-rugzak

UPDATE exercises SET tags_json = '["cardio","outdoor","military","weighted","low_impact","loads_lower_back","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'weighted-march';
UPDATE exercises SET tags_json = '["cardio","outdoor","assessment","military","running","protocol","measurable"]', updated_at_ms = 1791032562000 WHERE slug = '12-minute-cooper-test';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-5-minuten';
UPDATE exercises SET tags_json = '["running","fitness-test","baseline","endurance","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = '12-minuten-loop';
UPDATE exercises SET tags_json = '["running","zone-1","warm-up","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-5-minuten-warmup';
UPDATE exercises SET tags_json = '["running","zone-1","endurance","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-1x5-minuten';
UPDATE exercises SET tags_json = '["running","zone-1","endurance","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-7-minuten';
UPDATE exercises SET tags_json = '["running","zone-1","endurance","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-10-minuten';
UPDATE exercises SET tags_json = '["running","zone-1","endurance","distance-target","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-2200-meter';
UPDATE exercises SET tags_json = '["running","zone-1","endurance","distance-target","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-2700-meter';
UPDATE exercises SET tags_json = '["running","zone-2","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-6-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-8-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-10-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-12-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","steady-state","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-30-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","steady-state","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-35-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","steady-state","long-run","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-40-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","steady-state","long-run","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-45-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","steady-state","long-run","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-50-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2x8-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2x10-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-3x2-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-5x1-5-minuten';
UPDATE exercises SET tags_json = '["running","zone-2","intervals","distance-target","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2700-meter';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-4-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-8-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-12-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x2-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x3-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x4-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x3-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x5-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x6-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","repeats","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x1-minuut';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x2-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x3-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x6-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x8-minuten';
UPDATE exercises SET tags_json = '["running","zone-3","threshold","distance-target","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2700-meter';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-3x2-minuten';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","repeats","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-4x1-minuut';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","repeats","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-4x45-seconden';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","repeats","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-5x1-minuut';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","repeats","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-6x1-minuten';
UPDATE exercises SET tags_json = '["running","zone-4","vo2max","intervals","distance-target","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-2700-meter';
UPDATE exercises SET tags_json = '["running","zone-5","max-effort","repeats","high_impact","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-4x30-seconden';
UPDATE exercises SET tags_json = '["running","zone-5","max-effort","repeats","high_impact","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-6x30-seconden';
UPDATE exercises SET tags_json = '["running","zone-5","max-effort","repeats","high_impact","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-6x45-seconden';
UPDATE exercises SET tags_json = '["running","zone-5","max-effort","intervals","distance-target","high_impact","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-2700-meter';
UPDATE exercises SET tags_json = '["walking","march","steady-state","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-25-minuten';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-10-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-25-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","long-duration","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-30-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-5-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-3x5-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","steady-state","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-30-minuten';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x8-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-8-minuten-rugzak-45kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-10kg';
UPDATE exercises SET tags_json = '["walking","march","steady-state","long-duration","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-40-minuten';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-25-minuten-rugzak-10kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-4x5-minuten-rugzak-10kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","intervals","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-35kg';
UPDATE exercises SET tags_json = '["walking","march","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-6-minuten-rugzak-45kg';
UPDATE exercises SET tags_json = '["power","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'til-draagtest-gewicht-plaatsen-naar-heupen';
UPDATE exercises SET tags_json = '["full-body","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'til-draagtest-full-exercise';
UPDATE exercises SET tags_json = '["rotation","core","military","functional","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'graaftest';
UPDATE exercises SET tags_json = '["power","lower-body","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'optillen-vanaf-de-grond';
UPDATE exercises SET tags_json = '["power","lower-body","weighted","military","protocol"]', updated_at_ms = 1791032562000 WHERE slug = 'optillen-vanaf-de-grond-rugzak';
UPDATE exercises SET tags_json = '["strength","bodyweight","upper_body","push","floor","classic","quiet","low_impact","loads_shoulder","military","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'push-up';
UPDATE exercises SET tags_json = '["bodyweight","floor","low_impact","quiet","pregnancy_safe","postnatal_safe","loads_shoulder","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'knee-push-up';
UPDATE exercises SET tags_json = '["bodyweight","no_floor","low_impact","no_sweat","quiet","loads_shoulder","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'wall-push-up';
UPDATE exercises SET tags_json = '["bodyweight","floor","low_impact","core","military","dcp","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'sit-up';
UPDATE exercises SET tags_json = '["bodyweight","floor","low_impact","core","military","dcp","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'bent-knee-sit-up';
UPDATE exercises SET tags_json = '["bodyweight","floor","low_impact","core","military","dcp","measurable"]', updated_at_ms = 1791032562000 WHERE slug = 'anchored-sit-up';

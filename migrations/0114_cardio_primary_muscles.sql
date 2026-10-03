-- 0114 — primary_muscles_json for the cardio rows that had none (W5.1).
--
-- 74 active exercises had no primary muscles at all: 70 cardio rows (the Defence
-- hardlopen-* and marsen-* programmes, two session-phase rows, the Cooper run)
-- plus the generic cooling-down and warming-up. An empty list is not a neutral
-- value: the in-session muscle map renders blank, R592 superset pairing has no
-- muscle to avoid doubling up on, and R597 falls back to a slug heuristic.
--
-- Muscles are derived from each exercise's own name, tags and category, using only
-- names MUSCLE_SYNONYMS (functions/api/_shared/muscles.js) resolves, and following
-- the convention the live library already uses for the same movements:
--   running (zones 1-4, distance targets, Cooper, easy jog)
--                 quads, hamstrings, calves, glutes + cardiovascular_system
--                 (identical to easy-run-outdoor / tempo-run-outdoor)
--   zone 5 repeats  quads, hamstrings, glutes, calves + cardiovascular_system
--                 (a sprint: legs + glutes + calves)
--   march / walk  quads, hamstrings, glutes, calves, core  (legs + calves + core)
--   rucksack march  the same plus upper_back, as the live weighted-march row has
-- "legs" is written out as its four members; the regions it resolves to are
-- exactly the same. cardiovascular_system is a declared systemic entry that maps
-- to no region on purpose, so it is recorded without tinting the figure.
--
-- Deliberately NOT touched: cooling-down and warming-up. They are generic routines
-- whose muscles depend on what surrounds them; a wrong muscle is worse than a
-- missing one because the map and R592 act on it.
--
-- Only primary_muscles_json is written; secondary_muscles_json is not.

UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'easy-jog-warmup';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core"]', updated_at_ms = 1791032562000 WHERE slug = 'cooldown-walk';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-5-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = '12-minuten-loop';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-5-minuten-warmup';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-1x5-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-7-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-10-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-2200-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-1-2700-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-6-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-8-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-10-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-12-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-30-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-35-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-40-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-45-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-50-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2x8-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2x10-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-3x2-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-5x1-5-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-2-2700-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-4-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-8-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-12-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x2-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x3-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-1x4-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x3-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x5-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2x6-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x1-minuut';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x2-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x3-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x6-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-3x8-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-3-2700-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-3x2-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-4x1-minuut';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-4x45-seconden';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-5x1-minuut';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-6x1-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","calves","glutes","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-4-2700-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-4x30-seconden';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-6x30-seconden';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-6x45-seconden';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","cardiovascular_system"]', updated_at_ms = 1791032562000 WHERE slug = 'hardlopen-zone-5-2700-meter';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-25-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-10-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-25-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-30-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-5-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-5-5-km-u-3x5-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-30-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-25kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x8-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-8-minuten-rugzak-45kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-20-minuten-rugzak-10kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-40-minuten';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-25-minuten-rugzak-10kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-4x5-minuten-rugzak-10kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-2x10-minuten-rugzak-35kg';
UPDATE exercises SET primary_muscles_json = '["quads","hamstrings","glutes","calves","core","upper_back"]', updated_at_ms = 1791032562000 WHERE slug = 'marsen-6-km-u-6-minuten-rugzak-45kg';

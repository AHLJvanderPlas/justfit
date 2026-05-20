-- Migration 0052: Running Coach programme templates
--
-- Seeds 5 program_templates (5km / 10km / 15km / 20km / 30km) and 140
-- program_template_items that map each week of each programme to the
-- correct run-interval-level-N (hiit) and run-continuous-level-N (zone2)
-- exercises already present in the exercises table (migrations 0015 + 0016).
--
-- This mirrors the RUN_PROGRAMS constant in plan.js R556. As of Phase 4
-- (running adoption), plan.js reads from these rows with fallback to the JS
-- constant if the query returns empty.
--
-- session_order=1, day_index=0 → hiit session (Mon/Fri slot, interval run)
-- session_order=2, day_index=2 → zone2 session (Wed slot, continuous easy run)
--
-- Exercise UUIDs are the fixed deterministic IDs from migrations 0015 + 0016:
--   run-interval-level-N  → a100000N-run0-4000-8000-run00000000N
--   run-continuous-level-N → a100000N-run0-4000-8000-run00000000N  (same pattern)

-- ── Programme templates ──────────────────────────────────────────────────────

INSERT OR IGNORE INTO program_templates
  (id, slug, name, coach_type, sport, level, block_length, metadata_json, is_active, created_at_ms, updated_at_ms)
VALUES
  ('run-5km',  'run-5km',  'Running Coach — 5 km',  'running', 'running', 'beginner',     8,  '{"target_km":5,"description":"8-week build from run/walk intervals to first 5 km."}',           1, unixepoch()*1000, unixepoch()*1000),
  ('run-10km', 'run-10km', 'Running Coach — 10 km', 'running', 'running', 'intermediate', 12, '{"target_km":10,"description":"12-week build to continuous 10 km."}',                           1, unixepoch()*1000, unixepoch()*1000),
  ('run-15km', 'run-15km', 'Running Coach — 15 km', 'running', 'running', 'intermediate', 14, '{"target_km":15,"description":"14-week build to continuous 15 km."}',                           1, unixepoch()*1000, unixepoch()*1000),
  ('run-20km', 'run-20km', 'Running Coach — 20 km', 'running', 'running', 'advanced',     16, '{"target_km":20,"description":"16-week build to half-marathon distance (20 km)."}',             1, unixepoch()*1000, unixepoch()*1000),
  ('run-30km', 'run-30km', 'Running Coach — 30 km', 'running', 'running', 'advanced',     20, '{"target_km":30,"description":"20-week build to 30 km long-run endurance."}',                  1, unixepoch()*1000, unixepoch()*1000);

-- ── Programme template items ─────────────────────────────────────────────────
-- Column order: id, program_template_id, block_week, day_index, session_order,
--               item_type, exercise_id, protocol_id, notes_json,
--               created_at_ms, updated_at_ms

INSERT OR IGNORE INTO program_template_items
  (id, program_template_id, block_week, day_index, session_order, item_type, exercise_id, protocol_id, notes_json, created_at_ms, updated_at_ms)
VALUES

-- ── 5 km (8 weeks) ──────────────────────────────────────────────────────────
-- week  hiit zone2
--   1     2    7
--   2     3    7
--   3     3    8
--   4     4    8
--   5     4    9
--   6     5    9
--   7     5    9
--   8     6   10

('rpi-5km-w01-h','run-5km', 1,0,1,'exercise','a1000002-run0-4000-8000-run000000002',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w01-z','run-5km', 1,2,2,'exercise','a1000007-run0-4000-8000-run000000007',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w02-h','run-5km', 2,0,1,'exercise','a1000003-run0-4000-8000-run000000003',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w02-z','run-5km', 2,2,2,'exercise','a1000007-run0-4000-8000-run000000007',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w03-h','run-5km', 3,0,1,'exercise','a1000003-run0-4000-8000-run000000003',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w03-z','run-5km', 3,2,2,'exercise','a1000008-run0-4000-8000-run000000008',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w04-h','run-5km', 4,0,1,'exercise','a1000004-run0-4000-8000-run000000004',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w04-z','run-5km', 4,2,2,'exercise','a1000008-run0-4000-8000-run000000008',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w05-h','run-5km', 5,0,1,'exercise','a1000004-run0-4000-8000-run000000004',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w05-z','run-5km', 5,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w06-h','run-5km', 6,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w06-z','run-5km', 6,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w07-h','run-5km', 7,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w07-z','run-5km', 7,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w08-h','run-5km', 8,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-5km-w08-z','run-5km', 8,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),

-- ── 10 km (12 weeks) ────────────────────────────────────────────────────────
-- week  hiit zone2
--   1     3    8
--   2     4    8
--   3     4    9
--   4     5    9
--   5     5   10
--   6     6   10
--   7     6   11
--   8     6   11
--   9     6   12
--  10     6   12
--  11     6   13
--  12     6   13

('rpi-10km-w01-h','run-10km', 1,0,1,'exercise','a1000003-run0-4000-8000-run000000003',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w01-z','run-10km', 1,2,2,'exercise','a1000008-run0-4000-8000-run000000008',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w02-h','run-10km', 2,0,1,'exercise','a1000004-run0-4000-8000-run000000004',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w02-z','run-10km', 2,2,2,'exercise','a1000008-run0-4000-8000-run000000008',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w03-h','run-10km', 3,0,1,'exercise','a1000004-run0-4000-8000-run000000004',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w03-z','run-10km', 3,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w04-h','run-10km', 4,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w04-z','run-10km', 4,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w05-h','run-10km', 5,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w05-z','run-10km', 5,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w06-h','run-10km', 6,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w06-z','run-10km', 6,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w07-h','run-10km', 7,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w07-z','run-10km', 7,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w08-h','run-10km', 8,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w08-z','run-10km', 8,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w09-h','run-10km', 9,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w09-z','run-10km', 9,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w10-h','run-10km',10,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w10-z','run-10km',10,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w11-h','run-10km',11,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w11-z','run-10km',11,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w12-h','run-10km',12,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-10km-w12-z','run-10km',12,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),

-- ── 15 km (14 weeks) ────────────────────────────────────────────────────────
-- week  hiit zone2
--   1     4    9
--   2     5   10
--   3     5   10
--   4     6   11
--   5     6   11
--   6     6   12
--   7     6   12
--   8     6   13
--   9     6   13
--  10     6   13
--  11     6   14
--  12     6   14
--  13     6   14
--  14     6   14

('rpi-15km-w01-h','run-15km', 1,0,1,'exercise','a1000004-run0-4000-8000-run000000004',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w01-z','run-15km', 1,2,2,'exercise','a1000009-run0-4000-8000-run000000009',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w02-h','run-15km', 2,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w02-z','run-15km', 2,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w03-h','run-15km', 3,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w03-z','run-15km', 3,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w04-h','run-15km', 4,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w04-z','run-15km', 4,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w05-h','run-15km', 5,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w05-z','run-15km', 5,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w06-h','run-15km', 6,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w06-z','run-15km', 6,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w07-h','run-15km', 7,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w07-z','run-15km', 7,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w08-h','run-15km', 8,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w08-z','run-15km', 8,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w09-h','run-15km', 9,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w09-z','run-15km', 9,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w10-h','run-15km',10,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w10-z','run-15km',10,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w11-h','run-15km',11,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w11-z','run-15km',11,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w12-h','run-15km',12,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w12-z','run-15km',12,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w13-h','run-15km',13,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w13-z','run-15km',13,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w14-h','run-15km',14,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-15km-w14-z','run-15km',14,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),

-- ── 20 km (16 weeks) ────────────────────────────────────────────────────────
-- week  hiit zone2
--   1     5   10
--   2     5   11
--   3     6   11
--   4     6   12
--   5     6   12
--   6     6   13
--   7     6   13
--   8     6   13
--   9     6   14
--  10     6   14
--  11     6   14
--  12     6   14
--  13     6   15
--  14     6   15
--  15     6   15
--  16     6   15

('rpi-20km-w01-h','run-20km', 1,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w01-z','run-20km', 1,2,2,'exercise','a1000010-run0-4000-8000-run000000010',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w02-h','run-20km', 2,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w02-z','run-20km', 2,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w03-h','run-20km', 3,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w03-z','run-20km', 3,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w04-h','run-20km', 4,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w04-z','run-20km', 4,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w05-h','run-20km', 5,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w05-z','run-20km', 5,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w06-h','run-20km', 6,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w06-z','run-20km', 6,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w07-h','run-20km', 7,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w07-z','run-20km', 7,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w08-h','run-20km', 8,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w08-z','run-20km', 8,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w09-h','run-20km', 9,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w09-z','run-20km', 9,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w10-h','run-20km',10,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w10-z','run-20km',10,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w11-h','run-20km',11,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w11-z','run-20km',11,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w12-h','run-20km',12,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w12-z','run-20km',12,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w13-h','run-20km',13,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w13-z','run-20km',13,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w14-h','run-20km',14,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w14-z','run-20km',14,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w15-h','run-20km',15,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w15-z','run-20km',15,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w16-h','run-20km',16,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-20km-w16-z','run-20km',16,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),

-- ── 30 km (20 weeks) ────────────────────────────────────────────────────────
-- week  hiit zone2
--   1     5   11
--   2     6   12
--   3     6   12
--   4     6   13
--   5     6   13
--   6     6   14
--   7     6   14
--   8     6   14
--   9     6   15
--  10     6   15
--  11     6   15
--  12     6   15
--  13     6   15
--  14     6   16
--  15     6   16
--  16     6   16
--  17     6   16
--  18     6   17
--  19     6   17
--  20     6   17

('rpi-30km-w01-h','run-30km', 1,0,1,'exercise','a1000005-run0-4000-8000-run000000005',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w01-z','run-30km', 1,2,2,'exercise','a1000011-run0-4000-8000-run000000011',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w02-h','run-30km', 2,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w02-z','run-30km', 2,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w03-h','run-30km', 3,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w03-z','run-30km', 3,2,2,'exercise','a1000012-run0-4000-8000-run000000012',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w04-h','run-30km', 4,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w04-z','run-30km', 4,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w05-h','run-30km', 5,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w05-z','run-30km', 5,2,2,'exercise','a1000013-run0-4000-8000-run000000013',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w06-h','run-30km', 6,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w06-z','run-30km', 6,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w07-h','run-30km', 7,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w07-z','run-30km', 7,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w08-h','run-30km', 8,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w08-z','run-30km', 8,2,2,'exercise','a1000014-run0-4000-8000-run000000014',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w09-h','run-30km', 9,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w09-z','run-30km', 9,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w10-h','run-30km',10,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w10-z','run-30km',10,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w11-h','run-30km',11,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w11-z','run-30km',11,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w12-h','run-30km',12,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w12-z','run-30km',12,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w13-h','run-30km',13,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w13-z','run-30km',13,2,2,'exercise','a1000015-run0-4000-8000-run000000015',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w14-h','run-30km',14,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w14-z','run-30km',14,2,2,'exercise','a1000016-run0-4000-8000-run000000016',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w15-h','run-30km',15,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w15-z','run-30km',15,2,2,'exercise','a1000016-run0-4000-8000-run000000016',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w16-h','run-30km',16,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w16-z','run-30km',16,2,2,'exercise','a1000016-run0-4000-8000-run000000016',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w17-h','run-30km',17,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w17-z','run-30km',17,2,2,'exercise','a1000016-run0-4000-8000-run000000016',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w18-h','run-30km',18,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w18-z','run-30km',18,2,2,'exercise','a1000017-run0-4000-8000-run000000017',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w19-h','run-30km',19,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w19-z','run-30km',19,2,2,'exercise','a1000017-run0-4000-8000-run000000017',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w20-h','run-30km',20,0,1,'exercise','a1000006-run0-4000-8000-run000000006',NULL,'{"session_type":"hiit"}', unixepoch()*1000,unixepoch()*1000),
('rpi-30km-w20-z','run-30km',20,2,2,'exercise','a1000017-run0-4000-8000-run000000017',NULL,'{"session_type":"zone2"}',unixepoch()*1000,unixepoch()*1000);

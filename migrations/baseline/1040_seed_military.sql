-- =============================================================================
-- JustFit — Military Programme Seed (Executable Snapshot)
-- File: migrations/baseline/1040_seed_military.sql
-- Generated: 2026-05-03
--
-- Bootstrap order: run AFTER 1020_seed_exercises.sql
-- (exercise_aliases.exercise_id and program_template_items.exercise_id both
-- reference exercises seeded in 1020_seed_exercises.sql)
--
-- Canonical current state of:
--   exercise_aliases       : 87 rows (migration 0046)
--   program_templates      : 13 rows (migration 0047)
--   program_template_items : 1919 rows (migration 0047 + 52 backfilled by migrations 0048+0049)
--
-- All 52 originally-deferred template items are now resolved:
--   migration 0048: 2 items (hardlopen-zone-3-5-minuten in KC2 + KC3)
--   migration 0049: 50 items (48 optillen-vanaf-de-grond + 1 til-draagtest-gewicht + 1 til-full)
--
-- Resolved by migration 0048 (appended below):
--   hardlopen-zone-3-5-minuten — confirmed 5-min Zone 3 run (second matrix occurrence)
--   2 program_template_items backfilled (keuring-cluster-2 and keuring-cluster-3,
--   block_week=4, day_index=2, session_order=7)
--
-- Resolved by migration 0049 (appended below):
--   optillen-vanaf-de-grond — object confirmed from matrix raw data (gevulde rugzak/krat/doos)
--   til-draagtest-gewicht-plaatsen-naar-heupen — specs from werkenbijdefensie.nl
--   til-draagtest-full-exercise — full Progressieve Til/Draagtest sequence from defensie site
--   50 program_template_items backfilled
--
-- All INSERT statements are idempotent:
--   exercise_aliases: INSERT OR IGNORE + SELECT-based exercise_id resolution
--   program_templates: INSERT OR IGNORE with fixed UUIDs
--   program_template_items: INSERT OR IGNORE + SELECT-based exercise_id resolution
-- =============================================================================

-- ---------------------------------------------------------------------------
-- exercise_aliases (87 rows — migration 0046)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '108d0087-1c4e-53d2-b923-8021b8dfff1c',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),'12 minuten test',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '454f24dd-dc62-5dfc-8d8f-3340f865f981',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),'12 minuten test (= nul-meting)',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '77a1ca60-2bed-551d-b22d-4e26fea74c8a',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),'12 minuten loop',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '8bbca157-80c5-5930-833e-721bb0a2e7b3',(SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1),'Back Squat',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'a60f5f34-d978-5e09-8dcf-8b07fa657c4c',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),'Bicycle Crunch',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '3361ac44-ee3f-5b3d-9aa7-62f6d8efe3f0',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),'Bycicle crunch',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'b43e5843-94cf-5fc4-8bd5-471a661df58d',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),'Bird Dog',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'ae8ff8a7-9ea1-549f-92a5-c42a6ce83af6',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),'Broad Jump',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'ed85c9b4-400f-5ec3-93c5-f4c9ead2fda4',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),'Broad Jumps',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'fe159df5-e296-5513-8582-2b569b09537a',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),'Burpees',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '2857b323-2ac6-526a-85c0-19a29aae3b52',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),'Clean pull',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '99f5a6be-db4b-5407-a3dc-d3b67c029a39',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),'Cooling down',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'f837c26f-3539-53f8-b944-1069b4f36f68',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),'Dead Bug',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'fb8da0a3-c09f-5405-9024-d11d2939b816',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),'Flutter Kicks',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '20a9b5b1-d88d-5d89-a702-4db71a1ed3ee',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),'Goblet Squat',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'afc8d111-91d0-50e2-9efa-9801949fb6fe',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),'Hand Releas Push Up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '7bd0f2c8-8ee5-5abf-a992-013182104662',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),'Hand Release Push Up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '7bd0f2c8-8ee5-5abf-a992-013182104662',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),'Hand release Push Up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '4b2a9bdf-d04a-5234-879b-109baa439a2e',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),'Heug Brug',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'f65279b5-20a1-53cd-8b17-cd9b2a7d8868',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),'Heup Brug',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'ba43f672-5336-59d5-bb4c-ab35c9790d27',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),'High pull',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '0b60065e-2f8a-530a-9c94-f8af37350b19',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),'Lunges',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e5d4a81d-7f45-5d2c-bbee-169e3eebe038',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),'Mountain Climbers',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '8299b590-792d-55e1-8a7d-0a93aa67d32b',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),'Plyo push up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '07a1948b-8ccb-5535-8d1f-c0442bcc376c',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),'Pylo Push Up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '07a1948b-8ccb-5535-8d1f-c0442bcc376c',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),'Pylo push up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'cd458305-dd01-5293-b0a4-1d7104553cf5',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),'Rompstabiliteit: Zijwaartse plank',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'c2193de4-d438-5b78-b05a-3cd836f7a35f',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),'Shoulder Tap',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '58e97881-7544-507b-9a9d-6373c288def4',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),'Shoulder Taps',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '58e97881-7544-507b-9a9d-6373c288def4',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),'Shoulder taps',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '232083f9-8bc6-5dc6-a66f-222ed4d13257',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),'Single leg deadlift',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '0a7b1db2-79c0-5578-b0fe-c288fba82a5b',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),'Split squat',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '38396ebf-1c5d-570c-9a3a-141fae0491ec',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),'Squat Jump',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '0697fc7e-fe53-5e23-ac1c-4222d859be12',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),'Squat Jumps',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '08651f6f-83a1-5dcc-adfa-ed32579dece5',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),'Step Up',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '9fa47dba-afa5-5d02-8a06-79489dcd562a',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),'Tuck Jumps',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '64bebed9-2f21-56da-910d-592d40132c9d',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),'Tuck jump',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e72c8bf6-1fb5-5101-823f-d95dcff8332d',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),'Video afspelen',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '3b7a8c74-ba8b-5378-9828-683207281ef9',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),'Voorwaarts plank',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '86b84cb3-f6da-506d-bbb4-23b9ac415c35',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),'Voorwaartse Plank',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e9978c4d-1f5b-5808-a949-eb5f42d3869c',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),'Walking lunges',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '850c8d65-27d7-533d-9d3e-8c4e21ce6750',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),'Wissel Sprongen',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '8fcb3b22-8204-5ce4-82ec-ddee9296f9b7',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),'Wisselsprong',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'a45c56b1-9358-55f6-8cc4-f8ad2192de8c',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),'Zijwaarts plank',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '083ca52c-9a4b-52fb-9c24-a4389550c31d',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),'Zijwaartse Plank',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'f0c1a20b-5c01-532b-94fc-9510bda24f74',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),'Hardlopen zone 2 - 8 min',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '2ea84748-931e-52ca-a10b-8a1bda12b44b',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),'Hardlopen zone 2 -8 minuten loop',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '3f5d484a-42c4-5e1d-96f8-d415dacd292a',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),'Hardlopen zone 2 -12 minuten loop',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'cc6946a1-ea33-57fd-89a6-dd6af902ae24',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1),'Hardlopen zone 2 - 40 min',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'fe771540-75ad-5dcb-83b6-463b12cbbfa4',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),'Hardlopen zone 2 - 50 minuten loop',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '156fbdba-ebc2-5bdc-88d0-f47f47610edd',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),'Hardlopen zone 2 - 2x 10 min',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e0f99f32-b298-5930-b516-8c83a09b319c',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),'Hardlopen zone 2 -2x10 minuten loop',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '94b6d81e-68ba-5ae3-ba4e-8323618d8b48',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),'Hardlopen zone 2 - 2x 8 min',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'f2e3547b-23a1-5ab2-aaeb-d2582b3185b6',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),'Hardlopen zone 2 - 3x 2 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '5232032d-9044-5015-bedf-7bf786b2bdb9',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1),'Hardlopen zone 2 - 5 x 1,5 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '7a7f463e-ba69-57b1-b1c4-5d2e620049f5',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),'Hardlopen zone 3 - 1x 2minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '6bb4c2bd-088a-5248-8a3a-bf6c69007082',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),'Hardlopen zone 3 - 2x 3 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '6843c075-f455-577a-9c60-b4a947db8f70',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),'Hardlopen zone 3 - 3x 1 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '45220b91-3629-5ed6-8ed1-443af7c4d77c',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),'Hardlopen zone 3 - 3x 2 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'a0d466bb-4a2d-5fca-892d-f520dbc4955a',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1),'Hardlopen zone 3 - 3x 6 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '708d925f-bd16-5b15-a77c-f8e2545d667c',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1),'Hardlopen zone 3 - 3x 8 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e3fff962-cbd7-5b90-b6e1-8bbf6387e55f',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),'Hardlopen zone 4 - 3x 2 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '5c7b38ff-5e43-52ee-8413-e5f698d4c07b',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),'Hardlopen zone 4 - 4x 1 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '1659f43e-6e9a-5d46-952b-16174c0a3759',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),'Hardlopen zone 4 - 5x 1 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '2f20ba65-ab68-50cb-a67b-3c750b39adec',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1),'Hardlopen zone 4 - 6x 1 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'c1d0d301-6d28-508c-8d0b-c3ef64449147',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),'Hardlopen zone 5 - 4x 30 seconden',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'fc83c102-1cc6-575f-8d82-538e88f74b4e',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),'Hardlopen zone 5 - 6x 30 seconden',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '52d59a05-c453-5371-b1b8-ccc635347333',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),'Hardlopen zone 5 - 6x 45 seconden',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '1206e174-e358-5cc1-beb9-1f5e42563971',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),'Marsen 5,5 km/h',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'fd41e86b-9c5c-545a-b087-816b35c88aaf',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1),'Marsen 5, 5 km/h 3 x 5 min (rugzak 35 kg)',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '82f01a83-215b-5146-97ff-ba49b2ec630f',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1),'Marsen (5,5 km/u) - 10 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '39c35e42-8cc2-554d-a49d-191fdc9e2e36',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),'Marsen (5,5 km/u) - 2x10 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'a3cab5cb-b871-5fd6-b2ea-04022e522c2b',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1),'Marsen (5,5 km/u) 20 min rugzak 25kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'b93795f9-884e-58d6-b7d8-0a78c68d0ac1',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1),'Marsen (5,5 km/u) 20 min rugzak 35kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '9f6b65cb-98b8-5f6c-aeaf-a5ef49624610',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1),'Marsen (5,5 km/u) 25 min rugzak 25kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '55b5e729-abf2-5c10-9da9-2a335d9cd0b7',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1),'Marsen (5,5 km/u) 30 min rugzak 25kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '1f2feb9d-9eaf-5077-a27f-2a79309dcce1',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-5-minuten-rugzak-35kg' LIMIT 1),'Marsen (5,5 km/u) 5 min rugzak 35kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'b16b75fd-bd3b-5bb3-a050-d0f7fe3d7d06',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),'Marsen 6km/h',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '3df09562-cbc4-5056-9786-ee4a037337b5',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),'Marsen (6km/u)',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'b6d35482-8100-51e6-b6d3-cdc98b31d673',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),'Marsen (6 km/u) - 2x10 minuten',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '329c0253-be8d-5eb5-ad89-701663585d15',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),'Marsen (6 km/u) 20 min rugzak 25kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '4e0b52b9-001f-5855-b59e-c44a866961e5',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-35kg' LIMIT 1),'Marsen (6 km/u) 20 min rugzak 35kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'b763546e-3e8a-5068-b75b-0c427a8f56b6',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1),'Marsen (6 km/u) 2x 8 min rugzak 35kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'a0dc7b82-3fc4-5160-b889-f12f6c8f944e',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-8-minuten-rugzak-45kg' LIMIT 1),'Marsen (6 km/u) 8 min rugzak 45kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-8-minuten-rugzak-45kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '6d0ac46a-84e0-5396-9735-aced714582d2',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),'Marsen 6km/u met Rugzak 10kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '1a46e9b4-682f-5404-8963-56f9fa60a6fa',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1),'Marsen 6km/u met Rugzak 10kg 4 x 5 min',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '40cf559d-9281-5b06-ac3e-417e756ea85f',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),'Marsen 6km/u met Rugzak 25kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '2ebbb2c4-8c3a-5605-b984-e2c8396f8404',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1),'Marsen 6km/u met Rugzak 35kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT 'e738de25-b4fd-52dd-8e44-2e603592aecf',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-6-minuten-rugzak-45kg' LIMIT 1),'Marsen 6km/u met Rugzak 45kg',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-6-minuten-rugzak-45kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO exercise_aliases (id,exercise_id,alias,created_at_ms,updated_at_ms)
SELECT '1715ee73-7beb-5c12-b4a0-8499de477133',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1),'Marsten (6 km/u)',1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1) IS NOT NULL;
-- ---------------------------------------------------------------------------
-- program_templates + program_template_items (migration 0047)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('3c03987a-e87b-5571-a17b-387160971d74','keuring-basis','Keuring Basis','military','military','beginner',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Basis", "cluster": 0, "description": "Dutch military (Defensie) Keuring Basis training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b17f4548-29bc-57c8-8dc3-ff523386f52e','3c03987a-e87b-5571-a17b-387160971d74',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25571187-5d07-50b7-9881-5605e83465c2','3c03987a-e87b-5571-a17b-387160971d74',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e52d73ef-154f-5214-ad1a-6a92b4d018ee','3c03987a-e87b-5571-a17b-387160971d74',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '345dca35-ee55-56a0-bb85-aff4a5b1af79','3c03987a-e87b-5571-a17b-387160971d74',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '87bf3c78-6752-5798-847a-a290ae5b1936','3c03987a-e87b-5571-a17b-387160971d74',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e7e3cbc-deab-5466-b8af-d495de9872b0','3c03987a-e87b-5571-a17b-387160971d74',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '271cd4dd-ca0d-51b3-80ab-cfbd60266ad1','3c03987a-e87b-5571-a17b-387160971d74',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6cd408cf-14fc-569b-b10c-a6715b4b30ea','3c03987a-e87b-5571-a17b-387160971d74',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '059f91a3-eb4b-5d6f-ae7d-36ea7ff36f89','3c03987a-e87b-5571-a17b-387160971d74',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ef54cd05-fa4a-5e06-b339-d09c3494aa23','3c03987a-e87b-5571-a17b-387160971d74',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '34d8305a-4959-5843-9ce0-2e4c7fc1d451','3c03987a-e87b-5571-a17b-387160971d74',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ab34a511-1cf1-5790-91e4-fcfce89f3985','3c03987a-e87b-5571-a17b-387160971d74',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5e538051-86f4-5ede-885f-1af8b53f9070','3c03987a-e87b-5571-a17b-387160971d74',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fba9d97d-e778-5265-a13e-05d117893ece','3c03987a-e87b-5571-a17b-387160971d74',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '952e31d8-94f0-5395-8112-979978ca6151','3c03987a-e87b-5571-a17b-387160971d74',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f1ec925-548e-5706-8bc4-971c94ada29f','3c03987a-e87b-5571-a17b-387160971d74',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a011318d-9a59-5d29-99d3-26e5d9aa602d','3c03987a-e87b-5571-a17b-387160971d74',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '519b7d93-d219-5e84-9162-5662dfde39a2','3c03987a-e87b-5571-a17b-387160971d74',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ff03eeb-1c7e-5d13-a8b4-df6b58f8312d','3c03987a-e87b-5571-a17b-387160971d74',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e2a6a10f-8ab6-5d3e-9eef-0c3148899079','3c03987a-e87b-5571-a17b-387160971d74',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7b2e5980-c2b0-5a5f-8bfe-45fc835f7608','3c03987a-e87b-5571-a17b-387160971d74',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c3bb713-936f-5cec-8bc8-43c08a61e445','3c03987a-e87b-5571-a17b-387160971d74',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0c8cfb53-67d5-59f8-a1fc-0b046423ca90','3c03987a-e87b-5571-a17b-387160971d74',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '09fda5e9-9ec1-52c8-b421-4e29921e0661','3c03987a-e87b-5571-a17b-387160971d74',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '28bd9d98-0cd1-51b8-b162-b72b1f27cb15','3c03987a-e87b-5571-a17b-387160971d74',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a1ebb378-3ba7-5c47-8158-a5b3aee9654e','3c03987a-e87b-5571-a17b-387160971d74',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6c61be3a-f49c-5961-921e-7e28d8d38c1c','3c03987a-e87b-5571-a17b-387160971d74',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89ebbd7a-1315-561b-bd26-f0fdf083150a','3c03987a-e87b-5571-a17b-387160971d74',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8701190-adce-5c33-9a19-f049434a6c18','3c03987a-e87b-5571-a17b-387160971d74',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0981f2bb-4539-5903-9de2-937f1117fa2e','3c03987a-e87b-5571-a17b-387160971d74',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '280f1c06-c8ee-5670-9d4e-bd52cb2f2f73','3c03987a-e87b-5571-a17b-387160971d74',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2cca8a07-dc48-5f97-8d32-ba54764a3a17','3c03987a-e87b-5571-a17b-387160971d74',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '626ed05b-7dc9-57cf-9854-992213109ae3','3c03987a-e87b-5571-a17b-387160971d74',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '27980471-8751-5f42-8a8e-39f556a77529','3c03987a-e87b-5571-a17b-387160971d74',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32df77c1-7f37-5035-bf23-b8b96c607027','3c03987a-e87b-5571-a17b-387160971d74',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2b155148-931e-5d67-9fc7-a98e69268ee0','3c03987a-e87b-5571-a17b-387160971d74',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e31893d-f452-57f5-a5b2-b838ec01f600','3c03987a-e87b-5571-a17b-387160971d74',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ef01948f-cedf-5ade-b298-7c201fd7f472','3c03987a-e87b-5571-a17b-387160971d74',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd8ed871c-1950-52ed-8686-13b3b17f7f22','3c03987a-e87b-5571-a17b-387160971d74',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20d2e887-6c84-57f5-95d7-5ab8b176352b','3c03987a-e87b-5571-a17b-387160971d74',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0d7d9037-dfb0-54b2-94f3-0bbb1ab5d9b9','3c03987a-e87b-5571-a17b-387160971d74',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2c9686b9-77a4-5b91-a3a8-1d27cca00a4e','3c03987a-e87b-5571-a17b-387160971d74',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fa7d0247-5aeb-5e3c-91fe-a5851c5ec3ca','3c03987a-e87b-5571-a17b-387160971d74',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '271cb5d7-b832-5d25-b009-8426f4bda676','3c03987a-e87b-5571-a17b-387160971d74',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d470479-0399-5a1c-93f5-818d24833d51','3c03987a-e87b-5571-a17b-387160971d74',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '325c84bf-b6b4-5e77-90cc-b3a428a9fb4b','3c03987a-e87b-5571-a17b-387160971d74',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfd53d86-c469-5c12-b8c1-53013c0ee8b4','3c03987a-e87b-5571-a17b-387160971d74',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4941e37f-9d89-5569-9584-37424fdb97ce','3c03987a-e87b-5571-a17b-387160971d74',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-1x5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-1x5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4859cb99-f140-590b-8f08-a452ff443d6b','3c03987a-e87b-5571-a17b-387160971d74',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7347d8fc-c96a-5c82-aca3-5b864a33112f','3c03987a-e87b-5571-a17b-387160971d74',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '45a12d4b-3323-51b2-a176-8ca23271580d','3c03987a-e87b-5571-a17b-387160971d74',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c25922fd-a621-5e0c-8664-6f4116b8db28','3c03987a-e87b-5571-a17b-387160971d74',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '352099bd-4706-558e-a1d6-9d2a9bc3ffa1','3c03987a-e87b-5571-a17b-387160971d74',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e14180c-7166-5bbb-981a-1d5dcf69ce61','3c03987a-e87b-5571-a17b-387160971d74',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c1613c8-6d74-53de-bc58-d9b88f0f9c8a','3c03987a-e87b-5571-a17b-387160971d74',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f63b6fc4-ed3e-5e23-8d98-ead1e0ff92aa','3c03987a-e87b-5571-a17b-387160971d74',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f805d7e5-c47f-5c4d-b9e7-de46eef4c9a5','3c03987a-e87b-5571-a17b-387160971d74',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be7ae104-8aee-5b6a-bcb0-1867e7b920d5','3c03987a-e87b-5571-a17b-387160971d74',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '327aea8a-84c7-50a6-99f9-938b7c1dd15e','3c03987a-e87b-5571-a17b-387160971d74',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f9e0cdb4-a020-565c-8f98-9232b3e8a7e9','3c03987a-e87b-5571-a17b-387160971d74',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a278121f-b577-50e2-bab1-ef0970b4f1c6','3c03987a-e87b-5571-a17b-387160971d74',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25b6347d-1eb4-5e0d-924e-ee8a9558383d','3c03987a-e87b-5571-a17b-387160971d74',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2bd15fa0-a688-55bc-ad01-6b94aee97d33','3c03987a-e87b-5571-a17b-387160971d74',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3b4ee9c-6850-5fa4-a018-f66ba59f4593','3c03987a-e87b-5571-a17b-387160971d74',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b32c379e-6b7c-537c-b8d4-8d98e6fa24d3','3c03987a-e87b-5571-a17b-387160971d74',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dc76738d-1ecf-5a50-83c0-851e5101c100','3c03987a-e87b-5571-a17b-387160971d74',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7ee2d60-af8b-544b-b846-e3831df8fcff','3c03987a-e87b-5571-a17b-387160971d74',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '44274fc3-f3c1-5192-ab69-4b9d215bda6a','3c03987a-e87b-5571-a17b-387160971d74',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '08fa0952-10dd-566d-b3be-5f6fdddb34f8','3c03987a-e87b-5571-a17b-387160971d74',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fa180d33-2a76-5ebd-9300-7cfcb28872a9','3c03987a-e87b-5571-a17b-387160971d74',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b377dedd-69de-5641-a218-d38b69bacd8f','3c03987a-e87b-5571-a17b-387160971d74',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aea84e3f-a232-5efe-ac00-66e251ef3097','3c03987a-e87b-5571-a17b-387160971d74',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f0821d68-1210-5ea7-8f01-7c0a1b759e03','3c03987a-e87b-5571-a17b-387160971d74',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ccba45b7-8219-5efe-a7e3-f6b8b5c1f4f4','3c03987a-e87b-5571-a17b-387160971d74',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6a4d09bc-4479-5eb6-9577-b59c367f99b0','3c03987a-e87b-5571-a17b-387160971d74',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '04fc3a9c-76a5-5db1-9f80-f6f142718e92','3c03987a-e87b-5571-a17b-387160971d74',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7b8cd929-b62e-5221-95a1-1bc5a0b6806e','3c03987a-e87b-5571-a17b-387160971d74',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dc6a344d-f25f-5c8b-bc0c-27ab37a0831d','3c03987a-e87b-5571-a17b-387160971d74',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '247552cf-a94e-5200-9e65-8a06a262b7a2','3c03987a-e87b-5571-a17b-387160971d74',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '487a3a36-7954-5341-b7b7-cc30d429926d','3c03987a-e87b-5571-a17b-387160971d74',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '875f28aa-a79c-5829-9e0a-59a1cb421e2c','3c03987a-e87b-5571-a17b-387160971d74',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bf948fc5-c894-5d89-9458-a067a36d6314','3c03987a-e87b-5571-a17b-387160971d74',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '81bc855d-2359-5d11-9824-db3f643f58bc','3c03987a-e87b-5571-a17b-387160971d74',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1afba912-a3c2-5b7a-acc5-73278a22d7f0','3c03987a-e87b-5571-a17b-387160971d74',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2397a6fe-a899-5e99-98cd-e57bf6757608','3c03987a-e87b-5571-a17b-387160971d74',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c39c177-e04f-56f0-9a46-530bd867c276','3c03987a-e87b-5571-a17b-387160971d74',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '17a6640b-04c7-5a71-bd02-dffb015dd35f','3c03987a-e87b-5571-a17b-387160971d74',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'daece41e-3846-5188-8a04-83a24cab8f43','3c03987a-e87b-5571-a17b-387160971d74',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9372d5b3-8114-5aa7-beef-0aa52bf47c2e','3c03987a-e87b-5571-a17b-387160971d74',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '03d48981-4cbf-5a4f-bc98-21e4a3cc1d50','3c03987a-e87b-5571-a17b-387160971d74',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '206ae873-f2a6-5476-b7fc-3a66ab3138a2','3c03987a-e87b-5571-a17b-387160971d74',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c4911b8-37f8-5305-bde7-f40e3d660db8','3c03987a-e87b-5571-a17b-387160971d74',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '24b82702-38f3-5a0a-a7c5-afeb8298d6d7','3c03987a-e87b-5571-a17b-387160971d74',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3ffc7968-b32c-528c-9879-f73aaeef04ae','3c03987a-e87b-5571-a17b-387160971d74',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b3255ff-f555-5677-9001-dad75a8199e4','3c03987a-e87b-5571-a17b-387160971d74',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '255141b5-5fe4-54c0-9af6-2c5e4990a1d4','3c03987a-e87b-5571-a17b-387160971d74',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '988a8cbb-5f35-5e14-9337-cfa0c1d065eb','3c03987a-e87b-5571-a17b-387160971d74',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '13e38c8e-2a3d-5ace-b47f-dcc8e92bbeb8','3c03987a-e87b-5571-a17b-387160971d74',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d729080-dc37-56d1-bcdc-eb9818d18215','3c03987a-e87b-5571-a17b-387160971d74',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '317f0a5c-6605-551f-9263-6145a5d6c57c','3c03987a-e87b-5571-a17b-387160971d74',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a79dd72-cae9-55b3-9b0b-9ecad24bd71f','3c03987a-e87b-5571-a17b-387160971d74',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2f6c54ad-6607-5c2b-9938-b247e26a00ec','3c03987a-e87b-5571-a17b-387160971d74',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '71310e85-7931-5322-ab43-1ee8ee2c18fe','3c03987a-e87b-5571-a17b-387160971d74',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4e3923a7-7351-5533-8afa-da3d9e075229','3c03987a-e87b-5571-a17b-387160971d74',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f1a21504-3dc2-5a0b-93d8-989b47be31f7','3c03987a-e87b-5571-a17b-387160971d74',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'deb17fb2-48ec-5e11-8f26-b5183e92ff19','3c03987a-e87b-5571-a17b-387160971d74',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e45c1224-2157-5285-8eab-ed0ca7b6bcc5','3c03987a-e87b-5571-a17b-387160971d74',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec3fddd9-302a-5f67-bf79-74b260b46dbd','3c03987a-e87b-5571-a17b-387160971d74',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c417366d-182a-576c-8add-ce7f0ad7e2e4','3c03987a-e87b-5571-a17b-387160971d74',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afb1ece2-9a94-512d-a589-d888c809b2eb','3c03987a-e87b-5571-a17b-387160971d74',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2b9c8aaf-6010-5299-b260-269b480e1524','3c03987a-e87b-5571-a17b-387160971d74',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '628aa52c-2e0a-50d6-8656-2fc8206e29f0','3c03987a-e87b-5571-a17b-387160971d74',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '96ab6436-b9c8-5e2b-a190-6116a3b5ce2a','3c03987a-e87b-5571-a17b-387160971d74',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ddf43f68-a0f8-5450-9d0b-1ccbb112ee58','3c03987a-e87b-5571-a17b-387160971d74',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '193bac22-47a5-5572-b13d-ad16e840328a','3c03987a-e87b-5571-a17b-387160971d74',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '79aa1194-145d-5aff-8aab-516e20610c46','3c03987a-e87b-5571-a17b-387160971d74',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bbbb5130-261d-5fe4-83e0-5c910224d136','3c03987a-e87b-5571-a17b-387160971d74',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '689720c7-5772-5529-aceb-dd6666ad9b35','3c03987a-e87b-5571-a17b-387160971d74',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c485de0-e8af-56fe-972f-0643cc48a807','3c03987a-e87b-5571-a17b-387160971d74',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c11f292c-ca12-5cd5-be6f-1fa48586ae6f','3c03987a-e87b-5571-a17b-387160971d74',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '55754269-a05f-5384-a87b-6e56dc5e1403','3c03987a-e87b-5571-a17b-387160971d74',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3662e53d-7d0a-5d7b-b659-56470333020c','3c03987a-e87b-5571-a17b-387160971d74',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e697eccc-57f0-5f21-9f12-f3cfd58ef7b8','3c03987a-e87b-5571-a17b-387160971d74',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9f456cc8-0e7f-5bce-a8fa-f77430146ac3','3c03987a-e87b-5571-a17b-387160971d74',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '67292ce5-2d3c-50eb-85b1-21594b7bf3fb','3c03987a-e87b-5571-a17b-387160971d74',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fdfa747c-cf78-5ae2-a1fe-f23e711d8a32','3c03987a-e87b-5571-a17b-387160971d74',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3ade9464-210b-590c-ad3a-620f12cbe5a0','3c03987a-e87b-5571-a17b-387160971d74',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '45759d7a-a9a4-5319-9f25-6cfd6aef0cbb','3c03987a-e87b-5571-a17b-387160971d74',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1366624d-9e4e-52e7-a486-dfbbea64406c','3c03987a-e87b-5571-a17b-387160971d74',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e12499c3-ee83-583b-abf2-d792f469edba','3c03987a-e87b-5571-a17b-387160971d74',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e096084-86cb-5b68-b473-f8bdcb43467f','3c03987a-e87b-5571-a17b-387160971d74',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee4da53b-09f9-5930-a614-297a38613d8b','3c03987a-e87b-5571-a17b-387160971d74',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2eebb853-07ac-5451-9a1e-b27134c86356','3c03987a-e87b-5571-a17b-387160971d74',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c109cd87-206b-59e6-b907-866e291deab1','3c03987a-e87b-5571-a17b-387160971d74',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '746f6dcf-067f-59ca-8aba-947b89ac03d2','3c03987a-e87b-5571-a17b-387160971d74',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8f0329a-ae53-5613-a207-76f8da679a81','3c03987a-e87b-5571-a17b-387160971d74',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e3468b9-e469-54fc-a122-2f26a02df178','3c03987a-e87b-5571-a17b-387160971d74',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0fe5042d-40ac-5ba1-ac18-0fc2191976c1','3c03987a-e87b-5571-a17b-387160971d74',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0b4121cc-a0e8-533e-bfcc-7d6ddec431a6','3c03987a-e87b-5571-a17b-387160971d74',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a0a18b45-ab91-5208-bfbf-65883db89a0e','3c03987a-e87b-5571-a17b-387160971d74',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c55ca27a-93df-5607-9203-083898b46996','3c03987a-e87b-5571-a17b-387160971d74',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ccf00f95-f3e5-5fd1-b494-c82ad95baf1f','3c03987a-e87b-5571-a17b-387160971d74',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('464c2feb-34ca-56b6-ac3b-4c8696dd022e','keuring-cluster-1','Keuring Cluster 1','military','military','beginner',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 1", "cluster": 1, "description": "Dutch military (Defensie) Keuring Cluster 1 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '03bf3431-0688-5793-9127-2051f3e99cb9','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '09f3259f-8508-5b22-9400-00ed91d2ad0e','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b69ded11-a089-5b95-b949-f58922a1a8b2','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f14c950e-2272-5ac9-ad6f-d2a1839dc83b','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '04930db1-5594-5905-a18b-6ccc94067b5a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '26809fec-a6ee-5c7b-bfa7-fdcbbf777de7','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a3e98137-c89a-5e65-a920-095e72b6638b','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d8f57c9-0ffa-5718-9512-7d0f6ef91795','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '79d8309d-40b9-5c9f-af04-3ed808c4180a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd31427ac-02fc-50c5-a500-1d1d13321bd4','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ef803c82-9b0b-59e7-86fa-145432f9bcae','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7cbc047e-b6f7-5a95-b306-3e7395d17de2','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3e4780b-245f-531d-bb6b-2bad2b388b6d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5a1924b-b725-5521-b67e-05ce29f012b9','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1947c9cb-321b-5b3f-86ac-a2b58199d6c3','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd272b856-4b60-520d-9891-ddcae25f2fff','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5c1d8b3d-a743-5bfa-ae12-09d0c92fefaf','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '575c991b-28a2-541a-b975-0167f0d40705','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7156063e-2ca4-5d54-88bf-7b19f44bb18f','464c2feb-34ca-56b6-ac3b-4c8696dd022e',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0bf9a829-2cb2-55f3-ba22-755d63d418e2','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7796ef76-7332-552e-85fc-d42a46da7417','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e0ff66ab-3621-5b74-9325-8cee35fdd7f9','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b561b936-ea78-55cd-b481-816a10947b42','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e06b503b-2bd7-5454-98a0-0c61e65f0723','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3135984-7a91-5dce-b1f8-ff2a4e90a10f','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '474a277a-dce4-5ac1-99e3-ef1941a28191','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a9a44c7b-880d-5c32-bbe7-7a3a2968751e','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '352d5cdb-2c95-5748-8b44-2719b4d53d62','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c0bae27-9952-5bb3-8e3a-0a0b98fce7a8','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d140ab1-20db-5a44-ae98-2faf6725a188','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8951c86d-cf00-5ea0-943e-3f00ccd8d0ec','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac0c2ea9-b99c-559c-8d81-6e1917339eae','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '16b2b7c9-ad27-5d9a-9de2-59baca2958f0','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebd4e649-4ada-5f85-a2e4-6b7f6232a845','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '38bcce7e-6f1d-5277-8ef0-f5567a211c1c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1be74ed0-e6e8-58e8-bcb3-93ba5328a629','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '286ee7b7-fa6f-5601-83d5-b2b464267a80','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6985718f-887b-57a5-a1d0-7602fc64e575','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4069b563-9fdb-594f-ac76-422822123dd4','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '523264e7-286d-55bf-a816-be854e7d6663','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ce8588f-2096-5389-aac8-4c7270b99920','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bff9720c-eb25-56fa-90e4-75539f707179','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '29717673-7583-58f5-a941-f80c8fb6f886','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ffeeb7f-cd39-582d-83ad-3bf6f66a652a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c037d795-9439-508f-8112-598a21aec10c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='back-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '920cfdab-5d48-5cf7-8e59-3cd5f8676f34','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0ba01818-de74-5b04-b626-8dba428f4157','464c2feb-34ca-56b6-ac3b-4c8696dd022e',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9196915f-0468-56b0-b676-e49d009442eb','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd03bfc1f-fad8-57df-8fec-c07ef692ddfc','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '007d1d15-05d5-5fd5-abaf-69d48282687a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-1x5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-1x5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ddf60692-122a-53ea-9af8-cded76fd5eb6','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fa068f33-6989-5f55-97c2-0505a22ec3c8','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '579291b1-f490-544b-b6ee-d15171b75933','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4d8ab228-ebbd-5e4a-8a0c-f6be90f6e8df','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '00aef09c-d8f1-5d0c-b65e-c75eae2a5a23','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8658c808-7ee4-5df0-aaf3-5b6458764737','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20693aaa-2ee0-54c5-b499-2371884fd253','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0886b868-5d96-55eb-9ab2-dd77a643aa58','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4d7bb85e-d3da-5ebe-8fd9-60674070201e','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd445c754-4022-5ecf-93fc-774b35520334','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d2269c4-6d8d-56cc-82ff-b6e495ad869d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0bc56db5-b7a4-5a67-8ac8-537eb6e1d754','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20af410c-b51f-5a39-ad22-0aa53d0e4304','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '40564fc0-3ae2-58f8-b32b-8bceef118ab3','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c2797df-fad7-5700-be7f-8ceb504a4a7e','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '22b462b2-1d64-5fa0-a1f6-84a21c295a59','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec9a5ddb-55c1-5bbc-a8c4-abe1938d98f9','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ff46d79-123b-5aca-bbfa-24c5cc8ff713','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63a79b97-09b9-5275-92f0-192099696c6d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2fe1fdda-bd7a-515d-9180-35ad0bec3f97','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e115a5c-991f-5156-80c4-5b6702777058','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63a8a952-26ae-541a-89f2-2ccc42da0828','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18b14df8-f78f-5339-8655-007ca97cb5ed','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32a03e22-0aef-5387-b893-51c5f43a7694','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d0be2ec-ab7c-5a6b-b88e-601a760ad873','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3aab0448-3a00-59c5-9eaf-69566ef47cae','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '92d576ee-b47c-5cef-a797-ed06d01f8969','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2408b5e0-44ba-5b0c-90ae-786c58bf9ec0','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ae1675d-6689-575d-aa66-3e54e2cce660','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43ba93c7-8e72-5c9e-864f-2961578c2a1d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '44cb418c-47d6-5028-a395-99fc2641e3a6','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0ae4ab07-f6a8-5ed1-a43c-7a18f1a93b21','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63845c89-cf7c-5876-bf10-0fa3f22eb5e4','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b6408986-eb0a-5583-abad-422d66b24d75','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3de0f7de-dae5-5e5a-b266-0da7831666ae','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '256cea55-9a6f-5ca4-a521-ecb301f5ac20','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '01ec81a7-4c69-50eb-acc9-323003c282f2','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4eb1382d-3912-51a7-afa1-f18f20bba14a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1fe5e061-3980-5afc-b4eb-6c8d9a7db5f0','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '69a50a2f-5669-5356-8955-6c3da41aec46','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bcd35185-e0fc-5aaa-a41b-ad0894d3d09d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4e61b236-2796-527b-8992-7942a0893168','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c18d1748-149c-55a4-b5c1-b1b9b22bde93','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a98d8a2a-46a6-5581-b105-4c35c75688ac','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd540aab-89d1-56ae-bb71-2ee29b7bf75a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4b44078e-9b97-50f5-b6d4-cd51f132adaa','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '76d481c6-4594-59a0-a7ca-8bd8307bc10f','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5fbaab5c-a764-5afd-ab8f-6469ac3f278d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '688b54c2-fa11-5da9-a521-6be01aa1864b','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8faf7dcf-6324-5eff-9175-8c761aa4e106','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ce5ca940-a5b1-56d3-ab67-6fb0eb341152','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b395c1d-a4e1-58e2-ab77-f9f52af62b0c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b413f096-d2f3-5dba-80d3-49288a04b2d6','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3d2f219-5830-5882-ae5d-835bee713411','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'db4631d3-fbbc-5e3b-aab7-efc43b9d3ecf','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2f89f807-ddb0-540f-a9dc-22d95723e562','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4f791597-00fe-54eb-adc8-42b5b8d4f433','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd0339bc1-43bb-569e-9e3d-f5b35ef11781','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd143bd95-876b-50ad-9b37-b2ae40e3d85b','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d4811f6-f14f-5d38-9c4a-bb02d561177a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1da98ac8-9da6-510c-a74e-31202d73d83c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd6e65b3-5309-5864-8007-2ffeea6e3a44','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ad636b0-f06c-51fc-82e2-e4222666f200','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6983c44-02de-5fb7-8a0a-dda402cab8fa','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c76c518a-8032-5118-8a27-992b21e8db79','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c69332a4-d6b9-5032-98bd-3d3de91bfa2d','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b302aff7-9132-5e63-928b-ead089e12331','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e76f2419-d764-560d-8551-b128aa252b11','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8459492a-b59c-5507-a7e3-1148e811f056','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd8daa321-4c8b-5d36-b757-7b640055043c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2d5e1e16-c303-5a4a-9dd0-514563d30bdd','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3357565-e2b8-5028-b9d3-15f2a983f47c','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cc8502a3-e82d-5b3f-b76a-71bc14089782','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '71f8e9fb-16f9-5dd4-97a1-9deedfd87b27','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4908f42c-4abe-5184-8885-37b79a4c026a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a73a365b-c1ba-53ba-a0f8-4a05d817aab7','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f23c8904-9794-52ca-bff9-740a097e9cbe','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '23b716cd-0242-5f42-a7bc-cc69c97c412e','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8edcaf4f-7586-51a5-84e8-589e1b2308ff','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c49e7c6-de4b-507e-9776-afb93eb312ab','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '760d0a66-ed05-5086-a2e0-f8774f8395ba','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ac2cd4e-b6ec-5584-9510-29c8420a3a14','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd346eea9-adcb-5e38-8ce8-ad6fe0f8d00a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '98867e2d-c894-5863-8695-5f168d3d3881','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d604055-858b-55be-b986-fa40a53b0082','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'caeeb724-a272-594a-942a-eca795745a63','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a1af3c3a-1ff0-5787-b316-6b92dd4bcb10','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '357152dd-8b21-5a0c-9823-88e4605767e8','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '632cff63-2d77-57ad-b9d3-556f0472c8e6','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '443215b4-81fa-53e8-8afa-c60e417550ff','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ed9eca79-c25a-58cc-bd63-2fc3f6b177ee','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '746f4786-1c63-5a6a-82e3-dc0f9a7e32e7','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afe3af2a-d462-5823-a5b2-6a29f772eed4','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee66346a-e39b-5e89-8440-54a1f9c1c4fa','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fde97862-1378-50f0-b87e-ff81bf56386a','464c2feb-34ca-56b6-ac3b-4c8696dd022e',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('05027310-42c1-51d4-83c3-e3677988194c','keuring-cluster-2','Keuring Cluster 2','military','military','beginner',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 2", "cluster": 2, "description": "Dutch military (Defensie) Keuring Cluster 2 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89cf6e87-1f3f-58a1-8eac-22285b321b0a','05027310-42c1-51d4-83c3-e3677988194c',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '29b8da9a-7a6d-504b-8123-7b3e904e137a','05027310-42c1-51d4-83c3-e3677988194c',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a0aed3c-d224-50c0-8fa4-d698bc956ab3','05027310-42c1-51d4-83c3-e3677988194c',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9bac2e40-59cb-518f-86fb-abb197d09f1a','05027310-42c1-51d4-83c3-e3677988194c',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '591ead73-4748-5040-9173-e304ab03947d','05027310-42c1-51d4-83c3-e3677988194c',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b5b363a-4e95-5413-afbd-bb9ca6215c60','05027310-42c1-51d4-83c3-e3677988194c',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2bb7423c-3ce4-50f1-a0b9-5cc6e154d507','05027310-42c1-51d4-83c3-e3677988194c',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '04ab5562-2d0c-557c-99b2-88fee5425009','05027310-42c1-51d4-83c3-e3677988194c',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94de2716-2293-5ef7-a2eb-78f7ffc0e849','05027310-42c1-51d4-83c3-e3677988194c',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '53e19930-de03-5580-9008-780b6bb1d9d2','05027310-42c1-51d4-83c3-e3677988194c',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '105f9d83-d794-5716-a3e5-1fabfd7908ad','05027310-42c1-51d4-83c3-e3677988194c',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '04a78b9b-c582-5a59-a904-36d016fbd61f','05027310-42c1-51d4-83c3-e3677988194c',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'da8fa5a1-f76e-5631-8db0-3e08a6773f9d','05027310-42c1-51d4-83c3-e3677988194c',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9f862f84-4d1b-5beb-a626-212f6d3cafb0','05027310-42c1-51d4-83c3-e3677988194c',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3297e398-a82c-577a-9521-05702b4f1362','05027310-42c1-51d4-83c3-e3677988194c',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cb563d31-e7d4-5717-80ce-c31038aac2db','05027310-42c1-51d4-83c3-e3677988194c',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c70939d5-f221-5ae1-9ba0-88dd4c1370d7','05027310-42c1-51d4-83c3-e3677988194c',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ce29f7d3-2f09-5887-ad69-c5b3169a41c5','05027310-42c1-51d4-83c3-e3677988194c',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '309d979e-e313-51b9-83c0-cb2d9b9c1592','05027310-42c1-51d4-83c3-e3677988194c',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd9785418-d57b-5c7c-b8cd-2a8ee8fbb203','05027310-42c1-51d4-83c3-e3677988194c',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f13fedee-c505-5552-aa0c-d5cd4aee854f','05027310-42c1-51d4-83c3-e3677988194c',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ea5a521c-1565-5408-9689-952f07eee68f','05027310-42c1-51d4-83c3-e3677988194c',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4092a4a0-6282-5cb6-a011-6737e7b4cc1f','05027310-42c1-51d4-83c3-e3677988194c',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2234d05-8f5b-52b2-8362-4ab72625b2ab','05027310-42c1-51d4-83c3-e3677988194c',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6f605a7f-09ea-5d7a-b3de-114329f4e63a','05027310-42c1-51d4-83c3-e3677988194c',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ff2d0d8b-ba32-5963-a661-4846a62a3ea8','05027310-42c1-51d4-83c3-e3677988194c',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ff3893f4-4486-5c90-a5f2-7433de793934','05027310-42c1-51d4-83c3-e3677988194c',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ef8c1e2-7099-5ab1-9a76-ac0d97718d6d','05027310-42c1-51d4-83c3-e3677988194c',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f245e8cf-72b8-5d6f-90a6-39634d58ba2e','05027310-42c1-51d4-83c3-e3677988194c',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '26406730-81ae-58a9-9022-e3555e3b5b80','05027310-42c1-51d4-83c3-e3677988194c',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '61420d52-2805-540c-b429-eecef24b7f7e','05027310-42c1-51d4-83c3-e3677988194c',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a67408f5-f790-59c6-9086-3bd63faa4748','05027310-42c1-51d4-83c3-e3677988194c',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '03ec0413-79ca-5b52-9462-f4328e89f4d2','05027310-42c1-51d4-83c3-e3677988194c',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ea246a77-7cd2-589b-899e-6520a8a76094','05027310-42c1-51d4-83c3-e3677988194c',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b238cc89-cc4e-53ad-bb97-e55677e4b313','05027310-42c1-51d4-83c3-e3677988194c',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be5e5770-470f-5cba-9b66-4413123fc43f','05027310-42c1-51d4-83c3-e3677988194c',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5cfa61af-c804-5229-922d-90f663e65b52','05027310-42c1-51d4-83c3-e3677988194c',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '688eee14-f433-5da8-8179-6185ec013817','05027310-42c1-51d4-83c3-e3677988194c',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48d96999-80e2-5c1b-8a12-cf1360619f84','05027310-42c1-51d4-83c3-e3677988194c',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e582c646-e845-5aa1-bc4c-7ac5c8632784','05027310-42c1-51d4-83c3-e3677988194c',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cadf796a-1c43-5ed9-b234-84565a2cb734','05027310-42c1-51d4-83c3-e3677988194c',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b52699d0-d478-55b8-b5c2-4574e638fa55','05027310-42c1-51d4-83c3-e3677988194c',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42b41ad3-9f37-532c-b293-e7aa0482fa82','05027310-42c1-51d4-83c3-e3677988194c',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a9f4e650-1df9-582f-99b5-cdf76b92bed8','05027310-42c1-51d4-83c3-e3677988194c',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '38e172b1-0db1-5dbc-a0c5-26660a448dce','05027310-42c1-51d4-83c3-e3677988194c',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'acf6dc54-bd5b-563a-afb5-63c778f9ff05','05027310-42c1-51d4-83c3-e3677988194c',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4158f26c-a60e-5a40-9d34-08808296be6c','05027310-42c1-51d4-83c3-e3677988194c',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0ae2f1e7-5d0d-5990-b32c-e0b4ffd92b6d','05027310-42c1-51d4-83c3-e3677988194c',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'df0d79d6-23f9-538e-af88-f3889a0ef0ff','05027310-42c1-51d4-83c3-e3677988194c',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '727c5a1f-da47-5b04-a8a0-6312ef0c0d81','05027310-42c1-51d4-83c3-e3677988194c',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '599e28d7-871c-56c3-8c92-2b553d2bb490','05027310-42c1-51d4-83c3-e3677988194c',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0a5ce880-c2ed-5e8c-b70c-7468c390a698','05027310-42c1-51d4-83c3-e3677988194c',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '697eecf2-c221-5179-98a3-42c7da7d6310','05027310-42c1-51d4-83c3-e3677988194c',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '955de07e-ea99-5b5e-80c2-4757893fa197','05027310-42c1-51d4-83c3-e3677988194c',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0af3b651-b734-57f0-b7de-f56de412853e','05027310-42c1-51d4-83c3-e3677988194c',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8db97812-4e90-5fdc-8afc-e2612b960dbb','05027310-42c1-51d4-83c3-e3677988194c',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f0a31cd0-a94f-55cb-958d-0c10801461f5','05027310-42c1-51d4-83c3-e3677988194c',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb5f1ea6-0a6c-5b2a-898f-e6eec3d1173b','05027310-42c1-51d4-83c3-e3677988194c',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14b095c7-b84e-588f-933a-fe7e38e81be3','05027310-42c1-51d4-83c3-e3677988194c',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6dd32e0f-82bc-593e-ab96-8bdb83cbb488','05027310-42c1-51d4-83c3-e3677988194c',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd9425028-f117-50c1-a040-3785f80af685','05027310-42c1-51d4-83c3-e3677988194c',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c68110b5-ffd6-5374-a21b-1ed51772f92f','05027310-42c1-51d4-83c3-e3677988194c',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1f6e411b-9164-51e9-b003-e9a068399190','05027310-42c1-51d4-83c3-e3677988194c',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd9ce7088-f1e6-5740-8291-7c70a4aa28bc','05027310-42c1-51d4-83c3-e3677988194c',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '31ae9b2d-b083-5f24-8226-38e0399a7945','05027310-42c1-51d4-83c3-e3677988194c',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6fa950e-e826-551f-aab1-de0e28b1336d','05027310-42c1-51d4-83c3-e3677988194c',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a0b7255-5266-56d3-82c6-aa1fd462f9cc','05027310-42c1-51d4-83c3-e3677988194c',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77912ff6-62b9-5d85-8265-3fce544d17c7','05027310-42c1-51d4-83c3-e3677988194c',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8484c9a-be49-5a16-9880-d1caca383924','05027310-42c1-51d4-83c3-e3677988194c',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bf4384fd-23c9-531a-a113-58d70f145886','05027310-42c1-51d4-83c3-e3677988194c',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c029de8a-95f5-530b-8435-74a6d6e2c981','05027310-42c1-51d4-83c3-e3677988194c',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ab73535b-9e5d-5e40-8d5e-43141af6bf27','05027310-42c1-51d4-83c3-e3677988194c',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c49b3798-46f9-545b-ba98-414c0c84dbe8','05027310-42c1-51d4-83c3-e3677988194c',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7358fa44-5208-552d-8582-2fbcd2974fee','05027310-42c1-51d4-83c3-e3677988194c',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '84d73ea4-0cc1-55df-800e-b0a158ebf66f','05027310-42c1-51d4-83c3-e3677988194c',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6530791f-0eb7-58f2-acbe-48571c7f0e04','05027310-42c1-51d4-83c3-e3677988194c',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd9bd5a36-d089-5393-969c-a2314db30742','05027310-42c1-51d4-83c3-e3677988194c',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6a56d765-09d0-5765-9598-fe8efb175b79','05027310-42c1-51d4-83c3-e3677988194c',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd488b83-00b9-5629-ad6c-c1e3f975531a','05027310-42c1-51d4-83c3-e3677988194c',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '37669654-47f6-583a-8975-7f701f862fcf','05027310-42c1-51d4-83c3-e3677988194c',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6d71f563-120d-5ea2-82a5-61493ad99948','05027310-42c1-51d4-83c3-e3677988194c',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd2da2686-9329-5400-9d14-d681e3157ee3','05027310-42c1-51d4-83c3-e3677988194c',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '183417a9-7168-5908-b0bb-4bc0edeaf5f8','05027310-42c1-51d4-83c3-e3677988194c',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebf8a628-46e5-5ea8-a416-fb2118d0d41d','05027310-42c1-51d4-83c3-e3677988194c',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '400d9154-19e2-5d82-aa8f-2df944e933d8','05027310-42c1-51d4-83c3-e3677988194c',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b02a013d-ea40-5e6d-9789-c92cac6c481d','05027310-42c1-51d4-83c3-e3677988194c',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bb3f70c8-ea3c-57fa-8f4c-4a937a2d92c0','05027310-42c1-51d4-83c3-e3677988194c',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bf40efd8-ea74-59eb-bd8b-02810beab8be','05027310-42c1-51d4-83c3-e3677988194c',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0a56cb2f-6917-5c73-afaf-190e1648ad86','05027310-42c1-51d4-83c3-e3677988194c',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d837b53-9d58-5050-86f4-e2f2fdfec8de','05027310-42c1-51d4-83c3-e3677988194c',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a400a321-7cef-5e66-b38a-d3e54c17c0e7','05027310-42c1-51d4-83c3-e3677988194c',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd21d306d-2087-572f-9642-c140b3e7dc9b','05027310-42c1-51d4-83c3-e3677988194c',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e0478058-1d4a-57a4-8793-8a31ac899541','05027310-42c1-51d4-83c3-e3677988194c',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63b71d73-4eda-5a51-b97a-77babb07b599','05027310-42c1-51d4-83c3-e3677988194c',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '791e85b3-6130-5b6c-a88b-c7702944c773','05027310-42c1-51d4-83c3-e3677988194c',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5042e8ca-20e5-5970-ad34-1f32d454fbf3','05027310-42c1-51d4-83c3-e3677988194c',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b5436fc8-b658-5499-bdda-aa831d8381d3','05027310-42c1-51d4-83c3-e3677988194c',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '514d2857-2766-5fb0-b15b-7a90ab0b5e80','05027310-42c1-51d4-83c3-e3677988194c',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9b9378ee-b3f8-5548-8798-1a3a22f49e8e','05027310-42c1-51d4-83c3-e3677988194c',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4bac93e6-a510-51ea-9906-6827e7b1497f','05027310-42c1-51d4-83c3-e3677988194c',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2bc95d9a-a538-51f3-a015-2e19f0993b47','05027310-42c1-51d4-83c3-e3677988194c',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '258af094-c9e7-5f9b-aeb3-171587276745','05027310-42c1-51d4-83c3-e3677988194c',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d693293-62dd-524f-ad63-235de0e815a5','05027310-42c1-51d4-83c3-e3677988194c',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5684fd68-8ad6-599b-a2b7-6d9fcff182ef','05027310-42c1-51d4-83c3-e3677988194c',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aa41fb7e-4b30-573c-a644-cfdf5a453591','05027310-42c1-51d4-83c3-e3677988194c',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ffe0a6ce-35c1-5256-a740-0f0353201f1b','05027310-42c1-51d4-83c3-e3677988194c',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5b95966-5219-5f85-8879-8cddc06b6fe3','05027310-42c1-51d4-83c3-e3677988194c',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ab2d16c-55ad-53ad-96fb-fd5b11e2271f','05027310-42c1-51d4-83c3-e3677988194c',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b01335d3-993a-56c1-8d12-af65cbc82c83','05027310-42c1-51d4-83c3-e3677988194c',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd7ee1264-06c4-5a2a-ae91-0653726f1e67','05027310-42c1-51d4-83c3-e3677988194c',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '386876ab-893b-5f63-b7a8-354fa8417bfb','05027310-42c1-51d4-83c3-e3677988194c',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8654b35-196f-5f5c-980f-1ce142749fa6','05027310-42c1-51d4-83c3-e3677988194c',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f4ca0864-5652-5c2e-bfbf-b5ea1f7a5764','05027310-42c1-51d4-83c3-e3677988194c',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3072ca1c-dd00-5503-916c-614a6c4bbee1','05027310-42c1-51d4-83c3-e3677988194c',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a56f4f01-b0e6-5b3a-96b0-e1c288fb5f95','05027310-42c1-51d4-83c3-e3677988194c',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33ba0fd2-14f7-5640-b9f3-53928cfc072c','05027310-42c1-51d4-83c3-e3677988194c',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3f906f97-0824-5643-9b9d-416b2e815de8','05027310-42c1-51d4-83c3-e3677988194c',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd1f7e1d9-955a-539f-b345-57e4196686bf','05027310-42c1-51d4-83c3-e3677988194c',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4647a9f8-7d1e-5569-bed8-c6c9ed88153d','05027310-42c1-51d4-83c3-e3677988194c',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4256cd7c-95ea-56f2-a8c4-eac12e69d2ad','05027310-42c1-51d4-83c3-e3677988194c',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06c89673-8250-5397-a9f8-f01ae86fdf09','05027310-42c1-51d4-83c3-e3677988194c',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac572e38-5ebe-5893-8ce9-18d5962d0eea','05027310-42c1-51d4-83c3-e3677988194c',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e3240b59-eea3-5047-b097-ba98def3056f','05027310-42c1-51d4-83c3-e3677988194c',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '67f041ef-9f88-5708-b7fa-0ca920fa2426','05027310-42c1-51d4-83c3-e3677988194c',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '556effe3-090d-5598-9798-cf195750fe0f','05027310-42c1-51d4-83c3-e3677988194c',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aea08f95-a47d-5e93-895d-f342a3b68265','05027310-42c1-51d4-83c3-e3677988194c',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af3d73ae-d1d8-5508-980d-93ad09fcd423','05027310-42c1-51d4-83c3-e3677988194c',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2eab3902-4ebb-5894-b05a-97f6bf5638cb','05027310-42c1-51d4-83c3-e3677988194c',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4770a2a1-a829-58e3-9e08-887d0ab4b1f6','05027310-42c1-51d4-83c3-e3677988194c',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '300ce4bc-86c5-560e-8543-dc561567ff1f','05027310-42c1-51d4-83c3-e3677988194c',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd2a067b-9ad1-5cb0-b9ef-10870a74cce7','05027310-42c1-51d4-83c3-e3677988194c',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '90cb7956-2138-5501-86d5-f3c9865b113b','05027310-42c1-51d4-83c3-e3677988194c',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b8c732d-929d-5d5f-add1-94f75b197401','05027310-42c1-51d4-83c3-e3677988194c',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1ca204cc-3c7f-5f22-a0b9-6b575d11f8cc','05027310-42c1-51d4-83c3-e3677988194c',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3a9f6d8-f5f4-53ac-9f6e-f6dec83a4bfc','05027310-42c1-51d4-83c3-e3677988194c',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6259cf7e-e32d-53ec-8534-63fa2d74c53a','05027310-42c1-51d4-83c3-e3677988194c',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97a40fc7-fee0-5c68-a90c-acdc60a44969','05027310-42c1-51d4-83c3-e3677988194c',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3ed2efa4-ce16-567d-b89b-9b3ae4542c6d','05027310-42c1-51d4-83c3-e3677988194c',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '887cd48e-2dee-5e62-8138-3e97fb145600','05027310-42c1-51d4-83c3-e3677988194c',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6fc6dfb0-848d-5366-a303-34e3c59fead4','05027310-42c1-51d4-83c3-e3677988194c',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '44818827-f633-5802-b817-3b6cdbd10464','05027310-42c1-51d4-83c3-e3677988194c',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('33cb93e8-a882-56c4-b116-a494ec9f7ea3','keuring-cluster-3','Keuring Cluster 3','military','military','intermediate',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 3", "cluster": 3, "description": "Dutch military (Defensie) Keuring Cluster 3 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '781a6e5c-a170-5429-9ca9-f9e0035e09e2','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bcccc8e3-446e-58d1-9b94-0357b964bce5','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a1702075-439c-5cc5-97df-62fdafb92cde','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '770a9b7e-05d3-5255-a7b2-8a9f8bfaed19','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20d92875-a220-5dbb-a932-672561f5315a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '595dfc1f-cef2-558b-92d0-8d3eb9979b05','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7d7b821-5598-5943-9829-9e340857dd94','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62b5b1dc-1e16-5a80-9d1f-ad0b7a2df8f6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c786caf1-2d42-5140-9bd2-2f2dcea042a1','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd48c55f5-5e39-5d8a-9c71-a38efdec7f66','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7c5e7a9-7954-5e0f-8d69-cacd7c4478e8','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80374303-581d-5002-aca0-f93ccd4f4f46','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8a3aaf6b-ee79-5f2d-9b2e-b5eff63deb79','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4b1b7aea-71d6-551c-be26-8836b885d7a3','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd16f4774-3580-5d66-8038-8f8c1122acae','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a310ab79-ca62-5a29-bcea-1c96a5ddb8ae','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a3e00cb-9eba-563b-ad80-ba605efc1b8b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dc26884c-37e0-55fb-b179-03326f73abbc','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '79808e41-b1db-59f4-bdbb-c2b893566705','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f996b4e5-e9ad-51f5-864d-66fdc5447d7d','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1f27bd88-b4e2-5054-abba-ac2e7f490bd4','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e20dacc3-41e5-5d4f-8c8c-7f482245513e','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2200-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2200-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0c97090a-045a-54b4-bfa9-023fd74e7a3c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,0,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b58b8896-7e7c-5170-8806-7824fca62f5f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6811a0a0-0fa3-5545-8574-a483380706a9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ed91c0ca-7429-55d9-9acc-348d50685a80','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d55c9eb-1915-5bd8-bdaf-6e36c07943b0','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25471437-a464-53ed-882f-e8b9be268606','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fa39ed16-8054-5c42-8f73-ed28f5b98e92','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2c55e28-b025-5c91-b823-86a1e1b69576','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd1486d77-f62f-549b-805d-57bfb7b82bda','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3f6980d1-7e1c-5fe9-9669-1e744090e398','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8fdcf194-eccd-5e16-8fe6-fbca069fbcbd','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '01762f90-ff5b-5a1b-86fa-7d693e8763df','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd95e5e37-3822-52e2-80f2-2c6336d3ab52','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bb89b89e-1c77-5923-8770-0e225edf6492','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '16ad5a6b-d9fd-5bca-b0d9-b978b3f4ee25','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '457b7d5d-7098-5886-9f7e-e012ed4cdc84','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '00e7bf51-3585-5e6a-ba1c-1107eba70326','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d30ee9e-129f-558e-ba2a-6145d58d55f5','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42506311-d866-5e2d-944b-d8aafc4d1af7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b35bf112-bd76-5e3e-9425-8196c9d264d2','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc94a9f7-c322-5c0a-8638-07cc7d820793','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '270a5cd0-bc0d-5a99-afc6-b877a0484f97','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd6acd29c-0c9d-5041-b8d9-0a8783d620ce','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ddb8dd7-2ede-561d-bca1-116b310d957e','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8b28b5e-6aec-57de-baf1-9539e4e3d419','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c86b3a4a-5fa4-5fb7-b658-35db2c49fa2f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afe80082-3b0c-5503-bfac-d67dbaa8aa6a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '666ee31e-30c1-5af3-89f8-48fbcc914a28','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eefa9feb-e9c7-561d-b5f4-e9d57d111c3b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f79e2e7d-afff-593b-9bc5-e9e98ee46622','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fbca1007-7103-59c4-ae4c-48a4012fa7f3','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c9710415-fc10-5b56-a223-d587264393d7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0d99c697-2685-5b02-889a-66f9450fae54','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14c1a527-b16f-5208-bdfd-47df5ab89388','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b6516382-97c0-51a3-a666-84212a8f4b17','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd4ba530-3563-5936-b8a4-0da6583fc7cd','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '19c68f48-24b7-5157-8c60-25fa513c6d6b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'db9d9650-0c53-5ede-9474-00692f25bdce','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'de861b69-5715-53a0-8767-275b1c1cc4ac','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ca86f83-ab72-5fea-b606-24d276810fc9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3049c8b7-e958-5b0f-af45-089b3c46f352','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c543f547-a477-561d-9e75-d97aacadf628','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b404ebd1-0300-589b-9d54-cf9d79eb58c6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9e6c98b9-1b13-5047-afd0-297c2b2bea0f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd06f4f6-c6fc-588e-840e-ae3c8b751af2','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0cb169cd-3e2f-5d53-ac1f-62b2181fb1c0','33cb93e8-a882-56c4-b116-a494ec9f7ea3',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f14033b3-798a-57d1-8f6b-b2588263ee08','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e69316d5-4856-50bd-95ac-568fe37ed68e','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65e04ccf-ea0d-5e43-8c54-e7e930b39aa0','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f0a156f4-8c44-5489-b0f1-920cd0a9831b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'de111ddc-bad3-556c-b1cf-40f91a85f6ff','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '38b4e5da-3f33-5341-9c17-0a37c5385ce6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cedfc344-ad50-59f7-8e24-92d62fe4277c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89f01380-dd32-5339-a32f-17166dca8f26','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '039ff241-120a-5a8b-82c5-d875e5b23ea9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50192ca5-2c53-5686-8159-19910b28cb5c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2200-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2200-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd14310d8-b8cf-5348-8a32-45da519454e8','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ec4a490-1324-5562-a114-6e4e0d9a0b24','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86b71a2b-01a0-5cf7-b07b-9c7825ee1b93','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c1154cbe-ff3b-54c2-b352-00ef64025bc6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5ceea0d1-7dc0-51b8-a751-a3716a28045e','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e17dfe2-bc5c-5f1b-99d6-085e4b2c369b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2d0993ea-6ced-576e-ba43-5e27be1a2bdf','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '60449a26-b27d-58b1-8d6d-1a83be88712c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8e4f6ed2-3d30-54be-b7d4-1a2b89e48985','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd7302b1-ad53-5db4-8565-e71ac41f2f0f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '707d0fa2-978b-500c-8f7b-e1e753bbd336','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a8d36e6-770f-58a3-b6f9-a6b54b2158ee','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '370471ed-3600-5147-9660-28b2f23d36c9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eb71bb0a-c3f7-5dab-a2fa-d8bdbe4781db','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b57904d1-d57b-5a68-b6d3-fca5b4d41a61','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '157228af-9da2-5747-98c0-dc34f4a4f32e','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '570c47ee-d937-5a4d-aef6-c1a50250f74a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9f00fc10-cd0a-5d15-ac14-5407f155d679','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '784bb02c-bd9d-5fea-b531-de5a5eb32b78','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc6717c3-7a5d-51d5-976a-cf7d36d99727','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '23bb34ea-26b7-55c4-ad67-f485f9e7a149','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ea09164-17d3-5941-8e7c-d34c3cced5f8','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6489345c-6306-51b1-934b-b42094e75c90','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'de65e4f2-508c-5bbe-b249-1233ad1f13d4','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '59282bab-62d5-53db-9808-176f897e3726','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '454a9d84-023f-5648-a7cc-a8961fa538a7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '21f2ae9e-8795-5eae-b732-bd34c9854cc7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6f7f2aec-236f-51a7-b4bb-88eda574b619','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33fdedfa-9cac-5860-9187-a1ad07bb0d6f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cbe38502-4778-5a9b-9908-352928d2ef66','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ce7f04c9-3ac3-5993-8511-23f11f3726ac','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8502d2a-87cd-5fca-a2ad-903dcc68a0f2','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5210f54f-c5de-52b5-a7c9-9a9d29b90383','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '53eb6746-c331-56a1-ab39-1b17fc91c77c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ed4918d7-da94-5a0a-a8a8-8bdd30c352f6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e935b58-6f9d-5913-a8b4-006718530f33','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ff99c522-ca9f-54ff-af58-d0707eb054f9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '34a2d3e9-6731-5001-b4fc-6076513aba5a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7beb7a8b-30b9-5bd8-9c7f-472f1ad75f81','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8b493086-a454-52cc-a1c0-ad6f813a41f0','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af8a211a-90d0-5c86-b89f-e75e3dcbf1a3','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '31ff092b-8b1a-52ba-b82a-031e04540005','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'df9b4e01-0b2e-54c4-9d12-611ead2be3c8','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd7b70945-e7b8-5b51-8fae-a6e3ad3b16cb','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '47c8136d-928f-5763-868c-a9420a8256ab','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd04a60af-75b9-5b60-a247-4fb7c817cae1','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65fd3384-1f8d-5031-a5c4-81c1c559775d','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '468a4f64-0423-5c36-b5b7-6423daf8a4cf','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c985f840-9175-5ece-b820-0562c475024a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7e33b49-2de3-5c12-8953-7cf25929319b','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9adf6f26-ab2c-5848-82cb-aee8c20f06d9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd77a4de-e86a-5b44-8522-18000d4444fe','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c3a7387-a893-525f-8209-d04f59ef2952','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd6d9f98e-eb4d-59e6-8b2d-98b5dbd9da8c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '13882b6e-a5f1-5b9b-9b4e-1c3a8eac8d1d','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77547514-c9dd-50bd-a652-f1236ce66b4d','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'deee43e0-588d-56ed-9717-415e926715a0','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '351650a8-1ff6-524e-9094-b7f696cac351','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '338b6b23-6596-548f-a239-bc00664b26c6','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3be91a3a-bf3d-5a48-8510-0e0fd6a58fca','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '413f44da-ccbf-5e0b-aa89-75012c0d9aba','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd4157ca7-8673-5363-8a48-f2c940eadd9c','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7acee3b7-509e-5451-8361-3f6d5d8d3a1f','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '186d96f1-2914-5eb4-86a2-3e0a245de02a','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3f8f2e1-68a9-5a4f-a6fb-7adfed11e7e9','33cb93e8-a882-56c4-b116-a494ec9f7ea3',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2','keuring-cluster-4','Keuring Cluster 4','military','military','intermediate',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 4", "cluster": 4, "description": "Dutch military (Defensie) Keuring Cluster 4 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'df99cd95-661f-5564-af68-30bc7413f3c0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9b1abdae-64f7-58ab-ae13-f6a8ef62e2d3','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f7e936f-4a55-5426-b684-67063d371de2','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a2998873-5e2a-5bde-b142-6b1aef786dc9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4a9a66d-a5c0-5d73-9751-8640d78211c5','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14f6d8cc-1195-50ab-b04b-14f083c4a28d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '51a57680-16a1-53e3-a2fa-af8aee2ecf3f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c0645c2b-499e-5908-87f4-2d57cb5d1526','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5a1c588-cb70-5f8b-9a00-e4db06e87bd1','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2690fff-74c6-5620-81e4-c5cce30bf867','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6617e438-e1ea-5193-a06c-119205f001ff','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '81a1aaa2-9f83-5555-b5d9-0d0196f8b98e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ef39bdb-4652-55f8-849d-856ba60d9778','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9db6ce14-080d-522f-b990-d19cfbb002a8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '98a519c0-2dff-5190-a748-fa3fb2e2f7df','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '864730de-f0d7-508d-bea5-05f8f89ebb71','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c09243f-779b-51b7-bdde-584bc82e4ff9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '91e737da-1112-529e-b41a-0c83d410c093','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '140c0baa-28f5-560f-bb93-538675b81252','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '11fc96af-b771-5566-bea3-a73909f1042c','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebfb5c78-f8ee-5b51-aa5e-73b5d871f5b2','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee35a2c4-5038-50ee-99b8-2034e9f85454','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '13be2ea6-7935-5001-8f71-8c5e4b5988f7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '96cc4efb-0555-5b1a-b29c-4e495fc3fa22','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '163be971-c9e1-5d06-97b6-025178b8f0a8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7193ecd7-caca-575e-877b-83cb429a6317','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b55deee1-e574-57a7-86a8-866ff9b1fbfa','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ec341e4-a751-5db7-9879-9863c2bc261d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c439b5a1-6eff-52cd-a3d9-3baf96a9fb8b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fafd616c-8d1d-52fe-9607-0690401516e0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac8b250e-99bb-5647-941e-70cffc69e994','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ae7eacd0-63bc-5876-b08d-88f63852bc34','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '515ce488-5957-577f-bfcc-4c761e748ec9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f498f047-f033-54ee-9cc9-f84088d2efa6','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '75b472af-2f8c-5120-89fa-1d1267f12519','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5ce05628-e62f-5576-9e23-1a5a0f097f1d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c52e6e4-6780-530c-9318-df430518f13d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5dc7655a-364f-52e0-8534-b313f129162d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c15a2618-0529-59c0-8361-b602828c2bd7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80599887-b1a5-58aa-9e60-7d1adbc38a88','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1bd86f36-cc6e-51d9-bc86-00ffd7c8ff95','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0973892c-685a-5777-a811-bd1f320ea10e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bcc617c9-dd04-51fe-a8a5-2b7bc8c8f4d8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '19c9d15d-7f79-56e8-8d1b-b5267172c5ac','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '841e1baf-2650-517c-9981-c411cd6f8cbc','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c1094b0a-2953-5657-bf54-37106d3906dc','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '203d2365-3080-5beb-9246-4ac098b194fd','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c6269daa-b938-5681-bcc3-15d43d30f2b9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3b139c9-93f9-5817-a579-2ba009008607','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '44e6ad31-3e04-507e-89cf-80b230851fef','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e088098-9d11-5a44-8bbd-0b4f8fcc333f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ba8a9536-f1da-548e-a07a-36b5c216be56','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6fc3cbc-71f6-5870-b7d1-6f0e25420e18','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '22a35e8f-2243-54c1-9e78-79643042199f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a4ea6223-70cf-5496-96a3-fed3028848ca','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aae7ce99-ef21-5359-9914-7afb0cb807b4','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e7ce02f-6b33-5d33-8752-2d1f06883af6','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77f01a6a-0a90-50a0-932f-a9895c07f508','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2c7d2a46-c770-5d5b-b7ba-345c7a212e07','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20db8c62-41cc-59d6-9389-6459fefcf5ed','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd8a1807-827c-5e1e-af80-dfac54166f44','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c9feb6a9-ec24-55e4-9ed4-7b5a02f95ec1','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a0f7004d-b9a7-5c6d-a5ff-4d2477572f07','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc9f8c0a-d120-586c-b854-d1fb6e7c3c53','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63e3d57d-3d47-516a-b25c-a563da480964','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e977b6a-45ee-5b98-8fb7-ebda1a4acfb8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b12d2d61-519d-5738-b059-53840b5e1508','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '10e34e58-cbaf-53d5-94cc-d1636d11306b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '29d86f3e-f4da-58ce-aa76-a3360ecca000','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a2c5479a-7e32-5fa9-b6dc-69db11640f9f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5782450c-89a4-5094-a4d0-a0d41827a819','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c557b767-1850-5606-8605-aa8326ceaac8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b6b14ba-57dd-53e5-a815-363405446c7f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '59728aea-b645-50c0-a8de-6298e825e682','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ff74b8bd-ce86-5fd0-bd52-74256b62c149','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '342d8bc4-e43f-596f-a7c0-5e5b9e85453f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ad9c6f1c-f7d4-5f9d-b96f-8bb19bce9190','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '227e016f-3d60-5f1f-b34e-cb4456c7b076','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f34bc8e0-1220-5e6d-b557-10f5f5dfad3f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8062b8a-9280-5bd7-a467-fe7b9d4dcbff','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '15684944-df47-5305-9925-3201d40b57f7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfc0dd92-48bf-51f7-9491-41528f4473a4','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6818260e-3815-5d48-8cae-0ff9ce024569','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '75258863-4404-5e7c-85d7-c4bfdbdabea8','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cba4daf-84b5-5bc7-aa46-d0fb4ba6247a','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3eae7427-1018-5039-b31c-94e2b2a394b2','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '26d844ce-503c-5f78-a48d-b5db68351c8e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1a568723-8e75-5d0d-b5b5-286b4cea4b5e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5918f378-8a0e-5dbe-be63-03abf4107505','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '27979e37-35c1-5db0-a318-6cfc7560289d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '05dfd74b-22f1-5a79-a8fb-dce1b8a3591e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f58a5def-e34c-53d7-8e47-982a72380d18','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '374211b3-7e6a-5f2e-80ca-c309ab30f31b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50d78056-4199-55e3-8c1d-95c26b489328','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2a013d2d-449b-5462-b859-1866d8bbf103','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86ff2df7-c9f5-5a5c-a297-33a4c440d6ac','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6b9182ac-3c11-502a-a54c-410e5c5712f0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '785fa158-f208-59de-a37e-cefa36c5655f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8aca75d4-441e-51f4-82c1-e04ec7ee2125','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2b1f821-b849-5162-a72a-e59a6987ede0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6de45909-1562-5658-a389-c9a4754d9d4e','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '40183776-8a1a-5802-bea6-d2d0d33028d6','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2988960-06c5-5c98-8d6c-451bb2c39b68','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '78dfbe0a-748d-5673-9ecf-7288831dd4d0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b7e746c-7469-59ff-bb38-f096ac254b82','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '508ebaca-a7c7-53d8-84f4-3952dc0847a5','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '17ec72d3-0bd3-5ad9-9be7-e6e4d76f6296','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '28810eaf-149b-57f6-b149-94741f55221c','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94bdee03-2e16-5f8f-bd8f-60636867cd32','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6169ea65-e1bd-54c9-bfc5-7455e9e54f27','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c3ecd80-54a6-5e0b-874a-e59da401a188','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '225052d0-b214-5a4a-872b-a259975c16b9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '368134b9-025e-592f-8f9e-d8c4ed7f6d4c','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5f83eebc-ce09-5de9-8dfa-b9005a4d9130','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6a358c1-c6a0-5a28-806d-63245e48359f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43cb385a-51fd-5664-bd19-98896666336b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'decd9c06-8383-523a-a421-451da3e469a7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4f8c55f2-d46e-5f2d-8190-ef4307ed23d9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f7c0cfdb-77d6-5db2-a91a-c55f19138401','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0ffe828d-9882-5885-aba7-7fe0043845a5','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '782cd7c2-3e85-5998-bcf8-d7026f81ebaf','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5ef94b3f-5bd1-5658-b27d-2cc213ef2ed7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89d4ac9c-65d8-5cb5-bd6a-12d0fda31471','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97b00ae3-69d2-5d22-99bf-50cb846818d1','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '74425b4c-5946-599f-bcd8-88ba8e435b3b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd30a54d-137d-54b7-850e-0c6db976b0b4','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '24f6517e-1fc2-5068-9de1-1589957b2c7f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f700cf3a-a0ff-5222-8911-959ebd355c0d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '68cff2a9-e4fd-5ca3-a9f4-e10f2a16205c','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '183d8ab9-2d0f-5df8-9a0f-7bca9abfb31d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9fa01994-b5d2-5975-8382-5ef30415ea25','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7e576f5b-19f1-538d-ab7d-bc2591b04da9','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b1ca056-6ed0-5a75-a4fb-ad27a75694b0','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1cccbe49-4e6f-58bc-a851-ac5500d2f9a1','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5adfe210-36ac-5cc5-861e-4a1d67999831','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ecb8c42-4fd9-53d9-a7ca-7141df2b803f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7103d6ec-6434-5317-8f7d-fd60c7350331','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9b054d34-65f1-5436-9619-d4d6771d1d8b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '81335c3a-5c3f-56b2-b544-edd35c955c47','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a0953f5f-c3b7-51c2-924c-0c8ea113dc2f','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ab9536bd-3dae-5aad-a93e-930b243430c7','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cf156af-3d8f-5ea7-9608-aee5e6d85be3','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2191eae5-a2d8-57aa-8c8d-d51d63dc4d6d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ea6fdbb-50c1-5114-8adc-27ca5c4f745b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '56a7743c-5318-5b29-ae15-d37df7ef000b','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e417b87b-0125-550f-b06e-08129a8f0573','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ed76ad8-7835-57e5-a70c-6c59891b9a14','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('48f897de-7f10-56c1-9b92-5097ed7df48b','keuring-cluster-5','Keuring Cluster 5','military','military','advanced',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 5", "cluster": 5, "description": "Dutch military (Defensie) Keuring Cluster 5 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee292957-7ee8-5c4a-a4ad-3a7d06acbbf2','48f897de-7f10-56c1-9b92-5097ed7df48b',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7033e59b-c711-5a8d-91fe-53b06d73bc01','48f897de-7f10-56c1-9b92-5097ed7df48b',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bbdb1847-c5f4-5514-b6a6-f1f7fa4711a7','48f897de-7f10-56c1-9b92-5097ed7df48b',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ca1218b-d554-5bde-b054-c76c6f58bb4c','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bb8e5073-8b13-5e0e-8c18-4bf6e25b0a08','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3bf5b5bc-90fb-57cc-b89f-0366d3d2c7d9','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d531f32-64fd-5136-93a2-69d43fd64371','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c0267b71-435e-58c1-854d-eed18dd1c6a9','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '655bad63-b4c3-5b52-bfb4-8a45d9b89b26','48f897de-7f10-56c1-9b92-5097ed7df48b',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a55ce2d9-d9b6-5d80-a450-531b859fe397','48f897de-7f10-56c1-9b92-5097ed7df48b',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bf8962d5-bd2d-5f3c-a6b7-f6244c082af5','48f897de-7f10-56c1-9b92-5097ed7df48b',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c3221d2-33f1-56bd-a6cf-c1a89bbfa7fc','48f897de-7f10-56c1-9b92-5097ed7df48b',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8fcd0d3-fabb-5574-88d9-f78f071a2e1f','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5ceccce-5022-592b-a957-1606431eebe5','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8209d189-5c1c-5164-8f34-6bed854e96f1','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f90b2e8a-665c-5551-81a4-cfa6fa2aa49d','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3f46843e-9106-50e7-b555-e89dbc3561c5','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f4ab8067-6cbb-574d-af61-069feaea5a84','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '198aec55-a594-5cb3-9d03-0738601beb6f','48f897de-7f10-56c1-9b92-5097ed7df48b',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4dd6287e-1b2f-535e-87ad-bb9aec2e84be','48f897de-7f10-56c1-9b92-5097ed7df48b',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a34e64bc-f108-56e0-9b43-db0ba04d400b','48f897de-7f10-56c1-9b92-5097ed7df48b',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd4ccfc8-e940-5e07-b333-709ce750eff3','48f897de-7f10-56c1-9b92-5097ed7df48b',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb2c67b7-b491-5dd0-b881-88a1cdb23c68','48f897de-7f10-56c1-9b92-5097ed7df48b',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bc35b328-2543-5f68-a20a-654e3b20f536','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a4e24bed-9e73-5007-ae58-13085515a4a6','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '247c242d-4f06-57e0-8dd8-fbd746022b5f','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bb25ca02-f157-5f5e-b80c-6ba944d7158c','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3a934d34-c123-56a7-9290-dfbf18c9ac38','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94496bc7-7b48-508f-aa90-a70708962cf3','48f897de-7f10-56c1-9b92-5097ed7df48b',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dab3d68f-a706-59bc-bbdf-cc814eed8b58','48f897de-7f10-56c1-9b92-5097ed7df48b',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be6f22ce-f8a6-5f0d-a6df-1d828ded642f','48f897de-7f10-56c1-9b92-5097ed7df48b',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '393aa85f-e78c-54ad-94ed-438ba0765b45','48f897de-7f10-56c1-9b92-5097ed7df48b',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6442655f-c435-58c3-8827-25d6dce6abb5','48f897de-7f10-56c1-9b92-5097ed7df48b',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94dda1cb-aaab-5d26-9651-3f53099a065f','48f897de-7f10-56c1-9b92-5097ed7df48b',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e97ddd60-82f9-55c9-ae98-24a3e2a116b8','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '64c4e1a3-678c-5327-a644-6008405f3c55','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32d84ddd-efc0-5feb-adfc-55a75236f497','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cbcceaa4-de4b-5f8d-86d1-2492ba8ccd3f','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ca715ef3-aec5-542d-a82f-dc89ff341e12','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '293a9194-9f8b-5562-ac42-ad2870a0101d','48f897de-7f10-56c1-9b92-5097ed7df48b',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '24bb8a51-4871-5a58-b82f-30e7dcf833a0','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '999f2504-2ef7-51b7-a1b6-9de14b73795b','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c92c22a2-c798-575b-9f19-32bcf793ecd0','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2272f539-7838-50cd-984b-be14d2a701e9','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e0ccbb39-e6e0-504b-9fb7-9573bba5a25d','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '286d5e8b-98b7-5d4b-a7ba-95d6cd87ad96','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d865c28-c65b-5a28-9e16-0fc41d71a655','48f897de-7f10-56c1-9b92-5097ed7df48b',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '88ad65c6-02bd-5da5-8437-2bab4cb27404','48f897de-7f10-56c1-9b92-5097ed7df48b',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b86d02d5-8e54-5d2f-a6f5-694c5ef7e868','48f897de-7f10-56c1-9b92-5097ed7df48b',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fdbbda24-91eb-5e9a-a7ec-f369c8f1e7a5','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0173d405-5ae8-54c2-aee0-d9d9d6092abd','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ffc9925c-9a6c-582e-8fa4-aa7e5a95432d','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ba51330e-70fd-5acf-98c0-63635220cdb9','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '16efee19-06e6-5172-a89f-0a6134bdd59a','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd14dafbb-88ab-568c-b5a7-441dee9f6c9c','48f897de-7f10-56c1-9b92-5097ed7df48b',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d3a860c-5061-5fdb-9ac3-97eefaa3c75f','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3a7ddc2b-384a-55e0-8529-e039fa18a71e','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b5418c7f-2180-5c59-bbab-635c22f2cdd2','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fff35fa0-4ae7-55e4-8c18-052c79460555','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0dfb95e1-6460-500b-b556-30fa62be9d46','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'abf88873-8e76-5758-b658-dd54cafb2c93','48f897de-7f10-56c1-9b92-5097ed7df48b',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7e2089f3-50f0-5cbc-802f-bc046e0c2fc3','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'da09d575-1a03-514e-a59f-cfbd18000dce','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfe50ea8-fdda-5da4-9453-50057d5afcaa','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e2b5fdc-41dc-5233-895f-ab281a54d672','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e154a850-fa49-5cb0-9ad1-9b9858a634ab','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c62ef11-f3d1-5f4c-940f-08e9398647c8','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '925cfd15-679f-5cc0-8a26-da52e705e337','48f897de-7f10-56c1-9b92-5097ed7df48b',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e605c6d-d47f-5358-a243-ff9ba086b07c','48f897de-7f10-56c1-9b92-5097ed7df48b',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '610f7124-1ce2-5ee8-9fd6-399a7ad82ca4','48f897de-7f10-56c1-9b92-5097ed7df48b',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a393d012-34ec-5a3c-a562-82dd97f2e5fa','48f897de-7f10-56c1-9b92-5097ed7df48b',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ba265b8-d8f7-58e2-91e8-1a9cc064d086','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'db95a682-f2b3-5726-9223-c119d967bf2b','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d9046de-1074-5788-818c-7939a277c4de','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '96c6700b-2ab9-5fec-bfc1-b3a415169d50','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f53dffe1-bc51-554d-b836-e3d737105f18','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '90c9620e-e9b7-51ab-8949-e7bba699e7c4','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3275729a-c63c-5a26-9f2d-281608ffa354','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '23148289-291d-5181-8fc5-8be7198a6c5d','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f1f1ad18-3334-5246-81f6-e45dd1bea1df','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b04554d2-7417-59d3-80ba-f258038d3adc','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0e594675-6a60-54b5-bc02-81fe75311f70','48f897de-7f10-56c1-9b92-5097ed7df48b',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd714960-6435-5dc8-821c-7713aa5dc5be','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4712288-95a4-5c7b-995c-8241910a8d67','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bc4c4aab-09a6-54d1-aea3-a87a0b18a8bb','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b6be0ff1-3988-58a7-9594-84d34ec01437','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2d6ec04a-484f-5e3a-841d-d1e9d323d3a3','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bdac7673-51cd-5d98-8304-99de14d6a252','48f897de-7f10-56c1-9b92-5097ed7df48b',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e6e6ccf0-a9c2-52d6-9bd3-272fec71cc18','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6403b3d1-bcab-5d90-97b2-508f9006ac9d','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c810596d-cc7e-5113-8033-78ddef5a445c','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bc86651e-6e94-5802-a439-9c084a3a8d18','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '444a5de3-fc16-5d6e-976d-e07af735366a','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7c4325e3-0e0b-5f15-ab0f-6b1dff764ed3','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9cb31690-7c36-504d-8e71-f92501e5e60d','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06f3ec52-a413-5d54-897a-2644ef1556d2','48f897de-7f10-56c1-9b92-5097ed7df48b',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3c564b82-324f-5dcd-8c31-0987014ee903','48f897de-7f10-56c1-9b92-5097ed7df48b',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5e6f590d-1579-55c0-bd12-d3eac1cc5a59','48f897de-7f10-56c1-9b92-5097ed7df48b',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5c1c185c-0ec6-5aa3-ac97-cf8b072758ba','48f897de-7f10-56c1-9b92-5097ed7df48b',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b9cc7a4b-fa57-501b-8c3e-653d17314661','48f897de-7f10-56c1-9b92-5097ed7df48b',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ab6acd6-198d-5dd1-af1e-912c2be6d2bd','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2806a32b-eed2-52a5-9081-ed4b9428ec15','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '92a46258-e956-58df-90b8-b0406f8cb960','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6c984c03-2259-50d8-8285-611ba4d5e555','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0f022e7d-e288-5d2f-bc65-d199acc802ab','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3516e405-676f-5f8a-8a14-2f10e23aa38c','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5cb66b56-b352-54ce-acb2-16d604458c82','48f897de-7f10-56c1-9b92-5097ed7df48b',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af135eec-9359-5ff0-97e3-ca605a3dfe5b','48f897de-7f10-56c1-9b92-5097ed7df48b',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '36fa85be-0dc6-56b8-a9c8-62e8f6e8265b','48f897de-7f10-56c1-9b92-5097ed7df48b',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8290ea28-88b1-5d67-a6b7-faee7cb1cfe6','48f897de-7f10-56c1-9b92-5097ed7df48b',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7167ff5a-bf6e-5a9c-a20c-029998def1d0','48f897de-7f10-56c1-9b92-5097ed7df48b',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77d37943-6274-5dd1-b41c-c2f8dd6bc393','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94cee959-0929-54bd-a91c-162c02fc49c4','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e0492250-8c9c-5f32-83ad-0b9602621b13','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '87f3673f-7716-5c35-a084-dae3ab5a3172','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebc2a364-1ec0-5c85-a52b-68f2e4bc060d','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0fff6815-5f3f-5e58-a9f4-767344f3829b','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b0ef559f-5337-5dad-8749-1aeca544fe93','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bb26cad0-a2ee-5f79-b783-fdb0e815c3b4','48f897de-7f10-56c1-9b92-5097ed7df48b',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c182e6d7-748e-519b-b30d-d5e554738985','48f897de-7f10-56c1-9b92-5097ed7df48b',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7d37b5fb-cf47-513f-990e-207b450eecb1','48f897de-7f10-56c1-9b92-5097ed7df48b',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ff9934a-2c1f-51d9-b0ab-8b330f6d9cf9','48f897de-7f10-56c1-9b92-5097ed7df48b',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-7-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec156d0e-a052-57b1-9ee2-0ec8bb366c48','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '51dcecc7-6197-5d6e-aaf8-eb0e4729bbf1','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cbc41703-0323-5217-9d5a-7728d65be524','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4f7557c6-e3c4-532a-a759-b0752cc8624d','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ea3bc720-03ff-5e45-938b-a78be601c2f0','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='plyo-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f6ab2431-05d3-547e-97ce-64b0d9d0b08d','48f897de-7f10-56c1-9b92-5097ed7df48b',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c7b958a-3906-5b49-9bb1-4ad1f5bbb012','48f897de-7f10-56c1-9b92-5097ed7df48b',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e8c77341-7ea0-5b41-a9aa-7e000979db66','48f897de-7f10-56c1-9b92-5097ed7df48b',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ceae0ef4-1ce7-5b34-8144-956ebf3ee47b','48f897de-7f10-56c1-9b92-5097ed7df48b',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '74319ae3-bfd4-52b9-9ca6-fc13f8a3c9d2','48f897de-7f10-56c1-9b92-5097ed7df48b',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2e05d6b8-b593-5a63-8964-937012d3fb51','48f897de-7f10-56c1-9b92-5097ed7df48b',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee5341ce-e7d4-500b-9b8e-1950e908bf13','48f897de-7f10-56c1-9b92-5097ed7df48b',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c132266-8bfd-5662-8f20-9b7484a9cb43','48f897de-7f10-56c1-9b92-5097ed7df48b',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac01e4e1-9c0d-53fe-b4b5-aa47eae556c8','48f897de-7f10-56c1-9b92-5097ed7df48b',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06c1d335-56c4-5abc-b921-a3534bbbb443','48f897de-7f10-56c1-9b92-5097ed7df48b',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9361ee8c-c479-5f10-a93e-fdb19ee91211','48f897de-7f10-56c1-9b92-5097ed7df48b',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1ee484c-d12d-5d19-87aa-0fdc1d0c7df3','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8a3f03f-0df7-520d-9750-315a1284b66f','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1ea3c475-c5e5-5a0d-b2b4-454ef645f127','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd1c7c3ee-7426-5d2b-ac98-5320cbf1550a','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d4652e2-e9ba-575d-8d25-1e21bfd1b440','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '740eb5d6-70b6-5149-9ae6-388e1c1a2c39','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='high-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '445f2ce5-8e9d-56d0-a408-06ccec29356c','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '955c2d5f-df90-5880-bbc9-7290073bf5d4','48f897de-7f10-56c1-9b92-5097ed7df48b',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('2b083a43-7acb-5d24-96bb-c349c837465e','keuring-cluster-6','Keuring Cluster 6','military','military','advanced',6,'{"source": "defensie-matrix-clean.json", "schema": "Keuring Cluster 6", "cluster": 6, "description": "Dutch military (Defensie) Keuring Cluster 6 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '627ddc5f-1ef6-524b-b7ed-f317d2a121ff','2b083a43-7acb-5d24-96bb-c349c837465e',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a5211967-4b9f-565e-8cd1-f7363647faef','2b083a43-7acb-5d24-96bb-c349c837465e',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '782d3dcc-2246-5d59-911f-b2588b075621','2b083a43-7acb-5d24-96bb-c349c837465e',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='12-minuten-loop' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0c7b1961-932e-5cbf-8998-7d9e94e21569','2b083a43-7acb-5d24-96bb-c349c837465e',1,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '83533c78-98fd-5e92-bbe7-96c644b3ac12','2b083a43-7acb-5d24-96bb-c349c837465e',1,0,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4edcc881-c052-570f-b818-10ef3e10e6b5','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '68461146-3752-57a5-baf1-27b6e24e3832','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b5a62a2a-98a4-549e-bf06-e7c4c66c722f','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '03dc4784-1df5-5d19-b25c-e4e31a0197de','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '998d828e-1a39-56f6-87c0-70a3860c3f2a','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25745c95-a0c7-58f6-b71d-26b30a2ea84e','2b083a43-7acb-5d24-96bb-c349c837465e',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '68c02182-bdf0-5544-aeae-8841c6720d31','2b083a43-7acb-5d24-96bb-c349c837465e',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42e238b1-1a34-53e4-957e-e22eedf61b00','2b083a43-7acb-5d24-96bb-c349c837465e',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c2edfa2a-e414-52e8-9d90-91b924fec4dc','2b083a43-7acb-5d24-96bb-c349c837465e',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2c8b9c7f-956b-5923-93f7-8c76c7749ffc','2b083a43-7acb-5d24-96bb-c349c837465e',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eeaae4db-5a70-5352-a46a-7d2171eb7c48','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e984fa4-a499-5805-ac6b-e36dfc428433','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '75271330-edbe-53ef-9e6b-f25254316773','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb660e2a-54ff-552e-b101-e13f74ff9644','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2783a0c-d962-52e4-8bb2-3a5983c5baf7','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3e79df66-199c-55e2-ae6d-0dca4b8b026c','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a17d1b5d-3851-51ab-8335-977b7f1b0723','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '801b2dbc-0285-5a03-a2bc-2ec441800f14','2b083a43-7acb-5d24-96bb-c349c837465e',1,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'accbc03d-987c-50f3-8df3-48d352608ff9','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6d9f3165-bd99-5f66-8c4e-d6ab180b8d39','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bc40c7ce-a4a4-5655-9459-e63568d0ed76','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '61de0e91-e3a8-5529-b2b4-9336083b627f','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18258506-8239-5aef-b2f2-dd8167d0636d','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '842fac4e-626f-5ec1-affa-3c50fe4734c5','2b083a43-7acb-5d24-96bb-c349c837465e',2,0,6,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b1972a64-770d-55e9-a1af-42a9d72fb7c1','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d551fd3-37fd-5064-a42a-7003fc299dcc','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd53ad243-63cc-5e25-a043-3466a663b090','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '38eb9052-a2f4-5c15-b0b3-464f9a95e8b2','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc0f1e2a-ecf3-5a97-a2e4-1b0cd639ba24','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ccdb4136-e310-5ab0-b233-05aa1eed74ee','2b083a43-7acb-5d24-96bb-c349c837465e',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '030fb7db-e407-52ab-9343-4ff5b64efd17','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '16038921-295a-5278-9eb1-66ae17c313ff','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a305079a-4e55-50ec-90c8-1dbf49276c31','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '926a7e88-8288-5d9f-b218-a5a497f8f53b','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '505feefa-fbc8-5e32-a120-4e7435e24078','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a841ff2-50c9-5e19-9a5d-8367489e42c9','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7d3e80f7-65fd-5138-833e-9fea39ad9d5e','2b083a43-7acb-5d24-96bb-c349c837465e',2,2,7,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec5e019e-e4b7-56b3-a9b4-4b8ff56bef25','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd0fb2091-e2ac-5b52-a2f3-7be7d5bff3c1','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a3ab71fa-e5a2-5189-9aef-a26cd714d2d6','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c36b4fa0-1cba-598c-aad6-1c1349fd61d2','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f0e6c982-dc4d-5b5e-91bb-d0d424ece366','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9b444276-6711-5701-ac22-c00e1c8857f1','2b083a43-7acb-5d24-96bb-c349c837465e',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '10e26b1e-a51a-5e86-9c9f-b52cade0787b','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd63307ec-a014-5bce-9db8-24a6138c40c1','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f5772ab4-e36a-5d4a-844d-96fa46765eac','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '782481be-b43c-5e56-8719-5a0abe20d5a4','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63ac7185-9048-58f2-9ff2-0b8be5535d27','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '304a8b07-c3cd-56dd-aa03-469485d29076','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5302d077-b530-5dbf-994f-79f64f140bcf','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd1c8fd0-26e9-50dd-ac1b-f587570c86a6','2b083a43-7acb-5d24-96bb-c349c837465e',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '490fb36b-8c30-5267-8733-01aea48e465c','2b083a43-7acb-5d24-96bb-c349c837465e',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cd54013-3c6a-599a-824f-76722c21a470','2b083a43-7acb-5d24-96bb-c349c837465e',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe1fe171-aa94-5c07-adef-17f95d72427f','2b083a43-7acb-5d24-96bb-c349c837465e',3,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ab0182b-b7fd-53f4-8f18-0ac210cf3369','2b083a43-7acb-5d24-96bb-c349c837465e',3,0,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7650148a-b474-5667-81aa-303014b2ab43','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a2a5c529-400d-5e3d-824f-18d19eb7c1fb','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7cb27684-fe10-5c3b-8e48-2a11d5d70834','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f7ae711-049c-5251-b9f3-9245412dd5ed','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '72ab8e31-0314-591f-bb9c-6722047557f6','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f7d639af-7b44-5b20-a928-7c7689565959','2b083a43-7acb-5d24-96bb-c349c837465e',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aa9e55aa-45ac-5e85-ae27-156b9f40d1ea','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2bf4ed87-7da0-529c-8f70-eb5a9ef21658','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7c6c990a-5813-5c66-8720-c928f52c78f9','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '83d36303-c5f1-5de5-a365-ba38567b0ab1','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7cb0416-3b84-505c-b762-2719d5854453','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd1fd7b7b-dbc2-5133-af1f-4af4fa991d94','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'acd40bad-b513-5d64-8fc9-4a40b0af63ed','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '251c5e76-5219-5a39-8428-7f59c356f994','2b083a43-7acb-5d24-96bb-c349c837465e',3,3,8,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5f378509-03d0-5701-98df-0e13500399ce','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d4f9ec8-bb58-5e15-b5a5-36744180004c','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ae0e7e0c-f6d3-5a30-a078-6cdfd8532a5a','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2b69c78e-3a75-57b3-a7c4-f17e8974fb29','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '849bea70-24d6-536b-8a66-54743d44968b','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b684900-1037-5e9d-9a3a-05ba23d5dede','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f81cd1b1-aef3-504c-ac26-6d052e3ce7cf','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee9d834f-a9e9-51cf-8b45-71d64ecb978d','2b083a43-7acb-5d24-96bb-c349c837465e',3,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '11593b94-bac2-5e82-bc4c-42d2452947cb','2b083a43-7acb-5d24-96bb-c349c837465e',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32a1192e-6b36-5729-b66c-6638218e17d5','2b083a43-7acb-5d24-96bb-c349c837465e',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'df21628e-dc59-50fe-9bde-cebc6397c1b5','2b083a43-7acb-5d24-96bb-c349c837465e',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '531b1ccd-a3c7-5a91-b58e-3e1a896aa3c3','2b083a43-7acb-5d24-96bb-c349c837465e',4,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '04234b48-7f50-5b53-b076-9ae88cdef09d','2b083a43-7acb-5d24-96bb-c349c837465e',4,0,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '346a2ae0-ebd8-5958-8eed-d2d7310056cd','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b6874bb2-6695-55fb-8b7e-2d34c0db289a','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd17b2a5-d306-5c4a-b069-d5cb53115d43','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5f4b7028-0a1b-5a0f-ac52-939508524122','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a15cdc41-c7cc-5ba2-be49-ac8867363e06','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7166ec8c-6ca8-5a01-9858-d4f9cb01b5be','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ce793d10-7f0f-5d2c-a5c0-11c78244ace5','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd89c420a-fe0e-5d74-8b4f-b754eb99df21','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd42d643b-2516-5235-930e-84a9488977e0','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd400ddfe-941f-5d27-be79-e220d1b89b8c','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aab9fb65-c9fd-59c4-9562-daa13e30ad8d','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7596966d-e52c-50c2-8746-3ac8cd5dc000','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1ca8754a-3244-5985-82a4-912394e22fb0','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,8,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd84fae61-2cb7-570d-ac6b-6f7be7f9c8d3','2b083a43-7acb-5d24-96bb-c349c837465e',4,2,9,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06c46ef7-160d-580b-bd80-11739ba8013f','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='lunge' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='lunge' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a7538a87-8063-5dfd-9ea3-687520f7d4ef','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '342ab188-fc99-510d-ae9a-262c13780b6a','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6cbfc04a-aa9a-5a16-97ab-693b07b05f7d','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80a4eef6-3bf7-55be-856b-bee45e310879','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0f4a7c0f-cdda-54c4-8b32-5b56eb16f12a','2b083a43-7acb-5d24-96bb-c349c837465e',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3076f71-f8ff-5725-8b7c-ccc40afa4810','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '73075db4-c562-58c1-a0ec-a4056fd653c9','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7845bc3-19c3-533f-b5c8-c7a79e709564','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14ce6971-2a73-5048-96c0-a8db53bb8cba','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd366e7a-d066-553c-bd63-c0801a0d5014','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '013946b3-28c7-53e9-93d5-ea996f28b1e8','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '75ccaa40-712e-5e90-b526-844b934f5a5e','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '98be5f34-c16c-528e-a987-d3024d69db53','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2acd703d-00b8-58c7-80c0-7a0d82234e80','2b083a43-7acb-5d24-96bb-c349c837465e',4,4,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4888599c-7f96-5c26-b588-1bb79f87e7b5','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '999562a8-fea2-505d-9bcf-450884471627','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14470ef0-f86c-5dd7-a8d0-b4bac806c586','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'da8ba5d7-d3c3-5465-b7fb-67de9e914d4e','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd7442d2-9631-5799-8caa-06bcdc2018ad','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f581819-62ef-560a-b4f3-c404756dc490','2b083a43-7acb-5d24-96bb-c349c837465e',5,0,6,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '364b6a5a-b47e-503e-b769-3d4ec64aa936','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8bddf8dc-d9c4-51c4-8ac7-1c4abad7bbed','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4f5fa98a-c718-599f-9a24-c1410a22a95c','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33968d0c-45ea-55be-9079-3554be834dd5','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9bd98c6e-417e-5f48-baec-a1edea930af3','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d8b1d33-0515-585d-8992-a63e39f30912','2b083a43-7acb-5d24-96bb-c349c837465e',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86d32372-f0d7-599d-a934-65c8be553931','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '22699cce-df6a-5418-82ae-c315d3000daa','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43c5d2fa-4619-5719-8989-13c3ecccec93','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a42cacd3-efb2-5cb4-aea6-5ea789852140','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4bc1288b-13d6-5b3a-8060-a4c1e7f43224','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '917e5cfa-e65d-5846-86de-d17e96453405','2b083a43-7acb-5d24-96bb-c349c837465e',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '10678e22-e93a-5d1f-ac9f-02e273534663','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '64ea0acf-32e9-5e29-8111-8da360a56f8e','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd6f2811-cc77-5817-8781-b8f1214d6c6c','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb37744d-dbfc-5902-8246-5f69ddfa46a8','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,5,'exercise',(SELECT id FROM exercises WHERE slug='front-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='front-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '494b28bd-f4c9-5f74-bafc-0818113df2c7','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd344f459-5740-5f14-974a-c3d093bcac25','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eaa48584-a39e-5182-80bb-3ad46037e70a','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7af6b552-1173-51af-9265-66ec50529544','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '939e55f6-61dc-54e2-8dd8-00ac62886b36','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2617d55-5596-527e-be4b-cb59eb5bf39b','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a272db3-8bfd-522d-b56e-04aac2f219ae','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a69d26b8-c114-5653-adc3-5385418b5383','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8620501-0c41-57a9-a269-ce8dd3fe72b3','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '924f3213-1ebe-50ed-a621-d8cbda60fe03','2b083a43-7acb-5d24-96bb-c349c837465e',6,0,6,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42bc930a-dea5-5b60-b7d8-90fbca0d23ee','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bfdeb979-1502-546f-b099-7b028da96aae','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '66c7ffa2-9ff4-5d25-b446-f93f0cda1e7a','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a25df6c1-e488-5f7b-a8e4-411fe20107dd','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd814eff8-330f-5db5-a997-dc7c1a908ffc','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8480ad46-72e3-5efb-a6fc-32ea9a587a89','2b083a43-7acb-5d24-96bb-c349c837465e',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9161d396-eb3a-5e4b-a256-ff7b4193cec7','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='warming-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f8387ef4-8871-58bc-be14-56813490e77d','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bffc4419-695e-5d88-b568-be4e2f109b21','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '122387ac-349a-55af-8ce1-2f0b8c363fb5','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2e75e7c7-e639-52de-84f4-447a8d209330','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7afa9ee-ca4b-5cda-a324-07ce71932623','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-2700-meter' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '92c3a10e-1e5e-528a-aa6a-f74f3a0b4bf8','2b083a43-7acb-5d24-96bb-c349c837465e',6,2,7,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cdbd7218-ad99-5b2e-aaa2-e0ad87b3f6e4','2b083a43-7acb-5d24-96bb-c349c837465e',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5aad4178-b449-589d-949b-d3162e1d22ac','2b083a43-7acb-5d24-96bb-c349c837465e',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebe79730-cfa3-5f04-ac50-4d74c7960609','2b083a43-7acb-5d24-96bb-c349c837465e',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d1d016b-3e2c-5c24-809c-518e085dc571','2b083a43-7acb-5d24-96bb-c349c837465e',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2baba200-9aba-54a9-aa64-b8e16e90e85c','2b083a43-7acb-5d24-96bb-c349c837465e',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '641a619c-6c5a-537f-8c12-2171b8aa5444','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '91f38a15-cd2c-5a50-af1b-7b70027aac62','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b5d4712f-9829-5d86-860c-2a1175c84943','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6d3c598e-fe9b-53f2-8c08-17473463c6da','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0da71bdf-6a2b-5755-b11d-9ead559f589b','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5071f547-7d77-58c0-81e6-91ac4c1754a3','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cf484246-5917-5acc-9a36-8c31938de507','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c10c30c2-805c-5edf-a69d-ca8e7b4dd560','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b9e1fc14-37b6-56f1-9884-18808855268b','2b083a43-7acb-5d24-96bb-c349c837465e',6,4,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('b7661135-0f5a-55eb-b67d-96e970972b76','opleiding-cluster-1','Opleiding Cluster 1','military','military','beginner',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 1", "cluster": 1, "description": "Dutch military (Defensie) Opleiding Cluster 1 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ab9a9729-874d-5f99-baa3-4b023916279d','b7661135-0f5a-55eb-b67d-96e970972b76',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6bd83095-9772-5249-9c7b-00b418cb14e1','b7661135-0f5a-55eb-b67d-96e970972b76',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '99c24b05-8d35-50a0-8b13-2d5a88114e8f','b7661135-0f5a-55eb-b67d-96e970972b76',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '588adeaf-a07e-5102-8409-88464a731dfb','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9f71d77f-25dc-535e-a0fc-a7b84285b254','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18c4b603-3944-5013-bea7-0ce7647f0ad5','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46674bba-bf97-55f4-8469-b81beaaf91aa','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ca75dc35-a35d-54b9-b9d6-837ef0f5712f','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f86c6424-1665-5f07-9955-72b78f1aa405','b7661135-0f5a-55eb-b67d-96e970972b76',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80844742-0643-5110-b4ff-229f15bd22d3','b7661135-0f5a-55eb-b67d-96e970972b76',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ecfa297d-6f10-51ba-ae84-ffb4de6584db','b7661135-0f5a-55eb-b67d-96e970972b76',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ecef109e-a2ee-544a-8b1e-dc926c8d6baf','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5fc19a2b-63a7-5ca3-9e6e-bec23d20151d','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ded6d6f3-70b1-5b9d-baeb-d210dcdc1c55','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77166c9f-dc9d-5fef-bc08-1245ad3b13ab','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ec9cde6-acbf-52ef-90ae-1a9e9f2d189c','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5dcfed0-c31f-5618-981c-834b0f5a394e','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5910e372-7740-5823-95be-02683b871d49','b7661135-0f5a-55eb-b67d-96e970972b76',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f66b80b7-f189-5787-ad84-61b4622aa7ee','b7661135-0f5a-55eb-b67d-96e970972b76',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1cab39ad-a547-595f-ba5c-f80621304062','b7661135-0f5a-55eb-b67d-96e970972b76',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'abba581c-10fe-5db2-a5d9-bd80e1169187','b7661135-0f5a-55eb-b67d-96e970972b76',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bbd61fdd-5472-5098-b34f-fea0b348913a','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cf133e47-e2d8-5b5b-9a5d-438d8b50a53f','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '688a590a-0c5b-5006-9f97-8eb0bfc92421','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3e741044-9b61-566e-9c49-17d0aa361f79','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2f41435c-8a7d-5425-88ef-a14f5271b1e4','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bdf50403-5499-5ec2-b4f3-ac2a23849799','b7661135-0f5a-55eb-b67d-96e970972b76',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89e9652f-dac7-5e72-9115-50e7181cb039','b7661135-0f5a-55eb-b67d-96e970972b76',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5054c4b2-26e0-5d75-b9de-16d106040516','b7661135-0f5a-55eb-b67d-96e970972b76',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c06125ad-d5a7-5ea2-bf42-cb2257f21734','b7661135-0f5a-55eb-b67d-96e970972b76',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e70d8a4c-816f-57a0-88dd-082dc95bce1f','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd4ab41e8-2986-5897-b256-99d3b8c614d0','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f72067f3-2454-5a77-95ca-9cba1a53cea4','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '794ba344-3f85-592b-a4eb-2e1be9eeab8f','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2fb94fcb-8ec2-58b6-b350-1723bc6180a4','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3c229393-dab1-53d9-be5a-6f0a641c2cc7','b7661135-0f5a-55eb-b67d-96e970972b76',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '41834917-cee9-521a-8894-e4ba49ea3bae','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '30a23a7d-523a-524f-afbf-e592b4b9d369','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7261d048-2567-53bd-af06-2e4f1cc3cb33','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6945821f-885e-5683-a16f-c9f1ac134826','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '81d62a26-7043-516b-98c0-8b81af8acc2d','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2245817-2700-5456-b541-73a2672f267a','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd5f7ee2-000d-5f48-931f-5799641264e4','b7661135-0f5a-55eb-b67d-96e970972b76',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '079df06e-ecba-5e4d-97cb-978dc822998b','b7661135-0f5a-55eb-b67d-96e970972b76',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be9d65d0-4325-590a-82af-b1da9d8f19cb','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a86aa71-802f-5fa1-af5e-479b3e257710','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec93d866-aa62-5ece-8206-7cc80c5b3c55','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '00d8b581-0e36-59e6-8954-505beda7cf40','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '032e6172-b5d0-5838-917d-02f5bc4d38a1','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a194edf7-1f2b-5d47-b025-941f952ff5ea','b7661135-0f5a-55eb-b67d-96e970972b76',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a826be88-2f1f-5afd-985f-020a00182e40','b7661135-0f5a-55eb-b67d-96e970972b76',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ffbc9606-dc6e-5834-bc10-10e50d385cef','b7661135-0f5a-55eb-b67d-96e970972b76',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4796d28e-4c37-57ab-b16c-0cc93e0bb259','b7661135-0f5a-55eb-b67d-96e970972b76',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7dcb60b5-fa46-51e1-a2a9-5f0bd335a166','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2d8c139-dfd7-50ff-88e3-6648731a41cd','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80a1aa93-b79e-519b-a461-44a202e8b7a7','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '19171ca2-1678-5ebf-9bd3-25f2a5d35c2e','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7d19cb2d-eb55-58ae-830e-761bb3a8bdbe','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd8502d2b-080b-50d1-b75c-a8d9f5057744','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee1cffa7-c770-5d00-be2f-df2a0b64b7be','b7661135-0f5a-55eb-b67d-96e970972b76',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c315b8c-0a0f-5a1c-8087-c792caf85876','b7661135-0f5a-55eb-b67d-96e970972b76',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e07c77f8-b3f2-5090-b643-d78e4643eecd','b7661135-0f5a-55eb-b67d-96e970972b76',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ad00453e-d421-5aa2-b118-27d2364a5ecf','b7661135-0f5a-55eb-b67d-96e970972b76',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6aa6a30b-aac5-56f4-b8c3-1739d14e2e3e','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c08a7120-f09d-5ea1-98bd-3fe7d86f3cf0','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0ff15842-8b87-5e2a-a37c-e687d88b8ddf','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3f64973-9b62-58a1-a962-52ce0bc82996','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '818aa9ab-4d19-5f8f-a48d-2ded5c4996fb','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b4db084e-00b0-50ea-8187-e00c8c4e7669','b7661135-0f5a-55eb-b67d-96e970972b76',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '098eeb18-329a-5461-9821-e32e092391f5','b7661135-0f5a-55eb-b67d-96e970972b76',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '12f884d9-0ea3-574f-ac3d-29ded198449f','b7661135-0f5a-55eb-b67d-96e970972b76',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb33a966-b884-5f4f-b7e7-43ee41e7ab93','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dbaa5e9a-d3b3-56d9-83dc-81ee3a79b6e6','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5ba2b962-55c4-5d8c-9a85-4e5853ff587d','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f5d33a0c-87d1-5000-9e16-fbe0e4cf887a','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18109110-3279-5465-ad71-0209ffd8ec6b','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '75b798e2-7b43-5c14-a4c9-afd835bd8b14','b7661135-0f5a-55eb-b67d-96e970972b76',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8b67cd8e-4a09-51dc-9648-aebf35fcbf15','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ddae28e1-a170-577f-8697-b4d4eb5a6230','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c063472f-da92-5c02-9ea2-ae3f4ff0f24b','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe2fb611-ded8-59ae-a009-8fcdec7b8359','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9aadfe15-ca34-5bb9-90e7-1955e388aa4a','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd26ae05e-4a86-5e9c-b6cb-7c9999c89efc','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e757e130-d28b-5aea-9f88-5a3e9738e53d','b7661135-0f5a-55eb-b67d-96e970972b76',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c56da82d-c766-5a35-a9c3-a5bff31e9f07','b7661135-0f5a-55eb-b67d-96e970972b76',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '05703915-8c5b-5e0d-8b32-d6f3ed243ec6','b7661135-0f5a-55eb-b67d-96e970972b76',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50d1e780-5e47-501f-b8c2-49b923d6d9d4','b7661135-0f5a-55eb-b67d-96e970972b76',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8af09879-1156-5944-9839-62bf46131535','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b5cbf5ae-856a-5b30-bee9-dd21b2070b4e','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d995ce7-ed00-553e-8f7d-91ad7dd585a1','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '774f675c-b40b-5951-a933-c26bedb951d2','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b4d2028f-0604-5ff6-8ec8-711e82834770','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8bed3125-9f9b-5489-938d-9087ce291384','b7661135-0f5a-55eb-b67d-96e970972b76',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '22b4e603-3779-570c-84b2-f67c5d157be6','b7661135-0f5a-55eb-b67d-96e970972b76',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '87b8ae28-472e-5ef7-b212-bc712cf12f41','b7661135-0f5a-55eb-b67d-96e970972b76',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14bb83d4-ef90-55d2-966b-465496aabb6a','b7661135-0f5a-55eb-b67d-96e970972b76',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5600f3c4-e347-520d-b79f-a059f3d598d0','b7661135-0f5a-55eb-b67d-96e970972b76',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bfc24d78-924e-531e-8d5e-9dbc092a7f87','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43a16806-ff8a-597a-b46f-ef0403b3e5d9','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '020bf664-4412-52ee-a6d3-5222dc31e4dc','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '23521d8e-6268-5537-961e-38033f4e2ac1','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ab2a58d-b711-5d77-84f6-5a28b710fef0','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cde14383-2c11-5f5b-a2b3-db54dd5d72c6','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '757ae80e-c23e-5692-883c-4ac0666379f8','b7661135-0f5a-55eb-b67d-96e970972b76',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfd53e24-f42b-57bc-a105-04399585300e','b7661135-0f5a-55eb-b67d-96e970972b76',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd080fc51-6386-5d2e-8805-553eed276ee0','b7661135-0f5a-55eb-b67d-96e970972b76',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '509abc5e-ff83-5cd8-9177-c8e2e11a8645','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b356b188-9e9b-5006-92c9-9754711401d7','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9e37737b-1ca3-5a16-a528-ea89b0bc14e9','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a966d784-db9f-5e85-936b-40155312d8df','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '701950a0-e115-561e-b901-5b53659e4070','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5e5b3330-4d7d-55bc-b8df-c9bc907796c1','b7661135-0f5a-55eb-b67d-96e970972b76',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3028e579-4c27-57ac-8de0-664b53bca225','b7661135-0f5a-55eb-b67d-96e970972b76',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cf48d83d-347b-54c6-b977-9b3282804a00','b7661135-0f5a-55eb-b67d-96e970972b76',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '91f4a360-f28b-5680-9771-1288811ade92','b7661135-0f5a-55eb-b67d-96e970972b76',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cbb588f-b4a2-50e3-947a-f5195cb03c1b','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4d57182d-8a23-5c32-8add-49e60650c51e','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5642d43-e1f9-5af9-9fd8-efd497ed0545','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1d5b0fe-8a73-587e-a25b-19bcc5661d9b','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '956cb651-ebd1-5981-942e-11ea9c6f79aa','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1a759b35-4b3a-5d43-aa51-6e8ed61d9673','b7661135-0f5a-55eb-b67d-96e970972b76',6,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '51310b6d-899a-5248-883b-9d3acd582fb0','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b9d750a0-1715-564a-a6b5-bc8345bec695','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd993ef8-8231-57ad-bba2-68db2bd95957','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33d1b19b-de34-5b28-96bc-ded807e8cd38','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a58d112d-7318-5d99-a904-e24c97b87d29','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '56e047d6-bb61-530c-a846-2842ff2ea272','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48211e6a-966c-5531-9ca7-27459681f606','b7661135-0f5a-55eb-b67d-96e970972b76',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('fe74ed29-280e-50c7-8945-2fcbac00c37a','opleiding-cluster-2','Opleiding Cluster 2','military','military','beginner',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 2", "cluster": 2, "description": "Dutch military (Defensie) Opleiding Cluster 2 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0f281010-5d2c-53a9-b7de-670ea7731093','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c213c17-fa45-5ab8-9dec-4b9c44df3a3d','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a788bebb-66f0-5e19-87c5-bff603d2f008','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a460b122-0930-5c93-861a-0f40452d5462','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2f5f439f-6698-592e-bc8e-10ec4eafed25','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eed60311-21c7-54a0-a69d-f99174d62f02','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '87c2a14b-7664-5e1d-91c3-73d903f91c3c','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dfb34f9f-296a-5b86-a910-2229e28311e9','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3186d399-1f57-5581-9f38-1a37bf40d30f','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fa6c729d-d497-509d-a8df-14bf531340dc','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '54f7b440-3d8d-54ab-9d55-ff476f9b2eeb','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b43610af-e65b-547c-9e46-3c2ea5472a45','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '035174a6-3f07-5a05-aa37-af5f28731c63','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd5def05-660b-58af-a24f-c79c3668aa3d','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '24ef746a-8e8b-51ec-8a88-b86807db6821','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '753a4b13-7aaa-5fb1-828a-b60b5ce92030','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '85ccc9ff-866a-51ce-b5eb-8c67c316b41a','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a9ef6b68-7a3e-5406-8b80-66f951862454','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5760a2bb-decb-506a-8374-7ad6cd0f8646','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2b71f1e7-72bc-51e0-a345-edb8e4922c40','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '635c56c2-9c0a-516f-b2ed-16e4b31c9b25','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '95385b4f-c263-522b-a78e-1be3aca8798e','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '73f0ee47-9a42-5e7b-9086-62143b7e639a','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'abd2bfb3-1f9c-51a5-a47d-dffddda31472','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c9bd6f81-773f-5f2b-b02d-b128f4cf5fc2','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1745f2b4-a11e-5651-88b0-ef0614a1ef6c','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3003f77a-ca42-5975-8a1e-846e55eefbb5','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '130ed965-aae9-5440-b434-fc37a6589a3f','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '824eaefa-663f-5259-b1be-833f56dfad71','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fd9dfb14-d4ee-5930-82a2-281eb6cf1e9c','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c2681f27-021d-5906-9464-6e998f14a06b','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a3d073af-a91c-5c76-b727-5fdb2712eb97','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46382319-56ff-5fce-8dc2-53d9e43c4677','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0977870a-aeba-5f79-b550-94c5cc4fc83b','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d0892e4-be63-5a4d-9098-599fb6ea80ea','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '99a608fd-67c0-59a2-80a2-9980ab6cddf2','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f684445f-9642-5ba4-8f28-d91df42c068f','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ec365c67-5682-53d3-a370-856e736af233','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '76325330-bdb1-51eb-b150-00011d49f233','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e99c5548-c61a-529e-a2bb-2cbef31434c6','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b922f5c9-6d8e-563e-8ea3-32ca7dce69f4','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b1f7dc5-035f-511b-855c-8ff44bf2ae2f','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dc46eef7-d545-5463-8116-73cccb5c62b6','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80ac0f41-1335-54e6-8002-dc8c8910bf7d','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62df7428-a403-528c-b1f0-0f2b7b074f35','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cb1873f-6d60-53a6-b309-19c5267d9528','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a2ad6e46-239b-57ba-812a-d81dfb8c983c','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a8d643c3-9a4f-5805-b869-705853a1edf9','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '093070ae-b062-5752-9f11-125511a7a419','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f69d78aa-9bf2-5140-afa8-cd07c9112161','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f7a7f792-4f9d-501a-8a44-29b549d84768','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '91dd77e2-b042-56e8-bb7c-4b7e76389f64','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '13ba87e2-5179-593e-b790-1b0d3acc0c14','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65fb6056-07fe-56b3-b4f2-43980d59a735','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9e565e9f-5386-5b4c-b11b-ccd5393d0422','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bac03855-5c04-5328-b21f-4a084ed61ac3','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8e2ee6e1-d31f-591d-a33d-38e7829abd3a','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7ebcbc10-c4ab-56a4-8dcb-6ae1dce8f4ce','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5c6cfc2b-1693-5703-b910-d7735483f98b','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eb8a569d-34eb-5dbd-ad65-aa1ce45cc88a','fe74ed29-280e-50c7-8945-2fcbac00c37a',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5bf3f6f4-f48d-5233-8639-2f91482d407b','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '131af52e-3aa8-5f4e-8dc4-efc47bd977c1','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2375a1a4-e291-5671-ae03-3ccd6f1faa03','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8ff04710-d129-55e2-873e-0cbc10efbf7a','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7e2560ba-d646-5661-9353-733762484903','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3cec17fb-d464-5c7d-b39f-78836266529d','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3e0819b5-aef0-5c4e-8a50-7626c1190a31','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac839d56-23b7-5151-a2de-7d87f0852142','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a548b8f2-7b7c-5a1e-b960-bea574a033da','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43b66aad-d023-5586-9541-acba56a4a64d','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'de6c98ce-57e9-55e4-a1f2-769cc7cee798','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '53972df5-0803-5b65-98f1-a8aa7a1dc03c','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42faa852-7efd-5976-a678-5f4a9c24c9b1','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd65c8a50-7ed3-5203-be4e-e910340d8bd3','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f7af382-43e5-5406-b687-5bacbfd65309','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4e3957e0-ff48-5c4d-8b8d-311e9490b3df','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e10671aa-6af6-5983-9bf3-aa42d533386c','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9b30e99a-bdd2-50b8-9b04-2f1c03ce890d','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c3553960-8a4d-5c51-9701-8970cd6e0127','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '35997052-ae74-596e-91cc-bec9877d52fe','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '936ed516-e964-5f57-a973-d240f0ca708e','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77ae63b7-6b46-5d52-9e52-4fe7279b83a3','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd5b63e79-a99d-5568-85b6-a8a4803e5da8','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e13ada5-e3c1-553c-930b-7be270656efd','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f4aeafd8-23b5-589e-9bb7-534279c283df','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2fc124f3-49fe-5f2f-b736-bff6b4d3716d','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42d90b9c-b141-5c10-848e-9c7ba661eeec','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '69298cae-9871-55ce-b436-8f879a3980a8','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1d96839-de0c-52fb-afad-d54c71e3e113','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '10ac5d1e-7b69-5ba1-9a27-d29850845760','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '30e4dc4e-6367-54e2-bbfa-9f1ee9a0ddc8','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '749fb726-8f3a-5f8a-8f7b-c8907ed4e015','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4905cb43-785e-5471-ab0d-2b012b52edef','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be4c21fb-df9d-5726-93b3-5310377b81f7','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '847f9f0f-e5f7-54d8-bcdb-0f6464ae1ac2','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2aae960a-3ebb-5c5f-b560-188837fc8088','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b6a449d6-ed2c-5f8f-ad2a-f535faf86114','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4988012e-b17d-5db2-974a-9a95288798c3','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '49b99d36-ffb0-5e9e-91a9-ab140a7e4c5d','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '752a2233-b270-5a45-bfd8-8edc0a50fa87','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd5ce9206-3985-5b80-b588-7c6e9726c283','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0490f2c7-718a-548f-8900-741ca56235dc','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '575255f8-8ced-5979-998c-59e7c1b01005','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0a7e3e26-b3e3-58e7-b0c8-fd612156ad31','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6be7b041-f937-55db-98ad-a695531ad620','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'db42b46f-4dcd-5389-87e9-10d00ddb3dd5','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '13804a49-b12f-55c9-a5b7-ef738beca14d','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '843a766b-dd75-5883-af09-bbdfce25f2b8','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a7421cb3-fba6-5473-83fc-7c621d39600a','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '740ec61b-80b5-5880-9e11-74ee1fcbeab8','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0c6dd607-6ac5-5377-ba9c-b6459b207d20','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a48eb9e-1223-502a-95ef-dc6bb21e6f8b','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8dcd6b83-4d1e-5097-9153-506c7d3bc0e6','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd9018868-0962-5851-972c-d0cabbf95279','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1847f813-b8ba-5f7c-9d03-dc49680a7325','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '225a3417-afff-5933-9d0a-1019223fff49','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '129d4cd7-734f-5a32-a426-4d85216d5def','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a71972ec-b71f-5f4b-898c-224cb244926b','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ae891b71-280b-5208-8c32-76d4d6f2ffba','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c028e8ec-1a3c-57ef-a97d-ebe4634e7883','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8d425242-2b8c-56ee-ab22-177a176e7261','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2e4ce9a-f514-5543-adbd-a14c3834fff2','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '599ede5a-9b7d-50ac-90ca-7c259ebeff3c','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6a31094f-302c-5fc8-bb29-3719315b42bd','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f2c28bef-65fd-510b-9d58-a8c5a276f5ed','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '15b150d9-c95b-5752-b608-d792235f8356','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '45763628-7b15-5974-8ac6-ce4539ab34a2','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8787dc64-3649-5538-a5fd-b13c60c7339d','fe74ed29-280e-50c7-8945-2fcbac00c37a',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('2b8536a7-6f0e-5b5e-9f01-073f024cb42f','opleiding-cluster-3','Opleiding Cluster 3','military','military','intermediate',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 3", "cluster": 3, "description": "Dutch military (Defensie) Opleiding Cluster 3 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '254a595f-903a-5316-ae94-e8bb4ee0a0c3','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '82fc7e35-e442-5ebc-8d85-b9b71da68212','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-30-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '43bad5a6-84d6-5c57-8e7f-c0cdeeacb0ee','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '31219b25-5c6d-5d15-b3bd-59a8b9ada1f2','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a0d546c0-0e7d-5614-bc2f-e4fe49e9d9f0','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c67affe5-36fd-5f66-ae5a-1c7f9d7a858a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5babf1b6-d1b8-5e9a-a698-c7c1837c2506','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6880f423-274e-566f-be31-d81a85583db5','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a02bb9ff-ad3f-5dc0-917b-50348f5c3a16','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b0c8f879-c470-5d0b-a12d-6e5bbfdf76dc','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cc27b03e-f1ce-5f14-974f-fda38d0b2664','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ee87940-a1ec-504d-bd65-8119a24b5483','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06d438de-5082-5f10-b86c-0d5e7971f255','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b281f1e6-273c-55ec-8b80-3e5fc0b77ad9','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2bf6e2e8-5339-5cb2-9884-bdb00fcb04fd','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ba0bd335-db79-5349-b045-e8259c30ada6','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '889c4c78-fcfe-5db3-8843-e56c087821fe','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6caf87b2-f8f4-5f41-b2e1-5128042f9aa1','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afdf29ff-b8f2-5dce-8e44-907e4f4ac6fe','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '042f8377-0071-5004-97ad-74280df2bc23','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-35-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '029d4f14-c4aa-5900-ade0-ac0a9b238c4f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2223ce78-0f70-566d-93a5-1629ab8abc31','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'abf2eede-474d-513b-805f-4690a3122d78','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2cc9a8be-3ae3-535d-95d3-c45f054b6418','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fac5192c-580c-503b-9917-e2ac9b28f571','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4abd7690-fa58-5a30-8b54-fd07997607eb','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '405812a5-a2ac-550f-830d-acee3b3cc97a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f1b5198a-8947-5b4c-9bbd-e2c6b8edfba2','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7b184f70-3097-5a6f-837f-bca4342c158a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd8c2a96-84e9-573b-86c7-279d66fd8aad','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f01d4200-4c0f-5290-8621-98a8f5fe7c56','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b95333b1-c31c-5f59-98a6-b3b0a7fb69cb','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2c3dc82b-09ac-598c-9e3c-bf4707a9c521','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48fdee3d-ca48-5072-b43a-5b6fdec53a68','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0aa7dcb1-2f71-5f66-a370-cd79e2c3b423','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '88bb4d5f-9210-597a-aecb-332f26c22af1','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1958b84c-bd9a-565a-8fb9-4c8b58a521c0','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a279bea7-f8ad-5a4c-9505-a52b394a809b','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a51c5978-a848-5578-8263-c66e8f2fadf1','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48c801a2-2c7b-5e08-9952-2d7bf922be4f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '516680ff-5b00-58c7-bd9a-6cd1645cf155','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '109f3e84-1dcc-516e-8539-507290d25c8f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ece869ba-6c0b-5459-bc29-266c9636abb2','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86c49381-755c-5c44-b8ca-f01303bcba8a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-5x1-5-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '758162d1-5c34-5fb4-99b4-fc354e2a553d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6917b5f6-a6a8-538e-9278-6a27ca5e6cff','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a50ae052-4fa4-558b-b710-4e6053383441','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f48570a1-fdd6-5436-977e-e329418703ba','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5a812e0f-9ae3-5f66-b81f-68396d377ee8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8bd4143e-5622-5e40-8779-cc7570cab628','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '76cc267f-040d-56e0-8c19-3d35f43fd26c','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '875bfefa-b1fc-5057-a711-b08e6e3309b8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-40-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe6493a0-1235-5aa2-9e52-f0eefee4cd6a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c2c24b2-b58f-5650-b654-e8aba218dbdb','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b62bc674-755c-5cf4-a468-ce9426f99c25','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c176137b-f1af-556e-8b52-99a986d7896d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e8ca429f-0b8b-5bc0-a8ab-6eef9cea0078','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a4651ad-0510-5684-95cf-6de10c3a83ae','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '977cdebb-68b4-5036-a2a6-03e7e14307b8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '746ff1b3-9704-5ab2-aaf2-d23c8381d690','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-30-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f57c070-7a5e-52c5-a3db-39099d6d5842','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97ccac7d-3c7b-5535-975d-0fe03f8e0038','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18b73e0e-f727-54bf-9c35-52a73aff4f43','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f657c022-1cf3-562e-9516-ea4166c2551e','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4e64d31f-635a-5408-8952-5a98f6d496ce','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2960dcc0-c762-5e58-8aaf-314da6a9ef0d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1d06d28-af04-5e31-b711-888f20e284ef','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32168aac-5d73-568a-afd3-57c0ee6b0b27','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '71822aae-f5ae-548f-9148-c98eb615ff59','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '520bfbc8-4f1f-5387-968b-7cca22106bca','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-45-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0317e7d0-68da-5c0d-ad30-04f4ec225e69','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '70952fcc-db01-52c7-b09c-460e14814975','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b18ad40-5b67-56a6-a772-a7b813af2df0','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5e05d8fd-4b7f-5f67-9490-3fb2ded6c9e2','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2517c5eb-9991-502b-a3ea-620c98edf971','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a369d2d3-a500-56f8-91b6-a2b42626eb32','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b547e982-fb48-5058-b7ff-af4f2fb5bf43','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7b6ccb04-08c4-53fd-a07e-f61a4ca7671d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '976dfa62-fa1c-5fcf-a3fd-8eb05fc2998d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '98f74992-1004-5fdd-b7f3-a9ae8deb7f1d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '635024ec-71d6-5d18-9d3e-f2c08caa94ee','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '632b6121-8573-5faf-a9aa-33f207b78a30','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b563c89a-2287-5951-9285-62b418547605','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3336ec27-dba5-53ca-89fa-cf0e5a4e4b7d','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-3x5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c53bb0d-258a-5c5e-913c-2e5c55fc7ddd','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8a8ee91c-4043-520f-9631-d75fb491f15c','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b16eef92-381f-56b9-ae76-b923fc27d7f1','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b2bf0d13-8b3e-53ce-a8d3-c192c410bda8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f547f21-a707-518b-9763-afd132c94791','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65e7b264-12c2-5398-a6bf-7742dc44000a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c8438add-f5dd-539f-bfc1-f9dfc68bdd0e','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e74325a4-b23b-599d-933e-feb938b88754','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0aa25283-3414-5b21-bd7c-39cebfefc416','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fceb9f79-88ed-5468-b041-51042a548471','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1db74775-2dfe-585a-8fb5-792e2794f894','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-6x1-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '01f156c0-15b7-5dd9-bc39-4be0166b4c93','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e5b764e-577d-57ff-87b5-f39bbe678d8f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9eaa7fe0-5646-5ca9-9342-2e4816a712d7','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d40f693-1c83-5078-8867-377a83d4b8d3','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe7d0375-9248-5e0b-93c0-fd67bc96d75b','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dda76005-ae6d-560b-afa7-c7f86d15f5ff','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b3f5006a-1a79-532e-a912-8d1715eab9d9','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b99cd889-4223-546e-adf2-d7134704c2f7','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-4x5-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a371e40-88ed-5936-a880-8110144d2e13','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62c26708-bf70-57c3-a7f0-492589e9ca3b','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-50-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ffe38a3c-bc70-5bef-9b0d-1d80b8af17c8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5f214b15-1f4f-5561-a464-909e9479812f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd4be01c1-0f21-5073-a895-814dca9d0f63','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65b678d9-ba69-5aa8-9e23-2317a3e43851','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50de2cd9-b75c-5c7f-8c08-c36bc2e8289c','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f94e9d0a-bda9-5d86-822c-af10e9640d33','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '49ecdac1-d347-506a-bef9-d27effb53880','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '84f9f4ca-d9e4-5f39-afae-0be3790c5d77','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '196aa0d1-45d5-5bc9-b916-356b195dbd3f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '726da5ac-8dbb-5134-9990-596ab525e147','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2d95e1e2-37dc-53ed-9fe0-90505e00e88e','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '49881834-3911-5043-a2c9-57f26cf80650','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '793ff550-8b7b-5d79-8e36-38acdc3af8bf','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a0cc387-3df7-5af2-b492-cf8ec6f47087','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ea6b24f8-eb07-5735-bd9a-90d90275b7a9','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f59b14e-6aa1-5c20-ba5a-7522b2a5f1ed','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '53fa98c4-3548-5287-9b5c-f9d5a1561a41','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33d9d0b4-0dae-5c20-b037-f8185aaa8fdf','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3935cc76-6a5b-5112-8250-416ddeaca5ba','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '08328796-60ae-5618-97be-c64d83cb045a','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5befeebe-6a65-5c1a-bea8-cdbf4f63de95','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b89e16f3-2032-5027-a1a7-d5c71182bc13','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='cooling-down' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '400013c3-8c1e-564d-b66c-07c372f7c86f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x8-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('356efd26-4770-5998-8993-022a911f778d','opleiding-cluster-4','Opleiding Cluster 4','military','military','intermediate',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 4", "cluster": 4, "description": "Dutch military (Defensie) Opleiding Cluster 4 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3aa223a8-4da6-5950-8092-389d5d724fcf','356efd26-4770-5998-8993-022a911f778d',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '44e66294-d9e7-55b2-a2ae-5e0faa292719','356efd26-4770-5998-8993-022a911f778d',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '879ff251-2882-5fbb-9891-d448fa215bcc','356efd26-4770-5998-8993-022a911f778d',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a0382909-721b-5952-9ec4-7eddcbcf0d1f','356efd26-4770-5998-8993-022a911f778d',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '998e1bd5-4b81-5552-a860-120a7375ef9c','356efd26-4770-5998-8993-022a911f778d',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7e37caf0-2714-5d75-a884-1e28cc7e8029','356efd26-4770-5998-8993-022a911f778d',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cee4ffac-1b1c-5d8e-ba47-a12a78fa295e','356efd26-4770-5998-8993-022a911f778d',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0fd78c3a-2e82-59da-91c6-ee586cf57fb9','356efd26-4770-5998-8993-022a911f778d',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ae9e5f5-7493-5b7f-a3c4-775bfddd53f1','356efd26-4770-5998-8993-022a911f778d',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '690be4dd-01e2-5f54-972f-130d79c98cdb','356efd26-4770-5998-8993-022a911f778d',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'febf4a89-c6df-5e92-ab0a-a79ed0452bfa','356efd26-4770-5998-8993-022a911f778d',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '55f608ba-b6b6-51e5-86aa-e908b04ed5b1','356efd26-4770-5998-8993-022a911f778d',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc4e9845-9b21-5ab9-92a5-46e6bca6099e','356efd26-4770-5998-8993-022a911f778d',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7b7a446b-2a3d-5561-b1f0-28b29db3a843','356efd26-4770-5998-8993-022a911f778d',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c460fe57-ab83-5933-876d-e23eec3fce62','356efd26-4770-5998-8993-022a911f778d',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c92962ae-b0cb-59ea-b5b3-5aecae39fcf3','356efd26-4770-5998-8993-022a911f778d',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4b8f86c8-af99-542a-9d1d-436d79648d36','356efd26-4770-5998-8993-022a911f778d',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '51887683-13b4-5758-9f16-db5a73786056','356efd26-4770-5998-8993-022a911f778d',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe203fd3-050a-5417-8885-b9180fa048ad','356efd26-4770-5998-8993-022a911f778d',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a04a017d-42d7-5261-abc0-a9cae294bbf2','356efd26-4770-5998-8993-022a911f778d',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b7adafad-804c-5131-9450-338c631a02e6','356efd26-4770-5998-8993-022a911f778d',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a62c1bb4-cafd-5902-9b9b-1746b81b9968','356efd26-4770-5998-8993-022a911f778d',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89835122-1ec2-5186-b427-5ef3adf92635','356efd26-4770-5998-8993-022a911f778d',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a40e9c1a-ad82-5871-9168-2b114265183d','356efd26-4770-5998-8993-022a911f778d',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af8d6510-fb7f-57b1-a379-c867253f0189','356efd26-4770-5998-8993-022a911f778d',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c8ba9c15-8b33-58bc-838e-f8d02aad8b16','356efd26-4770-5998-8993-022a911f778d',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c440d323-24af-51d5-a727-9731f45a9606','356efd26-4770-5998-8993-022a911f778d',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e688db3-4060-5efc-9b07-1610f036a5f2','356efd26-4770-5998-8993-022a911f778d',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5e1c0897-22e0-5f0c-b625-f056e5a651f0','356efd26-4770-5998-8993-022a911f778d',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d282a80-35f1-5ded-a323-06b8540723b1','356efd26-4770-5998-8993-022a911f778d',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a5e5ae63-c88b-5544-9c0a-17f6cc8058e3','356efd26-4770-5998-8993-022a911f778d',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '71aef989-6f4a-5738-bc81-307ce6005230','356efd26-4770-5998-8993-022a911f778d',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a669e899-38d6-54f8-87ba-660e81cf2810','356efd26-4770-5998-8993-022a911f778d',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '40c0954c-d39c-5916-ac2d-46fcb796bde5','356efd26-4770-5998-8993-022a911f778d',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac34a25b-cc55-5a55-8e5b-946e03f6f43d','356efd26-4770-5998-8993-022a911f778d',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80e7a69c-20e1-5ff0-bc25-b87de1ba402a','356efd26-4770-5998-8993-022a911f778d',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b896132b-5f93-5cf9-bb91-34318b07d316','356efd26-4770-5998-8993-022a911f778d',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7435264-dc18-5dbd-a29f-b0f2c8926d4e','356efd26-4770-5998-8993-022a911f778d',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '022e8593-7678-506c-a940-8f8d465eeef2','356efd26-4770-5998-8993-022a911f778d',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d3d6fee-4658-5da0-b4c8-0d452e138795','356efd26-4770-5998-8993-022a911f778d',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5f310b85-ce4f-53b5-b827-b252f1e9e9d1','356efd26-4770-5998-8993-022a911f778d',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6f56f099-72d4-5547-9104-6588df1f2274','356efd26-4770-5998-8993-022a911f778d',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a15da09a-cb5a-519a-b608-5e69bada4cc3','356efd26-4770-5998-8993-022a911f778d',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e94f55ce-40b5-5d5a-8c5f-1feb6470020e','356efd26-4770-5998-8993-022a911f778d',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63b9f368-c734-588f-9b06-e532530b5412','356efd26-4770-5998-8993-022a911f778d',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a61b783-4349-5455-8a64-7b0b9b960491','356efd26-4770-5998-8993-022a911f778d',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '540a7fbd-7c28-5550-95bb-4446218c3833','356efd26-4770-5998-8993-022a911f778d',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '51ae17e4-64f7-526b-bf84-21789c906791','356efd26-4770-5998-8993-022a911f778d',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4b7a686b-ba2e-5257-9f76-5b29f72b9d92','356efd26-4770-5998-8993-022a911f778d',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '10becf30-8ccb-54ac-9a2a-093782b66a63','356efd26-4770-5998-8993-022a911f778d',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '845174e9-b148-53e7-a42f-d452914e0a46','356efd26-4770-5998-8993-022a911f778d',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e60adde9-a20d-52e4-afc0-279e74e9679e','356efd26-4770-5998-8993-022a911f778d',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '65fe02e3-d604-5828-b097-8b2e05988b03','356efd26-4770-5998-8993-022a911f778d',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ca43ed3-5b10-5d93-a36c-7fc864db9f9d','356efd26-4770-5998-8993-022a911f778d',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '83c62725-6dc6-598c-9f27-771ab393f249','356efd26-4770-5998-8993-022a911f778d',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3af09cd1-7a05-50c6-88d3-8e240b2b8542','356efd26-4770-5998-8993-022a911f778d',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dd68a5d9-2724-5ea2-a3d7-9c5b9ab84b61','356efd26-4770-5998-8993-022a911f778d',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afa19c8a-63b7-569a-adff-5b55514cec7b','356efd26-4770-5998-8993-022a911f778d',3,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7d7b820-9dcb-54d9-a14c-6eacf9e8e4b1','356efd26-4770-5998-8993-022a911f778d',3,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fbeb03d1-7731-5221-94b9-41da232045b9','356efd26-4770-5998-8993-022a911f778d',3,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ac1caa88-9577-5076-8c93-b79abd619a28','356efd26-4770-5998-8993-022a911f778d',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1b9bfe46-a376-5c0c-b1c5-7ea355eac7a1','356efd26-4770-5998-8993-022a911f778d',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8b2bbd78-9cd6-5cfd-8ad4-9837043dc516','356efd26-4770-5998-8993-022a911f778d',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '02abf3f3-f0c2-51e8-8e63-08ef7995a168','356efd26-4770-5998-8993-022a911f778d',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'edc2bd6b-c5c7-567a-af1e-6647de45fe3f','356efd26-4770-5998-8993-022a911f778d',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4a9bc3ee-cda1-5fb4-98f2-4c36da25ba9a','356efd26-4770-5998-8993-022a911f778d',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cb1640bf-7348-5ddb-b754-22307044ebbf','356efd26-4770-5998-8993-022a911f778d',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'becca393-a644-54f3-b305-3c23ba33e14f','356efd26-4770-5998-8993-022a911f778d',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ea29081-ccfd-596b-a362-33539ec6844e','356efd26-4770-5998-8993-022a911f778d',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1c54ed89-f6c7-5380-b4d1-8aa5c2ab35b5','356efd26-4770-5998-8993-022a911f778d',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8cc8fe58-7c27-55a5-a9de-68e829ae9f9d','356efd26-4770-5998-8993-022a911f778d',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ab18bf5-84f8-51a8-b245-dbdb6e33d67d','356efd26-4770-5998-8993-022a911f778d',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dfef911b-cec4-5461-bf27-cfcc5d688270','356efd26-4770-5998-8993-022a911f778d',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '08a0ed65-319b-511a-a9f1-c544504227a5','356efd26-4770-5998-8993-022a911f778d',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7acdd7eb-f2b7-5573-b7d3-5a3347099ebf','356efd26-4770-5998-8993-022a911f778d',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2121ab70-8a13-5455-9356-819034f9b850','356efd26-4770-5998-8993-022a911f778d',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1b5d63a7-da7f-566e-8b41-08990771e3a3','356efd26-4770-5998-8993-022a911f778d',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd4fd9b2-acf8-59ff-b75f-503f31e70321','356efd26-4770-5998-8993-022a911f778d',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aa1d8459-c40a-56dd-bdc1-5773bc2b7488','356efd26-4770-5998-8993-022a911f778d',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f40df26-6ad1-546e-92b5-c4bd88ffc7b3','356efd26-4770-5998-8993-022a911f778d',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a5ebfda8-b86a-53de-8433-9256f4696a05','356efd26-4770-5998-8993-022a911f778d',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c1d1998b-da8e-5ee5-b499-abee7424e1ea','356efd26-4770-5998-8993-022a911f778d',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89cffe91-adc3-526e-9065-f41afe4904cb','356efd26-4770-5998-8993-022a911f778d',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8165fdde-7cb0-55cd-b775-d8387d8b0a3f','356efd26-4770-5998-8993-022a911f778d',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd009cc0a-223e-5b86-a9bd-ee3206d01c71','356efd26-4770-5998-8993-022a911f778d',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25412ab4-6ef3-5ce8-ab99-13fccee0216c','356efd26-4770-5998-8993-022a911f778d',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c6ade06f-8a63-5fe6-9989-ed9f18f4ab5d','356efd26-4770-5998-8993-022a911f778d',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4b00ff2-2a0f-53dd-a10b-9ec1f507ad53','356efd26-4770-5998-8993-022a911f778d',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9e57cccb-44ab-5825-9eae-dc72449e3033','356efd26-4770-5998-8993-022a911f778d',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bedb5922-2cf2-5be1-8470-8d73cfe6cd65','356efd26-4770-5998-8993-022a911f778d',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '28da6637-99a0-5692-aa83-9aeeeb2ecc1b','356efd26-4770-5998-8993-022a911f778d',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '819d6139-95c5-5bd2-9147-8f0139493a40','356efd26-4770-5998-8993-022a911f778d',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '58c28f56-210c-5a10-a2f9-5d366ff00d34','356efd26-4770-5998-8993-022a911f778d',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b4118702-ebdc-59c9-82c0-4de63abc3772','356efd26-4770-5998-8993-022a911f778d',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d7933f0-dad6-5c85-ada9-af9ae3977515','356efd26-4770-5998-8993-022a911f778d',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0c7818a0-a252-533d-967f-5a2063d7d008','356efd26-4770-5998-8993-022a911f778d',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd4a46339-4d28-50b0-8531-6f66658972d8','356efd26-4770-5998-8993-022a911f778d',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7bdc0f41-083c-5d13-a070-fc835ff8700d','356efd26-4770-5998-8993-022a911f778d',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '06b42c52-5afa-516c-bf78-2ccebaea7e39','356efd26-4770-5998-8993-022a911f778d',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d26630a-3e2a-58ff-8563-22e23a9b8fbb','356efd26-4770-5998-8993-022a911f778d',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '03e7d6c6-858b-520b-9728-41ab54827d95','356efd26-4770-5998-8993-022a911f778d',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a092f41-5afc-5576-ae48-1d7e66fa025a','356efd26-4770-5998-8993-022a911f778d',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62708bd9-f45a-553f-bc95-f34a5f1fa3c2','356efd26-4770-5998-8993-022a911f778d',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f13feab-4c7e-56f0-b321-aeaab219f31d','356efd26-4770-5998-8993-022a911f778d',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b4f267d-e3fa-591b-9628-fce53d68fce8','356efd26-4770-5998-8993-022a911f778d',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '82ad6b6b-daeb-5b78-bea6-c341c65b40a5','356efd26-4770-5998-8993-022a911f778d',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e76a2e88-7249-5359-aae9-e70b1b13c272','356efd26-4770-5998-8993-022a911f778d',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eeaf94c4-1f34-5479-a478-4383b98ab1e0','356efd26-4770-5998-8993-022a911f778d',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd35010f2-e242-5171-931d-365241264d7f','356efd26-4770-5998-8993-022a911f778d',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd35b1fff-9237-51bc-a49f-3eb192e2ef99','356efd26-4770-5998-8993-022a911f778d',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7054f405-1842-5789-ad3e-5b87d0d50b94','356efd26-4770-5998-8993-022a911f778d',5,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4e2ae08-6f11-5763-9367-0e5feef2522b','356efd26-4770-5998-8993-022a911f778d',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e88cf733-288a-5963-9830-bd3bc0420f58','356efd26-4770-5998-8993-022a911f778d',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8dbaa64-ca3d-5fe4-99b2-f137dea2bd49','356efd26-4770-5998-8993-022a911f778d',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b4e6cf37-c5f7-568e-9624-c2d74a1f5927','356efd26-4770-5998-8993-022a911f778d',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3cfe73a1-9e54-57c0-8956-fb95084ef7db','356efd26-4770-5998-8993-022a911f778d',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1fa17b0a-92a7-5c6d-9737-94d9241c175f','356efd26-4770-5998-8993-022a911f778d',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dae83e66-853c-50c0-b8da-daec211f3e29','356efd26-4770-5998-8993-022a911f778d',5,3,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '892b282d-7ff7-5d79-9a2f-bb262488520f','356efd26-4770-5998-8993-022a911f778d',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7c7dd24-5574-5c06-bade-43c878955b4e','356efd26-4770-5998-8993-022a911f778d',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ced85d5e-307c-52b8-9ba8-a5d8f54a65f8','356efd26-4770-5998-8993-022a911f778d',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'beeeea13-50eb-5a35-8016-fcd866cc2d4b','356efd26-4770-5998-8993-022a911f778d',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ae86e295-3006-5d06-b3ac-c69afa78a151','356efd26-4770-5998-8993-022a911f778d',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '33a1b481-1ae8-5b39-855e-c9ce468e88b7','356efd26-4770-5998-8993-022a911f778d',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '161ed187-4dd5-5695-b532-aa964861622c','356efd26-4770-5998-8993-022a911f778d',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '85858c88-6d79-5069-a30a-017ca51ca5a9','356efd26-4770-5998-8993-022a911f778d',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '148fc4b1-b841-5e59-bb76-306ed6f7633e','356efd26-4770-5998-8993-022a911f778d',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c9463350-0f35-5e07-9ba8-b26997607eff','356efd26-4770-5998-8993-022a911f778d',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e2953d7d-fefd-59a2-af5d-c0e0fe10f879','356efd26-4770-5998-8993-022a911f778d',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a4d8a323-fbd6-54f6-af7a-bcdd04767acc','356efd26-4770-5998-8993-022a911f778d',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4a6be89f-c618-55b3-9611-f44ccb010b4d','356efd26-4770-5998-8993-022a911f778d',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b36f50dc-6b8e-5d4c-b0fa-ff5aab3fbfa5','356efd26-4770-5998-8993-022a911f778d',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'caa864c9-1578-5b4c-9d57-7ee00242d728','356efd26-4770-5998-8993-022a911f778d',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'afb32406-7262-538e-b84f-e6b64e1e5b04','356efd26-4770-5998-8993-022a911f778d',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6fbe1f55-5072-5ae5-87c4-784a4ea94aed','356efd26-4770-5998-8993-022a911f778d',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50798a15-bcee-5db7-9c6b-8098bde41701','356efd26-4770-5998-8993-022a911f778d',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '652a6acf-d2e5-5b25-b740-fb8b62f45bbe','356efd26-4770-5998-8993-022a911f778d',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f5b3763a-17fd-51e7-bfb1-9e2b9b649e6f','356efd26-4770-5998-8993-022a911f778d',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fcf9111c-f6b5-5d5c-8ed4-b3fdc43b32bc','356efd26-4770-5998-8993-022a911f778d',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e72829e5-15e9-5e48-a662-5e35b8cd3232','356efd26-4770-5998-8993-022a911f778d',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7d3f8f2a-0106-5006-bd5d-2114c2aa03a2','356efd26-4770-5998-8993-022a911f778d',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '911f99f1-6e1f-561c-abb5-5dcbb3107654','356efd26-4770-5998-8993-022a911f778d',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '873fca90-0680-53fa-8516-e61288e75a47','356efd26-4770-5998-8993-022a911f778d',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8a36125-83d4-5a98-a7fa-539952e58136','356efd26-4770-5998-8993-022a911f778d',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7c8915f2-ca5f-5ad0-91d1-5da830e7efe4','356efd26-4770-5998-8993-022a911f778d',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e07612cd-1781-534d-b927-fa594150f11f','356efd26-4770-5998-8993-022a911f778d',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('4a2b7a8b-2169-5a53-a82a-1c9c94a3d489','opleiding-cluster-5','Opleiding Cluster 5','military','military','advanced',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 5", "cluster": 5, "description": "Dutch military (Defensie) Opleiding Cluster 5 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '277f215d-fdce-5717-b7da-51f5177d7ecb','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b58e0661-ce14-5fb9-8bdd-504c6b4b746d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '02cb90a3-9cd0-55c3-890a-03290ef81f8b','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86be87b7-5b90-59af-909b-a04400d98277','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd66dc85a-c93b-5a52-af35-d0cce0d0e4e7','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a846f14d-bcd7-53c4-83b9-4952778c1b86','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fcc510d0-5439-5d7a-97a6-fdb1c1459430','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '54e29027-e843-53cb-90bd-91f905a42271','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4708c41e-9f6e-5a2a-87b8-1894b9ea8a8e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f168a8e8-043a-5bfa-a88d-7eab7fce9f7d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '531ffe86-5a5b-5061-806d-33fe1bbca1d0','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '561a1cc1-46b5-5b73-9b86-6452938adc09','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a70b406d-3fb1-5f5c-ba13-ed66b20b6402','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1a999b33-0123-533b-a05e-411c2836e3ea','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1be32fce-8316-5f09-a563-0dc729a429d4','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f6a415af-92c7-5025-b987-254c1d76b94c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '52b4f77b-3429-5f4b-9d35-e63f3b931deb','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '921d416c-5d21-5e61-8df6-1437a88f6823','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8b767996-8d54-5291-833b-7cc69a0bcb4c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48cae49c-2c2a-51c5-a452-139ebdcf797a','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '221e97b5-f79f-5eb2-9e60-7d3e9fade128','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '616a3301-b852-5888-baea-3055db666997','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3039ef32-4b17-5a8b-b702-d33dfeba55df','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd59517e8-89c1-59be-bb91-d2d20bf2ee49','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b99cbbd1-4432-5844-86c9-d9a86c89d3ea','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a54a66e6-c720-5914-a47e-fb0bf513abc6','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ddc743e4-b274-5e8f-aa66-a98a5ebaa30d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '19a13e0e-a915-54e2-984d-6fefd18111f9','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7336adf-8b8c-5a27-b3ab-7302dbc521a1','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '71b11f47-d8f9-5d90-91b6-2431173d2764','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1e7ba9e3-3d97-5f2d-ad90-d88e9df7ffe8','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '54dedb9e-05b0-51a2-a2bc-f812048146bb','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd4f6779f-7051-5c0e-ae98-a8ee9abc6e78','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3e51da9-889c-56ea-b4da-0b3ea2056452','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9313fa3e-f79b-572a-8f3c-6d45515097a7','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77d3da38-52df-5a21-97e7-68662ca0139e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6d9d48fe-5b7b-5b97-a260-91f1c27cde28','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6134e306-bef6-5d98-8b04-bc7300b60fe3','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1cd0d8f3-c96f-51a0-84eb-6ec389753ddc','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2a246038-f399-57e5-b681-fd2c04c135ed','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '370322b7-75d8-5b02-be3e-511ea7bc7564','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '59de5ecd-741d-5115-a116-431d7703a80c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fabaafa6-52e2-57c2-bdac-ce5f81ed156c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bcf5ab4d-aaae-5ae1-9a59-453d42714e2c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '50bfb187-0d76-504c-9bd8-3e77f3a37057','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '41f659f8-1488-513f-a4cf-1b17107c785b','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '867d20f7-7436-51f2-a871-299eb6dd79c4','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3f923f4a-df9e-5a77-9a29-968bb169faff','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6f21837-61d9-5437-a74e-c6b5ddfc4f1c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0fdfa368-7eba-5d3f-b027-54a8d7529787','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3a8966c-8f82-5653-926f-e4a4f0c6cecc','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fceb1adb-d342-5f4b-bed5-a1b8c7c2f02e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8e5b712c-68f7-5660-b08b-00e0b994f92c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8de6ca29-a46a-5e28-9300-720d1c8baeae','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c5403f74-f8bf-543e-8781-492a320c11a3','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0d3c5306-ae22-562c-98fb-74fba55db2f5','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd6df8231-b1ed-539c-a31b-949694b915ce','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfc84a9b-eec3-5e05-8197-b20c2f1593aa','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e90b05bc-fddb-5e1c-8d4b-ac9947d0ab9e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '211c6295-081a-59c2-a71a-11795bbc9779','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd996e3a5-da9e-51c7-91c9-a90605b5a5f3','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6c0f4c15-10eb-5ee5-a27e-d1fcd48dc79d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ab08209-6879-5480-9e47-5d4cba43ee24','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '70c95c39-c05b-5fc1-ac8b-55c4fe5687ae','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6b4cd43d-d40d-53df-9ee7-da04bb828289','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dee72ff4-ba2b-599c-8f77-8fa2f4614f5e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1097f7d8-8527-5f04-8f73-7f7308cf2191','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af9ca6a5-077b-5bbe-a279-7d1d492176e0','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4b906836-647b-548d-9e2e-891fdc7a2ffa','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fb5cde76-2c8c-51da-b633-2e115c7de748','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd253be82-5955-549e-9983-4ff2171f2e1d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee1f58d9-2e00-54ea-b261-83e59849122a','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6a1f12e9-9a81-549c-8587-babef2d2fb34','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a263c63-2397-583a-aa91-620439e346e8','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1ac3f8e5-e9a0-5737-b901-f6f2989e305a','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8babba0b-2e52-5f11-b7d2-bfa46784e90e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d0f6080-d7bb-52ad-8b2c-44bb9c41df23','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b53c7de4-a54d-5525-a043-d910eb5bd4ac','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b7026a60-dcc8-55a9-8d72-40843801452d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '006afd61-1dda-5cfd-8ffc-c3b8a1c55717','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0a0db15b-684c-50b3-be8b-5ba3d5bdeeb9','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '736e43f6-980d-5625-b655-0c6b47a9f8de','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4268034-0efd-510e-8ccf-63742b801131','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2c106cd3-2177-5209-94d6-bdd736c043f0','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9531c14a-973a-512d-93c3-8d575e346125','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '47618c2a-6793-567e-ab8f-d77d10700129','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ca34fb16-15d3-5386-b338-693068ef0d0f','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '64d328eb-9148-5f86-b866-d3d1b51882d5','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4250ae87-617a-5b2d-bf5a-90b5b3b02811','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c1fb9c7c-c09c-5d3d-a9a9-fd9fa4ab0ffc','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e6d5d3e9-58f9-5504-9d1c-e90795ed303b','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4835d71c-7363-5ad7-98bd-cd9bd1d05757','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be538716-85fb-501b-a257-af213245c22e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6e71d809-de11-5f9c-827d-e3b9fab3fe79','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8dabd06a-9da0-51fd-96f8-543aed52a11a','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b65bc513-acf0-5e6d-afc7-ccb4d54a65fc','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd050f659-dd89-5f9b-be48-a0fdf053c164','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b625dc8d-295f-5892-8f9b-d398a3ebe78e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b880002a-ac8e-5c68-a487-1d127ca31004','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '178af931-d5bd-575f-91a8-e009c2a4abd4','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '91cd4005-b855-5579-8791-c72570135f9b','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5eedd994-a4e7-599b-97ac-ff460b92c67d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '41cf92fc-15c4-5e9c-a5cb-fcd1c6422ad6','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6240ea8e-29e0-57bc-ab2f-5012ffee4ec8','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '842b4206-06d6-544f-819b-835749765ff5','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '308d9d2b-da8a-50f0-aba6-0b4f1391c1b4','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3e25023d-fc42-563e-8b96-a8b8d256c9c8','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '12a63600-57b6-5c1d-8011-9b08e6d9bd4c','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1f665d39-5dc4-5d48-9ac8-01553c5c6bd6','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '727ef9e8-6221-5a32-9454-e51420bfd225','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '38a74230-766a-593a-b7fb-004cf57635a8','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e88541a6-00cf-57f8-979a-63c8ccc057ec','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0f955f0c-fdc2-5d6d-9f6f-bc718532689f','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46a8f70d-4063-57c0-8c16-af9247af2358','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e8a180f7-63bc-566c-b293-cdf0da6b934d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd479b130-df6e-5bf6-a1ab-01e268213cd7','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d03a17d-a5a1-5b5b-b179-13d3f5574eb2','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc3902ec-e5b8-59e4-9d03-9274c19fd4eb','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8b2ef30c-faeb-5dbd-a371-45bb86ef0b39','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f486138e-5bad-5b7b-a153-274a1ff895d4','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '55972051-e1df-5075-bc06-62a1e2680f28','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b3b2cbc0-000c-54ef-b2a6-982dbdec5385','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '992362cf-9b54-5357-ac6d-4b46f74f8c03','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cfab9807-bd3c-5133-a897-cc57707ffe05','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f498fe65-0ce7-5c8d-817e-8e735d68450e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd32d4807-6cea-5cd1-b188-6f3ac639cec1','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '58d1e1b5-ec58-5649-8409-3df047c684de','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4bdfd73c-1bea-5aad-8ba8-d15cd1e60b84','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ecdeba11-0eea-5717-b715-3b01bf1ba2f2','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dbf80081-6273-5597-8e56-b50f0c6a3652','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c527b1ad-597a-5281-a4ee-a29a17882168','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '20bc84ed-cb57-56a3-a57c-3ebd9f2488ce','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86b0cc3a-ab78-5f35-af8c-1dc1d371c6b3','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e843d84d-2162-5c1b-aceb-a04faccb517e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'caf9e4c4-f419-5fc0-834e-dc0d26a02012','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5185b166-1d0f-5635-9ad1-795841eec782','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4408a076-f480-5e9a-9be4-3f86d91593bd','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '77a9ebc7-6ec6-5dd7-9bf7-90b44466fb37','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b3fd39c4-9034-599d-b8c4-ebdc979aa5bd','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b811784a-3232-573c-b41b-505d8cd99d06','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ee802dbc-8233-5515-ad13-6d62f66390ae','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ca5c47b-47f6-578b-81ea-fe2e2611e2e3','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '42c237c5-a28f-584e-9b92-f593a87e0e9d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e15996ef-ee6f-5672-990d-7b756197c438','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5bce1225-2294-5b3c-9d5a-3af1a895a88e','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '782a1550-8fc8-558d-a550-fb2ecac5f42a','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-20-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_templates (id,slug,name,coach_type,sport,level,block_length,metadata_json,is_active,created_at_ms,updated_at_ms)
VALUES ('a12c6016-fe2e-576f-97c4-388bf0abf2bd','opleiding-cluster-6','Opleiding Cluster 6','military','military','advanced',6,'{"source": "defensie-matrix-clean.json", "schema": "Opleiding Cluster 6", "cluster": 6, "description": "Dutch military (Defensie) Opleiding Cluster 6 training programme"}',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '254bd6b3-295b-5e94-94f7-e6ea54b7b9bc','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '94745d6b-4063-576d-a58c-ffe198e63351','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '28a98116-8f11-5a4d-b7bb-290c216fc7e6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9a10e27a-61af-5229-8ad0-aa68e3ee9978','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62bea458-a421-507f-9156-62ca4a763e11','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4357dc95-ce5b-58fc-8adb-31344797d900','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c7998221-6a5f-5dbc-b192-6130518dabd7','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '923a1553-e4aa-5c63-962b-3cacac882c02','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8f7a287a-9261-5ad9-8c44-99163956792b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0969ef00-5a9d-5810-b4b5-cdbceeb7f0de','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3d398853-274f-53a3-9198-510fe76ada47','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '57ee0120-5998-58fd-bad8-2f080ee0ed84','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'be412c11-87a6-5a0b-a286-d14a0335d216','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b67a9df6-fedd-5505-abf9-7539befc1841','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1652982c-8141-584b-8a28-fffd466e223f','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '567e057c-5956-5d78-8898-22e7592e995d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cf715dda-73ea-5088-a49c-e2365f6bc4e6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '902fa474-20df-59be-8856-8d8bd45ccac4','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4d0edc84-8f99-5f4a-ba43-78ae70c11fa6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,3,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0a594cba-6d77-50f7-9af8-f42328ac7cf3','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e4d6fb18-aeec-5ea7-abc9-9425ba2b8bcc','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '69e2212c-ee37-5dae-a20f-0bae3cf0fadf','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-6-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4c2dfd1a-8b82-5b88-9aa2-9377a7a638a8','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '253ec060-92b0-5c25-b977-477147276a77','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c4e3758-cae6-52fc-b6cd-d6e146026ad2','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '36a1cf97-2024-5ace-a3f1-2d2367eb7c5a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ed9bdf24-87f9-5306-b983-512fed9d4b0e','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4898ab29-788a-5386-a175-913160972475','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3fa2c7c-d20b-5a24-aee6-abbebbb64a01','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7389ca3b-708c-52f1-b31a-87440ea0dcbc','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b88bed94-d49f-5029-b6cc-51a5e795ea3f','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4ecade06-4afe-5ee1-96ec-f5b3852421b6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '00609ad6-7bb8-5e08-b62e-88f8f2ba6138','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '00c09db2-4109-52fb-b393-02ddae7b2f7a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '708a3b60-b6b0-5e34-ae00-bb3ee14a2a6b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '963894e6-0824-55f2-b619-238489f4e73a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7f6288cb-b43f-529c-9c8d-7adcfb3ee5fa','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5ab20e78-7a14-5cc7-bb98-8e236faf7770','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3119afb-3be2-5ec0-bcaa-c4adc6cfa266','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ddfafa7e-5916-5631-90cf-3c19be410fb1','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '828e997b-7524-5e5d-b881-cb61e1c4446a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9d159b29-798c-5e39-af78-429838ac09d9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '54ba79fa-a026-5c0d-8d9e-92a2c17ae0ed','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d33e3eb-be09-5f29-a86c-6a9b43084dea','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '434c0c6a-6f00-547f-997f-e0006ccfa71c','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '443dc466-c6f5-5528-ab08-34efaaf389fc','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-10kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0d84e5b5-8dad-528d-87d6-835c7dd7b314','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b8dc9e6b-80b7-5a2b-9f2b-73c07572ada2','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2eae30b9-29f8-58c0-8794-df6442b12dfd','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9f4b26bc-0a1a-543e-9cb3-69ea66c8e1b6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97ba9323-646f-54d9-8e0b-728c1ced26a6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '72bd8da9-a024-5a62-b523-e5514a49b538','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7e886367-5f7c-5c35-b45e-ad01ebb42f19','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7eadfe1e-8185-5a9e-8016-62c4408a8243','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1a768741-4c7e-52fc-b834-3a5b48fa7d3b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '93a81abe-4357-5364-b077-82e78277faac','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e7781c01-9ac8-562b-999f-dc85a89161b3','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46985f42-1b6a-5a0d-8d6c-60202979bbed','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '02ef4ef3-16be-5f32-a0c9-fd9c3dc2b72d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c808eb27-1d53-5f8f-899e-bfa19021e008','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-4x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f07538ad-79e4-5687-89a2-54e43f7ed636','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a4a8e50b-7161-5dc1-9691-3e3729fa0d96','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '737de924-4c29-5949-a655-7957dd60ff6c','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '70ad44bc-e5db-5bba-a14f-a5c7a81bc7eb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dc601357-50f4-591a-a8e1-0ba58cef80b7','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ffabfdc-76f5-5091-b921-aa8c30830c20','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '051817ed-2285-57e7-b721-7e19b11fca26','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25af9b70-48d6-5e91-add1-0239465430e9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '23b47ec0-b5ee-56e2-a150-5723dd450f2e','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-25-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '075f1690-8e43-57b3-a8c4-c2379510e684','a12c6016-fe2e-576f-97c4-388bf0abf2bd',3,3,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-5-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-5-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '401fe46c-6a47-592a-875d-1fd22300a3eb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89d25e4c-5bcd-5f55-8507-5932ef84ad51','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-2x10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '45c86380-c47d-5e9e-aa8d-9337256f844a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0120ca5b-dc44-5fc0-afd9-76c2d4848f47','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ebb01d2e-a703-58fe-ae7d-944ef13cee12','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '110d67d6-8b4f-585b-a490-92b56c8a01cb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'dbf9d357-5aa5-5096-90dd-a2d2c1aacd12','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='goblet-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ed083d63-62c6-57e5-bb17-5db597d2344d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '157c2964-929c-5d9e-a0dc-164bdc6a62d9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ecf9b478-6f6e-5887-be3b-a0c4fc0468fb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32b0b028-4128-579c-bfbe-bd3b79c4af56','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0897ca50-2c79-523b-b415-d0cfb9c79490','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x4-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1db11b66-79d5-564d-8b92-184c7f0e4b11','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd63ce2a7-749a-5ac9-b445-e0639936e4eb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,6,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-1x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c0463f37-9c67-5107-ab9e-e30cf9de9582','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e27c462e-341e-5e8e-8b78-443b0cd4ff92','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,1,'exercise',(SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='walking-lunges' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3ac5283d-2da0-53fa-b6ac-5af791b3400a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,2,'exercise',(SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='mountain-climber' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '61e73db5-1532-5af9-991b-27bcc78bc0cc','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '18308923-15cb-5799-94bf-1d79de1e98ce','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,4,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '337cb306-0409-57d4-abaa-82e6f7759adb','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a3be3477-7998-5252-8cf2-7713e1f2f058','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,3,6,'exercise',(SELECT id FROM exercises WHERE slug='step-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='step-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2660980c-2afa-5527-b190-99443914eeaa','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5c517e3c-a279-5cab-8f11-609ccf85999d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '957d637c-a49b-5c58-87f7-ad1aec36ae26','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e8c3bc50-3d89-5960-a4ca-4c6780771939','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6f0b5b17-90b4-54c1-8dd9-17b7bdf7de96','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '96dd5e48-f124-5338-820b-0aec9b12e203','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a4963cdd-8ff3-5e3c-aabc-9df32b648d6f','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a468122c-60ad-537a-b1c7-bdd4f64a7d1c','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '60eb2ebb-d4bd-5392-a852-90298997ab43','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,4,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-5-5-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd2ad39c6-c57c-5396-86cc-063af92a0a8e','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'aecc78d7-6a42-5f54-9195-193a23ebf2ba','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f5ba3883-54e0-5909-9bb4-90f074482941','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3982a384-4ea5-52cc-b703-f94968a55a85','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4468e6b3-694a-5ef4-8b13-7b8e35a63ef0','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3b26aa44-b29e-5810-9afa-0669a9f187c6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7cffcf46-aede-5392-9f26-36dc3778845e','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b7106093-5651-5fb9-82b1-7aa3804b4898','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b585c42a-01d3-530c-a279-514282339126','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2e943dfb-f0fb-5974-b788-a3415bbfcd01','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,1,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '81c921c3-54eb-54cc-a821-cd90d307f351','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5d50f6ef-6e03-56f8-ad34-db9c41934bd9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f548ddda-77e0-5dc4-9a32-14432fc31b91','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-5x1-minuut' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fe2bd4d8-0111-59a3-be87-3c645ec0bc1e','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-6x45-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1de05d31-485e-51f5-8d38-cbd3ad4c60ff','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd416d35a-df17-5914-af40-d8dac47bb85d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,1,'exercise',(SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='flutter-kicks' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '450939ec-0532-5366-9d58-e5a531cfcb04','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,2,'exercise',(SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='shoulder-tap' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '8c95b380-bf09-5cc3-827a-bcfb5c873333','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,3,'exercise',(SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='dead-bug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '07f761e9-f040-575e-8386-693581ef48f4','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,4,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '046b5760-4dec-5e6b-9bbc-331db107f5bd','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,6,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond-rugzak' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '352a56c4-486a-526b-863e-b127184783e9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '094d80f5-6e5a-528a-89f5-efbcd29207f2','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-2x10-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '52785ca7-3cc9-5088-b9aa-ad428d53f814','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-6-minuten-rugzak-45kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-6-minuten-rugzak-45kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '14986ff8-0d21-5cfc-a1d3-3aafcbf06f00','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,0,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e64c0361-3bd3-5d46-b155-cdf924db05b3','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,0,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-2-12-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '09fa19b6-64e5-5cba-84f6-cd4bd6f92dc5','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,0,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-8-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6fd3a236-6215-55a0-ac36-84fbc06a2f44','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,0,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ab7f08eb-f976-59c8-8641-4f14f6fc5e54','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,1,'exercise',(SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='voorwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5b00ff15-a074-5190-a3c9-91221d7766a6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,2,'exercise',(SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='zijwaartse-plank' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46fbfb4b-f698-5fc7-90eb-0092d9d1a156','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,3,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c5c1365a-1de6-519a-b736-ed0201f4e81f','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,4,'exercise',(SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='tuck-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1d2dcbac-212d-55eb-8ce4-562a6852717c','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,5,'exercise',(SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hand-release-push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a945528b-1fe4-5e3b-9d3b-a1dc18decc1b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,1,6,'exercise',(SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='broad-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1ad0b45c-c508-51a1-aab7-c6a3dc9f5ae1','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,2,1,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-10-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '859c9369-b133-55c9-a777-8cd5d7681a93','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,2,2,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-2x3-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4604f02a-be77-565e-9697-eea5e3087a99','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,2,3,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-4-3x2-minuten' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '3ecd735e-f41e-57d2-834c-757cb52d2463','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,2,4,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-5-4x30-seconden' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c34f1c40-80de-5d47-abc1-0bfbe9033a22','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,2,5,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-1-5-minuten-warmup' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f86fbbf9-5e19-52c9-92fc-91c8ba5fe7b0','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,3,1,'exercise',(SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='squat-calf-raise' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '80fdcba2-021c-50ef-8302-de317d7c6599','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,3,2,'exercise',(SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='heup-brug' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '86f4f6a3-28f4-5a44-8784-73b6b3dbf8a8','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,3,3,'exercise',(SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='counter-movement-jump' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4dfbddfc-2637-5cbe-ba6e-3e61f1dd666b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,3,4,'exercise',(SELECT id FROM exercises WHERE slug='push-up' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='push-up' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'eefcaf40-b1c3-5f14-a7b3-9f5c92d618a0','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,3,5,'exercise',(SELECT id FROM exercises WHERE slug='burpee' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='burpee' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'cd682e6f-cbae-5595-8d8b-2b380ce9bbec','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,1,'exercise',(SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='wissel-sprongen' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9c567416-ce20-502d-ad68-b805f121107a','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,2,'exercise',(SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bird-dog' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '053d7bf3-a85c-57b5-b3b7-03bac45f1810','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,3,'exercise',(SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='bicycle-crunch' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '32e69b88-f31a-5ade-a5bc-109f492672c6','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,4,'exercise',(SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='single-leg-deadlift' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b0c7fb45-85a3-5b54-8bbe-b8c23def899b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,5,'exercise',(SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='split-squat' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5af478a1-1fb1-5e59-a6e7-3a1d0ff31de5','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,6,'exercise',(SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='clean-pull' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '7a97011b-fc54-5206-aa00-302c9d71c7f3','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,7,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-25kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1a157fae-6a73-58e2-beaa-276e31c8eab1','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,8,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-35kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-20-minuten-rugzak-35kg' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97e41a59-03dc-572e-8e9d-4aa2b68dcb2b','a12c6016-fe2e-576f-97c4-388bf0abf2bd',6,4,9,'exercise',(SELECT id FROM exercises WHERE slug='marsen-6-km-u-8-minuten-rugzak-45kg' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='marsen-6-km-u-8-minuten-rugzak-45kg' LIMIT 1) IS NOT NULL;

-- ---------------------------------------------------------------------------
-- program_template_items supplement — migration 0048 (2 backfilled items)
-- hardlopen-zone-3-5-minuten resolved: name confirms 5-minute Zone 3 interval.
-- Both items: Interval Training sessions, week 4, day 3 (day_index=2), order=7.
-- ---------------------------------------------------------------------------

-- Keuring Cluster 2
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '722de528-41ba-5da5-a1ee-badcaeee0a5f','05027310-42c1-51d4-83c3-e3677988194c',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1) IS NOT NULL;

-- Keuring Cluster 3
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2fa5b262-46c6-5a00-a6d7-19a99f7932d7','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,2,7,'exercise',(SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='hardlopen-zone-3-5-minuten' LIMIT 1) IS NOT NULL;

-- ---------------------------------------------------------------------------
-- program_template_items supplement — migration 0049 (50 backfilled items)
-- All 3 remaining deferred exercises resolved. 50 template items backfilled.
--   optillen-vanaf-de-grond (48 items across all 13 templates)
--   til-draagtest-gewicht-plaatsen-naar-heupen (1 item: KC2 week 3)
--   til-draagtest-full-exercise (1 item: KC5 week 5)
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9fa94698-8c76-5992-9e53-bac5c2557604','b7661135-0f5a-55eb-b67d-96e970972b76',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'f3cc4a9b-634b-50a4-b755-9c2f37f871ac','b7661135-0f5a-55eb-b67d-96e970972b76',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1487a80b-7aa7-5218-a950-be0465e8710e','b7661135-0f5a-55eb-b67d-96e970972b76',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '63aa54c0-7b23-590b-982f-d89da526b606','b7661135-0f5a-55eb-b67d-96e970972b76',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '59f74d0d-0699-56ee-9781-8f2375efd1b5','fe74ed29-280e-50c7-8945-2fcbac00c37a',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '89038934-85a9-5208-aaa1-c24f5690993a','fe74ed29-280e-50c7-8945-2fcbac00c37a',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0b5ea44e-0196-5897-8f97-c99678e6774e','fe74ed29-280e-50c7-8945-2fcbac00c37a',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '5622efdd-0f10-5ae1-a6ae-dde22ec49eac','fe74ed29-280e-50c7-8945-2fcbac00c37a',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4a2e89c7-9404-562d-a209-33b8de4896d8','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c9343c5c-1ff1-50d8-9dfc-405964d9d876','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a063a375-49aa-5ea8-a64a-ff91f04fc6ba','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'fc4c328e-6fde-50ce-906e-5e38b5aef47f','2b8536a7-6f0e-5b5e-9f01-073f024cb42f',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6f64a30e-d973-53a7-896f-a1cfd39e347a','356efd26-4770-5998-8993-022a911f778d',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '48d77a19-6466-5096-8322-6d54f7db8195','356efd26-4770-5998-8993-022a911f778d',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '991aabe8-38b9-52c6-b361-fab38f8e0c15','356efd26-4770-5998-8993-022a911f778d',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6ab4d98a-8a60-55af-9cf3-497552df5700','356efd26-4770-5998-8993-022a911f778d',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '96084c42-21c0-56b2-964c-1cea11357d34','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd77bdbd4-8f35-5af3-8b41-e008b661776d','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',2,4,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4093bda4-c384-511d-a8e0-8a2c7665e138','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',4,1,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bd2bbe39-0abd-5ad5-85e1-4d3c4e7a8c45','4a2b7a8b-2169-5a53-a82a-1c9c94a3d489',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a288f268-d9d8-58d7-8c04-0359b5bce3c9','a12c6016-fe2e-576f-97c4-388bf0abf2bd',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b992c86c-f5b6-5aa7-8117-859843b7b12d','a12c6016-fe2e-576f-97c4-388bf0abf2bd',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5f10ae3-ec4a-568c-95ac-af2b497b3088','a12c6016-fe2e-576f-97c4-388bf0abf2bd',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'b7431f70-0286-5b12-b272-48571fd181d4','a12c6016-fe2e-576f-97c4-388bf0abf2bd',5,3,5,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '25ac5f08-7df1-51fa-b91a-483a1ed4f723','3c03987a-e87b-5571-a17b-387160971d74',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'af8e7f86-11c6-5f8b-b77e-f7eb5ae9ca04','3c03987a-e87b-5571-a17b-387160971d74',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'ea69faa9-29d5-5af2-88b3-380d7efdbf27','3c03987a-e87b-5571-a17b-387160971d74',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bcaf2752-326e-50f1-8dbd-170f896d7928','3c03987a-e87b-5571-a17b-387160971d74',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c4b2ec60-10bc-5e79-a073-5a50ef5559c6','464c2feb-34ca-56b6-ac3b-4c8696dd022e',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '0bc79f5f-6a74-5a56-b2dd-84f816c1992f','464c2feb-34ca-56b6-ac3b-4c8696dd022e',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '46ef5fc3-e0cc-5551-b5f0-d315972894d2','05027310-42c1-51d4-83c3-e3677988194c',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '19838cb1-45e5-5808-8796-1517e96a6cf5','05027310-42c1-51d4-83c3-e3677988194c',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'baa1819e-d353-5899-94cc-01f652b85505','05027310-42c1-51d4-83c3-e3677988194c',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'bdd937f1-0242-5b9f-8a77-ab8e73546818','05027310-42c1-51d4-83c3-e3677988194c',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'a6a1d955-740e-5f5c-b861-3de1eadee6ef','33cb93e8-a882-56c4-b116-a494ec9f7ea3',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '9ba4ecb5-f818-588b-97a2-434ed21789ef','33cb93e8-a882-56c4-b116-a494ec9f7ea3',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '6fe5a60a-8689-50ac-b587-c2311f7ab992','33cb93e8-a882-56c4-b116-a494ec9f7ea3',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '4f62364f-e50f-5254-aa46-0f88e77a80ee','33cb93e8-a882-56c4-b116-a494ec9f7ea3',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '97170fe6-7790-54b7-822c-b54a16f4c9e5','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '1af4dd39-09c9-5d1b-96b9-05b94f86715d','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'db8800d4-75cf-521b-9295-1cde9de18ee3','cd52c6d4-cbfb-5da3-a2fd-37d1df5cf5f2',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e5e8f695-c95d-52e7-b664-a944e86477a5','48f897de-7f10-56c1-9b92-5097ed7df48b',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '62aafa90-b8d3-53f2-8660-994d9a051cbc','48f897de-7f10-56c1-9b92-5097ed7df48b',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'c5374f39-ca1f-55f7-8482-f9dda2c5e6bb','48f897de-7f10-56c1-9b92-5097ed7df48b',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '54e37613-5e48-5293-a239-c1cea8846b70','2b083a43-7acb-5d24-96bb-c349c837465e',1,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '2198b4ed-1d5f-538b-b625-81f1c4c6ef55','2b083a43-7acb-5d24-96bb-c349c837465e',2,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'adfcff50-d834-5cf2-840a-63d3e69f99f7','2b083a43-7acb-5d24-96bb-c349c837465e',4,1,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'd3634b64-91c2-5c29-bb4c-e00ea72dc2d8','2b083a43-7acb-5d24-96bb-c349c837465e',5,4,4,'exercise',(SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='optillen-vanaf-de-grond' LIMIT 1) IS NOT NULL;

-- til-draagtest-gewicht-plaatsen-naar-heupen (1 item: Keuring Cluster 2, week 3)
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '21d6afa1-b383-575c-b308-aaa2dd439356','05027310-42c1-51d4-83c3-e3677988194c',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='til-draagtest-gewicht-plaatsen-naar-heupen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='til-draagtest-gewicht-plaatsen-naar-heupen' LIMIT 1) IS NOT NULL;

-- til-draagtest-full-exercise (1 item: Keuring Cluster 5, week 5)
INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1acc730-fe93-525c-8eed-ab239066ac74','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,7,'exercise',(SELECT id FROM exercises WHERE slug='til-draagtest-full-exercise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='til-draagtest-full-exercise' LIMIT 1) IS NOT NULL;

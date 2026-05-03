-- 0046: Exercise aliases for military exercise variants
--
-- Adds globally-unique alias rows mapping name variants to canonical exercise slugs.
-- Sources: defensie-exercise-catalogue consolidation summary, matrix name variants.
-- All aliases resolve to exercises imported in 0045 or existing canonical exercises.
--
-- Alias uniqueness is enforced by the UNIQUE index added in migration 0044.
-- INSERT OR IGNORE used to make this migration idempotent.

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
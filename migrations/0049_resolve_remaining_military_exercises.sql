-- 0049: Resolve all remaining deferred military exercises
--
-- All 3 previously deferred exercises are now resolved using:
--   defensie-matrix-clean.json (object specification for optillen)
--   werkenbijdefensie.nl (Progressieve Til/Draagtest weights + full sequence)
--
-- Resolutions:
--
--   optillen-vanaf-de-grond (RESOLVED)
--     Matrix raw data (majority of occurrences): "gevulde rugzak, krat of doos"
--     (filled rucksack, crate, or box). Object was specified in the source data;
--     the import-ready JSON only captured one early 10-second variant without object.
--     Dominant pattern: 3 x 30 s, rest 30 s. No specific weight needed (time-based).
--     Test context: munitiekist 20 kg (Basis/K1), 30 kg (K2-K6), 40 kg (K3/K5/K6).
--
--   til-draagtest-gewicht-plaatsen-naar-heupen (RESOLVED)
--     Movement: explosively lift munitiekist from floor to shoulder-height table
--     (115-135 cm, adjusted to body height). Fast execution.
--     Test weights: 20/30/40 kg progressive. New rep every 25 seconds in test.
--     Prescription: 5 sets x 10 s, 2 min rest.
--
--   til-draagtest-full-exercise (RESOLVED)
--     Full simulation of Defensie Progressieve Til/Draagtest sequence:
--     lift from floor → carry 25 m → place on table → lift from table →
--     carry 25 m back → lower to floor. One rep every 25 seconds.
--     Test weights: 20+30+40 kg progressive by cluster.
--     Prescription: 2 sets x 10 reps, 30 s rest between sets.
--
-- Source: werkenbijdefensie.nl/alles-over-je-sollicitatie-aanstellingskeuring
-- Timestamp: 2026-05-03 UTC (1746230400000)
--
-- Template items backfilled:
--   optillen-vanaf-de-grond               : 48 items across all 13 templates
--   til-draagtest-gewicht-plaatsen-naar-heupen :  1 item (Keuring Cluster 2, week 3)
--   til-draagtest-full-exercise            :  1 item (Keuring Cluster 5, week 5)
--   Total: 50 items
--
-- After this migration, all 52 originally-deferred template items are resolved:
--   0048: 2 items (hardlopen-zone-3-5-minuten in KC2 + KC3)
--   0049: 50 items (all remaining)
--
-- Note: 0047 header stated 52 deferred items with per-exercise counts of
-- 34 / 6 / 6 / 6. Actual matrix counts are 48 / 1 / 1 / 2 = 52 total correct,
-- but the per-exercise breakdown was inaccurate.

-- ===========================================================================
-- EXERCISES (3 rows)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- optillen-vanaf-de-grond
-- Object confirmed from matrix raw data: "gevulde rugzak, krat of doos"
-- Test context: munitiekist progressive 20/30/40 kg by cluster
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id,slug,name,category,primary_muscles_json,secondary_muscles_json,tags_json,equipment_required_json,instructions_json,metrics_json,is_active,created_at_ms,updated_at_ms)
SELECT '2ea4afcf-e936-57b3-8e69-0eba3365195a','optillen-vanaf-de-grond','Optillen vanaf de grond','strength','["glutes","quads"]','["lats","abs"]','["power","lower-body","military"]','["none"]','{"steps":["Stand with feet shoulder-width apart over the object (rucksack, crate, or box)","Hinge at hips and knees with flat back and grip the object firmly","Lift the object explosively from floor to hip height","Lower with control back to the floor"],"cues":["3 sets x 30 s","30 s rest","Keep back straight throughout","Object: filled rucksack, crate, or box — test standard uses a munitiekist (20 kg Basis/K1, 30 kg K2-K6, 40 kg K3/K5/K6)"]}','{"supports":["time","sets"]}',1,1746230400000,1746230400000
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE slug='optillen-vanaf-de-grond');

-- ---------------------------------------------------------------------------
-- til-draagtest-gewicht-plaatsen-naar-heupen
-- Defensie Til/Draagtest: explosive lift of munitiekist to shoulder-height table
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id,slug,name,category,primary_muscles_json,secondary_muscles_json,tags_json,equipment_required_json,instructions_json,metrics_json,is_active,created_at_ms,updated_at_ms)
SELECT 'f29f1e9c-c415-508e-adc3-375999c3b844','til-draagtest-gewicht-plaatsen-naar-heupen','Til/draagtest: Gewicht plaatsen naar heupen','skill','["glutes","quads"]','["lats","abs"]','["power","military"]','["none"]','{"steps":["Starting position: munitiekist (ammunition crate) on the floor","Grip the handles firmly — arms horizontal at shoulder height when extended","Explosively lift crate from floor to shoulder height in one fast movement","Place crate on lift table at shoulder height (115-135 cm, adjusted to body height)","Lower with control"],"cues":["5 sets x 10 s","2 min rest","Fast explosive execution","Test weights: 20 kg (Basis/K1), 30 kg (K2/K4), 40 kg (K3/K5/K6)","New repetition every 25 seconds in the actual test"]}','{"supports":["time","sets"]}',1,1746230400000,1746230400000
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE slug='til-draagtest-gewicht-plaatsen-naar-heupen');

-- ---------------------------------------------------------------------------
-- til-draagtest-full-exercise
-- Full simulation of Defensie Progressieve Til/Draagtest sequence
-- ---------------------------------------------------------------------------

INSERT INTO exercises (id,slug,name,category,primary_muscles_json,secondary_muscles_json,tags_json,equipment_required_json,instructions_json,metrics_json,is_active,created_at_ms,updated_at_ms)
SELECT '485f47ea-5303-5bfa-bd2a-66f043d49add','til-draagtest-full-exercise','Til/draagtest: Full exercise','skill','["glutes","lats"]','["abs","quads"]','["full-body","military"]','["none"]','{"steps":["Lift munitiekist from floor","Carry 25 metres to the lift table","Place crate on table at shoulder height (115-135 cm, adjusted to body height)","Lift crate from table","Carry 25 metres back","Lower crate to floor — this completes one repetition","New repetition starts every 25 seconds"],"cues":["2 sets x 10 reps","30 s rest between sets","Test weights: 20 kg (Basis/K1), 20+30 kg (K2/K4), 20+30+40 kg (K3/K5/K6)","Arms horizontal at shoulder height when gripping handles","Train with the weight appropriate for your cluster target"]}','{"supports":["reps","sets"]}',1,1746230400000,1746230400000
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE slug='til-draagtest-full-exercise');

-- ===========================================================================
-- PROGRAM TEMPLATE ITEMS (50 rows)
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- optillen-vanaf-de-grond (48 items across all 13 templates)
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

-- ---------------------------------------------------------------------------
-- til-draagtest-gewicht-plaatsen-naar-heupen (1 item)
-- Keuring Cluster 2, week=3, day_index=1, session_order=5
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT '21d6afa1-b383-575c-b308-aaa2dd439356','05027310-42c1-51d4-83c3-e3677988194c',3,1,5,'exercise',(SELECT id FROM exercises WHERE slug='til-draagtest-gewicht-plaatsen-naar-heupen' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='til-draagtest-gewicht-plaatsen-naar-heupen' LIMIT 1) IS NOT NULL;

-- ---------------------------------------------------------------------------
-- til-draagtest-full-exercise (1 item)
-- Keuring Cluster 5, week=5, day_index=1, session_order=7
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO program_template_items (id,program_template_id,block_week,day_index,session_order,item_type,exercise_id,protocol_id,notes_json,created_at_ms,updated_at_ms)
SELECT 'e1acc730-fe93-525c-8eed-ab239066ac74','48f897de-7f10-56c1-9b92-5097ed7df48b',5,1,7,'exercise',(SELECT id FROM exercises WHERE slug='til-draagtest-full-exercise' LIMIT 1),NULL,NULL,1746230400000,1746230400000
WHERE (SELECT id FROM exercises WHERE slug='til-draagtest-full-exercise' LIMIT 1) IS NOT NULL;

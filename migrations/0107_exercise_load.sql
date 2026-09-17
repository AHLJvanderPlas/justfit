-- 0107_exercise_load.sql — C-F6: make external load a first-class metric.
--
-- Correction to the original C-F6 design: the vocabulary token is `weight`, not
-- `load`, and it already existed on 34 exercises. The earlier analysis grepped the
-- migration FILES with a regex matching only the compact `"supports":["..."]` form,
-- so batches 0102-0106 (which write spaced JSON) were invisible to it. The real gap
-- was never the vocabulary — it is that nothing in the app captures, prescribes or
-- scores the number.
--
-- This migration does two things:
--   1. Adds `weight` to the 51 weight-bearing exercises that were missing it.
--   2. Adds `load_type` to all 85, which plate maths and display both need — a
--      dumbbell pair at "20 kg" means 20 per hand, and rendering 40 would be wrong.
--
-- Deliberately NOT marked as carrying load:
--   rucksack (19)  — march weight is baked into the slug (rugzak-25kg) and driven
--                    by MIL_MARCH_KG; a second source would let the user contradict
--                    the prescription.
--   pull_up_bar, dip_station — bodyweight by default; weighted is the exception.
--   resistance_bands         — resistance is not expressible in kg.
--   bench, squat_rack alone  — support furniture, not load.


-- load_type = barbell (13 exercises)
UPDATE exercises SET metrics_json = json_set(metrics_json, '$.load_type', 'barbell') WHERE id IN ('651944bc-7774-5ad5-84dd-51aa1d1d4bae','ex_bb_back_squat','ex_bb_front_squat','ex_bb_bench','ex_bb_ohp','ex_bb_deadlift','ex_bb_rdl','ex_bb_row','ex_bb_hip_thrust','ex_bb_lunge','ex_ez_curl','ex_bb_calf','ex_bb_good_morning');

-- load_type = dumbbell_pair (34 exercises)
UPDATE exercises SET metrics_json = json_set(metrics_json, '$.load_type', 'dumbbell_pair') WHERE id IN ('a347874a-e92f-500c-ab38-fc3660355a31','ex_db_curl','ex_db_shoulder_press','ex_db_lateral_raise','ex_db_deadlift','ex_db_tricep_kickback','ex_db_romanian_dl','ex_db_hammer_curl','ex_db_rear_delt_fly','ex_db_overhead_tricep_ext','ex_db_front_raise','ex_db_sumo_deadlift','ex_db_lunge','ex_db_shrug','ex_db_wood_chop','ex_db_seated_press','ex_dumbbell_chest_press_incline','ex20_002','ex20_003','ex20_005','ex20_006','ex20_007','ex20_008','ex20_009','ex20_010','ex20_011','ex20_012','ex20_013','ex20_014','ex_high_pull','ex_core_plank_pull','0ba3d7b5-17a9-562c-a74c-e31b90692dbc','3b258049-88d8-5596-8aa3-41d49a3cbef4','ex_calf_db_raise');

-- load_type = dumbbell_single (22 exercises)
UPDATE exercises SET metrics_json = json_set(metrics_json, '$.load_type', 'dumbbell_single') WHERE id IN ('ex_db_farmers_walk','ex20_001','ex20_004','ex20_015','ex20_024','ex20_025','ex20_026','ex20_027','ex20_028','ex20_029','ex_kb_tgu','ex_kb_clean','ex_kb_clean_press','ex_kb_snatch','ex_kb_windmill','ex_kb_row','ex_kb_front_squat','ex_kb_high_pull','ex_kb_press','2b9f9857-49f2-5fbb-b30d-d8eb02bd31b5','ex_core_suitcase_carry','ex_kb_carry');

-- load_type = machine_stack (16 exercises)
UPDATE exercises SET metrics_json = json_set(metrics_json, '$.load_type', 'machine_stack') WHERE id IN ('ex_pull_lat_pulldown','ex_pull_seated_cable_row','ex_pull_assisted_machine','ex_pull_straight_arm','ex_m_leg_press','ex_m_leg_curl','ex_m_leg_ext','ex_m_chest_press','ex_m_pec_deck','ex_m_cable_curl','ex_m_triceps_pushdown','ex_m_calf_press','ex_m_cable_woodchop','ex_m_seated_shoulder','ex_m_hack_squat','ex_core_pallof_cable');

-- Add the `weight` token to the 51 weight-bearing exercises missing it.
-- json_insert with '[#]' appends; it is a no-op if the path already exists.
UPDATE exercises SET metrics_json = json_insert(metrics_json, '$.supports[#]', 'weight') WHERE id IN ('a347874a-e92f-500c-ab38-fc3660355a31','ex_db_curl','ex_db_shoulder_press','ex_db_lateral_raise','ex_db_deadlift','ex_db_tricep_kickback','ex_db_romanian_dl','ex_db_hammer_curl','ex_db_rear_delt_fly','ex_db_overhead_tricep_ext','ex_db_front_raise','ex_db_sumo_deadlift','ex_db_farmers_walk','ex_db_lunge','ex_db_shrug','ex_db_wood_chop','ex_db_seated_press','ex_dumbbell_chest_press_incline','ex20_001','ex20_002','ex20_003','ex20_004','ex20_005','ex20_006','ex20_007','ex20_008','ex20_009','ex20_010','ex20_011','ex20_012','ex20_013','ex20_014','ex20_015','ex20_024','ex20_025','ex20_026','ex20_027','ex20_028','ex20_029','ex_high_pull');
UPDATE exercises SET metrics_json = json_insert(metrics_json, '$.supports[#]', 'weight') WHERE id IN ('651944bc-7774-5ad5-84dd-51aa1d1d4bae','ex_core_plank_pull','ex_kb_tgu','ex_kb_clean','ex_kb_clean_press','ex_kb_snatch','ex_kb_windmill','ex_kb_row','ex_kb_front_squat','ex_kb_high_pull','ex_kb_press');

-- Two exercises (bench-step-up, seated-calf-raise) declared `weight` in an earlier
-- batch but list only ["bench"] as equipment — you hold a dumbbell the equipment
-- array never named. bodyweight_plus is the honest description and keeps the
-- invariant that every weight-supporting exercise has a load_type.
UPDATE exercises SET metrics_json = json_set(metrics_json, '$.load_type', 'bodyweight_plus') WHERE is_active=1 AND json_extract(metrics_json,'$.supports') LIKE '%weight%' AND json_extract(metrics_json,'$.load_type') IS NULL;

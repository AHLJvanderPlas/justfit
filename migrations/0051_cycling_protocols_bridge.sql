-- 0051: Bridge cycling_workouts into unified workout_protocols / workout_protocol_steps
--
-- Purpose: Phase 3c — populate the shared protocol tables with all 29 cycling
-- workouts so they are represented in the unified training model.
--
-- What this migration does NOT do:
--   - Does not remove or alter cycling_workouts (compatibility table remains)
--   - Does not change plan.js (runtime still reads cycling_workouts)
--   - Does not break any current cycling coach behaviour
--
-- Cross-reference convention:
--   workout_protocols.id  = 'wp-{cw_id}'   e.g. 'wp-cw01'
--   workout_protocol_steps.id = 'wps-{cw_id}-{step_order}'
--   tags_json includes 'cw_ref:{cw_id}' for stable cross-trace
--   description stores cycling-specific fields not in the generic schema
--     (sub_goal, workout_type, tss_estimate, duration_min)
--
-- Timestamp: 2026-05-03 UTC (1746230400000)

-- ---------------------------------------------------------------------------
-- workout_protocols — 29 rows
-- ---------------------------------------------------------------------------

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw01','cw-z2-45','Zone 2 · 45 min','cycling','endurance','steady_state',
   'Sub-goal: build_fitness. Type: endurance. TSS ref: 32. Duration: 45 min. Source: cycling_workouts cw01.',
   '["cycling","sub_goal:build_fitness","workout_type:endurance","cw_ref:cw01"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw02','cw-ss-2x12','Sweet Spot · 2×12 min','cycling','endurance','interval',
   'Sub-goal: build_fitness. Type: sweet_spot. TSS ref: 45. Duration: 47 min. Source: cycling_workouts cw02.',
   '["cycling","sub_goal:build_fitness","workout_type:sweet_spot","cw_ref:cw02"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw03','cw-tempo-30','Tempo · 30 min','cycling','endurance','interval',
   'Sub-goal: build_fitness. Type: threshold. TSS ref: 42. Duration: 45 min. Source: cycling_workouts cw03.',
   '["cycling","sub_goal:build_fitness","workout_type:threshold","cw_ref:cw03"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw04','cw-cadence-pyramid','Cadence Pyramid · 35 min','cycling','endurance','interval',
   'Sub-goal: build_fitness. Type: endurance. TSS ref: 25. Duration: 35 min. Source: cycling_workouts cw04.',
   '["cycling","sub_goal:build_fitness","workout_type:endurance","cw_ref:cw04"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw05','cw-threshold-2x10','Threshold · 2×10 min','cycling','endurance','interval',
   'Sub-goal: climbing. Type: threshold. TSS ref: 47. Duration: 50 min. Source: cycling_workouts cw05.',
   '["cycling","sub_goal:climbing","workout_type:threshold","cw_ref:cw05"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw06','cw-vo2max-4x4','VO2max · 4×4 min','cycling','power','interval',
   'Sub-goal: climbing. Type: vo2max. TSS ref: 50. Duration: 52 min. Source: cycling_workouts cw06.',
   '["cycling","sub_goal:climbing","workout_type:vo2max","cw_ref:cw06"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw07','cw-over-unders-3x9','Over-Unders · 3×9 min','cycling','endurance','interval',
   'Sub-goal: climbing. Type: threshold. TSS ref: 60. Duration: 55 min. Source: cycling_workouts cw07.',
   '["cycling","sub_goal:climbing","workout_type:threshold","cw_ref:cw07"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw08','cw-threshold-30','Long Threshold · 30 min','cycling','endurance','interval',
   'Sub-goal: climbing. Type: threshold. TSS ref: 58. Duration: 50 min. Source: cycling_workouts cw08.',
   '["cycling","sub_goal:climbing","workout_type:threshold","cw_ref:cw08"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw09','cw-sprint-vo2-sprint','Sprint-VO2-Sprint · 3 rounds','cycling','power','interval',
   'Sub-goal: sprint. Type: anaerobic. TSS ref: 42. Duration: 40 min. Source: cycling_workouts cw09.',
   '["cycling","sub_goal:sprint","workout_type:anaerobic","cw_ref:cw09"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw10','cw-anaerobic-6x30s','Anaerobic · 6×30 s','cycling','power','interval',
   'Sub-goal: sprint. Type: anaerobic. TSS ref: 29. Duration: 35 min. Source: cycling_workouts cw10.',
   '["cycling","sub_goal:sprint","workout_type:anaerobic","cw_ref:cw10"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw11','cw-cadence-builds','Cadence Builds · 5×4 min','cycling','endurance','interval',
   'Sub-goal: sprint. Type: endurance. TSS ref: 25. Duration: 35 min. Source: cycling_workouts cw11.',
   '["cycling","sub_goal:sprint","workout_type:endurance","cw_ref:cw11"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw12','cw-neuromuscular-10x10s','Neuromuscular · 10×10 s','cycling','power','interval',
   'Sub-goal: sprint. Type: anaerobic. TSS ref: 25. Duration: 30 min. Source: cycling_workouts cw12.',
   '["cycling","sub_goal:sprint","workout_type:anaerobic","cw_ref:cw12"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw13','cw-z2-45-base','Zone 2 · 45 min','cycling','endurance','steady_state',
   'Sub-goal: aerobic_base. Type: endurance. TSS ref: 32. Duration: 45 min. Source: cycling_workouts cw13.',
   '["cycling","sub_goal:aerobic_base","workout_type:endurance","cw_ref:cw13"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw14','cw-z2-60','Zone 2 · 60 min','cycling','endurance','steady_state',
   'Sub-goal: aerobic_base. Type: endurance. TSS ref: 42. Duration: 60 min. Source: cycling_workouts cw14.',
   '["cycling","sub_goal:aerobic_base","workout_type:endurance","cw_ref:cw14"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw15','cw-z2-90','Zone 2 · 90 min','cycling','endurance','steady_state',
   'Sub-goal: aerobic_base. Type: endurance. TSS ref: 63. Duration: 90 min. Source: cycling_workouts cw15.',
   '["cycling","sub_goal:aerobic_base","workout_type:endurance","cw_ref:cw15"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw16','cw-recovery-spin','Recovery Spin · 30 min','cycling','recovery','steady_state',
   'Sub-goal: aerobic_base. Type: endurance (recovery). TSS ref: 15. Duration: 30 min. Source: cycling_workouts cw16.',
   '["cycling","sub_goal:aerobic_base","workout_type:endurance","cw_ref:cw16"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw17','cw-z2-60-race','Zone 2 · 60 min','cycling','endurance','steady_state',
   'Sub-goal: race_fitness. Type: endurance. TSS ref: 42. Duration: 60 min. Source: cycling_workouts cw17.',
   '["cycling","sub_goal:race_fitness","workout_type:endurance","cw_ref:cw17"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw18','cw-vo2max-5x5','VO2max · 5×5 min','cycling','power','interval',
   'Sub-goal: race_fitness. Type: vo2max. TSS ref: 74. Duration: 65 min. Source: cycling_workouts cw18.',
   '["cycling","sub_goal:race_fitness","workout_type:vo2max","cw_ref:cw18"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw19','cw-z2-sprints','Zone 2 + Sprints · 60 min','cycling','endurance','interval',
   'Sub-goal: race_fitness. Type: endurance. TSS ref: 46. Duration: 62 min. Source: cycling_workouts cw19.',
   '["cycling","sub_goal:race_fitness","workout_type:endurance","cw_ref:cw19"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw20','cw-race-sim','Race Simulation · 60 min','cycling','endurance','interval',
   'Sub-goal: race_fitness. Type: threshold. TSS ref: 62. Duration: 60 min. Source: cycling_workouts cw20.',
   '["cycling","sub_goal:race_fitness","workout_type:threshold","cw_ref:cw20"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw21','cw-test-ramp','Ramp Test','cycling','test','test',
   'Sub-goal: any. Type: test (FTP ramp). TSS ref: 45. Duration: 25 min. Source: cycling_workouts cw21.',
   '["cycling","sub_goal:any","workout_type:test","cw_ref:cw21"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw22','cw-test-12min','12-min FTP Test','cycling','test','test',
   'Sub-goal: any. Type: test (12-min FTP). TSS ref: 38. Duration: 32 min. Source: cycling_workouts cw22.',
   '["cycling","sub_goal:any","workout_type:test","cw_ref:cw22"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw23','cw-test-20min','20-min FTP Test','cycling','test','test',
   'Sub-goal: any. Type: test (20-min FTP). TSS ref: 52. Duration: 40 min. Source: cycling_workouts cw23.',
   '["cycling","sub_goal:any","workout_type:test","cw_ref:cw23"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw24','cw-vo2max-pyramid','VO2max Pyramid · 30 min','cycling','power','interval',
   'Sub-goal: climbing. Type: vo2max. TSS ref: 26. Duration: 30 min. Source: cycling_workouts cw24.',
   '["cycling","sub_goal:climbing","workout_type:vo2max","cw_ref:cw24"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw25','cw-sprint-vo2-sprint-30','Sprint-VO2-Sprint · 30 min','cycling','power','interval',
   'Sub-goal: sprint. Type: anaerobic. TSS ref: 26. Duration: 30 min. Source: cycling_workouts cw25.',
   '["cycling","sub_goal:sprint","workout_type:anaerobic","cw_ref:cw25"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw26','cw-sprint-pyramid','Sprint Pyramid · 46 min','cycling','power','interval',
   'Sub-goal: sprint. Type: anaerobic. TSS ref: 31. Duration: 46 min. Source: cycling_workouts cw26.',
   '["cycling","sub_goal:sprint","workout_type:anaerobic","cw_ref:cw26"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw27','cw-40-20-climbing','40-20 s VO2max · climbing','cycling','power','interval',
   'Sub-goal: climbing. Type: vo2max. TSS ref: 29. Duration: 30 min. Source: cycling_workouts cw27.',
   '["cycling","sub_goal:climbing","workout_type:vo2max","cw_ref:cw27"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw28','cw-40-20-race','40-20 s VO2max · race','cycling','power','interval',
   'Sub-goal: race_fitness. Type: vo2max. TSS ref: 29. Duration: 30 min. Source: cycling_workouts cw28.',
   '["cycling","sub_goal:race_fitness","workout_type:vo2max","cw_ref:cw28"]',1,1746230400000,1746230400000);

INSERT OR IGNORE INTO workout_protocols (id,slug,name,sport,goal,protocol_type,description,tags_json,is_active,created_at_ms,updated_at_ms) VALUES
  ('wp-cw29','cw-flamme-rouge','Flamme Rouge · 46 min','cycling','power','interval',
   'Sub-goal: race_fitness. Type: vo2max. TSS ref: 40. Duration: 46 min. Source: cycling_workouts cw29.',
   '["cycling","sub_goal:race_fitness","workout_type:vo2max","cw_ref:cw29"]',1,1746230400000,1746230400000);

-- ---------------------------------------------------------------------------
-- workout_protocol_steps — 101 rows
-- Columns: id, protocol_id, step_order, step_type, exercise_id,
--          duration_sec, distance_m, reps, sets, rest_sec,
--          intensity_json, notes_json, created_at_ms, updated_at_ms
-- exercise_id, distance_m, reps, rest_sec: all NULL (cycling intervals)
-- intensity_json: {"power_pct_low":N,"power_pct_high":N}
-- notes_json: {"label":"..."} or {"label":"...","min_sets":N,"max_sets":N}
-- step_type rule: warmup/cooldown from label; rest for Recovery steps in
--   multi-step workouts; interval for everything else (incl. single-step).
-- ---------------------------------------------------------------------------

-- cw01: Zone 2 · 45 min (1 step)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw01-0','wp-cw01',0,'interval',NULL,2700,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);

-- cw02: Sweet Spot · 2×12 min (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw02-0','wp-cw02',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":50,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw02-1','wp-cw02',1,'interval',NULL,720,NULL,NULL,2,NULL,'{"power_pct_low":88,"power_pct_high":93}','{"label":"Sweet spot"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw02-2','wp-cw02',2,'rest',NULL,300,NULL,NULL,2,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw02-3','wp-cw02',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw03: Tempo · 30 min (3 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw03-0','wp-cw03',0,'warmup',NULL,480,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw03-1','wp-cw03',1,'interval',NULL,1800,NULL,NULL,1,NULL,'{"power_pct_low":76,"power_pct_high":90}','{"label":"Tempo"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw03-2','wp-cw03',2,'cooldown',NULL,420,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw04: Cadence Pyramid · 35 min (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw04-0','wp-cw04',0,'warmup',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw04-1','wp-cw04',1,'interval',NULL,300,NULL,NULL,5,NULL,'{"power_pct_low":60,"power_pct_high":75}','{"label":"Cadence block"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw04-2','wp-cw04',2,'rest',NULL,120,NULL,NULL,5,NULL,'{"power_pct_low":50,"power_pct_high":60}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw04-3','wp-cw04',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw05: Threshold · 2×10 min (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw05-0','wp-cw05',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw05-1','wp-cw05',1,'interval',NULL,600,NULL,NULL,2,NULL,'{"power_pct_low":95,"power_pct_high":100}','{"label":"Threshold"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw05-2','wp-cw05',2,'rest',NULL,300,NULL,NULL,2,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw05-3','wp-cw05',3,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw06: VO2max · 4×4 min (4 steps, min_sets/max_sets on main + recovery)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw06-0','wp-cw06',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw06-1','wp-cw06',1,'interval',NULL,240,NULL,NULL,4,NULL,'{"power_pct_low":106,"power_pct_high":120}','{"label":"VO2max","min_sets":2,"max_sets":6}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw06-2','wp-cw06',2,'rest',NULL,240,NULL,NULL,4,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":2,"max_sets":6}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw06-3','wp-cw06',3,'cooldown',NULL,480,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw07: Over-Unders · 3×9 min (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw07-0','wp-cw07',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw07-1','wp-cw07',1,'interval',NULL,540,NULL,NULL,3,NULL,'{"power_pct_low":88,"power_pct_high":108}','{"label":"Over-under set"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw07-2','wp-cw07',2,'rest',NULL,360,NULL,NULL,3,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw07-3','wp-cw07',3,'cooldown',NULL,420,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw08: Long Threshold · 30 min (3 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw08-0','wp-cw08',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw08-1','wp-cw08',1,'interval',NULL,1800,NULL,NULL,1,NULL,'{"power_pct_low":95,"power_pct_high":100}','{"label":"Threshold"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw08-2','wp-cw08',2,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw09: Sprint-VO2-Sprint · 3 rounds (5 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw09-0','wp-cw09',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw09-1','wp-cw09',1,'interval',NULL,30,NULL,NULL,3,NULL,'{"power_pct_low":150,"power_pct_high":200}','{"label":"Sprint"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw09-2','wp-cw09',2,'interval',NULL,180,NULL,NULL,3,NULL,'{"power_pct_low":108,"power_pct_high":120}','{"label":"VO2 effort"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw09-3','wp-cw09',3,'rest',NULL,300,NULL,NULL,3,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw09-4','wp-cw09',4,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw10: Anaerobic · 6×30 s (4 steps, min_sets/max_sets)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw10-0','wp-cw10',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw10-1','wp-cw10',1,'interval',NULL,30,NULL,NULL,6,NULL,'{"power_pct_low":130,"power_pct_high":160}','{"label":"Anaerobic","min_sets":3,"max_sets":8}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw10-2','wp-cw10',2,'rest',NULL,240,NULL,NULL,6,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":3,"max_sets":8}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw10-3','wp-cw10',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw11: Cadence Builds · 5×4 min (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw11-0','wp-cw11',0,'warmup',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw11-1','wp-cw11',1,'interval',NULL,240,NULL,NULL,5,NULL,'{"power_pct_low":60,"power_pct_high":75}','{"label":"Cadence build"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw11-2','wp-cw11',2,'rest',NULL,120,NULL,NULL,5,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw11-3','wp-cw11',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw12: Neuromuscular · 10×10 s (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw12-0','wp-cw12',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw12-1','wp-cw12',1,'interval',NULL,10,NULL,NULL,10,NULL,'{"power_pct_low":150,"power_pct_high":200}','{"label":"Sprint"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw12-2','wp-cw12',2,'rest',NULL,120,NULL,NULL,10,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw12-3','wp-cw12',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw13: Zone 2 · 45 min / aerobic_base (1 step)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw13-0','wp-cw13',0,'interval',NULL,2700,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);

-- cw14: Zone 2 · 60 min (1 step)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw14-0','wp-cw14',0,'interval',NULL,3600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);

-- cw15: Zone 2 · 90 min (1 step)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw15-0','wp-cw15',0,'interval',NULL,5400,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);

-- cw16: Recovery Spin · 30 min (1 step — full workout, not a rest period)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw16-0','wp-cw16',0,'interval',NULL,1800,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":60}','{"label":"Recovery spin"}',1746230400000,1746230400000);

-- cw17: Zone 2 · 60 min / race_fitness (1 step)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw17-0','wp-cw17',0,'interval',NULL,3600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);

-- cw18: VO2max · 5×5 min (4 steps, min_sets/max_sets)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw18-0','wp-cw18',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw18-1','wp-cw18',1,'interval',NULL,300,NULL,NULL,5,NULL,'{"power_pct_low":106,"power_pct_high":120}','{"label":"VO2max","min_sets":3,"max_sets":7}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw18-2','wp-cw18',2,'rest',NULL,300,NULL,NULL,5,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":3,"max_sets":7}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw18-3','wp-cw18',3,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw19: Zone 2 + Sprints · 60 min (3 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw19-0','wp-cw19',0,'interval',NULL,3240,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Zone 2"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw19-1','wp-cw19',1,'interval',NULL,10,NULL,NULL,6,NULL,'{"power_pct_low":130,"power_pct_high":160}','{"label":"Sprint"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw19-2','wp-cw19',2,'rest',NULL,60,NULL,NULL,6,NULL,'{"power_pct_low":50,"power_pct_high":60}','{"label":"Recovery"}',1746230400000,1746230400000);

-- cw20: Race Simulation · 60 min (3 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw20-0','wp-cw20',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw20-1','wp-cw20',1,'interval',NULL,2700,NULL,NULL,1,NULL,'{"power_pct_low":80,"power_pct_high":90}','{"label":"Race effort"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw20-2','wp-cw20',2,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw21: Ramp Test (3 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw21-0','wp-cw21',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":50,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw21-1','wp-cw21',1,'interval',NULL,60,NULL,NULL,16,NULL,'{"power_pct_low":50,"power_pct_high":130}','{"label":"Ramp step"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw21-2','wp-cw21',2,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw22: 12-min FTP Test (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw22-0','wp-cw22',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":70}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw22-1','wp-cw22',1,'interval',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":100,"power_pct_high":110}','{"label":"Pacing effort"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw22-2','wp-cw22',2,'interval',NULL,720,NULL,NULL,1,NULL,'{"power_pct_low":95,"power_pct_high":110}','{"label":"12-min all-out"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw22-3','wp-cw22',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw23: 20-min FTP Test (4 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw23-0','wp-cw23',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":70}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw23-1','wp-cw23',1,'interval',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":100,"power_pct_high":110}','{"label":"Pacing effort"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw23-2','wp-cw23',2,'interval',NULL,1200,NULL,NULL,1,NULL,'{"power_pct_low":95,"power_pct_high":105}','{"label":"20-min all-out"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw23-3','wp-cw23',3,'cooldown',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw24: VO2max Pyramid · 30 min (7 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-0','wp-cw24',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":75}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-1','wp-cw24',1,'interval',NULL,120,NULL,NULL,1,NULL,'{"power_pct_low":83,"power_pct_high":89}','{"label":"Zone 3 ramp"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-2','wp-cw24',2,'interval',NULL,120,NULL,NULL,1,NULL,'{"power_pct_low":93,"power_pct_high":99}','{"label":"Zone 4 ramp"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-3','wp-cw24',3,'interval',NULL,120,NULL,NULL,1,NULL,'{"power_pct_low":103,"power_pct_high":109}','{"label":"VO2max peak"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-4','wp-cw24',4,'interval',NULL,120,NULL,NULL,1,NULL,'{"power_pct_low":93,"power_pct_high":99}','{"label":"Zone 4 descent"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-5','wp-cw24',5,'interval',NULL,120,NULL,NULL,1,NULL,'{"power_pct_low":83,"power_pct_high":89}','{"label":"Zone 3 descent"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw24-6','wp-cw24',6,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw25: Sprint-VO2-Sprint · 30 min (5 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw25-0','wp-cw25',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw25-1','wp-cw25',1,'interval',NULL,10,NULL,NULL,4,NULL,'{"power_pct_low":160,"power_pct_high":200}','{"label":"Sprint"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw25-2','wp-cw25',2,'interval',NULL,100,NULL,NULL,2,NULL,'{"power_pct_low":120,"power_pct_high":140}','{"label":"VO2 bridge"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw25-3','wp-cw25',3,'rest',NULL,360,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Block recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw25-4','wp-cw25',4,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw26: Sprint Pyramid · 46 min (5 steps)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw26-0','wp-cw26',0,'warmup',NULL,900,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw26-1','wp-cw26',1,'interval',NULL,11,NULL,NULL,10,NULL,'{"power_pct_low":160,"power_pct_high":200}','{"label":"Sprint"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw26-2','wp-cw26',2,'rest',NULL,55,NULL,NULL,10,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Sprint recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw26-3','wp-cw26',3,'rest',NULL,300,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Pyramid recovery"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw26-4','wp-cw26',4,'cooldown',NULL,900,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw27: 40-20 s VO2max · climbing (4 steps, min_sets/max_sets)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw27-0','wp-cw27',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw27-1','wp-cw27',1,'interval',NULL,40,NULL,NULL,10,NULL,'{"power_pct_low":120,"power_pct_high":130}','{"label":"VO2max interval","min_sets":5,"max_sets":15}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw27-2','wp-cw27',2,'rest',NULL,20,NULL,NULL,10,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":5,"max_sets":15}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw27-3','wp-cw27',3,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw28: 40-20 s VO2max · race (4 steps, min_sets/max_sets)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw28-0','wp-cw28',0,'warmup',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw28-1','wp-cw28',1,'interval',NULL,40,NULL,NULL,10,NULL,'{"power_pct_low":120,"power_pct_high":130}','{"label":"VO2max interval","min_sets":5,"max_sets":15}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw28-2','wp-cw28',2,'rest',NULL,20,NULL,NULL,10,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":5,"max_sets":15}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw28-3','wp-cw28',3,'cooldown',NULL,600,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- cw29: Flamme Rouge · 46 min (6 steps, min_sets/max_sets on main blocks)
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-0','wp-cw29',0,'warmup',NULL,900,NULL,NULL,1,NULL,'{"power_pct_low":55,"power_pct_high":65}','{"label":"Warm-up"}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-1','wp-cw29',1,'interval',NULL,30,NULL,NULL,12,NULL,'{"power_pct_low":90,"power_pct_high":100}','{"label":"Threshold","min_sets":6,"max_sets":18}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-2','wp-cw29',2,'interval',NULL,20,NULL,NULL,12,NULL,'{"power_pct_low":103,"power_pct_high":109}','{"label":"VO2max surge","min_sets":6,"max_sets":18}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-3','wp-cw29',3,'interval',NULL,10,NULL,NULL,12,NULL,'{"power_pct_low":130,"power_pct_high":150}','{"label":"Sprint","min_sets":6,"max_sets":18}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-4','wp-cw29',4,'rest',NULL,20,NULL,NULL,12,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Recovery","min_sets":6,"max_sets":18}',1746230400000,1746230400000);
INSERT OR IGNORE INTO workout_protocol_steps (id,protocol_id,step_order,step_type,exercise_id,duration_sec,distance_m,reps,sets,rest_sec,intensity_json,notes_json,created_at_ms,updated_at_ms) VALUES
  ('wps-cw29-5','wp-cw29',5,'cooldown',NULL,900,NULL,NULL,1,NULL,'{"power_pct_low":45,"power_pct_high":55}','{"label":"Cool-down"}',1746230400000,1746230400000);

-- 0036: Add TSS (Training Stress Score) load provenance columns to executions
-- Phase 1 of Cycling Coach overhaul — load capture foundation for PMC (Phase 2).
--
-- tss_planned : TSS computed at plan generation from interval structure + user FTP
-- tss_actual  : TSS after session; RPE-adjusted or Strava power-derived (Phase 5)
-- tss_source  : provenance — one of:
--               'planned'          (no actual yet; used when execution not yet done)
--               'rpe_estimated'    (tss_actual = tss_planned × RPE modifier)
--               'power_actual'     (future: direct power meter data)
--               'strava_power'     (Phase 5: Strava weighted avg watts)
--               'strava_estimated' (Phase 5: Strava duration × moderate IF estimate)
--
-- All three columns are nullable. Non-cycling executions will remain NULL.

ALTER TABLE executions ADD COLUMN tss_planned REAL;
ALTER TABLE executions ADD COLUMN tss_actual  REAL;
ALTER TABLE executions ADD COLUMN tss_source  TEXT;

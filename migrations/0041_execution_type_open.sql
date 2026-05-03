-- Migration 0041: Remove restrictive execution_type CHECK constraint
--
-- The original CHECK only allowed: workout, bike, run, walk, mobility, recovery, mixed
-- This silently blocked ALL Strava imports (strava_run, strava_ride, etc.) and app types
-- added later (cycling_coach, bonus, cycling_cross_run, run_coach, etc.).
-- Every failed insert was caught and counted as skipped, so sync returned ok:true/imported:0.
--
-- Fix: recreate the table without the execution_type CHECK, preserving all other constraints.

PRAGMA foreign_keys=OFF;

CREATE TABLE executions_new (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL,
  date                    TEXT,
  day_plan_id             TEXT,
  session_template_id     TEXT,
  execution_type          TEXT NOT NULL DEFAULT 'workout',
  status                  TEXT NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('planned','in_progress','completed','abandoned')),
  started_at_ms           INTEGER,
  ended_at_ms             INTEGER,
  total_duration_sec      INTEGER CHECK (total_duration_sec IS NULL OR total_duration_sec >= 0),
  total_distance_m        REAL    CHECK (total_distance_m  IS NULL OR total_distance_m  >= 0),
  total_energy_kcal       REAL    CHECK (total_energy_kcal IS NULL OR total_energy_kcal >= 0),
  avg_hr_bpm              REAL    CHECK (avg_hr_bpm        IS NULL OR avg_hr_bpm        >= 0),
  perceived_exertion      INTEGER CHECK (perceived_exertion IS NULL OR
                                         (perceived_exertion >= 1 AND perceived_exertion <= 10)),
  notes                   TEXT,
  execution_json          TEXT,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,
  tss_planned             REAL,
  tss_actual              REAL,
  tss_source              TEXT,
  strava_activity_id      INTEGER,
  strava_metadata_json    TEXT,
  CHECK (execution_json IS NULL OR json_valid(execution_json))
) STRICT;

INSERT INTO executions_new SELECT * FROM executions;

DROP TABLE executions;

ALTER TABLE executions_new RENAME TO executions;

CREATE INDEX idx_executions_user_date
  ON executions(user_id, date);

CREATE INDEX idx_executions_user_started
  ON executions(user_id, started_at_ms);

CREATE UNIQUE INDEX idx_executions_strava
  ON executions(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

PRAGMA foreign_keys=ON;

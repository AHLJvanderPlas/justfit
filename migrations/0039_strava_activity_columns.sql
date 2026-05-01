-- Migration 0039: Strava activity tracking on executions
-- strava_activity_id  — Strava's numeric activity ID, used for deduplication
-- strava_metadata_json — name, type, distance, elevation etc. for history display

ALTER TABLE executions ADD COLUMN strava_activity_id INTEGER;
ALTER TABLE executions ADD COLUMN strava_metadata_json TEXT;

-- Partial unique index: one import per (user, strava activity)
CREATE UNIQUE INDEX idx_executions_strava
  ON executions(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

-- Migration 0099: Strava integration rework for the 2026 API Policy
--
-- Effective 2026-06-01 the Strava API Policy tightened materially. This migration
-- carries the schema half of the rework; see functions/api/_shared/strava.js.
--
--  1. scope_granted     — §7.2 requires acting on the scopes the athlete actually
--                         granted, not the ones we asked for. The token response
--                         has returned a `scope` field since 2026-04-23.
--  2. push_enabled      — opt-in for writing JustFit sessions back to Strava
--                         (activity:write). Separate consent from read access.
--  3. metadata_expires_at_ms
--                       — §6.2 caps the Strava cache at seven days. The raw
--                         payload in executions.strava_metadata_json is purged
--                         at this timestamp; the derived JustFit training record
--                         (duration, tss) survives as our own data.
--  4. strava_upload_*   — dedupe for outbound uploads so a session is never
--                         pushed to Strava twice.

ALTER TABLE strava_connections ADD COLUMN scope_granted TEXT;
ALTER TABLE strava_connections ADD COLUMN push_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE strava_connections ADD COLUMN last_push_at_ms INTEGER;

ALTER TABLE executions ADD COLUMN strava_metadata_expires_at_ms INTEGER;
ALTER TABLE executions ADD COLUMN strava_upload_activity_id INTEGER;
ALTER TABLE executions ADD COLUMN strava_upload_at_ms INTEGER;

-- Retention sweep: find rows whose cached Strava payload is past its seven-day life.
CREATE INDEX IF NOT EXISTS idx_executions_strava_expiry
  ON executions(strava_metadata_expires_at_ms)
  WHERE strava_metadata_expires_at_ms IS NOT NULL;

-- Backfill: existing imports are already past the seven-day window, so mark them
-- for purge on the next sweep rather than leaving them to live forever.
UPDATE executions
   SET strava_metadata_expires_at_ms = 0
 WHERE strava_metadata_json IS NOT NULL
   AND strava_metadata_expires_at_ms IS NULL;

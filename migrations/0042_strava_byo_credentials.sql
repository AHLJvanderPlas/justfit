-- Migration 0042: Dedicated table for BYO Strava credentials
--
-- BYO (Bring Your Own) Strava app credentials were previously stored inside
-- user_preferences.preferences_json, increasing the risk of accidental leakage
-- through profile/export/debug paths and leaving credentials behind after disconnect.
--
-- Fix: move client_id/client_secret to a dedicated table so:
--  1. They are never returned by /api/profile
--  2. DELETE /api/strava-auth removes them alongside the connection row
--  3. The profile export payload never touches them

CREATE TABLE strava_byo_credentials (
  user_id       TEXT NOT NULL PRIMARY KEY,
  client_id     TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

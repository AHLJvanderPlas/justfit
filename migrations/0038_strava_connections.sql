-- Migration 0038: Strava OAuth connections
-- Stores per-user Strava access/refresh tokens and connection metadata.
-- One row per user (UNIQUE on user_id). Tokens are refreshed in-place.

CREATE TABLE strava_connections (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id),
  athlete_id        INTEGER NOT NULL,
  access_token      TEXT NOT NULL,
  refresh_token     TEXT NOT NULL,
  expires_at_ms     INTEGER NOT NULL,
  scope             TEXT,
  athlete_name      TEXT,
  athlete_city      TEXT,
  athlete_pic_url   TEXT,
  connected_at_ms   INTEGER NOT NULL,
  last_sync_at_ms   INTEGER,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX idx_strava_connections_user ON strava_connections(user_id);

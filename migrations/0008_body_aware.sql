-- Migration 0008: Body-Aware Training
-- Adds sex/weight to user_profile, cycle tracking tables

ALTER TABLE user_profile ADD COLUMN sex TEXT CHECK (sex IN ('male','female','non_binary','prefer_not_to_say'));
ALTER TABLE user_profile ADD COLUMN weight_kg REAL CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 300));

CREATE TABLE IF NOT EXISTS cycle_profile (
  user_id             TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tracking_mode       TEXT NOT NULL DEFAULT 'smart'
                        CHECK (tracking_mode IN ('smart','simple','off')),
  cycle_length_days   INTEGER DEFAULT 28
                        CHECK (cycle_length_days IS NULL OR (cycle_length_days >= 21 AND cycle_length_days <= 45)),
  last_period_start   TEXT,  -- YYYY-MM-DD
  created_at_ms       INTEGER NOT NULL,
  updated_at_ms       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS period_log (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_on    TEXT NOT NULL,  -- YYYY-MM-DD
  noted_at_ms   INTEGER NOT NULL,
  source        TEXT DEFAULT 'checkin'  -- 'checkin' or 'manual'
);
CREATE INDEX IF NOT EXISTS idx_period_log_user ON period_log(user_id, started_on);

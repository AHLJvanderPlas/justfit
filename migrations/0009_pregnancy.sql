-- Migration 0009: Pregnancy & Postnatal Mode
-- Extends cycle_profile with pregnancy/postnatal tracking fields
-- Creates pregnancy_weekly_log table

ALTER TABLE cycle_profile ADD COLUMN mode TEXT NOT NULL DEFAULT 'standard'
  CHECK (mode IN ('standard','pregnant','postnatal'));
ALTER TABLE cycle_profile ADD COLUMN pregnancy_due_date TEXT;
ALTER TABLE cycle_profile ADD COLUMN pregnancy_confirmed_at_ms INTEGER;
ALTER TABLE cycle_profile ADD COLUMN medical_clearance_confirmed INTEGER DEFAULT 0;
ALTER TABLE cycle_profile ADD COLUMN postnatal_birth_date TEXT;
ALTER TABLE cycle_profile ADD COLUMN postnatal_birth_type TEXT
  CHECK (postnatal_birth_type IN ('vaginal','caesarean','prefer_not_to_say'));
ALTER TABLE cycle_profile ADD COLUMN postnatal_cleared_for_exercise INTEGER DEFAULT 0;
ALTER TABLE cycle_profile ADD COLUMN postnatal_clearance_date TEXT;

CREATE TABLE IF NOT EXISTS pregnancy_weekly_log (
  id              TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,
  week_start_date TEXT NOT NULL,
  avg_energy      REAL,
  avg_nausea      REAL,
  avg_breathless  REAL,
  sessions_done   INTEGER DEFAULT 0,
  notes           TEXT,
  created_at_ms   INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pwl_user ON pregnancy_weekly_log(user_id, week_number);

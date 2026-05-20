-- Migration 0057: Trainer Portal tables
-- All tables for trainer.justfit.cc back-office

CREATE TABLE trainers (
  id                    TEXT PRIMARY KEY,
  email                 TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  studio_name           TEXT,
  bio                   TEXT,
  certifications        TEXT,
  country               TEXT DEFAULT 'NL',
  website               TEXT,
  profile_photo_key     TEXT,
  trainer_token         TEXT UNIQUE,
  status                TEXT DEFAULT 'pending',   -- pending | active | suspended
  plan                  TEXT DEFAULT 'starter',   -- starter | pro | studio
  invoice_prefix        TEXT DEFAULT 'PT',
  invoice_currency      TEXT DEFAULT 'EUR',
  invoice_vat_rate      REAL DEFAULT 0.21,
  invoice_iban          TEXT,
  invoice_business_name TEXT,
  invoice_address       TEXT,
  invoice_vat_number    TEXT,
  notify_new_client     INTEGER DEFAULT 1,
  notify_inactive       INTEGER DEFAULT 1,
  notify_weekly_summary INTEGER DEFAULT 1,
  approved_at_ms        INTEGER,
  approved_by           TEXT,
  created_at_ms         INTEGER NOT NULL,
  updated_at_ms         INTEGER NOT NULL
) STRICT;

CREATE TABLE trainer_auth (
  id              TEXT PRIMARY KEY,
  trainer_id      TEXT NOT NULL REFERENCES trainers(id),
  password_hash   TEXT,
  last_login_at_ms INTEGER,
  created_at_ms   INTEGER NOT NULL
) STRICT;

CREATE TABLE trainer_magic_tokens (
  id             TEXT PRIMARY KEY,
  trainer_id     TEXT NOT NULL REFERENCES trainers(id),
  token_hash     TEXT UNIQUE NOT NULL,
  expires_at_ms  INTEGER NOT NULL,
  consumed_at_ms INTEGER,
  created_at_ms  INTEGER NOT NULL
) STRICT;

-- Trainer sessions tracked in DB (JWT still used as transport)
CREATE TABLE trainer_sessions (
  id                   TEXT PRIMARY KEY,
  trainer_id           TEXT NOT NULL REFERENCES trainers(id),
  created_at_ms        INTEGER NOT NULL,
  last_accessed_at_ms  INTEGER NOT NULL,
  expires_at_ms        INTEGER NOT NULL,
  ip                   TEXT,
  user_agent           TEXT
) STRICT;

CREATE TABLE trainer_connections (
  id                  TEXT PRIMARY KEY,
  trainer_id          TEXT NOT NULL REFERENCES trainers(id),
  user_id             TEXT NOT NULL REFERENCES users(id),
  connected_at_ms     INTEGER NOT NULL,
  disconnected_at_ms  INTEGER,
  status              TEXT DEFAULT 'active',   -- active | disconnected
  UNIQUE(trainer_id, user_id)
) STRICT;

CREATE INDEX idx_tc_trainer ON trainer_connections(trainer_id) WHERE status = 'active';
CREATE INDEX idx_tc_user    ON trainer_connections(user_id)    WHERE status = 'active';

CREATE TABLE trainer_user_settings (
  id                  TEXT PRIMARY KEY,
  trainer_id          TEXT NOT NULL REFERENCES trainers(id),
  user_id             TEXT NOT NULL REFERENCES users(id),
  goal_override       TEXT,
  intensity_modifier  INTEGER DEFAULT 0,
  training_days_json  TEXT,
  note_to_client      TEXT,
  note_updated_at_ms  INTEGER,
  updated_at_ms       INTEGER NOT NULL,
  UNIQUE(trainer_id, user_id)
) STRICT;

CREATE TABLE trainer_workouts (
  id                    TEXT PRIMARY KEY,
  trainer_id            TEXT NOT NULL REFERENCES trainers(id),
  name                  TEXT NOT NULL,
  goal_tag              TEXT,          -- strength | cardio | mobility | recovery | mixed
  difficulty            TEXT,          -- beginner | intermediate | advanced
  exercises_json        TEXT NOT NULL, -- [{exercise_id, sets, reps, duration_sec, rest_sec, note}]
  estimated_duration_min INTEGER,
  is_active             INTEGER DEFAULT 1,
  created_at_ms         INTEGER NOT NULL,
  updated_at_ms         INTEGER NOT NULL
) STRICT;

CREATE TABLE trainer_schedules (
  id            TEXT PRIMARY KEY,
  trainer_id    TEXT NOT NULL REFERENCES trainers(id),
  user_id       TEXT,          -- NULL = group assignment
  group_id      TEXT,          -- NULL = individual
  day_of_week   TEXT,          -- mon | tue | wed | thu | fri | sat | sun
  session_type  TEXT,          -- rest | trainer_workout | ai_generated | goal_session
  workout_id    TEXT REFERENCES trainer_workouts(id),
  start_date    TEXT,          -- YYYY-MM-DD
  end_date      TEXT,          -- NULL = indefinite
  is_active     INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_ts_trainer ON trainer_schedules(trainer_id, is_active);
CREATE INDEX idx_ts_user    ON trainer_schedules(user_id, is_active) WHERE user_id IS NOT NULL;

CREATE TABLE trainer_groups (
  id            TEXT PRIMARY KEY,
  trainer_id    TEXT NOT NULL REFERENCES trainers(id),
  name          TEXT NOT NULL,
  description   TEXT,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE trainer_group_members (
  group_id    TEXT NOT NULL REFERENCES trainer_groups(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  added_at_ms INTEGER NOT NULL,
  PRIMARY KEY (group_id, user_id)
) STRICT;

CREATE TABLE trainer_invoices (
  id             TEXT PRIMARY KEY,
  trainer_id     TEXT NOT NULL REFERENCES trainers(id),
  user_id        TEXT NOT NULL REFERENCES users(id),
  invoice_number TEXT NOT NULL,
  status         TEXT DEFAULT 'draft',   -- draft | sent | paid | overdue | void
  invoice_date   TEXT NOT NULL,          -- YYYY-MM-DD
  due_date       TEXT,                   -- YYYY-MM-DD
  currency       TEXT DEFAULT 'EUR',
  lines_json     TEXT NOT NULL,          -- [{description, quantity, unit_price, vat_rate, line_total}]
  subtotal       REAL NOT NULL,
  vat_amount     REAL NOT NULL,
  total          REAL NOT NULL,
  notes          TEXT,
  pdf_key        TEXT,
  sent_at_ms     INTEGER,
  paid_at_ms     INTEGER,
  voided_at_ms   INTEGER,
  created_at_ms  INTEGER NOT NULL,
  updated_at_ms  INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_ti_trainer ON trainer_invoices(trainer_id, status);
CREATE INDEX idx_ti_user    ON trainer_invoices(user_id);

-- User-side trainer connection (read from justfit.cc user app)
-- Functions for /api/connect/trainer in the main app read trainer_connections
-- No extra table needed — reuses trainer_connections + trainer_user_settings

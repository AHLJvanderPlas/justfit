-- Migration 0119: rebuild cycle_profile, period_log, pregnancy_weekly_log as STRICT
-- (post-remediation assessment F6)
--
-- cycle_profile holds pregnancy and postnatal mode — the inputs to R530–R544, the
-- engine's hardest safety rules. It was not a STRICT table, so a mistyped write
-- (a string in pregnancy_confirmed_at_ms, a float in a 0/1 clearance flag) was
-- accepted silently and read back wrong. period_log and pregnancy_weekly_log are
-- written by the same consumer flows and had the same gap. STRICT makes D1 reject
-- a wrong-typed value at write time. SQLite cannot add STRICT in place, so each
-- table is rebuilt, following migration 0100's pattern: create new, copy, assert
-- the counts agree, drop, rename, recreate the index.
--
-- Every column, CHECK, default and index is unchanged; the only difference is
-- ") STRICT". Column definitions below are the live sqlite_master text of
-- 2026-10-04, not the historical migrations (which have since diverged by ALTER).
--
-- Measured on live D1 2026-10-04 before writing this:
--   cycle_profile         15 rows   (13 standard/off, 2 standard/smart)
--   period_log             2 rows
--   pregnancy_weekly_log   0 rows
--   typeof() check of every column against its declared STRICT type: 0 offending
--   rows in all 29 columns, so the copy cannot be rejected by the new typing.
--   No table, view or trigger references any of the three (PRAGMA foreign_key_list
--   over sqlite_master: the only FKs are these tables -> users), so the DROP
--   cascades nowhere. The assertion below compares the copy with the source at
--   run time (not a hardcoded count), so a row written between measurement and
--   release does not make the migration fail spuriously.
--
-- Row-count assertion: _assert_rowcount has a CHECK that only a TRUE comparison
-- satisfies. If the copy lost or gained a row the INSERT violates the CHECK, the
-- file stops there with a constraint error, and the DROP TABLE that follows never
-- runs. The helper table is dropped at the end.
--
-- Release: node scripts/migrate.mjs apply migrations/0119_strict_cycle_tables.sql
-- (no flags: the copy INSERTs write rows, so the zero-row check passes when the
-- tables are non-empty — and the assertion inserts always write at least one row).

CREATE TABLE _assert_rowcount (
  label TEXT    NOT NULL,
  ok    INTEGER NOT NULL CHECK (ok = 1)
) STRICT;

-- ── cycle_profile ────────────────────────────────────────────────────────────

CREATE TABLE cycle_profile_new (
  user_id                       TEXT    PRIMARY KEY
                                  REFERENCES users(id) ON DELETE CASCADE,
  tracking_mode                 TEXT    NOT NULL DEFAULT 'smart'
                                  CHECK (tracking_mode IN ('smart','simple','off')),
  cycle_length_days             INTEGER DEFAULT 28
                                  CHECK (cycle_length_days IS NULL OR
                                        (cycle_length_days >= 21 AND cycle_length_days <= 45)),
  last_period_start             TEXT,
  created_at_ms                 INTEGER NOT NULL,
  updated_at_ms                 INTEGER NOT NULL,
  -- Body mode (migration 0009 + 0056)
  mode                          TEXT    NOT NULL DEFAULT 'standard'
                                  CHECK (mode IN ('standard','pregnant','postnatal','perimenopause')),
  -- Pregnancy
  pregnancy_due_date            TEXT,
  pregnancy_confirmed_at_ms     INTEGER,
  medical_clearance_confirmed   INTEGER DEFAULT 0,
  -- Postnatal
  postnatal_birth_date          TEXT,
  postnatal_birth_type          TEXT
                                  CHECK (postnatal_birth_type IN
                                        ('vaginal','caesarean','prefer_not_to_say')),
  postnatal_cleared_for_exercise INTEGER DEFAULT 0,
  postnatal_clearance_date      TEXT
) STRICT;

INSERT INTO cycle_profile_new
  (user_id, tracking_mode, cycle_length_days, last_period_start, created_at_ms, updated_at_ms,
   mode, pregnancy_due_date, pregnancy_confirmed_at_ms, medical_clearance_confirmed,
   postnatal_birth_date, postnatal_birth_type, postnatal_cleared_for_exercise, postnatal_clearance_date)
SELECT
   user_id, tracking_mode, cycle_length_days, last_period_start, created_at_ms, updated_at_ms,
   mode, pregnancy_due_date, pregnancy_confirmed_at_ms, medical_clearance_confirmed,
   postnatal_birth_date, postnatal_birth_type, postnatal_cleared_for_exercise, postnatal_clearance_date
  FROM cycle_profile;

INSERT INTO _assert_rowcount (label, ok)
SELECT 'cycle_profile', (SELECT COUNT(*) FROM cycle_profile_new) = (SELECT COUNT(*) FROM cycle_profile);

DROP TABLE cycle_profile;
ALTER TABLE cycle_profile_new RENAME TO cycle_profile;

-- ── period_log ───────────────────────────────────────────────────────────────

CREATE TABLE period_log_new (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, started_on TEXT NOT NULL, noted_at_ms INTEGER NOT NULL, source TEXT DEFAULT 'checkin') STRICT;

INSERT INTO period_log_new (id, user_id, started_on, noted_at_ms, source)
SELECT id, user_id, started_on, noted_at_ms, source FROM period_log;

INSERT INTO _assert_rowcount (label, ok)
SELECT 'period_log', (SELECT COUNT(*) FROM period_log_new) = (SELECT COUNT(*) FROM period_log);

DROP TABLE period_log;
ALTER TABLE period_log_new RENAME TO period_log;
CREATE INDEX idx_period_log_user ON period_log(user_id, started_on);

-- ── pregnancy_weekly_log ─────────────────────────────────────────────────────

CREATE TABLE pregnancy_weekly_log_new (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, week_number INTEGER NOT NULL, week_start_date TEXT NOT NULL, avg_energy REAL, avg_nausea REAL, avg_breathless REAL, sessions_done INTEGER DEFAULT 0, notes TEXT, created_at_ms INTEGER NOT NULL) STRICT;

INSERT INTO pregnancy_weekly_log_new
  (id, user_id, week_number, week_start_date, avg_energy, avg_nausea, avg_breathless, sessions_done, notes, created_at_ms)
SELECT id, user_id, week_number, week_start_date, avg_energy, avg_nausea, avg_breathless, sessions_done, notes, created_at_ms
  FROM pregnancy_weekly_log;

INSERT INTO _assert_rowcount (label, ok)
SELECT 'pregnancy_weekly_log', (SELECT COUNT(*) FROM pregnancy_weekly_log_new) = (SELECT COUNT(*) FROM pregnancy_weekly_log);

DROP TABLE pregnancy_weekly_log;
ALTER TABLE pregnancy_weekly_log_new RENAME TO pregnancy_weekly_log;
CREATE INDEX idx_pwl_user ON pregnancy_weekly_log(user_id, week_number);

DROP TABLE _assert_rowcount;

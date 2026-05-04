-- 0056: Add 'perimenopause' to cycle_profile.mode CHECK constraint.
-- SQLite cannot DROP or ALTER a CHECK constraint; use the table-rename pattern.
-- No other tables reference cycle_profile (FK is only FROM cycle_profile TO users),
-- so the rename + recreate + copy + drop sequence is safe.

ALTER TABLE cycle_profile RENAME TO cycle_profile_old;

CREATE TABLE cycle_profile (
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
);

INSERT INTO cycle_profile SELECT * FROM cycle_profile_old;

DROP TABLE cycle_profile_old;

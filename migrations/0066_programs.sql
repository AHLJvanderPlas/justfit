-- Migration 0066: program model (P1E)
-- programs, program_sessions, program_assignments, assigned_sessions
-- Adds trainer fields to executions. Marks trainer_schedules migrated.

CREATE TABLE programs (
  id                    TEXT PRIMARY KEY,
  gym_id                TEXT NOT NULL REFERENCES gyms(id),
  created_by_user_id    TEXT NOT NULL,
  name                  TEXT NOT NULL,
  description           TEXT,
  goal                  TEXT,
  duration_weeks        INTEGER NOT NULL DEFAULT 4,
  sessions_per_week     INTEGER NOT NULL DEFAULT 3,
  phase_structure_json  TEXT,   -- [{week_start, week_end, name, intensity_range, volume_target}]
  rule_constraints_json TEXT,   -- {substitution_policy, missed_session_policy, weekly_checks}
  equipment_scope_json  TEXT,   -- {items: string[]} what equipment clients need
  is_template           INTEGER NOT NULL DEFAULT 1,  -- 1=template, 0=instance
  visibility            TEXT NOT NULL DEFAULT 'private'
                          CHECK (visibility IN ('private','gym','marketplace')),
  created_at_ms         INTEGER NOT NULL,
  updated_at_ms         INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_prog_gym      ON programs(gym_id, is_template);
CREATE INDEX idx_prog_creator  ON programs(created_by_user_id);

CREATE TABLE program_sessions (
  id              TEXT PRIMARY KEY,
  program_id      TEXT NOT NULL REFERENCES programs(id),
  week_number     INTEGER NOT NULL,
  day_in_week     INTEGER NOT NULL,  -- 1=Mon ... 7=Sun
  name            TEXT,
  structure_json  TEXT NOT NULL,     -- {blocks: [{type, name, exercises: [{exercise_id, exercise_source, sets, reps, duration_sec, rest_sec, notes, lock_flag, sub_pool_json}]}]}
  order_in_day    INTEGER NOT NULL DEFAULT 0,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_ps_program ON program_sessions(program_id, week_number, day_in_week);

CREATE TABLE program_assignments (
  id                    TEXT PRIMARY KEY,
  program_id            TEXT NOT NULL REFERENCES programs(id),
  client_user_id        TEXT NOT NULL REFERENCES users(id),
  assigned_by_trainer_id TEXT NOT NULL,
  gym_id                TEXT NOT NULL REFERENCES gyms(id),
  start_date            TEXT NOT NULL,  -- YYYY-MM-DD
  end_date              TEXT,
  status                TEXT NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','paused','cancelled','completed')),
  customizations_json   TEXT,           -- per-client overrides
  adherence_pct         REAL NOT NULL DEFAULT 0,
  created_at_ms         INTEGER NOT NULL,
  updated_at_ms         INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_pa_client  ON program_assignments(client_user_id, status);
CREATE INDEX idx_pa_gym     ON program_assignments(gym_id, status);
CREATE INDEX idx_pa_trainer ON program_assignments(assigned_by_trainer_id);

CREATE TABLE assigned_sessions (
  id                        TEXT PRIMARY KEY,
  program_assignment_id     TEXT NOT NULL REFERENCES program_assignments(id),
  scheduled_date            TEXT NOT NULL,   -- YYYY-MM-DD
  session_template_id       TEXT REFERENCES program_sessions(id),
  status                    TEXT NOT NULL DEFAULT 'scheduled'
                              CHECK (status IN ('scheduled','completed','skipped','shifted')),
  executed_session_id       TEXT,            -- FK executions.id (set on completion)
  trainer_notes             TEXT,
  created_at_ms             INTEGER NOT NULL,
  updated_at_ms             INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_as_assignment ON assigned_sessions(program_assignment_id);
CREATE INDEX idx_as_date       ON assigned_sessions(scheduled_date);
CREATE INDEX idx_as_client     ON assigned_sessions(program_assignment_id, scheduled_date);

-- Extend executions with trainer/program fields
ALTER TABLE executions ADD COLUMN program_assignment_id  TEXT;
ALTER TABLE executions ADD COLUMN assigned_by_trainer_id TEXT;
ALTER TABLE executions ADD COLUMN trainer_notes          TEXT;
ALTER TABLE executions ADD COLUMN client_rpe             INTEGER;
ALTER TABLE executions ADD COLUMN client_feedback        TEXT;

-- Mark existing trainer_schedules as migrated (soft-deprecated)
ALTER TABLE trainer_schedules ADD COLUMN migrated_at_ms INTEGER;

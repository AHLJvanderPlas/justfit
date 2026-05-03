-- 0043: Training model foundation — exercise aliases, workout protocols, program templates
--
-- Additive only. No existing tables or data are modified.
-- Enables a shared exercise library and structured scheduling layer for all coaches.
--
-- New tables:
--   exercise_aliases        — canonical exercise ↔ naming variant mapping
--   workout_protocols       — structured interval/circuit sessions (sport-agnostic)
--   workout_protocol_steps  — ordered steps within a protocol
--   program_templates       — multi-week program schedule templates per coach type
--   program_template_items  — scheduled items (exercise or protocol) within a program

-- ---------------------------------------------------------------------------
-- exercise_aliases
-- Maps alternate names / spelling variants to canonical exercises.
-- Source: defensie-exercise-catalogue consolidations, Dutch name variants, etc.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exercise_aliases (
  id            TEXT    PRIMARY KEY,          -- uuid
  exercise_id   TEXT    NOT NULL,
  alias         TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(alias) BETWEEN 1 AND 256)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_exercise_id
  ON exercise_aliases (exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_alias
  ON exercise_aliases (alias);

-- ---------------------------------------------------------------------------
-- workout_protocols
-- A protocol is a single structured session: an interval run, a circuit,
-- a test, etc. Replaces ad-hoc template_json blobs for named, reusable sessions.
-- Note: cycling_workouts is the sport-specific precursor for cycling only;
--       workout_protocols is the sport-agnostic generalisation for future use.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_protocols (
  id            TEXT    PRIMARY KEY,          -- uuid
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  sport         TEXT    NOT NULL DEFAULT 'general'
                  CHECK (sport IN ('general','military','running','cycling','any')),
  goal          TEXT    CHECK (goal IN ('endurance','strength','power','speed','recovery','test','mixed')),
  protocol_type TEXT    NOT NULL
                  CHECK (protocol_type IN ('interval','steady_state','circuit','test','amrap','emom','tabata','other')),
  description   TEXT,
  tags_json     TEXT,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (tags_json IS NULL OR json_valid(tags_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- workout_protocol_steps
-- Ordered steps within a workout_protocol.
-- exercise_id is nullable — steps can be pure intervals (no DB exercise ref).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workout_protocol_steps (
  id            TEXT    PRIMARY KEY,          -- uuid
  protocol_id   TEXT    NOT NULL,
  step_order    INTEGER NOT NULL CHECK (step_order >= 0),
  step_type     TEXT    NOT NULL
                  CHECK (step_type IN ('exercise','interval','rest','note','warmup','cooldown')),
  exercise_id   TEXT,                         -- nullable: FK to exercises
  duration_sec  INTEGER CHECK (duration_sec IS NULL OR duration_sec > 0),
  distance_m    REAL    CHECK (distance_m IS NULL OR distance_m > 0),
  reps          INTEGER CHECK (reps IS NULL OR reps > 0),
  sets          INTEGER CHECK (sets IS NULL OR sets > 0),
  rest_sec      INTEGER CHECK (rest_sec IS NULL OR rest_sec >= 0),
  intensity_json TEXT,                        -- JSON: {zone, power_pct, hr_pct, pace_per_km}
  notes_json    TEXT,                         -- JSON: cues, coach instructions

  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (protocol_id)  REFERENCES workout_protocols(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (exercise_id)  REFERENCES exercises(id)        ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (intensity_json IS NULL OR json_valid(intensity_json)),
  CHECK (notes_json     IS NULL OR json_valid(notes_json))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_workout_protocol_steps_protocol
  ON workout_protocol_steps (protocol_id, step_order);

-- ---------------------------------------------------------------------------
-- program_templates
-- A multi-week structured programme (e.g., Defensie Cluster 1, 5K plan).
-- block_length is the number of weeks in one repeating training block.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_templates (
  id            TEXT    PRIMARY KEY,          -- uuid
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  coach_type    TEXT    NOT NULL
                  CHECK (coach_type IN ('general','military','running','cycling')),
  sport         TEXT    NOT NULL DEFAULT 'general'
                  CHECK (sport IN ('general','military','running','cycling','any')),
  level         TEXT    CHECK (level IN ('beginner','intermediate','advanced')),
  block_length  INTEGER NOT NULL DEFAULT 4    -- weeks in one training block
                  CHECK (block_length >= 1 AND block_length <= 52),
  metadata_json TEXT,                         -- JSON: {description, goals, equipment, source}
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (metadata_json IS NULL OR json_valid(metadata_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- program_template_items
-- One row per scheduled item within a program template.
-- item_type drives which FK is populated (exercise_id XOR protocol_id).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS program_template_items (
  id                  TEXT    PRIMARY KEY,    -- uuid
  program_template_id TEXT    NOT NULL,
  block_week          INTEGER NOT NULL CHECK (block_week >= 1),
  day_index           INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 6), -- 0=Mon … 6=Sun
  session_order       INTEGER NOT NULL DEFAULT 1 CHECK (session_order >= 1),
  item_type           TEXT    NOT NULL CHECK (item_type IN ('exercise','protocol')),
  exercise_id         TEXT,                   -- populated when item_type = 'exercise'
  protocol_id         TEXT,                   -- populated when item_type = 'protocol'
  notes_json          TEXT,                   -- JSON: coach guidance, load overrides

  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (program_template_id) REFERENCES program_templates(id)     ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (exercise_id)         REFERENCES exercises(id)              ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (protocol_id)         REFERENCES workout_protocols(id)      ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (notes_json IS NULL OR json_valid(notes_json)),
  -- Enforce XOR: exactly one of exercise_id / protocol_id must be set per item_type
  CHECK (
    (item_type = 'exercise' AND exercise_id IS NOT NULL AND protocol_id IS NULL) OR
    (item_type = 'protocol' AND protocol_id IS NOT NULL AND exercise_id IS NULL)
  )
) STRICT;

CREATE INDEX IF NOT EXISTS idx_program_template_items_template
  ON program_template_items (program_template_id, block_week, day_index, session_order);

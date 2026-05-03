-- =============================================================================
-- JustFit — Training Schema Baseline
-- File: migrations/baseline/1010_schema_training.sql
--
-- Bootstrap order: run BEFORE 1000_schema_core.sql
-- (execution_steps.exercise_id references exercises defined here)
--
-- Covers (merged final state):
--   exercises              — atomic movements; reused by all coaches
--   cycling_workouts       — structured cycling sessions (sport-specific)
--   exercise_aliases       — canonical name variants (migration 0043 + 0044)
--   workout_protocols      — sport-agnostic structured sessions (migration 0043)
--   workout_protocol_steps — ordered steps within a protocol (migration 0043)
--   program_templates      — multi-week programme schedules (migration 0043)
--   program_template_items — scheduled items within a programme (migration 0043)
--
-- Derives from migrations: 0001 (exercises initial), 0035 (cycling_workouts),
--   0043 (training model foundation), 0044 (alias uniqueness)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- exercises
-- Atomic movements and fitness tests. Shared by all coaches and the planner.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercises (
  id                      TEXT    PRIMARY KEY,
  slug                    TEXT    NOT NULL,
  name                    TEXT    NOT NULL,
  category                TEXT    CHECK (category IN ('strength','cardio','mobility','recovery','skill','mixed')),
  primary_muscles_json    TEXT,   -- JSON array of canonical muscle keys (e.g. ["quads","glutes"])
  secondary_muscles_json  TEXT,   -- JSON array; empty [] for cardio/recovery by design
  tags_json               TEXT,   -- JSON array: bodyweight, military, high_impact, supine, etc.
  equipment_required_json TEXT,   -- JSON array: ["none"] | ["dumbbell"] | ["barbell"] | ...
  equipment_advised_json  TEXT,   -- optional advisory equipment
  instructions_json       TEXT,   -- {steps:[], cues:[], pregnancy_note?, postnatal_note?}
  media_json              TEXT,   -- {image, video, gif} refs
  metrics_json            TEXT,   -- {supports:["reps","sets","time",...]}
  alternatives_json       TEXT,   -- {substitutions:["slug1","slug2"]}
  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (primary_muscles_json    IS NULL OR json_valid(primary_muscles_json)),
  CHECK (secondary_muscles_json  IS NULL OR json_valid(secondary_muscles_json)),
  CHECK (tags_json               IS NULL OR json_valid(tags_json)),
  CHECK (equipment_required_json IS NULL OR json_valid(equipment_required_json)),
  CHECK (equipment_advised_json  IS NULL OR json_valid(equipment_advised_json)),
  CHECK (instructions_json       IS NULL OR json_valid(instructions_json)),
  CHECK (media_json              IS NULL OR json_valid(media_json)),
  CHECK (metrics_json            IS NULL OR json_valid(metrics_json)),
  CHECK (alternatives_json       IS NULL OR json_valid(alternatives_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- cycling_workouts
-- Structured cycling sessions with power-zone intervals.
-- Sport-specific precursor to the generic workout_protocols model.
-- Each row is a named, reusable cycling session; intervals_json drives the
-- structured-workout UI and TCX/ZWO/ERG export.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cycling_workouts (
  id             TEXT    PRIMARY KEY,
  slug           TEXT    UNIQUE NOT NULL,
  name           TEXT    NOT NULL,
  sub_goal       TEXT    NOT NULL,
                 -- build_fitness|climbing|sprint|aerobic_base|race_fitness|any
  workout_type   TEXT    NOT NULL,
                 -- endurance|sweet_spot|threshold|vo2max|anaerobic|test
  tss_estimate   REAL    NOT NULL,   -- pre-computed at 250W reference FTP; scaled at plan time
  duration_min   INTEGER NOT NULL,
  intervals_json TEXT    NOT NULL,
                 -- [{label, duration_sec, power_pct_low, power_pct_high, sets,
                 --   min_sets?, max_sets?}]
  is_active      INTEGER NOT NULL DEFAULT 1
) STRICT;

-- ---------------------------------------------------------------------------
-- exercise_aliases
-- Maps alternate names / spelling variants to canonical exercises.
-- Useful for import deduplication and exercise search.
-- Does not affect planner logic.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS exercise_aliases (
  id            TEXT    PRIMARY KEY,
  exercise_id   TEXT    NOT NULL,
  alias         TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(alias) BETWEEN 1 AND 256)
) STRICT;

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_exercise_id
  ON exercise_aliases (exercise_id);

-- Non-unique lookup index; uq_exercise_aliases_alias enforces global uniqueness.
CREATE INDEX IF NOT EXISTS idx_exercise_aliases_alias
  ON exercise_aliases (alias);

-- Alias strings are globally unique (migration 0044).
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_aliases_alias
  ON exercise_aliases (alias);

-- ---------------------------------------------------------------------------
-- workout_protocols
-- A named, reusable structured session (interval run, circuit, test, etc.).
-- Sport-agnostic generalisation of cycling_workouts for all coaches.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS workout_protocols (
  id            TEXT    PRIMARY KEY,
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
  id             TEXT    PRIMARY KEY,
  protocol_id    TEXT    NOT NULL,
  step_order     INTEGER NOT NULL CHECK (step_order >= 0),
  step_type      TEXT    NOT NULL
                   CHECK (step_type IN ('exercise','interval','rest','note','warmup','cooldown')),
  exercise_id    TEXT,                -- nullable FK → exercises(id)
  duration_sec   INTEGER CHECK (duration_sec  IS NULL OR duration_sec  > 0),
  distance_m     REAL    CHECK (distance_m    IS NULL OR distance_m    > 0),
  reps           INTEGER CHECK (reps          IS NULL OR reps          > 0),
  sets           INTEGER CHECK (sets          IS NULL OR sets          > 0),
  rest_sec       INTEGER CHECK (rest_sec      IS NULL OR rest_sec      >= 0),
  intensity_json TEXT,               -- {zone, power_pct, hr_pct, pace_per_km}
  notes_json     TEXT,               -- cues, coach instructions
  created_at_ms  INTEGER NOT NULL,
  updated_at_ms  INTEGER NOT NULL,

  FOREIGN KEY (protocol_id) REFERENCES workout_protocols(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id)         ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (intensity_json IS NULL OR json_valid(intensity_json)),
  CHECK (notes_json     IS NULL OR json_valid(notes_json))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_workout_protocol_steps_protocol
  ON workout_protocol_steps (protocol_id, step_order);

-- ---------------------------------------------------------------------------
-- program_templates
-- A multi-week programme schedule (e.g. Defensie Cluster 1, 5K plan).
-- block_length = number of weeks in one repeating training block.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_templates (
  id            TEXT    PRIMARY KEY,
  slug          TEXT    NOT NULL UNIQUE,
  name          TEXT    NOT NULL,
  coach_type    TEXT    NOT NULL
                  CHECK (coach_type IN ('general','military','running','cycling')),
  sport         TEXT    NOT NULL DEFAULT 'general'
                  CHECK (sport IN ('general','military','running','cycling','any')),
  level         TEXT    CHECK (level IN ('beginner','intermediate','advanced')),
  block_length  INTEGER NOT NULL DEFAULT 4
                  CHECK (block_length >= 1 AND block_length <= 52),
  metadata_json TEXT,               -- {description, goals, equipment, source}
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (metadata_json IS NULL OR json_valid(metadata_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- program_template_items
-- One row per scheduled item within a programme template.
-- item_type drives which FK is populated (exercise_id XOR protocol_id).
-- block_week: 1-based week within the block.
-- day_index: 0=Mon … 6=Sun.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS program_template_items (
  id                  TEXT    PRIMARY KEY,
  program_template_id TEXT    NOT NULL,
  block_week          INTEGER NOT NULL CHECK (block_week >= 1),
  day_index           INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  session_order       INTEGER NOT NULL DEFAULT 1 CHECK (session_order >= 1),
  item_type           TEXT    NOT NULL CHECK (item_type IN ('exercise','protocol')),
  exercise_id         TEXT,           -- populated when item_type = 'exercise'
  protocol_id         TEXT,           -- populated when item_type = 'protocol'
  notes_json          TEXT,

  created_at_ms       INTEGER NOT NULL,
  updated_at_ms       INTEGER NOT NULL,

  FOREIGN KEY (program_template_id) REFERENCES program_templates(id)    ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (exercise_id)         REFERENCES exercises(id)             ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (protocol_id)         REFERENCES workout_protocols(id)     ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (notes_json IS NULL OR json_valid(notes_json)),
  -- XOR: exactly one of exercise_id / protocol_id must be set
  CHECK (
    (item_type = 'exercise' AND exercise_id IS NOT NULL AND protocol_id IS NULL) OR
    (item_type = 'protocol' AND protocol_id IS NOT NULL AND exercise_id IS NULL)
  )
) STRICT;

CREATE INDEX IF NOT EXISTS idx_program_template_items_template
  ON program_template_items (program_template_id, block_week, day_index, session_order);

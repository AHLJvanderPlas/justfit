-- =============================================================================
-- JustFit — Training Schema Baseline (run FIRST)
-- Regenerated 2026-08-10 directly from the production justfit-db schema
-- (sqlite_master dump) — resolves X-27: baseline now matches production exactly.
-- Training/content tables: exercises, protocols, programme templates.
-- Idempotent: all statements use IF NOT EXISTS.
-- =============================================================================

CREATE TABLE IF NOT EXISTS cycling_workouts (
  id             TEXT    PRIMARY KEY,
  slug           TEXT    UNIQUE NOT NULL,
  name           TEXT    NOT NULL,
  sub_goal       TEXT    NOT NULL, -- build_fitness|climbing|sprint|aerobic_base|race_fitness|any
  workout_type   TEXT    NOT NULL, -- endurance|sweet_spot|threshold|vo2max|anaerobic|test
  tss_estimate   REAL    NOT NULL, -- pre-computed at 250W FTP; scaled at plan time by user FTP
  duration_min   INTEGER NOT NULL, -- total session duration (minutes)
  intervals_json TEXT    NOT NULL, -- [{label,duration_sec,power_pct_low,power_pct_high,sets}]
  is_active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS exercise_aliases (
  id            TEXT    PRIMARY KEY,          -- uuid
  exercise_id   TEXT    NOT NULL,
  alias         TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(alias) BETWEEN 1 AND 256)
) STRICT;

CREATE TABLE IF NOT EXISTS exercises (
  id                      TEXT PRIMARY KEY,            -- uuid (or stable slug id)
  slug                    TEXT NOT NULL,               -- stable identifier
  name                    TEXT NOT NULL,
  category                TEXT CHECK (category IN ('strength','cardio','mobility','recovery','skill','mixed')),
  primary_muscles_json    TEXT,                        -- JSON array
  secondary_muscles_json  TEXT,                        -- JSON array
  tags_json               TEXT,                        -- JSON array (difficulty, patterns, etc.)

  equipment_required_json TEXT,                        -- JSON array (required)
  equipment_advised_json  TEXT,                        -- JSON array (advised)

  instructions_json       TEXT,                        -- JSON (steps, cues)
  media_json              TEXT,                        -- JSON (image/video refs)
  metrics_json            TEXT,                        -- JSON (supports: weight, wattage, time, distance, reps, etc.)
  alternatives_json       TEXT,                        -- JSON (1-3 alternatives or links)

  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL, name_nl TEXT, gym_id TEXT REFERENCES gyms(id), visibility TEXT NOT NULL DEFAULT 'global', created_by_user_id TEXT REFERENCES users(id), instructions_markdown TEXT, instructions_markdown_nl TEXT, contraindications_json TEXT, difficulty TEXT, image_r2_key TEXT, video_r2_key TEXT, source TEXT, parent_exercise_id TEXT REFERENCES exercises(id),

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (json_valid(primary_muscles_json) OR primary_muscles_json IS NULL),
  CHECK (json_valid(secondary_muscles_json) OR secondary_muscles_json IS NULL),
  CHECK (json_valid(tags_json) OR tags_json IS NULL),
  CHECK (json_valid(equipment_required_json) OR equipment_required_json IS NULL),
  CHECK (json_valid(equipment_advised_json) OR equipment_advised_json IS NULL),
  CHECK (json_valid(instructions_json) OR instructions_json IS NULL),
  CHECK (json_valid(media_json) OR media_json IS NULL),
  CHECK (json_valid(metrics_json) OR metrics_json IS NULL),
  CHECK (json_valid(alternatives_json) OR alternatives_json IS NULL)
) STRICT;

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


-- ── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_alias
  ON exercise_aliases (alias);

CREATE INDEX IF NOT EXISTS idx_exercise_aliases_exercise_id
  ON exercise_aliases (exercise_id);

CREATE INDEX IF NOT EXISTS idx_exercises_active_category
  ON exercises(is_active, category);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_slug
  ON exercises(lower(slug));

CREATE INDEX IF NOT EXISTS idx_program_template_items_template
  ON program_template_items (program_template_id, block_week, day_index, session_order);

CREATE INDEX IF NOT EXISTS idx_workout_protocol_steps_protocol
  ON workout_protocol_steps (protocol_id, step_order);

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_aliases_alias
  ON exercise_aliases (alias);

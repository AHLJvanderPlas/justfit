-- =============================================================================
-- JustFit — Schema Baseline (every table and index, exactly as production holds it)
-- Generated: 2026-10-04T10:14:27.271Z  by scripts/generate-baseline-schema.mjs (read-only SELECT
-- against live justfit-db). DO NOT HAND-EDIT: regenerate instead.
--
-- Canonical current state of live D1 at generation time:
--   tables  : 67
--   indexes : 85
-- Creation order preserved (sqlite_master rowid). Includes schema_migrations so
-- a bootstrapped environment can run scripts/migrate.mjs immediately.
-- Bootstrap order: 1010 (empty) → THIS FILE → 1020/1030/1040 seeds.
-- =============================================================================

CREATE TABLE users (
  id                 TEXT PRIMARY KEY,                 -- uuid
  status             TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','deleted')),
  created_at_ms      INTEGER NOT NULL,
  updated_at_ms      INTEGER NOT NULL,
  deleted_at_ms      INTEGER,

  -- convenience (not a login source of truth)
  primary_email      TEXT,
  primary_phone      TEXT, accepted_terms_version   TEXT, accepted_terms_at_ms     INTEGER, accepted_privacy_version TEXT, accepted_privacy_at_ms   INTEGER, token_invalidated_at_ms INTEGER DEFAULT NULL, email_verified INTEGER NOT NULL DEFAULT 0, password_hash TEXT, password_algo TEXT, last_login_at_ms INTEGER, locale TEXT, timezone TEXT, country_code TEXT,

  CHECK (primary_email IS NULL OR length(primary_email) <= 320),
  CHECK (primary_phone IS NULL OR length(primary_phone) <= 32)
) STRICT;

CREATE TABLE user_preferences (
  user_id                 TEXT PRIMARY KEY,

  -- core toggles
  units                   TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric','imperial')),
  training_goal           TEXT CHECK (training_goal IN ('fat_loss','muscle_gain','endurance','strength','health','mobility','mixed')),
  experience_level        TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),

  -- plan / engine knobs
  intensity_pref          INTEGER CHECK (intensity_pref IS NULL OR (intensity_pref >= 1 AND intensity_pref <= 10)),
  session_duration_min    INTEGER CHECK (session_duration_min IS NULL OR (session_duration_min >= 5 AND session_duration_min <= 180)),
  days_per_week_target    INTEGER CHECK (days_per_week_target IS NULL OR (days_per_week_target >= 1 AND days_per_week_target <= 7)),

  -- equipment, injuries, dislikes, etc.
  preferences_json        TEXT,                         -- JSON

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL, sex       TEXT, height_cm REAL, weight_kg REAL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (preferences_json IS NULL OR json_valid(preferences_json))
) STRICT;

CREATE TABLE daily_checkins (
  id                      TEXT PRIMARY KEY,             -- uuid
  user_id                 TEXT NOT NULL,
  date                    TEXT NOT NULL,                -- local date 'YYYY-MM-DD' (user TZ)

  mood                    INTEGER CHECK (mood IS NULL OR (mood >= 1 AND mood <= 10)),
  energy                  INTEGER CHECK (energy IS NULL OR (energy >= 1 AND energy <= 10)),
  soreness                INTEGER CHECK (soreness IS NULL OR (soreness >= 0 AND soreness <= 10)),
  sleep_hours             REAL CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  stress                  INTEGER CHECK (stress IS NULL OR (stress >= 1 AND stress <= 10)),

  weight_kg               REAL CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 400)),

  notes                   TEXT,
  checkin_json            TEXT,                         -- JSON (symptoms, tags, etc.)

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (checkin_json IS NULL OR json_valid(checkin_json))
) STRICT;

CREATE TABLE context_overrides (
  id                      TEXT PRIMARY KEY,             -- uuid
  user_id                 TEXT NOT NULL,
  date                    TEXT NOT NULL,                -- 'YYYY-MM-DD' local date

  -- overrides for planner (e.g., travel, illness, time constraints)
  override_type           TEXT NOT NULL CHECK (override_type IN ('time','intensity','equipment','injury','skip','other')),
  override_json           TEXT NOT NULL,                -- JSON

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(override_json))
) STRICT;

CREATE TABLE day_plans (
  id                      TEXT PRIMARY KEY,             -- uuid
  user_id                 TEXT NOT NULL,
  date                    TEXT NOT NULL,                -- 'YYYY-MM-DD' local date

  -- planner output
  plan_status             TEXT NOT NULL DEFAULT 'draft' CHECK (plan_status IN ('draft','final','skipped','archived')),
  plan_json               TEXT NOT NULL,                -- JSON (sessions, blocks, suggestions)
  generated_by            TEXT NOT NULL DEFAULT 'engine',-- 'engine'|'manual'|...
  engine_version          TEXT,                         -- e.g. 'v1'
  seed                    TEXT,                         -- deterministic generation seed (optional)

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(plan_json))
) STRICT;

CREATE TABLE exercises (
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

CREATE TABLE session_templates (
  id                      TEXT PRIMARY KEY,            -- uuid
  slug                    TEXT,                        -- optional stable id
  name                    TEXT NOT NULL,
  description             TEXT,

  session_type            TEXT NOT NULL CHECK (session_type IN ('workout','bike','run','walk','mobility','recovery','mixed')),
  difficulty              TEXT CHECK (difficulty IN ('easy','moderate','hard')),
  duration_min            INTEGER CHECK (duration_min IS NULL OR (duration_min >= 5 AND duration_min <= 240)),

  -- template structure
  template_json           TEXT NOT NULL,               -- JSON (blocks/steps, exercise refs, defaults)

  is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  CHECK (slug IS NULL OR length(slug) <= 128),
  CHECK (json_valid(template_json))
) STRICT;

CREATE TABLE execution_steps (
  id                      TEXT PRIMARY KEY,            -- uuid
  execution_id            TEXT NOT NULL,

  step_index              INTEGER NOT NULL CHECK (step_index >= 0),
  step_type               TEXT NOT NULL CHECK (step_type IN ('exercise','interval','rest','note','block')),
  exercise_id             TEXT,                        -- if step_type='exercise'

  -- prescribed
  prescribed_json         TEXT,                        -- JSON (sets/reps/time/watts/weight targets)

  -- actuals
  actual_json             TEXT,                        -- JSON (completed sets, avg watts, etc.)

  started_at_ms           INTEGER,
  ended_at_ms             INTEGER,

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (prescribed_json IS NULL OR json_valid(prescribed_json)),
  CHECK (actual_json IS NULL OR json_valid(actual_json))
) STRICT;

CREATE TABLE referrals (
  id                      TEXT PRIMARY KEY,            -- uuid
  referrer_user_id        TEXT NOT NULL,
  referred_user_id        TEXT,                        -- set once signup occurs

  code                    TEXT NOT NULL,               -- referral code
  status                  TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued','clicked','signed_up','qualified','rewarded','expired','canceled')),

  issued_at_ms            INTEGER NOT NULL,
  signed_up_at_ms         INTEGER,
  rewarded_at_ms          INTEGER,

  meta_json               TEXT,

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (length(code) BETWEEN 4 AND 64),
  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

CREATE TABLE vouchers (
  id                      TEXT PRIMARY KEY,            -- uuid
  code                    TEXT NOT NULL,
  voucher_type            TEXT NOT NULL CHECK (voucher_type IN ('percent','fixed','trial_days','entitlement_product','other')),
  status                  TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','disabled')),

  max_redemptions         INTEGER CHECK (max_redemptions IS NULL OR max_redemptions >= 1),
  redemption_count        INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),

  valid_from_ms           INTEGER,
  valid_to_ms             INTEGER,

  payload_json            TEXT NOT NULL,               -- JSON (discount parameters, product_code, etc.)
  created_by              TEXT,                        -- admin/user/system identifier

  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  CHECK (length(code) BETWEEN 4 AND 64),
  CHECK (json_valid(payload_json))
) STRICT;

CREATE TABLE _migrations (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  name               TEXT NOT NULL UNIQUE,
  applied_at_ms      INTEGER NOT NULL
) STRICT;

CREATE TABLE passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  algorithm INTEGER NOT NULL DEFAULT -7,
  device_type TEXT,
  created_at_ms INTEGER NOT NULL,
  last_used_at_ms INTEGER,
  updated_at_ms INTEGER NOT NULL
, counter INTEGER NOT NULL DEFAULT 0, backed_up INTEGER NOT NULL DEFAULT 0, transports TEXT) STRICT;

CREATE TABLE password_reset_tokens (
  token         TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms    INTEGER,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE magic_link_tokens (
  token         TEXT PRIMARY KEY,
  user_id       TEXT,           -- NULL if email not yet registered
  email         TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms    INTEGER,
  created_at_ms INTEGER NOT NULL
, purpose TEXT NOT NULL DEFAULT 'login', new_email TEXT, code TEXT) STRICT;

CREATE TABLE user_progression (
  user_id                 TEXT PRIMARY KEY,
  scores_json             TEXT NOT NULL,           -- current body-axis progression state
  sport_scores_json       TEXT,                    -- optional sport-specific progression
  last_computed_at_ms     INTEGER NOT NULL,        -- when decay was last applied
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (json_valid(scores_json)),
  CHECK (sport_scores_json IS NULL OR json_valid(sport_scores_json))
) STRICT;

CREATE TABLE auth_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE app_events (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email    TEXT,
  event_type    TEXT NOT NULL,
  detail        TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE feedback_items (
  id              TEXT PRIMARY KEY,
  user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email      TEXT,
  event_type      TEXT NOT NULL DEFAULT 'feedback',
  message         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'new'
                    CHECK(status IN ('new','discard','react','fix','roadmap','resolved')),
  flagged         INTEGER NOT NULL DEFAULT 0,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL
) STRICT;

CREATE TABLE deleted_users (
  id              TEXT PRIMARY KEY,           -- original users.id (UUID)
  email_hash      TEXT NOT NULL,              -- SHA-256 hex of primary_email
  requested_by_ip TEXT,                       -- CF-Connecting-IP at delete time
  deleted_at_ms   INTEGER NOT NULL            -- Date.now() at deletion
) STRICT;

CREATE TABLE cycling_workouts (
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
, scope_granted TEXT, push_enabled INTEGER NOT NULL DEFAULT 0, last_push_at_ms INTEGER) STRICT;

CREATE TABLE "executions" (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL,
  date                    TEXT,
  day_plan_id             TEXT,
  session_template_id     TEXT,
  execution_type          TEXT NOT NULL DEFAULT 'workout',
  status                  TEXT NOT NULL DEFAULT 'completed'
                              CHECK (status IN ('planned','in_progress','completed','abandoned')),
  started_at_ms           INTEGER,
  ended_at_ms             INTEGER,
  total_duration_sec      INTEGER CHECK (total_duration_sec IS NULL OR total_duration_sec >= 0),
  total_distance_m        REAL    CHECK (total_distance_m  IS NULL OR total_distance_m  >= 0),
  total_energy_kcal       REAL    CHECK (total_energy_kcal IS NULL OR total_energy_kcal >= 0),
  avg_hr_bpm              REAL    CHECK (avg_hr_bpm        IS NULL OR avg_hr_bpm        >= 0),
  perceived_exertion      INTEGER CHECK (perceived_exertion IS NULL OR
                                         (perceived_exertion >= 1 AND perceived_exertion <= 10)),
  notes                   TEXT,
  execution_json          TEXT,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,
  tss_planned             REAL,
  tss_actual              REAL,
  tss_source              TEXT,
  strava_activity_id      INTEGER,
  strava_metadata_json    TEXT, program_assignment_id  TEXT, assigned_by_trainer_id TEXT, trainer_notes          TEXT, client_rpe             INTEGER, client_feedback        TEXT, strava_metadata_expires_at_ms INTEGER, strava_upload_activity_id INTEGER, strava_upload_at_ms INTEGER, source_ref TEXT,
  CHECK (execution_json IS NULL OR json_valid(execution_json))
) STRICT;

CREATE TABLE exercise_aliases (
  id            TEXT    PRIMARY KEY,          -- uuid
  exercise_id   TEXT    NOT NULL,
  alias         TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(alias) BETWEEN 1 AND 256)
) STRICT;

CREATE TABLE workout_protocols (
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

CREATE TABLE workout_protocol_steps (
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

CREATE TABLE program_templates (
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

CREATE TABLE program_template_items (
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

CREATE TABLE admin_justfit_users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT DEFAULT 'admin',   -- admin | viewer
  password_hash TEXT,                   -- salt:hash (SHA-256 with JWT_SECRET pepper)
  is_active     INTEGER DEFAULT 1,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE admin_justfit_sessions (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES admin_justfit_users(id),
  created_at_ms       INTEGER NOT NULL,
  last_accessed_at_ms INTEGER NOT NULL,
  expires_at_ms       INTEGER NOT NULL,
  ip                  TEXT,
  user_agent          TEXT
) STRICT;

CREATE TABLE admin_justfit_audit (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT REFERENCES admin_justfit_users(id),
  action      TEXT NOT NULL,   -- trainer.approve, trainer.suspend, plan.change, user.delete …
  target_type TEXT,            -- trainer | user | invoice | exercise
  target_id   TEXT,
  payload     TEXT,            -- JSON
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE admin_magic_tokens (
  token       TEXT    PRIMARY KEY,
  email       TEXT    NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms  INTEGER,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE audit_log (
  id            TEXT PRIMARY KEY,
  gym_id        TEXT,
  actor_user_id TEXT,
  action        TEXT NOT NULL,
  target_type   TEXT,
  target_id     TEXT,
  payload_json  TEXT,
  ip            TEXT,
  user_agent    TEXT,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE client_intake (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES users(id),
  gym_id                    TEXT NOT NULL REFERENCES gyms(id),
  goals_json                TEXT,   -- [{tag: string, label: string}]
  goals_free_text           TEXT,
  experience_level          TEXT CHECK (experience_level IN ('beginner','intermediate','advanced','elite')),
  training_history_json     TEXT,   -- {years_training: int, sports_background: string[]}
  injuries_json             TEXT,   -- [{area: string, severity: string, active: bool, notes: string}]
  contraindications_json    TEXT,   -- [{tag: string, notes: string}]
  available_days_json       TEXT,   -- {days: string[], time_of_day: string}
  session_duration_target_min INTEGER,
  equipment_access_json     TEXT,   -- {items: string[]} home/personal equipment
  completed_at_ms           INTEGER,
  updated_at_ms             INTEGER NOT NULL,
  version                   INTEGER NOT NULL DEFAULT 1,
  created_at_ms             INTEGER NOT NULL,
  UNIQUE(user_id, gym_id)
) STRICT;

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

CREATE TABLE supplier_invoices (
  id                TEXT PRIMARY KEY,
  gym_id            TEXT NOT NULL REFERENCES gyms(id),
  supplier_name     TEXT NOT NULL,
  supplier_kvk      TEXT,
  supplier_vat      TEXT,
  invoice_date      TEXT NOT NULL,   -- YYYY-MM-DD
  invoice_number    TEXT,
  amount_ex_btw     REAL NOT NULL,
  btw_rate          REAL NOT NULL DEFAULT 0,  -- 0, 0.09, 0.21
  btw_amount        REAL NOT NULL DEFAULT 0,
  category          TEXT,             -- e.g. 'equipment', 'rent', 'marketing'
  attachment_r2_key TEXT,
  notes             TEXT,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL
) STRICT;

CREATE TABLE invoice_counters (
  gym_id      TEXT NOT NULL,
  year        INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (gym_id, year)
) STRICT;

CREATE TABLE gyms (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  kvk_number TEXT,
  vat_number TEXT,
  iban TEXT,
  address_json TEXT,
  branding_json TEXT,
  encryption_key_enc TEXT NOT NULL,
  kor_active INTEGER NOT NULL DEFAULT 0,
  dpa_acknowledged_at_ms INTEGER,
  dpa_version TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
, trainer_token TEXT, sub_status TEXT NOT NULL DEFAULT 'trialing' CHECK (sub_status IN ('trialing','active','grace','canceled','expired')), sub_tier TEXT NOT NULL DEFAULT 'starter' CHECK (sub_tier IN ('starter','pro','gym')), sub_source TEXT, sub_starts_at_ms INTEGER, sub_ends_at_ms INTEGER, mollie_customer_id TEXT, mollie_sub_id TEXT, model TEXT NOT NULL DEFAULT 'staff', switch_auto_approve INTEGER NOT NULL DEFAULT 0, trainer_tab_config_json TEXT NOT NULL DEFAULT '{}', sub_billing_period TEXT DEFAULT 'monthly', packages_catalog_json TEXT, msg_templates_json TEXT, self_booking_enabled INTEGER NOT NULL DEFAULT 0, free_tier_client_limit INTEGER NOT NULL DEFAULT 3) STRICT;

CREATE TABLE gym_memberships (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL REFERENCES gyms(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('owner','trainer','client')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','suspended','removed')),
  invited_by_user_id TEXT,
  invited_at_ms INTEGER,
  joined_at_ms INTEGER,
  permissions_json TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL, assigned_trainer_user_id TEXT, trainer_message TEXT, trainer_message_sent_at_ms INTEGER, show_in_client_app INTEGER NOT NULL DEFAULT 1, team_view_opt_in INTEGER NOT NULL DEFAULT 0, allow_trainer_switch INTEGER NOT NULL DEFAULT 1, availability_status TEXT NOT NULL DEFAULT 'offline', availability_updated_at_ms INTEGER, support_trainer_user_id TEXT, goal_override TEXT, intensity_modifier INTEGER DEFAULT 0, training_days_json TEXT, consent_json TEXT, conv_unread_trainer INTEGER NOT NULL DEFAULT 0, conv_unread_client INTEGER NOT NULL DEFAULT 0, conv_last_msg_at_ms INTEGER,
  UNIQUE(gym_id, user_id)
) STRICT;

CREATE TABLE trainer_disclosures (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id),
  gym_id                  TEXT NOT NULL REFERENCES gyms(id),
  trainer_user_id         TEXT,               -- NULL = whole-gym disclosure
  level                   TEXT NOT NULL DEFAULT 'L1' CHECK (level IN ('L0','L1','L2','L3','L4')),
  display_name            TEXT NOT NULL,      -- user-chosen alias
  photo_r2_key            TEXT,
  real_name_first_enc     TEXT,               -- AES-GCM encrypted
  real_name_last_enc      TEXT,
  billing_name_enc        TEXT,
  billing_address_enc     TEXT,
  billing_postal_enc      TEXT,
  billing_city_enc        TEXT,
  billing_country         TEXT,               -- low sensitivity, unencrypted
  billing_vat_enc         TEXT,
  contact_email_enc       TEXT,
  contact_phone_enc       TEXT,
  share_training_history  INTEGER NOT NULL DEFAULT 0,
  share_checkins          INTEGER NOT NULL DEFAULT 0,
  share_pain_rpe          INTEGER NOT NULL DEFAULT 1,
  share_body_metrics      INTEGER NOT NULL DEFAULT 0,
  share_detailed_adherence INTEGER NOT NULL DEFAULT 1,
  email_verified          INTEGER NOT NULL DEFAULT 0,
  phone_verified          INTEGER NOT NULL DEFAULT 0,
  consented_at_ms         INTEGER,
  consent_purpose         TEXT,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL,
  UNIQUE(user_id, gym_id, trainer_user_id)
) STRICT;

CREATE TABLE trainer_invites (id TEXT PRIMARY KEY, gym_id TEXT NOT NULL REFERENCES gyms(id), email TEXT NOT NULL, invite_token TEXT NOT NULL UNIQUE, user_id TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')), created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL) STRICT;

CREATE TABLE billing_events (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  event_type   TEXT    NOT NULL,  -- 'sub_created'|'payment_paid'|'payment_failed'|'sub_canceled'|'trial_started'
  product_code TEXT,
  mollie_id    TEXT,
  payload_json TEXT,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE admin_login_attempts (
  id       TEXT    NOT NULL PRIMARY KEY,
  ip       TEXT    NOT NULL,
  endpoint TEXT    NOT NULL,
  at_ms    INTEGER NOT NULL
);

CREATE TABLE trainer_profiles (
  user_id            TEXT PRIMARY KEY,
  display_name       TEXT,
  bio                TEXT,
  photo_r2_key       TEXT,
  specialties_json   TEXT NOT NULL DEFAULT '[]',
  instagram_handle   TEXT,
  updated_at_ms      INTEGER NOT NULL DEFAULT 0
, availability_json TEXT);

CREATE TABLE support_requests (
  id                     TEXT PRIMARY KEY,
  gym_id                 TEXT NOT NULL,
  client_user_id         TEXT NOT NULL,
  message                TEXT NOT NULL,
  broadcast              INTEGER NOT NULL DEFAULT 0,
  status                 TEXT NOT NULL DEFAULT 'open',
  accepted_by_user_id    TEXT,
  reply_message          TEXT,
  created_at_ms          INTEGER NOT NULL,
  accepted_at_ms         INTEGER,
  resolved_at_ms         INTEGER
);

CREATE TABLE trainer_switch_requests (
  id                       TEXT PRIMARY KEY,
  gym_id                   TEXT NOT NULL,
  client_user_id           TEXT NOT NULL,
  from_trainer_user_id     TEXT,
  to_trainer_user_id       TEXT NOT NULL,
  initiated_by             TEXT NOT NULL DEFAULT 'client',
  client_message           TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending',
  decided_by_user_id       TEXT,
  decline_reason           TEXT,
  created_at_ms            INTEGER NOT NULL,
  decided_at_ms            INTEGER
);

CREATE TABLE invoice_templates (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lines_json TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE push_subscriptions (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint      TEXT    NOT NULL,
  p256dh        TEXT    NOT NULL,
  auth          TEXT    NOT NULL,
  user_agent    TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  UNIQUE (user_id, endpoint)
) STRICT;

CREATE TABLE referral_codes (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  code    TEXT UNIQUE NOT NULL
);

CREATE TABLE waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  source     TEXT    NOT NULL DEFAULT 'marketing',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE client_notes (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  client_user_id TEXT NOT NULL,
  author_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  pinned INTEGER NOT NULL DEFAULT 0,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  trainer_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('session_1on1','group')),
  starts_at_ms INTEGER NOT NULL,
  ends_at_ms INTEGER NOT NULL,
  location TEXT,
  max_capacity INTEGER,
  client_package_id TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled','completed')),
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE appointment_enrollments (
  id TEXT PRIMARY KEY,
  appointment_id TEXT NOT NULL,
  client_user_id TEXT NOT NULL,
  gym_id TEXT NOT NULL,
  rsvp TEXT NOT NULL DEFAULT 'confirmed' CHECK(rsvp IN ('confirmed','cancelled','waitlist')),
  created_at_ms INTEGER NOT NULL
);

CREATE TABLE client_packages (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  client_user_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  sessions_total INTEGER NOT NULL,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL,
  vat_pct REAL NOT NULL DEFAULT 21.0,
  sold_at_ms INTEGER NOT NULL,
  expires_at_ms INTEGER,
  adjustments_json TEXT,
  invoice_id TEXT
);

CREATE TABLE trainer_messages (
  id TEXT PRIMARY KEY,
  gym_id TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  recipient_user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at_ms INTEGER NOT NULL,
  read_at_ms INTEGER
);

CREATE TABLE trainer_invoices (
  id                      TEXT    PRIMARY KEY,
  trainer_id              TEXT    NOT NULL REFERENCES users(id),          -- gym owner user ID
  user_id                 TEXT    NOT NULL REFERENCES users(id),          -- client user ID
  gym_id_ref              TEXT    NOT NULL REFERENCES gyms(id),           -- the gym
  invoice_number          TEXT    NOT NULL,
  invoice_number_assigned TEXT,                                           -- final number after send
  status                  TEXT    NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','sent','paid','overdue','void')),
  invoice_date            TEXT    NOT NULL,                               -- YYYY-MM-DD
  due_date                TEXT,                                           -- YYYY-MM-DD
  currency                TEXT    NOT NULL DEFAULT 'EUR',
  lines_json              TEXT    NOT NULL,                               -- [{description,quantity,unit_price,vat_rate,line_total}]
  btw_lines_json          TEXT,                                           -- computed VAT breakdown
  subtotal                REAL    NOT NULL,
  vat_amount              REAL    NOT NULL,
  total                   REAL    NOT NULL,
  notes                   TEXT,
  payment_terms_days      INTEGER NOT NULL DEFAULT 14,
  mollie_payment_id       TEXT,
  mollie_payment_url      TEXT,
  sent_at_ms              INTEGER,
  paid_at_ms              INTEGER,
  voided_at_ms            INTEGER,
  created_at_ms           INTEGER NOT NULL,
  updated_at_ms           INTEGER NOT NULL
) STRICT;

CREATE TABLE fitness_assessments (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), date TEXT NOT NULL, focus TEXT NOT NULL, results_json TEXT NOT NULL, scores_json TEXT NOT NULL, created_at_ms INTEGER NOT NULL) STRICT;

CREATE TABLE "user_progression_events" (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, execution_id TEXT, event_type TEXT NOT NULL, scores_before_json TEXT, scores_after_json TEXT, stimulus_json TEXT, created_at_ms INTEGER NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE, CHECK (event_type IN ('workout','decay','recompute','assessment')), CHECK (scores_before_json IS NULL OR json_valid(scores_before_json)), CHECK (scores_after_json IS NULL OR json_valid(scores_after_json)), CHECK (stimulus_json IS NULL OR json_valid(stimulus_json))) STRICT;

CREATE TABLE platform_config (   key           TEXT PRIMARY KEY,   value         TEXT NOT NULL,   description   TEXT,   updated_at_ms INTEGER NOT NULL,   updated_by    TEXT ) STRICT;

CREATE TABLE user_session_templates (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT NOT NULL,
  steps_json    TEXT NOT NULL,
  est_minutes   INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

CREATE TABLE schema_migrations (
  filename      TEXT PRIMARY KEY,
  sha256        TEXT NOT NULL,
  rows_written  INTEGER,
  applied_at_ms INTEGER NOT NULL,
  applied_by    TEXT,
  note          TEXT
) STRICT;

CREATE TABLE "cycle_profile" (
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

CREATE TABLE "period_log" (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, started_on TEXT NOT NULL, noted_at_ms INTEGER NOT NULL, source TEXT DEFAULT 'checkin') STRICT;

CREATE TABLE "pregnancy_weekly_log" (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, week_number INTEGER NOT NULL, week_start_date TEXT NOT NULL, avg_energy REAL, avg_nausea REAL, avg_breathless REAL, sessions_done INTEGER DEFAULT 0, notes TEXT, created_at_ms INTEGER NOT NULL) STRICT;

CREATE TABLE "entitlements" (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  product_code TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other','trial',
                                   'mollie_sub','trainer_grant','manual_grant')),
  status       TEXT    NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','trialing','grace','canceled','expired')),
  starts_at_ms INTEGER NOT NULL,
  ends_at_ms   INTEGER,
  renews_at_ms INTEGER,
  external_ref TEXT,
  meta_json    TEXT,
  mollie_customer_id TEXT,
  mollie_sub_id      TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(product_code) <= 128),
  CHECK (external_ref IS NULL OR length(external_ref) <= 256),
  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

CREATE UNIQUE INDEX idx_daily_checkins_user_date
  ON daily_checkins(user_id, date);

CREATE INDEX idx_daily_checkins_user_created
  ON daily_checkins(user_id, created_at_ms);

CREATE INDEX idx_context_overrides_user_date
  ON context_overrides(user_id, date);

CREATE UNIQUE INDEX idx_day_plans_user_date
  ON day_plans(user_id, date);

CREATE INDEX idx_day_plans_user_status_date
  ON day_plans(user_id, plan_status, date);

CREATE UNIQUE INDEX idx_exercises_slug
  ON exercises(lower(slug));

CREATE INDEX idx_exercises_active_category
  ON exercises(is_active, category);

CREATE UNIQUE INDEX idx_session_templates_slug
  ON session_templates(lower(slug))
  WHERE slug IS NOT NULL;

CREATE INDEX idx_session_templates_active_type
  ON session_templates(is_active, session_type);

CREATE UNIQUE INDEX idx_execution_steps_execution_stepindex
  ON execution_steps(execution_id, step_index);

CREATE INDEX idx_execution_steps_exercise
  ON execution_steps(exercise_id);

CREATE UNIQUE INDEX idx_referrals_code
  ON referrals(lower(code));

CREATE INDEX idx_referrals_referrer_status
  ON referrals(referrer_user_id, status);

CREATE UNIQUE INDEX idx_vouchers_code
  ON vouchers(lower(code));

CREATE INDEX idx_vouchers_status_validity
  ON vouchers(status, valid_from_ms, valid_to_ms);

CREATE INDEX idx_pk_user ON passkey_credentials(user_id);

CREATE INDEX idx_prt_email ON password_reset_tokens(email);

CREATE INDEX idx_mlt_email ON magic_link_tokens(email);

CREATE INDEX idx_mlt_code ON magic_link_tokens(code);

CREATE INDEX idx_app_events_created_at_ms ON app_events(created_at_ms DESC);

CREATE INDEX idx_app_events_type_created ON app_events(event_type, created_at_ms DESC);

CREATE INDEX idx_feedback_items_created ON feedback_items(created_at_ms DESC);

CREATE INDEX idx_feedback_items_flagged ON feedback_items(flagged, created_at_ms ASC);

CREATE INDEX idx_rate_limits_window ON auth_rate_limits(window_start_ms);

CREATE INDEX idx_deleted_users_at ON deleted_users(deleted_at_ms);

CREATE UNIQUE INDEX idx_strava_connections_user ON strava_connections(user_id);

CREATE INDEX idx_executions_user_date
  ON executions(user_id, date);

CREATE INDEX idx_executions_user_started
  ON executions(user_id, started_at_ms);

CREATE UNIQUE INDEX idx_executions_strava
  ON executions(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

CREATE INDEX idx_exercise_aliases_exercise_id
  ON exercise_aliases (exercise_id);

CREATE INDEX idx_exercise_aliases_alias
  ON exercise_aliases (alias);

CREATE INDEX idx_workout_protocol_steps_protocol
  ON workout_protocol_steps (protocol_id, step_order);

CREATE INDEX idx_program_template_items_template
  ON program_template_items (program_template_id, block_week, day_index, session_order);

CREATE UNIQUE INDEX uq_exercise_aliases_alias
  ON exercise_aliases (alias);

CREATE INDEX idx_ajs_user ON admin_justfit_sessions(user_id);

CREATE INDEX idx_ajs_expires ON admin_justfit_sessions(expires_at_ms);

CREATE INDEX idx_aja_actor  ON admin_justfit_audit(actor_id, created_at_ms);

CREATE INDEX idx_aja_target ON admin_justfit_audit(target_type, target_id);

CREATE INDEX idx_admin_magic_tokens_email ON admin_magic_tokens (email, created_at_ms);

CREATE INDEX idx_al_gym       ON audit_log(gym_id, created_at_ms);

CREATE INDEX idx_al_actor     ON audit_log(actor_user_id, created_at_ms);

CREATE INDEX idx_al_target    ON audit_log(target_type, target_id);

CREATE INDEX idx_ci_gym  ON client_intake(gym_id);

CREATE INDEX idx_ci_user ON client_intake(user_id);

CREATE INDEX idx_prog_gym      ON programs(gym_id, is_template);

CREATE INDEX idx_prog_creator  ON programs(created_by_user_id);

CREATE INDEX idx_ps_program ON program_sessions(program_id, week_number, day_in_week);

CREATE INDEX idx_pa_client  ON program_assignments(client_user_id, status);

CREATE INDEX idx_pa_gym     ON program_assignments(gym_id, status);

CREATE INDEX idx_pa_trainer ON program_assignments(assigned_by_trainer_id);

CREATE INDEX idx_as_assignment ON assigned_sessions(program_assignment_id);

CREATE INDEX idx_as_date       ON assigned_sessions(scheduled_date);

CREATE INDEX idx_as_client     ON assigned_sessions(program_assignment_id, scheduled_date);

CREATE INDEX idx_si_gym  ON supplier_invoices(gym_id, invoice_date);

CREATE INDEX idx_gyms_owner ON gyms(owner_user_id);

CREATE INDEX idx_gyms_slug ON gyms(slug);

CREATE INDEX idx_gm_gym ON gym_memberships(gym_id, status);

CREATE INDEX idx_gm_user ON gym_memberships(user_id, status);

CREATE INDEX idx_td_user ON trainer_disclosures(user_id);

CREATE INDEX idx_td_gym  ON trainer_disclosures(gym_id);

CREATE UNIQUE INDEX idx_gyms_trainer_token ON gyms(trainer_token) WHERE trainer_token IS NOT NULL;

CREATE INDEX idx_trainer_invites_token ON trainer_invites(invite_token);

CREATE INDEX idx_trainer_invites_email ON trainer_invites(email);

CREATE INDEX idx_admin_login_attempts_ip_ep_at
  ON admin_login_attempts(ip, endpoint, at_ms);

CREATE INDEX idx_support_requests_gym_status ON support_requests(gym_id, status);

CREATE INDEX idx_support_requests_client ON support_requests(client_user_id, status);

CREATE INDEX idx_switch_requests_gym ON trainer_switch_requests(gym_id, status);

CREATE INDEX idx_switch_requests_client ON trainer_switch_requests(client_user_id, status);

CREATE INDEX idx_invoice_templates_gym ON invoice_templates(gym_id);

CREATE INDEX idx_client_notes_gym_client ON client_notes(gym_id, client_user_id, pinned DESC, created_at_ms DESC);

CREATE INDEX idx_appointments_gym_time ON appointments(gym_id, starts_at_ms);

CREATE UNIQUE INDEX idx_enroll_unique ON appointment_enrollments(appointment_id, client_user_id);

CREATE INDEX idx_client_packages_gym_client ON client_packages(gym_id, client_user_id);

CREATE INDEX idx_trainer_messages_thread ON trainer_messages(gym_id, sender_user_id, recipient_user_id, sent_at_ms);

CREATE INDEX idx_billing_events_user ON billing_events(user_id);

CREATE INDEX idx_trainer_invoices_gym ON trainer_invoices(gym_id_ref, created_at_ms DESC);

CREATE INDEX idx_trainer_invoices_user ON trainer_invoices(user_id);

CREATE INDEX idx_trainer_invoices_mollie ON trainer_invoices(mollie_payment_id) WHERE mollie_payment_id IS NOT NULL;

CREATE INDEX idx_executions_strava_expiry ON executions(strava_metadata_expires_at_ms) WHERE strava_metadata_expires_at_ms IS NOT NULL;

CREATE INDEX idx_fitness_assessments_user ON fitness_assessments(user_id, created_at_ms DESC);

CREATE INDEX idx_upe_user ON user_progression_events(user_id, created_at_ms);

CREATE INDEX idx_ust_user ON user_session_templates(user_id);

CREATE INDEX idx_period_log_user ON period_log(user_id, started_on);

CREATE INDEX idx_pwl_user ON pregnancy_weekly_log(user_id, week_number);

CREATE UNIQUE INDEX idx_entitlements_user_source_product
  ON entitlements (user_id, source, product_code);

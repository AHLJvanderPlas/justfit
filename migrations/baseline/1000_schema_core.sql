-- =============================================================================
-- JustFit — Core Schema Baseline
-- File: migrations/baseline/1000_schema_core.sql
--
-- Bootstrap order: run AFTER 1010_schema_training.sql
-- (execution_steps.exercise_id references exercises, which lives in 1010)
--
-- Covers (merged final state — no ALTER TABLE needed):
--   Identity & Auth   : users, auth_users, user_profile, user_contact,
--                       user_preferences, user_availability
--   Auth credentials  : passkey_credentials, password_reset_tokens,
--                       magic_link_tokens, auth_rate_limits
--   Check-in/Planning : daily_checkins, context_overrides, day_plans
--   Execution         : session_templates, executions, execution_steps
--   Commercial        : referral_codes, referrals, vouchers, entitlements,
--                       awards, user_awards
--   Audit & Ops       : deleted_users, app_events, feedback_items
--   Body & Cycle      : user_progression, user_progression_events,
--                       cycle_profile, period_log, pregnancy_weekly_log
--   Integrations      : strava_connections, strava_byo_credentials
--   Indexes           : all non-PK indexes
--
-- Derives from migrations: 0001 (initial), 0006–0009, 0013–0014, 0017–0019,
--   0022–0026, 0028, 0036, 0038–0042
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Identity & Auth
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id                       TEXT    PRIMARY KEY,
  status                   TEXT    NOT NULL DEFAULT 'active'
                             CHECK (status IN ('active','disabled','deleted')),
  created_at_ms            INTEGER NOT NULL,
  updated_at_ms            INTEGER NOT NULL,
  deleted_at_ms            INTEGER,
  primary_email            TEXT,
  primary_phone            TEXT,
  -- terms/privacy acceptance audit (migration 0023)
  accepted_terms_version   TEXT,
  accepted_terms_at_ms     INTEGER,
  accepted_privacy_version TEXT,
  accepted_privacy_at_ms   INTEGER,

  CHECK (primary_email IS NULL OR length(primary_email) <= 320),
  CHECK (primary_phone IS NULL OR length(primary_phone) <= 32)
) STRICT;

CREATE TABLE IF NOT EXISTS auth_users (
  id               TEXT    PRIMARY KEY,
  user_id          TEXT    NOT NULL,
  provider         TEXT    NOT NULL DEFAULT 'password'
                     CHECK (provider IN ('password','magic_link','oauth_google','oauth_apple','oauth_other')),
  provider_subject TEXT,
  email            TEXT,
  email_verified   INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1)),
  phone            TEXT,
  phone_verified   INTEGER NOT NULL DEFAULT 0 CHECK (phone_verified IN (0,1)),
  password_hash    TEXT,
  password_algo    TEXT,
  last_login_at_ms INTEGER,
  created_at_ms    INTEGER NOT NULL,
  updated_at_ms    INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (email IS NULL OR length(email) <= 320),
  CHECK (phone IS NULL OR length(phone) <= 32),
  CHECK (provider_subject IS NULL OR length(provider_subject) <= 512)
) STRICT;

-- Merged: 0008 added sex/weight_kg; 0013 added height_cm.
CREATE TABLE IF NOT EXISTS user_profile (
  user_id       TEXT    PRIMARY KEY,
  display_name  TEXT,
  given_name    TEXT,
  family_name   TEXT,
  birth_date    TEXT,                       -- ISO8601 'YYYY-MM-DD'
  sex           TEXT    CHECK (sex IN ('male','female','intersex','unspecified')),
  height_cm     REAL    CHECK (height_cm IS NULL OR (height_cm >= 50  AND height_cm <= 260)),
  weight_kg     REAL    CHECK (weight_kg IS NULL OR (weight_kg >= 20  AND weight_kg <= 400)),
  baseline_json TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (display_name IS NULL OR length(display_name) <= 128),
  CHECK (given_name   IS NULL OR length(given_name)   <= 128),
  CHECK (family_name  IS NULL OR length(family_name)  <= 128),
  CHECK (baseline_json IS NULL OR json_valid(baseline_json))
) STRICT;

CREATE TABLE IF NOT EXISTS user_contact (
  user_id        TEXT    PRIMARY KEY,
  email          TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0,1)),
  phone          TEXT,
  phone_verified INTEGER NOT NULL DEFAULT 0 CHECK (phone_verified IN (0,1)),
  country_code   TEXT,
  locale         TEXT,
  timezone       TEXT,
  created_at_ms  INTEGER NOT NULL,
  updated_at_ms  INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (email IS NULL OR length(email) <= 320),
  CHECK (phone IS NULL OR length(phone) <= 32),
  CHECK (country_code IS NULL OR length(country_code) BETWEEN 2 AND 3),
  CHECK (locale IS NULL OR length(locale) <= 16),
  CHECK (timezone IS NULL OR length(timezone) <= 64)
) STRICT;

-- preferences_json holds all extended prefs (sport_prefs, coach state, chronic_injury_areas,
-- equipment, polarised_training_enabled, military_coach, run_coach, cycling_coach, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id              TEXT    PRIMARY KEY,
  units                TEXT    NOT NULL DEFAULT 'metric' CHECK (units IN ('metric','imperial')),
  training_goal        TEXT    CHECK (training_goal IN ('fat_loss','muscle_gain','endurance','strength','health','mobility','mixed')),
  experience_level     TEXT    CHECK (experience_level IN ('beginner','intermediate','advanced')),
  intensity_pref       INTEGER CHECK (intensity_pref IS NULL OR (intensity_pref >= 1 AND intensity_pref <= 10)),
  session_duration_min INTEGER CHECK (session_duration_min IS NULL OR (session_duration_min >= 5 AND session_duration_min <= 180)),
  days_per_week_target INTEGER CHECK (days_per_week_target IS NULL OR (days_per_week_target >= 1 AND days_per_week_target <= 7)),
  preferences_json     TEXT,
  created_at_ms        INTEGER NOT NULL,
  updated_at_ms        INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (preferences_json IS NULL OR json_valid(preferences_json))
) STRICT;

CREATE TABLE IF NOT EXISTS user_availability (
  user_id           TEXT    PRIMARY KEY,
  availability_json TEXT    NOT NULL,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(availability_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- Auth credentials & tokens
-- ---------------------------------------------------------------------------

-- Merged: 0006 created table; 0007 added counter, backed_up, transports.
CREATE TABLE IF NOT EXISTS passkey_credentials (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL REFERENCES users(id),
  credential_id   TEXT    NOT NULL UNIQUE,
  public_key      TEXT    NOT NULL,             -- SPKI base64url, ES256 (alg -7)
  algorithm       INTEGER NOT NULL DEFAULT -7,  -- -7 = ES256
  device_type     TEXT,
  counter         INTEGER NOT NULL DEFAULT 0,
  backed_up       INTEGER NOT NULL DEFAULT 0,
  transports      TEXT,
  created_at_ms   INTEGER NOT NULL,
  last_used_at_ms INTEGER,
  updated_at_ms   INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_pk_user ON passkey_credentials(user_id);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token         TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT    NOT NULL,
  expires_at_ms INTEGER NOT NULL,   -- 1-hour expiry
  used_at_ms    INTEGER,            -- NULL = unused
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens(email);

-- Merged: 0007 created table; 0019 added purpose, new_email, code.
CREATE TABLE IF NOT EXISTS magic_link_tokens (
  token         TEXT    PRIMARY KEY,
  user_id       TEXT,               -- NULL if email not yet registered
  email         TEXT    NOT NULL,
  expires_at_ms INTEGER NOT NULL,   -- 15-min expiry
  used_at_ms    INTEGER,            -- NULL = unused
  created_at_ms INTEGER NOT NULL,
  purpose       TEXT    NOT NULL DEFAULT 'login',  -- 'login' | 'verify' | 'change_email'
  new_email     TEXT,
  code          TEXT
) STRICT;

CREATE INDEX IF NOT EXISTS idx_mlt_email ON magic_link_tokens(email);
CREATE INDEX IF NOT EXISTS idx_mlt_code  ON magic_link_tokens(code);

-- Sliding-window rate limiting for login/reset/verify endpoints (migration 0022).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket          TEXT    PRIMARY KEY,
  count           INTEGER NOT NULL DEFAULT 0,
  window_start_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON auth_rate_limits(window_start_ms);

-- ---------------------------------------------------------------------------
-- Check-in & Planning
-- ---------------------------------------------------------------------------

-- UNIQUE(user_id, date) added in migration 0018.
CREATE TABLE IF NOT EXISTS daily_checkins (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  date          TEXT    NOT NULL,               -- 'YYYY-MM-DD' local date
  mood          INTEGER CHECK (mood     IS NULL OR (mood     >= 1 AND mood     <= 10)),
  energy        INTEGER CHECK (energy   IS NULL OR (energy   >= 1 AND energy   <= 10)),
  soreness      INTEGER CHECK (soreness IS NULL OR (soreness >= 0 AND soreness <= 10)),
  sleep_hours   REAL    CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  stress        INTEGER CHECK (stress   IS NULL OR (stress   >= 1 AND stress   <= 10)),
  weight_kg     REAL    CHECK (weight_kg IS NULL OR (weight_kg >= 20 AND weight_kg <= 400)),
  notes         TEXT,
  checkin_json  TEXT,                           -- JSON toggles: no_clothing, recovery_mode, etc.
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (checkin_json IS NULL OR json_valid(checkin_json))
) STRICT;

-- UNIQUE enforces one check-in per user per day; enables ON CONFLICT DO UPDATE upserts.
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(user_id, date);

CREATE TABLE IF NOT EXISTS context_overrides (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  date          TEXT    NOT NULL,               -- 'YYYY-MM-DD'
  override_type TEXT    NOT NULL
                  CHECK (override_type IN ('time','intensity','equipment','injury','skip','other')),
  override_json TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(override_json))
) STRICT;

CREATE TABLE IF NOT EXISTS day_plans (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL,
  date            TEXT    NOT NULL,             -- 'YYYY-MM-DD'
  plan_status     TEXT    NOT NULL DEFAULT 'draft'
                    CHECK (plan_status IN ('draft','final','skipped','archived')),
  plan_json       TEXT    NOT NULL,             -- {session_name, slot_type, steps[], rule_trace[]}
  generated_by    TEXT    NOT NULL DEFAULT 'engine',
  engine_version  TEXT,
  seed            TEXT,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(plan_json))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_day_plans_user_date ON day_plans(user_id, date);

-- ---------------------------------------------------------------------------
-- Execution
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS session_templates (
  id            TEXT    PRIMARY KEY,
  slug          TEXT,
  name          TEXT    NOT NULL,
  description   TEXT,
  session_type  TEXT    NOT NULL
                  CHECK (session_type IN ('workout','bike','run','walk','mobility','recovery','mixed')),
  difficulty    TEXT    CHECK (difficulty IN ('easy','moderate','hard')),
  duration_min  INTEGER CHECK (duration_min IS NULL OR (duration_min >= 5 AND duration_min <= 240)),
  template_json TEXT    NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  CHECK (slug IS NULL OR length(slug) <= 128),
  CHECK (json_valid(template_json))
) STRICT;

-- Final state from migration 0041 (table recreated without execution_type CHECK constraint).
-- Includes TSS columns (0036) and Strava columns (0039), merged into this definition.
-- Note: FKs to day_plans and session_templates were dropped in 0041 recreation.
CREATE TABLE IF NOT EXISTS executions (
  id                   TEXT    PRIMARY KEY,
  user_id              TEXT    NOT NULL,
  date                 TEXT,                   -- 'YYYY-MM-DD'
  day_plan_id          TEXT,
  session_template_id  TEXT,
  execution_type       TEXT    NOT NULL DEFAULT 'workout',
                       -- open-ended: workout|bike|run|walk|mobility|recovery|mixed|
                       --   cycling_coach|run_coach|cycling_cross_run|bonus|strava_*
  status               TEXT    NOT NULL DEFAULT 'completed'
                         CHECK (status IN ('planned','in_progress','completed','abandoned')),
  started_at_ms        INTEGER,
  ended_at_ms          INTEGER,
  total_duration_sec   INTEGER CHECK (total_duration_sec IS NULL OR total_duration_sec >= 0),
  total_distance_m     REAL    CHECK (total_distance_m  IS NULL OR total_distance_m  >= 0),
  total_energy_kcal    REAL    CHECK (total_energy_kcal IS NULL OR total_energy_kcal >= 0),
  avg_hr_bpm           REAL    CHECK (avg_hr_bpm        IS NULL OR avg_hr_bpm        >= 0),
  perceived_exertion   INTEGER CHECK (perceived_exertion IS NULL OR
                                      (perceived_exertion >= 1 AND perceived_exertion <= 10)),
  notes                TEXT,
  execution_json       TEXT,
  created_at_ms        INTEGER NOT NULL,
  updated_at_ms        INTEGER NOT NULL,
  tss_planned          REAL,   -- pre-computed TSS at plan time (cycling coach)
  tss_actual           REAL,   -- RPE-adjusted or power-derived TSS
  tss_source           TEXT,   -- 'rpe_estimated'|'power_actual'|'strava_power'|'strava_estimated'
  strava_activity_id   INTEGER,
  strava_metadata_json TEXT,   -- {name, type, distance, elevation, ...} for history display

  CHECK (execution_json IS NULL OR json_valid(execution_json))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_executions_user_date
  ON executions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_executions_user_started
  ON executions(user_id, started_at_ms);

-- Partial unique index: one import per (user, strava activity).
CREATE UNIQUE INDEX IF NOT EXISTS idx_executions_strava
  ON executions(user_id, strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;

-- exercise_id FK: references exercises(id) from 1010_schema_training.sql.
-- Run 1010 before 1000 (or omit FK enforcement; SQLite does not enforce FKs by default).
CREATE TABLE IF NOT EXISTS execution_steps (
  id              TEXT    PRIMARY KEY,
  execution_id    TEXT    NOT NULL,
  step_index      INTEGER NOT NULL CHECK (step_index >= 0),
  step_type       TEXT    NOT NULL
                    CHECK (step_type IN ('exercise','interval','rest','note','block')),
  exercise_id     TEXT,                        -- FK → exercises(id) ON DELETE SET NULL
  prescribed_json TEXT,
  actual_json     TEXT,
  started_at_ms   INTEGER,
  ended_at_ms     INTEGER,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL,

  FOREIGN KEY (execution_id) REFERENCES executions(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (prescribed_json IS NULL OR json_valid(prescribed_json)),
  CHECK (actual_json     IS NULL OR json_valid(actual_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- Commercial
-- ---------------------------------------------------------------------------

-- Note: referral_codes is NOT STRICT and references users(user_id) — a legacy
-- bug in production (users PK is 'id', not 'user_id'). Reproduced as-is.
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id TEXT PRIMARY KEY REFERENCES users(user_id),
  code    TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS referrals (
  id               TEXT    PRIMARY KEY,
  referrer_user_id TEXT    NOT NULL,
  referred_user_id TEXT,
  code             TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'issued'
                     CHECK (status IN ('issued','clicked','signed_up','qualified','rewarded','expired','canceled')),
  issued_at_ms     INTEGER NOT NULL,
  signed_up_at_ms  INTEGER,
  rewarded_at_ms   INTEGER,
  meta_json        TEXT,
  created_at_ms    INTEGER NOT NULL,
  updated_at_ms    INTEGER NOT NULL,

  FOREIGN KEY (referrer_user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,

  CHECK (length(code) BETWEEN 4 AND 64),
  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

CREATE TABLE IF NOT EXISTS vouchers (
  id                TEXT    PRIMARY KEY,
  code              TEXT    NOT NULL,
  voucher_type      TEXT    NOT NULL
                      CHECK (voucher_type IN ('percent','fixed','trial_days','entitlement_product','other')),
  status            TEXT    NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','redeemed','expired','disabled')),
  max_redemptions   INTEGER CHECK (max_redemptions IS NULL OR max_redemptions >= 1),
  redemption_count  INTEGER NOT NULL DEFAULT 0 CHECK (redemption_count >= 0),
  valid_from_ms     INTEGER,
  valid_to_ms       INTEGER,
  payload_json      TEXT    NOT NULL,
  created_by        TEXT,
  created_at_ms     INTEGER NOT NULL,
  updated_at_ms     INTEGER NOT NULL,

  CHECK (length(code) BETWEEN 4 AND 64),
  CHECK (json_valid(payload_json))
) STRICT;

CREATE TABLE IF NOT EXISTS entitlements (
  id           TEXT    PRIMARY KEY,
  user_id      TEXT    NOT NULL,
  product_code TEXT    NOT NULL,
  source       TEXT    NOT NULL DEFAULT 'manual'
                 CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other')),
  status       TEXT    NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','trialing','grace','canceled','expired')),
  starts_at_ms INTEGER NOT NULL,
  ends_at_ms   INTEGER,
  renews_at_ms INTEGER,
  external_ref TEXT,
  meta_json    TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (length(product_code) <= 128),
  CHECK (external_ref IS NULL OR length(external_ref) <= 256),
  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

CREATE TABLE IF NOT EXISTS awards (
  id            TEXT    PRIMARY KEY,
  slug          TEXT    NOT NULL,
  name          TEXT    NOT NULL,
  description   TEXT,
  category      TEXT    CHECK (category IN ('streak','milestone','performance','habit','special')),
  icon          TEXT,
  criteria_json TEXT    NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  CHECK (length(slug) BETWEEN 1 AND 128),
  CHECK (json_valid(criteria_json))
) STRICT;

CREATE TABLE IF NOT EXISTS user_awards (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    NOT NULL,
  award_id      TEXT    NOT NULL,
  awarded_at_ms INTEGER NOT NULL,
  source        TEXT    NOT NULL DEFAULT 'engine'
                  CHECK (source IN ('engine','admin','import','other')),
  meta_json     TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,

  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (award_id) REFERENCES awards(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (meta_json IS NULL OR json_valid(meta_json))
) STRICT;

-- ---------------------------------------------------------------------------
-- Audit & Ops
-- ---------------------------------------------------------------------------

-- GDPR Art.17 erasure audit log. email_hash = SHA-256 hex of primary_email.
CREATE TABLE IF NOT EXISTS deleted_users (
  id               TEXT    PRIMARY KEY,   -- original users.id
  email_hash       TEXT    NOT NULL,
  requested_by_ip  TEXT,
  deleted_at_ms    INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_deleted_users_at ON deleted_users(deleted_at_ms);

CREATE TABLE IF NOT EXISTS app_events (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    REFERENCES users(id) ON DELETE SET NULL,
  user_email    TEXT,
  event_type    TEXT    NOT NULL,
  detail        TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_events_created_at_ms
  ON app_events(created_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_app_events_type_created
  ON app_events(event_type, created_at_ms DESC);

CREATE TABLE IF NOT EXISTS feedback_items (
  id            TEXT    PRIMARY KEY,
  user_id       TEXT    REFERENCES users(id) ON DELETE SET NULL,
  user_email    TEXT,
  event_type    TEXT    NOT NULL DEFAULT 'feedback',
  message       TEXT    NOT NULL,
  status        TEXT    NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new','discard','react','fix','roadmap','resolved')),
  flagged       INTEGER NOT NULL DEFAULT 0,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS idx_feedback_items_created
  ON feedback_items(created_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_items_flagged
  ON feedback_items(flagged, created_at_ms ASC);

-- ---------------------------------------------------------------------------
-- Body & Cycle
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_progression (
  user_id             TEXT    PRIMARY KEY,
  scores_json         TEXT    NOT NULL,   -- {push, pull, legs, core, conditioning, mobility}
  sport_scores_json   TEXT,              -- {running, cycling, ...} (optional)
  last_computed_at_ms INTEGER NOT NULL,
  created_at_ms       INTEGER NOT NULL,
  updated_at_ms       INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (json_valid(scores_json)),
  CHECK (sport_scores_json IS NULL OR json_valid(sport_scores_json))
) STRICT;

CREATE TABLE IF NOT EXISTS user_progression_events (
  id                 TEXT    PRIMARY KEY,
  user_id            TEXT    NOT NULL,
  execution_id       TEXT,               -- NULL for decay/recompute events
  event_type         TEXT    NOT NULL    CHECK (event_type IN ('workout','decay','recompute')),
  scores_before_json TEXT,
  scores_after_json  TEXT,
  stimulus_json      TEXT,
  created_at_ms      INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,

  CHECK (scores_before_json IS NULL OR json_valid(scores_before_json)),
  CHECK (scores_after_json  IS NULL OR json_valid(scores_after_json)),
  CHECK (stimulus_json      IS NULL OR json_valid(stimulus_json))
) STRICT;

-- Merged: 0008 created table; 0009 added mode, pregnancy, postnatal columns; 0056 added perimenopause.
CREATE TABLE IF NOT EXISTS cycle_profile (
  user_id                       TEXT    PRIMARY KEY
                                  REFERENCES users(id) ON DELETE CASCADE,
  tracking_mode                 TEXT    NOT NULL DEFAULT 'smart'
                                  CHECK (tracking_mode IN ('smart','simple','off')),
  cycle_length_days             INTEGER DEFAULT 28
                                  CHECK (cycle_length_days IS NULL OR
                                        (cycle_length_days >= 21 AND cycle_length_days <= 45)),
  last_period_start             TEXT,   -- 'YYYY-MM-DD'
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

CREATE TABLE IF NOT EXISTS period_log (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_on  TEXT    NOT NULL,   -- 'YYYY-MM-DD'
  noted_at_ms INTEGER NOT NULL,
  source      TEXT    DEFAULT 'checkin'  -- 'checkin' | 'manual'
);

CREATE INDEX IF NOT EXISTS idx_period_log_user ON period_log(user_id, started_on);

CREATE TABLE IF NOT EXISTS pregnancy_weekly_log (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number     INTEGER NOT NULL,
  week_start_date TEXT    NOT NULL,
  avg_energy      REAL,
  avg_nausea      REAL,
  avg_breathless  REAL,
  sessions_done   INTEGER DEFAULT 0,
  notes           TEXT,
  created_at_ms   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pwl_user ON pregnancy_weekly_log(user_id, week_number);

-- ---------------------------------------------------------------------------
-- Integrations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS strava_connections (
  id              TEXT    PRIMARY KEY,
  user_id         TEXT    NOT NULL REFERENCES users(id),
  athlete_id      INTEGER NOT NULL,
  access_token    TEXT    NOT NULL,
  refresh_token   TEXT    NOT NULL,
  expires_at_ms   INTEGER NOT NULL,
  scope           TEXT,
  athlete_name    TEXT,
  athlete_city    TEXT,
  athlete_pic_url TEXT,
  connected_at_ms INTEGER NOT NULL,
  last_sync_at_ms INTEGER,
  created_at_ms   INTEGER NOT NULL,
  updated_at_ms   INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_strava_connections_user
  ON strava_connections(user_id);

-- BYO Strava credentials kept separate from user_preferences to prevent
-- accidental exposure via profile/export endpoints (migration 0042).
CREATE TABLE IF NOT EXISTS strava_byo_credentials (
  user_id       TEXT    NOT NULL PRIMARY KEY,
  client_id     TEXT    NOT NULL,
  client_secret TEXT    NOT NULL,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;

-- support_tokens — time-limited support access tokens (legacy table, no STRICT, no _at_ms suffix)
CREATE TABLE IF NOT EXISTS support_tokens (
  token      TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

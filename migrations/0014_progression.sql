-- Migration 0014 — Progression tracking
-- Adds two tables: user_progression (current state snapshot) and
-- user_progression_events (audit trail for gain/decay events).
--
-- scores_json structure:
--   {
--     push:         { power: 15, endurance: 15, baseline: 15,
--                     last_power_stimulus_at_ms: null,
--                     last_endurance_stimulus_at_ms: null },
--     pull:         { ... },
--     legs:         { ... },
--     core:         { ... },
--     conditioning: { ... },
--     mobility:     { mobility: 15, baseline: 15, last_mobility_stimulus_at_ms: null }
--   }
--
-- sport_scores_json structure (optional, only when sport prefs enabled):
--   {
--     running:  { base: 15, threshold: 15, intervals: 15, baseline: 15, last_stimulus_at_ms: null },
--     cycling:  { ... },
--     ...
--   }

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

-- Audit trail: one row per event that changed progression state.
-- event_type:
--   'workout'   — stimulus from a completed execution
--   'decay'     — periodic decay sweep (future cron use)
--   'recompute' — full rebuild from history (admin/debug)
CREATE TABLE user_progression_events (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  execution_id         TEXT,                       -- NULL for decay / recompute events
  event_type           TEXT NOT NULL,              -- 'workout' | 'decay' | 'recompute'
  scores_before_json   TEXT,                       -- snapshot before event
  scores_after_json    TEXT,                       -- snapshot after event
  stimulus_json        TEXT,                       -- what was applied (for 'workout' events)
  created_at_ms        INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (event_type IN ('workout','decay','recompute')),
  CHECK (scores_before_json IS NULL OR json_valid(scores_before_json)),
  CHECK (scores_after_json  IS NULL OR json_valid(scores_after_json)),
  CHECK (stimulus_json      IS NULL OR json_valid(stimulus_json))
) STRICT;

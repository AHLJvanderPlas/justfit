-- Migration 0100: Fitness assessments
--
-- user_progression has always been inferred: sessions grant stimulus, inactivity
-- decays it. Nothing was ever measured, and `baseline` — the per-axis decay floor
-- in scores_json — was hardcoded to 0 for every user and written by no code path.
-- Decay therefore drained toward zero, and new users had no meaningful shape until
-- roughly ten sessions.
--
-- This table stores the result of a short self-administered test battery. Its output
-- is written back into user_progression.scores_json as a personal baseline, so the
-- existing radar and planner keep working unchanged — this calibrates that model
-- rather than adding a second one.
--
-- Named "assessment", not "check-in": daily_checkins already owns that word for the
-- daily mood/energy modal.

CREATE TABLE fitness_assessments (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  date           TEXT NOT NULL,          -- YYYY-MM-DD, local to the user
  focus          TEXT NOT NULL,          -- all_round | upper | lower | stamina | power
  results_json   TEXT NOT NULL,          -- [{test_id, raw, variant, score}]
  scores_json    TEXT NOT NULL,          -- {axis: 0-100}
  created_at_ms  INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_fitness_assessments_user
  ON fitness_assessments(user_id, created_at_ms DESC);

-- ── Allow 'assessment' as a progression event type ───────────────────────────
-- user_progression_events.event_type carries CHECK (event_type IN
-- ('workout','decay','recompute')). An assessment is neither, and inserting one
-- inside the same DB.batch as the assessment row would fail the whole save.
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt. It is an
-- append-only log with no dependents and 13 rows in production at time of writing.

CREATE TABLE user_progression_events_new (
  id                   TEXT PRIMARY KEY,
  user_id              TEXT NOT NULL,
  execution_id         TEXT,                       -- NULL for decay / recompute / assessment
  event_type           TEXT NOT NULL,              -- 'workout' | 'decay' | 'recompute' | 'assessment'
  scores_before_json   TEXT,
  scores_after_json    TEXT,
  stimulus_json        TEXT,
  created_at_ms        INTEGER NOT NULL,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CHECK (event_type IN ('workout','decay','recompute','assessment')),
  CHECK (scores_before_json IS NULL OR json_valid(scores_before_json)),
  CHECK (scores_after_json  IS NULL OR json_valid(scores_after_json)),
  CHECK (stimulus_json      IS NULL OR json_valid(stimulus_json))
) STRICT;

INSERT INTO user_progression_events_new
  (id, user_id, execution_id, event_type, scores_before_json, scores_after_json, stimulus_json, created_at_ms)
SELECT id, user_id, execution_id, event_type, scores_before_json, scores_after_json, stimulus_json, created_at_ms
  FROM user_progression_events;

DROP TABLE user_progression_events;
ALTER TABLE user_progression_events_new RENAME TO user_progression_events;
CREATE INDEX IF NOT EXISTS idx_upe_user ON user_progression_events(user_id, created_at_ms);

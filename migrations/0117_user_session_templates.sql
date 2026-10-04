-- 0117 — user_session_templates: the user's own saved trainings (W4.3).
--
-- W4.1 lets a user replace today's session with one they built from the
-- library (POST /api/plan with custom_steps, stored as generated_by='user').
-- That is a one-off. This table turns it into a habit: a named session the user
-- can reuse with one tap from the Today card or "Mijn trainingen" on the Coach
-- tab (GET/POST/DELETE /api/my-sessions).
--
-- A template stores only what the user chose — exercise_id plus the clamped
-- sets / target_reps | target_duration_sec / rest_sec — never a full plan step.
-- Installing a template goes back through POST /api/plan custom_steps, so the
-- library check, clamping, the advisory safety pass, the R539/pregnancy
-- acknowledgement and overwrite protection all run at use time, against the
-- athlete's state on THAT day, not the day the template was saved.
--
--   steps_json   JSON array, 1–20 × { exercise_id, sets, target_reps?,
--                target_duration_sec?, rest_sec? }
--   est_minutes  computed server-side with the same arithmetic as the client's
--                estimateMins, so the list can show it without the library
--
-- Max 30 templates per user, enforced by the endpoint. Additive only.
CREATE TABLE user_session_templates (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL,
  name          TEXT NOT NULL,
  steps_json    TEXT NOT NULL,
  est_minutes   INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX idx_ust_user ON user_session_templates(user_id);

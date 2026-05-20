-- Migration 0065: custom_exercises table (P1D)

CREATE TABLE custom_exercises (
  id                    TEXT PRIMARY KEY,
  gym_id                TEXT NOT NULL REFERENCES gyms(id),
  created_by_user_id    TEXT NOT NULL,
  name                  TEXT NOT NULL,
  instructions_markdown TEXT,
  primary_muscles_json  TEXT,   -- string[]
  secondary_muscles_json TEXT,  -- string[]
  equipment_required_json TEXT, -- string[]
  contraindications_json  TEXT, -- string[]
  exercise_type         TEXT CHECK (exercise_type IN ('strength','cardio','mobility','skill')),
  difficulty            INTEGER CHECK (difficulty BETWEEN 1 AND 5),
  image_r2_key          TEXT,
  video_r2_key          TEXT,
  visibility            TEXT NOT NULL DEFAULT 'private_gym'
                          CHECK (visibility IN ('private_gym','public_proposal','public_approved')),
  is_active             INTEGER NOT NULL DEFAULT 1,
  created_at_ms         INTEGER NOT NULL,
  updated_at_ms         INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_ce_gym    ON custom_exercises(gym_id, is_active);
CREATE INDEX idx_ce_type   ON custom_exercises(exercise_type);

-- Migration 0064: client_intake table (P1C)

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

CREATE INDEX idx_ci_gym  ON client_intake(gym_id);
CREATE INDEX idx_ci_user ON client_intake(user_id);

-- Migration 0063: audit_log table (P1A)

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

CREATE INDEX idx_al_gym       ON audit_log(gym_id, created_at_ms);
CREATE INDEX idx_al_actor     ON audit_log(actor_user_id, created_at_ms);
CREATE INDEX idx_al_target    ON audit_log(target_type, target_id);

CREATE TABLE IF NOT EXISTS app_events (
  id            TEXT PRIMARY KEY,
  user_id       TEXT REFERENCES users(id) ON DELETE SET NULL,
  user_email    TEXT,
  event_type    TEXT NOT NULL,
  detail        TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_app_events_created_at_ms ON app_events(created_at_ms DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_type_created ON app_events(event_type, created_at_ms DESC);


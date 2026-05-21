-- Waitlist for marketing email capture
CREATE TABLE IF NOT EXISTS waitlist (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL UNIQUE,
  source     TEXT    NOT NULL DEFAULT 'marketing',
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

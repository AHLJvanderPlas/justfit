-- Push subscription storage for Web Push notifications.
-- Subscriptions are device-specific; one user may have multiple.
-- Actual notification dispatch requires a separate Cloudflare Cron Worker
-- (CF Pages Functions cannot be scheduled).

CREATE TABLE IF NOT EXISTS push_subscriptions (
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

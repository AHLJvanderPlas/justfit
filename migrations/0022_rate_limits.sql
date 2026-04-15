-- Auth rate limiting: sliding-window counters (bucket → count in current window)
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start_ms INTEGER NOT NULL
) STRICT;

-- Migration 0060: rate limiting table for admin auth endpoints
-- Tracks login + magic-link attempts per IP to prevent brute-force attacks.
-- Entries older than 1 hour are lazily cleaned up by the auth module.

CREATE TABLE IF NOT EXISTS admin_login_attempts (
  id       TEXT    NOT NULL PRIMARY KEY,
  ip       TEXT    NOT NULL,
  endpoint TEXT    NOT NULL,
  at_ms    INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_login_attempts_ip_ep_at
  ON admin_login_attempts(ip, endpoint, at_ms);

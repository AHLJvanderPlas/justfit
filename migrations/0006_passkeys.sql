-- Migration 0006: Add passkey_credentials table for WebAuthn / Face ID / Touch ID

CREATE TABLE passkey_credentials (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  algorithm INTEGER NOT NULL DEFAULT -7,
  device_type TEXT,
  created_at_ms INTEGER NOT NULL,
  last_used_at_ms INTEGER,
  updated_at_ms INTEGER NOT NULL
) STRICT;

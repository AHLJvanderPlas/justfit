-- Migration 0007: DB-backed single-use token tables + passkey counter

-- ─── passkey_credentials: add missing security columns ───────────────────────
ALTER TABLE passkey_credentials ADD COLUMN counter INTEGER NOT NULL DEFAULT 0;
ALTER TABLE passkey_credentials ADD COLUMN backed_up INTEGER NOT NULL DEFAULT 0;
ALTER TABLE passkey_credentials ADD COLUMN transports TEXT;
CREATE INDEX IF NOT EXISTS idx_pk_user ON passkey_credentials(user_id);

-- ─── password_reset_tokens ────────────────────────────────────────────────────
CREATE TABLE password_reset_tokens (
  token         TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms    INTEGER,
  created_at_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_prt_email ON password_reset_tokens(email);

-- ─── magic_link_tokens ───────────────────────────────────────────────────────
CREATE TABLE magic_link_tokens (
  token         TEXT PRIMARY KEY,
  user_id       TEXT,           -- NULL if email not yet registered
  email         TEXT NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms    INTEGER,
  created_at_ms INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS idx_mlt_email ON magic_link_tokens(email);

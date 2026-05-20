-- Migration 0059: admin magic link tokens for passwordless admin portal login
CREATE TABLE admin_magic_tokens (
  token       TEXT    PRIMARY KEY,
  email       TEXT    NOT NULL,
  expires_at_ms INTEGER NOT NULL,
  used_at_ms  INTEGER,
  created_at_ms INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_admin_magic_tokens_email ON admin_magic_tokens (email, created_at_ms);

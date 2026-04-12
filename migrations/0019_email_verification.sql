-- Migration 0019: email verification + email change support
-- Extends magic_link_tokens with purpose, new_email, and numeric code columns.
-- email_verified already exists on auth_users (written as 0 on signup).

ALTER TABLE magic_link_tokens ADD COLUMN purpose TEXT NOT NULL DEFAULT 'login';
ALTER TABLE magic_link_tokens ADD COLUMN new_email TEXT;
ALTER TABLE magic_link_tokens ADD COLUMN code TEXT;

CREATE INDEX IF NOT EXISTS idx_mlt_code ON magic_link_tokens(code);

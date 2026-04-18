-- GDPR Art. 17 erasure audit log.
-- Stores a minimal, non-reversible record of deletion events.
-- email_hash is SHA-256 of the lowercased email — can confirm a past
-- deletion without storing PII post-erasure.
CREATE TABLE IF NOT EXISTS deleted_users (
  id              TEXT PRIMARY KEY,           -- original users.id (UUID)
  email_hash      TEXT NOT NULL,              -- SHA-256 hex of primary_email
  requested_by_ip TEXT,                       -- CF-Connecting-IP at delete time
  deleted_at_ms   INTEGER NOT NULL            -- Date.now() at deletion
) STRICT;

CREATE INDEX IF NOT EXISTS idx_deleted_users_at ON deleted_users(deleted_at_ms);

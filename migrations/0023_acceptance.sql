-- Migration 0023: Terms & Privacy acceptance audit fields
-- Tracks which version the user accepted and when.
-- Re-prompt fires when CURRENT_TERMS_VERSION / CURRENT_PRIVACY_VERSION bumps.

ALTER TABLE users ADD COLUMN accepted_terms_version   TEXT;
ALTER TABLE users ADD COLUMN accepted_terms_at_ms     INTEGER;
ALTER TABLE users ADD COLUMN accepted_privacy_version TEXT;
ALTER TABLE users ADD COLUMN accepted_privacy_at_ms   INTEGER;

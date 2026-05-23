-- Migration 0088: merge auth_users + user_contact into users
-- auth_users stored credential data (password_hash, email_verified, last_login_at_ms).
-- user_contact stored locale/timezone/country_code. Both are redundant splits with
-- no multi-provider OAuth ever built (only password + magic_link used provider column).
-- No live user data to migrate (no active accounts).

ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN password_algo TEXT;
ALTER TABLE users ADD COLUMN last_login_at_ms INTEGER;
ALTER TABLE users ADD COLUMN locale TEXT;
ALTER TABLE users ADD COLUMN timezone TEXT;
ALTER TABLE users ADD COLUMN country_code TEXT;

DROP TABLE IF EXISTS auth_users;
DROP TABLE IF EXISTS user_contact;

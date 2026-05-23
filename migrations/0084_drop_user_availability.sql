-- Migration 0084: drop user_availability
-- Table is never read by any API — the planner reads availability from
-- user_preferences.preferences_json. Only referenced in auth.js DELETE cleanup.
-- Code updated to remove that DELETE statement before applying this migration.

DROP TABLE IF EXISTS user_availability;

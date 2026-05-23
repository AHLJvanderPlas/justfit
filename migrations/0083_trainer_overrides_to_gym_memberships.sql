-- Migration 0083: move trainer_user_settings columns into gym_memberships
-- trainer_user_settings has UNIQUE(gym_id, user_id) — same cardinality as gym_memberships.
-- Merging removes a redundant table; overrides.js is updated to use gym_memberships directly.

ALTER TABLE gym_memberships ADD COLUMN goal_override TEXT;
ALTER TABLE gym_memberships ADD COLUMN intensity_modifier INTEGER DEFAULT 0;
ALTER TABLE gym_memberships ADD COLUMN training_days_json TEXT;

DROP TABLE IF EXISTS trainer_user_settings;

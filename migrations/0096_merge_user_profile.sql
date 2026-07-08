-- Migration 0096: Merge user_profile body columns into user_preferences
-- user_profile contained: sex, height_cm, weight_kg (display_name was never written).
-- user_profile is now redundant — all data moves to user_preferences so there is one
-- authoritative 1:1 preferences table per user.
--
-- Step 1 (this file): ADD columns + copy data. user_profile kept alive for safety.
-- Step 2 (migration 0097): DROP user_profile once all products are redeployed.

ALTER TABLE user_preferences ADD COLUMN sex       TEXT;
ALTER TABLE user_preferences ADD COLUMN height_cm REAL;
ALTER TABLE user_preferences ADD COLUMN weight_kg REAL;

-- Copy body data from user_profile where a preferences row exists
UPDATE user_preferences
SET
  sex       = (SELECT p.sex       FROM user_profile p WHERE p.user_id = user_preferences.user_id),
  height_cm = (SELECT p.height_cm FROM user_profile p WHERE p.user_id = user_preferences.user_id),
  weight_kg = (SELECT p.weight_kg FROM user_profile p WHERE p.user_id = user_preferences.user_id);

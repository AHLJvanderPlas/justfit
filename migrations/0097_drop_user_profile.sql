-- Migration 0097: Drop user_profile table
-- All columns (sex, height_cm, weight_kg) were copied to user_preferences in migration 0096.
-- All products have been redeployed to read/write from user_preferences only.
-- user_profile.display_name was never written by any code — always NULL in production.
-- user_profile.given_name, family_name, birth_date, baseline_json were never read or written.

DROP TABLE user_profile;

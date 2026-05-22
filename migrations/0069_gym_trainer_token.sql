-- Migration 0069: add trainer_token to gyms table for client invite links
-- trainer_token = permanent per-gym token used to generate invite URL: justfit.cc/join/<token>
ALTER TABLE gyms ADD COLUMN trainer_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_trainer_token ON gyms(trainer_token) WHERE trainer_token IS NOT NULL;

-- Backfill existing gyms: derive token from gym slug (safe, URL-friendly, unique)
UPDATE gyms SET trainer_token = lower(replace(replace(replace(
  substr(id, 1, 8) || '-' || substr(hex(randomblob(4)), 1, 8),
  ' ', ''), '-', ''), '_', ''))
WHERE trainer_token IS NULL;

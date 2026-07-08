-- Migration 0095: Drop stale columns from gyms table
-- These columns predate the current Mollie billing system (sub_tier / sub_status).
-- Both middlewares (app + trainer) and gyms.js have been updated to remove all
-- references to these columns. Deploy those code changes BEFORE applying this migration.
--
-- Dropped columns:
--   subscription_tier  — old tier: starter/pro/studio → replaced by sub_tier: starter/pro/gym
--   subscription_status — old status: active/trialing/suspended/cancelled → replaced by sub_status
--   type               — old gym type: solo/studio/gym (never used for gating, only display)
--
-- Kept columns:
--   trainer_token — actively used by connect.js (FIT-XXXXXX QR connect flow) and token.js

ALTER TABLE gyms DROP COLUMN subscription_tier;
ALTER TABLE gyms DROP COLUMN subscription_status;
ALTER TABLE gyms DROP COLUMN type;

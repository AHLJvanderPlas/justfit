-- Migration 0093: DB cleanup pass
-- 1. Drop strava_byo_credentials — 0 rows, BYO code path removed
-- 2. Add missing index on billing_events(user_id) — queried by Mollie webhook on every payment event

DROP TABLE IF EXISTS strava_byo_credentials;

CREATE INDEX IF NOT EXISTS idx_billing_events_user ON billing_events(user_id);

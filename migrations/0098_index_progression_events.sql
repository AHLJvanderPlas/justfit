-- Migration 0098: Index user_progression_events(user_id)
-- The table grows by one row per completed workout (plus decay/recompute events)
-- and is never pruned. It is deleted by user_id on GDPR account deletion
-- (auth.js handleDeleteAccount) which currently full-scans the table.
-- No read path exists today; the index also covers any future per-user reads.

CREATE INDEX IF NOT EXISTS idx_upe_user ON user_progression_events(user_id, created_at_ms);

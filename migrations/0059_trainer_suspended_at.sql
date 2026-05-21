-- Migration 0059: add suspended_at_ms to trainers for accurate churn tracking
-- Previously churn was approximated via updated_at_ms; this column is authoritative.
-- Existing suspended trainers will have NULL here (treated as pre-migration churn).

ALTER TABLE trainers ADD COLUMN suspended_at_ms INTEGER;

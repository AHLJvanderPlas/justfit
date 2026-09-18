-- 0109_platform_config.sql — A-E2: make operational thresholds changeable without a deploy.
--
-- EARLY_BIRD_CAP was a constant in subscribe.js, so raising or lowering the offer
-- meant a code change and a release. That is the wrong shape for a number the
-- business wants to move during a launch.
--
-- Deliberately a generic key/value table rather than a column per setting: the next
-- threshold should not need another migration.
CREATE TABLE IF NOT EXISTS platform_config (
  key           TEXT PRIMARY KEY,
  value         TEXT NOT NULL,
  description   TEXT,
  updated_at_ms INTEGER NOT NULL,
  updated_by    TEXT
) STRICT;

INSERT OR IGNORE INTO platform_config (key, value, description, updated_at_ms) VALUES
  ('consumer_early_bird_cap', '200', 'Consumer early-bird subscriptions available in total', CAST(strftime('%s','now') AS INTEGER) * 1000),
  ('trainer_early_bird_cap',  '50',  'Trainer early-bird subscriptions available in total',  CAST(strftime('%s','now') AS INTEGER) * 1000);

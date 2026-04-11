-- Add unique constraint on (user_id, date) for daily_checkins
-- Deduplicates any existing duplicate rows (keep most recent), then adds index.

DELETE FROM daily_checkins
WHERE rowid NOT IN (
  SELECT MAX(rowid)
  FROM daily_checkins
  GROUP BY user_id, date
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_checkins_user_date
  ON daily_checkins(user_id, date);

-- Index on auth_rate_limits.window_start_ms so old-bucket queries stay fast
-- and to support efficient periodic cleanup of expired windows.
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON auth_rate_limits(window_start_ms);

-- Indexes for the three most common user-scoped queries (each hit on app load).
CREATE INDEX IF NOT EXISTS idx_executions_user_date     ON executions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_day_plans_user_date      ON day_plans(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, date);

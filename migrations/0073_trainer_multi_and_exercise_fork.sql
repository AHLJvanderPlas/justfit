-- Migration 0073: multi-trainer client assignment + exercise fork provenance

-- Track which global exercise a custom exercise was forked from
ALTER TABLE custom_exercises ADD COLUMN parent_exercise_id TEXT;
ALTER TABLE custom_exercises ADD COLUMN source TEXT NOT NULL DEFAULT 'custom'
  CHECK (source IN ('custom','fork'));

-- Assign a specific trainer to a client within a gym
ALTER TABLE gym_memberships ADD COLUMN assigned_trainer_user_id TEXT;

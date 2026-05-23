-- Migration 0082: drop zombie tables from old trainer model (Tier 1 cleanup)
-- These tables were superseded by the gym/gym_memberships model (0060+) and
-- have zero live code references. No data loss — confirmed by full codebase grep.

DROP TABLE IF EXISTS trainer_auth;
DROP TABLE IF EXISTS trainer_magic_tokens;
DROP TABLE IF EXISTS trainer_sessions;
DROP TABLE IF EXISTS trainer_workouts;
DROP TABLE IF EXISTS trainer_schedules;
DROP TABLE IF EXISTS trainer_groups;
DROP TABLE IF EXISTS trainer_group_members;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS client_subscriptions;
DROP TABLE IF EXISTS support_tokens;

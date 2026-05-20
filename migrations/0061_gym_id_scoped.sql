-- Migration 0061: add gym_id column to all trainer-scoped tables (P1A)
-- Backfill from the gym created in 0060 for each row's trainer.

ALTER TABLE trainer_connections     ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_workouts        ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_schedules       ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_invoices        ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_user_settings   ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_notes           ADD COLUMN gym_id TEXT DEFAULT NULL;
ALTER TABLE trainer_groups          ADD COLUMN gym_id TEXT;
ALTER TABLE trainer_group_members   ADD COLUMN gym_id TEXT DEFAULT NULL;

-- trainer_notes may not exist yet if not in 0057; guard with IF NOT EXISTS equivalent:
-- (D1/SQLite: ALTER TABLE silently fails if column exists in some versions — add the guarded form)

-- Backfill trainer_connections
UPDATE trainer_connections SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Backfill trainer_workouts
UPDATE trainer_workouts SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Backfill trainer_schedules
UPDATE trainer_schedules SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Backfill trainer_invoices
UPDATE trainer_invoices SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Backfill trainer_user_settings
UPDATE trainer_user_settings SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Backfill trainer_groups
UPDATE trainer_groups SET gym_id = 'gym-' || trainer_id
WHERE gym_id IS NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tc_gym    ON trainer_connections(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_tw_gym    ON trainer_workouts(gym_id);
CREATE INDEX IF NOT EXISTS idx_ts_gym    ON trainer_schedules(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_ti_gym    ON trainer_invoices(gym_id, status);
CREATE INDEX IF NOT EXISTS idx_tus_gym   ON trainer_user_settings(gym_id);
CREATE INDEX IF NOT EXISTS idx_tg_gym    ON trainer_groups(gym_id);

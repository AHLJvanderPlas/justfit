-- 0044: Enforce global uniqueness on exercise_aliases.alias
--
-- Migration 0043 created the exercise_aliases table with a plain index on alias.
-- This migration adds a UNIQUE index to prevent ambiguous alias resolution.
-- The table is expected to be empty at this point (no alias data inserted yet).

CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_aliases_alias
  ON exercise_aliases (alias);

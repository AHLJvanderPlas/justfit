-- 0118 — schema_migrations: the database's own record of what was applied (F1).
--
-- Until now the only record of which migrations reached production was a
-- sentence in two CLAUDE.md files, kept by hand. `_migrations` exists but has
-- never held a row. Nothing compared what a migration was meant to do with what
-- it did: 0033 "applied" in April and inserted nothing — its INSERT OR IGNORE
-- swallowed a CHECK violation — and nobody noticed for six months.
--
-- From this migration on, scripts/migrate.mjs is the only way a migration
-- reaches D1. It writes one row here per file it applies and:
--   - refuses a filename that is already recorded (no double apply);
--   - refuses to run at all while any recorded file's sha256 differs from the
--     file on disk (applied migrations are append-only — enforced by the tool);
--   - records wrangler's rows_written for the run, and exits non-zero when a
--     file containing an INSERT wrote zero rows (the 0033 failure mode).
-- `node scripts/migrate.mjs status` compares every migrations/0*.sql with this
-- table; smoke runs it. Files before 0118 are recorded once by
-- `migrate.mjs baseline` (rows_written NULL, note 'baseline 2026-10-04') — a
-- record of the state found, not a reconstruction of history.
--
--   filename       basename, e.g. '0118_schema_migrations.sql'
--   sha256         hex digest of the file bytes at apply time
--   rows_written   summed rows_written from D1's response; NULL for baseline
--   applied_at_ms  Date.now() when the record was written
--   applied_by     who ran the tool (user@host)
--   note           why a record is unusual: baseline, bootstrap, --allow-empty
--                  reason, or a zero-row warning
--
-- Bootstrap: this file creates the table it is recorded in; migrate.mjs applies
-- it first and records it second. Additive only. `_migrations` is left alone.
CREATE TABLE schema_migrations (
  filename      TEXT PRIMARY KEY,
  sha256        TEXT NOT NULL,
  rows_written  INTEGER,
  applied_at_ms INTEGER NOT NULL,
  applied_by    TEXT,
  note          TEXT
) STRICT;

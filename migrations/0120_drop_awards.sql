-- Migration 0120: drop the dead awards tables (post-remediation assessment F7)
--
-- Decision (recorded): the CLIENT owns awards. AwardsView.jsx holds the award
-- definitions and evaluates them from history, progression and run distance; it
-- works, and nothing server-side ever depended on the D1 tables.
--
-- Measured 2026-10-04 on live D1 and in the code:
--   awards       12 rows (migration 0002 seed)   server reads of it:  0
--   user_awards   0 rows                          server writes to it: 0
--                 (only the account-deletion batch in functions/api/auth.js
--                 touched it, a DELETE of nothing — removed in the same release)
--   Migration 0033 seeded five running-milestone awards with category='running',
--   which violates awards.category's CHECK; INSERT OR IGNORE swallowed the
--   violation and it inserted nothing. Nothing noticed for six months because
--   nothing reads the table. That is the finding that justified scripts/migrate.mjs
--   and is the evidence that the table is dead, not a bug to be fixed by seeding.
--   The only FK into awards is user_awards.award_id, so user_awards drops first.
--
-- Not a seed: this file contains no INSERT, so migrate.mjs's zero-row check does
-- not apply and no --allow-empty flag is needed.
--
-- Release: node scripts/migrate.mjs apply migrations/0120_drop_awards.sql
-- Ship the functions/ change (auth.js no longer deletes from user_awards) BEFORE
-- or WITH this migration: an old auth.js against dropped tables would 500 every
-- account deletion.

DROP TABLE user_awards;
DROP TABLE awards;

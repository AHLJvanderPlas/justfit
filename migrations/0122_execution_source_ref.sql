-- 0122 — executions.source_ref: what a performed session was started FROM.
--
-- MANUAL_TRAINING_DESIGN.md §7. "Eigen training" lets a user reuse a saved
-- training (W4b, user_session_templates) and — phase 2 — a session from their
-- trainer's programme (assigned_sessions). The execution already records WHAT
-- was done; this records where it came from, so "what did I reuse" has an answer
-- and, in phase 2, the client can mark the trainer's assigned session completed
-- from the execution it produced.
--
--   source_ref   NULL for every engine / built-on-the-spot / logged session.
--                'template:<id>'          started from user_session_templates.id
--                'assigned_session:<id>'  started from assigned_sessions.id (phase 2)
--
-- The shape is validated by POST /api/execution (400 on anything else); it is a
-- reference, not a foreign key: a deleted template leaves the history intact.
-- Additive, nullable, no backfill — no existing execution was started from either.
-- executions is STRICT; TEXT is a declared STRICT type, so ADD COLUMN is allowed.

ALTER TABLE executions ADD COLUMN source_ref TEXT;

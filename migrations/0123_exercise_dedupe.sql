-- 0123 — deactivate two duplicate library rows (builder v1.3, BUILDER_UX_PLAN_2026-10.md §3).
--
-- Two display names appeared twice in the exercise picker because two rows each
-- carry the same name:
--   "4-7-8 Breathing"               4-7-8-breathing  (0 references)   478-breathing               (3 substitution references)
--   "Progressive Muscle Relaxation" progressive-muscle-relaxation (0) progressive-relaxation-body (3 substitution references)
-- Verified against live D1 on 2026-10-31: the two unreferenced slugs have 0 rows in
-- execution_steps, 0 in user_session_templates, 0 in program_template_items, 0 in
-- program_sessions and 0 substitution references. They are deactivated, not deleted:
-- the planner, the public library endpoint and the picker all filter is_active = 1,
-- and a row referenced later by id would still resolve.
UPDATE exercises
   SET is_active = 0, updated_at_ms = 1793483543000
 WHERE slug IN ('4-7-8-breathing', 'progressive-muscle-relaxation')
   AND is_active = 1;

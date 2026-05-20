// POST /api/client/assignments/:id/sessions/:sessionId/complete — complete an assigned session (P1E)
import { getUser } from '../../../../../../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../../../../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const assignmentId = params.id;
  const sessionId = params.sessionId;

  // Verify the assignment belongs to this user
  const assignment = await env.DB.prepare(
    `SELECT * FROM program_assignments WHERE id = ? AND client_user_id = ?`
  ).bind(assignmentId, user.userId).first();
  if (!assignment) return Response.json({ error: 'Assignment not found' }, { status: 404 });

  const assignedSession = await env.DB.prepare(
    `SELECT * FROM assigned_sessions WHERE id = ? AND program_assignment_id = ?`
  ).bind(sessionId, assignmentId).first();
  if (!assignedSession) return Response.json({ error: 'Session not found' }, { status: 404 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { execution_id, client_rpe, client_feedback } = body;

  const now = Date.now();
  // Mark assigned session as completed
  await env.DB.prepare(
    `UPDATE assigned_sessions SET status='completed', executed_session_id=COALESCE(?,executed_session_id), updated_at_ms=? WHERE id=?`
  ).bind(execution_id ?? null, now, sessionId).run();

  // Update execution with trainer/program link
  if (execution_id) {
    await env.DB.prepare(
      `UPDATE executions SET program_assignment_id=?, assigned_by_trainer_id=?,
       client_rpe=COALESCE(?,client_rpe), client_feedback=COALESCE(?,client_feedback),
       updated_at_ms=? WHERE id=?`
    ).bind(assignmentId, assignment.assigned_by_trainer_id,
           client_rpe ?? null, client_feedback ?? null, now, execution_id).run();
  }

  // Recompute adherence_pct
  const counts = await env.DB.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) AS completed_count,
            SUM(CASE WHEN scheduled_date <= date('now') AND status='scheduled' THEN 1 ELSE 0 END) AS due_count
     FROM assigned_sessions WHERE program_assignment_id = ?`
  ).bind(assignmentId).first();
  const due = (counts?.completed_count ?? 0) + (counts?.due_count ?? 0);
  const adherencePct = due > 0 ? ((counts?.completed_count ?? 0) / due) * 100 : 0;
  await env.DB.prepare(
    `UPDATE program_assignments SET adherence_pct=?, updated_at_ms=? WHERE id=?`
  ).bind(Math.round(adherencePct * 10) / 10, now, assignmentId).run();

  await writeAudit({ gymId: assignment.gym_id, actorUserId: user.userId, action: ACTIONS.SESSION_COMPLETED,
    targetType: 'assigned_session', targetId: sessionId,
    payload: { execution_id, client_rpe, adherence_pct: adherencePct }, request, env });

  return Response.json({ ok: true, adherence_pct: Math.round(adherencePct * 10) / 10 });
}

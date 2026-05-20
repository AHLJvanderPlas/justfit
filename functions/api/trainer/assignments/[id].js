// GET/PUT /api/trainer/assignments/:id — fetch or update a program assignment (P1E)
import { requireGymContext } from '../../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;
  const { id } = params;

  const assignment = await env.DB.prepare(
    `SELECT * FROM program_assignments WHERE id = ? AND gym_id = ?`
  ).bind(id, gymId).first();
  if (!assignment) return Response.json({ error: 'Not found' }, { status: 404 });

  if (request.method === 'GET') {
    const sessions = await env.DB.prepare(
      `SELECT * FROM assigned_sessions WHERE program_assignment_id = ? ORDER BY scheduled_date`
    ).bind(id).all();
    return Response.json({ ...assignment, sessions: sessions.results ?? [] });
  }

  if (request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { status } = body;
    if (!['active','paused','cancelled'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
    await env.DB.prepare(
      `UPDATE program_assignments SET status = ?, updated_at_ms = ? WHERE id = ?`
    ).bind(status, Date.now(), id).run();
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.PROGRAM_ASSIGNMENT_CANCELLED,
      targetType: 'program_assignment', targetId: id, payload: { status }, request, env });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

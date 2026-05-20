// POST /api/trainer/dpa — record DPA acknowledgement (P1I)
import { requireGymContext } from '../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

const CURRENT_DPA_VERSION = '1.0';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;

  const now = Date.now();
  await env.DB.prepare(
    `UPDATE gyms SET dpa_acknowledged_at_ms = ?, dpa_version = ?, updated_at_ms = ? WHERE id = ?`
  ).bind(now, CURRENT_DPA_VERSION, now, gymId).run();

  await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.DPA_ACKNOWLEDGED,
    targetType: 'gym', targetId: gymId, payload: { dpa_version: CURRENT_DPA_VERSION }, request, env });

  return Response.json({ ok: true, dpa_version: CURRENT_DPA_VERSION });
}

// POST /api/trainer/clients/:userId/request-upgrade — request disclosure upgrade from a client (P1B)
// Note: Cloudflare Pages routing uses [userId] in the parent dir; this file handles the sub-path.
// Route: POST /api/trainer/clients/request-upgrade?userId=...  (or via header)
import { requireGymContext } from '../../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { user_id, target_level, reason } = body;
  if (!user_id || !target_level) return Response.json({ error: 'user_id and target_level required' }, { status: 400 });
  if (!['L1','L2','L3','L4'].includes(target_level)) return Response.json({ error: 'Invalid target_level' }, { status: 400 });

  // Verify the client is connected to this gym
  const disc = await env.DB.prepare(
    `SELECT id, level FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
  ).bind(user_id, gymId).first();
  if (!disc) return Response.json({ error: 'Client not connected to this gym' }, { status: 404 });

  const requestId = crypto.randomUUID();
  // Store upgrade request as an audit entry (no separate table needed for Phase 1)
  await writeAudit({
    gymId, actorUserId: user.userId,
    action: ACTIONS.DISCLOSURE_UPGRADE_REQUESTED,
    targetType: 'disclosure', targetId: disc.id,
    payload: { request_id: requestId, target_level, reason, client_user_id: user_id },
    request, env,
  });

  // TODO Phase 2: push a real-time in-app notification here via Cloudflare Queues.
  // For now, the upgrade request is recorded in audit_log and polled by the client.

  return Response.json({ ok: true, request_id: requestId });
}

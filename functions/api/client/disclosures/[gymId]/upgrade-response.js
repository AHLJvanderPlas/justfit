// POST /api/client/disclosures/:gymId/upgrade-response — respond to a trainer upgrade request (P1B)
import { getUser } from '../../../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { accept, request_id } = body;
  const gymId = params.gymId;

  const disc = await env.DB.prepare(
    `SELECT id FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
  ).bind(user.userId, gymId).first();
  if (!disc) return Response.json({ error: 'No disclosure for this gym' }, { status: 404 });

  await writeAudit({
    gymId, actorUserId: user.userId,
    action: accept ? ACTIONS.DISCLOSURE_UPGRADE_ACCEPTED : ACTIONS.DISCLOSURE_UPGRADE_DECLINED,
    targetType: 'disclosure', targetId: disc.id,
    payload: { request_id, accepted: !!accept },
    request, env,
  });

  return Response.json({ ok: true, accepted: !!accept });
}

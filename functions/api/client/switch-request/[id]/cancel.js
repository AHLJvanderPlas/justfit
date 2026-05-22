// PATCH /api/client/switch-request/:id/cancel

import { getUser } from '../../../_shared/auth.js';

export async function onRequestPatch(ctx) {
  const { request, env, params } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const id = params.id;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const row = await env.DB.prepare(`
      SELECT id, client_user_id, status FROM trainer_switch_requests WHERE id = ? LIMIT 1
    `).bind(id).first();

    if (!row) return Response.json({ error: 'not_found' }, { status: 404 });
    if (row.client_user_id !== user.userId) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (row.status !== 'pending') return Response.json({ error: 'not_cancellable' }, { status: 409 });

    await env.DB.prepare(`
      UPDATE trainer_switch_requests SET status = 'cancelled' WHERE id = ?
    `).bind(id).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/client/switch-request/:id/cancel', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

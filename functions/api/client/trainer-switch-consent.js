// PATCH /api/client/trainer-switch-consent

import { getUser } from '../_shared/auth.js';

export async function onRequestPatch(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { allow } = body ?? {};
    if (typeof allow !== 'boolean') return Response.json({ error: 'allow (boolean) required' }, { status: 400 });

    const result = await env.DB.prepare(`
      UPDATE gym_memberships SET allow_trainer_switch = ?, updated_at_ms = ?
      WHERE user_id = ? AND role = 'client' AND status = 'active'
    `).bind(allow ? 1 : 0, Date.now(), user.userId).run();

    if (result.changes === 0) return Response.json({ error: 'not_in_gym' }, { status: 400 });

    return Response.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/client/trainer-switch-consent', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/client/packages
// Returns the client's active session packages and credit balances.

import { getUser } from '../_shared/auth.js';

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await env.DB.prepare(`
      SELECT gym_id FROM gym_memberships
      WHERE user_id = ? AND role = 'client' AND status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership) return Response.json({ packages: [] });

    const now = Date.now();

    const rows = await env.DB.prepare(`
      SELECT id, package_name, sessions_total, sessions_used,
             sold_at_ms, expires_at_ms
      FROM client_packages
      WHERE client_user_id = ?
        AND gym_id = ?
        AND (expires_at_ms IS NULL OR expires_at_ms > ?)
      ORDER BY sold_at_ms DESC
      LIMIT 10
    `).bind(user.userId, membership.gym_id, now).all();

    const packages = (rows.results ?? []).map(r => ({
      id: r.id,
      package_name: r.package_name,
      sessions_total: r.sessions_total,
      sessions_used: r.sessions_used,
      sessions_remaining: r.sessions_total - r.sessions_used,
      sold_at_ms: r.sold_at_ms,
      expires_at_ms: r.expires_at_ms ?? null,
    }));

    return Response.json({ packages });
  } catch (e) {
    console.error('GET /api/client/packages', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/client/switch-requests — list pending + recent (30 days) switch requests for client

import { getUser } from '../_shared/auth.js';

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const rows = await env.DB.prepare(`
      SELECT tsr.id, tsr.to_trainer_user_id, tsr.initiated_by, tsr.status,
             tsr.decline_reason, tsr.created_at_ms, tsr.decided_at_ms,
             tp.display_name AS to_trainer_name,
             tp.photo_r2_key AS to_trainer_photo_r2_key
      FROM trainer_switch_requests tsr
      LEFT JOIN trainer_profiles tp ON tp.user_id = tsr.to_trainer_user_id
      WHERE tsr.client_user_id = ?
        AND (tsr.status = 'pending' OR tsr.created_at_ms >= ?)
      ORDER BY tsr.created_at_ms DESC
    `).bind(user.userId, since).all();

    const photoBase = 'https://assets.justfit.cc/';
    return Response.json((rows?.results ?? []).map(r => ({
      id: r.id,
      to_trainer_name: r.to_trainer_name,
      to_trainer_photo_url: r.to_trainer_photo_r2_key ? photoBase + r.to_trainer_photo_r2_key : null,
      initiated_by: r.initiated_by,
      status: r.status,
      decline_reason: r.decline_reason ?? null,
      created_at_ms: r.created_at_ms,
      decided_at_ms: r.decided_at_ms ?? null,
    })));
  } catch (e) {
    console.error('GET /api/client/switch-requests', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

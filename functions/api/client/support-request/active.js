// GET /api/client/support-request/active

import { getUser } from '../../_shared/auth.js';

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await env.DB.prepare(`
      SELECT sr.id, sr.status, sr.message, sr.broadcast, sr.created_at_ms,
             sr.accepted_at_ms, sr.reply_message, sr.accepted_by_user_id,
             tp.display_name AS accepted_by_name,
             tp.photo_r2_key AS accepted_by_photo_r2_key
      FROM support_requests sr
      LEFT JOIN trainer_profiles tp ON tp.user_id = sr.accepted_by_user_id
      WHERE sr.client_user_id = ? AND sr.status IN ('open','accepted')
      ORDER BY sr.created_at_ms DESC LIMIT 1
    `).bind(user.userId).first();

    if (!row) return Response.json(null);

    const photoBase = 'https://assets.justfit.cc/';
    return Response.json({
      id: row.id,
      status: row.status,
      message: row.message,
      broadcast: !!row.broadcast,
      created_at_ms: row.created_at_ms,
      accepted_at_ms: row.accepted_at_ms ?? null,
      reply_message: row.reply_message ?? null,
      accepted_by: row.accepted_by_user_id ? {
        display_name: row.accepted_by_name,
        photo_url: row.accepted_by_photo_r2_key
          ? photoBase + row.accepted_by_photo_r2_key : null,
      } : null,
    });
  } catch (e) {
    console.error('GET /api/client/support-request/active', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

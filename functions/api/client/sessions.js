// GET /api/client/sessions
// Returns upcoming appointments the client is enrolled in.

import { getUser } from '../_shared/auth.js';

const LOOKBACK_MS = 3 * 24 * 60 * 60 * 1000; // show from 3 days ago

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

    if (!membership) return Response.json({ sessions: [] });

    const cutoffMs = Date.now() - LOOKBACK_MS;

    const rows = await env.DB.prepare(`
      SELECT
        a.id, a.title, a.type, a.starts_at_ms, a.ends_at_ms,
        a.location, a.notes, a.status,
        ae.rsvp,
        tp.display_name AS trainer_name
      FROM appointment_enrollments ae
      JOIN appointments a ON a.id = ae.appointment_id
      LEFT JOIN trainer_profiles tp ON tp.user_id = a.trainer_user_id
      WHERE ae.client_user_id = ?
        AND ae.gym_id = ?
        AND ae.rsvp != 'cancelled'
        AND a.status = 'scheduled'
        AND a.starts_at_ms >= ?
      ORDER BY a.starts_at_ms ASC
      LIMIT 20
    `).bind(user.userId, membership.gym_id, cutoffMs).all();

    const sessions = (rows.results ?? []).map(r => ({
      id: r.id,
      title: r.title,
      type: r.type,
      starts_at_ms: r.starts_at_ms,
      ends_at_ms: r.ends_at_ms,
      location: r.location ?? null,
      trainer_name: r.trainer_name ?? null,
      rsvp: r.rsvp,
    }));

    return Response.json({ sessions });
  } catch (e) {
    console.error('GET /api/client/sessions', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/client/sessions/available
// Returns open group sessions at the client's gym that the client is NOT yet enrolled in.

import { getUser } from '../../_shared/auth.js';

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

    const now = Date.now();

    const rows = await env.DB.prepare(`
      SELECT a.id, a.title, a.starts_at_ms, a.ends_at_ms, a.location,
             a.max_capacity,
             tp.display_name AS trainer_name,
             (SELECT COUNT(*) FROM appointment_enrollments
              WHERE appointment_id = a.id AND rsvp = 'confirmed') AS enrolled_count
      FROM appointments a
      LEFT JOIN trainer_profiles tp ON tp.user_id = a.trainer_user_id
      WHERE a.gym_id = ?
        AND a.type = 'group'
        AND a.status = 'scheduled'
        AND a.starts_at_ms > ?
        AND NOT EXISTS (
          SELECT 1 FROM appointment_enrollments
          WHERE appointment_id = a.id AND client_user_id = ? AND rsvp != 'cancelled'
        )
      ORDER BY a.starts_at_ms ASC
      LIMIT 10
    `).bind(membership.gym_id, now, user.userId).all();

    const sessions = (rows.results ?? []).map(r => ({
      id: r.id,
      title: r.title,
      starts_at_ms: r.starts_at_ms,
      ends_at_ms: r.ends_at_ms,
      location: r.location ?? null,
      trainer_name: r.trainer_name ?? null,
      max_capacity: r.max_capacity ?? null,
      enrolled_count: r.enrolled_count ?? 0,
    }));

    return Response.json({ sessions });
  } catch (e) {
    console.error('GET /api/client/sessions/available', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

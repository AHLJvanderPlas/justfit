// POST   /api/client/sessions/:id/enroll — enroll client in a group session
// DELETE /api/client/sessions/:id/enroll — cancel enrollment

import { getUser } from '../../../_shared/auth.js';

async function getMembership(env, userId) {
  return env.DB.prepare(`
    SELECT gym_id FROM gym_memberships
    WHERE user_id = ? AND role = 'client' AND status = 'active'
    LIMIT 1
  `).bind(userId).first();
}

export async function onRequestPost(ctx) {
  const { request, env, params } = ctx;
  const appointmentId = params.id;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await getMembership(env, user.userId);
    if (!membership) return Response.json({ error: 'Geen actief lidmaatschap' }, { status: 400 });

    const appt = await env.DB.prepare(`
      SELECT id, gym_id, type, status, max_capacity
      FROM appointments
      WHERE id = ? AND gym_id = ?
      LIMIT 1
    `).bind(appointmentId, membership.gym_id).first();

    if (!appt) return Response.json({ error: 'Sessie niet gevonden' }, { status: 404 });
    if (appt.type !== 'group') return Response.json({ error: 'Alleen groepssessies zijn beschikbaar voor inschrijving' }, { status: 400 });
    if (appt.status !== 'scheduled') return Response.json({ error: 'Sessie is niet meer beschikbaar' }, { status: 400 });

    // Check capacity
    if (appt.max_capacity !== null) {
      const countRow = await env.DB.prepare(`
        SELECT COUNT(*) AS cnt FROM appointment_enrollments
        WHERE appointment_id = ? AND rsvp = 'confirmed'
      `).bind(appointmentId).first();
      if ((countRow?.cnt ?? 0) >= appt.max_capacity) {
        return Response.json({ error: 'Session vol' }, { status: 409 });
      }
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(`
      INSERT INTO appointment_enrollments (id, appointment_id, client_user_id, gym_id, rsvp, created_at_ms)
      VALUES (?, ?, ?, ?, 'confirmed', ?)
      ON CONFLICT(appointment_id, client_user_id) DO UPDATE SET rsvp = 'confirmed'
    `).bind(id, appointmentId, user.userId, membership.gym_id, now).run();

    return Response.json({ ok: true, rsvp: 'confirmed' });
  } catch (e) {
    console.error('POST /api/client/sessions/:id/enroll', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestDelete(ctx) {
  const { request, env, params } = ctx;
  const appointmentId = params.id;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await env.DB.prepare(`
      UPDATE appointment_enrollments SET rsvp = 'cancelled'
      WHERE appointment_id = ? AND client_user_id = ?
    `).bind(appointmentId, user.userId).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/client/sessions/:id/enroll', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/feedback — user feedback and client error intake.
// Writes to app_events (raw log) and feedback_items (triage view).
// Email notifications removed — review feedback in the admin dashboard.

import { getUser } from './_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const text = (body.text ?? '').trim();
    const type = String(body.type ?? '').trim() || 'feedback';
    const detail = String(body.detail ?? '').trim();
    if (!text) return Response.json({ error: 'Feedback text required' }, { status: 400 });
    if (text.length > 5000) return Response.json({ error: 'Feedback too long' }, { status: 400 });
    if (type.length > 64) return Response.json({ error: 'Type too long' }, { status: 400 });
    if (detail.length > 1000) return Response.json({ error: 'Detail too long' }, { status: 400 });

    const now = Date.now();
    const eventType = type || (text.startsWith('[CLIENT ERROR]') ? 'client_error' : 'feedback');
    const eventDetail = detail || text.slice(0, 1000);

    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO app_events (id, user_id, user_email, event_type, detail, created_at_ms)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(crypto.randomUUID(), user.userId, user.email ?? null, eventType, eventDetail, now),
      env.DB.prepare(
        `INSERT INTO feedback_items
           (id, user_id, user_email, event_type, message, status, flagged, created_at_ms, updated_at_ms)
         VALUES (?, ?, ?, ?, ?, 'new', 0, ?, ?)`
      ).bind(crypto.randomUUID(), user.userId, user.email ?? null, eventType, text, now, now),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e); return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/dashboard
// Admin-only: registered users, recent active users, error events, feedback triage.
// Auth: session cookie (issued by /api/dashboard-login) or X-Admin-Key.

import { isAdminAuthorized, unauthorized } from './_shared/adminAuth.js';

export async function onRequestGet({ request, env }) {
  try {
    if (!await isAdminAuthorized(request, env)) {
      return unauthorized();
    }

    const [usersRow, eventsRes, activeUsersRes, feedbackNewRes, feedbackFlaggedRes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM users').first(),

      env.DB.prepare(
        `SELECT event_type, detail, user_email, created_at_ms
           FROM app_events ORDER BY created_at_ms DESC LIMIT 200`
      ).all(),

      env.DB.prepare(
        `SELECT u.id AS user_id, au.email AS user_email, au.last_login_at_ms
           FROM auth_users au
           JOIN users u ON u.id = au.user_id
          WHERE au.last_login_at_ms IS NOT NULL
          ORDER BY au.last_login_at_ms DESC
          LIMIT 100`
      ).all(),

      env.DB.prepare(
        `SELECT id, user_id, user_email, event_type, message, status, flagged,
                created_at_ms, updated_at_ms
           FROM feedback_items
          ORDER BY created_at_ms DESC LIMIT 200`
      ).all(),

      env.DB.prepare(
        `SELECT id, user_id, user_email, event_type, message, status, flagged,
                created_at_ms, updated_at_ms
           FROM feedback_items
          WHERE flagged = 1
          ORDER BY created_at_ms ASC LIMIT 100`
      ).all(),
    ]);

    return Response.json({
      ok: true,
      registered_users: usersRow?.n ?? 0,
      errors: eventsRes?.results ?? [],
      active_users: activeUsersRes?.results ?? [],
      feedback_new: feedbackNewRes?.results ?? [],
      feedback_flagged: feedbackFlaggedRes?.results ?? [],
      generated_at_ms: Date.now(),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/dashboard
// Admin-only dashboard data: registered users + recent app errors/events.

function isAuthorized(request, env) {
  const dashboardPassword = request.headers.get('X-Dashboard-Password') ?? '';
  const adminKey = request.headers.get('X-Admin-Key') ?? '';

  // Preferred: dedicated dashboard password secret.
  if (env.DASHBOARD_PASSWORD && dashboardPassword === env.DASHBOARD_PASSWORD) {
    return true;
  }
  // Backward-compatible fallback.
  if (env.ADMIN_KEY && adminKey === env.ADMIN_KEY) {
    return true;
  }
  return false;
}

export async function onRequestGet({ request, env }) {
  try {
    if (!isAuthorized(request, env)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [usersRow, eventsRes] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) AS n FROM users`).first(),
      env.DB.prepare(
        `SELECT event_type, detail, user_email, created_at_ms
           FROM app_events
          ORDER BY created_at_ms DESC
          LIMIT 200`
      ).all(),
    ]);

    return Response.json({
      ok: true,
      registered_users: usersRow?.n ?? 0,
      errors: eventsRes?.results ?? [],
      generated_at_ms: Date.now(),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

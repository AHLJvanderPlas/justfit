// GET /api/dashboard
// Admin-only: registered users, recent active users, error events, feedback triage.
// Rate-limited: 10 failed attempts per 15 minutes per IP.

async function isIpRateLimited(ip, env) {
  const bucket = `dashboard:ip:${ip}`;
  const windowMs = 15 * 60 * 1000;
  const max = 10;
  const cutoff = Date.now() - windowMs;
  try {
    const row = await env.DB.prepare(
      'SELECT count, window_start_ms FROM auth_rate_limits WHERE bucket = ?'
    ).bind(bucket).first();
    if (!row) return false;
    if (row.window_start_ms <= cutoff) return false;
    return row.count >= max;
  } catch {
    return false;
  }
}

async function recordFailure(ip, env) {
  const bucket = `dashboard:ip:${ip}`;
  const now = Date.now();
  const cutoff = now - 15 * 60 * 1000;
  try {
    await env.DB.prepare(`
      INSERT INTO auth_rate_limits (bucket, count, window_start_ms)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET
        count           = CASE WHEN window_start_ms <= ? THEN 1             ELSE count + 1       END,
        window_start_ms = CASE WHEN window_start_ms <= ? THEN ?             ELSE window_start_ms END
    `).bind(bucket, now, cutoff, cutoff, now).run();
  } catch { /* non-fatal */ }
}

function isAuthorized(request, env) {
  const dashboardPassword = request.headers.get('X-Dashboard-Password') ?? '';
  const adminKey = request.headers.get('X-Admin-Key') ?? '';
  if (env.DASHBOARD_PASSWORD && dashboardPassword === env.DASHBOARD_PASSWORD) return true;
  if (env.ADMIN_KEY && adminKey === env.ADMIN_KEY) return true;
  return false;
}

export async function onRequestGet({ request, env }) {
  try {
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')
      || 'unknown';

    if (await isIpRateLimited(ip, env)) {
      return Response.json({ error: 'Too many attempts \u2014 try again later.' }, { status: 429 });
    }

    if (!isAuthorized(request, env)) {
      await recordFailure(ip, env);
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
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

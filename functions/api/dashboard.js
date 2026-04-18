// GET /api/dashboard
// Admin-only: registered users + recent app events.
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
    return false; // fail open on DB error
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

    const [usersRow, eventsRes] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) AS n FROM users').first(),
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

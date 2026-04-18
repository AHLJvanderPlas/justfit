// POST /api/dashboard-login
// Verifies DASHBOARD_PASSWORD, issues HttpOnly session cookie.
// Rate-limited: 10 failed attempts per 15 minutes per IP.

import { createSessionCookie } from './_shared/adminAuth.js';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
const BUCKET_PREFIX = 'dashboard:ip:';

async function isRateLimited(ip, env) {
  const bucket = BUCKET_PREFIX + ip;
  const cutoff = Date.now() - WINDOW_MS;
  try {
    const row = await env.DB.prepare(
      'SELECT count, window_start_ms FROM auth_rate_limits WHERE bucket = ?'
    ).bind(bucket).first();
    if (!row) return false;
    if (row.window_start_ms <= cutoff) return false;
    return row.count >= MAX_FAILURES;
  } catch {
    return false;
  }
}

async function recordFailure(ip, env) {
  const bucket = BUCKET_PREFIX + ip;
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
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

export async function onRequestPost({ request, env }) {
  try {
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')
      || 'unknown';

    if (await isRateLimited(ip, env)) {
      return Response.json({ error: 'Too many attempts \u2014 try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { password } = body;

    const secret = env.DASHBOARD_PASSWORD;
    if (!secret || password !== secret) {
      await recordFailure(ip, env);
      return Response.json({ error: 'Incorrect password.' }, { status: 401 });
    }

    const cookie = await createSessionCookie(env);
    return Response.json({ ok: true }, {
      headers: { 'Set-Cookie': cookie },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

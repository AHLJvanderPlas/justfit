// POST /api/cycle — log a period start manually
// Body: { user_id, started_on }
// Also accepts check-in period_today flag to auto-log via plan.js path

// ─── JWT AUTH HELPER (inlined — Pages Functions cannot import across files) ───
async function _hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function _verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await _hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getAuthUserId(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  const payload = await _verifyJWT(token, env.JWT_SECRET);
  return payload?.userId ?? null;
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { started_on } = body;

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!started_on) return Response.json({ error: 'started_on required' }, { status: 400 });

    const userExists = await env.DB.prepare(
      `SELECT id FROM users WHERE id = ? LIMIT 1`
    ).bind(user_id).first();
    if (!userExists) return Response.json({ error: 'User not found' }, { status: 404 });

    const now = Date.now();
    const cutoff = now - 15 * 24 * 60 * 60 * 1000;

    // Prevent duplicate logs within 15 days
    const recentLog = await env.DB.prepare(
      `SELECT id FROM period_log WHERE user_id = ? AND noted_at_ms > ? LIMIT 1`
    ).bind(user_id, cutoff).first();

    let logged = false;
    if (!recentLog) {
      await env.DB.prepare(`
        INSERT INTO period_log (id, user_id, started_on, noted_at_ms, source)
        VALUES (?, ?, ?, ?, 'checkin')
      `).bind(crypto.randomUUID(), user_id, started_on, now).run();

      // Update cycle_profile.last_period_start
      await env.DB.prepare(`
        UPDATE cycle_profile SET last_period_start = ?, updated_at_ms = ?
        WHERE user_id = ? AND tracking_mode = 'smart'
      `).bind(started_on, now, user_id).run();

      logged = true;
    }

    return Response.json({ ok: true, logged });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// POST /api/feedback — user feedback and client error intake.
// Writes to app_events (raw log) and feedback_items (triage view).
// Email notifications removed — review feedback in the admin dashboard.

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

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

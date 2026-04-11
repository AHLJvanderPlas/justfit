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
    const { user_id: bodyUserId, date, energy, sleep_hours, stress, mood, checkin_json } = body;

    // Prefer JWT-derived userId to prevent IDOR
    const jwtUserId = await getAuthUserId(request, env);
    const user_id = jwtUserId ?? bodyUserId;

    if (!user_id || !date) {
      return Response.json({ error: 'user_id and date required' }, { status: 400 });
    }

    const now = Date.now();

    // Upsert by (user_id, date) — check for existing row first because
    // daily_checkins has no UNIQUE constraint on (user_id, date).
    // ON CONFLICT(id) with a fresh UUID never fires; this pattern is correct.
    const existing = await env.DB.prepare(
      `SELECT id FROM daily_checkins WHERE user_id = ? AND date = ? LIMIT 1`
    ).bind(user_id, date).first();

    if (existing) {
      await env.DB.prepare(`
        UPDATE daily_checkins SET
          mood = ?, energy = ?, sleep_hours = ?, stress = ?,
          checkin_json = ?, updated_at_ms = ?
        WHERE id = ?
      `).bind(
        mood ?? null, energy ?? null, sleep_hours ?? null, stress ?? null,
        JSON.stringify(checkin_json ?? {}), now, existing.id
      ).run();
      return Response.json({ ok: true, id: existing.id });
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO daily_checkins
        (id, user_id, date, mood, energy, sleep_hours, stress, checkin_json, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user_id, date,
      mood ?? null, energy ?? null, sleep_hours ?? null, stress ?? null,
      JSON.stringify(checkin_json ?? {}), now, now
    ).run();

    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const jwtUserId = await getAuthUserId(request, env);
    const user_id = jwtUserId ?? url.searchParams.get('user_id');

    if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });

    const query = date
      ? `SELECT * FROM daily_checkins WHERE user_id = ? AND date = ? LIMIT 1`
      : `SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 7`;

    const result = date
      ? await env.DB.prepare(query).bind(user_id, date).first()
      : await env.DB.prepare(query).bind(user_id).all();

    return Response.json(date ? { checkin: result } : { checkins: result.results });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

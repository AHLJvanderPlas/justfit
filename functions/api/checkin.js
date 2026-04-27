import { getAuthUserId } from './_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, energy, sleep_hours, stress, mood, checkin_json } = body;

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });

    const now = Date.now();

    // Atomic upsert — UNIQUE(user_id, date) index (migration 0018) makes this race-safe.
    await env.DB.prepare(`
      INSERT INTO daily_checkins
        (id, user_id, date, mood, energy, sleep_hours, stress, checkin_json, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, date) DO UPDATE SET
        mood = excluded.mood,
        energy = excluded.energy,
        sleep_hours = excluded.sleep_hours,
        stress = excluded.stress,
        checkin_json = excluded.checkin_json,
        updated_at_ms = excluded.updated_at_ms
    `).bind(
      crypto.randomUUID(), user_id, date,
      mood ?? null, energy ?? null, sleep_hours ?? null, stress ?? null,
      JSON.stringify(checkin_json ?? {}), now, now
    ).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const query = date
      ? `SELECT * FROM daily_checkins WHERE user_id = ? AND date = ? LIMIT 1`
      : `SELECT * FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 7`;

    const result = date
      ? await env.DB.prepare(query).bind(user_id, date).first()
      : await env.DB.prepare(query).bind(user_id).all();

    return Response.json(date ? { checkin: result } : { checkins: result.results });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

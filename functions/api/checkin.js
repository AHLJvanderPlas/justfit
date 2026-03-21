export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, energy, sleep_hours, stress, motivation, mood, time_budget, checkin_json } = body;

    if (!user_id || !date) {
      return Response.json({ error: 'user_id and date required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(`
      INSERT INTO daily_checkins 
        (id, user_id, date, mood, energy, sleep_hours, stress, checkin_json, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        mood = excluded.mood,
        energy = excluded.energy,
        sleep_hours = excluded.sleep_hours,
        stress = excluded.stress,
        checkin_json = excluded.checkin_json,
        updated_at_ms = excluded.updated_at_ms
    `).bind(id, user_id, date, mood ?? null, energy ?? null, sleep_hours ?? null, stress ?? null,
        JSON.stringify(checkin_json ?? {}), now, now).run();

    return Response.json({ ok: true, id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const date = url.searchParams.get('date');

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

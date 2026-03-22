// POST /api/cycle — log a period start manually
// Body: { user_id, started_on }
// Also accepts check-in period_today flag to auto-log via plan.js path

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, started_on } = body;

    if (!user_id || !started_on) {
      return Response.json({ error: 'user_id and started_on required' }, { status: 400 });
    }

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
    return Response.json({ error: e.message }, { status: 500 });
  }
}

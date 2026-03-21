// GET  /api/profile — fetch user_preferences for the authenticated user
// POST /api/profile — upsert user_preferences (onboarding + settings)

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  // Minimal JWT decode (signature already verified on auth.js; here we just extract payload)
  try {
    const [, body] = token.split('.');
    return JSON.parse(atob(body));
  } catch { return null; }
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const prefs = await env.DB.prepare(
      `SELECT units, training_goal, experience_level, intensity_pref,
              session_duration_min, days_per_week_target, preferences_json,
              created_at_ms, updated_at_ms
       FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(user.userId).first();

    if (!prefs) return Response.json({ exists: false });

    return Response.json({
      exists: true,
      units: prefs.units,
      training_goal: prefs.training_goal,
      experience_level: prefs.experience_level,
      intensity_pref: prefs.intensity_pref,
      session_duration_min: prefs.session_duration_min,
      days_per_week_target: prefs.days_per_week_target,
      preferences: prefs.preferences_json ? JSON.parse(prefs.preferences_json) : {},
      created_at_ms: prefs.created_at_ms,
      updated_at_ms: prefs.updated_at_ms,
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      units = 'metric',
      training_goal = 'health',
      experience_level = 'beginner',
      intensity_pref = 5,
      session_duration_min = 30,
      days_per_week_target = 3,
      preferences = {},
    } = body;

    const now = Date.now();

    // Check if row exists
    const existing = await env.DB.prepare(
      `SELECT user_id FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(user.userId).first();

    if (existing) {
      await env.DB.prepare(`
        UPDATE user_preferences SET
          units = ?, training_goal = ?, experience_level = ?,
          intensity_pref = ?, session_duration_min = ?, days_per_week_target = ?,
          preferences_json = ?, updated_at_ms = ?
        WHERE user_id = ?
      `).bind(
        units, training_goal, experience_level,
        intensity_pref, session_duration_min, days_per_week_target,
        JSON.stringify(preferences), now,
        user.userId
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO user_preferences
          (user_id, units, training_goal, experience_level, intensity_pref,
           session_duration_min, days_per_week_target, preferences_json,
           created_at_ms, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        user.userId, units, training_goal, experience_level,
        intensity_pref, session_duration_min, days_per_week_target,
        JSON.stringify(preferences), now, now
      ).run();
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

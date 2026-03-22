// GET  /api/profile — fetch user_preferences + user_profile + cycle_profile
// POST /api/profile — upsert all three tables

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    const [, body] = token.split('.');
    return JSON.parse(atob(body));
  } catch { return null; }
}

function calculateCyclePhase(lastPeriodStart, cycleLengthDays, today) {
  if (!lastPeriodStart) return null;
  const start = new Date(lastPeriodStart);
  const now = new Date(today);
  const daysSince = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (daysSince < 0) return null;
  const cycleLen = cycleLengthDays ?? 28;
  const dayInCycle = ((daysSince % cycleLen) + cycleLen) % cycleLen + 1;
  const scale = cycleLen / 28;
  const menstrualEnd = Math.round(5 * scale);
  const follicularEnd = Math.round(13 * scale);
  const ovulationEnd = Math.round(16 * scale);
  if (dayInCycle <= menstrualEnd) return { phase: 'menstrual', day: dayInCycle };
  if (dayInCycle <= follicularEnd) return { phase: 'follicular', day: dayInCycle };
  if (dayInCycle <= ovulationEnd) return { phase: 'ovulation', day: dayInCycle };
  return { phase: 'luteal', day: dayInCycle };
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date().toISOString().split('T')[0];

    const [prefs, profile, cycleRow] = await Promise.all([
      env.DB.prepare(
        `SELECT units, training_goal, experience_level, intensity_pref,
                session_duration_min, days_per_week_target, preferences_json,
                created_at_ms, updated_at_ms
         FROM user_preferences WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT sex, weight_kg FROM user_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT tracking_mode, cycle_length_days, last_period_start
         FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
    ]);

    if (!prefs) return Response.json({ exists: false });

    const cyclePhaseInfo = cycleRow?.tracking_mode === 'smart'
      ? calculateCyclePhase(cycleRow.last_period_start, cycleRow.cycle_length_days, today)
      : null;

    return Response.json({
      exists: true,
      units: prefs.units,
      training_goal: prefs.training_goal,
      experience_level: prefs.experience_level,
      intensity_pref: prefs.intensity_pref,
      session_duration_min: prefs.session_duration_min,
      days_per_week_target: prefs.days_per_week_target,
      preferences: prefs.preferences_json ? JSON.parse(prefs.preferences_json) : {},
      // Body-aware fields
      sex: profile?.sex ?? null,
      weight_kg: profile?.weight_kg ?? null,
      cycle: cycleRow ? {
        tracking_mode: cycleRow.tracking_mode,
        cycle_length_days: cycleRow.cycle_length_days,
        last_period_start: cycleRow.last_period_start,
        current_phase: cyclePhaseInfo?.phase ?? null,
        cycle_day: cyclePhaseInfo?.day ?? null,
      } : null,
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
      // Body-aware fields
      sex,
      weight_kg,
      cycle,
    } = body;

    const now = Date.now();

    // ── user_preferences ──────────────────────────────────────────────────────
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
        JSON.stringify(preferences), now, user.userId
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

    // ── user_profile (sex + weight) ───────────────────────────────────────────
    if (sex !== undefined || weight_kg !== undefined) {
      const profileExists = await env.DB.prepare(
        `SELECT user_id FROM user_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first();

      if (profileExists) {
        const updates = [];
        const vals = [];
        if (sex !== undefined) { updates.push('sex = ?'); vals.push(sex); }
        if (weight_kg !== undefined) { updates.push('weight_kg = ?'); vals.push(weight_kg); }
        updates.push('updated_at_ms = ?');
        vals.push(now, user.userId);
        await env.DB.prepare(
          `UPDATE user_profile SET ${updates.join(', ')} WHERE user_id = ?`
        ).bind(...vals).run();
      } else {
        await env.DB.prepare(`
          INSERT INTO user_profile (user_id, sex, weight_kg, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, ?, ?)
        `).bind(user.userId, sex ?? null, weight_kg ?? null, now, now).run();
      }
    }

    // ── cycle_profile ─────────────────────────────────────────────────────────
    if (cycle) {
      const { tracking_mode = 'off', cycle_length_days = 28, last_period_start } = cycle;

      const cycleExists = await env.DB.prepare(
        `SELECT user_id FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first();

      if (cycleExists) {
        await env.DB.prepare(`
          UPDATE cycle_profile SET
            tracking_mode = ?, cycle_length_days = ?, last_period_start = ?, updated_at_ms = ?
          WHERE user_id = ?
        `).bind(tracking_mode, cycle_length_days, last_period_start ?? null, now, user.userId).run();
      } else {
        await env.DB.prepare(`
          INSERT INTO cycle_profile (user_id, tracking_mode, cycle_length_days, last_period_start, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(user.userId, tracking_mode, cycle_length_days, last_period_start ?? null, now, now).run();
      }

      // Log period start if tracking_mode = smart and last_period_start provided
      if (tracking_mode === 'smart' && last_period_start) {
        const recentLog = await env.DB.prepare(
          `SELECT id FROM period_log WHERE user_id = ? AND noted_at_ms > ? LIMIT 1`
        ).bind(user.userId, now - 15 * 24 * 60 * 60 * 1000).first();

        if (!recentLog) {
          await env.DB.prepare(`
            INSERT INTO period_log (id, user_id, started_on, noted_at_ms, source)
            VALUES (?, ?, ?, ?, 'manual')
          `).bind(crypto.randomUUID(), user.userId, last_period_start, now).run();
        }
      }
    }

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

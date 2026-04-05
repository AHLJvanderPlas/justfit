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

function calculatePregnancyWeek(dueDate, today) {
  if (!dueDate) return null;
  const conception = new Date(dueDate);
  conception.setDate(conception.getDate() - 280);
  const daysPregnant = Math.floor((new Date(today) - conception) / (1000 * 60 * 60 * 24));
  if (daysPregnant < 0) return null;
  return Math.min(Math.floor(daysPregnant / 7) + 1, 42);
}

function getTrimester(week) {
  if (!week) return null;
  if (week <= 12) return 1;
  if (week <= 27) return 2;
  return 3;
}

function getPostnatalPhase(birthDate, birthType, today) {
  if (!birthDate) return null;
  const daysSince = Math.floor((new Date(today) - new Date(birthDate)) / (1000 * 60 * 60 * 24));
  if (daysSince < 0) return null;
  const isCaesarean = birthType === 'caesarean';
  if (daysSince < 14) return 'immediate';
  if (daysSince < (isCaesarean ? 70 : 42)) return 'early';
  if (daysSince < 112) return 'rebuilding';
  if (daysSince < 182) return 'strengthening';
  return 'returning';
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
        `SELECT sex, weight_kg, height_cm FROM user_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT tracking_mode, cycle_length_days, last_period_start,
                mode, pregnancy_due_date, medical_clearance_confirmed,
                postnatal_birth_date, postnatal_birth_type,
                postnatal_cleared_for_exercise, postnatal_clearance_date
         FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
    ]);

    if (!prefs) return Response.json({ exists: false });

    const bodyMode = cycleRow?.mode ?? 'standard';
    const cyclePhaseInfo = (bodyMode === 'standard' && cycleRow?.tracking_mode === 'smart')
      ? calculateCyclePhase(cycleRow.last_period_start, cycleRow.cycle_length_days, today)
      : null;

    const pregnancyWeek = bodyMode === 'pregnant'
      ? calculatePregnancyWeek(cycleRow?.pregnancy_due_date, today)
      : null;

    const postnatalPhase = bodyMode === 'postnatal'
      ? getPostnatalPhase(cycleRow?.postnatal_birth_date, cycleRow?.postnatal_birth_type, today)
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
      height_cm: profile?.height_cm ?? null,
      cycle: cycleRow ? {
        // Standard cycle
        tracking_mode: cycleRow.tracking_mode,
        cycle_length_days: cycleRow.cycle_length_days,
        last_period_start: cycleRow.last_period_start,
        current_phase: cyclePhaseInfo?.phase ?? null,
        cycle_day: cyclePhaseInfo?.day ?? null,
        // Mode
        mode: bodyMode,
        // Pregnancy
        pregnancy_due_date: cycleRow.pregnancy_due_date ?? null,
        medical_clearance_confirmed: cycleRow.medical_clearance_confirmed ?? 0,
        pregnancy_week: pregnancyWeek,
        trimester: getTrimester(pregnancyWeek),
        // Postnatal
        postnatal_birth_date: cycleRow.postnatal_birth_date ?? null,
        postnatal_birth_type: cycleRow.postnatal_birth_type ?? null,
        postnatal_cleared_for_exercise: cycleRow.postnatal_cleared_for_exercise ?? 0,
        postnatal_clearance_date: cycleRow.postnatal_clearance_date ?? null,
        postnatal_phase: postnatalPhase,
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
      height_cm,
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

    // ── user_profile (sex + weight + height) ─────────────────────────────────
    if (sex !== undefined || weight_kg !== undefined || height_cm !== undefined) {
      const profileExists = await env.DB.prepare(
        `SELECT user_id FROM user_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first();

      if (profileExists) {
        const updates = [];
        const vals = [];
        if (sex !== undefined)       { updates.push('sex = ?');       vals.push(sex); }
        if (weight_kg !== undefined) { updates.push('weight_kg = ?'); vals.push(weight_kg); }
        if (height_cm !== undefined) { updates.push('height_cm = ?'); vals.push(height_cm); }
        updates.push('updated_at_ms = ?');
        vals.push(now, user.userId);
        await env.DB.prepare(
          `UPDATE user_profile SET ${updates.join(', ')} WHERE user_id = ?`
        ).bind(...vals).run();
      } else {
        await env.DB.prepare(`
          INSERT INTO user_profile (user_id, sex, weight_kg, height_cm, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(user.userId, sex ?? null, weight_kg ?? null, height_cm ?? null, now, now).run();
      }
    }

    // ── cycle_profile ─────────────────────────────────────────────────────────
    if (cycle) {
      const {
        tracking_mode = 'off',
        cycle_length_days = 28,
        last_period_start,
        // Pregnancy/postnatal mode
        mode,
        pregnancy_due_date,
        medical_clearance_confirmed,
        postnatal_birth_date,
        postnatal_birth_type,
        postnatal_cleared_for_exercise,
        postnatal_clearance_date,
      } = cycle;

      const cycleExists = await env.DB.prepare(
        `SELECT user_id FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first();

      if (cycleExists) {
        // Build dynamic update — only set fields that are provided
        const updates = [
          'tracking_mode = ?', 'cycle_length_days = ?',
          'last_period_start = ?', 'updated_at_ms = ?',
        ];
        const vals = [tracking_mode, cycle_length_days, last_period_start ?? null, now];

        if (mode !== undefined) { updates.push('mode = ?'); vals.push(mode); }
        if (pregnancy_due_date !== undefined) { updates.push('pregnancy_due_date = ?'); vals.push(pregnancy_due_date ?? null); }
        if (medical_clearance_confirmed !== undefined) { updates.push('medical_clearance_confirmed = ?'); vals.push(medical_clearance_confirmed ? 1 : 0); }
        if (postnatal_birth_date !== undefined) { updates.push('postnatal_birth_date = ?'); vals.push(postnatal_birth_date ?? null); }
        if (postnatal_birth_type !== undefined) { updates.push('postnatal_birth_type = ?'); vals.push(postnatal_birth_type ?? null); }
        if (postnatal_cleared_for_exercise !== undefined) { updates.push('postnatal_cleared_for_exercise = ?'); vals.push(postnatal_cleared_for_exercise ? 1 : 0); }
        if (postnatal_clearance_date !== undefined) { updates.push('postnatal_clearance_date = ?'); vals.push(postnatal_clearance_date ?? null); }

        // If switching to pregnant, set confirmed timestamp
        if (mode === 'pregnant' && medical_clearance_confirmed) {
          updates.push('pregnancy_confirmed_at_ms = ?');
          vals.push(now);
        }

        vals.push(user.userId);
        await env.DB.prepare(
          `UPDATE cycle_profile SET ${updates.join(', ')} WHERE user_id = ?`
        ).bind(...vals).run();
      } else {
        await env.DB.prepare(`
          INSERT INTO cycle_profile (
            user_id, tracking_mode, cycle_length_days, last_period_start,
            mode, pregnancy_due_date, medical_clearance_confirmed,
            pregnancy_confirmed_at_ms,
            postnatal_birth_date, postnatal_birth_type,
            postnatal_cleared_for_exercise, postnatal_clearance_date,
            created_at_ms, updated_at_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.userId, tracking_mode, cycle_length_days, last_period_start ?? null,
          mode ?? 'standard',
          pregnancy_due_date ?? null,
          medical_clearance_confirmed ? 1 : 0,
          (mode === 'pregnant' && medical_clearance_confirmed) ? now : null,
          postnatal_birth_date ?? null,
          postnatal_birth_type ?? null,
          postnatal_cleared_for_exercise ? 1 : 0,
          postnatal_clearance_date ?? null,
          now, now
        ).run();
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

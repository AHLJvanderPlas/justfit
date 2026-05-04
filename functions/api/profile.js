// GET  /api/profile — fetch user_preferences + user_profile + cycle_profile
// POST /api/profile — upsert all three tables

import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from './_shared/legalVersions.js';

import { getUser } from './_shared/auth.js';

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

    const [prefs, profile, cycleRow, authUser, lastLoginRow, lastPasskeyRow, lastExecRow, lastCheckinRow, lastPlanRow, usersRow] = await Promise.all([
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
      env.DB.prepare(
        `SELECT email, email_verified FROM auth_users WHERE user_id = ? AND provider = 'password' LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT MAX(last_login_at_ms) as t FROM auth_users WHERE user_id = ?`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT MAX(last_used_at_ms) as t FROM passkey_credentials WHERE user_id = ?`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT MAX(created_at_ms) as t FROM executions WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT MAX(created_at_ms) as t FROM daily_checkins WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT MAX(created_at_ms) as t FROM day_plans WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
      env.DB.prepare(
        `SELECT accepted_terms_version, accepted_privacy_version FROM users WHERE id = ? LIMIT 1`
      ).bind(user.userId).first(),
    ]);

    if (!prefs) return Response.json({ exists: false });

    // Most recent meaningful activity: latest across all activity sources
    const lastActivityMs = Math.max(
      lastExecRow?.t ?? 0,
      lastCheckinRow?.t ?? 0,
      lastPlanRow?.t ?? 0,
      lastLoginRow?.t ?? 0,
      lastPasskeyRow?.t ?? 0,
    ) || null;

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

    const needsTermsAcceptance =
      (usersRow?.accepted_terms_version   ?? null) !== CURRENT_TERMS_VERSION   ||
      (usersRow?.accepted_privacy_version ?? null) !== CURRENT_PRIVACY_VERSION;

    // Parse preferences — strava_byo credentials live in strava_byo_credentials table, not here
    const parsedPrefs = prefs.preferences_json ? JSON.parse(prefs.preferences_json) : {};
    // Belt-and-suspenders: strip any legacy strava_byo.client_secret that may still be in JSON
    if (parsedPrefs.strava_byo) delete parsedPrefs.strava_byo;

    return Response.json({
      exists: true,
      needsTermsAcceptance,
      last_activity_at_ms: lastActivityMs,
      email: authUser?.email ?? null,
      email_verified: !!(authUser?.email_verified),
      units: prefs.units,
      training_goal: prefs.training_goal,
      experience_level: prefs.experience_level,
      intensity_pref: prefs.intensity_pref,
      session_duration_min: prefs.session_duration_min,
      days_per_week_target: prefs.days_per_week_target,
      preferences: parsedPrefs,
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
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const {
      units,
      training_goal,
      experience_level,
      intensity_pref,
      session_duration_min,
      days_per_week_target,
      preferences: bodyPreferences,
      // Body-aware fields
      sex,
      weight_kg,
      height_cm,
      cycle,
    } = body;

    const now = Date.now();

    // ── Read existing row for merge (prevents partial saves from resetting fields) ──
    const existingRow = await env.DB.prepare(
      `SELECT units, training_goal, experience_level, intensity_pref,
              session_duration_min, days_per_week_target, preferences_json
       FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(user.userId).first();

    // Merge: body wins → existing DB value → hard default
    const units_f                = units                ?? existingRow?.units                ?? 'metric';
    const training_goal_f        = training_goal        ?? existingRow?.training_goal        ?? 'health';
    const experience_level_f     = experience_level     ?? existingRow?.experience_level     ?? 'beginner';
    const intensity_pref_f       = intensity_pref       ?? existingRow?.intensity_pref       ?? 5;
    const session_duration_min_f = session_duration_min ?? existingRow?.session_duration_min ?? 30;
    const days_per_week_target_f = days_per_week_target ?? existingRow?.days_per_week_target ?? 3;

    // For preferences: shallow merge body into existing so unrelated keys are preserved
    const existingParsed = existingRow?.preferences_json ? JSON.parse(existingRow.preferences_json) : {};
    let preferences = bodyPreferences !== undefined
      ? { ...existingParsed, ...bodyPreferences }
      : existingParsed;
    // Deep-merge sport_prefs sub-keys (e.g. bias_enabled) so a partial update (sports array only)
    // does not silently wipe settings the user set elsewhere (Settings toggle etc).
    if (bodyPreferences?.sport_prefs && existingParsed?.sport_prefs) {
      preferences.sport_prefs = { ...existingParsed.sport_prefs, ...bodyPreferences.sport_prefs };
    }
    // Migration-on-write: strip legacy strava_byo block (credentials now live in strava_byo_credentials table)
    if (preferences.strava_byo !== undefined) delete preferences.strava_byo;

    // ── Normalize preferences: validate military fields + enforce one-active-coach ─
    if (preferences && typeof preferences === 'object') {
      const mil = preferences.military_coach;
      if (mil && typeof mil === 'object') {
        // Clamp / whitelist military coach fields before persisting
        if (!['keuring', 'opleiding'].includes(mil.track)) mil.track = 'keuring';
        if (!['target', 'fit', 'open'].includes(mil.mode))  mil.mode  = 'open';
        const trackMax = mil.track === 'opleiding' ? 7 : 6;
        mil.cluster_target  = Math.max(1, Math.min(trackMax, Math.floor(Number(mil.cluster_target)  || 1)));
        mil.cluster_current = Math.max(1, Math.min(trackMax, Math.floor(Number(mil.cluster_current) || mil.cluster_target)));
        if (Array.isArray(mil.pack_weights_available_kg)) {
          mil.pack_weights_available_kg = mil.pack_weights_available_kg
            .map(v => Math.floor(Number(v))).filter(v => v >= 5 && v <= 35 && v % 5 === 0);
        } else {
          mil.pack_weights_available_kg = [];
        }
        delete mil.pack_weight_max_kg; // migrate legacy field
        if (mil.target_date && !/^\d{4}-\d{2}-\d{2}$/.test(mil.target_date)) mil.target_date = null;
        if (mil.mode !== 'target') mil.target_date = null;
        // Enforce one active coach: military active → deactivate run/cycle
        if (mil.active) {
          if (preferences.run_coach)    preferences.run_coach    = { ...preferences.run_coach,    enrolled: false };
          if (preferences.cycling_coach) preferences.cycling_coach = { ...preferences.cycling_coach, active:   false };
        }
      }
      // Enforce one active coach between run and cycling (run takes precedence)
      if (preferences.run_coach?.enrolled && preferences.cycling_coach?.active) {
        preferences.cycling_coach = { ...preferences.cycling_coach, active: false };
      }

      // ── Validate + normalize cycling_coach fields ─────────────────────────
      const cc = preferences.cycling_coach;
      if (cc && typeof cc === 'object') {
        cc.active = !!cc.active;
        const VALID_SUB_GOALS = ['build_fitness', 'climbing', 'sprint', 'aerobic_base', 'race_fitness'];
        if (cc.sub_goal !== undefined && cc.sub_goal !== null && !VALID_SUB_GOALS.includes(cc.sub_goal)) {
          return Response.json({ error: 'Invalid cycling_coach.sub_goal' }, { status: 400 });
        }
        if (cc.unit !== undefined && cc.unit !== null && !['watts', 'hr'].includes(cc.unit)) {
          return Response.json({ error: 'Invalid cycling_coach.unit' }, { status: 400 });
        }
        if (cc.ftp_watts != null)               cc.ftp_watts               = Math.max(50,  Math.min(600, Math.round(Number(cc.ftp_watts)               || 200)));
        if (cc.max_hr != null)                  cc.max_hr                  = Math.max(100, Math.min(220, Math.round(Number(cc.max_hr)                  || 180)));
        if (cc.target_ftp != null)              cc.target_ftp              = Math.max(50,  Math.min(600, Math.round(Number(cc.target_ftp)              || 200)));
        if (cc.ftp_test_interval_weeks != null) cc.ftp_test_interval_weeks = Math.max(4,   Math.min(12,  Math.round(Number(cc.ftp_test_interval_weeks) || 6)));
        if (cc.cycling_days_per_week != null)   cc.cycling_days_per_week   = Math.max(3,   Math.min(5,   Math.round(Number(cc.cycling_days_per_week)   || 3)));
        if (cc.run_days_per_week != null)       cc.run_days_per_week       = Math.max(1,   Math.min(3,   Math.round(Number(cc.run_days_per_week)       || 1)));
        // Enforce max 5 active days (min 2 rest days)
        const cycDays = cc.cycling_days_per_week ?? 3;
        const runDays = cc.run_cross_training ? (cc.run_days_per_week ?? 1) : 0;
        if (cycDays + runDays > 5) cc.run_days_per_week = Math.max(1, 5 - cycDays);
        // One active coach: cycling active → deactivate military
        if (cc.active && preferences.military_coach) {
          preferences.military_coach = { ...preferences.military_coach, active: false };
        }
      }
    }

    // ── user_preferences ──────────────────────────────────────────────────────
    if (existingRow) {
      await env.DB.prepare(`
        UPDATE user_preferences SET
          units = ?, training_goal = ?, experience_level = ?,
          intensity_pref = ?, session_duration_min = ?, days_per_week_target = ?,
          preferences_json = ?, updated_at_ms = ?
        WHERE user_id = ?
      `).bind(
        units_f, training_goal_f, experience_level_f,
        intensity_pref_f, session_duration_min_f, days_per_week_target_f,
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
        user.userId, units_f, training_goal_f, experience_level_f,
        intensity_pref_f, session_duration_min_f, days_per_week_target_f,
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
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

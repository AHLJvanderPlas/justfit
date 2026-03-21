export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, checkin } = body;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }

    // Fetch exercises and (optionally) user preferences in parallel
    const [exResult, userPrefs, templates] = await Promise.all([
      env.DB.prepare(
        `SELECT id, slug, name, category, tags_json, equipment_required_json, metrics_json
         FROM exercises WHERE is_active = 1`
      ).all(),
      user_id
        ? env.DB.prepare(
            `SELECT units, training_goal, experience_level, intensity_pref,
                    session_duration_min, days_per_week_target, preferences_json
             FROM user_preferences WHERE user_id = ? LIMIT 1`
          ).bind(user_id).first()
        : Promise.resolve(null),
      env.DB.prepare(
        `SELECT slug, name, session_type, difficulty, duration_min, template_json
         FROM session_templates WHERE is_active = 1`
      ).all(),
    ]);

    const allExercises = exResult.results;
    const allTemplates = templates.results;
    const prefs = userPrefs
      ? {
          ...userPrefs,
          preferences: userPrefs.preferences_json
            ? JSON.parse(userPrefs.preferences_json)
            : {},
        }
      : null;

    const plan = runPlanner(date, checkin, allExercises, prefs, allTemplates);

    if (user_id) {
      const userExists = await env.DB.prepare(
        `SELECT id FROM users WHERE id = ? LIMIT 1`
      ).bind(user_id).first();

      if (userExists) {
        const id = crypto.randomUUID();
        const now = Date.now();
        await env.DB.prepare(`
          INSERT INTO day_plans
            (id, user_id, date, plan_status, plan_json, generated_by, engine_version, seed, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'final', ?, 'engine', 'v1.5.1', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            plan_json = excluded.plan_json,
            updated_at_ms = excluded.updated_at_ms
        `).bind(id, user_id, date, JSON.stringify(plan), date, now, now).run();

        return Response.json({ ok: true, saved: true, plan: { id, ...plan } });
      }
    }

    return Response.json({ ok: true, saved: false, plan });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const date = url.searchParams.get('date');

    if (!user_id || !date) {
      return Response.json({ error: 'user_id and date required' }, { status: 400 });
    }

    const result = await env.DB.prepare(
      `SELECT * FROM day_plans WHERE user_id = ? AND date = ? ORDER BY created_at_ms DESC LIMIT 1`
    ).bind(user_id, date).first();

    return Response.json({ plan: result });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Deterministic seeded shuffle — uses date string as seed for variety
// ---------------------------------------------------------------------------
function seededShuffle(arr, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  const rng = () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 0xFFFFFFFF;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Goal → exercise category mapping
// ---------------------------------------------------------------------------
const GOAL_CATEGORY = {
  fat_loss: 'cardio',
  muscle_gain: 'strength',
  endurance: 'cardio',
  strength: 'strength',
  health: 'strength',
  mobility: 'mobility',
  mixed: 'strength',
};

// ---------------------------------------------------------------------------
// Template selector
// ---------------------------------------------------------------------------
function pickTemplate(templates, slotType, intensity, budgetMin) {
  if (slotType === 'rest') return null;

  // Map intensity to template difficulty
  const diffMap = { low: 'easy', moderate: 'moderate', high: 'hard' };
  const wantDiff = diffMap[intensity] || 'moderate';

  // Candidate templates for this slot type
  let candidates = templates.filter(t =>
    slotType === 'micro'
      ? t.duration_min <= 15
      : t.duration_min > 15 && t.duration_min <= budgetMin + 10
  );

  if (!candidates.length) candidates = templates;

  // Prefer matching difficulty, fall back to any
  const preferred = candidates.filter(t => t.difficulty === wantDiff);
  return preferred.length ? preferred[0] : candidates[0];
}

// ---------------------------------------------------------------------------
// Core planner — pure function, no DB calls
// ---------------------------------------------------------------------------
function runPlanner(date, checkIn, exercises, prefs, templates) {
  const trace = [];
  let intensity = 'moderate';
  let slot_type = 'main';
  let pool = [...exercises];

  // Default budget: from preferences or checkin or 30 min
  const prefBudget = prefs?.session_duration_min ?? 30;
  const budget = checkIn?.time_budget ?? prefBudget;

  // ------------------------------------------------------------------
  // R510: Time Budget Clamp
  // ------------------------------------------------------------------
  if (budget <= 10 || checkIn?.no_time) {
    slot_type = 'micro';
    trace.push('R510 — Time ≤10 min or no_time → micro session');
  } else if (budget <= 20) {
    trace.push('R510 — Short session (≤20 min)');
  } else {
    trace.push('R510 — Normal session (>20 min)');
  }

  // ------------------------------------------------------------------
  // R511: Sleep Intensity Cap
  // ------------------------------------------------------------------
  if ((checkIn?.sleep_hours ?? 8) <= 5) {
    intensity = 'low';
    trace.push('R511 — Poor sleep → intensity capped at low');
  }

  // ------------------------------------------------------------------
  // R512 volume reduction applied per-exercise below
  // ------------------------------------------------------------------

  // ------------------------------------------------------------------
  // R513: Stress Recovery Bias
  // ------------------------------------------------------------------
  if ((checkIn?.stress ?? 0) >= 7) {
    intensity = 'low';
    trace.push('R513 — High stress → recovery bias');
  }

  // ------------------------------------------------------------------
  // R514: Pain Safety Override
  // ------------------------------------------------------------------
  if ((checkIn?.pain_level ?? 0) >= 2) {
    slot_type = 'rest';
    trace.push('R514 — Pain ≥2 → rest session');
  }

  // ------------------------------------------------------------------
  // R515: No Clothing Filter (stealth mode)
  // ------------------------------------------------------------------
  if (checkIn?.no_clothing) {
    pool = pool.filter(ex => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
    });
    trace.push(`R515 — No clothing → stealth filter (${pool.length} exercises remain)`);
  }

  // ------------------------------------------------------------------
  // R516: No Gear / Travel (bodyweight only)
  // ------------------------------------------------------------------
  const userEquip = prefs?.preferences?.available_equipment ?? null;
  const forceBodyweight = checkIn?.no_gear || checkIn?.traveling;
  const profileBodyweightOnly = userEquip && userEquip.length === 1 && userEquip[0] === 'none';

  if (forceBodyweight || profileBodyweightOnly) {
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.includes('none');
    });
    const reason = forceBodyweight ? 'checkin no_gear/traveling' : 'profile equipment=none';
    trace.push(`R516 — Bodyweight only (${reason}) → ${pool.length} exercises remain`);
  } else if (userEquip && userEquip.length > 0) {
    // Filter to equipment user has available
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => e === 'none' || userEquip.includes(e));
    });
    trace.push(`R516 — Equipment filter from profile → ${pool.length} exercises remain`);
  }

  // ------------------------------------------------------------------
  // Determine target category from goal + rules
  // ------------------------------------------------------------------
  let targetCategory;
  if ((checkIn?.stress ?? 0) >= 7 || slot_type === 'rest') {
    targetCategory = 'mobility';
  } else {
    const goal = prefs?.training_goal ?? 'health';
    targetCategory = GOAL_CATEGORY[goal] ?? 'strength';
  }

  // Filter + seed-shuffle for variety across days
  let filtered = pool.filter(ex => ex.category === targetCategory);
  if (!filtered.length) filtered = pool; // graceful fallback
  const shuffled = seededShuffle(filtered, date);

  // How many exercises to include
  const count = slot_type === 'micro' ? 2 : budget > 35 ? 5 : budget > 20 ? 4 : 3;
  const selection = shuffled.slice(0, count);

  // ------------------------------------------------------------------
  // Build steps
  // ------------------------------------------------------------------
  const steps = slot_type === 'rest' ? [] : selection.map(ex => {
    const metrics = JSON.parse(ex.metrics_json || '{}');
    const supportsReps = metrics.supports?.includes('reps');
    let reps = supportsReps ? 10 : undefined;
    let duration = !supportsReps ? 30 : undefined;
    const sets = slot_type === 'micro' ? 1 : 3;

    // R512: Low energy → volume × 0.6
    if ((checkIn?.energy ?? 10) <= 3) {
      if (reps) { reps = Math.floor(reps * 0.6); trace.push(`R512 — Low energy → ${ex.name} reps ×0.6`); }
      if (duration) { duration = Math.floor(duration * 0.6); trace.push(`R512 — Low energy → ${ex.name} duration ×0.6`); }
    }

    // Scale by experience level
    const expScale = { beginner: 0.8, intermediate: 1.0, advanced: 1.2 };
    const scale = expScale[prefs?.experience_level] ?? 1.0;
    if (scale !== 1.0 && reps) reps = Math.round(reps * scale);

    return {
      exercise_id: ex.id,
      exercise_slug: ex.slug,
      name: ex.name,
      category: ex.category,
      target_reps: reps,
      target_duration_sec: duration,
      sets,
    };
  });

  // ------------------------------------------------------------------
  // Pick a template for session naming + structure context
  // ------------------------------------------------------------------
  const template = templates?.length
    ? pickTemplate(templates, slot_type, intensity, budget)
    : null;

  const fallbackNames = { main: 'Daily Training', micro: 'Micro Session', rest: 'Active Rest' };
  const session_name = slot_type === 'rest'
    ? 'Active Rest'
    : template?.name ?? fallbackNames[slot_type];

  return {
    date,
    slot_type,
    intensity,
    session_name,
    template_slug: template?.slug ?? null,
    target_category: targetCategory,
    steps,
    rule_trace: trace,
  };
}

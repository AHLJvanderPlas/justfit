export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, checkin, completed_exercise_ids, user_profile, cycle_context } = body;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }

    // Fetch exercises and (optionally) user preferences in parallel
    const [exResult, userPrefs, templates, userProfileRow] = await Promise.all([
      env.DB.prepare(
        `SELECT id, slug, name, category, tags_json, equipment_required_json, metrics_json, media_json
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
      user_id
        ? env.DB.prepare(
            `SELECT sex, weight_kg FROM user_profile WHERE user_id = ? LIMIT 1`
          ).bind(user_id).first()
        : Promise.resolve(null),
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

    // Merge body profile: prefer request body fields, fall back to DB row
    const bodyProfile = {
      sex: user_profile?.sex ?? userProfileRow?.sex ?? null,
      weight_kg: user_profile?.weight_kg ?? userProfileRow?.weight_kg ?? null,
    };

    // Resolve cycle context: prefer request body, else calculate from DB
    let resolvedCycleContext = cycle_context ?? null;
    if (!resolvedCycleContext && user_id && bodyProfile.sex === 'female') {
      const cycleRow = await env.DB.prepare(
        `SELECT tracking_mode, cycle_length_days, last_period_start
         FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user_id).first();
      if (cycleRow?.tracking_mode === 'smart') {
        resolvedCycleContext = calculateCyclePhase(cycleRow.last_period_start, cycleRow.cycle_length_days, date);
      }
    }

    const plan = runPlanner(date, checkin, allExercises, prefs, allTemplates, completed_exercise_ids, bodyProfile, resolvedCycleContext);

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
// Cycle phase calculation
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Core planner — pure function, no DB calls
// ---------------------------------------------------------------------------
function runPlanner(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile, cycleContext) {
  const trace = [];
  let intensity = 'moderate';
  let slot_type = 'main';
  let pool = [...exercises];

  // Filter out already-done exercises (bonus session deduplication)
  if (completedIds?.length) {
    const doneSet = new Set(completedIds);
    pool = pool.filter(e => !doneSet.has(e.id));
    trace.push(`Bonus dedup — excluded ${completedIds.length} completed exercise(s)`);
  }

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
  // Body-aware rules (R520–R523) — fire after R510-R516
  // ------------------------------------------------------------------
  const sex = bodyProfile?.sex ?? null;
  const weightKg = bodyProfile?.weight_kg ?? null;
  const phase = cycleContext?.phase ?? null;
  const cycleDay = cycleContext?.day ?? null;
  const cycleLengthDays = cycleContext?.cycle_length_days ?? 28;
  const periodToday = checkIn?.checkin_json?.period_today ?? checkIn?.period_today ?? false;

  let volumeMultiplier = 1.0;
  let sessionNotes = null;

  // R520 — Period day override
  if (periodToday || phase === 'menstrual') {
    intensity = 'low';
    // Bias toward mobility (handled in targetCategory below)
    trace.push('R520 — Your body is asking for gentleness today');
  }

  // R521 — Follicular energy boost
  if (phase === 'follicular' && (checkIn?.energy ?? 10) >= 6 && (checkIn?.sleep_hours ?? 8) >= 5) {
    volumeMultiplier = 1.15;
    trace.push('R521 — Your energy is building — time to be strong');
  }

  // R522 — Ovulation peak
  if (phase === 'ovulation') {
    sessionNotes = 'Take an extra minute to warm up today — your body is ready to perform.';
    trace.push('R522 — You\'re at your peak — let\'s make the most of it');
  }

  // R523 — Late luteal wind-down
  if (phase === 'luteal') {
    const isLateLuteal = cycleDay != null && cycleDay >= (cycleLengthDays - 5);
    if (isLateLuteal) {
      if (intensity === 'high') intensity = 'moderate';
      if (intensity === 'moderate' && (checkIn?.stress ?? 0) >= 6) intensity = 'low';
      trace.push('R523 — Winding down this week, staying consistent');
    }
  }

  // ------------------------------------------------------------------
  // Determine target category from goal + rules
  // ------------------------------------------------------------------
  let targetCategory;
  if ((checkIn?.stress ?? 0) >= 7 || slot_type === 'rest') {
    targetCategory = 'mobility';
  } else if (periodToday || phase === 'menstrual') {
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

    // Apply volume multiplier (R521 follicular boost)
    if (volumeMultiplier !== 1.0) {
      if (reps) reps = Math.round(reps * volumeMultiplier);
      if (duration) duration = Math.round(duration * volumeMultiplier);
    }

    const media = ex.media_json ? JSON.parse(ex.media_json) : {};
    return {
      exercise_id: ex.id,
      exercise_slug: ex.slug,
      name: ex.name,
      category: ex.category,
      target_reps: reps,
      target_duration_sec: duration,
      sets,
      gif_url: media.gif_url ?? null,
    };
  });

  // ------------------------------------------------------------------
  // R524 — Weight-adjusted volume (bodyweight exercises only)
  // ------------------------------------------------------------------
  if (weightKg && steps.length) {
    const weightRatio = weightKg / 70;
    for (const step of steps) {
      const ex = exercises.find(e => e.id === step.exercise_id);
      const tags = JSON.parse(ex?.tags_json || '[]');
      if (tags.includes('bodyweight') && step.target_reps) {
        const wScale = Math.max(0.7, Math.min(1.3, 1 / Math.sqrt(weightRatio)));
        step.target_reps = Math.round(step.target_reps * wScale);
      }
    }
  }

  // ------------------------------------------------------------------
  // R525 — Sex baseline: ensure ≥1 mobility exercise in main sessions
  // ------------------------------------------------------------------
  if (sex === 'female' && slot_type === 'main' && steps.length) {
    const hasMobility = steps.some(s => {
      const ex = exercises.find(e => e.id === s.exercise_id);
      return ex?.category === 'mobility';
    });
    if (!hasMobility) {
      const mobilityEx = exercises.find(e => {
        if (e.category !== 'mobility') return false;
        const tags = JSON.parse(e.tags_json || '[]');
        return tags.includes('low_impact');
      });
      if (mobilityEx) {
        const media = mobilityEx.media_json ? JSON.parse(mobilityEx.media_json) : {};
        steps.push({
          exercise_id: mobilityEx.id,
          exercise_slug: mobilityEx.slug,
          name: mobilityEx.name,
          category: mobilityEx.category,
          target_reps: undefined,
          target_duration_sec: 30,
          sets: 1,
          gif_url: media.gif_url ?? null,
        });
      }
    }
  }

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
    session_notes: sessionNotes,
    steps,
    rule_trace: trace,
  };
}

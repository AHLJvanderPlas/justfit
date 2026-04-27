import { getAuthUserId } from './_shared/auth.js';

// ---------------------------------------------------------------------------
// adaptExistingPlan — free tier: adjust volume/intensity on a stored plan
//   based on today's check-in without changing the exercise selection.
// ---------------------------------------------------------------------------
function adaptExistingPlan(basePlan, checkin) {
  const energy       = checkin?.energy       ?? 5;
  const stress       = checkin?.stress       ?? 5;
  const sleepHours   = checkin?.sleep_hours  ?? 7;
  const painLevel    = checkin?.pain_level ?? checkin?.checkin_json?.pain_level ?? 0;
  const painScopeA   = checkin?.pain_scope ?? null;
  const painAreasA   = checkin?.pain_areas ?? [];
  const isSpecificA  = painScopeA === 'specific' && painAreasA.length > 0;
  const noTime       = !!(checkin?.no_time ?? checkin?.checkin_json?.no_time);
  const timeBudget   = checkin?.time_budget  ?? checkin?.checkin_json?.time_budget ?? null;

  // Pain → rest (mirrors R514): only for general/unset scope
  if (painLevel >= 2 && !isSpecificA) {
    return { ...basePlan, slot_type: 'rest', session_name: 'Recovery day', steps: [],
             rule_trace: [...(basePlan.rule_trace ?? []), 'adapt:pain_rest'] };
  }

  // Build multipliers (energy/stress/sleep are on 0–10 scale, mirrors R511/R512/R513)
  let repMult  = 1.0;
  let restMult = 1.0;
  const notes  = [];

  if (energy <= 3) {
    repMult  *= 0.65; restMult *= 1.25;
    notes.push('Low energy — volume reduced');
  } else if (energy >= 8) {
    repMult  *= 1.10;
    notes.push('High energy — pushing a bit more');
  }
  if (stress >= 7) {
    repMult  *= 0.80;
    notes.push('High stress — intensity reduced');
  }
  if (sleepHours <= 5) {
    repMult  *= 0.85;
    notes.push('Low sleep — lighter session');
  }

  repMult = Math.max(0.5, Math.min(1.2, repMult));

  let adaptedSteps = (basePlan.steps ?? []).map(step => ({
    ...step,
    target_reps:         step.target_reps        ? Math.max(1,  Math.round(step.target_reps        * repMult))  : null,
    target_duration_sec: step.target_duration_sec ? Math.max(10, Math.round(step.target_duration_sec * repMult)) : null,
    rest_sec:            step.rest_sec            ? Math.round(step.rest_sec * restMult)                         : step.rest_sec,
  }));

  // Time constraints — trim exercises to fit budget (mirrors R510)
  if (noTime || (timeBudget != null && timeBudget <= 10)) {
    adaptedSteps = adaptedSteps.slice(0, 2).map(s => ({ ...s, sets: Math.min(s.sets ?? 3, 2) }));
    notes.push('Short on time — quick 10 min session');
  } else if (timeBudget != null && timeBudget <= 20) {
    adaptedSteps = adaptedSteps.slice(0, 3).map(s => ({ ...s, sets: Math.min(s.sets ?? 3, 2) }));
    notes.push(`Short on time — ${timeBudget} min session`);
  }

  const adaptNote = notes.length > 0 ? notes.join(' · ') : null;
  return {
    ...basePlan,
    steps: adaptedSteps,
    session_notes: adaptNote ? [adaptNote, ...(basePlan.session_notes ?? [])] : (basePlan.session_notes ?? []),
    rule_trace: [...(basePlan.rule_trace ?? []), 'adapt:free_tier', ...notes.map(n => `adapt:${n.split('—')[0].trim().toLowerCase().replace(/\s+/g, '_')}`)],
  };
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session, coach_sim, is_pro, adapt_mode, base_plan } = body;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }

    // JWT-derived user_id only — body field ignored to prevent IDOR.
    // If unauthenticated, user_id is null: plan generated without personalization, not saved to DB.
    const user_id = await getAuthUserId(request, env);

    // Fetch exercises and (optionally) user preferences in parallel
    const [exResult, userPrefs, templates, userProfileRow] = await Promise.all([
      env.DB.prepare(
        `SELECT id, slug, name, category, tags_json, equipment_required_json, metrics_json, media_json, instructions_json, alternatives_json
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
            `SELECT sex, weight_kg, height_cm FROM user_profile WHERE user_id = ? LIMIT 1`
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

    // Allow caller to override coach state (used by "Coming Up" preview to simulate future weeks)
    if (coach_sim && prefs) {
      prefs.preferences = { ...prefs.preferences, ...coach_sim };
    }

    // Pro flag — gates structured coaching programs (R556, R557, polarised)
    // Accept explicit request override; otherwise fall back to stored preference.
    const isPro = !!(is_pro ?? prefs?.preferences?.isPro);

    // Merge body profile: prefer request body fields, fall back to DB row
    const bodyProfile = {
      sex:       user_profile?.sex       ?? userProfileRow?.sex       ?? null,
      weight_kg: user_profile?.weight_kg ?? userProfileRow?.weight_kg ?? null,
      height_cm: user_profile?.height_cm ?? userProfileRow?.height_cm ?? null,
    };

    // Resolve cycle + pregnancy context from DB when user_id is present
    let resolvedCycleContext = cycle_context ?? null;
    let pregnancyContext = null;

    if (user_id) {
      const cycleRow = await env.DB.prepare(
        `SELECT tracking_mode, cycle_length_days, last_period_start,
                mode, pregnancy_due_date, postnatal_birth_date, postnatal_birth_type,
                postnatal_cleared_for_exercise
         FROM cycle_profile WHERE user_id = ? LIMIT 1`
      ).bind(user_id).first();

      if (cycleRow) {
        const bodyMode = cycleRow.mode ?? 'standard';

        if (bodyMode === 'pregnant') {
          const week = calculatePregnancyWeek(cycleRow.pregnancy_due_date, date);
          pregnancyContext = {
            mode: 'pregnant',
            week,
            trimester: getTrimester(week),
            past_due: week != null && week > 40,
          };
        } else if (bodyMode === 'postnatal') {
          const postnatalPhase = getPostnatalPhase(cycleRow.postnatal_birth_date, cycleRow.postnatal_birth_type, date);
          pregnancyContext = {
            mode: 'postnatal',
            postnatal_phase: postnatalPhase,
            postnatal_birth_type: cycleRow.postnatal_birth_type ?? null,
            postnatal_cleared_for_exercise: cycleRow.postnatal_cleared_for_exercise ?? 0,
          };
        } else if (bodyMode === 'standard' && cycleRow.tracking_mode === 'smart' && !resolvedCycleContext && bodyProfile.sex === 'female') {
          resolvedCycleContext = calculateCyclePhase(cycleRow.last_period_start, cycleRow.cycle_length_days, date);
        }
      }
    }

    // Inject per-day time_budget from weekly schedule when no check-in override
    const weeklySchedule = prefs?.preferences?.weekly_schedule;
    const dayKey = ['sun','mon','tue','wed','thu','fri','sat'][new Date(date + 'T12:00:00').getDay()];
    const scheduledDuration = weeklySchedule?.[dayKey];
    let effectiveCheckin = checkin ?? {};
    if (effectiveCheckin.time_budget == null && scheduledDuration != null) {
      effectiveCheckin = { ...effectiveCheckin, time_budget: scheduledDuration };
    }

    // Subtract time overhead when enabled — picks short profile (≤30 min) or long profile (>30 min)
    const overhead = prefs?.preferences?.time_overhead;
    if (overhead?.enabled) {
      const rawBudget = effectiveCheckin.time_budget ?? prefs?.session_duration_min ?? 30;
      const profile = rawBudget <= 30 ? (overhead.short ?? overhead) : (overhead.long ?? overhead);
      const presetTotal = Object.values(profile.presets ?? {}).reduce((s, v) => s + (v || 0), 0);
      const customTotal = (profile.custom ?? []).reduce((s, c) => s + (c.minutes || 0), 0);
      const totalOverhead = presetTotal + customTotal;
      if (totalOverhead > 0) {
        effectiveCheckin = { ...effectiveCheckin, time_budget: Math.max(5, rawBudget - totalOverhead) };
      }
    }

    // Fetch progression state for the planner (ignored for bonus sessions to keep them light)
    let progressionState = null;
    if (user_id && !bonus_session) {
      const [progRow, lastExRow] = await Promise.all([
        env.DB.prepare(
          `SELECT scores_json, last_computed_at_ms FROM user_progression WHERE user_id = ? LIMIT 1`
        ).bind(user_id).first(),
        env.DB.prepare(
          `SELECT date FROM executions WHERE user_id = ? AND status != 'skipped' ORDER BY date DESC LIMIT 1`
        ).bind(user_id).first(),
      ]);
      if (progRow) {
        progressionState = {
          scores: JSON.parse(progRow.scores_json),
          chartMode: prefs?.preferences?.progression_chart_mode
            ?? { health:'balanced', strength:'power', fat_loss:'endurance',
                 muscle_gain:'power', endurance:'endurance', mobility:'mobility' }[prefs?.training_goal ?? 'health']
            ?? 'balanced',
          last_workout_date: lastExRow?.date ?? null,
        };
      }
    }

    // Free-tier adapt path: adjust the stored weekly plan for today's check-in
    // without regenerating the exercise selection.
    if (adapt_mode && base_plan) {
      const adapted = adaptExistingPlan(base_plan, effectiveCheckin);
      if (user_id) {
        const userExists = await env.DB.prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`).bind(user_id).first();
        if (userExists) {
          const adaptId = crypto.randomUUID();
          const now = Date.now();
          await env.DB.prepare(`
            INSERT INTO day_plans (id, user_id, date, plan_status, plan_json, generated_by, engine_version, seed, created_at_ms, updated_at_ms)
            VALUES (?, ?, ?, 'final', ?, 'adapt_free', 'v1.7.0', 'adapt', ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET plan_json=excluded.plan_json, updated_at_ms=excluded.updated_at_ms
          `).bind(adaptId, user_id, date, JSON.stringify(adapted), now, now).run();
          const row = await env.DB.prepare(`SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1`).bind(user_id, date).first();
          return Response.json({ ok: true, saved: true, plan: { id: row?.id ?? adaptId, ...adapted } });
        }
      }
      return Response.json({ ok: true, saved: false, plan: adapted });
    }

    const plan = runPlanner(date, effectiveCheckin, allExercises, prefs, allTemplates, completed_exercise_ids, bodyProfile, resolvedCycleContext, pregnancyContext, bonus_session, progressionState, isPro);

    // Bonus plans are ephemeral — don't save to day_plans to avoid the
    // (user_id, date) unique index conflict with today's regular plan.
    // Return a generated id so the execution can still reference it.
    const bonusId = bonus_session ? crypto.randomUUID() : null;
    if (bonusId) {
      return Response.json({ ok: true, saved: false, plan: { id: bonusId, ...plan } });
    }

    if (user_id) {
      const userExists = await env.DB.prepare(
        `SELECT id FROM users WHERE id = ? LIMIT 1`
      ).bind(user_id).first();

      if (userExists) {
        const newId = crypto.randomUUID();
        const now = Date.now();
        await env.DB.prepare(`
          INSERT INTO day_plans
            (id, user_id, date, plan_status, plan_json, generated_by, engine_version, seed, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'final', ?, 'engine', 'v1.7.0', ?, ?, ?)
          ON CONFLICT(user_id, date) DO UPDATE SET
            plan_json = excluded.plan_json,
            updated_at_ms = excluded.updated_at_ms
        `).bind(newId, user_id, date, JSON.stringify(plan), date, now, now).run();

        // The row may have existed already (conflict on user_id+date), so fetch the actual stored id
        const row = await env.DB.prepare(
          `SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1`
        ).bind(user_id, date).first();
        const planId = row?.id ?? newId;

        return Response.json({ ok: true, saved: true, plan: { id: planId, ...plan } });
      }
    }

    return Response.json({ ok: true, saved: false, plan });

  } catch (e) {
    console.error('plan.js error:', e.stack ?? e.message ?? e);
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const date = url.searchParams.get('date');

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });

    const result = await env.DB.prepare(
      `SELECT * FROM day_plans WHERE user_id = ? AND date = ? ORDER BY created_at_ms DESC LIMIT 1`
    ).bind(user_id, date).first();

    return Response.json({ plan: result });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
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
// Progression — muscle-to-axis mapping (inline copy, keep in sync with progression.js)
// ---------------------------------------------------------------------------
const PROG_MUSCLE_TO_AXIS = {
  chest: 'push', pectorals: 'push', pectoral: 'push',
  triceps: 'push', tricep: 'push',
  deltoids: 'push', shoulders: 'push', shoulder: 'push',
  'anterior deltoid': 'push', 'front deltoid': 'push',
  back: 'pull', lats: 'pull', lat: 'pull', 'latissimus dorsi': 'pull',
  rhomboids: 'pull', rhomboid: 'pull',
  trapezius: 'pull', traps: 'pull', trap: 'pull',
  biceps: 'pull', bicep: 'pull',
  'rear deltoid': 'pull', 'posterior deltoid': 'pull',
  'rotator cuff': 'pull', 'upper back': 'pull', 'mid back': 'pull',
  quadriceps: 'legs', quads: 'legs', quad: 'legs',
  hamstrings: 'legs', hamstring: 'legs',
  glutes: 'legs', glute: 'legs', gluteus: 'legs', 'gluteus maximus': 'legs',
  calves: 'legs', calf: 'legs', gastrocnemius: 'legs', soleus: 'legs',
  'hip flexors': 'legs', 'hip flexor': 'legs',
  adductors: 'legs', adductor: 'legs', abductors: 'legs', abductor: 'legs',
  abs: 'core', abdominals: 'core', abdominal: 'core',
  obliques: 'core', oblique: 'core',
  'transverse abdominis': 'core', 'transversus abdominis': 'core',
  'lower back': 'core', 'erector spinae': 'core', erectors: 'core',
  core: 'core',
};

const PROG_CATEGORY_FALLBACK = {
  strength: 'core', cardio: 'conditioning',
  mobility: 'mobility', recovery: 'mobility', mixed: 'core', skill: 'core',
};

// Progression — goal target profiles (inline copy)
const PROG_GOAL_TARGETS = {
  health:      { push: 60, pull: 60, legs: 60, core: 60, conditioning: 55, mobility: 55 },
  strength:    { push: 80, pull: 80, legs: 80, core: 65, conditioning: 40, mobility: 40 },
  fat_loss:    { push: 50, pull: 50, legs: 60, core: 55, conditioning: 80, mobility: 45 },
  muscle_gain: { push: 75, pull: 75, legs: 75, core: 65, conditioning: 40, mobility: 35 },
  endurance:   { push: 45, pull: 45, legs: 65, core: 60, conditioning: 85, mobility: 50 },
  mobility:    { push: 40, pull: 40, legs: 45, core: 55, conditioning: 35, mobility: 85 },
  military:    { push: 70, pull: 60, legs: 75, core: 70, conditioning: 80, mobility: 40 },
};

// ---------------------------------------------------------------------------
// Sport demand vectors — per-axis load (0–1) each sport places on the body.
// Used by R560 sport bias layer to nudge goal targets toward sport-support work.
// 0.5 = neutral (no nudge), 1.0 = very high demand, 0.0 = very low demand.
// ---------------------------------------------------------------------------
const SPORT_DEMAND = {
  running:     { push: 0.1, pull: 0.1, legs: 1.0, core: 0.6, conditioning: 1.0, mobility: 0.5 },
  cycling:     { push: 0.1, pull: 0.2, legs: 0.9, core: 0.5, conditioning: 0.9, mobility: 0.4 },
  swimming:    { push: 0.6, pull: 0.9, legs: 0.4, core: 0.7, conditioning: 0.9, mobility: 0.6 },
  walking:     { push: 0.1, pull: 0.1, legs: 0.5, core: 0.3, conditioning: 0.5, mobility: 0.4 },
  rowing:      { push: 0.4, pull: 0.9, legs: 0.7, core: 0.8, conditioning: 0.8, mobility: 0.5 },
  triathlon:   { push: 0.3, pull: 0.5, legs: 0.9, core: 0.6, conditioning: 1.0, mobility: 0.5 },
  skating:     { push: 0.1, pull: 0.2, legs: 0.9, core: 0.6, conditioning: 0.8, mobility: 0.5 },
  mtb:         { push: 0.2, pull: 0.4, legs: 0.9, core: 0.7, conditioning: 0.8, mobility: 0.5 },
  ice_skating: { push: 0.1, pull: 0.2, legs: 0.9, core: 0.6, conditioning: 0.7, mobility: 0.5 },
  trail_run:   { push: 0.1, pull: 0.1, legs: 1.0, core: 0.7, conditioning: 0.9, mobility: 0.6 },
  kayaking:    { push: 0.5, pull: 0.9, legs: 0.2, core: 0.8, conditioning: 0.7, mobility: 0.5 },
  spinning:    { push: 0.1, pull: 0.1, legs: 0.9, core: 0.5, conditioning: 0.9, mobility: 0.3 },
  nordic_walk: { push: 0.3, pull: 0.3, legs: 0.6, core: 0.5, conditioning: 0.6, mobility: 0.4 },
  sup:         { push: 0.4, pull: 0.6, legs: 0.3, core: 0.9, conditioning: 0.6, mobility: 0.5 },
  open_water:  { push: 0.6, pull: 0.9, legs: 0.4, core: 0.7, conditioning: 0.9, mobility: 0.6 },
  climbing:    { push: 0.9, pull: 1.0, legs: 0.5, core: 0.9, conditioning: 0.6, mobility: 0.7 },
  kitesurfing: { push: 0.4, pull: 0.7, legs: 0.6, core: 0.8, conditioning: 0.7, mobility: 0.6 },
  duathlon:    { push: 0.1, pull: 0.2, legs: 1.0, core: 0.6, conditioning: 1.0, mobility: 0.5 },
  obstacle:    { push: 0.6, pull: 0.7, legs: 0.8, core: 0.8, conditioning: 0.8, mobility: 0.6 },
  cardio:      { push: 0.3, pull: 0.3, legs: 0.6, core: 0.5, conditioning: 0.8, mobility: 0.4 },
  golf:        { push: 0.3, pull: 0.3, legs: 0.3, core: 0.8, conditioning: 0.3, mobility: 0.9 },
  tennis:      { push: 0.6, pull: 0.5, legs: 0.7, core: 0.8, conditioning: 0.7, mobility: 0.7 },
};

const SPORT_AXES = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];

// Compute sport-biased progression targets (R560).
// Primary sport weighted 0.6, secondary sports share 0.4.
// Nudge = (sportAxis - 0.5) × 24, capped at ±12 points per axis.
// Guardrail: halve legs/conditioning nudge if user ran or rode in the last 24 h.
function computeSportBiasedTargets(baseTargets, sportPrefs, lastRunAtMs, lastRideAtMs, planDateMs) {
  const sports = sportPrefs?.sports ?? [];
  const knownSports = sports.filter(s => SPORT_DEMAND[s]);
  if (!knownSports.length) return { targets: baseTargets, biasTrace: null };

  const primary = (sportPrefs?.primary && SPORT_DEMAND[sportPrefs.primary]) ? sportPrefs.primary : knownSports[0];
  const others  = knownSports.filter(s => s !== primary);
  const otherW  = others.length > 0 ? 0.4 / others.length : 0;

  // Build weighted sport vector
  const vec = {};
  SPORT_AXES.forEach(ax => {
    vec[ax] = (SPORT_DEMAND[primary][ax] ?? 0.5) * 0.6;
    for (const s of others) vec[ax] += (SPORT_DEMAND[s][ax] ?? 0.5) * otherW;
  });

  // External-load guardrail: recent run or ride → halve legs/conditioning nudge
  const ms24h = 24 * 3600 * 1000;
  const refMs  = planDateMs ?? Date.now();
  const recentRun  = !!(lastRunAtMs  && (refMs - lastRunAtMs)  < ms24h);
  const recentRide = !!(lastRideAtMs && (refMs - lastRideAtMs) < ms24h);
  const guardrailApplied = recentRun || recentRide;

  const adjustedTargets = {};
  const adjustments = {};
  SPORT_AXES.forEach(ax => {
    let sportVal = vec[ax];
    if (guardrailApplied && (ax === 'legs' || ax === 'conditioning')) sportVal = 0.5 + (sportVal - 0.5) * 0.5;
    const nudge = Math.round((sportVal - 0.5) * 24);
    const base  = baseTargets[ax] ?? 50;
    adjustedTargets[ax] = Math.min(90, Math.max(30, base + nudge));
    adjustments[ax] = adjustedTargets[ax] - base;
  });

  return {
    targets: adjustedTargets,
    biasTrace: { primary, sports: knownSports, adjustments, guardrailApplied },
  };
}

const PROG_AXIS_CATEGORY = {
  push: 'strength', pull: 'strength', legs: 'strength',
  core: 'strength', conditioning: 'cardio', mobility: 'mobility',
};

function progGetExerciseAxis(exercise) {
  const muscles = JSON.parse(exercise.primary_muscles_json || '[]');
  for (const m of muscles) {
    const axis = PROG_MUSCLE_TO_AXIS[m.toLowerCase()];
    if (axis) return axis;
  }
  return PROG_CATEGORY_FALLBACK[exercise.category] ?? 'core';
}

function progGetDisplayScore(scores, axis, chartMode) {
  if (!scores) return 15;
  if (axis === 'mobility') return Math.round(scores.mobility?.mobility ?? 15);
  const ax = scores[axis] ?? {};
  if (chartMode === 'power')     return Math.round(ax.power     ?? 15);
  if (chartMode === 'endurance') return Math.round(ax.endurance ?? 15);
  if (chartMode === 'balanced')  return Math.round(((ax.power ?? 15) + (ax.endurance ?? 15)) / 2);
  return Math.round(ax.power ?? 15);
}

// ---------------------------------------------------------------------------
// Goal → exercise category mapping
// ---------------------------------------------------------------------------
const GOAL_CATEGORY = {
  fat_loss:     'cardio',
  muscle_gain:  'strength',
  endurance:    'cardio',
  strength:     'strength',
  health:       'strength',
  mobility:     'mobility',
  mixed:        'strength',
  military:     'strength',
};

// ---------------------------------------------------------------------------
// Goal → starting intensity (before check-in rules override)
// ---------------------------------------------------------------------------
const GOAL_INTENSITY = {
  fat_loss:     'moderate', // calorie burn without burning out
  muscle_gain:  'high',     // high effort = muscle stimulus
  endurance:    'moderate', // sustainable, aerobic zone
  strength:     'high',     // max effort for strength gains
  health:       'moderate', // comfortable, sustainable
  mobility:     'low',      // relaxed, range-of-motion focus
  mixed:        'moderate',
  military:     'high',     // military prep demands high effort
};

// ---------------------------------------------------------------------------
// Goal → base sets for a normal main session
// ---------------------------------------------------------------------------
const GOAL_SETS_BASE = {
  military:     3, // endurance-rep range: quality over max load
  fat_loss:     3, // circuit — many exercises, moderate sets
  muscle_gain:  4, // hypertrophy range
  endurance:    2, // fewer sets, time-based cardio blocks
  strength:     4, // strength range
  health:       3, // standard
  mobility:     2, // hold-based, not really set-driven
  mixed:        3,
};

// ---------------------------------------------------------------------------
// Goal → rest multiplier applied on top of getDefaultRest()
// ---------------------------------------------------------------------------
const GOAL_REST_MULT = {
  fat_loss:     0.70, // short rest = metabolic demand
  muscle_gain:  1.50, // full recovery for hypertrophy
  endurance:    0.70, // keep heart rate elevated
  strength:     2.50, // full recovery for max effort (best practice: 2–4 min → base 60s × 2.5 = 150s)
  health:       1.00,
  mobility:     0.80, // brief pause between stretches
  mixed:        1.00,
  military:     1.00, // moderate rest — maintains conditioning demand
};

// ---------------------------------------------------------------------------
// Goal → rep target for rep-based exercises (best practice per training block)
// ---------------------------------------------------------------------------
const GOAL_REPS = {
  strength:    5,  // neural adaptation — 3–5 range, heavy load
  muscle_gain: 10, // hypertrophy — 8–12 range
  fat_loss:    15, // metabolic circuit — 12–20 range
  endurance:   20, // muscular endurance — 15–25 range
  health:      12, // general fitness — 8–15 range
  mobility:    10, // hold/controlled — range less critical
  mixed:       10, // balanced default
  military:    15, // muscular endurance — matches military test rep standards
};

// ---------------------------------------------------------------------------
// Goal → coaching note shown on weighted exercises
// ---------------------------------------------------------------------------
const GOAL_COACHING_NOTE = {
  strength:    "Choose a weight where reps 4–5 feel like a genuine struggle. Rest fully (2–4 min). Add weight when all reps feel controlled.",
  muscle_gain: "Last 2 reps should be hard. Push to failure on the final set. Increase weight when the last rep stops being challenging.",
  fat_loss:    "Moderate weight, high reps — keep rest short. You should feel it but maintain form throughout.",
  endurance:   "Light weight, high reps. Maintain form throughout. Never sacrifice technique for speed.",
  health:      "Moderate weight — challenging but controlled. You should feel the effort without struggling with form.",
  mobility:    "Minimal load. Focus on full range of motion, not resistance.",
  mixed:       "Moderate effort. Last 2–3 reps should require focus. Adjust weight if it feels too easy.",
  military:    "Bodyweight quality over added load. Military fitness is about endurance of movement, not max strength. Last reps should be clean, not grinding.",
};

// ---------------------------------------------------------------------------
// Goal → exercise-count modifier on top of budget-based count
// ---------------------------------------------------------------------------
const GOAL_COUNT_MOD = {
  fat_loss:     1,  // circuit style — more variety
  muscle_gain: -1,  // fewer exercises, more sets
  endurance:    1,  // more exercises / cardio blocks
  strength:    -1,  // fewer exercises, heavier focus
  health:       0,
  mobility:     0,
  mixed:        0,
  military:     1,  // circuit-style variety for military conditioning
};

// ---------------------------------------------------------------------------
// Goal → session name pool (seeded-shuffled daily for variety)
// ---------------------------------------------------------------------------
const GOAL_SESSION_NAMES = {
  fat_loss:    ['Burn Session', 'Fat Loss Circuit', 'Metabolic Boost', 'Cardio Burn'],
  muscle_gain: ['Build Session', 'Hypertrophy Block', 'Strength & Size', 'Muscle Focus'],
  endurance:   ['Endurance Push', 'Aerobic Block', 'Cardio Session', 'Stamina Work'],
  strength:    ['Strength Session', 'Power Block', 'Heavy Work', 'Strength Focus'],
  mobility:    ['Mobility Flow', 'Flexibility Session', 'Movement Practice', 'Stretch & Recover'],
  health:      ['Daily Training', 'Health Session', 'Full Body', 'Balanced Session'],
  mixed:       ['Full Body Circuit', 'Mixed Training', 'Variety Session', 'All-Round Work'],
  military:    ['Military Training', 'Soldier Prep', 'Combat Fitness', 'Military Conditioning'],
};

// ---------------------------------------------------------------------------
// Safety & adaptation thresholds — single source of truth
// All rule comparisons use these constants. Change here, changes everywhere.
// Two thresholds intentionally differ: PAIN_REST (≥2) triggers a full rest day,
// while PAIN_BMI_COFACTOR (≥1) triggers tighter BMI running restrictions.
// Similarly STRESS_HIGH (≥7) triggers recovery bias, STRESS_LUTEAL (≥6) is a
// softer luteal-phase threshold because hormonal sensitivity compounds stress.
// ---------------------------------------------------------------------------
const T = {
  // Check-in thresholds
  SLEEP_LOW:          5,    // hours ≤ this → intensity = low (R511)
  STRESS_HIGH:        7,    // ≥ this → intensity = low (R513)
  STRESS_LUTEAL:      6,    // ≥ this + late luteal → intensity = low (R523)
  MOOD_LOW:           4,    // ≤ this → intensity step down (R517)
  MOOD_MODERATE:      6,    // ≤ this → moderate cap if high (R517)
  PAIN_REST:          2,    // ≥ this → rest day (R514)
  PAIN_BMI_COFACTOR:  1,    // ≥ this + BMI ≥ 30 → strict running removal (R545)
  ENERGY_LOW:         3,    // ≤ this → volume × 0.6 (R512)
  ENERGY_FOLLICULAR:  6,    // ≥ this (+ sleep ok) → volume boost (R521)
  SLEEP_FOLLICULAR:   5,    // ≥ this (+ energy ok) → volume boost (R521)
  // BMI thresholds
  BMI_MODERATE:       30,   // ≥ this → run-walk caution + note (R546)
  BMI_STRICT:         35,   // ≥ this → running removed entirely (R545)
  // Pregnancy thresholds
  PREGNANCY_SUPINE_WEEK: 16, // ≥ this week → supine exercises excluded (R531)
  // Conditioning score bands for safe running level selection (R555)
  RUN_LEVEL_2: 20,
  RUN_LEVEL_3: 30,
  RUN_LEVEL_4: 45,
  RUN_LEVEL_5: 60,
  RUN_LEVEL_6: 75,
  // Progression gap thresholds (R551, R554)
  PROG_GAP_BIAS:      8,    // gap ≥ this → pool reordered toward gap axis
  PROG_GAP_NOTE:      15,   // gap ≥ this → user-facing explainability note
  // Mobility decay threshold (R553)
  MOBILITY_DECAY_DAYS: 7,
};

// Gym equipment recognised when gym_today is true
const GYM_EQUIPMENT = ['none','dumbbell','barbell','cable','machine','pull_up_bar',
  'bench','bench_press_rack','squat_rack','kettlebell','resistance_band','weight_plates',
  'exercise_bike','rowing_machine','treadmill','indoor_bike','running_shoes','multi_gym',
  'road_bike','mountain_bike'];

// Cycling equipment — triggers cycling coach rule
const CYCLING_EQUIPMENT = ['road_bike','mountain_bike','indoor_bike','exercise_bike'];

// Polarised running programs: each week entry = { hiit: level, zone2: level }
// Mon & Fri sessions use hiit level (run/walk intervals), Wed uses zone2 level (continuous easy run).
// hiit levels 1–6 = run-interval-level-N, zone2 levels 7–21 = run-continuous-level-N
const RUN_PROGRAMS = {
  5: [
    {hiit:2,zone2:7},{hiit:3,zone2:7},{hiit:3,zone2:8},{hiit:4,zone2:8},
    {hiit:4,zone2:9},{hiit:5,zone2:9},{hiit:5,zone2:9},{hiit:6,zone2:10},
  ],
  10: [
    {hiit:3,zone2:8},{hiit:4,zone2:8},{hiit:4,zone2:9},{hiit:5,zone2:9},
    {hiit:5,zone2:10},{hiit:6,zone2:10},{hiit:6,zone2:11},{hiit:6,zone2:11},
    {hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},
  ],
  15: [
    {hiit:4,zone2:9},{hiit:5,zone2:10},{hiit:5,zone2:10},{hiit:6,zone2:11},
    {hiit:6,zone2:11},{hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},
    {hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:14},{hiit:6,zone2:14},
  ],
  20: [
    {hiit:5,zone2:10},{hiit:5,zone2:11},{hiit:6,zone2:11},{hiit:6,zone2:12},
    {hiit:6,zone2:12},{hiit:6,zone2:13},{hiit:6,zone2:13},{hiit:6,zone2:13},
    {hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
  ],
  30: [
    {hiit:5,zone2:11},{hiit:6,zone2:12},{hiit:6,zone2:12},{hiit:6,zone2:13},
    {hiit:6,zone2:13},{hiit:6,zone2:14},{hiit:6,zone2:14},{hiit:6,zone2:14},
    {hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},{hiit:6,zone2:15},
    {hiit:6,zone2:15},{hiit:6,zone2:16},{hiit:6,zone2:16},{hiit:6,zone2:16},
    {hiit:6,zone2:16},{hiit:6,zone2:17},{hiit:6,zone2:17},{hiit:6,zone2:17},
  ],
};
const RUN_WARMUP_TAG = 'run_warmup';

// ---------------------------------------------------------------------------
// Military Coach constants (R570–R582)
// ---------------------------------------------------------------------------

// Map (track, cluster) → program group key
function getMilitaryGroup(track, cluster) {
  if (track === 'opleiding') {
    // O1–O6 (6 levels): thirds = 1-2 / 3-4 / 5-6
    if (cluster <= 2) return 'opleiding_low';
    if (cluster <= 4) return 'opleiding_mid';
    return 'opleiding_high';
  }
  // Keuring KB–K6 (7 levels: 0–6): thirds = 0-2 / 3-4 / 5-6
  if (cluster <= 2) return 'keuring_low';
  if (cluster <= 4) return 'keuring_mid';
  return 'keuring_high';
}

// Rolling block sequences per group — 4 training sessions per block, then rest is earned.
// No calendar-day dependency: any day can be a training day. Rest is a reward for work done.
//
// Sequence design (evidence-based periodization):
//   Session 1 — Zone 2 run (duurloop): aerobic base, lowest CNS demand, safe day-1 opener
//   Session 2 — Strength (kracht): neuromuscular work on aerobically-primed muscles
//   Session 3 — Intervals: highest VO2max stimulus, separated from Zone2 by a strength day
//   Session 4 — Strength/March: consolidates gains, lower intensity before earned rest
//   REST: earned recovery — adaptation happens here, not in the training sessions
const BLOCK_SEQUENCES = {
  keuring_low:    ['duurloop', 'kracht',        'interval', 'kracht'],
  keuring_mid:    ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  keuring_high:   ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  opleiding_low:  ['duurloop', 'kracht',        'interval', 'kracht'],
  opleiding_mid:  ['duurloop', 'kracht',        'interval', 'kracht_marsen'],
  opleiding_high: ['duurloop', 'kracht_marsen', 'interval', 'kracht_marsen'],
};
const SESSIONS_PER_BLOCK = 4;

// Volume progression across 6-block periodization cycle (index = cyclePosn - 1)
// Blocks 1-2: base (on-ramp → build), Blocks 3-4: peak volume, Block 5: deload, Block 6: peak/taper
const BLOCK_VOLUMES = [0.75, 0.85, 1.00, 1.10, 0.60, 0.90];

// ---------------------------------------------------------------------------
// computeMilitaryPhase — rolling block-counter scheduler
// ---------------------------------------------------------------------------
// Returns { blockNum, blockIdx, cyclePosn, inBaseBuild, milWeek (=blockNum),
//           milDay (=blockIdx), milGroup, clusterLive, sessionType, milVol,
//           isPostAssessment, checkInOverride }
//
// No calendar-day dependency. Scheduling is driven entirely by block_session_index
// (how many sessions completed in the current block) and block_number (total blocks
// completed since enrollment). Rest is earned after SESSIONS_PER_BLOCK training
// sessions, not assigned to a fixed weekday.
//
// Check-in signals partially bypass R581 for safety (body always wins over schedule):
//   recovery_mode or general pain → rest override
//   low energy → intensity downgrade (interval → duurloop, duurloop → kracht)
//   poor sleep → volume ×0.85
function computeMilitaryPhase(milCoach, checkIn, date) {
  const todayMs    = new Date(date + 'T12:00:00Z').getTime();
  const blockIdx   = milCoach.block_session_index ?? 0;  // 0–3 = training; ≥4 = rest earned
  const blockNum   = milCoach.block_number ?? 1;          // total blocks since enrollment

  const assessmentDate = milCoach.target_date;
  const assessMs = assessmentDate ? new Date(assessmentDate + 'T12:00:00Z').getTime() : null;
  const isPostAssessment = assessMs !== null && todayMs > assessMs && milCoach.mode !== 'open';

  const clusterLive = milCoach.cluster_current ?? milCoach.cluster_target ?? 1;
  const milGroup    = getMilitaryGroup(milCoach.track ?? 'keuring', clusterLive);

  // Position within 6-block periodization cycle (1–6)
  const cyclePosn   = ((blockNum - 1) % 6) + 1;
  const inBaseBuild = cyclePosn <= 2;

  // Determine session type from rolling block sequence
  const isRestBlock = blockIdx >= SESSIONS_PER_BLOCK;
  const blockSeq    = BLOCK_SEQUENCES[milGroup] ?? BLOCK_SEQUENCES.keuring_low;
  let sessionType   = isRestBlock ? 'rust' : (blockSeq[blockIdx] ?? 'kracht');

  // Cooper test: on first-ever session (no baseline yet), or at cycle start (block 1 of each 6-block cycle)
  if (!isRestBlock && blockIdx === 0 && (!milCoach.last_cooper_distance_m || cyclePosn === 1)) {
    sessionType = 'cooper_test';
  }

  // Volume from 6-block periodization cycle
  let milVol = BLOCK_VOLUMES[cyclePosn - 1] ?? 1.0;

  // Target mode: taper intensity near assessment date
  if (milCoach.mode === 'target' && assessMs && !isPostAssessment) {
    const daysOut = Math.ceil((assessMs - todayMs) / 86_400_000);
    if (daysOut <= 7)       milVol = Math.min(milVol, 0.60); // taper week
    else if (daysOut <= 14) milVol = Math.min(milVol, 0.75); // pre-taper
  }

  // Check-in safety integration (partial R581 bypass — body state always wins over schedule)
  const recoveryMode = !!(checkIn?.recovery_mode ?? checkIn?.checkin_json?.recovery_mode);
  const energy    = checkIn?.energy    ?? 10;
  const sleep     = checkIn?.sleep_hours ?? 8;
  const painLevel = checkIn?.pain_level  ?? 0;
  const painScope = checkIn?.pain_scope  ?? null;
  const painGeneral = painLevel >= 2 && painScope !== 'specific';

  let checkInOverride = null;
  if (!isRestBlock) {
    if (recoveryMode || painGeneral) {
      sessionType = 'rust';
      checkInOverride = recoveryMode ? 'recovery_mode' : 'pain';
    } else if (energy <= 3 && sessionType === 'interval') {
      sessionType = 'duurloop';   // downgrade HIIT to zone2 on low energy
      checkInOverride = 'low_energy';
    } else if (energy <= 3 && (sessionType === 'duurloop' || sessionType === 'kracht_marsen')) {
      sessionType = 'kracht';     // downgrade to strength (safest low-energy option)
      checkInOverride = 'low_energy';
    }
  }
  if (sleep <= 5) milVol *= 0.85; // poor sleep → volume reduction regardless of session type

  return {
    blockNum,
    blockIdx,
    cyclePosn,
    inBaseBuild,
    milWeek: blockNum,   // alias kept for label compatibility
    milDay:  blockIdx,   // alias kept for return-object compatibility
    milGroup,
    clusterLive,
    sessionType,
    milVol,
    isPostAssessment,
    checkInOverride,
  };
}

// Prescribed march weight (kg) per group per week (0 = no march / bodyweight)
// R577 caps actual increase at +5 kg from last week's weight
const MIL_MARCH_KG = {
  keuring_low:    [ 0,  0,  5, 10,  0,  0],
  keuring_mid:    [ 0,  5, 10, 15,  0,  0],
  keuring_high:   [ 5, 10, 15, 20,  0, 10],
  opleiding_low:  [ 0,  0,  5, 10,  0,  0],
  opleiding_mid:  [ 0,  5, 10, 20,  0,  0],
  opleiding_high: [ 0, 10, 15, 25,  0, 10],
};

// Prescribed march duration (seconds) per group per week
const MIL_MARCH_SEC = {
  keuring_low:    [   0,    0,  900, 1200,    0,    0],
  keuring_mid:    [   0,  900, 1200, 1500,    0,    0],
  keuring_high:   [ 900, 1200, 1500, 1800,    0,  900],
  opleiding_low:  [   0,    0,  900, 1200,    0,    0],
  opleiding_mid:  [   0,  900, 1200, 1800,    0,    0],
  opleiding_high: [   0, 1200, 1800, 2400,    0, 1200],
};

// Peak run levels per group: { zone2: continuous level, hiit: interval level }
// zone2 maps to run-continuous-level-N (7+), hiit maps to run-interval-level-N (1-6)
const MIL_CLUSTER_RUN_PEAK = {
  keuring_low:    { zone2:  9, hiit: 3 },
  keuring_mid:    { zone2: 12, hiit: 5 },
  keuring_high:   { zone2: 15, hiit: 6 },
  opleiding_low:  { zone2:  9, hiit: 3 },
  opleiding_mid:  { zone2: 12, hiit: 5 },
  opleiding_high: { zone2: 16, hiit: 6 },
};

// Week offset applied to peak run level (index = week - 1)
// Negative = easier level than peak; 0 = at peak
const MIL_RUN_WEEK_OFFSET = [-3, -2, -1, 0, -3, -1];

// ---------------------------------------------------------------------------
// Template selector
// ---------------------------------------------------------------------------
function pickTemplate(templates, slotType, intensity, budgetMin) {
  if (slotType === 'rest') return null;

  const diffMap = { low: 'easy', moderate: 'moderate', high: 'hard' };
  const wantDiff = diffMap[intensity] || 'moderate';

  let candidates = templates.filter(t =>
    slotType === 'micro'
      ? t.duration_min <= 15
      : t.duration_min > 15 && t.duration_min <= budgetMin + 10
  );

  if (!candidates.length) candidates = templates;

  const preferred = candidates.filter(t => t.difficulty === wantDiff);
  return preferred.length ? preferred[0] : candidates[0];
}

// ---------------------------------------------------------------------------
// Cycle phase calculation (standard cycle)
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
// Pregnancy helpers
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Exercise tag helper
// ---------------------------------------------------------------------------
function hasTags(exercise, ...tags) {
  const t = JSON.parse(exercise.tags_json || '[]');
  return tags.some(tag => t.includes(tag));
}

// ---------------------------------------------------------------------------
// Rest duration helper — used per step in the plan
// ---------------------------------------------------------------------------
function getDefaultRest(exercise, slotType) {
  const tags = JSON.parse(exercise?.tags_json || '[]');
  if (slotType === 'micro') return 20;
  if (tags.includes('pelvic_floor')) return 30;
  if (tags.includes('mobility')) return 20;
  if (tags.includes('run_warmup')) return 10;
  // Run intervals encode their walk-recovery duration in metrics_json
  const metrics = exercise?.metrics_json ? JSON.parse(exercise.metrics_json) : {};
  if (metrics.custom_rest_sec != null) return metrics.custom_rest_sec;
  if (tags.includes('cardio')) return 30;
  if (tags.includes('bodyweight')) return 45;
  return 60;
}

// ---------------------------------------------------------------------------
// Core planner — pure function, no DB calls
// ---------------------------------------------------------------------------
function runPlanner(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile, cycleContext, pregnancyContext, bonusSession, progressionState, isPro = false) {
  const trace = [];
  const isProEnabled = !!isPro;
  // Use plan date as reference for all time-relative rule decisions (keeps planner deterministic)
  const planDateMs = new Date(date + 'T12:00:00Z').getTime();
  const goal = prefs?.training_goal ?? 'health';
  const expLevel = prefs?.experience_level ?? 'intermediate';
  const runCoach = prefs?.preferences?.run_coach;

  // Starting intensity comes from the user's goal — rules below may override downward
  let intensity = GOAL_INTENSITY[goal] ?? 'moderate';
  trace.push(`R500 — Goal: ${goal} → initial intensity: ${intensity}`);

  // ------------------------------------------------------------------
  // R500a: Intensity Preference — persistent user preference (1–10 scale)
  // Stored as prefs.intensity_pref. Acts as a soft ceiling BEFORE check-in
  // rules can override further downward. A user who consistently prefers
  // gentler sessions should not be pushed high just because their goal is
  // strength or muscle_gain. Philosophy: adjust the sport to your life.
  //   pref 1–3 → cap at 'low'    (very gentle preference)
  //   pref 4–5 → cap at 'moderate' (moderate preference, downgrade high→moderate)
  //   pref 6–10 → no cap (goal-based intensity stands)
  // ------------------------------------------------------------------
  const intensityPref = prefs?.intensity_pref ?? null;
  if (intensityPref !== null) {
    if (intensityPref <= 3 && (intensity === 'high' || intensity === 'moderate')) {
      intensity = 'low';
      trace.push(`R500a — Intensity pref ${intensityPref}/10 → capped at low`);
    } else if (intensityPref <= 5 && intensity === 'high') {
      intensity = 'moderate';
      trace.push(`R500a — Intensity pref ${intensityPref}/10 → capped at moderate`);
    }
  }

  let slot_type = 'main';
  let pool = [...exercises];
  pool = pool.filter(ex => !JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
  pool = pool.filter(ex => !JSON.parse(ex.tags_json || '[]').includes('session_phase'));

  // Filter out already-done exercises (bonus session deduplication)
  if (completedIds?.length) {
    const doneSet = new Set(completedIds);
    pool = pool.filter(e => !doneSet.has(e.id));
    trace.push(`Bonus dedup — excluded ${completedIds.length} completed exercise(s)`);
  }

  // Default budget: from preferences or checkin or 30 min
  // 999 is the sentinel for "120+ / no time limit" — treat as a large but finite value
  const prefBudget = prefs?.session_duration_min ?? 30;
  const rawBudget  = checkIn?.time_budget ?? prefBudget;
  const unlimited  = rawBudget >= 999;
  const budget     = unlimited ? 120 : rawBudget; // normalise for count/threshold logic; run coach uses sessionDurSec separately

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
  // Bonus session overrides — keep it fresh and manageable
  // ------------------------------------------------------------------
  if (bonusSession) {
    if (budget <= 15) {
      slot_type = 'micro';
      if (intensity === 'high') intensity = 'low';
      else if (intensity === 'moderate') intensity = 'low';
      trace.push('Bonus session (≤15 min) — micro slot, low intensity to protect recovery');
    } else {
      if (intensity === 'high') intensity = 'moderate';
      trace.push('Bonus session (>15 min) — intensity capped at moderate');
    }
  }

  // ── Intensity override stack ──────────────────────────────────────────────
  // Rules below may ONLY REDUCE intensity, never increase it. Any future rule
  // that needs to increase intensity MUST be placed before this block.
  // Precedence (highest authority listed last — last write wins):
  //   Goal baseline (R500)
  //   < Sleep (R511)  < Stress (R513)  < Mood (R517)
  //   < Period / late-luteal (R520, R523)
  //   < Pregnancy T1/T2 (R530)  < Pregnancy T3 (R530)
  // Volume boosters (R521 follicular) use volumeMultiplier, NOT intensity,
  // so they cannot accidentally undo a safety cap.
  // ─────────────────────────────────────────────────────────────────────────

  let volumeMultiplier = 1.0;
  let sessionNotes = null;
  const addNote = (note) => { sessionNotes = (sessionNotes ? sessionNotes + ' ' : '') + note; };

  // ------------------------------------------------------------------
  // R511: Sleep Intensity + Volume Cap
  // Poor sleep impairs muscle recovery, coordination, and injury resistance.
  // Both intensity AND volume are reduced: doing 85% of normal reps at low
  // intensity is the safest choice. The body needs more rest, not more reps.
  // ------------------------------------------------------------------
  if ((checkIn?.sleep_hours ?? 8) <= T.SLEEP_LOW) {
    intensity = 'low';
    volumeMultiplier = Math.min(volumeMultiplier, 0.85);
    trace.push(`R511 — Poor sleep (≤${T.SLEEP_LOW}h) → intensity capped at low, volume ×0.85`);
  }

  // ------------------------------------------------------------------
  // R513: Stress Recovery Bias
  // ------------------------------------------------------------------
  if ((checkIn?.stress ?? 0) >= T.STRESS_HIGH) {
    intensity = 'low';
    trace.push('R513 — High stress → recovery bias');
  }

  // ------------------------------------------------------------------
  // R558: Return-to-Training Inactivity Re-Ramp
  // If last workout was ≥14 days ago, cap volume at 0.75 to prevent
  // post-break overload. Bypassed for military coach (has own periodisation)
  // and pregnancy/postnatal (has own safety rules).
  // ------------------------------------------------------------------
  const lastWorkoutDate = progressionState?.last_workout_date ?? null;
  const isMilCoachActive = !!(prefs?.preferences?.military_coach?.active);
  if (lastWorkoutDate && !isMilCoachActive && !pregnancyContext) {
    const planDateMsLocal = new Date(date + 'T12:00:00Z').getTime();
    const lastWorkoutMs = new Date(lastWorkoutDate + 'T12:00:00Z').getTime();
    const gapDays = Math.floor((planDateMsLocal - lastWorkoutMs) / 86_400_000);
    if (gapDays >= 14) {
      volumeMultiplier = Math.min(volumeMultiplier, 0.75);
      trace.push(`R558 — Back after ${gapDays}-day break → volume ×0.75 (return-to-training re-ramp)`);
    }
  }

  // ------------------------------------------------------------------
  // R514: Pain Safety Override
  // pain_level ≥ PAIN_REST AND (no scope OR scope='general') → rest day.
  // pain_level ≥ 1 AND scope='specific' with named areas → handled by R562–R563.
  // ------------------------------------------------------------------
  const painLevel   = checkIn?.pain_level ?? 0;
  const painScope   = checkIn?.pain_scope  ?? null;
  const painAreas   = checkIn?.pain_areas  ?? [];
  const isSpecificPain = painScope === 'specific' && painAreas.length > 0;

  if (painLevel >= T.PAIN_REST && !isSpecificPain) {
    slot_type = 'rest';
    trace.push(`R514 — Pain ≥${T.PAIN_REST} (${painScope ?? 'unset'}) → rest session`);
  }

  // ------------------------------------------------------------------
  // R562–R565: Injury-Aware Exercise Filtering
  // Merge daily pain_areas with profile chronic_injury_areas.
  // Remove exercises tagged with the corresponding contraindication tag.
  // ------------------------------------------------------------------
  const INJURY_TAG_MAP = {
    knee:        'loads_knee',
    shoulder:    'loads_shoulder',
    lower_back:  'loads_lower_back',
    ankle:       'loads_ankle',
  };

  const chronicAreas  = prefs?.preferences?.chronic_injury_areas ?? [];
  const injuryAreas   = [...new Set([...(isSpecificPain ? painAreas : []), ...chronicAreas])];

  if (injuryAreas.length > 0 && slot_type !== 'rest') {
    const forbiddenTags = injuryAreas.map(a => INJURY_TAG_MAP[a]).filter(Boolean);
    if (forbiddenTags.length > 0) {
      const before = pool.length;
      // R563: remove contraindicated exercises from pool
      pool = pool.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return !forbiddenTags.some(ft => tags.includes(ft));
      });
      trace.push(`R563 — Injury filter [${injuryAreas.join(',')}]: ${before} → ${pool.length} exercises`);
    }

    // R564: supplement with safe mobility/recovery if pool falls too small
    if (pool.length < 3) {
      const safePool = exercises.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        if (forbiddenTags.some(ft => tags.includes(ft))) return false;
        return tags.includes('mobility') || tags.includes('recovery');
      });
      const toAdd = seededShuffle(safePool, date).slice(0, 3 - pool.length);
      pool = [...pool, ...toAdd];
      trace.push(`R564 — Pool < 3 after injury filter → added ${toAdd.length} safe mobility/recovery exercises`);
    }

    // R565: coaching note for injury-adapted session
    const AREA_LABELS = { knee: 'knee', shoulder: 'shoulder', lower_back: 'lower back', ankle: 'ankle' };
    const noteAreas = injuryAreas.map(a => AREA_LABELS[a] ?? a).join(' & ');
    addNote(`Session adjusted for ${noteAreas} discomfort. Stop any exercise that causes sharp or worsening pain.`);
    trace.push(`R565 — Session note added for injury areas: ${noteAreas}`);
  }

  // ------------------------------------------------------------------
  // R559: User-Initiated Recovery Mode
  // "Taking it easy today" toggle → low intensity, mobility/recovery pool.
  // Bypassed for military/pregnancy modes (they own their session type).
  // ------------------------------------------------------------------
  const recoveryMode = !!(checkIn?.recovery_mode ?? checkIn?.checkin_json?.recovery_mode);
  if (recoveryMode && !isMilCoachActive && !pregnancyContext) {
    intensity = 'low';
    pool = pool.filter(ex => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('mobility') || tags.includes('recovery') || ex.category === 'mobility' || ex.category === 'recovery';
    });
    trace.push('R559 — Recovery mode → low intensity, mobility/recovery pool');
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
  // 'chair' is treated as always-available (everyone has a chair)
  const ALWAYS_AVAILABLE = new Set(['none', 'chair']);
  const userEquip = prefs?.preferences?.available_equipment ?? null;
  // Default: if equipment is not configured, treat as bodyweight-only (safe default)
  const effectiveEquip = (userEquip && userEquip.length > 0) ? userEquip : ['none'];
  const forceBodyweight = checkIn?.no_gear || checkIn?.traveling;
  const profileBodyweightOnly = effectiveEquip.length === 1 && effectiveEquip[0] === 'none';

  if (forceBodyweight || profileBodyweightOnly) {
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => ALWAYS_AVAILABLE.has(e));
    });
    const reason = forceBodyweight ? 'checkin no_gear/traveling' : 'profile equipment=none';
    trace.push(`R516 — Bodyweight only (${reason}) → ${pool.length} exercises remain`);
  } else {
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => ALWAYS_AVAILABLE.has(e) || effectiveEquip.includes(e));
    });
    trace.push(`R516 — Equipment filter from profile → ${pool.length} exercises remain`);
  }

  // ------------------------------------------------------------------
  // R517: Mood adjustment
  // ------------------------------------------------------------------
  const mood = checkIn?.mood ?? null;
  if (mood !== null) {
    if (mood <= T.MOOD_LOW) {
      // Low mood (UI score ≤2) — pull toward recovery
      if (intensity === 'high') intensity = 'moderate';
      else if (intensity === 'moderate') intensity = 'low';
      trace.push(`R517 — Low mood (${mood}/10) → intensity reduced, recovery bias`);
    } else if (mood <= T.MOOD_MODERATE) {
      // Below-average mood (UI score ≤3) — soften one step if already high
      if (intensity === 'high') intensity = 'moderate';
      trace.push(`R517 — Below-average mood (${mood}/10) → intensity moderated`);
    }
  }

  // ------------------------------------------------------------------
  // R518: Gym today — expand available equipment
  // ------------------------------------------------------------------
  if (checkIn?.gym_today) {
    // Re-filter pool allowing all gym equipment on top of bodyweight
    pool = exercises.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => GYM_EQUIPMENT.includes(e));
    });
    // Re-apply clothing/travel restrictions on top of gym pool
    if (checkIn?.no_gear || checkIn?.traveling) {
      pool = pool.filter(ex => {
        const equip = JSON.parse(ex.equipment_required_json || '["none"]');
        return equip.includes('none');
      });
    }
    // Re-apply no_clothing stealth filter — R518 rebuilds from full exercises so R515 must be reapplied
    if (checkIn?.no_clothing) {
      pool = pool.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
      });
    }
    trace.push(`R518 — Gym today → gym equipment unlocked (${pool.length} exercises available)`);
  }

  // ------------------------------------------------------------------
  // BMI — calculated here so R545/R546 and cycle rules can both use it
  const weightKg = bodyProfile?.weight_kg ?? null;
  const heightCm = bodyProfile?.height_cm ?? null;
  const bmi = (weightKg && heightCm && heightCm > 0)
    ? weightKg / ((heightCm / 100) ** 2)
    : null;

  // R545/R546: BMI-aware running caution
  // Running exercises identified by equipment_required containing 'running_shoes'
  // or treadmill + high_impact tag (treadmill running).
  // ------------------------------------------------------------------
  const isRunningEx = (ex) => {
    const equip = JSON.parse(ex.equipment_required_json || '["none"]');
    const tags  = JSON.parse(ex.tags_json || '[]');
    return equip.includes('running_shoes') ||
      (equip.includes('treadmill') && tags.includes('high_impact'));
  };

  if (bmi !== null && bmi >= T.BMI_MODERATE && slot_type !== 'rest' && !isMilCoachActive) {
    const hasPain     = (checkIn?.pain_level ?? 0) >= T.PAIN_BMI_COFACTOR;
    const isNovice    = expLevel === 'beginner';
    // Strict tier: BMI ≥ 35, OR BMI ≥ 30 with pain — running fully removed
    const strictMode  = bmi >= T.BMI_STRICT || (bmi >= T.BMI_MODERATE && hasPain);
    // Moderate tier: BMI 30–35, no pain — running allowed but intensity capped
    const moderateMode = !strictMode && bmi >= T.BMI_MODERATE;

    if (strictMode) {
      // R545 — Remove all running; fall back to low-impact cardio
      const beforeCount = pool.length;
      pool = pool.filter(ex => !isRunningEx(ex));
      // If that left no cardio at all, add low-impact cardio back in
      if (!pool.some(ex => ex.category === 'cardio')) {
        const lowImpact = exercises.filter(ex =>
          ex.category === 'cardio' &&
          JSON.parse(ex.tags_json || '[]').includes('low_impact') &&
          !isRunningEx(ex)
        );
        pool = [...pool, ...lowImpact];
      }
      const note = bmi >= T.BMI_STRICT
        ? `BMI ${bmi.toFixed(0)}+: Running is removed from today's plan. Cycling, rowing, and brisk walking deliver excellent cardio with far less joint load. Build leg and glute strength first — that's the real foundation for running.`
        : `BMI ${bmi.toFixed(0)} + current discomfort: Swapping running for low-impact cardio today. Listen to your body — pain that changes your gait is a signal to stop.`;
      addNote(note);
      if (intensity === 'high') intensity = 'moderate';
      trace.push(`R545 — BMI ${bmi.toFixed(1)} (strict) — running filtered out (${beforeCount - pool.length} removed), low-impact cardio preferred`);
    } else if (moderateMode) {
      // R546 — Keep running but cap intensity + add gradual build-up note
      if (intensity === 'high') intensity = 'moderate';
      const note = isNovice
        ? `BMI ${bmi.toFixed(0)}: Starting with walk-run intervals is the smart play. Aim to increase total running by no more than 10% per week. Strength work for your calves, quads, and glutes will make every run easier.`
        : `BMI ${bmi.toFixed(0)}: Build gradually — no more than 10% more running per week. A run-walk plan works well at this stage. Strength training alongside running significantly reduces injury risk.`;
      addNote(note);
      trace.push(`R546 — BMI ${bmi.toFixed(1)} (moderate caution) — run-walk progression recommended, intensity capped at moderate`);
    }
  }

  // ------------------------------------------------------------------
  // Body-aware rules (R520–R525) — standard cycle only
  // ------------------------------------------------------------------
  const sex = bodyProfile?.sex ?? null;
  if (bmi !== null) trace.push(`BMI: ${bmi.toFixed(1)}`);
  const phase = cycleContext?.phase ?? null;
  const cycleDay = cycleContext?.day ?? null;
  const cycleLengthDays = cycleContext?.cycle_length_days ?? 28;
  const periodToday = checkIn?.checkin_json?.period_today ?? checkIn?.period_today ?? false;

  // Only apply cycle rules when NOT in pregnancy/postnatal mode
  const isStandardMode = !pregnancyContext || pregnancyContext.mode === undefined;

  if (isStandardMode) {
    // R520 — Period day override
    if (periodToday || phase === 'menstrual') {
      intensity = 'low';
      trace.push('R520 — Your body is asking for gentleness today');
    }

    // R521 — Follicular energy boost (multiplicative — cannot override a safety reduction)
    if (phase === 'follicular' && (checkIn?.energy ?? 10) >= T.ENERGY_FOLLICULAR && (checkIn?.sleep_hours ?? 8) >= T.SLEEP_FOLLICULAR) {
      volumeMultiplier *= 1.15;
      trace.push('R521 — Your energy is building — time to be strong');
    }

    // R522 — Ovulation peak
    if (phase === 'ovulation') {
      addNote('Take an extra minute to warm up today — your body is ready to perform.');
      trace.push('R522 — You\'re at your peak — let\'s make the most of it');
    }

    // R523 — Late luteal wind-down
    if (phase === 'luteal') {
      const isLateLuteal = cycleDay != null && cycleDay >= (cycleLengthDays - 5);
      if (isLateLuteal) {
        if (intensity === 'high') intensity = 'moderate';
        if (intensity === 'moderate' && (checkIn?.stress ?? 0) >= T.STRESS_LUTEAL) intensity = 'low';
        trace.push('R523 — Winding down this week, staying consistent');
      }
    }
  }

  // ==================================================================
  // PREGNANCY RULES (R530–R537)
  // ==================================================================
  if (pregnancyContext?.mode === 'pregnant') {
    const week = pregnancyContext.week ?? 1;
    const trimester = pregnancyContext.trimester ?? 1;
    const nauseaToday = checkIn?.pregnancy_signals?.nausea ?? false;
    const breathlessToday = checkIn?.pregnancy_signals?.breathless ?? false;

    // R530 — Intensity cap by trimester
    if (trimester === 3) {
      if (intensity === 'high' || intensity === 'moderate') intensity = 'low';
      trace.push('R530 — T3: intensity capped at low');
    } else {
      if (intensity === 'high') intensity = 'moderate';
      trace.push(`R530 — T${trimester}: intensity capped at moderate`);
    }

    // R531 — Supine filter after week 16
    if (week >= T.PREGNANCY_SUPINE_WEEK) {
      pool = pool.filter(ex => !hasTags(ex, 'supine'));
      trace.push(`R531 — Week ${week}: supine exercises filtered out`);
    }

    // R532 — High impact excluded throughout pregnancy
    pool = pool.filter(ex => !hasTags(ex, 'high_impact'));
    trace.push('R532 — High-impact exercises excluded during pregnancy');

    // R533 — Absolute exclusions
    pool = pool.filter(ex => !hasTags(ex, 'valsalva', 'inversion', 'crunch'));
    // Prone excluded from T2 onwards
    if (trimester >= 2) {
      pool = pool.filter(ex => !hasTags(ex, 'prone'));
      trace.push('R533 — T2+: prone exercises excluded');
    }
    trace.push('R533 — Absolute exclusions: valsalva, inversion, crunch');

    // R534 — Pelvic floor inclusion T2+
    // Handled after step building

    // R535 — Nausea override → recovery/breathing
    if (nauseaToday) {
      slot_type = 'micro';
      const nauseaPool = exercises.filter(ex => hasTags(ex, 'breathing', 'recovery') && !hasTags(ex, 'high_impact', 'supine'));
      if (nauseaPool.length) pool = nauseaPool;
      addNote('Gentle movement only today. Listen to your body — rest is always the right choice.');
      trace.push('R535 — Nausea today → breathing/recovery focus');
    }

    // R536 — T3 breathlessness adaptation
    if (trimester === 3 && breathlessToday) {
      volumeMultiplier = 0.8;
      addNote('Shorter intervals today — pause when you need to breathe.');
      trace.push('R536 — T3 breathlessness → volume ×0.8');
    }

    // R537 — Post-due-date flag
    if (pregnancyContext.past_due) {
      addNote('When your baby arrives, switch to postnatal mode in Settings.');
      trace.push('R537 — Past due date: postnatal transition prompt added');
    }
  }

  // ==================================================================
  // POSTNATAL RULES (R540–R544)
  // ==================================================================
  if (pregnancyContext?.mode === 'postnatal') {
    const postnatalCleared = pregnancyContext.postnatal_cleared_for_exercise === 1;
    let postnatalPhase = pregnancyContext.postnatal_phase ?? 'immediate';
    const birthType = pregnancyContext.postnatal_birth_type ?? null;
    const isCaesarean = birthType === 'caesarean';

    // ------------------------------------------------------------------
    // R539 — Postnatal clearance gate: if user has not confirmed exercise
    //        clearance with a healthcare provider, hold at immediate-phase
    //        restrictions regardless of how many days have elapsed.
    //        Prevents auto-phase-advancement before medical sign-off.
    // ------------------------------------------------------------------
    if (!postnatalCleared && postnatalPhase !== 'immediate') {
      postnatalPhase = 'immediate';
      // Propagate to pregnancyContext so downstream code (targetCategory, isGentleMode,
      // session name) consistently sees the held phase and not the time-derived phase.
      pregnancyContext.postnatal_phase = 'immediate';
      addNote('Your session is kept gentle until you confirm exercise clearance with your healthcare provider. When you\'re cleared, update your status in Settings.');
      trace.push('R539 — Postnatal clearance not confirmed — holding at immediate-phase restrictions');
    }

    // R540 — Phase absolute rules: filter pool by allowed exercise tags
    if (postnatalPhase === 'immediate') {
      // Only pelvic floor, breathing, and recovery
      pool = exercises.filter(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'));
      intensity = 'low';
      slot_type = pool.length ? slot_type : 'rest';
      trace.push('R540 — Immediate phase: pelvic floor, breathing, recovery only');
    } else if (postnatalPhase === 'early') {
      // Pelvic floor + mobility (no strength, no high impact)
      pool = exercises.filter(ex =>
        hasTags(ex, 'pelvic_floor', 'breathing', 'recovery') ||
        (ex.category === 'mobility' && hasTags(ex, 'low_impact') && !hasTags(ex, 'high_impact'))
      );
      intensity = 'low';
      trace.push('R540 — Early phase: pelvic floor, breathing, light mobility');
    } else if (postnatalPhase === 'rebuilding') {
      // Add bodyweight strength, exclude high impact, crunch, valsalva
      pool = exercises.filter(ex => {
        if (hasTags(ex, 'high_impact', 'crunch', 'valsalva')) return false;
        if (hasTags(ex, 'dumbbell') && !hasTags(ex, 'pelvic_floor')) return false; // no dumbbells yet
        return true;
      });
      if (isCaesarean) {
        pool = pool.filter(ex => !hasTags(ex, 'prone'));
        trace.push('R542 — Caesarean: prone exercises excluded in rebuilding phase');
      }
      addNote('Check for abdominal separation (diastasis recti) if you haven\'t already — speak to your physiotherapist.');
      trace.push('R540 — Rebuilding phase: bodyweight only, no crunch/high-impact');
      trace.push('R543 — Diastasis recti check reminder added');
    } else if (postnatalPhase === 'strengthening') {
      // Introduce dumbbells, still exclude high impact
      pool = exercises.filter(ex => !hasTags(ex, 'high_impact', 'crunch', 'valsalva'));
      trace.push('R540 — Strengthening phase: dumbbells introduced, high-impact excluded');
    } else {
      // returning — most exercises allowed, exclude valsalva
      pool = exercises.filter(ex => !hasTags(ex, 'valsalva'));
      const runningToday = checkIn?.postnatal_signals?.running_today ?? false;
      if (runningToday) {
        addNote('Running clearance: ensure you\'ve completed a pelvic floor physio assessment before returning to running.');
        trace.push('R544 — Running clearance note added');
      }
      trace.push('R540 — Returning phase: full programme, no valsalva');
    }

    // Always exclude supine from postnatal if caesarean and early
    if (isCaesarean && (postnatalPhase === 'immediate' || postnatalPhase === 'early')) {
      pool = pool.filter(ex => !hasTags(ex, 'supine'));
    }

    if (!pool.length) pool = [...exercises].filter(ex => hasTags(ex, 'pelvic_floor', 'breathing'));

    // R541 — Pelvic floor always included (immediate, early, rebuilding)
    // Handled after step building
  }

  const inSpecialMode = pregnancyContext?.mode === 'pregnant' || pregnancyContext?.mode === 'postnatal';

  // ------------------------------------------------------------------
  // R555 — Safe running build-up: replace generic long runs with
  //        a level-appropriate run/walk interval exercise.
  //        Level is driven by conditioning.endurance progression score,
  //        so decay from skipped sessions automatically reduces intensity.
  //        Does NOT fire in pregnancy/postnatal mode or BMI strict mode.
  // ------------------------------------------------------------------
  const bmiStrictForRun = bmi !== null && (bmi >= T.BMI_STRICT || (bmi >= T.BMI_MODERATE && (checkIn?.pain_level ?? 0) >= T.PAIN_BMI_COFACTOR));
  const hasRunningShoes = (effectiveEquip.includes('running_shoes') || effectiveEquip.includes('treadmill'))
    && !inSpecialMode && !bmiStrictForRun && slot_type !== 'rest' && !forceBodyweight;

  // WARN: if BMI is unknown and running would otherwise be assigned, R545/R546 are silently skipped.
  // Users without height/weight in their profile receive no weight-aware safety guidance.
  if (bmi === null && (hasRunningShoes || (runCoach?.enrolled && !runCoach?.completed && !inSpecialMode))) {
    trace.push('WARN R545/R546 — BMI unknown (height or weight missing from profile): weight-aware running safety rules skipped');
  }

  let r555PinnedEx = null; // set inside R555 block; survives category filter below
  if (hasRunningShoes) {
    // Remove continuous long-run exercises — replaced by progressive intervals
    const genericRunSlugs = new Set([
      'easy-run-outdoor', 'run-intervals-outdoor', 'tempo-run-outdoor', 'treadmill-run-steady',
    ]);
    const before = pool.length;
    pool = pool.filter(ex => !genericRunSlugs.has(ex.slug));

    // Pick level from conditioning endurance score (defaults to 15 = Level 1 for new users)
    const condScore = progressionState?.scores?.conditioning?.endurance ?? 15;
    const runLevel = condScore < T.RUN_LEVEL_2 ? 1
      : condScore < T.RUN_LEVEL_3 ? 2
      : condScore < T.RUN_LEVEL_4 ? 3
      : condScore < T.RUN_LEVEL_5 ? 4
      : condScore < T.RUN_LEVEL_6 ? 5 : 6;

    const intervalEx = exercises.find(ex => ex.slug === `run-interval-level-${runLevel}`);
    if (intervalEx && !pool.some(ex => ex.id === intervalEx.id)) {
      pool = [intervalEx, ...pool];
    }
    if (intervalEx) r555PinnedEx = intervalEx;
    trace.push(`R555 — Safe running: conditioning ${condScore.toFixed(0)} → Level ${runLevel} intervals (${genericRunSlugs.size - (before - pool.length - (intervalEx ? 1 : 0))} generic runs replaced)`);
  }

  // ------------------------------------------------------------------
  // R556 — Running Coach Program: prescribe run sessions on any
  //        training day when enrolled, with time-aware level selection.
  //        Fires on any non-rest, non-micro day — custom schedules work.
  //        Session level never regresses due to time constraints.
  // ------------------------------------------------------------------
  let runProgramOverride = null;
  const runProgramActive = isProEnabled && runCoach?.enrolled && !runCoach?.completed
    && !inSpecialMode && !bmiStrictForRun && !forceBodyweight
    && slot_type !== 'rest' && slot_type !== 'micro';

  if (runProgramActive) {
    const sessionInWeek = runCoach.session_in_week ?? 0;
    // Allow any training day: just need a different calendar day since last run
    // and fewer than 3 sessions completed this week in the program
    const lastRunDate = runCoach.last_run_at_ms
      ? new Date(runCoach.last_run_at_ms).toISOString().slice(0, 10)
      : null;
    const enoughRest = !lastRunDate || lastRunDate < date;
    const weekNotFull = sessionInWeek < 3;

    if (enoughRest && weekNotFull) {
      const programWeeks = RUN_PROGRAMS[runCoach.target_km ?? 5] ?? RUN_PROGRAMS[5];
      // Mirror execution.js regression: if >7 days since last run, step back one week
      const daysSinceLastRun = runCoach.last_run_at_ms
        ? Math.floor((planDateMs - runCoach.last_run_at_ms) / 86_400_000)
        : 0;
      const storedWeek = runCoach.week ?? 1;
      const effectiveWeek = (daysSinceLastRun > 7 && storedWeek > 1) ? Math.max(1, storedWeek - 1) : storedWeek;
      if (effectiveWeek < storedWeek) {
        trace.push(`R556 — Back after ${daysSinceLastRun}-day break — plan stepping back to Week ${effectiveWeek} to rebuild safely`);
        addNote(`Back after a ${daysSinceLastRun}-day break — starting at Week ${effectiveWeek} to protect your body and set you up for a strong return.`);
      }
      const weekIdx = Math.min(effectiveWeek - 1, programWeeks.length - 1);
      const weekConfig = programWeeks[weekIdx]; // { hiit: N, zone2: N }
      // session_in_week 1 = Zone 2 (mid-week easy run); 0 and 2 = HIIT
      const isZone2Session = sessionInWeek === 1;
      const sessionTypeLabel = isZone2Session ? 'Zone 2' : 'Intervals';

      // ── Experience-level offset ────────────────────────────────────
      // Beginners get 2 levels lower (shorter/easier exercise) so their
      // zone2 session stays at interval level rather than a 25-min continuous run.
      // Advanced runners get +1 level to keep it appropriately challenging.
      // This ensures the same program week feels right for every runner.
      const runExpOffset = expLevel === 'beginner' ? -2 : expLevel === 'advanced' ? 1 : 0;
      const basePrescribed = isZone2Session ? weekConfig.zone2 : weekConfig.hiit;
      const prescribedLevel = Math.max(1, basePrescribed + runExpOffset);
      trace.push(`R556 — Experience offset: ${expLevel} → level ${basePrescribed}${runExpOffset !== 0 ? `+${runExpOffset}=${prescribedLevel}` : ''}`);

      // ── Time-aware exercise selection ─────────────────────────────
      // Total run time for an exercise: fixed_sets × (base_duration + rest) or just base_duration
      const getRunTotalSec = (ex) => {
        const m = JSON.parse(ex?.metrics_json || '{}');
        if (m.fixed_sets != null) return m.fixed_sets * ((m.base_duration_sec ?? 0) + (m.custom_rest_sec ?? 0));
        return m.base_duration_sec ?? 0;
      };
      const sessionDurSec = unlimited ? Number.MAX_SAFE_INTEGER : budget * 60; // 999 = no limit: pick highest appropriate level
      const warmupOverheadSec = 4 * 45; // 4 warmup exercises × ~45s each
      const availableRunSec = Math.max(600, sessionDurSec - warmupOverheadSec);

      // Find the highest level of the prescribed type that fits available time.
      // For beginners: allow zone2 sessions to use interval levels (1–6) if the
      // offset pushed the prescribed level below 7 — this is intentional.
      const minLevel = (isZone2Session && prescribedLevel >= 7) ? 7 : 1;
      let effectiveLevel = minLevel;
      for (let lvl = minLevel; lvl <= prescribedLevel; lvl++) {
        const slug = lvl <= 6 ? `run-interval-level-${lvl}` : `run-continuous-level-${lvl}`;
        const candidate = exercises.find(e => e.slug === slug);
        if (candidate && getRunTotalSec(candidate) <= availableRunSec) effectiveLevel = lvl;
      }

      const runSlug = effectiveLevel <= 6
        ? `run-interval-level-${effectiveLevel}`
        : `run-continuous-level-${effectiveLevel}`;
      const runEx = exercises.find(ex => ex.slug === runSlug);
      const warmUps = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));

      if (runEx && warmUps.length) {
        // Advisory note when session was shortened to fit available time (not shown for unlimited sessions)
        if (effectiveLevel < prescribedLevel && !unlimited) {
          const shortMin = Math.round(getRunTotalSec(runEx) / 60);
          const prescribedSlug = prescribedLevel <= 6 ? `run-interval-level-${prescribedLevel}` : `run-continuous-level-${prescribedLevel}`;
          const fullMin = Math.round(getRunTotalSec(exercises.find(e => e.slug === prescribedSlug) ?? {}) / 60);
          const budgetMin = rawBudget;
          const note = `Today's run was shortened to fit your ${budgetMin}-minute session — ${shortMin} min instead of the full ${fullMin} min. Your level stays exactly where it is. Consistency is the goal.`;
          addNote(note);
          trace.push(`R556 — Time adjusted: Level ${prescribedLevel}→${effectiveLevel} (${shortMin}min fits ${budgetMin}min window)`);
        }

        const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
        runProgramOverride = { warmUps, runEx, cooldownWalk, week: runCoach.week ?? 1, level: effectiveLevel, sessionType: sessionTypeLabel };
        trace.push(`R556 — Running Coach: Week ${effectiveWeek}, ${sessionTypeLabel}, Level ${effectiveLevel} (${runEx.name})`);
      }
    }
  }

  // ------------------------------------------------------------------
  // R557 — Cycling Coach Program: prescribe structured cycling sessions
  //        (polarised: Zone 2 + interval blocks) when cycling_coach is
  //        active and the user has a cycling-capable equipment.
  //        FTP-based (Watts) or HR-based — unit stored in cc.unit.
  //        8-week program: 3 sessions/week, any days.
  //        Sessions 1 & 3 = intervals; session 2 = Zone 2.
  // ------------------------------------------------------------------

  // 8-week interval progression [{ sets, workMin, recMin, pctFtp }]
  const CYCLING_INTERVAL_PROG = [
    { sets: 6, workMin: 1, recMin: 2, pctFtp: 115 }, // week 1
    { sets: 6, workMin: 1, recMin: 2, pctFtp: 115 }, // week 2
    { sets: 5, workMin: 3, recMin: 3, pctFtp: 108 }, // week 3
    { sets: 5, workMin: 3, recMin: 3, pctFtp: 108 }, // week 4
    { sets: 4, workMin: 5, recMin: 5, pctFtp: 105 }, // week 5
    { sets: 4, workMin: 5, recMin: 5, pctFtp: 105 }, // week 6
    { sets: 3, workMin: 8, recMin: 5, pctFtp: 103 }, // week 7
    { sets: 3, workMin: 8, recMin: 5, pctFtp: 103 }, // week 8
  ];
  const CYCLING_Z2_PROG = [30, 30, 40, 40, 50, 50, 60, 60]; // Zone 2 duration by week (min)

  let cyclingProgramOverride = null;
  const cycleCoach = prefs?.preferences?.cycling_coach;
  const hasCyclingEquipment = effectiveEquip.some(e => CYCLING_EQUIPMENT.includes(e));
  const cyclingProgramActive = isProEnabled && cycleCoach?.active && hasCyclingEquipment
    && !inSpecialMode && !runProgramOverride
    && slot_type !== 'rest' && slot_type !== 'micro';

  if (cyclingProgramActive) {
    const ccSessionInWeek = cycleCoach.session_in_week ?? 0;
    const lastRideDate = cycleCoach.last_ride_at_ms
      ? new Date(cycleCoach.last_ride_at_ms).toISOString().slice(0, 10)
      : null;
    const enoughRest = !lastRideDate || lastRideDate < date;
    const weekNotFull = ccSessionInWeek < 3;

    if (enoughRest && weekNotFull) {
      const weekIdx = Math.min((cycleCoach.week ?? 1) - 1, 7);
      const unit = cycleCoach.unit ?? 'watts';
      const ftp = cycleCoach.ftp_watts ?? 200;
      const maxHr = cycleCoach.max_hr ?? 180;
      const isZ2Session = ccSessionInWeek === 1; // session 2 of 3 is easy Z2

      let sessionName, durationSec, setsCount, restSec, coachNote, sessionTag;

      if (isZ2Session) {
        const z2Min = CYCLING_Z2_PROG[weekIdx];
        durationSec = z2Min * 60;
        setsCount = 1;
        restSec = 0;
        sessionTag = 'zone2';
        sessionName = `Cycling — Zone 2 · ${z2Min} min`;
        if (unit === 'watts') {
          const lo = Math.round(ftp * 0.55);
          const hi = Math.round(ftp * 0.75);
          coachNote = `Keep power at ${lo}–${hi}W (55–75% FTP). Comfortable and conversational — if you can't talk, back off. This builds your aerobic engine.`;
        } else {
          const lo = Math.round(maxHr * 0.68);
          const hi = Math.round(maxHr * 0.83);
          coachNote = `Keep heart rate at ${lo}–${hi} bpm (68–83% Max HR). Conversational pace. If you can't talk comfortably, slow down.`;
        }
      } else {
        const prog = CYCLING_INTERVAL_PROG[weekIdx];
        const totalIntervalSec = prog.sets * (prog.workMin + prog.recMin) * 60;
        const warmupSec = 10 * 60; // 10 min warmup
        durationSec = warmupSec + totalIntervalSec + 5 * 60; // + 5 min cooldown
        setsCount = prog.sets;
        restSec = prog.recMin * 60;
        sessionTag = 'hiit';
        sessionName = `Cycling — Intervals · ${prog.sets}×${prog.workMin}min`;
        if (unit === 'watts') {
          const target = Math.round(ftp * prog.pctFtp / 100);
          const recPow = Math.round(ftp * 0.5);
          coachNote = `${prog.sets}×${prog.workMin}min @ ~${target}W (${prog.pctFtp}% FTP). ${prog.recMin}min easy recovery at ${recPow}W between each. Hard but controlled — don't go all-out on rep 1. 10min warm-up + 5min cool-down included.`;
        } else {
          const hrTarget = Math.round(maxHr * 0.9);
          const hrRec = Math.round(maxHr * 0.7);
          coachNote = `${prog.sets}×${prog.workMin}min at Zone 5 (≥${hrTarget} bpm / ≥90% Max HR). ${prog.recMin}min recovery below ${hrRec} bpm between each. 10min warm-up + 5min cool-down included.`;
        }
      }

      // Synthetic plan step — no DB exercise record needed
      const cyclingEquipUsed = effectiveEquip.find(e => CYCLING_EQUIPMENT.includes(e)) ?? 'road_bike';
      const cyclingStep = {
        exercise_id: `cycling_coach_${isZ2Session ? 'z2' : 'intervals'}_w${cycleCoach.week ?? 1}`,
        exercise_slug: `cycling_coach_${isZ2Session ? 'z2' : 'intervals'}`,
        name: sessionName,
        category: 'cardio',
        tags_json: JSON.stringify(['cardio', 'cycling', sessionTag, 'outdoor']),
        equipment_required_json: JSON.stringify([cyclingEquipUsed]),
        target_reps: undefined,
        target_duration_sec: durationSec,
        sets: setsCount,
        rest_sec: restSec,
        instructions_json: null,
        alternatives_json: null,
        gif_url: null,
        coaching_note: coachNote,
      };

      cyclingProgramOverride = {
        step: cyclingStep,
        week: cycleCoach.week ?? 1,
        sessionType: isZ2Session ? 'Zone 2' : 'Intervals',
      };
      trace.push(`R557 — Cycling Coach: Week ${cycleCoach.week ?? 1} session ${ccSessionInWeek + 1}/3, ${isZ2Session ? 'Zone 2' : `Intervals ${setsCount}×${isZ2Session ? '' : CYCLING_INTERVAL_PROG[weekIdx].workMin}min`} (unit: ${unit})`);
    }
  }

  // ------------------------------------------------------------------
  // R568 — Polarised training: balance HIIT and Zone 2 in general
  //        endurance sessions. Removes the opposing endurance type from
  //        the pool so only the preferred type competes for selection.
  //        Activates when sport_prefs.polarised_training is enabled.
  //
  //        Priority rule (Philosophy 2 > Philosophy 8):
  //        If life rules (sleep, stress, mood, period) have already forced
  //        intensity to 'low', the body is signalling recovery. HIIT is
  //        inappropriate — override to Zone 2 regardless of last type.
  //        This ensures "Adjust the Sport to Your Life" takes precedence
  //        over polarised training preferences.
  // ------------------------------------------------------------------
  const polarisedOn = isProEnabled && prefs?.preferences?.sport_prefs?.polarised_training;
  if (polarisedOn && !runProgramOverride && !inSpecialMode && slot_type !== 'rest') {
    const lastType = prefs?.preferences?.sport_prefs?.last_endurance_type ?? null;
    // Philosophy priority: if intensity was forced to low by a life rule, always prefer
    // Zone 2 today — even if last session was Zone 2. Body recovery > training balance.
    const lifeRuleReducedIntensity = intensity === 'low';
    const nextType = lifeRuleReducedIntensity ? 'zone2' : (lastType === 'hiit' ? 'zone2' : 'hiit');
    const opposingType = nextType === 'hiit' ? 'zone2' : 'hiit';
    const poolWithTags = pool.map(ex => ({ ex, tags: JSON.parse(ex.tags_json || '[]') }));
    const preferredCount = poolWithTags.filter(({ tags }) => tags.includes(nextType)).length;
    if (preferredCount > 0) {
      pool = poolWithTags.filter(({ tags }) => !tags.includes(opposingType)).map(({ ex }) => ex);
      const reasonNote = lifeRuleReducedIntensity ? ' (life-rule override: intensity=low → zone2)' : '';
      trace.push(`R568 — Polarised: last=${lastType ?? 'none'}, promoting ${nextType}${reasonNote} (${preferredCount} exercises), removed ${opposingType}`);
    }
  }

  // ==================================================================
  // MILITARY COACH RULES (R570–R582)
  // Active when military_coach.active is set in preferences.
  // Not gated on isPro — available at Basic tier.
  // Does NOT fire in pregnancy (special mode) or on rest/micro days.
  // ==================================================================
  let militaryProgramOverride = null; // type, steps/warmUps/runEx, week, sessionType
  let militarySessionType = null;     // raw session type string, passed to return object
  let militaryMarchKg  = 0;
  let militaryMarchSec = 0;
  let milWeekComputed  = 1;

  const milCoach = prefs?.preferences?.military_coach;
  const militaryActive = !!(milCoach?.active) && !inSpecialMode
    && slot_type !== 'rest' && slot_type !== 'micro';

  if (militaryActive) {
    // R570 — computeMilitaryPhase() is the single source of truth for week/phase/session-type.
    const {
      milWeek, blockIdx, cyclePosn, milGroup, sessionType, milVol, checkInOverride,
    } = computeMilitaryPhase(milCoach, checkIn, date);
    milWeekComputed = milWeek; // milWeek = blockNum for session label compatibility
    militarySessionType = sessionType;

    // R578 — Volume multiplier from 6-block periodization cycle.
    volumeMultiplier = Math.min(volumeMultiplier, milVol);
    trace.push(`R570 — Military Coach: ${milGroup} Block${milWeek}.${blockIdx + 1}/4 [cycle${cyclePosn}] → ${sessionType} (vol ×${milVol.toFixed(2)}${checkInOverride ? ` — check-in override: ${checkInOverride}` : ''})`);

    if (sessionType === 'rust') {
      // R570 — Military rest day
      slot_type = 'rest';
      trace.push('R570 — Military scheduled rest day');

    } else if (sessionType === 'cooper_test') {
      // R576 — Cooper test milestone session (W1 baseline, W4 mid, W6 taper)
      const cooperEx    = exercises.find(ex => ex.slug === '12-minute-cooper-test');
      const warmUps     = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
      const warmupJog   = exercises.find(ex => ex.slug === 'easy-jog-warmup');
      const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
      if (cooperEx) {
        const milWeekLabel = !milCoach.last_cooper_distance_m ? 'baseline'
          : cyclePosn === 6 ? 'assessment simulation' : 'progress check';
        militaryProgramOverride = {
          type: 'cooper_test',
          warmUps,
          warmupJog,
          cooperEx,
          cooldownWalk,
          week: milWeek,
          sessionType: 'Cooper Test',
          label: milWeekLabel,
        };
        trace.push(`R576 — Military Cooper test (${milWeekLabel})`);
      }

    } else if (sessionType === 'duurloop') {
      // R571 — Zone 2 run: delegate to progressive continuous run levels
      const peakLevels = MIL_CLUSTER_RUN_PEAK[milGroup] ?? { zone2: 9, hiit: 3 };
      const offset     = MIL_RUN_WEEK_OFFSET[cyclePosn - 1] ?? 0;
      const targetLvl  = Math.max(7, peakLevels.zone2 + offset);
      const sessionDurSec = unlimited ? Number.MAX_SAFE_INTEGER : budget * 60;
      const availRunSec   = Math.max(600, sessionDurSec - 4 * 45); // warmup overhead
      let effectiveLvl = 7;
      for (let lvl = 7; lvl <= targetLvl; lvl++) {
        const ex = exercises.find(e => e.slug === `run-continuous-level-${lvl}`);
        if (ex) {
          const m = JSON.parse(ex.metrics_json || '{}');
          if ((m.base_duration_sec ?? 0) <= availRunSec) effectiveLvl = lvl;
        }
      }
      const runEx    = exercises.find(ex => ex.slug === `run-continuous-level-${effectiveLvl}`);
      const warmUps  = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
      const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
      if (runEx && warmUps.length) {
        militaryProgramOverride = { type: 'duurloop', warmUps, runEx, cooldownWalk, week: milWeek, sessionType: 'Zone 2 Run' };
        trace.push(`R571 — Military duurloop: run-continuous-level-${effectiveLvl} (target ${targetLvl})`);
      }

    } else if (sessionType === 'interval') {
      // R572 — HIIT run intervals
      const peakLevels = MIL_CLUSTER_RUN_PEAK[milGroup] ?? { zone2: 9, hiit: 3 };
      const offset     = MIL_RUN_WEEK_OFFSET[cyclePosn - 1] ?? 0;
      const targetLvl  = Math.max(1, Math.min(6, peakLevels.hiit + (offset < 0 ? offset : 0)));
      const runEx    = exercises.find(ex => ex.slug === `run-interval-level-${targetLvl}`);
      const warmUps  = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
      const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
      if (runEx && warmUps.length) {
        militaryProgramOverride = { type: 'interval', warmUps, runEx, cooldownWalk, week: milWeek, sessionType: 'Intervals' };
        trace.push(`R572 — Military intervals: run-interval-level-${targetLvl}`);
      }

    } else {
      // R573–R575 — Strength / march / circuit: filter to military exercise pool
      const milPool = pool.filter(ex => JSON.parse(ex.tags_json || '[]').includes('military'));
      if (milPool.length >= 3) {
        pool = milPool;
        trace.push(`R573 — Military pool: ${milPool.length} military-tagged exercises`);
      } else {
        trace.push(`R573 — Military pool too small (${milPool.length}), using full pool`);
      }

      if (sessionType === 'circuit') {
        // R575 — Circuit: prefer time-capable exercises for continuous effort
        const circuitPool = pool.filter(ex => {
          const m = JSON.parse(ex.metrics_json || '{}');
          return m.supports?.includes('time') || m.supports?.includes('reps');
        });
        if (circuitPool.length >= 3) pool = circuitPool;
        trace.push(`R575 — Military circuit: ${pool.length} exercises in time/reps pool`);
      }

      if (sessionType === 'kracht_marsen') {
        // R574 — Kracht+Marsen: compute march parameters, march step added after steps are built
        const prescribedKg  = MIL_MARCH_KG[milGroup]?.[cyclePosn - 1] ?? 0;
        const prescribedSec = MIL_MARCH_SEC[milGroup]?.[cyclePosn - 1] ?? 0;

        // Injury cap: lower_back → 15 kg max, knee → 0 (substitute)
        const injuryCap  = injuryAreas.includes('lower_back') ? 15
          : injuryAreas.includes('knee') ? 0 : 999;
        const weightCap  = Math.min(prescribedKg, injuryCap);
        // Snap to heaviest owned weight that fits within the cap
        const ownedWeights = Array.isArray(milCoach.pack_weights_available_kg) && milCoach.pack_weights_available_kg.length > 0
          ? milCoach.pack_weights_available_kg
          : milCoach.pack_weight_max_kg != null ? [milCoach.pack_weight_max_kg] : null; // backwards compat
        if (ownedWeights) {
          const valid = ownedWeights.filter(w => w <= weightCap).sort((a, b) => b - a);
          militaryMarchKg = valid.length > 0 ? valid[0] : 0;
        } else {
          militaryMarchKg = weightCap;
        }
        militaryMarchSec = prescribedSec;

        if (injuryAreas.includes('knee') && prescribedSec > 0) {
          // R577 — Knee injury: replace march with walking lunge
          trace.push('R577 — Knee injury: weighted march replaced with walking lunge');
          const lungeEx = exercises.find(ex => ex.slug === 'walking-lunge' || ex.slug === 'lunge');
          if (lungeEx) pool = [lungeEx, ...pool.filter(ex => ex.id !== lungeEx.id)];
        } else if (prescribedSec > 0) {
          trace.push(`R574 — March: ${militaryMarchKg} kg × ${prescribedSec / 60} min (prescribed ${prescribedKg} kg)`);
        }
      }
    }
  }

  // ------------------------------------------------------------------
  // Determine target category from goal + rules
  // ------------------------------------------------------------------
  let targetCategory;

  if (slot_type === 'rest') {
    targetCategory = 'mobility';
  } else if (inSpecialMode) {
    // For pregnancy: prefer mobility; postnatal immediate/early: pelvic_floor tagged (category=mobility)
    const postnatalPhase = pregnancyContext?.postnatal_phase;
    if (postnatalPhase === 'immediate' || postnatalPhase === 'early') {
      targetCategory = 'mobility'; // pelvic_floor exercises are in mobility category
    } else {
      targetCategory = 'strength';
    }
  } else if ((checkIn?.stress ?? 0) >= 7 || periodToday || phase === 'menstrual') {
    targetCategory = 'mobility';
  } else {
    const goal = prefs?.training_goal ?? 'health';
    targetCategory = GOAL_CATEGORY[goal] ?? 'strength';
  }

  // Filter + seed-shuffle for variety across days
  // Safety fallback order:
  //   1. Exercises in target category from the (already safety-filtered) pool
  //   2. Any exercise from the safety-filtered pool (wrong category but still safe)
  //   3. Emergency: if pool itself is empty, use a safe subset — NEVER the full unfiltered library
  //      for pregnancy/postnatal users, to avoid bypassing R531–R533 / R540 filters.
  let filtered = pool.filter(ex => ex.category === targetCategory);
  if (!filtered.length) filtered = pool;
  if (!filtered.length) {
    // Pool was emptied by safety filters — recover without discarding those filters.
    filtered = inSpecialMode
      ? exercises.filter(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'))
      : [...exercises];
    trace.push(`WARN R561 — Pool empty after all filters (target: ${targetCategory}); safe fallback applied (inSpecialMode: ${inSpecialMode})`);
  }
  let shuffled = seededShuffle(filtered, date);

  // R555 pin: if the safe-run interval exercise was injected but category filtering
  // removed it (e.g. goal=strength → targetCategory=strength), prepend it back so
  // it always appears in the selection for running-shoe users.
  if (r555PinnedEx && !shuffled.some(ex => ex.id === r555PinnedEx.id) && !runProgramOverride) {
    shuffled = [r555PinnedEx, ...shuffled];
    trace.push(`R555 — Interval pinned back after category filter (targetCategory: ${targetCategory})`);
  }

  // ==================================================================
  // PROGRESSION RULES (R550–R560) — only in standard non-bonus sessions
  // ==================================================================
  if (progressionState?.scores && !bonusSession && !inSpecialMode && slot_type !== 'rest') {
    const progScores  = progressionState.scores;
    const chartMode   = progressionState.chartMode ?? 'balanced';
    const baseTargets = PROG_GOAL_TARGETS[goal] ?? PROG_GOAL_TARGETS.health;
    const lastRunAtMs  = prefs?.preferences?.run_coach?.last_run_at_ms ?? null;
    const lastRideAtMs = prefs?.preferences?.cycling_coach?.last_ride_at_ms ?? null;
    const { targets, biasTrace } = (!runProgramOverride && !cyclingProgramOverride)
      ? computeSportBiasedTargets(baseTargets, prefs?.preferences?.sport_prefs, lastRunAtMs, lastRideAtMs, planDateMs)
      : { targets: baseTargets, biasTrace: null };
    if (biasTrace) {
      const adj = Object.entries(biasTrace.adjustments).filter(([, v]) => v !== 0).map(([ax, v]) => `${ax}${v > 0 ? '+' : ''}${v}`).join(', ');
      trace.push(`R560 — Sport bias: targets adjusted for ${biasTrace.primary} (${adj || 'no change'})${biasTrace.guardrailApplied ? ' [guardrail: recent sport reduced legs/cardio bias]' : ''}`);
    }
    const axes        = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];

    trace.push('R550 — Progression profile loaded');

    // Compute gaps vs goal target
    const gaps = axes.map(axis => ({
      axis,
      current: progGetDisplayScore(progScores, axis, chartMode),
      target:  targets[axis] ?? 50,
      gap:     Math.max(0, (targets[axis] ?? 50) - progGetDisplayScore(progScores, axis, chartMode)),
    })).filter(g => g.gap >= T.PROG_GAP_BIAS).sort((a, b) => b.gap - a.gap);

    const topGap = gaps[0];

    // R551 — Weak-axis compensation: reorder pool to surface exercises for the biggest gap axis
    if (topGap && !inSpecialMode) {
      const gapAxis = topGap.axis;
      const gapCategory = PROG_AXIS_CATEGORY[gapAxis] ?? targetCategory;

      // If the gap axis maps to a different category than currently planned, augment filtered pool
      if (gapCategory !== targetCategory && targetCategory !== 'mobility') {
        const gapPool = pool.filter(ex => ex.category === gapCategory);
        if (gapPool.length >= 2) {
          const gapShuffled = seededShuffle(gapPool, date + gapAxis);
          // Blend: take up to 2 gap-axis exercises, then fill with normal pool
          shuffled = [...gapShuffled.slice(0, 2), ...shuffled];
          trace.push(`R551 — Gap axis: ${gapAxis} (${topGap.current}→${topGap.target}) — added ${Math.min(2, gapShuffled.length)} ${gapCategory} exercise(s) to front of pool`);
        }
      }

      // Reorder within the filtered pool: exercises targeting the gap axis come first
      if (gapCategory === targetCategory) {
        const forGap  = shuffled.filter(ex => progGetExerciseAxis(ex) === gapAxis);
        const forOther = shuffled.filter(ex => progGetExerciseAxis(ex) !== gapAxis);
        shuffled = [...forGap, ...forOther];
        trace.push(`R551 — Gap axis: ${gapAxis} (${topGap.current}→${topGap.target}) — prioritised ${forGap.length} exercise(s) in pool`);
      }
    }

    // R552 — Mode-aware volume note (adds to session_notes)
    if (chartMode === 'power' && intensity === 'low') {
      trace.push('R552 — Chart mode is Power but intensity is low today — progression gain will be minimal');
    }

    // R553 — Mobility decay maintenance
    const mob = progScores.mobility;
    const daysSinceMobility = mob?.last_mobility_stimulus_at_ms
      ? Math.floor((planDateMs - mob.last_mobility_stimulus_at_ms) / 86_400_000)
      : 999;
    if (daysSinceMobility >= T.MOBILITY_DECAY_DAYS && goal !== 'mobility' && slot_type !== 'rest') {
      addNote('Your mobility hasn\'t been trained in over a week — today\'s session includes some movement quality work to keep it from fading.');
      trace.push(`R553 — Mobility score decaying (${daysSinceMobility} days) — maintenance note added`);
    }

    // R554 — Planner explainability: emit the top gap as a user-facing note
    if (topGap && topGap.gap >= T.PROG_GAP_NOTE) {
      const axisLabel = { push:'Push', pull:'Pull', legs:'Legs', core:'Core', conditioning:'Cardio', mobility:'Mobility' }[topGap.axis] ?? topGap.axis;
      trace.push(`R554 — ${axisLabel} is your biggest gap (score ${topGap.current} vs target ${topGap.target}) — planner is prioritising it`);
    }
  }

  // How many exercises to include — base from budget, adjusted by goal + experience
  const postnatalPhase = pregnancyContext?.postnatal_phase;
  const isGentleMode = postnatalPhase === 'immediate' || postnatalPhase === 'early';
  let count;
  if (slot_type === 'micro' || isGentleMode) {
    count = 2;
  } else {
    const baseCount = budget >= 90 ? 8
      : budget >= 60 ? 7
      : budget >= 45 ? 6
      : budget > 35  ? 5
      : budget > 20  ? 4
      : 3;
    const goalMod = GOAL_COUNT_MOD[goal] ?? 0;
    const expMod = expLevel === 'advanced' ? 1 : expLevel === 'beginner' ? -1 : 0;
    count = Math.max(2, Math.min(10, baseCount + goalMod + expMod));
    if (goalMod !== 0 || expMod !== 0) {
      trace.push(`R501 — Exercise count: ${baseCount} base + ${goalMod} goal + ${expMod} experience = ${count}`);
    }
  }
  const milIsRunSession = militaryProgramOverride?.type === 'duurloop' || militaryProgramOverride?.type === 'interval';
  const milIsCooperTest = militaryProgramOverride?.type === 'cooper_test';

  const selection = runProgramOverride
    ? [
        ...runProgramOverride.warmUps,
        runProgramOverride.runEx,
        ...(runProgramOverride.cooldownWalk ? [runProgramOverride.cooldownWalk] : []),
      ]
    : cyclingProgramOverride
    ? [] // cycling uses synthetic step, no DB exercises needed
    : milIsCooperTest
    ? [
        ...(militaryProgramOverride.warmUps ?? []),
        ...(militaryProgramOverride.warmupJog ? [militaryProgramOverride.warmupJog] : []),
        militaryProgramOverride.cooperEx,
        ...(militaryProgramOverride.cooldownWalk ? [militaryProgramOverride.cooldownWalk] : []),
      ]
    : milIsRunSession
    ? [
        ...militaryProgramOverride.warmUps,
        militaryProgramOverride.runEx,
        ...(militaryProgramOverride.cooldownWalk ? [militaryProgramOverride.cooldownWalk] : []),
      ]
    : shuffled.slice(0, count);

  // ------------------------------------------------------------------
  // Build steps
  // ------------------------------------------------------------------
  // Experience → rep/duration scale and set modifier
  const expRepScale   = { beginner: 0.8, intermediate: 1.0, advanced: 1.2 };
  const expSetMod     = { beginner: -1,  intermediate: 0,   advanced:  1  };
  const repScale  = expRepScale[expLevel]  ?? 1.0;
  const setOffset = expSetMod[expLevel]    ?? 0;

  // Goal → base sets (before experience offset)
  const goalSetsBase = GOAL_SETS_BASE[goal] ?? 3;
  // Goal → rest multiplier
  const goalRestMult = GOAL_REST_MULT[goal] ?? 1.0;

  const steps = slot_type === 'rest' ? [] : cyclingProgramOverride ? [cyclingProgramOverride.step] : selection.map(ex => {
    const metrics = JSON.parse(ex.metrics_json || '{}');
    const exTags = JSON.parse(ex.tags_json || '[]');
    const isRunWarmup = exTags.includes('run_warmup');
    const supportsReps = metrics.supports?.includes('reps');
    // base_duration_sec lets conditioning exercises specify their own duration (e.g. 1200 = 20 min)
    const baseDuration = metrics.base_duration_sec ?? 30;
    let reps = supportsReps ? (isRunWarmup ? 10 : (GOAL_REPS[goal] ?? 10)) : undefined;

    // Determine if this is a weighted (non-bodyweight) exercise for coaching guidance
    const equipmentRequired = JSON.parse(ex.equipment_required_json || '["none"]');
    const isWeighted = supportsReps && equipmentRequired.some(e =>
      ['dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 'plate', 'resistance_band',
       'bench', 'bench_press_rack', 'squat_rack', 'smith_machine', 'multi_gym', 'ankle_weights',
       'weight_plates', 'stability_ball'].includes(e)
    );
    const coachingNote = isWeighted ? (GOAL_COACHING_NOTE[goal] ?? null) : null;
    let duration = !supportsReps ? baseDuration : undefined;

    // Long cardio blocks (>5 min) are a single continuous effort — 1 set regardless
    const isLongCardio = !supportsReps && baseDuration > 300;
    // Assessment and session-phase exercises have fixed durations — never scale them
    const isFixedDuration = ex.slug === '12-minute-cooper-test'
      || ex.slug === 'easy-jog-warmup'
      || ex.slug === 'cooldown-walk';

    // Sets: fixed_sets from metrics (run intervals), or goal base + experience offset
    let sets;
    if (slot_type === 'micro' || isGentleMode || isLongCardio) {
      sets = 1;
    } else if (metrics.fixed_sets) {
      sets = metrics.fixed_sets; // e.g. run intervals prescribe their own interval count
    } else {
      sets = Math.max(1, Math.min(5, goalSetsBase + setOffset));
    }

    // R512: Low energy → volume × 0.6 (assessment exercises exempt — duration is fixed by standard)
    if ((checkIn?.energy ?? 10) <= T.ENERGY_LOW) {
      if (reps)                      { reps     = Math.floor(reps     * 0.6); trace.push(`R512 — Low energy → ${ex.name} reps ×0.6`); }
      if (duration && !isFixedDuration) { duration = Math.floor(duration * 0.6); trace.push(`R512 — Low energy → ${ex.name} duration ×0.6`); }
    }

    // R502: Experience level scales reps AND duration
    if (repScale !== 1.0) {
      if (reps)     reps     = Math.round(reps     * repScale);
      if (duration && !isLongCardio && !isRunWarmup && !isFixedDuration) duration = Math.round(duration * repScale);
    }

    // Apply volume multiplier (R521, R536) — assessment exercises exempt (fixed by standard)
    if (volumeMultiplier !== 1.0) {
      if (reps)                        reps     = Math.round(reps     * volumeMultiplier);
      if (duration && !isFixedDuration) duration = Math.round(duration * volumeMultiplier);
    }

    // Clamp reps to sensible range
    if (reps) reps = Math.max(3, Math.min(30, reps));

    // Rest: base from exercise tags + goal multiplier (rounded to nearest 5s)
    const baseRest = getDefaultRest(ex, slot_type);
    const adjustedRest = Math.round(baseRest * goalRestMult / 5) * 5;

    const media = ex.media_json ? JSON.parse(ex.media_json) : {};
    return {
      exercise_id: ex.id,
      exercise_slug: ex.slug,
      name: ex.name,
      category: ex.category,
      tags_json: ex.tags_json ?? '[]',
      equipment_required_json: ex.equipment_required_json ?? '["none"]',
      target_reps: reps,
      target_duration_sec: duration,
      sets,
      rest_sec: adjustedRest,
      instructions_json: ex.instructions_json ?? null,
      alternatives_json: ex.alternatives_json ?? null,
      gif_url: media.gif_url ?? null,
      coaching_note: coachingNote,
    };
  });

  // ------------------------------------------------------------------
  // R574 — Military kracht+marsen: append weighted march step at end
  // ------------------------------------------------------------------
  if (militarySessionType === 'kracht_marsen' && militaryMarchSec > 0 && slot_type !== 'rest') {
    const marchEx = exercises.find(ex => ex.slug === 'weighted-march');
    if (marchEx) {
      const kgLabel = militaryMarchKg > 0 ? `${militaryMarchKg} kg` : 'bodyweight';
      const media   = marchEx.media_json ? JSON.parse(marchEx.media_json) : {};
      steps.push({
        exercise_id:          marchEx.id,
        exercise_slug:        marchEx.slug,
        name:                 marchEx.name,
        category:             marchEx.category,
        tags_json:            marchEx.tags_json ?? '[]',
        equipment_required_json: marchEx.equipment_required_json ?? '["none"]',
        target_reps:          undefined,
        target_duration_sec:  militaryMarchSec,
        sets:                 1,
        rest_sec:             120,
        instructions_json:    marchEx.instructions_json ?? null,
        alternatives_json:    marchEx.alternatives_json ?? null,
        gif_url:              media.gif_url ?? null,
        coaching_note:        `March at 5.5 km/h with ${kgLabel}. Maintain upright posture throughout.`,
        military_march_kg:    militaryMarchKg, // UI uses this to show pack weight
      });
      trace.push(`R574 — March step added: ${kgLabel} × ${militaryMarchSec / 60} min`);
    }
  }

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
  if (sex === 'female' && slot_type === 'main' && steps.length && isStandardMode && !runProgramOverride) {
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
          tags_json: mobilityEx.tags_json ?? '[]',
          target_reps: undefined,
          target_duration_sec: 30,
          sets: 1,
          rest_sec: getDefaultRest(mobilityEx, slot_type),
          instructions_json: mobilityEx.instructions_json ?? null,
          alternatives_json: mobilityEx.alternatives_json ?? null,
          gif_url: media.gif_url ?? null,
        });
      }
    }
  }

  // ------------------------------------------------------------------
  // R534 — Pelvic floor inclusion T2+ (pregnancy)
  // R541 — Pelvic floor always in immediate/early/rebuilding (postnatal)
  // ------------------------------------------------------------------
  const needsPelvicFloor =
    (pregnancyContext?.mode === 'pregnant' && (pregnancyContext?.trimester ?? 1) >= 2) ||
    (pregnancyContext?.mode === 'postnatal' && ['immediate', 'early', 'rebuilding'].includes(pregnancyContext?.postnatal_phase));

  if (needsPelvicFloor && slot_type !== 'rest') {
    const hasPelvicFloor = steps.some(s => {
      const ex = exercises.find(e => e.id === s.exercise_id);
      return JSON.parse(ex?.tags_json || '[]').includes('pelvic_floor');
    });
    if (!hasPelvicFloor) {
      const pfEx = exercises.find(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return tags.includes('pelvic_floor') && tags.includes('pregnancy_safe');
      });
      if (pfEx) {
        const media = pfEx.media_json ? JSON.parse(pfEx.media_json) : {};
        steps.push({
          exercise_id: pfEx.id,
          exercise_slug: pfEx.slug,
          name: pfEx.name,
          category: pfEx.category,
          tags_json: pfEx.tags_json ?? '[]',
          target_reps: 10,
          target_duration_sec: undefined,
          sets: 2,
          rest_sec: getDefaultRest(pfEx, slot_type),
          instructions_json: pfEx.instructions_json ?? null,
          alternatives_json: pfEx.alternatives_json ?? null,
          gif_url: media.gif_url ?? null,
        });
        const ruleLabel = pregnancyContext.mode === 'pregnant' ? 'R534' : 'R541';
        trace.push(`${ruleLabel} — Pelvic floor exercise added`);
      }
    }
  }

  // ------------------------------------------------------------------
  // Pick a template for session naming + structure context
  // ------------------------------------------------------------------
  const template = templates?.length
    ? pickTemplate(templates, slot_type, intensity, budget)
    : null;

  // Pregnancy/postnatal vocabulary overrides
  let session_name;
  if (pregnancyContext?.mode === 'pregnant') {
    const trimester = pregnancyContext.trimester ?? 1;
    const nauseaToday = checkIn?.pregnancy_signals?.nausea ?? false;
    if (nauseaToday) session_name = 'Five minutes for you';
    else if (trimester === 3) session_name = 'Strong & supported';
    else session_name = 'Today\'s movement';
  } else if (pregnancyContext?.mode === 'postnatal') {
    const postnatalPhase = pregnancyContext.postnatal_phase;
    if (postnatalPhase === 'immediate' || postnatalPhase === 'early') session_name = 'A gentle moment';
    else if (postnatalPhase === 'rebuilding') session_name = 'Rebuilding your foundation';
    else session_name = 'Today\'s recovery';
  } else if (militaryProgramOverride?.type === 'cooper_test') {
    session_name = `Cooper Test · Block ${militaryProgramOverride.week} · ${militaryProgramOverride.label ?? 'Assessment'}`;
  } else if (militaryProgramOverride?.type === 'duurloop') {
    session_name = `Military · Zone 2 Run · Block ${militaryProgramOverride.week}`;
  } else if (militaryProgramOverride?.type === 'interval') {
    session_name = `Military · Intervals · Block ${militaryProgramOverride.week}`;
  } else if (militarySessionType === 'kracht_marsen') {
    session_name = `Military · Strength & March · Block ${milWeekComputed}`;
  } else if (militarySessionType === 'circuit') {
    session_name = `Military · Circuit · Block ${milWeekComputed}`;
  } else if (militarySessionType === 'kracht' && militaryActive) {
    session_name = `Military · Strength · Block ${milWeekComputed}`;
  } else if (runProgramOverride) {
    session_name = `Running Day · Week ${runProgramOverride.week} · ${runProgramOverride.sessionType}`;
  } else if (cyclingProgramOverride) {
    session_name = `Cycling Day · Week ${cyclingProgramOverride.week} · ${cyclingProgramOverride.sessionType}`;
  } else if (slot_type === 'rest') {
    session_name = 'Active Rest';
  } else if (slot_type === 'micro') {
    session_name = 'Micro Session';
  } else {
    // Use goal-specific name pool, seeded by date for daily variety
    const goalNames = GOAL_SESSION_NAMES[goal];
    if (goalNames?.length) {
      const idx = Math.abs([...date].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0)) % goalNames.length;
      session_name = goalNames[idx];
    } else {
      session_name = template?.name ?? 'Daily Training';
    }
  }

  // ── Exercise ordering: outdoor always last, indoor cardio second-to-last ────
  const isOutdoorStep = s => JSON.parse(s.tags_json || '[]').includes('outdoor');
  const isIndoorCardioStep = s => {
    const tags = JSON.parse(s.tags_json || '[]');
    return tags.includes('cardio') && !tags.includes('outdoor');
  };
  const coreSteps        = steps.filter(s => !isOutdoorStep(s) && !isIndoorCardioStep(s));
  const indoorCardioSteps = steps.filter(s => isIndoorCardioStep(s));
  const outdoorSteps     = steps.filter(s => isOutdoorStep(s));
  const orderedSteps = [...coreSteps, ...indoorCardioSteps, ...outdoorSteps];
  if (indoorCardioSteps.length || outdoorSteps.length) {
    trace.push(`Ordering — core: ${coreSteps.length}, indoor cardio: ${indoorCardioSteps.length}, outdoor: ${outdoorSteps.length}`);
  }

  return {
    date,
    slot_type,
    intensity,
    session_name,
    template_slug: template?.slug ?? null,
    target_category: targetCategory,
    session_notes: sessionNotes,
    pregnancy_week: pregnancyContext?.week ?? null,
    trimester: pregnancyContext?.trimester ?? null,
    postnatal_phase: pregnancyContext?.postnatal_phase ?? null,
    steps: orderedSteps,
    experience_level: expLevel ?? 'intermediate',
    rule_trace: trace,
    run_program: runProgramOverride
      ? { week: runProgramOverride.week, level: runProgramOverride.level, target_km: runCoach?.target_km ?? 5, session_type: runProgramOverride.sessionType }
      : null,
    cycling_program: cyclingProgramOverride
      ? { week: cyclingProgramOverride.week, session_type: cyclingProgramOverride.sessionType, unit: cycleCoach?.unit ?? 'watts' }
      : null,
    military_program: militaryActive ? (() => {
      const {
        blockNum: retBlockNum, blockIdx: retBlockIdx, cyclePosn: retCyclePosn,
        inBaseBuild: retInBaseBuild, milGroup: retGroup,
        clusterLive: retClusterLive, isPostAssessment: retIsPostAssess,
      } = computeMilitaryPhase(milCoach, checkIn, date);
      return {
        week:                  retBlockNum,    // block number (not calendar week)
        day:                   retBlockIdx,    // session index within block (0–3)
        sessions_per_block:    SESSIONS_PER_BLOCK,
        session_type:          militarySessionType,
        track:                 milCoach.track ?? 'keuring',
        cluster_target:        milCoach.cluster_target ?? 1,
        cluster_current:       retClusterLive,
        group:                 retGroup,
        march_kg:              militaryMarchKg  || null,
        march_sec:             militaryMarchSec || null,
        target_date:           milCoach.target_date ?? null,
        mode:                  milCoach.mode ?? 'target',
        is_base_build:         retInBaseBuild,
        is_calibration_week:   retCyclePosn === 1,
        is_deload_week:        retCyclePosn === 5,
        is_taper_week:         retCyclePosn === 6,
        is_post_assessment:    retIsPostAssess || milCoach.mode === 'open',
        last_cooper_distance_m: milCoach.last_cooper_distance_m ?? null,
      };
    })() : null,
  };
}

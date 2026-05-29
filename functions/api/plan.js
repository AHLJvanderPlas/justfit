import { computeMilitaryPhase, SESSIONS_PER_BLOCK, MIL_MARCH_KG, MIL_MARCH_SEC, MIL_CLUSTER_RUN_PEAK, MIL_RUN_WEEK_OFFSET } from './_shared/military.js';
import { buildCyclingWorkoutsFromProtocols, CYCLING_PROFILES, getCyclingBlockPhase, calcCyclingTSS, scaleCyclingIntervals, computeCyclingTsb, buildCyclingCoachNote } from './_shared/cycling.js';
import { RUN_PROGRAMS, RUN_WARMUP_TAG, buildRunProgramsFromTemplates } from './_shared/running.js';

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
    const { date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session, coach_sim, adapt_mode, base_plan } = body;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }

    // JWT-derived user_id only — body field ignored to prevent IDOR.
    // If unauthenticated, user_id is null: plan generated without personalization, not saved to DB.
    const user_id = await getAuthUserId(request, env);

    // Fetch exercises and (optionally) user preferences in parallel
    const [exResult, userPrefs, templates, userProfileRow, cyclingWorkoutsResult, cyclingProtocolsResult, runProgramItemsResult, customExResult] = await Promise.all([
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
      env.DB.prepare(
        `SELECT id, slug, name, sub_goal, workout_type, tss_estimate, duration_min, intervals_json
         FROM cycling_workouts WHERE is_active = 1`
      ).all(),
      // Cycling protocol source (sport='cycling'); fallback to cycling_workouts table when pool is empty
      env.DB.prepare(
        `SELECT wp.id AS wp_id, wp.slug, wp.name, wp.tags_json,
                wps.step_order, wps.step_type, wps.duration_sec, wps.sets,
                wps.intensity_json, wps.notes_json
         FROM workout_protocols wp
         JOIN workout_protocol_steps wps ON wps.protocol_id = wp.id
         WHERE wp.sport = 'cycling'
         ORDER BY wp.id, wps.step_order`
      ).all(),
      // DB-backed run programme schedule items; fallback to RUN_PROGRAMS constant when query returns nothing
      env.DB.prepare(
        `SELECT pti.program_template_id, pti.block_week, pti.session_order, e.slug
         FROM program_template_items pti
         JOIN exercises e ON e.id = pti.exercise_id
         WHERE pti.program_template_id IN ('run-5km','run-10km','run-15km','run-20km','run-30km')
         ORDER BY pti.program_template_id, pti.block_week, pti.session_order`
      ).all(),
      // Custom gym exercises with branding — scoped to user's active memberships
      user_id
        ? env.DB.prepare(
            `SELECT e.id, e.name, e.category AS exercise_type, e.equipment_required_json,
                    e.instructions_markdown, g.branding_json
             FROM exercises e
             JOIN gyms g ON g.id = e.gym_id
             JOIN gym_memberships gm ON gm.gym_id = e.gym_id AND gm.user_id = ? AND gm.status = 'active'
             WHERE e.gym_id IS NOT NULL AND e.is_active = 1`
          ).bind(user_id).all()
        : Promise.resolve(null),
    ]);
    // Use unified protocols when available; fall back to legacy cycling_workouts
    const protocolRows = cyclingProtocolsResult?.results ?? [];
    const cyclingWorkouts = protocolRows.length > 0
      ? buildCyclingWorkoutsFromProtocols(protocolRows)
      : (cyclingWorkoutsResult?.results ?? []);

    // Use DB-backed run programme schedule when available; fall back to RUN_PROGRAMS constant in planner
    const runProgramItemRows = runProgramItemsResult?.results ?? [];
    const runPrograms = runProgramItemRows.length > 0
      ? buildRunProgramsFromTemplates(runProgramItemRows)
      : null;

    const customExRows = customExResult?.results ?? [];
    const allExercises = [
      ...exResult.results,
      ...customExRows.map(ce => {
        const branding = ce.branding_json ? JSON.parse(ce.branding_json) : {};
        const logoUrl = branding.logo_data_url ?? null;
        return {
          id: ce.id,
          slug: `custom-${ce.id}`,
          name: ce.name,
          category: ce.exercise_type ?? 'strength',
          tags_json: '[]',
          equipment_required_json: ce.equipment_required_json ?? '["none"]',
          media_json: null,
          instructions_json: ce.instructions_markdown
            ? JSON.stringify({ steps: ce.instructions_markdown.split('\n').filter(s => s.trim()), cues: [] })
            : null,
          alternatives_json: null,
          metrics_json: null,
          ...(logoUrl ? { trainer_logo_url: logoUrl, trainer_logo_bg: branding.logo_bg_color ?? '#0a0a0a' } : {}),
        };
      }),
    ];
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
    // Check entitlements table first; fall back to manual isPro preference override.
    let isPro = !!(prefs?.preferences?.isPro);
    if (user_id && !isPro) {
      const isProRow = await env.DB.prepare(
        `SELECT id FROM entitlements WHERE user_id = ? AND status IN ('active','trialing','grace') AND ends_at_ms > ? LIMIT 1`
      ).bind(user_id, Date.now()).first();
      isPro = !!isProRow;
    }

    // C-G4: Free users get 1 plan per day — return cached plan if already exists
    if (user_id && !isPro && !bonus_session) {
      const existingPlan = await env.DB.prepare(
        'SELECT plan_json FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1'
      ).bind(user_id, date).first();
      if (existingPlan) {
        try {
          const cached = JSON.parse(existingPlan.plan_json);
          return Response.json({ ok: true, saved: true, plan: { ...cached, capped: true } });
        } catch { /* malformed JSON — fall through and regenerate */ }
      }
    }

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
        } else if (bodyMode === 'perimenopause') {
          pregnancyContext = { mode: 'perimenopause' };
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

    // Fetch progression state + cycling TSB in parallel (ignored for bonus sessions)
    let progressionState = null;
    let cyclingTsb = null;
    let cyclingSessionsLast7 = 0;
    let runSessionsLast7 = 0;
    let crossRunsLast7 = 0;
    let assignedProgramRow = null;
    const isCyclingCoachActive = !!(prefs?.preferences?.cycling_coach?.active);
    const isRunCoachActive = !!(prefs?.preferences?.run_coach?.enrolled && !prefs?.preferences?.run_coach?.completed);
    const isCrossTrainActive = !!(isCyclingCoachActive && prefs?.preferences?.cycling_coach?.run_cross_training);
    // Rolling 7-day window: count recent sessions by type for scheduling decisions
    const sevenDaysAgo = new Date(Date.parse(date + 'T00:00:00Z') - 7 * 86400000).toISOString().slice(0, 10);
    if (user_id && !bonus_session) {
      const fetches = [
        env.DB.prepare(
          `SELECT scores_json, last_computed_at_ms FROM user_progression WHERE user_id = ? LIMIT 1`
        ).bind(user_id).first(),
        env.DB.prepare(
          `SELECT date FROM executions WHERE user_id = ? AND status != 'skipped' ORDER BY date DESC LIMIT 1`
        ).bind(user_id).first(),
        isCyclingCoachActive
          ? env.DB.prepare(
              `SELECT date, tss_actual, tss_planned FROM executions WHERE user_id = ? AND tss_source IS NOT NULL AND (execution_type NOT LIKE 'strava_%' OR execution_type = 'strava_ride') ORDER BY date ASC`
            ).bind(user_id).all()
          : Promise.resolve(null),
        // Rolling window counts
        user_id
          ? env.DB.prepare(`SELECT COUNT(*) as cnt FROM executions WHERE user_id = ? AND execution_type = 'cycling_coach' AND date >= ? AND date < ?`).bind(user_id, sevenDaysAgo, date).first()
          : Promise.resolve(null),
        user_id && isRunCoachActive
          ? env.DB.prepare(`SELECT COUNT(*) as cnt FROM executions WHERE user_id = ? AND execution_type = 'run_coach' AND date >= ? AND date < ?`).bind(user_id, sevenDaysAgo, date).first()
          : Promise.resolve(null),
        user_id && isCrossTrainActive
          ? env.DB.prepare(`SELECT COUNT(*) as cnt FROM executions WHERE user_id = ? AND execution_type = 'cycling_cross_run' AND date >= ? AND date < ?`).bind(user_id, sevenDaysAgo, date).first()
          : Promise.resolve(null),
        // Trainer-assigned program session for today — scoped to gyms where user is a client
        user_id
          ? env.DB.prepare(`
              SELECT p.name AS program_name, ps.name AS session_name,
                     (SELECT COUNT(*) FROM assigned_sessions WHERE program_assignment_id = pa.id) AS total_sessions,
                     (SELECT COUNT(*) FROM assigned_sessions WHERE program_assignment_id = pa.id AND scheduled_date <= ?) AS session_number
              FROM program_assignments pa
              JOIN programs p ON p.id = pa.program_id
              JOIN assigned_sessions asgn ON asgn.program_assignment_id = pa.id
              JOIN program_sessions ps ON ps.id = asgn.session_template_id
              WHERE pa.client_user_id = ? AND pa.status = 'active' AND pa.start_date <= ?
                AND asgn.scheduled_date = ? AND asgn.status = 'scheduled'
                AND pa.gym_id IN (SELECT gym_id FROM gym_memberships WHERE user_id = ? AND role = 'client' AND status = 'active')
              LIMIT 1
            `).bind(date, user_id, date, date, user_id).first()
          : Promise.resolve(null),
      ];
      const [progRow, lastExRow, tssResult, cyclingCountRow, runCountRow, crossRunCountRow, assignedProgramResult] = await Promise.all(fetches);
      assignedProgramRow = assignedProgramResult ?? null;
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
      if (tssResult?.results?.length) {
        cyclingTsb = computeCyclingTsb(tssResult.results, date);
      }
      cyclingSessionsLast7 = cyclingCountRow?.cnt ?? 0;
      runSessionsLast7 = runCountRow?.cnt ?? 0;
      crossRunsLast7 = crossRunCountRow?.cnt ?? 0;
    }

    // ------------------------------------------------------------------
    // Military strength session DB lookup
    // Pre-compute military phase to know which session type is scheduled.
    // For strength sessions (kracht / kracht_marsen / circuit) only:
    //   fetch the ordered exercise list from program_template_items.
    // Run/cooper sessions keep existing progressive-level logic.
    // Falls back to null → runPlanner uses existing military pool path.
    // ------------------------------------------------------------------
    let militaryTemplateItems = null;
    const _pi = prefs?.preferences?.primary_intent ?? null;
    const isMilCoachActiveForFetch = !!(prefs?.preferences?.military_coach?.active)
      && (_pi === null || _pi === 'military');
    if (user_id && !bonus_session && isMilCoachActiveForFetch) {
      try {
        const milCoachPrefs = prefs.preferences.military_coach;
        const prePhase = computeMilitaryPhase(milCoachPrefs, effectiveCheckin, date);
        const { cyclePosn, clusterLive, sessionType: preSessionType } = prePhase;

        // Only strength sessions are DB-backed; run/cooper use progressive level logic
        const STRENGTH_DAY_INDEX = { kracht: 1, kracht_marsen: 4, circuit: 1 };
        const dayIndex = STRENGTH_DAY_INDEX[preSessionType];

        if (dayIndex !== undefined) {
          const track = milCoachPrefs.track ?? 'keuring';
          const templateSlug = track === 'opleiding'
            ? `opleiding-cluster-${clusterLive}`
            : (clusterLive === 0 ? 'keuring-basis' : `keuring-cluster-${clusterLive}`);

          const tmResult = await env.DB.prepare(`
            SELECT e.id, e.slug, e.name, e.category, e.tags_json, e.equipment_required_json,
                   e.metrics_json, e.instructions_json, e.alternatives_json, e.media_json
            FROM program_templates pt
            JOIN program_template_items pti ON pt.id = pti.program_template_id
            JOIN exercises e ON pti.exercise_id = e.id
            WHERE pt.slug = ? AND pti.block_week = ? AND pti.day_index = ?
            ORDER BY pti.session_order
          `).bind(templateSlug, cyclePosn, dayIndex).all();

          if (tmResult.results?.length >= 3) {
            militaryTemplateItems = tmResult.results;
          }
        }
      } catch {
        // DB lookup failed — militaryTemplateItems stays null → fallback to pool path
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
            VALUES (?, ?, ?, 'final', ?, 'adapt_free', 'v1.9.0', 'adapt', ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET plan_json=excluded.plan_json, updated_at_ms=excluded.updated_at_ms
          `).bind(adaptId, user_id, date, JSON.stringify(adapted), now, now).run();
          const row = await env.DB.prepare(`SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1`).bind(user_id, date).first();
          return Response.json({ ok: true, saved: true, plan: { id: row?.id ?? adaptId, ...adapted } });
        }
      }
      return Response.json({ ok: true, saved: false, plan: adapted });
    }

    const plan = runPlanner(date, effectiveCheckin, allExercises, prefs, allTemplates, completed_exercise_ids, bodyProfile, resolvedCycleContext, pregnancyContext, bonus_session, progressionState, isPro, cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7, crossRunsLast7, militaryTemplateItems, runPrograms);

    // Inject trainer-assigned program coaching note
    if (assignedProgramRow?.program_name) {
      const sessNum = assignedProgramRow.session_number ?? 1;
      const total = assignedProgramRow.total_sessions ?? 1;
      plan.session_notes = [
        `Van je trainer: ${assignedProgramRow.program_name} — sessie ${sessNum} van ${total}`,
        ...(plan.session_notes ?? []),
      ];
      plan.assigned_program = {
        program_name: assignedProgramRow.program_name,
        session_name: assignedProgramRow.session_name,
        session_number: sessNum,
        total_sessions: total,
      };
    }

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
          VALUES (?, ?, ?, 'final', ?, 'engine', 'v1.9.0', ?, ?, ?)
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
// Sport complement vectors — what the gym should provide to support each sport.
// Used by R560 sport bias layer to nudge goal targets toward the work the sport
// does NOT cover. High value = gym should prioritise this axis. Low value = sport
// already trains it enough, gym can deprioritise.
// 0.5 = neutral (no nudge), 1.0 = high gym priority, 0.0 = sport covers it well.
// ---------------------------------------------------------------------------
const SPORT_DEMAND = {
  // ── Endurance / outdoor ────────────────────────────────────────────────
  running:      { push: 0.7,  pull: 0.7,  legs: 0.75, core: 0.85, conditioning: 0.2,  mobility: 0.9  },
  cycling:      { push: 0.75, pull: 0.85, legs: 0.7,  core: 0.8,  conditioning: 0.2,  mobility: 0.9  },
  swimming:     { push: 0.5,  pull: 0.35, legs: 0.75, core: 0.65, conditioning: 0.2,  mobility: 0.75 },
  walking:      { push: 0.65, pull: 0.65, legs: 0.65, core: 0.65, conditioning: 0.55, mobility: 0.7  },
  rowing:       { push: 0.5,  pull: 0.35, legs: 0.65, core: 0.45, conditioning: 0.2,  mobility: 0.8  },
  triathlon:    { push: 0.6,  pull: 0.6,  legs: 0.7,  core: 0.75, conditioning: 0.15, mobility: 0.85 },
  duathlon:     { push: 0.65, pull: 0.65, legs: 0.7,  core: 0.75, conditioning: 0.15, mobility: 0.9  },
  trail_run:    { push: 0.65, pull: 0.65, legs: 0.8,  core: 0.85, conditioning: 0.2,  mobility: 0.9  },
  nordic_walk:  { push: 0.6,  pull: 0.6,  legs: 0.65, core: 0.65, conditioning: 0.4,  mobility: 0.7  },
  open_water:   { push: 0.5,  pull: 0.35, legs: 0.75, core: 0.65, conditioning: 0.2,  mobility: 0.75 },
  // ── Cycling variants ──────────────────────────────────────────────────
  mtb:          { push: 0.7,  pull: 0.75, legs: 0.65, core: 0.8,  conditioning: 0.25, mobility: 0.85 },
  spinning:     { push: 0.75, pull: 0.85, legs: 0.7,  core: 0.75, conditioning: 0.2,  mobility: 0.85 },
  // ── Water / wind ──────────────────────────────────────────────────────
  kayaking:     { push: 0.5,  pull: 0.45, legs: 0.7,  core: 0.5,  conditioning: 0.25, mobility: 0.75 },
  sup:          { push: 0.6,  pull: 0.5,  legs: 0.7,  core: 0.4,  conditioning: 0.4,  mobility: 0.7  },
  kitesurfing:  { push: 0.6,  pull: 0.5,  legs: 0.65, core: 0.5,  conditioning: 0.35, mobility: 0.75 },
  surfing:      { push: 0.55, pull: 0.5,  legs: 0.75, core: 0.55, conditioning: 0.5,  mobility: 0.8  },
  // ── Ice / skating ─────────────────────────────────────────────────────
  skating:      { push: 0.65, pull: 0.7,  legs: 0.65, core: 0.75, conditioning: 0.3,  mobility: 0.8  },
  ice_skating:  { push: 0.65, pull: 0.65, legs: 0.65, core: 0.75, conditioning: 0.35, mobility: 0.8  },
  skiing:       { push: 0.7,  pull: 0.8,  legs: 0.7,  core: 0.8,  conditioning: 0.5,  mobility: 0.8  },
  // ── Team sports ───────────────────────────────────────────────────────
  football:     { push: 0.65, pull: 0.65, legs: 0.75, core: 0.8,  conditioning: 0.3,  mobility: 0.8  },
  basketball:   { push: 0.7,  pull: 0.75, legs: 0.75, core: 0.75, conditioning: 0.3,  mobility: 0.75 },
  volleyball:   { push: 0.6,  pull: 0.6,  legs: 0.8,  core: 0.75, conditioning: 0.45, mobility: 0.75 },
  handball:     { push: 0.65, pull: 0.7,  legs: 0.75, core: 0.75, conditioning: 0.3,  mobility: 0.75 },
  rugby:        { push: 0.5,  pull: 0.5,  legs: 0.7,  core: 0.7,  conditioning: 0.35, mobility: 0.8  },
  // ── Racket sports ─────────────────────────────────────────────────────
  tennis:       { push: 0.55, pull: 0.65, legs: 0.7,  core: 0.55, conditioning: 0.45, mobility: 0.7  },
  padel:        { push: 0.6,  pull: 0.65, legs: 0.7,  core: 0.75, conditioning: 0.45, mobility: 0.75 },
  badminton:    { push: 0.6,  pull: 0.65, legs: 0.75, core: 0.7,  conditioning: 0.4,  mobility: 0.75 },
  // ── Fitness disciplines ────────────────────────────────────────────────
  yoga:         { push: 0.8,  pull: 0.8,  legs: 0.75, core: 0.5,  conditioning: 0.85, mobility: 0.25 },
  pilates:      { push: 0.8,  pull: 0.75, legs: 0.75, core: 0.4,  conditioning: 0.85, mobility: 0.45 },
  crossfit:     { push: 0.5,  pull: 0.5,  legs: 0.5,  core: 0.5,  conditioning: 0.4,  mobility: 0.9  },
  cardio:       { push: 0.65, pull: 0.65, legs: 0.65, core: 0.65, conditioning: 0.4,  mobility: 0.65 },
  // ── Combat sports ─────────────────────────────────────────────────────
  boxing:       { push: 0.4,  pull: 0.8,  legs: 0.75, core: 0.5,  conditioning: 0.3,  mobility: 0.75 },
  martial_arts: { push: 0.55, pull: 0.55, legs: 0.7,  core: 0.5,  conditioning: 0.35, mobility: 0.75 },
  // ── Technical / skill ─────────────────────────────────────────────────
  climbing:     { push: 0.35, pull: 0.3,  legs: 0.7,  core: 0.4,  conditioning: 0.65, mobility: 0.85 },
  gymnastics:   { push: 0.4,  pull: 0.4,  legs: 0.65, core: 0.4,  conditioning: 0.75, mobility: 0.4  },
  golf:         { push: 0.65, pull: 0.65, legs: 0.7,  core: 0.5,  conditioning: 0.7,  mobility: 0.5  },
  obstacle:     { push: 0.5,  pull: 0.5,  legs: 0.6,  core: 0.55, conditioning: 0.3,  mobility: 0.75 },
};

const SPORT_AXES = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];

// Compute sport-biased progression targets (R560).
// Primary sport weighted 0.6, secondary sports share 0.4.
// Nudge = (sportAxis - 0.5) × 24, capped at ±12 points per axis.
// Guardrail: halve legs/conditioning nudge if user ran or rode in the last 24 h.
function computeSportBiasedTargets(baseTargets, sportPrefs, weeklyRunCount, weeklyRideCount) {
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

  // Volume-aware guardrail: scale down legs/conditioning nudge by weekly sport session volume.
  // Higher volume → gym fills fewer gaps in those axes (athlete already trains them in sport).
  const weeklyCount = (weeklyRunCount ?? 0) + (weeklyRideCount ?? 0);
  const guardrailFactor = weeklyCount === 0 ? 1.0
    : weeklyCount <= 2 ? 0.8
    : weeklyCount <= 4 ? 0.6
    : 0.4;
  const guardrailApplied = weeklyCount > 0;

  const adjustedTargets = {};
  const adjustments = {};
  SPORT_AXES.forEach(ax => {
    let sportVal = vec[ax];
    if (guardrailApplied && (ax === 'legs' || ax === 'conditioning')) {
      sportVal = 0.5 + (sportVal - 0.5) * guardrailFactor;
    }
    const nudge = Math.round((sportVal - 0.5) * 24);
    const base  = baseTargets[ax] ?? 50;
    adjustedTargets[ax] = Math.min(90, Math.max(30, base + nudge));
    adjustments[ax] = adjustedTargets[ax] - base;
  });

  return {
    targets: adjustedTargets,
    biasTrace: { primary, sports: knownSports, adjustments, guardrailApplied, guardrailFactor, weeklyCount },
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

// ---------------------------------------------------------------------------
// COACH_PRIORITY — machine-readable intent hierarchy (index 0 = highest priority).
//
// When multiple coaches or body modes are active simultaneously, the planner
// resolves conflicts by applying the highest-priority intent and ignoring lower
// ones. Client-side conflict UI (Settings → Your Coach) uses this same order.
//
// Principle 5: "One active training intent at a time."
// ---------------------------------------------------------------------------
const COACH_PRIORITY = [
  'pregnant',        // Body mode: all planner rules subordinate to pregnancy safety
  'postnatal',       // Body mode: postnatal phase gates override all coach rules
  'military',        // Military Coach R570–R582: full session control, bypasses R510–R565
  'running',         // Running Coach R556: structured programme session
  'cycling',         // Cycling Coach R557: structured cycling session
  'cycling_cross',   // R557c: shadow cross-training run (sub-mode of cycling coach)
  'general',         // Standard check-in + progression rules R510–R565
];

// ---------------------------------------------------------------------------
// Intent hierarchy (highest → lowest priority — later items can be overridden by earlier)
//
//  1. Body mode — pregnancy / postnatal (R530–R544): overrides everything; special exercise
//     pools and intensity caps apply regardless of any other coach or plan state.
//  2. Military Coach (R570–R582): takes full control of session type, pool, and volume.
//     Bypasses standard rules R510–R565 (R581). Check-in pain/energy signals still apply.
//  3. Running Coach (R556): prescribes structured run programme session (runProgramOverride).
//  4. Cycling Coach (R557): prescribes structured cycling session (cyclingProgramOverride).
//  5. Cycling cross-training run (R557c): prescribes shadow run session (crossTrainingOverride).
//  6. Check-in adaptations — recovery mode (R559), pain → rest (R514), time budget (R510),
//     sleep/energy/stress (R511–R513), no-kit/no-gear (R515–R516).
//  7. Injury-aware filtering (R562–R565): filters and supplements pool for chronic/acute pain.
//  8. Progression rules (R550–R561): bias targets, weak-axis preference, sport bias, mobility.
//
// Principle 5: "One active training intent at a time." The hierarchy above is the enforcement.
// ---------------------------------------------------------------------------
function _addNote(ctx, note) {
  ctx.sessionNotes = ctx.sessionNotes ? ctx.sessionNotes + ' ' + note : note;
}

// ── Stage 1: Initialize ───────────────────────────────────────────────────────
function _initPlannerContext(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
  cycleContext, pregnancyContext, bonusSession, progressionState, isPro,
  cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7,
  crossRunsLast7, militaryTemplateItems, runPrograms) {

  const goal     = prefs?.training_goal ?? 'health';
  const expLevel = prefs?.experience_level ?? 'intermediate';
  const runCoach = prefs?.preferences?.run_coach;

  let intensity = GOAL_INTENSITY[goal] ?? 'moderate';
  const trace = [];
  trace.push(`R500 — Goal: ${goal} → initial intensity: ${intensity}`);

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

  let pool = [...exercises];
  pool = pool.filter(ex => !JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
  pool = pool.filter(ex => !JSON.parse(ex.tags_json || '[]').includes('session_phase'));

  if (completedIds?.length) {
    const doneSet = new Set(completedIds);
    pool = pool.filter(e => !doneSet.has(e.id));
    trace.push(`Bonus dedup — excluded ${completedIds.length} completed exercise(s)`);
  }

  const prefBudget = prefs?.session_duration_min ?? 30;
  const rawBudget  = checkIn?.time_budget ?? prefBudget;
  const unlimited  = rawBudget >= 999;
  const budget     = unlimited ? 120 : rawBudget;

  const userEquip = prefs?.preferences?.available_equipment ?? null;
  const effectiveEquip = (userEquip && userEquip.length > 0) ? userEquip : ['none'];
  const forceBodyweight = checkIn?.no_gear || checkIn?.traveling;
  const profileBodyweightOnly = effectiveEquip.length === 1 && effectiveEquip[0] === 'none';

  const weightKg = bodyProfile?.weight_kg ?? null;
  const heightCm = bodyProfile?.height_cm ?? null;
  const bmi = (weightKg && heightCm && heightCm > 0)
    ? weightKg / ((heightCm / 100) ** 2)
    : null;
  const sex = bodyProfile?.sex ?? null;

  const isStandardMode = !pregnancyContext || pregnancyContext.mode === undefined;
  const inSpecialMode  = pregnancyContext?.mode === 'pregnant' || pregnancyContext?.mode === 'postnatal';

  return {
    date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
    cycleContext, pregnancyContext, bonusSession, progressionState,
    cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7,
    crossRunsLast7, militaryTemplateItems, runPrograms,

    isProEnabled: !!isPro,
    planDateMs: new Date(date + 'T12:00:00Z').getTime(),
    goal, expLevel, runCoach,
    weightKg, heightCm, bmi, sex,
    effectiveEquip, forceBodyweight, profileBodyweightOnly,
    rawBudget, budget, unlimited,
    isStandardMode, inSpecialMode,

    pool, intensity, slot_type: 'main',
    volumeMultiplier: 1.0,
    trace, sessionNotes: null,

    injuryAreas: [],
    hasRunningShoes: false,
    bmiStrictForRun: false,
    runProgramOverride: null,
    cyclingProgramOverride: null,
    crossTrainingOverride: null,
    militaryProgramOverride: null,
    militaryDbSelection: null,
    militarySessionType: null,
    militaryMarchKg: 0,
    militaryMarchSec: 0,
    milWeekComputed: 1,
    r555PinnedEx: null,
    selection: null,
    shuffled: null,
    targetCategory: null,
  };
}

// ── Stage 2: Safety policies ──────────────────────────────────────────────────
function _applySafetyPolicies(ctx) {
  const { checkIn, exercises, prefs, date, pregnancyContext, bmi, expLevel } = ctx;
  const _primaryIntent0 = prefs?.preferences?.primary_intent ?? null;
  const isMilCoachActive = !!(prefs?.preferences?.military_coach?.active)
    && (_primaryIntent0 === null || _primaryIntent0 === 'military');

  // R510
  if (ctx.budget <= 10 || checkIn?.no_time) {
    ctx.slot_type = 'micro';
    ctx.trace.push('R510 — Time ≤10 min or no_time → micro session');
  } else if (ctx.budget <= 20) {
    ctx.trace.push('R510 — Short session (≤20 min)');
  } else {
    ctx.trace.push('R510 — Normal session (>20 min)');
  }

  // Bonus session overrides
  if (ctx.bonusSession) {
    if (ctx.budget <= 15) {
      ctx.slot_type = 'micro';
      if (ctx.intensity === 'high') ctx.intensity = 'low';
      else if (ctx.intensity === 'moderate') ctx.intensity = 'low';
      ctx.trace.push('Bonus session (≤15 min) — micro slot, low intensity to protect recovery');
    } else {
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      ctx.trace.push('Bonus session (>15 min) — intensity capped at moderate');
    }
  }

  // R511
  if ((checkIn?.sleep_hours ?? 8) <= T.SLEEP_LOW) {
    ctx.intensity = 'low';
    ctx.volumeMultiplier = Math.min(ctx.volumeMultiplier, 0.85);
    ctx.trace.push(`R511 — Poor sleep (≤${T.SLEEP_LOW}h) → intensity capped at low, volume ×0.85`);
  }

  // R513
  if ((checkIn?.stress ?? 0) >= T.STRESS_HIGH) {
    ctx.intensity = 'low';
    ctx.trace.push('R513 — High stress → recovery bias');
  }

  // R558
  const lastWorkoutDate = ctx.progressionState?.last_workout_date ?? null;
  if (lastWorkoutDate && !isMilCoachActive && !pregnancyContext) {
    const planDateMsLocal = new Date(date + 'T12:00:00Z').getTime();
    const lastWorkoutMs = new Date(lastWorkoutDate + 'T12:00:00Z').getTime();
    const gapDays = Math.floor((planDateMsLocal - lastWorkoutMs) / 86_400_000);
    if (gapDays >= 14) {
      ctx.volumeMultiplier = Math.min(ctx.volumeMultiplier, 0.75);
      ctx.trace.push(`R558 — Back after ${gapDays}-day break → volume ×0.75 (return-to-training re-ramp)`);
    }
  }

  // R514
  const painLevel    = checkIn?.pain_level ?? 0;
  const painScope    = checkIn?.pain_scope  ?? null;
  const painAreas    = checkIn?.pain_areas  ?? [];
  const isSpecificPain = painScope === 'specific' && painAreas.length > 0;

  if (painLevel >= T.PAIN_REST && !isSpecificPain) {
    ctx.slot_type = 'rest';
    ctx.trace.push(`R514 — Pain ≥${T.PAIN_REST} (${painScope ?? 'unset'}) → rest session`);
  }

  // R562–R565
  const INJURY_TAG_MAP = {
    knee: 'loads_knee', shoulder: 'loads_shoulder',
    lower_back: 'loads_lower_back', ankle: 'loads_ankle',
  };
  const chronicAreas = prefs?.preferences?.chronic_injury_areas ?? [];
  const injuryAreas  = [...new Set([...(isSpecificPain ? painAreas : []), ...chronicAreas])];
  ctx.injuryAreas = injuryAreas;

  if (injuryAreas.length > 0 && ctx.slot_type !== 'rest') {
    const forbiddenTags = injuryAreas.map(a => INJURY_TAG_MAP[a]).filter(Boolean);
    if (forbiddenTags.length > 0) {
      const before = ctx.pool.length;
      ctx.pool = ctx.pool.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return !forbiddenTags.some(ft => tags.includes(ft));
      });
      ctx.trace.push(`R563 — Injury filter [${injuryAreas.join(',')}]: ${before} → ${ctx.pool.length} exercises`);
    }
    if (ctx.pool.length < 3) {
      const safePool = exercises.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        const forbiddenTags2 = injuryAreas.map(a => INJURY_TAG_MAP[a]).filter(Boolean);
        if (forbiddenTags2.some(ft => tags.includes(ft))) return false;
        return tags.includes('mobility') || tags.includes('recovery');
      });
      const toAdd = seededShuffle(safePool, date).slice(0, 3 - ctx.pool.length);
      ctx.pool = [...ctx.pool, ...toAdd];
      ctx.trace.push(`R564 — Pool < 3 after injury filter → added ${toAdd.length} safe mobility/recovery exercises`);
    }
    const AREA_LABELS = { knee: 'knee', shoulder: 'shoulder', lower_back: 'lower back', ankle: 'ankle' };
    const noteAreas = injuryAreas.map(a => AREA_LABELS[a] ?? a).join(' & ');
    _addNote(ctx, `Session adjusted for ${noteAreas} discomfort. Stop any exercise that causes sharp or worsening pain.`);
    ctx.trace.push(`R565 — Session note added for injury areas: ${noteAreas}`);
  }

  // R559
  const recoveryMode = !!(checkIn?.recovery_mode ?? checkIn?.checkin_json?.recovery_mode);
  if (recoveryMode && !isMilCoachActive && !pregnancyContext) {
    ctx.intensity = 'low';
    ctx.pool = ctx.pool.filter(ex => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('mobility') || tags.includes('recovery') || ex.category === 'mobility' || ex.category === 'recovery';
    });
    ctx.trace.push('R559 — Recovery mode → low intensity, mobility/recovery pool');
  }

  // R515
  if (checkIn?.no_clothing) {
    ctx.pool = ctx.pool.filter(ex => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
    });
    ctx.trace.push(`R515 — No clothing → stealth filter (${ctx.pool.length} exercises remain)`);
  }

  // R516
  const ALWAYS_AVAILABLE = new Set(['none', 'chair']);
  if (ctx.forceBodyweight || ctx.profileBodyweightOnly) {
    ctx.pool = ctx.pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => ALWAYS_AVAILABLE.has(e));
    });
    const reason = ctx.forceBodyweight ? 'checkin no_gear/traveling' : 'profile equipment=none';
    ctx.trace.push(`R516 — Bodyweight only (${reason}) → ${ctx.pool.length} exercises remain`);
  } else {
    ctx.pool = ctx.pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => ALWAYS_AVAILABLE.has(e) || ctx.effectiveEquip.includes(e));
    });
    ctx.trace.push(`R516 — Equipment filter from profile → ${ctx.pool.length} exercises remain`);
  }

  // R517
  const mood = checkIn?.mood ?? null;
  if (mood !== null) {
    if (mood <= T.MOOD_LOW) {
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      else if (ctx.intensity === 'moderate') ctx.intensity = 'low';
      ctx.trace.push(`R517 — Low mood (${mood}/10) → intensity reduced, recovery bias`);
    } else if (mood <= T.MOOD_MODERATE) {
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      ctx.trace.push(`R517 — Below-average mood (${mood}/10) → intensity moderated`);
    }
  }

  // R518
  if (checkIn?.gym_today) {
    ctx.pool = exercises.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => GYM_EQUIPMENT.includes(e));
    });
    if (checkIn?.no_gear || checkIn?.traveling) {
      ctx.pool = ctx.pool.filter(ex => {
        const equip = JSON.parse(ex.equipment_required_json || '["none"]');
        return equip.includes('none');
      });
    }
    if (checkIn?.no_clothing) {
      ctx.pool = ctx.pool.filter(ex => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
      });
    }
    ctx.trace.push(`R518 — Gym today → gym equipment unlocked (${ctx.pool.length} exercises available)`);
  }

  // R545/R546: BMI-aware running caution
  const isRunningEx = (ex) => {
    const equip = JSON.parse(ex.equipment_required_json || '["none"]');
    const tags  = JSON.parse(ex.tags_json || '[]');
    return equip.includes('running_shoes') ||
      (equip.includes('treadmill') && tags.includes('high_impact'));
  };

  if (bmi !== null && bmi >= T.BMI_MODERATE && ctx.slot_type !== 'rest' && !isMilCoachActive) {
    const hasPain     = (checkIn?.pain_level ?? 0) >= T.PAIN_BMI_COFACTOR;
    const isNovice    = expLevel === 'beginner';
    const strictMode  = bmi >= T.BMI_STRICT || (bmi >= T.BMI_MODERATE && hasPain);
    const moderateMode = !strictMode && bmi >= T.BMI_MODERATE;

    if (strictMode) {
      const beforeCount = ctx.pool.length;
      ctx.pool = ctx.pool.filter(ex => !isRunningEx(ex));
      if (!ctx.pool.some(ex => ex.category === 'cardio')) {
        const lowImpact = exercises.filter(ex =>
          ex.category === 'cardio' &&
          JSON.parse(ex.tags_json || '[]').includes('low_impact') &&
          !isRunningEx(ex)
        );
        ctx.pool = [...ctx.pool, ...lowImpact];
      }
      const note = bmi >= T.BMI_STRICT
        ? `BMI ${bmi.toFixed(0)}+: Running is removed from today's plan. Cycling, rowing, and brisk walking deliver excellent cardio with far less joint load. Build leg and glute strength first — that's the real foundation for running.`
        : `BMI ${bmi.toFixed(0)} + current discomfort: Swapping running for low-impact cardio today. Listen to your body — pain that changes your gait is a signal to stop.`;
      _addNote(ctx, note);
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      ctx.trace.push(`R545 — BMI ${bmi.toFixed(1)} (strict) — running filtered out (${beforeCount - ctx.pool.length} removed), low-impact cardio preferred`);
    } else if (moderateMode) {
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      const note = isNovice
        ? `BMI ${bmi.toFixed(0)}: Starting with walk-run intervals is the smart play. Aim to increase total running by no more than 10% per week. Strength work for your calves, quads, and glutes will make every run easier.`
        : `BMI ${bmi.toFixed(0)}: Build gradually — no more than 10% more running per week. A run-walk plan works well at this stage. Strength training alongside running significantly reduces injury risk.`;
      _addNote(ctx, note);
      ctx.trace.push(`R546 — BMI ${bmi.toFixed(1)} (moderate caution) — run-walk progression recommended, intensity capped at moderate`);
    }
  }

  // R583
  if (bmi !== null && bmi > 28 && bmi < T.BMI_MODERATE && ctx.slot_type !== 'rest' && !isMilCoachActive) {
    const poolHasCardioOrRun = ctx.pool.some(ex => isRunningEx(ex) || ex.category === 'cardio');
    if (poolHasCardioOrRun) {
      _addNote(ctx, `Pace tip: at your current weight, keeping a conversational pace protects your joints and builds aerobic base faster than pushing hard. If you can't hold a sentence, slow down.`);
      ctx.trace.push(`R583 — BMI ${bmi.toFixed(1)} (28–30 range) — soft pace guidance added for cardio session`);
    }
  }
}

// ── Stage 3: Body mode policies ───────────────────────────────────────────────
function _applyBodyModePolicies(ctx) {
  const { checkIn, exercises, pregnancyContext, cycleContext, bmi } = ctx;

  if (bmi !== null) ctx.trace.push(`BMI: ${bmi.toFixed(1)}`);

  const phase           = cycleContext?.phase ?? null;
  const cycleDay        = cycleContext?.day ?? null;
  const cycleLengthDays = cycleContext?.cycle_length_days ?? 28;
  const periodToday     = checkIn?.checkin_json?.period_today ?? checkIn?.period_today ?? false;
  const _primaryIntent1 = ctx.prefs?.preferences?.primary_intent ?? null;
  const isMilCoachActive = !!(ctx.prefs?.preferences?.military_coach?.active)
    && (_primaryIntent1 === null || _primaryIntent1 === 'military');

  // R520–R525 standard cycle
  if (ctx.isStandardMode) {
    if (periodToday || phase === 'menstrual') {
      ctx.intensity = 'low';
      ctx.trace.push('R520 — Your body is asking for gentleness today');
    }
    if (phase === 'follicular' && (checkIn?.energy ?? 10) >= T.ENERGY_FOLLICULAR && (checkIn?.sleep_hours ?? 8) >= T.SLEEP_FOLLICULAR) {
      ctx.volumeMultiplier *= 1.15;
      ctx.trace.push('R521 — Your energy is building — time to be strong');
    }
    if (phase === 'ovulation') {
      _addNote(ctx, 'Take an extra minute to warm up today — your body is ready to perform.');
      ctx.trace.push('R522 — You\'re at your peak — let\'s make the most of it');
    }
    if (phase === 'luteal') {
      const isLateLuteal = cycleDay != null && cycleDay >= (cycleLengthDays - 5);
      if (isLateLuteal) {
        if (ctx.intensity === 'high') ctx.intensity = 'moderate';
        if (ctx.intensity === 'moderate' && (checkIn?.stress ?? 0) >= T.STRESS_LUTEAL) ctx.intensity = 'low';
        ctx.trace.push('R523 — Winding down this week, staying consistent');
      }
    }
  }

  // R526
  if (pregnancyContext?.mode === 'perimenopause') {
    if (ctx.intensity === 'high') { ctx.intensity = 'moderate'; }
    const periStress = checkIn?.stress ?? 0;
    if (periStress >= 5) {
      ctx.intensity = 'low';
      ctx.trace.push('R526 — Perimenopause + elevated stress ≥5 → low intensity, mobility focus');
    } else {
      ctx.trace.push('R526 — Perimenopause mode: intensity capped at moderate, cycle rules paused');
    }
  }

  // R530–R537 Pregnancy
  if (pregnancyContext?.mode === 'pregnant') {
    const week          = pregnancyContext.week ?? 1;
    const trimester     = pregnancyContext.trimester ?? 1;
    const nauseaToday   = checkIn?.pregnancy_signals?.nausea ?? false;
    const breathlessToday = checkIn?.pregnancy_signals?.breathless ?? false;

    if (trimester === 3) {
      if (ctx.intensity === 'high' || ctx.intensity === 'moderate') ctx.intensity = 'low';
      ctx.trace.push('R530 — T3: intensity capped at low');
    } else {
      if (ctx.intensity === 'high') ctx.intensity = 'moderate';
      ctx.trace.push(`R530 — T${trimester}: intensity capped at moderate`);
    }
    if (week >= T.PREGNANCY_SUPINE_WEEK) {
      ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'supine'));
      ctx.trace.push(`R531 — Week ${week}: supine exercises filtered out`);
    }
    ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'high_impact'));
    ctx.trace.push('R532 — High-impact exercises excluded during pregnancy');
    ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'valsalva', 'inversion', 'crunch'));
    if (trimester >= 2) {
      ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'prone'));
      ctx.trace.push('R533 — T2+: prone exercises excluded');
    }
    ctx.trace.push('R533 — Absolute exclusions: valsalva, inversion, crunch');
    if (nauseaToday) {
      ctx.slot_type = 'micro';
      const nauseaPool = exercises.filter(ex => hasTags(ex, 'breathing', 'recovery') && !hasTags(ex, 'high_impact', 'supine'));
      if (nauseaPool.length) ctx.pool = nauseaPool;
      _addNote(ctx, 'Gentle movement only today. Listen to your body — rest is always the right choice.');
      ctx.trace.push('R535 — Nausea today → breathing/recovery focus');
    }
    if (trimester === 3 && breathlessToday) {
      ctx.volumeMultiplier = 0.8;
      _addNote(ctx, 'Shorter intervals today — pause when you need to breathe.');
      ctx.trace.push('R536 — T3 breathlessness → volume ×0.8');
    }
    if (pregnancyContext.past_due) {
      _addNote(ctx, 'When your baby arrives, switch to postnatal mode in Settings.');
      ctx.trace.push('R537 — Past due date: postnatal transition prompt added');
    }
  }

  // R539–R544 Postnatal
  if (pregnancyContext?.mode === 'postnatal') {
    const postnatalCleared = pregnancyContext.postnatal_cleared_for_exercise === 1;
    let postnatalPhase = pregnancyContext.postnatal_phase ?? 'immediate';
    const birthType    = pregnancyContext.postnatal_birth_type ?? null;
    const isCaesarean  = birthType === 'caesarean';

    if (!postnatalCleared && postnatalPhase !== 'immediate') {
      postnatalPhase = 'immediate';
      pregnancyContext.postnatal_phase = 'immediate';
      _addNote(ctx, 'Your session is kept gentle until you confirm exercise clearance with your healthcare provider. When you\'re cleared, update your status in Settings.');
      ctx.trace.push('R539 — Postnatal clearance not confirmed — holding at immediate-phase restrictions');
    }

    if (postnatalPhase === 'immediate') {
      ctx.pool = exercises.filter(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'));
      ctx.intensity = 'low';
      ctx.slot_type = ctx.pool.length ? ctx.slot_type : 'rest';
      ctx.trace.push('R540 — Immediate phase: pelvic floor, breathing, recovery only');
    } else if (postnatalPhase === 'early') {
      ctx.pool = exercises.filter(ex =>
        hasTags(ex, 'pelvic_floor', 'breathing', 'recovery') ||
        (ex.category === 'mobility' && hasTags(ex, 'low_impact') && !hasTags(ex, 'high_impact'))
      );
      ctx.intensity = 'low';
      ctx.trace.push('R540 — Early phase: pelvic floor, breathing, light mobility');
    } else if (postnatalPhase === 'rebuilding') {
      ctx.pool = exercises.filter(ex => {
        if (hasTags(ex, 'high_impact', 'crunch', 'valsalva')) return false;
        if (hasTags(ex, 'dumbbell') && !hasTags(ex, 'pelvic_floor')) return false;
        return true;
      });
      if (isCaesarean) {
        ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'prone'));
        ctx.trace.push('R542 — Caesarean: prone exercises excluded in rebuilding phase');
      }
      _addNote(ctx, 'Check for abdominal separation (diastasis recti) if you haven\'t already — speak to your physiotherapist.');
      ctx.trace.push('R540 — Rebuilding phase: bodyweight only, no crunch/high-impact');
      ctx.trace.push('R543 — Diastasis recti check reminder added');
    } else if (postnatalPhase === 'strengthening') {
      ctx.pool = exercises.filter(ex => !hasTags(ex, 'high_impact', 'crunch', 'valsalva'));
      ctx.trace.push('R540 — Strengthening phase: dumbbells introduced, high-impact excluded');
    } else {
      ctx.pool = exercises.filter(ex => !hasTags(ex, 'valsalva'));
      const runningToday = checkIn?.postnatal_signals?.running_today ?? false;
      if (runningToday) {
        _addNote(ctx, 'Running clearance: ensure you\'ve completed a pelvic floor physio assessment before returning to running.');
        ctx.trace.push('R544 — Running clearance note added');
      }
      ctx.trace.push('R540 — Returning phase: full programme, no valsalva');
    }

    if (isCaesarean && (postnatalPhase === 'immediate' || postnatalPhase === 'early')) {
      ctx.pool = ctx.pool.filter(ex => !hasTags(ex, 'supine'));
    }
    if (!ctx.pool.length) ctx.pool = [...exercises].filter(ex => hasTags(ex, 'pelvic_floor', 'breathing'));
  }
}

// ── Stage 4: Select coach blueprint ──────────────────────────────────────────
function _selectCoachBlueprint(ctx) {
  const { checkIn, exercises, prefs, date } = ctx;
  const { bmi, expLevel, budget, unlimited, rawBudget, effectiveEquip, forceBodyweight, inSpecialMode, isProEnabled } = ctx;

  // bmiStrictForRun must be computed after R514 (slot_type may now be 'rest')
  const bmiStrictForRun = bmi !== null && (bmi >= T.BMI_STRICT || (bmi >= T.BMI_MODERATE && (checkIn?.pain_level ?? 0) >= T.PAIN_BMI_COFACTOR));
  ctx.bmiStrictForRun = bmiStrictForRun;

  const hasRunningShoes = (effectiveEquip.includes('running_shoes') || effectiveEquip.includes('treadmill'))
    && !inSpecialMode && !bmiStrictForRun && ctx.slot_type !== 'rest' && !forceBodyweight;
  ctx.hasRunningShoes = hasRunningShoes;

  const runCoach = ctx.runCoach;
  if (bmi === null && (hasRunningShoes || (runCoach?.enrolled && !runCoach?.completed && !inSpecialMode))) {
    ctx.trace.push('WARN R545/R546 — BMI unknown (height or weight missing from profile): weight-aware running safety rules skipped');
  }

  // R555
  if (hasRunningShoes) {
    const genericRunSlugs = new Set([
      'easy-run-outdoor', 'run-intervals-outdoor', 'tempo-run-outdoor', 'treadmill-run-steady',
    ]);
    const before = ctx.pool.length;
    ctx.pool = ctx.pool.filter(ex => !genericRunSlugs.has(ex.slug));
    const condScore = ctx.progressionState?.scores?.conditioning?.endurance ?? 15;
    const runLevel = condScore < T.RUN_LEVEL_2 ? 1
      : condScore < T.RUN_LEVEL_3 ? 2
      : condScore < T.RUN_LEVEL_4 ? 3
      : condScore < T.RUN_LEVEL_5 ? 4
      : condScore < T.RUN_LEVEL_6 ? 5 : 6;
    const intervalEx = exercises.find(ex => ex.slug === `run-interval-level-${runLevel}`);
    if (intervalEx && !ctx.pool.some(ex => ex.id === intervalEx.id)) {
      ctx.pool = [intervalEx, ...ctx.pool];
    }
    if (intervalEx) ctx.r555PinnedEx = intervalEx;
    ctx.trace.push(`R555 — Safe running: conditioning ${condScore.toFixed(0)} → Level ${runLevel} intervals (${genericRunSlugs.size - (before - ctx.pool.length - (intervalEx ? 1 : 0))} generic runs replaced)`);
  }

  // R556
  const planDateMs = ctx.planDateMs;
  const runProgramActive = isProEnabled && runCoach?.enrolled && !runCoach?.completed
    && !inSpecialMode && !bmiStrictForRun && !forceBodyweight
    && ctx.slot_type !== 'rest' && ctx.slot_type !== 'micro';

  if (runProgramActive) {
    const sessionInWeek = runCoach.session_in_week ?? 0;
    const lastRunDate = runCoach.last_run_at_ms
      ? new Date(runCoach.last_run_at_ms).toISOString().slice(0, 10)
      : null;
    const enoughRest  = !lastRunDate || lastRunDate < date;
    const weekNotFull = ctx.runSessionsLast7 < 3;

    if (enoughRest && weekNotFull) {
      const programWeeks = (ctx.runPrograms?.[runCoach.target_km ?? 5]) ?? RUN_PROGRAMS[runCoach.target_km ?? 5] ?? RUN_PROGRAMS[5];
      const daysSinceLastRun = runCoach.last_run_at_ms
        ? Math.floor((planDateMs - runCoach.last_run_at_ms) / 86_400_000)
        : 0;
      const storedWeek    = runCoach.week ?? 1;
      const effectiveWeek = (daysSinceLastRun > 7 && storedWeek > 1) ? Math.max(1, storedWeek - 1) : storedWeek;
      if (effectiveWeek < storedWeek) {
        ctx.trace.push(`R556 — Back after ${daysSinceLastRun}-day break — plan stepping back to Week ${effectiveWeek} to rebuild safely`);
        _addNote(ctx, `Back after a ${daysSinceLastRun}-day break — starting at Week ${effectiveWeek} to protect your body and set you up for a strong return.`);
      }
      const weekIdx    = Math.min(effectiveWeek - 1, programWeeks.length - 1);
      const weekConfig = programWeeks[weekIdx];
      const isZone2Session  = sessionInWeek === 1;
      const sessionTypeLabel = isZone2Session ? 'Zone 2' : 'Intervals';

      const runExpOffset   = expLevel === 'beginner' ? -2 : expLevel === 'advanced' ? 1 : 0;
      const basePrescribed = isZone2Session ? weekConfig.zone2 : weekConfig.hiit;
      const prescribedLevel = Math.max(1, basePrescribed + runExpOffset);
      ctx.trace.push(`R556 — Experience offset: ${expLevel} → level ${basePrescribed}${runExpOffset !== 0 ? `+${runExpOffset}=${prescribedLevel}` : ''}`);

      const getRunTotalSec = (ex) => {
        const m = JSON.parse(ex?.metrics_json || '{}');
        if (m.fixed_sets != null) return m.fixed_sets * ((m.base_duration_sec ?? 0) + (m.custom_rest_sec ?? 0));
        return m.base_duration_sec ?? 0;
      };
      const sessionDurSec     = unlimited ? Number.MAX_SAFE_INTEGER : budget * 60;
      const warmupOverheadSec = 4 * 45;
      const availableRunSec   = Math.max(600, sessionDurSec - warmupOverheadSec);
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
      const runEx   = exercises.find(ex => ex.slug === runSlug);
      const warmUps = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));

      if (runEx && warmUps.length) {
        if (effectiveLevel < prescribedLevel && !unlimited) {
          const shortMin       = Math.round(getRunTotalSec(runEx) / 60);
          const prescribedSlug = prescribedLevel <= 6 ? `run-interval-level-${prescribedLevel}` : `run-continuous-level-${prescribedLevel}`;
          const fullMin        = Math.round(getRunTotalSec(exercises.find(e => e.slug === prescribedSlug) ?? {}) / 60);
          const budgetMin      = rawBudget;
          _addNote(ctx, `Today's run was shortened to fit your ${budgetMin}-minute session — ${shortMin} min instead of the full ${fullMin} min. Your level stays exactly where it is. Consistency is the goal.`);
          ctx.trace.push(`R556 — Time adjusted: Level ${prescribedLevel}→${effectiveLevel} (${shortMin}min fits ${budgetMin}min window)`);
        }
        const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
        ctx.runProgramOverride = { warmUps, runEx, cooldownWalk, week: runCoach.week ?? 1, level: effectiveLevel, sessionType: sessionTypeLabel };
        ctx.trace.push(`R556 — Running Coach: Week ${effectiveWeek}, ${sessionTypeLabel}, Level ${effectiveLevel} (${runEx.name})`);
      }
    }
  }

  // R557
  const cycleCoach = prefs?.preferences?.cycling_coach;
  const hasCyclingEquipment = effectiveEquip.some(e => CYCLING_EQUIPMENT.includes(e));
  const cyclingProgramActive = isProEnabled && cycleCoach?.active && hasCyclingEquipment
    && !inSpecialMode && !ctx.runProgramOverride
    && ctx.slot_type !== 'rest' && ctx.slot_type !== 'micro';

  if (cyclingProgramActive) {
    const ccSessionInWeek  = cycleCoach.session_in_week ?? 0;
    const ccSessionsTotal  = cycleCoach.sessions_total ?? 0;
    const cyclingDaysPerWeek = cycleCoach.cycling_days_per_week ?? 3;
    const lastRideDate = cycleCoach.last_ride_at_ms
      ? new Date(cycleCoach.last_ride_at_ms).toISOString().slice(0, 10)
      : null;
    const enoughRest     = !lastRideDate || lastRideDate < date;
    const weekNotFull    = ctx.cyclingSessionsLast7 < cyclingDaysPerWeek;
    const crossTrainEnabled = !!(cycleCoach.run_cross_training && (cycleCoach.run_days_per_week ?? 0) > 0);
    const shortTimeBudget   = !!(checkIn?.time_budget && checkIn.time_budget < 40);
    const crossRunsUsed     = ctx.crossRunsLast7 >= (cycleCoach.run_days_per_week ?? 0);
    const skipCyclingForRun = shortTimeBudget && crossTrainEnabled && !crossRunsUsed;

    if (enoughRest && weekNotFull && !skipCyclingForRun && ctx.cyclingWorkouts.length > 0) {
      const subGoal   = cycleCoach.sub_goal ?? 'build_fitness';
      const profile   = CYCLING_PROFILES[subGoal] ?? CYCLING_PROFILES.build_fitness;
      const blockPhase = getCyclingBlockPhase(ccSessionsTotal);
      let targetType  = blockPhase === 'recovery' ? 'endurance' : profile[ccSessionInWeek % 3];

      // R557b
      if (ctx.cyclingTsb !== null) {
        if (ctx.cyclingTsb < -25) {
          targetType = 'endurance';
          ctx.trace.push(`R557b — TSB ${ctx.cyclingTsb} < -25: fatigue override → endurance`);
        } else if (ctx.cyclingTsb > 5 && blockPhase === 'build') {
          const qualityType = profile[1];
          if (qualityType && qualityType !== 'endurance') {
            targetType = qualityType;
            ctx.trace.push(`R557b — TSB ${ctx.cyclingTsb} > +5 + build phase: freshness → ${qualityType}`);
          }
        }
      }

      let cwPool = ctx.cyclingWorkouts.filter(w => w.sub_goal === subGoal && w.workout_type === targetType);
      if (!cwPool.length) cwPool = ctx.cyclingWorkouts.filter(w => w.workout_type === targetType);
      if (!cwPool.length) cwPool = ctx.cyclingWorkouts.filter(w => w.sub_goal === subGoal);
      if (!cwPool.length) cwPool = ctx.cyclingWorkouts;

      let selectedWorkout;
      if (targetType === 'endurance') {
        selectedWorkout = cwPool.reduce((best, w) =>
          Math.abs(w.duration_min - budget) < Math.abs(best.duration_min - budget) ? w : best
        , cwPool[0]);
      } else {
        const dateHash = Math.abs([...date].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0));
        selectedWorkout = cwPool[dateHash % cwPool.length];
      }

      const rawIntervals    = JSON.parse(selectedWorkout.intervals_json);
      const scaledIntervals = scaleCyclingIntervals(rawIntervals, budget < 999 ? budget : null);
      const tssPlanned      = calcCyclingTSS(scaledIntervals);
      const totalDurationSec = scaledIntervals.reduce((s, iv) => s + iv.duration_sec * (iv.sets ?? 1), 0);
      const sessionMin      = Math.round(totalDurationSec / 60);
      const coachNote       = buildCyclingCoachNote(selectedWorkout, scaledIntervals, cycleCoach);

      const sessionTagMap   = { endurance: 'zone2', sweet_spot: 'sweet_spot', threshold: 'hiit', vo2max: 'hiit', anaerobic: 'hiit' };
      const sessionTag      = sessionTagMap[targetType] ?? 'hiit';
      const sessionTypeLabel = { endurance: 'Zone 2', sweet_spot: 'Sweet Spot', threshold: 'Threshold', vo2max: 'VO2max', anaerobic: 'Anaerobic' }[targetType] ?? 'Intervals';
      const cyclingEquipUsed = effectiveEquip.find(e => CYCLING_EQUIPMENT.includes(e)) ?? 'road_bike';

      const cyclingStep = {
        exercise_id: `cycling_coach_${targetType}_${selectedWorkout.slug}`,
        exercise_slug: selectedWorkout.slug,
        name: selectedWorkout.name,
        category: 'cardio',
        tags_json: JSON.stringify(['cardio', 'cycling', sessionTag, 'outdoor']),
        equipment_required_json: JSON.stringify([cyclingEquipUsed]),
        target_reps: undefined,
        target_duration_sec: totalDurationSec,
        sets: 1,
        rest_sec: 0,
        instructions_json: null,
        alternatives_json: null,
        gif_url: null,
        coaching_note: coachNote,
        tss_planned: tssPlanned,
        intervals_json: JSON.stringify(scaledIntervals),
      };

      ctx.cyclingProgramOverride = {
        step: cyclingStep,
        week: cycleCoach.week ?? 1,
        sessionType: sessionTypeLabel,
        sub_goal: subGoal,
        block_phase: blockPhase,
        workout_id: selectedWorkout.id,
        tss_planned: tssPlanned,
      };
      ctx.trace.push(`R557 — Cycling Coach: Week ${cycleCoach.week ?? 1} session ${ccSessionInWeek + 1}/${cyclingDaysPerWeek} · ${subGoal} · ${targetType} · ${selectedWorkout.name} · ${sessionMin}min · TSS≈${tssPlanned} (${blockPhase})`);
    }
  }

  // R557c
  const crossTrainCycleCoach = prefs?.preferences?.cycling_coach;
  const crossTrainActive = cyclingProgramActive
    && !!(crossTrainCycleCoach?.run_cross_training)
    && (crossTrainCycleCoach?.run_days_per_week ?? 0) > 0
    && !ctx.cyclingProgramOverride;

  if (crossTrainActive) {
    const runDaysPerWeek     = crossTrainCycleCoach.run_days_per_week ?? 1;
    const crossRunSlotAvail  = ctx.crossRunsLast7 < runDaysPerWeek;
    const cyclingDaysPerWeekCt = crossTrainCycleCoach.cycling_days_per_week ?? 3;
    const cyclingSlotFull    = ctx.cyclingSessionsLast7 >= cyclingDaysPerWeekCt;
    const shortTimeCt        = !!(checkIn?.time_budget && checkIn.time_budget < 40);
    const lastCrossRunDate   = crossTrainCycleCoach.last_cross_run_at_ms
      ? new Date(crossTrainCycleCoach.last_cross_run_at_ms).toISOString().slice(0, 10)
      : null;
    const enoughRunRest  = !lastCrossRunDate || lastCrossRunDate < date;
    const shouldCrossRun = crossRunSlotAvail && enoughRunRest && (cyclingSlotFull || shortTimeCt);

    if (shouldCrossRun) {
      const runLevel = crossTrainCycleCoach.run_level ?? 1;
      let effectiveLevel = runLevel;
      if (checkIn?.time_budget && checkIn.time_budget < 25) {
        effectiveLevel = 0;
      } else if (checkIn?.time_budget && checkIn.time_budget < 40) {
        effectiveLevel = Math.max(1, runLevel - 2);
      }
      if (effectiveLevel > 0) {
        const runSlug  = effectiveLevel <= 6 ? `run-interval-level-${effectiveLevel}` : `run-level-${effectiveLevel}`;
        const runEx    = exercises.find(ex => ex.slug === runSlug);
        const warmUpEx = exercises.find(ex => ex.slug === 'easy-jog-warmup');
        const cooldownEx = exercises.find(ex => ex.slug === 'cooldown-walk');
        if (runEx) {
          const reason = cyclingSlotFull ? 'rest day fill' : 'short time — swapped from cycling';
          ctx.trace.push(`R557c — Cross-training run: Level ${effectiveLevel} (${runEx.name}) · ${reason} · ${ctx.crossRunsLast7}/${runDaysPerWeek} runs this window`);
          ctx.crossTrainingOverride = {
            warmUps: warmUpEx ? [warmUpEx] : [],
            runEx,
            cooldownWalk: cooldownEx ?? null,
            level: effectiveLevel,
          };
        }
      }
    }
  }

  // R568
  const polarisedOn = isProEnabled && prefs?.preferences?.sport_prefs?.polarised_training;
  if (polarisedOn && !ctx.runProgramOverride && !inSpecialMode && ctx.slot_type !== 'rest') {
    const lastType = prefs?.preferences?.sport_prefs?.last_endurance_type ?? null;
    const lifeRuleReducedIntensity = ctx.intensity === 'low';
    const nextType     = lifeRuleReducedIntensity ? 'zone2' : (lastType === 'hiit' ? 'zone2' : 'hiit');
    const opposingType = nextType === 'hiit' ? 'zone2' : 'hiit';
    const poolWithTags = ctx.pool.map(ex => ({ ex, tags: JSON.parse(ex.tags_json || '[]') }));
    const preferredCount = poolWithTags.filter(({ tags }) => tags.includes(nextType)).length;
    if (preferredCount > 0) {
      ctx.pool = poolWithTags.filter(({ tags }) => !tags.includes(opposingType)).map(({ ex }) => ex);
      const reasonNote = lifeRuleReducedIntensity ? ' (life-rule override: intensity=low → zone2)' : '';
      ctx.trace.push(`R568 — Polarised: last=${lastType ?? 'none'}, promoting ${nextType}${reasonNote} (${preferredCount} exercises), removed ${opposingType}`);
    }
  }

  // R570–R582 Military
  const milCoach = prefs?.preferences?.military_coach;
  const _primaryIntent2 = prefs?.preferences?.primary_intent ?? null;
  const militaryActive = !!(milCoach?.active) && !inSpecialMode
    && (_primaryIntent2 === null || _primaryIntent2 === 'military')
    && ctx.slot_type !== 'rest' && ctx.slot_type !== 'micro';

  if (militaryActive) {
    const {
      milWeek, blockIdx, cyclePosn, milGroup, sessionType, milVol, checkInOverride,
    } = computeMilitaryPhase(milCoach, checkIn, date);
    ctx.milWeekComputed   = milWeek;
    ctx.militarySessionType = sessionType;
    ctx.volumeMultiplier  = Math.min(ctx.volumeMultiplier, milVol);
    ctx.trace.push(`R570 — Military Coach: ${milGroup} Block${milWeek}.${blockIdx + 1}/4 [cycle${cyclePosn}] → ${sessionType} (vol ×${milVol.toFixed(2)}${checkInOverride ? ` — check-in override: ${checkInOverride}` : ''})`);

    if (sessionType === 'rust') {
      ctx.slot_type = 'rest';
      ctx.trace.push('R570 — Military scheduled rest day');

    } else if (sessionType === 'cooper_test') {
      const cooperEx     = exercises.find(ex => ex.slug === '12-minute-cooper-test');
      const warmUps      = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
      const warmupJog    = exercises.find(ex => ex.slug === 'easy-jog-warmup');
      const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
      if (cooperEx) {
        const milWeekLabel = !milCoach.last_cooper_distance_m ? 'baseline'
          : cyclePosn === 6 ? 'assessment simulation' : 'progress check';
        ctx.militaryProgramOverride = {
          type: 'cooper_test', warmUps, warmupJog, cooperEx, cooldownWalk,
          week: milWeek, sessionType: 'Cooper Test', label: milWeekLabel,
        };
        ctx.trace.push(`R576 — Military Cooper test (${milWeekLabel})`);
      }

    } else if (sessionType === 'duurloop') {
      const peakLevels   = MIL_CLUSTER_RUN_PEAK[milGroup] ?? { zone2: 9, hiit: 3 };
      const offset       = MIL_RUN_WEEK_OFFSET[cyclePosn - 1] ?? 0;
      const targetLvl    = Math.max(7, peakLevels.zone2 + offset);
      const sessionDurSec = ctx.unlimited ? Number.MAX_SAFE_INTEGER : budget * 60;
      const availRunSec  = Math.max(600, sessionDurSec - 4 * 45);
      let effectiveLvl   = 7;
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
        ctx.militaryProgramOverride = { type: 'duurloop', warmUps, runEx, cooldownWalk, week: milWeek, sessionType: 'Zone 2 Run' };
        ctx.trace.push(`R571 — Military duurloop: run-continuous-level-${effectiveLvl} (target ${targetLvl})`);
      }

    } else if (sessionType === 'interval') {
      const peakLevels = MIL_CLUSTER_RUN_PEAK[milGroup] ?? { zone2: 9, hiit: 3 };
      const offset     = MIL_RUN_WEEK_OFFSET[cyclePosn - 1] ?? 0;
      const targetLvl  = Math.max(1, Math.min(6, peakLevels.hiit + (offset < 0 ? offset : 0)));
      const runEx      = exercises.find(ex => ex.slug === `run-interval-level-${targetLvl}`);
      const warmUps    = exercises.filter(ex => JSON.parse(ex.tags_json || '[]').includes(RUN_WARMUP_TAG));
      const cooldownWalk = exercises.find(ex => ex.slug === 'cooldown-walk');
      if (runEx && warmUps.length) {
        ctx.militaryProgramOverride = { type: 'interval', warmUps, runEx, cooldownWalk, week: milWeek, sessionType: 'Intervals' };
        ctx.trace.push(`R572 — Military intervals: run-interval-level-${targetLvl}`);
      }

    } else {
      // R573–R575 strength / march / circuit
      if (ctx.militaryTemplateItems && ctx.militaryTemplateItems.length >= 3) {
        let dbItems = sessionType === 'kracht_marsen'
          ? ctx.militaryTemplateItems.filter(ex => !JSON.parse(ex.tags_json || '[]').includes('march'))
          : ctx.militaryTemplateItems;
        if (ctx.injuryAreas.length > 0) {
          const safe = dbItems.filter(ex => {
            const tags = JSON.parse(ex.tags_json || '[]');
            return !ctx.injuryAreas.some(a => tags.includes(`loads_${a}`));
          });
          if (safe.length >= 3) dbItems = safe;
        }
        ctx.militaryDbSelection = dbItems;
        ctx.trace.push(`R573a — Military DB session: ${dbItems.length} exercises from program_templates`);
      } else {
        const milPool = ctx.pool.filter(ex => JSON.parse(ex.tags_json || '[]').includes('military'));
        if (milPool.length >= 3) {
          ctx.pool = milPool;
          ctx.trace.push(`R573 — Military pool${ctx.militaryTemplateItems !== null ? ' (DB items insufficient — fallback)' : ''}: ${milPool.length} military-tagged exercises`);
        } else {
          ctx.trace.push(`R573 — Military pool too small (${milPool.length}), using full pool`);
        }
        if (sessionType === 'circuit') {
          const circuitPool = ctx.pool.filter(ex => {
            const m = JSON.parse(ex.metrics_json || '{}');
            return m.supports?.includes('time') || m.supports?.includes('reps');
          });
          if (circuitPool.length >= 3) ctx.pool = circuitPool;
          ctx.trace.push(`R575 — Military circuit: ${ctx.pool.length} exercises in time/reps pool`);
        }
      }

      if (sessionType === 'kracht_marsen') {
        const prescribedKg  = MIL_MARCH_KG[milGroup]?.[cyclePosn - 1] ?? 0;
        const prescribedSec = MIL_MARCH_SEC[milGroup]?.[cyclePosn - 1] ?? 0;
        const injuryCap     = ctx.injuryAreas.includes('lower_back') ? 15
          : ctx.injuryAreas.includes('knee') ? 0 : 999;
        const weightCap     = Math.min(prescribedKg, injuryCap);
        const ownedWeights  = Array.isArray(milCoach.pack_weights_available_kg) && milCoach.pack_weights_available_kg.length > 0
          ? milCoach.pack_weights_available_kg
          : milCoach.pack_weight_max_kg != null ? [milCoach.pack_weight_max_kg] : null;
        if (ownedWeights) {
          const valid = ownedWeights.filter(w => w <= weightCap).sort((a, b) => b - a);
          ctx.militaryMarchKg = valid.length > 0 ? valid[0] : 0;
        } else {
          ctx.militaryMarchKg = weightCap;
        }
        ctx.militaryMarchSec = prescribedSec;

        if (ctx.injuryAreas.includes('knee') && prescribedSec > 0) {
          ctx.trace.push('R577 — Knee injury: weighted march replaced with walking lunge');
          const lungeEx = exercises.find(ex => ex.slug === 'walking-lunge' || ex.slug === 'lunge');
          if (lungeEx) ctx.pool = [lungeEx, ...ctx.pool.filter(ex => ex.id !== lungeEx.id)];
        } else if (prescribedSec > 0) {
          ctx.trace.push(`R574 — March: ${ctx.militaryMarchKg} kg × ${prescribedSec / 60} min (prescribed ${prescribedKg} kg)`);
        }
      }
    }
  }
}

// ── Stage 5: Select exercises ─────────────────────────────────────────────────
function _selectExercises(ctx) {
  const { checkIn, exercises, prefs, date, pregnancyContext } = ctx;
  const { goal, bonusSession, inSpecialMode } = ctx;
  const periodToday = checkIn?.checkin_json?.period_today ?? checkIn?.period_today ?? false;
  const phase       = ctx.cycleContext?.phase ?? null;

  // Target category
  let targetCategory;
  if (ctx.slot_type === 'rest') {
    targetCategory = 'mobility';
  } else if (inSpecialMode) {
    const postnatalPhase = pregnancyContext?.postnatal_phase;
    if (postnatalPhase === 'immediate' || postnatalPhase === 'early') {
      targetCategory = 'mobility';
    } else {
      targetCategory = 'strength';
    }
  } else if ((checkIn?.stress ?? 0) >= 7 || periodToday || phase === 'menstrual') {
    targetCategory = 'mobility';
  } else {
    targetCategory = GOAL_CATEGORY[goal] ?? 'strength';
  }
  ctx.targetCategory = targetCategory;

  // Filter + seed-shuffle
  let filtered = ctx.pool.filter(ex => ex.category === targetCategory);
  if (!filtered.length) filtered = ctx.pool;
  if (!filtered.length) {
    filtered = inSpecialMode
      ? exercises.filter(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'))
      : [...exercises];
    ctx.trace.push(`WARN R561 — Pool empty after all filters (target: ${targetCategory}); safe fallback applied (inSpecialMode: ${inSpecialMode})`);
  }
  let shuffled = seededShuffle(filtered, date);

  // R555 pin: interval exercise pinned back if category filter removed it
  if (ctx.r555PinnedEx && !shuffled.some(ex => ex.id === ctx.r555PinnedEx.id) && !ctx.runProgramOverride) {
    shuffled = [ctx.r555PinnedEx, ...shuffled];
    ctx.trace.push(`R555 — Interval pinned back after category filter (targetCategory: ${targetCategory})`);
  }

  const sportBiasEnabled = prefs?.preferences?.sport_prefs?.bias_enabled !== false;

  // R550–R560 Progression
  if (ctx.progressionState?.scores && !bonusSession && !inSpecialMode && ctx.slot_type !== 'rest') {
    const progScores  = ctx.progressionState.scores;
    const chartMode   = ctx.progressionState.chartMode ?? 'balanced';
    const baseTargets = PROG_GOAL_TARGETS[goal] ?? PROG_GOAL_TARGETS.health;
    const _sportPrefs = prefs?.preferences?.sport_prefs;
    const { targets, biasTrace } = (!ctx.runProgramOverride && !ctx.cyclingProgramOverride && sportBiasEnabled)
      ? computeSportBiasedTargets(baseTargets, _sportPrefs, ctx.runSessionsLast7, ctx.cyclingSessionsLast7)
      : { targets: baseTargets, biasTrace: null };
    if (biasTrace) {
      const adj = Object.entries(biasTrace.adjustments).filter(([, v]) => v !== 0).map(([ax, v]) => `${ax}${v > 0 ? '+' : ''}${v}`).join(', ');
      const guardrailNote = biasTrace.guardrailApplied
        ? ` [guardrail ×${biasTrace.guardrailFactor} — ${biasTrace.weeklyCount} sport sessions/wk]`
        : '';
      ctx.trace.push(`R560 — Sport bias: targets adjusted for ${biasTrace.primary} (${adj || 'no change'})${guardrailNote}`);
    }
    const axes = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];
    ctx.trace.push('R550 — Progression profile loaded');

    const gaps = axes.map(axis => ({
      axis,
      current: progGetDisplayScore(progScores, axis, chartMode),
      target:  targets[axis] ?? 50,
      gap:     Math.max(0, (targets[axis] ?? 50) - progGetDisplayScore(progScores, axis, chartMode)),
    })).filter(g => g.gap >= T.PROG_GAP_BIAS).sort((a, b) => b.gap - a.gap);

    const topGap = gaps[0];

    if (topGap && !inSpecialMode) {
      const gapAxis       = topGap.axis;
      const gapCategory   = PROG_AXIS_CATEGORY[gapAxis] ?? targetCategory;
      const primarySport  = prefs?.preferences?.sport_prefs?.primary;
      const sportSupportTag = primarySport ? `sport_support:${primarySport}` : null;

      if (gapCategory !== targetCategory && targetCategory !== 'mobility') {
        const gapPool = ctx.pool.filter(ex => ex.category === gapCategory);
        if (gapPool.length >= 2) {
          let gapShuffled = seededShuffle(gapPool, date + gapAxis);
          if (sportSupportTag) {
            const sportTagged = gapShuffled.filter(ex => hasTags(ex, sportSupportTag));
            const nonTagged   = gapShuffled.filter(ex => !hasTags(ex, sportSupportTag));
            gapShuffled = [...sportTagged, ...nonTagged];
          }
          shuffled = [...gapShuffled.slice(0, 2), ...shuffled];
          ctx.trace.push(`R551 — Gap axis: ${gapAxis} (${topGap.current}→${topGap.target}) — added ${Math.min(2, gapShuffled.length)} ${gapCategory} exercise(s) to front of pool`);
        }
      }
      if (gapCategory === targetCategory) {
        const forGap   = shuffled.filter(ex => progGetExerciseAxis(ex) === gapAxis);
        const forOther = shuffled.filter(ex => progGetExerciseAxis(ex) !== gapAxis);
        let orderedGap = forGap;
        if (sportSupportTag) {
          const sportTagged = forGap.filter(ex => hasTags(ex, sportSupportTag));
          const nonTagged   = forGap.filter(ex => !hasTags(ex, sportSupportTag));
          orderedGap = [...sportTagged, ...nonTagged];
        }
        shuffled = [...orderedGap, ...forOther];
        const sportNote = (sportSupportTag && forGap.some(ex => hasTags(ex, sportSupportTag)))
          ? ` (${primarySport}-specific preferred)` : '';
        ctx.trace.push(`R551 — Gap axis: ${gapAxis} (${topGap.current}→${topGap.target}) — prioritised ${forGap.length} exercise(s) in pool${sportNote}`);
      }
    }

    if (chartMode === 'power' && ctx.intensity === 'low') {
      ctx.trace.push('R552 — Chart mode is Power but intensity is low today — progression gain will be minimal');
    }

    const mob = progScores.mobility;
    const daysSinceMobility = mob?.last_mobility_stimulus_at_ms
      ? Math.floor((ctx.planDateMs - mob.last_mobility_stimulus_at_ms) / 86_400_000)
      : 999;
    if (daysSinceMobility >= T.MOBILITY_DECAY_DAYS && goal !== 'mobility' && ctx.slot_type !== 'rest') {
      _addNote(ctx, 'Your mobility hasn\'t been trained in over a week — today\'s session includes some movement quality work to keep it from fading.');
      ctx.trace.push(`R553 — Mobility score decaying (${daysSinceMobility} days) — maintenance note added`);
    }

    if (topGap && topGap.gap >= T.PROG_GAP_NOTE) {
      const axisLabel = { push:'Push', pull:'Pull', legs:'Legs', core:'Core', conditioning:'Cardio', mobility:'Mobility' }[topGap.axis] ?? topGap.axis;
      ctx.trace.push(`R554 — ${axisLabel} is your biggest gap (score ${topGap.current} vs target ${topGap.target}) — planner is prioritising it`);
    }
  }

  // Exercise count
  const postnatalPhase = pregnancyContext?.postnatal_phase;
  const isGentleMode   = postnatalPhase === 'immediate' || postnatalPhase === 'early';
  let count;
  if (ctx.slot_type === 'micro' || isGentleMode) {
    count = 2;
  } else {
    const baseCount = ctx.budget >= 90 ? 8
      : ctx.budget >= 60 ? 7
      : ctx.budget >= 45 ? 6
      : ctx.budget > 35  ? 5
      : ctx.budget > 20  ? 4
      : 3;
    const goalMod = GOAL_COUNT_MOD[goal] ?? 0;
    const expMod  = ctx.expLevel === 'advanced' ? 1 : ctx.expLevel === 'beginner' ? -1 : 0;
    count = Math.max(2, Math.min(10, baseCount + goalMod + expMod));
    if (goalMod !== 0 || expMod !== 0) {
      ctx.trace.push(`R501 — Exercise count: ${baseCount} base + ${goalMod} goal + ${expMod} experience = ${count}`);
    }
  }

  const milIsRunSession = ctx.militaryProgramOverride?.type === 'duurloop' || ctx.militaryProgramOverride?.type === 'interval';
  const milIsCooperTest = ctx.militaryProgramOverride?.type === 'cooper_test';

  const baseSelection = ctx.runProgramOverride
    ? [
        ...ctx.runProgramOverride.warmUps,
        ctx.runProgramOverride.runEx,
        ...(ctx.runProgramOverride.cooldownWalk ? [ctx.runProgramOverride.cooldownWalk] : []),
      ]
    : ctx.crossTrainingOverride
    ? [
        ...ctx.crossTrainingOverride.warmUps,
        ctx.crossTrainingOverride.runEx,
        ...(ctx.crossTrainingOverride.cooldownWalk ? [ctx.crossTrainingOverride.cooldownWalk] : []),
      ]
    : ctx.cyclingProgramOverride
    ? []
    : milIsCooperTest
    ? [
        ...(ctx.militaryProgramOverride.warmUps ?? []),
        ...(ctx.militaryProgramOverride.warmupJog ? [ctx.militaryProgramOverride.warmupJog] : []),
        ctx.militaryProgramOverride.cooperEx,
        ...(ctx.militaryProgramOverride.cooldownWalk ? [ctx.militaryProgramOverride.cooldownWalk] : []),
      ]
    : milIsRunSession
    ? [
        ...ctx.militaryProgramOverride.warmUps,
        ctx.militaryProgramOverride.runEx,
        ...(ctx.militaryProgramOverride.cooldownWalk ? [ctx.militaryProgramOverride.cooldownWalk] : []),
      ]
    : ctx.militaryDbSelection
    ? ctx.militaryDbSelection
    : shuffled.slice(0, count);

  // R561 sport mobility injection
  let selection = baseSelection;
  if (
    sportBiasEnabled && !inSpecialMode && !ctx.runProgramOverride && !ctx.crossTrainingOverride
    && !ctx.cyclingProgramOverride && !ctx.militaryProgramOverride && !ctx.militaryDbSelection
    && ctx.slot_type !== 'rest'
  ) {
    const primarySport = prefs?.preferences?.sport_prefs?.primary;
    if (primarySport) {
      const mobilityTag = `sport_mobility:${primarySport}`;
      const alreadyHasMobility = baseSelection.some(ex => hasTags(ex, mobilityTag));
      if (!alreadyHasMobility) {
        const injPool = exercises.filter(ex =>
          hasTags(ex, mobilityTag) && !baseSelection.some(s => s.id === ex.id)
        );
        if (injPool.length > 0) {
          const inj = seededShuffle(injPool, date + 'r561')[0];
          selection = [...baseSelection, inj];
          ctx.trace.push(`R561 — Sport mobility injection: ${inj.name} added for ${primarySport}`);
        }
      }
    }
  }

  ctx.selection = selection;
  ctx.shuffled  = shuffled;
}

// ── Stage 6: Assemble session ─────────────────────────────────────────────────
function _assembleSession(ctx) {
  const { checkIn, exercises, prefs, date, pregnancyContext } = ctx;
  const { goal, expLevel, budget, unlimited, rawBudget, selection, targetCategory } = ctx;

  const expRepScale  = { beginner: 0.8, intermediate: 1.0, advanced: 1.2 };
  const expSetMod    = { beginner: -1,  intermediate: 0,   advanced:  1  };
  const repScale     = expRepScale[expLevel]  ?? 1.0;
  const setOffset    = expSetMod[expLevel]    ?? 0;
  const goalSetsBase = GOAL_SETS_BASE[goal] ?? 3;
  const goalRestMult = GOAL_REST_MULT[goal] ?? 1.0;

  const postnatalPhase = pregnancyContext?.postnatal_phase;
  const isGentleMode   = postnatalPhase === 'immediate' || postnatalPhase === 'early';

  const steps = ctx.slot_type === 'rest' ? [] : ctx.cyclingProgramOverride ? [ctx.cyclingProgramOverride.step] : selection.map(ex => {
    const metrics   = JSON.parse(ex.metrics_json || '{}');
    const exTags    = JSON.parse(ex.tags_json || '[]');
    const isRunWarmup   = exTags.includes('run_warmup');
    const supportsReps  = metrics.supports?.includes('reps');
    const baseDuration  = metrics.base_duration_sec ?? 30;
    let reps = supportsReps ? (isRunWarmup ? 10 : (GOAL_REPS[goal] ?? 10)) : undefined;

    const equipmentRequired = JSON.parse(ex.equipment_required_json || '["none"]');
    const isWeighted = supportsReps && equipmentRequired.some(e =>
      ['dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 'plate', 'resistance_band',
       'bench', 'bench_press_rack', 'squat_rack', 'smith_machine', 'multi_gym', 'ankle_weights',
       'weight_plates', 'stability_ball'].includes(e)
    );
    const coachingNote = isWeighted ? (GOAL_COACHING_NOTE[goal] ?? null) : null;
    let duration = !supportsReps ? baseDuration : undefined;

    const isLongCardio   = !supportsReps && baseDuration > 300;
    const isFixedDuration = ex.slug === '12-minute-cooper-test'
      || ex.slug === 'easy-jog-warmup'
      || ex.slug === 'cooldown-walk';

    let sets;
    if (ctx.slot_type === 'micro' || isGentleMode || isLongCardio) {
      sets = 1;
    } else if (metrics.fixed_sets) {
      sets = metrics.fixed_sets;
    } else {
      sets = Math.max(1, Math.min(5, goalSetsBase + setOffset));
    }

    // R512: Low energy → volume × 0.6
    if ((checkIn?.energy ?? 10) <= T.ENERGY_LOW) {
      if (reps)                         { reps     = Math.floor(reps     * 0.6); ctx.trace.push(`R512 — Low energy → ${ex.name} reps ×0.6`); }
      if (duration && !isFixedDuration) { duration = Math.floor(duration * 0.6); ctx.trace.push(`R512 — Low energy → ${ex.name} duration ×0.6`); }
    }

    // R502: Experience level scales reps AND duration
    if (repScale !== 1.0) {
      if (reps)     reps     = Math.round(reps     * repScale);
      if (duration && !isLongCardio && !isRunWarmup && !isFixedDuration) duration = Math.round(duration * repScale);
    }

    // Apply volume multiplier (R521, R536)
    if (ctx.volumeMultiplier !== 1.0) {
      if (reps)                         reps     = Math.round(reps     * ctx.volumeMultiplier);
      if (duration && !isFixedDuration) duration = Math.round(duration * ctx.volumeMultiplier);
    }

    if (reps) reps = Math.max(3, Math.min(30, reps));

    const baseRest    = getDefaultRest(ex, ctx.slot_type);
    const adjustedRest = Math.round(baseRest * goalRestMult / 5) * 5;

    const media = ex.media_json ? JSON.parse(ex.media_json) : {};
    return {
      exercise_id:   ex.id,
      exercise_slug: ex.slug,
      name:          ex.name,
      category:      ex.category,
      tags_json:     ex.tags_json ?? '[]',
      equipment_required_json: ex.equipment_required_json ?? '["none"]',
      target_reps:          reps,
      target_duration_sec:  duration,
      sets,
      rest_sec:             adjustedRest,
      instructions_json:    ex.instructions_json ?? null,
      alternatives_json:    ex.alternatives_json ?? null,
      gif_url:              media.gif_url ?? null,
      coaching_note:        coachingNote,
      ...(ex.trainer_logo_url ? { trainer_logo_url: ex.trainer_logo_url, trainer_logo_bg: ex.trainer_logo_bg ?? '#0a0a0a' } : {}),
    };
  });

  // R574 — Military kracht+marsen: append weighted march step
  if (ctx.militarySessionType === 'kracht_marsen' && ctx.militaryMarchSec > 0 && ctx.slot_type !== 'rest') {
    const marchEx = exercises.find(ex => ex.slug === 'weighted-march');
    if (marchEx) {
      const kgLabel = ctx.militaryMarchKg > 0 ? `${ctx.militaryMarchKg} kg` : 'bodyweight';
      const media   = marchEx.media_json ? JSON.parse(marchEx.media_json) : {};
      steps.push({
        exercise_id:   marchEx.id,
        exercise_slug: marchEx.slug,
        name:          marchEx.name,
        category:      marchEx.category,
        tags_json:     marchEx.tags_json ?? '[]',
        equipment_required_json: marchEx.equipment_required_json ?? '["none"]',
        target_reps:          undefined,
        target_duration_sec:  ctx.militaryMarchSec,
        sets:                 1,
        rest_sec:             120,
        instructions_json:    marchEx.instructions_json ?? null,
        alternatives_json:    marchEx.alternatives_json ?? null,
        gif_url:              media.gif_url ?? null,
        coaching_note:        `March at 5.5 km/h with ${kgLabel}. Maintain upright posture throughout.`,
        military_march_kg:    ctx.militaryMarchKg,
      });
      ctx.trace.push(`R574 — March step added: ${kgLabel} × ${ctx.militaryMarchSec / 60} min`);
    }
  }

  // R524 — Weight-adjusted volume (bodyweight exercises)
  if (ctx.weightKg && steps.length) {
    const weightRatio = ctx.weightKg / 70;
    for (const step of steps) {
      const ex   = exercises.find(e => e.id === step.exercise_id);
      const tags = JSON.parse(ex?.tags_json || '[]');
      if (tags.includes('bodyweight') && step.target_reps) {
        const wScale = Math.max(0.7, Math.min(1.3, 1 / Math.sqrt(weightRatio)));
        step.target_reps = Math.round(step.target_reps * wScale);
      }
    }
  }

  // R525 — Female mobility inclusion
  if (ctx.sex === 'female' && ctx.slot_type === 'main' && steps.length && ctx.isStandardMode && !ctx.runProgramOverride) {
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
          exercise_id:   mobilityEx.id,
          exercise_slug: mobilityEx.slug,
          name:          mobilityEx.name,
          category:      mobilityEx.category,
          tags_json:     mobilityEx.tags_json ?? '[]',
          target_reps:         undefined,
          target_duration_sec: 30,
          sets:                1,
          rest_sec:            getDefaultRest(mobilityEx, ctx.slot_type),
          instructions_json:   mobilityEx.instructions_json ?? null,
          alternatives_json:   mobilityEx.alternatives_json ?? null,
          gif_url:             media.gif_url ?? null,
        });
      }
    }
  }

  // R534/R541 — Pelvic floor inclusion
  const needsPelvicFloor =
    (pregnancyContext?.mode === 'pregnant' && (pregnancyContext?.trimester ?? 1) >= 2) ||
    (pregnancyContext?.mode === 'postnatal' && ['immediate', 'early', 'rebuilding'].includes(pregnancyContext?.postnatal_phase));

  if (needsPelvicFloor && ctx.slot_type !== 'rest') {
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
          exercise_id:   pfEx.id,
          exercise_slug: pfEx.slug,
          name:          pfEx.name,
          category:      pfEx.category,
          tags_json:     pfEx.tags_json ?? '[]',
          target_reps:         10,
          target_duration_sec: undefined,
          sets:                2,
          rest_sec:            getDefaultRest(pfEx, ctx.slot_type),
          instructions_json:   pfEx.instructions_json ?? null,
          alternatives_json:   pfEx.alternatives_json ?? null,
          gif_url:             media.gif_url ?? null,
        });
        const ruleLabel = pregnancyContext.mode === 'pregnant' ? 'R534' : 'R541';
        ctx.trace.push(`${ruleLabel} — Pelvic floor exercise added`);
      }
    }
  }

  // Session naming
  const template = ctx.templates?.length
    ? pickTemplate(ctx.templates, ctx.slot_type, ctx.intensity, budget)
    : null;

  const milCoach      = prefs?.preferences?.military_coach;
  const cycleCoach    = prefs?.preferences?.cycling_coach;
  const _primaryIntent3 = prefs?.preferences?.primary_intent ?? null;
  const militaryActive = !!(milCoach?.active) && !ctx.inSpecialMode
    && (_primaryIntent3 === null || _primaryIntent3 === 'military')
    && ctx.slot_type !== 'rest' && ctx.slot_type !== 'micro';

  let session_name;
  if (pregnancyContext?.mode === 'pregnant') {
    const trimester   = pregnancyContext.trimester ?? 1;
    const nauseaToday = checkIn?.pregnancy_signals?.nausea ?? false;
    if (nauseaToday)        session_name = 'Five minutes for you';
    else if (trimester === 3) session_name = 'Strong & supported';
    else                    session_name = 'Today\'s movement';
  } else if (pregnancyContext?.mode === 'postnatal') {
    const pPhase = pregnancyContext.postnatal_phase;
    if (pPhase === 'immediate' || pPhase === 'early') session_name = 'A gentle moment';
    else if (pPhase === 'rebuilding')                 session_name = 'Rebuilding your foundation';
    else                                              session_name = 'Today\'s recovery';
  } else if (ctx.militaryProgramOverride?.type === 'cooper_test') {
    session_name = `Cooper Test · Block ${ctx.militaryProgramOverride.week} · ${ctx.militaryProgramOverride.label ?? 'Assessment'}`;
  } else if (ctx.militaryProgramOverride?.type === 'duurloop') {
    session_name = `Military · Zone 2 Run · Block ${ctx.militaryProgramOverride.week}`;
  } else if (ctx.militaryProgramOverride?.type === 'interval') {
    session_name = `Military · Intervals · Block ${ctx.militaryProgramOverride.week}`;
  } else if (ctx.militarySessionType === 'kracht_marsen') {
    session_name = `Military · Strength & March · Block ${ctx.milWeekComputed}`;
  } else if (ctx.militarySessionType === 'circuit') {
    session_name = `Military · Circuit · Block ${ctx.milWeekComputed}`;
  } else if (ctx.militarySessionType === 'kracht' && militaryActive) {
    session_name = `Military · Strength · Block ${ctx.milWeekComputed}`;
  } else if (ctx.runProgramOverride) {
    session_name = `Running Day · Week ${ctx.runProgramOverride.week} · ${ctx.runProgramOverride.sessionType}`;
  } else if (ctx.cyclingProgramOverride) {
    session_name = `Cycling Day · Week ${ctx.cyclingProgramOverride.week} · ${ctx.cyclingProgramOverride.sessionType}`;
  } else if (ctx.crossTrainingOverride) {
    session_name = `Cross-Training Run · Level ${ctx.crossTrainingOverride.level}`;
  } else if (ctx.slot_type === 'rest') {
    session_name = 'Active Rest';
  } else if (ctx.slot_type === 'micro') {
    session_name = 'Micro Session';
  } else {
    const goalNames = GOAL_SESSION_NAMES[goal];
    if (goalNames?.length) {
      const idx = Math.abs([...date].reduce((h, c) => Math.imul(31, h) + c.charCodeAt(0) | 0, 0)) % goalNames.length;
      session_name = goalNames[idx];
    } else {
      session_name = template?.name ?? 'Daily Training';
    }
  }

  // Exercise ordering: outdoor always last, indoor cardio second-to-last
  const isOutdoorStep     = s => JSON.parse(s.tags_json || '[]').includes('outdoor');
  const isIndoorCardioStep = s => {
    const tags = JSON.parse(s.tags_json || '[]');
    return tags.includes('cardio') && !tags.includes('outdoor');
  };
  const coreSteps         = steps.filter(s => !isOutdoorStep(s) && !isIndoorCardioStep(s));
  const indoorCardioSteps = steps.filter(s => isIndoorCardioStep(s));
  const outdoorSteps      = steps.filter(s => isOutdoorStep(s));
  const orderedSteps = [...coreSteps, ...indoorCardioSteps, ...outdoorSteps];
  if (indoorCardioSteps.length || outdoorSteps.length) {
    ctx.trace.push(`Ordering — core: ${coreSteps.length}, indoor cardio: ${indoorCardioSteps.length}, outdoor: ${outdoorSteps.length}`);
  }

  return {
    date,
    slot_type:        ctx.slot_type,
    intensity:        ctx.intensity,
    session_name,
    template_slug:    template?.slug ?? null,
    target_category:  targetCategory,
    session_notes:    ctx.sessionNotes,
    pregnancy_week:   pregnancyContext?.week ?? null,
    trimester:        pregnancyContext?.trimester ?? null,
    postnatal_phase:  pregnancyContext?.postnatal_phase ?? null,
    steps:            orderedSteps,
    experience_level: ctx.expLevel ?? 'intermediate',
    coach_priority:   COACH_PRIORITY,
    rule_trace:       ctx.trace,
    run_program: ctx.runProgramOverride
      ? { week: ctx.runProgramOverride.week, level: ctx.runProgramOverride.level, target_km: ctx.runCoach?.target_km ?? 5, session_type: ctx.runProgramOverride.sessionType }
      : null,
    cycling_program: ctx.cyclingProgramOverride
      ? {
          week:         ctx.cyclingProgramOverride.week,
          session_type: ctx.cyclingProgramOverride.sessionType,
          unit:         cycleCoach?.unit ?? 'watts',
          sub_goal:     ctx.cyclingProgramOverride.sub_goal,
          block_phase:  ctx.cyclingProgramOverride.block_phase,
          tss_planned:  ctx.cyclingProgramOverride.tss_planned,
          workout_id:   ctx.cyclingProgramOverride.workout_id,
        }
      : null,
    cross_training_run: ctx.crossTrainingOverride
      ? { level: ctx.crossTrainingOverride.level }
      : null,
    military_program: militaryActive ? (() => {
      const {
        blockNum: retBlockNum, blockIdx: retBlockIdx, cyclePosn: retCyclePosn,
        inBaseBuild: retInBaseBuild, milGroup: retGroup,
        clusterLive: retClusterLive, isPostAssessment: retIsPostAssess,
      } = computeMilitaryPhase(milCoach, checkIn, date);
      return {
        week:                   retBlockNum,
        day:                    retBlockIdx,
        sessions_per_block:     SESSIONS_PER_BLOCK,
        session_type:           ctx.militarySessionType,
        track:                  milCoach.track ?? 'keuring',
        cluster_target:         milCoach.cluster_target ?? 1,
        cluster_current:        retClusterLive,
        group:                  retGroup,
        march_kg:               ctx.militaryMarchKg  || null,
        march_sec:              ctx.militaryMarchSec || null,
        target_date:            milCoach.target_date ?? null,
        mode:                   milCoach.mode ?? 'target',
        is_base_build:          retInBaseBuild,
        is_calibration_week:    retCyclePosn === 1,
        is_deload_week:         retCyclePosn === 5,
        is_taper_week:          retCyclePosn === 6,
        is_post_assessment:     retIsPostAssess || milCoach.mode === 'open',
        last_cooper_distance_m: milCoach.last_cooper_distance_m ?? null,
      };
    })() : null,
  };
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
function runPlanner(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
  cycleContext, pregnancyContext, bonusSession, progressionState, isPro = false,
  cyclingWorkouts = [], cyclingTsb = null, cyclingSessionsLast7 = 0, runSessionsLast7 = 0,
  crossRunsLast7 = 0, militaryTemplateItems = null, runPrograms = null) {
  const ctx = _initPlannerContext(
    date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
    cycleContext, pregnancyContext, bonusSession, progressionState, isPro,
    cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7,
    crossRunsLast7, militaryTemplateItems, runPrograms
  );
  _applySafetyPolicies(ctx);
  _applyBodyModePolicies(ctx);
  _selectCoachBlueprint(ctx);
  _selectExercises(ctx);
  return _assembleSession(ctx);
}

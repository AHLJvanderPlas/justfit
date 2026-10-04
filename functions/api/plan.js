import { computeMilitaryPhase, SESSIONS_PER_BLOCK, MIL_MARCH_KG, MIL_MARCH_SEC, MIL_CLUSTER_RUN_PEAK, MIL_RUN_WEEK_OFFSET } from './_shared/military.js';
import { buildCyclingWorkoutsFromProtocols, CYCLING_PROFILES, getCyclingBlockPhase, calcCyclingTSS, scaleCyclingIntervals, computeCyclingTsb, buildCyclingCoachNote } from './_shared/cycling.js';
import { RUN_PROGRAMS, RUN_WARMUP_TAG, buildRunProgramsFromTemplates, isRunVolumeExercise } from './_shared/running.js';

import { getAuthUserId } from './_shared/auth.js';
import { computeRecovery, RECOVERY_QUERY, RECOVERY_WINDOW_DAYS, FATIGUE_THRESHOLD } from './_shared/recovery.js';
import { getDcpNorms, dcpProgress, dcpAgeFrom, dcpBiasStrength, dcpCardVisible, dcpIsStale } from './_shared/military.js';
import { musclesFromJson } from './_shared/muscles.js';

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
    const { date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session, coach_sim, adapt_mode, base_plan, force_assessment } = body;
    // W4.1 / W4.4 — user override. See assembleCustomSession and the W4 notes.
    const { custom_steps, safety_ack, include_assessment, pinned_exercise_ids, session_name } = body;
    const isCustom = custom_steps !== undefined && custom_steps !== null;
    const hasPins  = pinned_exercise_ids !== undefined && pinned_exercise_ids !== null;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }
    // Shape checks before any database work. A user-authored session is today's
    // plan, never an ephemeral bonus or a free-tier adapt, and pinning is an
    // engine request — the three do not combine.
    if (isCustom) {
      const err = customStepsShapeError(custom_steps);
      if (err) return Response.json({ ok: false, error: 'invalid_custom_steps', detail: err }, { status: 400 });
      if (bonus_session || adapt_mode || hasPins) {
        return Response.json({ ok: false, error: 'invalid_custom_steps', detail: 'custom_steps cannot be combined with bonus_session, adapt_mode or pinned_exercise_ids' }, { status: 400 });
      }
    }
    if (hasPins) {
      const err = pinnedIdsShapeError(pinned_exercise_ids);
      if (err) return Response.json({ ok: false, error: 'invalid_pins', detail: err }, { status: 400 });
    }

    // JWT-derived user_id only — body field ignored to prevent IDOR.
    // If unauthenticated, user_id is null: plan generated without personalization, not saved to DB.
    const user_id = await getAuthUserId(request, env);

    // Fetch exercises and (optionally) user preferences in parallel
    const [exResult, userPrefs, templates, userProfileRow, cyclingWorkoutsResult, cyclingProtocolsResult, runProgramItemsResult, customExResult, recoveryResult, lastWeightsResult] = await Promise.all([
      env.DB.prepare(
        `SELECT id, slug, name, category, tags_json, equipment_required_json, metrics_json, media_json, instructions_json, alternatives_json,
                primary_muscles_json, secondary_muscles_json
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
            `SELECT sex, weight_kg, height_cm FROM user_preferences WHERE user_id = ? LIMIT 1`
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
      // C-F7 / R590 — recent training load per muscle, so the planner can avoid
      // stacking work on a muscle group that has not recovered.
      user_id
        ? env.DB.prepare(RECOVERY_QUERY).bind(user_id, Date.now() - RECOVERY_WINDOW_DAYS * 86_400_000).all()
        : Promise.resolve(null),
      // C-F6 — last weight the athlete actually used per exercise, so a prescribed
      // load starts from their real history rather than a guess. Newest row wins.
      user_id
        ? env.DB.prepare(
            `SELECT es.exercise_id, es.actual_json, ex.date
               FROM execution_steps es
               JOIN executions ex ON ex.id = es.execution_id
              WHERE ex.user_id = ? AND ex.status = 'completed'
                AND es.actual_json LIKE '%weight_kg%'
              ORDER BY COALESCE(ex.ended_at_ms, ex.created_at_ms) DESC
              LIMIT 400`
          ).bind(user_id).all()
        : Promise.resolve(null),
    ]);

    // exercise_id → what the athlete actually did last time. C-F8 shows this beside
    // today's target, which is where progression stops being a number in a chart and
    // becomes something you can feel.
    const lastWeightByExercise = new Map();
    const lastPerfByExercise = new Map();
    for (const row of (lastWeightsResult?.results ?? [])) {
      if (lastWeightByExercise.has(row.exercise_id)) continue; // ordered newest first
      try {
        const a = JSON.parse(row.actual_json);
        const w = (a?.weight_kg ?? []).filter((x) => Number(x) > 0);
        if (!w.length) continue;
        const top = Math.max(...w);
        lastWeightByExercise.set(row.exercise_id, top);
        // Reps performed on the heaviest set, so "last time" describes one real set
        // rather than mixing the top weight with an unrelated rep count.
        const idx = a.weight_kg.findIndex((x) => Number(x) === top);
        lastPerfByExercise.set(row.exercise_id, {
          weight_kg: top,
          reps: a.reps_per_set?.[idx] ?? null,
          date: row.date ?? null,
        });
      } catch { /* skip malformed */ }
    }
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
    // C-F6 — hang the athlete's last used weight on the exercise row itself. The
    // planner passes exercises through by reference, so _assembleSession can seed a
    // target load without another positional parameter on an already long signature.
    // R590 — an exercise is only as fresh as its most fatigued primary muscle. A
    // squat is not a good idea because the glutes recovered if the quads have not.
    const freshness = user_id
      ? computeRecovery(recoveryResult?.results ?? [], Date.now()).freshness
      : null;

    for (const ex of exResult.results) {
      const last = lastWeightByExercise.get(ex.id);
      if (last != null) ex.last_weight_kg = last;
      const perf = lastPerfByExercise.get(ex.id);
      if (perf) ex.last_performance = perf;
      if (freshness) {
        const regions = musclesFromJson(ex.primary_muscles_json);
        if (regions.size > 0) {
          ex.muscle_freshness = Math.min(...[...regions].map((r) => freshness[r] ?? 100));
        }
      }
    }

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

    // W4.1 — PROTECT THE OVERRIDE. A session the user wrote survives every
    // automatic regeneration — app open, check-in (engine or free-tier adapt),
    // retry, force_assessment. Only an explicit `replace_user_plan: true` (a
    // confirmed user action) or a new user-authored session replaces it. Runs
    // before the C-G4 cap so the response says WHY the plan did not change.
    // One read serves both this check and the C-G4 cap below (whose condition
    // is a subset of this one), so the override costs no extra round-trip.
    let existingRow = null;
    if (user_id && !isCustom && !bonus_session) {
      existingRow = await env.DB.prepare(
        'SELECT id, generated_by, plan_json FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1'
      ).bind(user_id, date).first();
      if (preservesUserPlan(existingRow, body)) {
        try {
          const stored = JSON.parse(existingRow.plan_json);
          return Response.json({ ok: true, saved: true, preserved: true, plan: { id: existingRow.id, ...stored } });
        } catch { /* malformed JSON — fall through and regenerate */ }
      }
    }

    // C-G4: Free users get 1 plan per day — return cached plan if already exists.
    //
    // A user-authored session (custom_steps) is exempt for the same reason: the
    // cap makes RE-ROLLING THE ENGINE a paid feature; writing your own session
    // is not a re-roll, generates nothing, and cannot be used to farm one. Pins
    // (W4.4) are exempt for the same reason, decided 2026-10-04: pinning your
    // physio's two exercises is telling the coach what you need, not re-rolling
    // for a nicer plan, and a pin request cannot be used to farm sessions either.
    //
    // force_assessment is exempt. The daily cap exists so re-rolling for a nicer
    // session is a paid feature; asking to measure yourself is neither a re-roll
    // nor a nicety — it is the input every DCP number downstream depends on, and
    // charging for it would make the bias aim at a stale baseline. The request
    // is explicit and user-initiated, so it cannot be used to farm new sessions.
    if (user_id && !isPro && !bonus_session && !force_assessment && !isCustom && !hasPins) {
      const existingPlan = existingRow;
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

    // W4.1 — user-authored session. Same inputs the engine would see, so the
    // advisory pass evaluates the guards the engine registered for this athlete
    // today; nothing is selected, scaled or dropped.
    if (isCustom) {
      const guardCtx = buildPlannerGuardContext(date, effectiveCheckin, allExercises, prefs, allTemplates, [],
        bodyProfile, resolvedCycleContext, pregnancyContext, false, progressionState, isPro,
        cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7, crossRunsLast7,
        militaryTemplateItems, runPrograms, { forceAssessment: include_assessment === true });
      const nowMs = Date.now();
      const built = assembleCustomSession(guardCtx, custom_steps, {
        safetyAck: safety_ack === true, includeAssessment: include_assessment === true, nowMs, sessionName: session_name,
      });
      if (built.status !== 200) return Response.json(built.body, { status: built.status });
      const userPlan = built.plan;
      const extra = { safety_notes: built.safety_notes, assessment_offer: built.assessment_offer };
      if (user_id) {
        const userExists = await env.DB.prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`).bind(user_id).first();
        if (userExists) {
          const newId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO day_plans
              (id, user_id, date, plan_status, plan_json, generated_by, engine_version, seed, created_at_ms, updated_at_ms)
            VALUES (?, ?, ?, 'final', ?, 'user', 'user-authored', 'user', ?, ?)
            ON CONFLICT(user_id, date) DO UPDATE SET
              plan_json = excluded.plan_json,
              generated_by = excluded.generated_by,
              engine_version = excluded.engine_version,
              updated_at_ms = excluded.updated_at_ms
          `).bind(newId, user_id, date, JSON.stringify(userPlan), nowMs, nowMs).run();
          const row = await env.DB.prepare(`SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1`).bind(user_id, date).first();
          return Response.json({ ok: true, saved: true, plan: { id: row?.id ?? newId, ...userPlan }, ...extra });
        }
      }
      return Response.json({ ok: true, saved: false, plan: userPlan, ...extra });
    }

    // W4.4 — every pin must be a real, active exercise for this user. Unknown
    // ids are a malformed request, not something to drop quietly.
    if (hasPins) {
      const known = new Set(allExercises.map(e => String(e.id)));
      const unknownPins = pinned_exercise_ids.map(String).filter(id => !known.has(id));
      if (unknownPins.length) {
        return Response.json({ ok: false, error: 'unknown_exercise', unknown_exercise_ids: [...new Set(unknownPins)] }, { status: 400 });
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
            ON CONFLICT(user_id, date) DO UPDATE SET plan_json=excluded.plan_json, generated_by=excluded.generated_by, engine_version=excluded.engine_version, updated_at_ms=excluded.updated_at_ms
          `).bind(adaptId, user_id, date, JSON.stringify(adapted), now, now).run();
          const row = await env.DB.prepare(`SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1`).bind(user_id, date).first();
          return Response.json({ ok: true, saved: true, plan: { id: row?.id ?? adaptId, ...adapted } });
        }
      }
      return Response.json({ ok: true, saved: false, plan: adapted });
    }

    const plan = runPlanner(date, effectiveCheckin, allExercises, prefs, allTemplates, completed_exercise_ids, bodyProfile, resolvedCycleContext, pregnancyContext, bonus_session, progressionState, isPro, cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7, crossRunsLast7, militaryTemplateItems, runPrograms, {
      forceAssessment: !!force_assessment,
      pinnedIds: hasPins ? pinned_exercise_ids.map(String) : [],
    });

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
            generated_by = excluded.generated_by,
            engine_version = excluded.engine_version,
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
function computeSportBiasedTargets(baseTargets, sportPrefs, weeklyRunCount, weeklyRideCount, dcpBias) {
  const sports = sportPrefs?.sports ?? [];
  const knownSports = sports.filter(s => SPORT_DEMAND[s]);
  // A DCP bias is a standing requirement like a sport: no end date, shapes what
  // the planner aims for rather than prescribing a programme. It therefore runs
  // through the same path, and can apply with no sports selected at all.
  if (!knownSports.length && !dcpBias) return { targets: baseTargets, biasTrace: null };

  const primary = (sportPrefs?.primary && SPORT_DEMAND[sportPrefs.primary]) ? sportPrefs.primary : knownSports[0];
  const others  = knownSports.filter(s => s !== primary);
  const otherW  = others.length > 0 ? 0.4 / others.length : 0;

  // Build weighted sport vector. With no sport at all — the DCP-bias-only path
  // this function explicitly admits above — the vector is neutral (0.5 on every
  // axis, i.e. no sport nudge) and only the DCP lift below applies. Indexing
  // SPORT_DEMAND[undefined] here was a live 500 for any user with a progression
  // row, the DCP switch on, and no sport selected.
  const vec = {};
  SPORT_AXES.forEach(ax => {
    vec[ax] = primary ? (SPORT_DEMAND[primary][ax] ?? 0.5) * 0.6 : 0.5;
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
    let nudge = Math.round((sportVal - 0.5) * 24);

    // ── DCP bias (C-F13) ──
    // Lifts only the two axes the test measures, and only while below +20%.
    // dcpBiasStrength returns 0 once the floor is cleared, so this gets out of
    // the way rather than turning general training into permanent DCP prep.
    if (dcpBias && (ax === 'push' || ax === 'core')) {
      const strength = ax === 'push' ? dcpBias.push : dcpBias.core;
      nudge += Math.round(strength * 16);
    }

    const base  = baseTargets[ax] ?? 50;
    adjustedTargets[ax] = Math.min(90, Math.max(30, base + nudge));
    adjustments[ax] = adjustedTargets[ax] - base;
  });

  return {
    targets: adjustedTargets,
    biasTrace: { primary, sports: knownSports, adjustments, guardrailApplied, guardrailFactor, weeklyCount,
                 dcp: dcpBias ? { push: dcpBias.push, core: dcpBias.core } : null },
  };
}

const PROG_AXIS_CATEGORY = {
  push: 'strength', pull: 'strength', legs: 'strength',
  core: 'strength', conditioning: 'cardio', mobility: 'mobility',
};

export function progGetExerciseAxis(exercise) {
  // Category decides for cardio. A run lists quads/hamstrings/calves because
  // that is what moves, but what it TRAINS is conditioning; taking the first
  // muscle routed easy-run-outdoor to Legs and left the Cardio axis untouched
  // by every run that carried muscle data. Muscles refine within strength only.
  if (exercise.category === 'cardio') return 'conditioning';
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

// Equipment available when gym_today is true.
//
// A gym is a SUPERSET of home, not a different place. This list was neither:
// it omitted rucksack, chair, resistance_bands, foam_roller and the two bike
// aliases, so ticking "at the gym" *dropped* 52 exercises while adding one.
// It also said `resistance_band` (singular) while every exercise in the library
// says `resistance_bands`, so band work was excluded at the gym specifically.
//
// Anything a user can own at home is therefore included, plus the gym-only
// vocabulary. Keep this in step with ALL_EQUIPMENT in appConstants.js.
const HOME_EQUIPMENT = ['none','dumbbell','resistance_bands','pull_up_bar','kettlebell',
  'chair','foam_roller','yoga_mat','jump_rope','stability_ball',
  'adjustable_bench','ankle_weights','push_up_handles','medicine_ball','suspension_trainer',
  'step_platform','power_tower','punching_bag','rucksack','trail_shoes','running_shoes',
  'fitness_tracker','treadmill','exercise_bike','indoor_bike','rowing_machine','elliptical',
  'road_bike','mountain_bike','outdoor_bike','stationary_bike','barbell','weight_plates',
  'squat_rack','smith_machine'];

// Gym-only additions: the machines and racks a commercial gym has and a home
// usually does not. Seeding exercises against these is roadmap X-38.
const GYM_ONLY_EQUIPMENT = ['cable','machine','bench','bench_press_rack','multi_gym',
  'leg_press','lat_pulldown','chest_press_machine','leg_curl_machine','leg_extension_machine',
  'seated_row_machine','pec_deck','hack_squat','preacher_bench','dip_station','ez_bar',
  'trap_bar','sled','battle_ropes','assault_bike','ski_erg'];

const GYM_EQUIPMENT = [...HOME_EQUIPMENT, ...GYM_ONLY_EQUIPMENT];

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
// W3.1 — long continuous cardio, as a PROPERTY of the exercise
//
// The question R555 means is "is this a long continuous effort this athlete is
// not conditioned for?", not "is this tagged running?". Since migration 0112
// every timed exercise has a real base_duration_sec, so it is answerable from
// data. Intervals, warm-ups and session phases are structured, not continuous.
// ---------------------------------------------------------------------------
export const LONG_CARDIO_SEC = 600;

export function longCardioSec(ex) {
  let m = {};
  try { m = JSON.parse(ex?.metrics_json || '{}'); } catch { /* unknown length */ }
  return m.base_duration_sec ?? 0;
}

export function isLongContinuousCardio(ex) {
  return ex?.category === 'cardio'
    && !hasTags(ex, 'session_phase', 'run_warmup', 'intervals', 'run_interval', 'hiit')
    && longCardioSec(ex) >= LONG_CARDIO_SEC;
}

/**
 * The longest continuous cardio effort (seconds) this athlete is conditioned for.
 *
 * Conditioning bands follow the run-interval levels R555 already uses, so the
 * same score means the same thing in both places. BMI caps weight-bearing
 * impact only: a 30-minute bike ride is not what R545/R546 protect against, a
 * 30-minute run is. With no progression row the score is 15 (the R555 default):
 * an unmeasured athlete is treated as deconditioned, which is Principle 3.
 */
export function continuousCardioCapSec(condScore, bmi, ex) {
  const c = condScore ?? 15;
  let capMin = c < T.RUN_LEVEL_2 ? 10
    : c < T.RUN_LEVEL_3 ? 15
    : c < T.RUN_LEVEL_4 ? 20
    : c < T.RUN_LEVEL_5 ? 30
    : c < T.RUN_LEVEL_6 ? 45
    : Infinity;
  // No measurement at all is not the same as a measured 15. The 15 default is
  // shared with R555's run-interval levels and must stay, but a brand-new user
  // losing a 20-minute easy ride on day one was judged too cautious (decided
  // 2026-10-04): the unmeasured case alone is allowed 20 minutes. A MEASURED
  // deconditioned athlete keeps the 10-minute band — that number is earned.
  if (condScore == null) capMin = Math.max(capMin, 20);
  const weightBearingImpact = !hasTags(ex, 'low_impact');
  if (bmi != null && weightBearingImpact) {
    if (bmi >= T.BMI_STRICT) capMin = Math.min(capMin, 0);
    else if (bmi >= T.BMI_MODERATE) capMin = Math.min(capMin, 10);
  }
  return capMin * 60;
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

// W2.3 — every rule that moves ctx.volumeMultiplier records WHY, so the one
// accumulated volume sentence (R519) can name the real reasons instead of
// listing four multipliers the user cannot act on. Keys only: the Dutch wording
// lives in i18n.js, keyed through VOLUME_REASON_TEXT in messagePolicy.js.
function _volumeReason(ctx, key) {
  if (!ctx.volumeReasons.includes(key)) ctx.volumeReasons.push(key);
}

// ── W3.0 — pool guards: a filter, once applied, cannot be lost ─────────────────
//
// Six rules (R518, R535, R540 in every postnatal phase, R545's top-up, R561's
// fallback, R564) used to REBUILD the pool from the unfiltered `exercises`
// array after R515/R516/R563/R596 had narrowed it, so the narrowing was simply
// discarded. A postnatal-rebuilding athlete with no equipment was prescribed
// band and pull-up-bar work; a caesarean-recovery session got a rucksack-loaded
// Defence lift test; "at the gym today" undid R596 for everyone.
//
// Patching six call sites would leave the seventh to whoever writes it next. So
// every narrowing filter REGISTERS its predicate here instead of only filtering:
//
//   _poolGuard(ctx, key, code, keep)   register + narrow ctx.pool
//   _safePool(ctx, candidates)         any rebuild goes through this; it
//                                      re-applies every guard registered so far
//
// A rule may still legitimately redefine a guard — R518 replaces the equipment
// guard with the location's kit, which is the whole point of a location — but it
// replaces it under the same key, so nothing else it re-derives can leak. The
// last line of defence is _enforcePoolGuards() at the end of assembly: any step
// that is not a coach prescription and violates a SAFETY guard is removed and a
// `WARN pool-guard backstop` line is traced. The behavioural matrix fails on
// that line, so a rebuild that forgets _safePool is caught in CI while the user
// is still protected in production.
//
// `safety: false` marks pool-composition guards (warm-up/session-phase rows,
// bonus dedup). They shape rebuilt pools but are not enforced on prescriptions:
// a run coach's warm-up IS a session_phase row.
//
// W4.1 — `override` says what the guard means when the USER authors the session
// (the advisory pass, _adviseSteps). The same recorded guards are evaluated —
// there is no second list of safety checks — but a user-authored session is the
// user's prescription, so a guard is only ever reported, never applied:
//   'advise' (default) — a contraindication: an amber note on the step.
//   'block'            — a genuine clearance question (R539, pregnancy hard
//                        contraindications): saving needs an explicit ack.
//   'ignore'           — a circumstance the user is the authority on (kit,
//                        clothing, location, recovery mode, civilian scope).
//                        "My circumstances differ from my profile" is the
//                        whole point of authoring a session, so no note.
// `blockCode` lets a blocking guard name the clearance rule it stands for
// (the postnatal phase guards report R539 while clearance is unconfirmed).
function _poolGuard(ctx, key, code, keep, { safety = true, override = 'advise', blockCode = null } = {}) {
  ctx.poolGuards.set(key, { code, keep, safety, override, blockCode });
  ctx.pool = ctx.pool.filter(keep);
}

function _failedGuard(ctx, ex, safetyOnly = false) {
  for (const [key, g] of ctx.poolGuards) {
    if (safetyOnly && !g.safety) continue;
    if (!g.keep(ex)) return { key, code: g.code };
  }
  return null;
}

function _passesGuards(ctx, ex) {
  return !!ex && !_failedGuard(ctx, ex);
}

function _safePool(ctx, candidates) {
  return candidates.filter(ex => !_failedGuard(ctx, ex));
}

// W4.1 — evaluate-only. Every recorded SAFETY guard is run against each step and
// every violation is collected; nothing is filtered, dropped or rescaled. The
// guards are the ones the engine itself registered for this athlete today, so a
// rule added to the engine is advised on in user-authored sessions for free.
function _adviseSteps(ctx, steps) {
  const byId = new Map(ctx.exercises.map(e => [e.id, e]));
  const notes = [];
  steps.forEach((step, i) => {
    const ex = byId.get(step.exercise_id);
    if (!ex) return;
    for (const [key, g] of ctx.poolGuards) {
      if (!g.safety || g.override === 'ignore') continue;
      if (g.keep(ex)) continue;
      const blocking = g.override === 'block';
      notes.push({
        step_index: i,
        exercise_id: ex.id,
        exercise_slug: ex.slug,
        code: blocking && g.blockCode ? g.blockCode : g.code,
        guard: key,
        blocking,
      });
    }
  });
  return notes;
}

const _parseArr = (s, dflt = '[]') => { try { return JSON.parse(s || dflt); } catch { return JSON.parse(dflt); } };
const _equipOf = (ex) => _parseArr(ex?.equipment_required_json, '["none"]');
const ALWAYS_AVAILABLE_EQUIP = new Set(['none', 'chair']);

// The backstop. Steps that come from a coach blueprint are prescriptions, not
// pool picks, and are exempt — a run coach's warm-up, a Cooper test, the R574
// march and a military DB template are chosen deliberately by their own rules.
function _enforcePoolGuards(ctx, steps, prescribedIds) {
  const byId = new Map(ctx.exercises.map(e => [e.id, e]));
  return steps.filter(step => {
    if (prescribedIds.has(step.exercise_id)) return true;
    const ex = byId.get(step.exercise_id);
    if (!ex) return true;                                  // synthetic step (cycling coach)
    const hit = _failedGuard(ctx, ex, true);
    if (!hit) return true;
    ctx.trace.push(`WARN pool-guard backstop — ${ex.slug} removed: violates ${hit.code} (${hit.key}) — a rule rebuilt the pool without _safePool`);
    return false;
  });
}

// ── Stage 1: Initialize ───────────────────────────────────────────────────────
function _initPlannerContext(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
  cycleContext, pregnancyContext, bonusSession, progressionState, isPro,
  cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7,
  crossRunsLast7, militaryTemplateItems, runPrograms, opts = {}) {

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

  // Pool-composition guards (W3.0): never offered as a pool pick, and every
  // later rebuild re-applies them through _safePool.
  const poolGuards = new Map();
  poolGuards.set('composition', {
    code: 'init', safety: false,
    keep: (ex) => { const t = _parseArr(ex.tags_json); return !t.includes(RUN_WARMUP_TAG) && !t.includes('session_phase'); },
  });
  if (completedIds?.length) {
    const doneSet = new Set(completedIds);
    poolGuards.set('bonus_dedup', { code: 'init', safety: false, keep: (ex) => !doneSet.has(ex.id) });
    trace.push(`Bonus dedup — excluded ${completedIds.length} completed exercise(s)`);
  }
  let pool = exercises.filter(ex => [...poolGuards.values()].every(g => g.keep(ex)));

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

    blockedWeekdays: new Set(prefs?.preferences?.blocked_weekdays ?? []),

    pool, poolGuards, intensity, slot_type: 'main',
    volumeMultiplier: 1.0,
    // W3.2 — the whole multiplicative stack (R512 × R502 × volumeMultiplier ×
    // R524) never prescribes less than half of baseline. A very light day is a
    // coaching decision; a silent quarter-session is not. When it clamps, R519
    // says so.
    volumeFloor: 0.5,
    volumeReasons: [],
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
    appendedIds: new Set(),   // steps a rule added and traced (R525, R534/R541, R561)
    forceAssessment: !!opts.forceAssessment,
    dcpMeasure: null,
    // W4.4 — pin + fill: ids the user pinned, the ones safety removed, the ones kept.
    pinnedIds: Array.isArray(opts.pinnedIds) ? opts.pinnedIds.slice(0, 3) : [],
    pinsRemoved: [],
    pinnedKept: new Set(),
    selection: null,
    shuffled: null,
    targetCategory: null,
  };
}


// ── Movement family, for R597 ────────────────────────────────────────────────
//
// Three variants of one movement is not a session. The library has no family
// column and the two signals that look like one both fail: alternatives_json
// covers 29% and is asymmetric, and primary_muscles is empty on all 70 military
// cardio entries while push-up and knee-push-up differ by a single muscle.
//
// The slug carries it reliably. Strip digits, units, rep-schemes and the
// qualifiers that mark a variant rather than a different movement, and what is
// left is the movement itself: push-up / knee-push-up / incline-push-up / wall-
// push-up all reduce to "push+up", and the 15 marsen-* entries to "marsen".
// Across the live library this yields 403 families, only 21 with more than one
// member — it groups the duplicates without collapsing distinct work.
// Units, loads and rep-schemes say how much, never what movement.
const _FAMILY_NOISE = new Set([
  'km', 'u', 'kg', 'minuten', 'minuut', 'min', 'sec', 'seconden', 'meter', 'zone',
  'rugzak', 'level', 'x',
]);

export function movementFamily(slug) {
  const toks = String(slug ?? '').toLowerCase().split(/[-_]/).filter(t => t
    && !/^\d+$/.test(t)
    && !/^\d+x\d+$/.test(t)
    && !/^\d+[a-z]+$/.test(t)
    && !_FAMILY_NOISE.has(t));
  if (!toks.length) return String(slug ?? '');
  // The movement is the TRAILING noun; everything before it is a qualifier.
  // A stop-list of qualifiers cannot keep up — it grouped the push-up variants
  // and silently missed bent-knee-sit-up and anchored-sit-up, which is how three
  // sit-ups reached one session. Taking the last two tokens needs no list and
  // reaches the same answer: 323 families across the live library, 54 with more
  // than one member, with burpee/squat and interval/continuous runs still apart.
  return toks.slice(-2).sort().join('+');
}

/**
 * R597 — take `count` exercises, at most one per movement family.
 *
 * Walks in order, so every upstream priority (R551 gap axis, R590 fatigue,
 * R593 DCP) is preserved — this only skips a candidate whose family is already
 * represented. If the varied pass cannot fill the session it relaxes and takes
 * the remainder in order, because a short session beats a blocked one.
 */
function _takeVaried(list, count, ctx, keepIds = null) {
  const seen = new Set();
  const out = [], spare = [];
  for (const ex of list) {
    if (out.length >= count) break;
    const fam = movementFamily(ex.slug);
    // W4.4 — a pinned row is the user's explicit choice: it is always taken and
    // claims its family, so the fill around it stays varied.
    if (keepIds?.has(ex.id)) { seen.add(fam); out.push(ex); continue; }
    if (seen.has(fam)) { spare.push(ex); continue; }
    seen.add(fam);
    out.push(ex);
  }
  const skipped = spare.length;
  if (out.length < count && spare.length) {
    out.push(...spare.slice(0, count - out.length));
  }
  if (skipped > 0 && ctx?.trace) {
    const filled = out.length;
    ctx.trace.push(`R597 — variety: ${skipped} same-family duplicate(s) skipped, ${filled} exercise(s) selected`);
  }
  return out;
}

// ── Stage 2: Safety policies ──────────────────────────────────────────────────
function _applySafetyPolicies(ctx) {
  const { checkIn, exercises, prefs, date, pregnancyContext, bmi, expLevel } = ctx;

  // R999 — Preferred rest day (blocked_weekdays)
  if (!ctx.bonusSession && ctx.blockedWeekdays.size > 0) {
    const dow = new Date(date + 'T12:00:00Z').getDay(); // 0=Sun…6=Sat
    if (ctx.blockedWeekdays.has(dow)) {
      ctx.slot_type = 'rest';
      ctx.trace.push(`R999 — Preferred rest day (weekday ${dow} blocked) → rest session`);
    }
  }
  const _primaryIntent0 = prefs?.preferences?.primary_intent ?? null;
  const isMilCoachActive = !!(prefs?.preferences?.military_coach?.active)
    && (_primaryIntent0 === null || _primaryIntent0 === 'military');

  // R596 — C-F16: military protocol work does not belong in a civilian session.
  //
  // 102 exercises carry the `military` tag, but the tag alone is the wrong
  // discriminator: push-up, plank, squat, lunge and sit-up carry it too, and
  // excluding those would gut the general library. The real split is protocol vs
  // movement. A rucksack march, a zone-paced run, the Cooper test and the
  // lift/carry/dig tests are prescriptions owned by the Defence programme; a
  // push-up is just a push-up.
  //
  // So: drop military-tagged cardio and skill tests, plus anything needing a
  // rucksack or carrying a fixed, name-declared prescription. 76 exercises go,
  // 26 general strength movements stay, and 35 no-equipment cardio options
  // remain for a civilian user, so the pool cannot starve.
  //
  // This is why a fat_loss user with primary_intent=general and no equipment was
  // handed a session of three rucksack marches: nothing filtered military OUT.
  // R572 filters the pool TO military for military sessions, which is the
  // mirror case and stays untouched.
  if (!isMilCoachActive && ctx.slot_type !== 'rest') {
    //
    // W3.4 — the `protocol` tag (seeded by Wave 5, migration 0116) is the data
    // answer and wins wherever it is present. The heuristic below stays as the
    // fallback for any row the tag does not cover; the two are OR-ed, so a tag
    // can only ever remove more, never re-admit what the heuristic caught.
    //
    // The heuristic gained one leg for `optillen-vanaf-de-grond`, the Defence
    // lift test that leaked: typed strength, no kit, no fixed_duration — it looked
    // like a movement. What sets it apart is that it is TIMED and neither a
    // bodyweight exercise nor loaded with anything the library can name: the
    // load is the test's own apparatus. Plank and flutter kicks are timed too,
    // but they are bodyweight; deadlift is unbodyweight but needs a barbell.
    // This is still inference, which is why the tag is preferred.
    const isProtocol = (ex) => {
      const tags = JSON.parse(ex.tags_json || '[]');
      if (tags.includes('protocol')) return true;
      if (!tags.includes('military')) return false;
      if (ex.category === 'cardio' || ex.category === 'skill') return true;
      const equip = JSON.parse(ex.equipment_required_json || '[]');
      if (equip.includes('rucksack')) return true;
      let m = {};
      try { m = JSON.parse(ex.metrics_json || '{}'); } catch { /* not fixed */ }
      if (m.fixed_duration) return true;
      const timedOnly = (m.supports ?? []).includes('time') && !(m.supports ?? []).includes('reps');
      const unloaded  = equip.every(e => ALWAYS_AVAILABLE_EQUIP.has(e));
      if (timedOnly && unloaded && !tags.includes('bodyweight')) return true;
      return false;
    };
    const before = ctx.pool.length;
    const civilian = ctx.pool.filter(ex => !isProtocol(ex));
    if (civilian.length >= 3) {
      _poolGuard(ctx, 'civilian', 'R596', (ex) => !isProtocol(ex), { override: 'ignore' });
      const removed = before - civilian.length;
      if (removed > 0) ctx.trace.push(`R596 — ${removed} Defensie-protocoloefening(en) buiten beschouwing gelaten (geen militaire coach actief)`);
    }
  }

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
    _volumeReason(ctx, 'sleep');
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
      _volumeReason(ctx, 'return');
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
      _poolGuard(ctx, 'injury', 'R563', (ex) => {
        const tags = JSON.parse(ex.tags_json || '[]');
        return !forbiddenTags.some(ft => tags.includes(ft));
      });
      ctx.trace.push(`R563 — Injury filter [${injuryAreas.join(',')}]: ${before} → ${ctx.pool.length} exercises`);
    }
    if (ctx.pool.length < 3) {
      // W3.0 — the top-up re-applies every guard so far (R596 included), not just
      // the injury tags; it used to read the unfiltered library.
      const present = new Set(ctx.pool.map(e => e.id));
      const safePool = _safePool(ctx, exercises).filter(ex => {
        if (present.has(ex.id)) return false;
        const tags = JSON.parse(ex.tags_json || '[]');
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
    _poolGuard(ctx, 'recovery_mode', 'R559', (ex) => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('mobility') || tags.includes('recovery') || ex.category === 'mobility' || ex.category === 'recovery';
    }, { override: 'ignore' });
    ctx.trace.push('R559 — Recovery mode → low intensity, mobility/recovery pool');
  }

  // R515
  if (checkIn?.no_clothing) {
    _poolGuard(ctx, 'clothing', 'R515', (ex) => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
    }, { override: 'ignore' });
    ctx.trace.push(`R515 — No clothing → stealth filter (${ctx.pool.length} exercises remain)`);
  }

  // R516
  const ALWAYS_AVAILABLE = ALWAYS_AVAILABLE_EQUIP;
  if (ctx.forceBodyweight || ctx.profileBodyweightOnly) {
    _poolGuard(ctx, 'equipment', 'R516', (ex) => _equipOf(ex).every(e => ALWAYS_AVAILABLE.has(e)), { override: 'ignore' });
    const reason = ctx.forceBodyweight ? 'checkin no_gear/traveling' : 'profile equipment=none';
    ctx.trace.push(`R516 — Bodyweight only (${reason}) → ${ctx.pool.length} exercises remain`);
  } else {
    _poolGuard(ctx, 'equipment', 'R516', (ex) => _equipOf(ex).every(e => ALWAYS_AVAILABLE.has(e) || ctx.effectiveEquip.includes(e)), { override: 'ignore' });
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

  // R518 — resolve the exercise pool from the athlete's training location.
  //
  // C-F9: this used to be a single boolean asked fresh every day, which could not
  // express a hotel gym, a partly equipped garage, or a bench at home plus a
  // membership. It now resolves a named profile. `gym_today` is still accepted and
  // maps to the gym profile, because an offline-cached client will keep sending it.
  //
  // The home profile deliberately has no equipment list of its own — it reads
  // available_equipment, so the existing Settings editor stays the single place kit
  // is managed and the two can never disagree.
  const _profileId = checkIn?.equipment_profile_id ?? (checkIn?.gym_today ? 'gym' : null);
  if (_profileId) {
    const _profiles = prefs?.preferences?.equipment_profiles ?? [];
    const _profile  = _profiles.find(p => p.id === _profileId) ?? null;
    let _equip;
    if (_profileId === 'home') {
      _equip = prefs?.preferences?.available_equipment ?? ['none'];
      if (!_equip.includes('none')) _equip = [..._equip, 'none'];
    } else if (_profile?.equipment?.length) {
      _equip = _profile.equipment.includes('none') ? _profile.equipment : [..._profile.equipment, 'none'];
    } else if (_profileId === 'gym') {
      _equip = GYM_EQUIPMENT;                    // seeded default when never customised
    } else if (_profileId === 'travel') {
      _equip = ['none', 'running_shoes', 'resistance_bands'];
    } else {
      _equip = null;                             // unknown profile → leave pool alone
    }

    if (_equip) {
      const _before = ctx.pool.length;
      // W3.0 — a location legitimately REDEFINES the equipment guard (that is what
      // a location is), so it replaces it under the same key and re-derives the
      // pool through _safePool. Every other guard — R596, R563, R559, R515 — is
      // re-applied with it. This used to read the raw library, which undid R596
      // for anyone who ticked "at the gym today". no_gear/traveling still wins
      // over the location: today's kit is bodyweight whatever the profile says.
      const _prevEquipGuard = ctx.poolGuards.get('equipment');
      const _locKeep = (ex) => {
        const eq = _equipOf(ex);
        if (ctx.forceBodyweight) return eq.every(e => ALWAYS_AVAILABLE.has(e));
        return eq.every(e => _equip.includes(e));
      };
      ctx.poolGuards.set('equipment', { code: 'R518', keep: _locKeep, safety: true, override: 'ignore' });
      const _next = _safePool(ctx, exercises);
      // A profile must never leave the athlete with nothing. If a custom kit is too
      // narrow to build a session, keep the previous pool and say so — the same
      // failure mode that once made "at the gym" drop 52 exercises and add one.
      if (_next.length >= 3) {
        ctx.pool = _next;
        ctx.trace.push(`R518 — Location "${_profile?.name ?? _profileId}" → ${ctx.pool.length} exercises available (was ${_before})`);
      } else {
        if (_prevEquipGuard) ctx.poolGuards.set('equipment', _prevEquipGuard);
        else ctx.poolGuards.delete('equipment');
        ctx.trace.push(`R518 — Location "${_profile?.name ?? _profileId}" resolves only ${_next.length} exercises — keeping the wider pool of ${_before}`);
        _addNote(ctx, 'Je uitrusting voor deze locatie is te beperkt voor een volledige sessie — de planner gebruikt je volledige oefeningenlijst.');
      }
    }
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
      _poolGuard(ctx, 'bmi_running', 'R545', (ex) => !isRunningEx(ex));
      if (!ctx.pool.some(ex => ex.category === 'cardio')) {
        // W3.0 — the low-impact top-up honours every guard (kit, injury, R596).
        const lowImpact = _safePool(ctx, exercises).filter(ex =>
          ex.category === 'cardio' &&
          JSON.parse(ex.tags_json || '[]').includes('low_impact')
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
      _volumeReason(ctx, 'cycle');
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
    // Registered as guards (W3.0), so R534's pelvic-floor injection, R535's
    // nausea pool and every later rebuild honour them by rule, not by row order.
    if (week >= T.PREGNANCY_SUPINE_WEEK) {
      _poolGuard(ctx, 'pregnancy_supine', 'R531', (ex) => !hasTags(ex, 'supine'));
      ctx.trace.push(`R531 — Week ${week}: supine exercises filtered out`);
    }
    // R532/R533-absolute are the pregnancy HARD contraindications: a user-authored
    // session containing them needs an explicit acknowledgement (W4.1).
    _poolGuard(ctx, 'pregnancy_impact', 'R532', (ex) => !hasTags(ex, 'high_impact'), { override: 'block' });
    ctx.trace.push('R532 — High-impact exercises excluded during pregnancy');
    _poolGuard(ctx, 'pregnancy_absolute', 'R533', (ex) => !hasTags(ex, 'valsalva', 'inversion', 'crunch'), { override: 'block' });
    if (trimester >= 2) {
      _poolGuard(ctx, 'pregnancy_prone', 'R533', (ex) => !hasTags(ex, 'prone'));
      ctx.trace.push('R533 — T2+: prone exercises excluded');
    }
    ctx.trace.push('R533 — Absolute exclusions: valsalva, inversion, crunch');
    if (nauseaToday) {
      ctx.slot_type = 'micro';
      const nauseaPool = _safePool(ctx, exercises).filter(ex => hasTags(ex, 'breathing', 'recovery') && !hasTags(ex, 'high_impact', 'supine'));
      if (nauseaPool.length) ctx.pool = nauseaPool;
      _addNote(ctx, 'Gentle movement only today. Listen to your body — rest is always the right choice.');
      ctx.trace.push('R535 — Nausea today → breathing/recovery focus');
    }
    if (trimester === 3 && breathlessToday) {
      // W3.4 — a de-load takes the lower of the two, never assigns: assigning
      // 0.8 over an existing 0.75 (R558) would RAISE volume on a worse day.
      ctx.volumeMultiplier = Math.min(ctx.volumeMultiplier, 0.8);
      _volumeReason(ctx, 'breathlessness');
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

    // W3.0 — each phase DEFINES its pool, so it rebuilds; but it rebuilds through
    // _safePool, so the athlete's kit, injuries and R596 still hold. The phase
    // predicate is then registered as a guard of its own, so nothing appended
    // later (R534/R541, R525, R561) can step outside the phase either.
    // W4.1 — while clearance is unconfirmed (R539) every postnatal guard is a
    // clearance question, so a user-authored session that crosses one needs an
    // explicit acknowledgement; once cleared they are advisory.
    const _pnOverride = postnatalCleared
      ? { override: 'advise' }
      : { override: 'block', blockCode: 'R539' };
    const _phaseRebuild = (keep) => {
      ctx.poolGuards.set('postnatal_phase', { code: 'R540', keep, safety: true, ..._pnOverride });
      ctx.pool = _safePool(ctx, exercises);
    };
    if (postnatalPhase === 'immediate') {
      _phaseRebuild(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'));
      ctx.intensity = 'low';
      ctx.slot_type = ctx.pool.length ? ctx.slot_type : 'rest';
      ctx.trace.push('R540 — Immediate phase: pelvic floor, breathing, recovery only');
    } else if (postnatalPhase === 'early') {
      _phaseRebuild(ex =>
        hasTags(ex, 'pelvic_floor', 'breathing', 'recovery') ||
        (ex.category === 'mobility' && hasTags(ex, 'low_impact') && !hasTags(ex, 'high_impact'))
      );
      ctx.intensity = 'low';
      ctx.trace.push('R540 — Early phase: pelvic floor, breathing, light mobility');
    } else if (postnatalPhase === 'rebuilding') {
      _phaseRebuild(ex => {
        if (hasTags(ex, 'high_impact', 'crunch', 'valsalva')) return false;
        if (hasTags(ex, 'dumbbell') && !hasTags(ex, 'pelvic_floor')) return false;
        return true;
      });
      if (isCaesarean) {
        _poolGuard(ctx, 'postnatal_prone', 'R542', (ex) => !hasTags(ex, 'prone'), _pnOverride);
        ctx.trace.push('R542 — Caesarean: prone exercises excluded in rebuilding phase');
      }
      _addNote(ctx, 'Check for abdominal separation (diastasis recti) if you haven\'t already — speak to your physiotherapist.');
      ctx.trace.push('R540 — Rebuilding phase: bodyweight only, no crunch/high-impact');
      ctx.trace.push('R543 — Diastasis recti check reminder added');
    } else if (postnatalPhase === 'strengthening') {
      _phaseRebuild(ex => !hasTags(ex, 'high_impact', 'crunch', 'valsalva'));
      ctx.trace.push('R540 — Strengthening phase: dumbbells introduced, high-impact excluded');
    } else {
      _phaseRebuild(ex => !hasTags(ex, 'valsalva'));
      const runningToday = checkIn?.postnatal_signals?.running_today ?? false;
      if (runningToday) {
        _addNote(ctx, 'Running clearance: ensure you\'ve completed a pelvic floor physio assessment before returning to running.');
        ctx.trace.push('R544 — Running clearance note added');
      }
      ctx.trace.push('R540 — Returning phase: full programme, no valsalva');
    }

    if (isCaesarean && (postnatalPhase === 'immediate' || postnatalPhase === 'early')) {
      _poolGuard(ctx, 'postnatal_supine', 'R540', (ex) => !hasTags(ex, 'supine'), _pnOverride);
    }
    if (!ctx.pool.length) ctx.pool = _safePool(ctx, exercises).filter(ex => hasTags(ex, 'pelvic_floor', 'breathing'));
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

  // R555 — safe running build-up.
  //
  // Runs unconditionally, not only when the user owns running shoes. The military
  // `hardlopen-*` set and `12-minuten-loop` declare equipment_required=["none"], so
  // they reach users with no running shoes and were never filtered. See
  // isRunVolumeExercise() in _shared/running.js for why identification is structural.
  //
  // W3.1 — two questions, kept apart:
  //   1. isRunVolumeExercise: "is this ungraded running?" — answered only so
  //      exactly one run-interval-level-N can be swapped in for it.
  //   2. isLongContinuousCardio + continuousCardioCapSec: "is this a long
  //      continuous effort this athlete is not conditioned for?" — answered from
  //      the exercise's real duration (migration 0112), the athlete's measured
  //      conditioning and BMI, whatever the exercise is called. The marches got
  //      through the old guard because they were not tagged `running`;
  //      treadmill-run-steady still did, because it needs a treadmill rather than
  //      running shoes and carries no `running` tag.
  // Both are registered as one guard, so no later rebuild can re-admit either.
  {
    // condMeasured is the raw reading (undefined when there is no progression
    // row); condScore is the R555 working value with its 15 default. The cardio
    // cap needs the former — "never measured" is a different fact from "measured 15".
    const condMeasured = ctx.progressionState?.scores?.conditioning?.endurance;
    const condScore = condMeasured ?? 15;
    let runLevel = null;
    let intervalEx = null;
    if (hasRunningShoes) {
      // Re-admit exactly one run: the level the user's conditioning supports —
      // provided it passes every guard so far (an injured knee, R545, the kit).
      runLevel = condScore < T.RUN_LEVEL_2 ? 1
        : condScore < T.RUN_LEVEL_3 ? 2
        : condScore < T.RUN_LEVEL_4 ? 3
        : condScore < T.RUN_LEVEL_5 ? 4
        : condScore < T.RUN_LEVEL_6 ? 5 : 6;
      const cand = exercises.find(ex => ex.slug === `run-interval-level-${runLevel}`);
      if (cand && _passesGuards(ctx, cand)) intervalEx = cand;
    }
    const before = ctx.pool.length;
    const runsBefore = ctx.pool.filter(ex => isRunVolumeExercise(ex)).length;
    const overBand = (ex) => isLongContinuousCardio(ex)
      && longCardioSec(ex) > continuousCardioCapSec(condMeasured, ctx.bmi, ex);
    _poolGuard(ctx, 'continuous_cardio', 'R555', (ex) =>
      (intervalEx && ex.id === intervalEx.id) || (!isRunVolumeExercise(ex) && !overBand(ex)));
    const removed = before - ctx.pool.length;
    const longRemoved = removed - runsBefore;

    if (intervalEx) {
      if (!ctx.pool.some(ex => ex.id === intervalEx.id)) ctx.pool = [intervalEx, ...ctx.pool];
      ctx.r555PinnedEx = intervalEx;
      ctx.trace.push(`R555 — Safe running: conditioning ${condScore.toFixed(0)} → Level ${runLevel} intervals (${runsBefore} unguarded run${runsBefore === 1 ? '' : 's'} removed)`);
    } else if (runsBefore > 0) {
      ctx.trace.push(`R555 — ${runsBefore} running exercise${runsBefore === 1 ? '' : 's'} removed: ${hasRunningShoes ? 'interval run not safe today' : 'no running shoes in your equipment'}`);
    }
    if (longRemoved > 0) {
      ctx.trace.push(`R555 — ${longRemoved} long continuous cardio effort(s) above your conditioning band removed (conditioning ${condScore.toFixed(0)}${ctx.bmi != null ? `, BMI ${ctx.bmi.toFixed(0)}` : ''})`);
    }
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
    if (milVol !== 1) _volumeReason(ctx, 'programme');
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
          const lungeEx = _safePool(ctx, exercises).find(ex => ex.slug === 'walking-lunge' || ex.slug === 'lunge');
          if (lungeEx) ctx.pool = [lungeEx, ...ctx.pool.filter(ex => ex.id !== lungeEx.id)];
        } else if (prescribedSec > 0) {
          ctx.trace.push(`R574 — March: ${ctx.militaryMarchKg} kg × ${prescribedSec / 60} min (prescribed ${prescribedKg} kg)`);
        }
      }
    }
  }
}

const R574_MARCH_SLUG = 'weighted-march';

// ── Stage 5: Select exercises ─────────────────────────────────────────────────
const DCP_WINDOW_SEC = 120;

/**
 * R598 — is a DCP self-measurement due today, and can it be taken safely?
 *
 * Returns { pushEx, situpEx, lastAt } or null. Shared by the engine (which
 * inserts the two sets) and the user-authored path (W4.1), which only OFFERS
 * them: a session the user wrote is not silently extended. Both read the same
 * predicate and the same _safePool, so "due" can never mean two things.
 */
function _dcpMeasurementDue(ctx) {
  const prefs = ctx.prefs;
  const dcp = prefs?.preferences?.military_coach?.dcp;
  if (!dcpCardVisible(dcp, !!prefs?.preferences?.military_coach?.active)) return null;
  if (ctx.slot_type === 'rest' || !ctx.isStandardMode || ctx.bonusSession) return null;
  const lastAt = dcp.last?.at_ms ?? null;
  const due = ctx.forceAssessment || !lastAt || dcpIsStale(lastAt, ctx.planDateMs);
  if (!due) return null;
  // W3.0 — a measurement is still a set of push-ups: an injured shoulder or a
  // guard from R563 rules it out, and the measurement waits for a safe day.
  const measurable = _safePool(ctx, ctx.exercises);
  const find = (...slugs) => {
    for (const sl of slugs) {
      const hit = measurable.find(ex => ex.slug === sl);
      if (hit) return hit;
    }
    return null;
  };
  const pushEx  = find('push-up', 'knee-push-up', 'wall-push-up');
  const situpEx = find('sit-up', 'bent-knee-sit-up', 'anchored-sit-up');
  return pushEx && situpEx ? { pushEx, situpEx, lastAt } : null;
}

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

  // R595 — C-F16: an exercise cannot be longer than the session it is in.
  //
  // Until migration 0112 every timed exercise looked like 30 seconds, so this
  // could not be checked and a 40-minute march sat happily inside a 30-minute
  // budget. Now that durations are real, a single step that exceeds the whole
  // budget is a straight contradiction between the plan and the user's settings.
  //
  // Drops rather than scales, because the long entries are exactly the ones
  // migration 0112 marked fixed_duration. Never empties the pool: if nothing
  // survives, the budget is smaller than anything available and the shorter-is-
  // better fallback is to keep what we had — same discipline as R518.
  if (ctx.budget && ctx.pool?.length && !ctx.unlimited) {
    const budgetSec = ctx.budget * 60;
    const lenOf = (ex) => {
      let m = {}; try { m = JSON.parse(ex.metrics_json || '{}'); } catch { /* treat as unknown */ }
      const base = m.base_duration_sec;
      if (!base) return 0;                       // unknown length cannot be judged
      return base * (m.fixed_sets ?? 1);
    };
    const fits = ctx.pool.filter(ex => lenOf(ex) <= budgetSec);
    const dropped = ctx.pool.length - fits.length;
    if (dropped > 0 && fits.length >= 3) {
      ctx.pool = fits;
      ctx.trace.push(`R595 — ${dropped} exercise(s) longer than the ${ctx.budget}-min session removed`);
    } else if (dropped > 0) {
      ctx.trace.push(`R595 — ${dropped} over-length exercise(s) kept: nothing shorter is available for a ${ctx.budget}-min session`);
    }
  }

  // Filter + seed-shuffle
  let filtered = ctx.pool.filter(ex => ex.category === targetCategory);
  if (!filtered.length) filtered = ctx.pool;
  if (!filtered.length) {
    // W3.0 — even the last-resort fallback honours every guard. An empty pool
    // after all filters means the honest answer is a short session, not one
    // rebuilt from the raw library past the athlete's injuries and kit.
    filtered = inSpecialMode
      ? _safePool(ctx, exercises).filter(ex => hasTags(ex, 'pelvic_floor', 'breathing', 'recovery'))
      : _safePool(ctx, exercises);
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

    // ── DCP bias (C-F13) — a standing requirement, not a programme ──
    // Separate switch from the sport bias: someone may want one without the other.
    let _dcpBias = null;
    const _dcpB = prefs?.preferences?.military_coach?.dcp;
    if (_dcpB?.enabled && _dcpB?.bias_enabled) {
      const dn = getDcpNorms(ctx.sex ?? prefs?.sex, dcpAgeFrom(_dcpB.birth_year, ctx.planDateMs));
      if (dn) {
        const lastB = _dcpB.last ?? {};
        const pushP  = dcpProgress(lastB.pushups ?? 0, dn.pushups);
        const situpP = dcpProgress(lastB.situps  ?? 0, dn.situps);
        const pushS  = dcpBiasStrength(pushP);
        const coreS  = dcpBiasStrength(situpP);
        // Both clear of the floor → no bias object at all, so nothing downstream
        // has to re-check and the trace stays quiet.
        if (pushS > 0 || coreS > 0) _dcpBias = { push: pushS, core: coreS };
      }
    }

    const { targets, biasTrace } = (!ctx.runProgramOverride && !ctx.cyclingProgramOverride && (sportBiasEnabled || _dcpBias))
      ? computeSportBiasedTargets(baseTargets, _sportPrefs, ctx.runSessionsLast7, ctx.cyclingSessionsLast7, _dcpBias)
      : { targets: baseTargets, biasTrace: null };
    if (biasTrace) {
      const adj = Object.entries(biasTrace.adjustments).filter(([, v]) => v !== 0).map(([ax, v]) => `${ax}${v > 0 ? '+' : ''}${v}`).join(', ');
      if (biasTrace.dcp) {
        ctx.trace.push(`R594 — DCP-bias actief (push ${Math.round(biasTrace.dcp.push * 100)}%, core ${Math.round(biasTrace.dcp.core * 100)}%) — doel +20% boven de norm`);
      }
      const guardrailNote = biasTrace.guardrailApplied
        ? ` [guardrail ×${biasTrace.guardrailFactor} — ${biasTrace.weeklyCount} sport sessions/wk]`
        : '';
      // R560 is a statement about a sport; with none selected the DCP line (R594)
      // above is the whole explanation and "adjusted for undefined" is not one.
      if (biasTrace.primary) {
        ctx.trace.push(`R560 — Sport bias: targets adjusted for ${biasTrace.primary} (${adj || 'no change'})${guardrailNote}`);
      }
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

  // R590 — C-F7: bias selection away from muscles that have not recovered.
  //
  // A soft reorder, never a filter. Removing fatigued exercises outright would
  // empty the pool for anyone training consistently, and on a day when everything
  // is fatigued the right answer is "train the least-fatigued thing", not "train
  // nothing". Only strength work is affected; cardio and mobility are how you
  // train *around* fatigue, not into it.
  //
  // This reorders `shuffled`, NOT ctx.pool. `shuffled` is derived from ctx.pool
  // further up and is what the session is sliced from; anything written to
  // ctx.pool after that point is read by nobody. This rule and R593 both did
  // exactly that and were silently inert — they printed their trace lines and
  // changed nothing. Do not "tidy" these back onto ctx.pool.
  const fatiguedIds = new Set();
  if (shuffled.length && ctx.slot_type !== 'rest') {
    const fatigued = shuffled.filter(ex =>
      ex.muscle_freshness != null && ex.muscle_freshness < FATIGUE_THRESHOLD
      && ex.category !== 'mobility' && ex.category !== 'recovery' && ex.category !== 'cardio');
    if (fatigued.length && fatigued.length < shuffled.length) {
      for (const e of fatigued) fatiguedIds.add(e.id);
      shuffled = [
        ...shuffled.filter(e => !fatiguedIds.has(e.id)),
        ...fatigued.sort((a, b) => (b.muscle_freshness ?? 100) - (a.muscle_freshness ?? 100)),
      ];
      const worst = fatigued.reduce((w, e) => (e.muscle_freshness < (w?.muscle_freshness ?? 101) ? e : w), null);
      ctx.trace.push(`R590 — ${fatigued.length} exercise(s) deprioritised for muscle fatigue (lowest: ${worst?.name} at ${worst?.muscle_freshness}% recovered)`);
      if (worst && worst.muscle_freshness <= 20) {
        _addNote(ctx, 'Sommige spiergroepen zijn nog niet hersteld — de planner kiest vandaag bewust ander werk.');
      }
    }
  }

  // R593 — C-F13: put the two DCP movements in front, when the DCP is actually a target.
  //
  // R594 (the bias) raises the push and core TARGETS, but a raised push target can
  // be satisfied by a dumbbell press — and the DCP measures push-ups and sit-ups,
  // not the pattern in general. Target shaping alone would therefore train the
  // right axis with the wrong movement.
  //
  // Gated on dcpCardVisible, the same predicate the card uses, so the planner can
  // never be steered by a DCP the user has switched off and cannot see. `enabled`
  // alone only records that a baseline exists.
  //
  // Runs AFTER R590 and skips anything R590 marked fatigued: a published standard
  // is still ambition, and Principle 3 puts safety above it. If every candidate is
  // fatigued it promotes nothing and says so, rather than claiming a guarantee it
  // did not deliver.
  const _dcp = prefs?.preferences?.military_coach?.dcp;
  const _dcpIsTarget = dcpCardVisible(_dcp, !!prefs?.preferences?.military_coach?.active);
  if (_dcpIsTarget && shuffled.length && ctx.slot_type !== 'rest' && ctx.isStandardMode) {
    const norms = getDcpNorms(ctx.sex ?? prefs?.sex, dcpAgeFrom(_dcp.birth_year, ctx.planDateMs));
    if (norms) {
      const last = _dcp.last ?? {};
      const push  = dcpProgress(last.pushups ?? 0, norms.pushups);
      const situp = dcpProgress(last.situps  ?? 0, norms.situps);
      // Only the movement(s) still short of +20%. Clear of the floor → leave alone.
      const wantPush  = dcpBiasStrength(push)  > 0;
      const wantSitup = dcpBiasStrength(situp) > 0;

      if (wantPush || wantSitup) {
        const kindOf = (ex) => {
          const slug = ex.slug ?? '';
          if (/push-up/.test(slug)) return 'push';
          if (/sit-up/.test(slug))  return 'situp';
          return null;
        };
        const priority = [], rest = [];
        for (const ex of shuffled) {
          const k = kindOf(ex);
          const wanted = (k === 'push' && wantPush) || (k === 'situp' && wantSitup);
          (wanted && !fatiguedIds.has(ex.id) ? priority : rest).push(ex);
        }
        if (priority.length && priority.length < shuffled.length) {
          // Weaker movement first, so a short session still trains the right one.
          const firstKind = dcpBiasStrength(situp) > dcpBiasStrength(push) ? 'situp' : 'push';
          priority.sort((a, b) => (kindOf(a) === firstKind ? 0 : 1) - (kindOf(b) === firstKind ? 0 : 1));
          shuffled = [...priority, ...rest];
          ctx.trace.push(`R593 — DCP-beweging vooraan: ${firstKind === 'push' ? 'push-ups' : 'sit-ups'} eerst (push ${push.value}/${push.safe}, sit-up ${situp.value}/${situp.safe})`);
          if (push.tier === 'below' || situp.tier === 'below') {
            _addNote(ctx, `DCP-norm nog niet gehaald — ${push.tier === 'below' ? `push-ups ${push.value}/${push.minimum}` : `sit-ups ${situp.value}/${situp.minimum}`}. Deze sessie werkt daar naartoe.`);
          }
        } else if (!priority.length) {
          ctx.trace.push('R593 — DCP-bewegingen overgeslagen: spiergroep nog niet hersteld (R590 gaat voor)');
        }
      }
    }
  }


  // Ordered last on purpose: R593 also reorders push-ups and sit-ups, and it
  // would otherwise front a same-family sibling (anchored-sit-up) ahead of the
  // exact row pinned here. R597 then drops the pinned one as a duplicate and the
  // session measures one movement instead of two. The pin is the more specific
  // instruction, so it goes last and wins.
  // R598 — C-F17: the self-assessment belongs IN the training, not beside it.
  //
  // The DCP numbers drive R593 and R594, and nothing ever wrote them: dcp.last
  // was read in four places and set by no code path, so the card sat at 0/19
  // forever and the bias aimed at a baseline that did not exist. The separate
  // "nulmeting" screen was the intended writer and was both unreachable (it was
  // handed a click event instead of its config) and the wrong shape — a second
  // thing to remember, gated off on exactly the tired days when it is most
  // needed.
  //
  // So it is measured the way it is tested: two max-effort sets inside a normal
  // session. Fires when the DCP is a target in any way AND the last measurement
  // is missing or older than DCP_RETEST_DAYS, or when the user forces it from
  // the Recalibrate button. The 2-minute window is the DCP protocol itself, not
  // an open-ended set to failure — a capped window is what the standard scores.
  {
    const due = _dcpMeasurementDue(ctx);
    if (due) {
      const { pushEx, situpEx, lastAt } = due;
      ctx.dcpMeasure = { pushId: pushEx.id, situpId: situpEx.id, windowSec: DCP_WINDOW_SEC };
      const others = shuffled.filter(ex => ex.id !== pushEx.id && ex.id !== situpEx.id);
      shuffled = [pushEx, situpEx, ...others];
      ctx.trace.push(ctx.forceAssessment
        ? 'R598 — Zelfmeting op verzoek ingepland: max push-ups en sit-ups (2 min per oefening)'
        : `R598 — Zelfmeting ingepland: ${lastAt ? 'laatste meting is verlopen' : 'nog geen nulmeting'} — max push-ups en sit-ups (2 min per oefening)`);
      _addNote(ctx, 'Vandaag meten we je DCP-uitgangspunt: twee sets op maximaal aantal herhalingen in 2 minuten. Stop bij vormverlies, niet bij pijn.');
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

  // W3.4 — R574 owns `weighted-march` on a kracht+marsen day: it appends the
  // real prescription (kg × minutes) after assembly. Selection must not ALSO
  // take it from the pool, or the session carries the same march twice — once
  // as the 15-minute prescription and once volume-scaled to 3 × 51 s, which is
  // exactly the "2 × 18 s rucksack march" that triggered the audit. Reordering
  // `shuffled` is a selection-list edit, not a ctx.pool write (A-F1).
  const r574Appends = ctx.militarySessionType === 'kracht_marsen' && ctx.militaryMarchSec > 0;
  if (r574Appends) shuffled = shuffled.filter(ex => ex.slug !== R574_MARCH_SLUG);

  // W4.4 — pin + fill. The user pinned 1–3 exercises; the engine completes the
  // session around them by its normal rules. A pin is a PREFERENCE, not a safety
  // override: every pinned row passes _safePool like any other pick, and a pin
  // that a guard removes is said out loud (trace + plan.pins_removed) rather
  // than dropped in silence. Pinned rows bypass only the category filter and
  // R597's family skip — that is what pinning means.
  const pinKeep = new Set();
  if (ctx.pinnedIds.length) {
    const byId = new Map(exercises.map(e => [String(e.id), e]));
    const rows = [...new Set(ctx.pinnedIds.map(String))].map(id => byId.get(id)).filter(Boolean);
    const coachOwned = ctx.runProgramOverride || ctx.crossTrainingOverride || ctx.cyclingProgramOverride
      || ctx.militaryProgramOverride || ctx.militaryDbSelection;
    if (ctx.slot_type === 'rest' || coachOwned) {
      for (const ex of rows) ctx.pinsRemoved.push({ exercise_id: ex.id, exercise_slug: ex.slug, code: null, guard: ctx.slot_type === 'rest' ? 'rest_day' : 'coach_programme' });
      ctx.trace.push(`PIN — ${rows.length} vastgezette oefening(en) niet ingepland: ${ctx.slot_type === 'rest' ? 'vandaag is een rustdag' : 'je coachprogramma bepaalt deze sessie'}`);
    } else {
      for (const ex of rows) {
        const hit = _failedGuard(ctx, ex);
        if (hit) {
          ctx.pinsRemoved.push({ exercise_id: ex.id, exercise_slug: ex.slug, code: hit.code, guard: hit.key });
          ctx.trace.push(`PIN — ${ex.slug} niet ingepland: ${hit.code} (${hit.key}) — een vastgezette oefening gaat niet boven veiligheid`);
        } else {
          pinKeep.add(ex.id);
        }
      }
      if (pinKeep.size) {
        const pinned = rows.filter(ex => pinKeep.has(ex.id));
        shuffled = [...pinned, ...shuffled.filter(ex => !pinKeep.has(ex.id))];
        count = Math.max(count, pinKeep.size + (ctx.dcpMeasure ? 2 : 0));
        ctx.trace.push(`PIN — ${pinned.map(ex => ex.slug).join(', ')} vastgezet; de coach vult de sessie aan`);
      }
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
    ? (r574Appends ? ctx.militaryDbSelection.filter(ex => ex.slug !== R574_MARCH_SLUG) : ctx.militaryDbSelection)
    : _takeVaried(shuffled, count, ctx, pinKeep);
  ctx.pinnedKept = pinKeep;

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
        const injPool = _safePool(ctx, exercises).filter(ex =>
          hasTags(ex, mobilityTag) && !baseSelection.some(s => s.id === ex.id)
        );
        if (injPool.length > 0) {
          const inj = seededShuffle(injPool, date + 'r561')[0];
          selection = [...baseSelection, inj];
          ctx.appendedIds.add(inj.id);
          ctx.trace.push(`R561 — Sport mobility injection: ${inj.name} added for ${primarySport}`);
        }
      }
    }
  }

  ctx.selection = selection;
  ctx.shuffled  = shuffled;
}

/**
 * R519 — one accumulated volume sentence (W2.3).
 *
 * Reps and durations are scaled in four independent, multiplicative places:
 * R512 (energy), R502 (experience), the ctx.volumeMultiplier application point
 * (R521 — itself fed by R511, R558, R520/R521, R536, R570) and R524 (body mass
 * on bodyweight reps). A real account reached ×0.41 and was told about two of
 * the four. Four more trace lines would have been four more things to read, so
 * this emits ONE line carrying the computed product and the reason keys; the
 * client turns it into a sentence through t() (messagePolicy.buildVolumeSentence).
 *
 * The percentage is derived from the factors that actually fired — never a
 * constant — and the factor list is in the line so the smoke guard can verify
 * that the stated percentage really is their product.
 */
function _traceVolumeSummary(ctx, factors, floorHeld = false) {
  const parts = [];
  const reasons = [];
  const addReason = (key) => { if (!reasons.includes(key)) reasons.push(key); };

  const add = (name, factor, reasonKeys) => {
    if (!factor || Math.abs(factor - 1) < 0.005) return;
    parts.push(`${name} ×${factor.toFixed(2)}`);
    reasonKeys.forEach(addReason);
  };

  add('energy',     factors.energy,     ['energy']);
  add('experience', factors.experience, ['experience']);
  add('situational', factors.situational,
    ctx.volumeReasons.length ? ctx.volumeReasons : ['situational']);
  // Below 70 kg the same formula scales reps UP, and "a calm build-up" would be
  // the wrong sentence for that, so the reason follows the direction.
  add('bodyweight', factors.bodyweight,
    [factors.bodyweight < 1 ? 'bodyweight' : 'bodyweight_up']);

  // W3.2 — when the stack would fall below ctx.volumeFloor the floor holds, and
  // that is stated as a factor of its own (the lift back up to the floor), so
  // the percentage the user reads is still exactly the product of the listed
  // factors — the W2.1 smoke check verifies that arithmetic.
  const raw = [factors.energy, factors.experience, factors.situational, factors.bodyweight]
    .reduce((acc, f) => acc * (f || 1), 1);
  const floor = ctx.volumeFloor ?? 0;
  if (raw < floor) add('floor', floor / raw, ['floor']);
  else if (floorHeld) addReason('floor');

  if (!parts.length) return;

  const product = Math.max(raw, floor);
  const pct = Math.round(product * 100);
  ctx.trace.push(`R519 — Volume ${pct}% of baseline · factors: ${parts.join(', ')} · reasons: ${reasons.join(',')}`);
}

/**
 * R524 — the bodyweight slow start, from the best evidence available (W3.3).
 *
 * Returns { scale, basis, weightScale }. Bases, strongest first:
 *   dcp         — military_coach.dcp.last: a max-rep self-test of the very
 *                 movements this scales. Below the minimum → slow start.
 *   progression — push/legs/core scores with real signal (any non-zero
 *                 power/endurance/baseline). A row of zeros is no evidence.
 *   weight      — 1/√(weight/70), clamped 0.7–1.3: the original proxy, used
 *                 only when nothing was measured.
 * The measured bases only ever slow the start (≤ 1): their job is the owner's
 * stated one — protect the deconditioned — not to reward a strong test.
 */
function _bodyweightSlowStart(ctx) {
  const weightScale = ctx.weightKg
    ? Math.max(0.7, Math.min(1.3, 1 / Math.sqrt(ctx.weightKg / 70)))
    : 1;

  const dcp  = ctx.prefs?.preferences?.military_coach?.dcp;
  const last = dcp?.last;
  if (last && (Number.isFinite(last.pushups) || Number.isFinite(last.situps))) {
    const norms = getDcpNorms(ctx.sex ?? ctx.prefs?.sex, dcpAgeFrom(dcp.birth_year, ctx.planDateMs));
    if (norms) {
      const ratios = [];
      if (Number.isFinite(last.pushups) && norms.pushups > 0) ratios.push(Math.min(1, last.pushups / norms.pushups));
      if (Number.isFinite(last.situps)  && norms.situps  > 0) ratios.push(Math.min(1, last.situps  / norms.situps));
      if (ratios.length) {
        const r = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        return { scale: r < 0.5 ? 0.8 : r < 1 ? 0.9 : 1, basis: 'dcp', weightScale };
      }
    }
  }

  const scores = ctx.progressionState?.scores;
  if (scores) {
    const levels = ['push', 'legs', 'core']
      .map(a => scores[a])
      .filter(Boolean)
      .map(a => Math.max(a.power ?? 0, a.endurance ?? 0, a.baseline ?? 0));
    if (levels.some(v => v > 0)) {
      const level = levels.reduce((a, b) => a + b, 0) / levels.length;
      return { scale: level < 20 ? 0.8 : level < 30 ? 0.9 : 1, basis: 'progression', weightScale };
    }
  }

  return { scale: weightScale, basis: 'weight', weightScale };
}

// ── Stage 6: Assemble session ─────────────────────────────────────────────────
// ── Step shape ────────────────────────────────────────────────────────────────
//
// ONE builder for the step a client renders and an execution records, so an
// engine step and a user-authored step (W4.1) cannot drift apart: WorkoutView,
// the load contract (C-F6), the muscle map and progression all read these
// fields, and progression routes on `exercise_id` alone.
function _stepFor(ex, prescription) {
  const media = ex.media_json ? JSON.parse(ex.media_json) : {};
  return {
    exercise_id:   ex.id,
    exercise_slug: ex.slug,
    name:          ex.name,
    category:      ex.category,
    tags_json:     ex.tags_json ?? '[]',
    equipment_required_json: ex.equipment_required_json ?? '["none"]',
    target_reps:          prescription.target_reps,
    target_duration_sec:  prescription.target_duration_sec,
    sets:                 prescription.sets,
    rest_sec:             prescription.rest_sec,
    ...(prescription.max_effort ? { max_effort: true, measures: prescription.measures, measure_window_sec: prescription.measure_window_sec } : {}),
    instructions_json:    ex.instructions_json ?? null,
    alternatives_json:    ex.alternatives_json ?? null,
    // Carried so R592 can avoid pairing two exercises that share a primary muscle,
    // and so the in-session muscle map uses real data instead of musclesFor()'s
    // slug-pattern fallback, which is all it has had until now.
    primary_muscles_json:   ex.primary_muscles_json ?? null,
    secondary_muscles_json: ex.secondary_muscles_json ?? null,
    gif_url:              media.gif_url ?? null,
    coaching_note:        prescription.coaching_note ?? null,
    // C-F6 — load contract. supports_weight drives whether the client shows a
    // weight field at all; load_type drives how the number is displayed and
    // rounded. Absent on bodyweight and timed work, which is the common case.
    ...(() => {
      let m = {};
      try { m = ex.metrics_json ? JSON.parse(ex.metrics_json) : {}; } catch { /* ignore */ }
      if (!(m.supports ?? []).includes('weight')) return {};
      return {
        supports_weight: true,
        load_type: m.load_type ?? null,
        target_weight_kg: ex.last_weight_kg ?? null,
        last_performance: ex.last_performance ?? null,
      };
    })(),
    ...(ex.trainer_logo_url ? { trainer_logo_url: ex.trainer_logo_url, trainer_logo_bg: ex.trainer_logo_bg ?? '#0a0a0a' } : {}),
  };
}

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

  // R502 — counted per leg so the trace below can state what actually changed.
  let r502Reps = 0;
  let r502Dur  = 0;

  // W3.2 — the volume stack is ONE product, floored once, rounded once, then
  // clamped to 3–30 reps LAST. It used to be four sequential roundings with the
  // rep clamp in the middle, so R524 ran after the floor and could take a 3-rep
  // set to 2 — the opposite of protection — and nothing bounded the product.
  const energyF = (checkIn?.energy ?? 10) <= T.ENERGY_LOW ? 0.6 : 1;
  const sitF    = ctx.volumeMultiplier;
  const bw      = _bodyweightSlowStart(ctx);          // W3.3 — R524
  const floorF  = ctx.volumeFloor ?? 0;
  let r524Count = 0;
  let floorHits = 0;
  const _floored = (f) => { if (f < floorF) { floorHits++; return floorF; } return f; };

  const steps = ctx.slot_type === 'rest' ? [] : ctx.cyclingProgramOverride ? [ctx.cyclingProgramOverride.step] : selection.map(ex => {
    const metrics   = JSON.parse(ex.metrics_json || '{}');
    const exTags    = JSON.parse(ex.tags_json || '[]');
    const isRunWarmup   = exTags.includes('run_warmup');
    const supportsReps  = metrics.supports?.includes('reps');
    const baseDuration  = metrics.base_duration_sec ?? 30;
    let reps = supportsReps ? (isRunWarmup ? 10 : (GOAL_REPS[goal] ?? 10)) : undefined;

    const equipmentRequired = JSON.parse(ex.equipment_required_json || '["none"]');
    const isWeighted = supportsReps && equipmentRequired.some(e =>
      ['dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 'plate', 'resistance_bands',
       'bench', 'bench_press_rack', 'squat_rack', 'smith_machine', 'multi_gym', 'ankle_weights',
       'weight_plates', 'stability_ball'].includes(e)
    );
    const coachingNote = isWeighted ? (GOAL_COACHING_NOTE[goal] ?? null) : null;
    let duration = !supportsReps ? baseDuration : undefined;

    const isLongCardio   = !supportsReps && baseDuration > 300;
    // A name-declared duration is the prescription: "Marsen (6 km/u) - 40 minuten"
    // IS 40 minutes. Scaling it makes the card contradict the exercise title, so
    // migration 0112 marks those metrics.fixed_duration and they are exempt here,
    // alongside the three slugs that were hardcoded before the flag existed.
    const isFixedDuration = metrics.fixed_duration === true
      || ex.slug === R574_MARCH_SLUG                // W3.4 — a march is prescribed, never volume-scaled
      || ex.slug === '12-minute-cooper-test'
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

    // The four scalers, applied as one product per leg:
    //   R512 energy ×0.6 · R502 experience · R521 ctx.volumeMultiplier (fed by
    //   R511, R558, R520/R521, R536, R570) · R524 body-mass slow start
    //   (bodyweight reps only). All of it is reported once, in R519.
    const isBodyweightReps = exTags.includes('bodyweight');
    if (reps) {
      if (energyF !== 1) ctx.trace.push(`R512 — Low energy → ${ex.name} reps ×0.6`);
      if (repScale !== 1.0) r502Reps++;
      const bwF = isBodyweightReps ? bw.scale : 1;
      if (bwF !== 1) r524Count++;
      reps = Math.round(reps * _floored(energyF * repScale * sitF * bwF));
    }
    if (duration && !isFixedDuration) {
      if (energyF !== 1) ctx.trace.push(`R512 — Low energy → ${ex.name} duration ×0.6`);
      // R502's duration leg spares long cardio and run warm-ups (audit §1).
      const expF = (!isLongCardio && !isRunWarmup) ? repScale : 1;
      if (expF !== 1.0) r502Dur++;
      duration = Math.round(duration * _floored(energyF * expF * sitF));
    }

    // Clamp LAST (W3.2): nothing after this point may rescale reps.
    if (reps) reps = Math.max(3, Math.min(30, reps));

    // R598 — a measurement set is not a training set: one set, no rep target,
    // a fixed 2-minute window, and full rest. Scaling it would make the number
    // incomparable to the published norm, which is the whole point of taking it.
    const measures = ctx.dcpMeasure
      ? (ex.id === ctx.dcpMeasure.pushId ? 'dcp_pushups'
        : ex.id === ctx.dcpMeasure.situpId ? 'dcp_situps' : null)
      : null;
    if (measures) {
      sets = 1;
      reps = undefined;
      duration = ctx.dcpMeasure.windowSec;
    }

    const baseRest    = getDefaultRest(ex, ctx.slot_type);
    const adjustedRest = Math.round(baseRest * goalRestMult / 5) * 5;

    return _stepFor(ex, {
      target_reps:          reps,
      target_duration_sec:  duration,
      sets,
      rest_sec:             adjustedRest,
      ...(measures ? { max_effort: true, measures, measure_window_sec: ctx.dcpMeasure.windowSec } : {}),
      coaching_note:        coachingNote,
    });
  });

  // R502 — one line for both legs. Reported after the map so timed work cannot
  // be rescaled silently again.
  if (repScale !== 1.0 && (r502Reps > 0 || r502Dur > 0)) {
    ctx.trace.push(`R502 — Experience (${expLevel}) → ×${repScale.toFixed(2)} on reps of ${r502Reps} exercise(s) and duration of ${r502Dur} exercise(s)`);
  }

  // R574 — Military kracht+marsen: append weighted march step
  if (ctx.militarySessionType === 'kracht_marsen' && ctx.militaryMarchSec > 0 && ctx.slot_type !== 'rest') {
    const marchEx = exercises.find(ex => ex.slug === R574_MARCH_SLUG);
    if (marchEx) {
      // W3.4 — dedupe defensively: whatever path put a march in the session, the
      // prescription below is the only one. Appended after scaling, so its
      // duration is the programme's minutes exactly — it is fixed by construction.
      for (let i = steps.length - 1; i >= 0; i--) if (steps[i].exercise_slug === R574_MARCH_SLUG) steps.splice(i, 1);
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

  // R524 — bodyweight reps, slow start (applied inside the floored stack above).
  //
  // Intent (product owner): "The weight cut was to protect obese or heavy users
  // from unachievable goals and injuries. The weight indicates a lack of
  // fitness, so a slow start is recommended." It stays, inside the floor, never
  // exempted. W3.3: body weight is only a PROXY for deconditioning and the
  // weakest signal available, so a real measurement wins when one exists — the
  // DCP self-assessment first, then measured progression scores — and the weight
  // proxy is the fallback. The trace names the basis that was used.
  let r524Scale = 1;
  if (r524Count > 0 && Math.abs(bw.scale - 1) >= 0.005) {
    r524Scale = bw.scale;
    ctx.trace.push(`R524 — Bodyweight reps ×${bw.scale.toFixed(2)} on ${r524Count} exercise(s) · basis: ${bw.basis} · direction: ${bw.scale < 1 ? 'down' : 'up'}`);
  } else if (bw.basis !== 'weight' && bw.weightScale < 0.995
    && steps.some(st => st.target_reps && _parseArr(st.tags_json).includes('bodyweight'))) {
    // The weight proxy WOULD have cut reps; a measurement says no slow start is
    // needed. Said out loud, so the heavier athlete sees why it did not apply.
    ctx.trace.push(`R524 — Body-weight proxy skipped: measured conditioning (${bw.basis}) shows no slow start is needed · basis: ${bw.basis} · direction: measured`);
  }

  // R519 — the four scalers above, as one sentence with one number, plus the
  // floor when it held (W3.2).
  if (ctx.slot_type !== 'rest' && steps.length) {
    _traceVolumeSummary(ctx, {
      energy:      energyF,
      experience:  repScale,
      situational: ctx.volumeMultiplier,
      bodyweight:  r524Scale,
    }, floorHits > 0);
  }

  // R525 — one mobility exercise appended for female users. The session gained an
  // exercise with no trace at all, so the session shown did not match the session
  // explained — the worst of the four silent modifiers (audit §2.3). It now traces.
  // The sex gate itself is undocumented and unchanged here: that is a product
  // decision, not an explainability fix (noted in the Wave 2 report).
  if (ctx.sex === 'female' && ctx.slot_type === 'main' && steps.length && ctx.isStandardMode && !ctx.runProgramOverride) {
    const hasMobility = steps.some(s => {
      const ex = exercises.find(e => e.id === s.exercise_id);
      return ex?.category === 'mobility';
    });
    if (!hasMobility) {
      const mobilityEx = _safePool(ctx, exercises).find(e => {
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
        ctx.appendedIds.add(mobilityEx.id);
        ctx.trace.push(`R525 — Mobility exercise appended: ${mobilityEx.name} (session is now ${steps.length} exercises)`);
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
      // W3.4 — by RULE, not by row order. The candidates pass every guard (R531
      // supine from week 16, R533 prone from T2, the postnatal phase, R542, the
      // kit), and position is never relied on: until now the first matching row
      // happened to be standing, and a reordered library would have put a
      // supine pelvic tilt into a week-20 session.
      const pfEx = _safePool(ctx, exercises).find(ex => {
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
        ctx.appendedIds.add(pfEx.id);
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
  let orderedSteps = [...coreSteps, ...indoorCardioSteps, ...outdoorSteps];
  if (indoorCardioSteps.length || outdoorSteps.length) {
    ctx.trace.push(`Ordering — core: ${coreSteps.length}, indoor cardio: ${indoorCardioSteps.length}, outdoor: ${outdoorSteps.length}`);
  }

  // R591 — C-F10: warm-up sets before a heavy lift.
  // Prepended as extra sets on the same step rather than separate steps, so they
  // cannot inflate exercise count or be mistaken for working volume. Flagged with
  // warmup_sets so the client renders and records them distinctly.
  for (const step of orderedSteps) {
    if (!step.supports_weight || !(step.target_weight_kg > 0)) continue;
    if ((step.sets ?? 0) < 3) continue;
    // Below ~20 kg the ramp is noise — an empty bar needs no rehearsal.
    if (step.target_weight_kg < 20) continue;
    const round = step.load_type === 'machine_stack' ? 5
      : step.load_type === 'barbell' || step.load_type === 'plate_loaded' ? 2.5 : 1;
    const r = (w) => Math.max(round, Math.round(w / round) * round);
    step.warmup_sets = [
      { weight_kg: r(step.target_weight_kg * 0.5), reps: Math.max(5, Math.round((step.target_reps ?? 8) * 0.6)) },
      { weight_kg: r(step.target_weight_kg * 0.75), reps: Math.max(3, Math.round((step.target_reps ?? 8) * 0.4)) },
    ];
    ctx.trace.push(`R591 — ${step.name}: warm-up ${step.warmup_sets.map(w => w.weight_kg + 'kg').join(' → ')} before ${step.target_weight_kg}kg`);
  }

  // R592 — C-F10: pair exercises into supersets when the clock is the constraint.
  // Opt-in by circumstance, never imposed: only when a time budget is actually set
  // and the session has more strength work than the budget comfortably holds.
  orderedSteps = _applySupersets(ctx, orderedSteps);

  // W3.0 backstop, then W3.4 total-time fit. Prescriptions are exempt from both.
  const prescribedIds = new Set();
  const _addRx = (e) => { if (e?.id) prescribedIds.add(e.id); };
  for (const o of [ctx.runProgramOverride, ctx.crossTrainingOverride, ctx.militaryProgramOverride]) {
    if (!o) continue;
    (o.warmUps ?? []).forEach(_addRx);
    [o.runEx, o.cooldownWalk, o.warmupJog, o.cooperEx].forEach(_addRx);
  }
  (ctx.militaryDbSelection ?? []).forEach(_addRx);
  if (ctx.militarySessionType === 'kracht_marsen' && ctx.militaryMarchSec > 0) {
    _addRx(exercises.find(ex => ex.slug === R574_MARCH_SLUG));
  }
  orderedSteps = _enforcePoolGuards(ctx, orderedSteps, prescribedIds);

  const fitProtected = new Set([...prescribedIds, ...ctx.appendedIds]);
  if (ctx.r555PinnedEx) fitProtected.add(ctx.r555PinnedEx.id);
  orderedSteps = _fitToBudget(ctx, orderedSteps, fitProtected, ctx.pinnedKept);

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
    // R598 — lets the client label the Recalibrate control "zelfmeting gepland"
    // instead of offering to schedule something already in today's session.
    assessment_planned: !!ctx.dcpMeasure,
    // W4.4 — present only when the user pinned exercises. `pinned` lists the pins
    // that are in the session; `pins_removed` the ones a guard (or a rest day /
    // coach programme) kept out, with the rule that did it.
    ...(ctx.pinnedIds.length ? {
      pinned: orderedSteps.filter(st => ctx.pinnedKept.has(st.exercise_id)).map(st => st.exercise_id),
      pins_removed: ctx.pinsRemoved,
    } : {}),
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


/**
 * Session time in seconds, by the same arithmetic as the client's estimateMins()
 * (planUtils.js): work + rest per set, no rest after the very last set. The
 * client rounds the result up to the next 5 minutes; the fit below aims at the
 * raw budget, so what the user reads never exceeds it by more than that rounding.
 */
function _estimateSessionSec(steps) {
  return steps.reduce((t, st, i) => {
    const sets = st.sets ?? 3;
    const active = st.target_duration_sec
      ? st.target_duration_sec * sets
      : (st.target_reps ?? 10) * sets * 4;
    const restPeriods = i === steps.length - 1 ? Math.max(0, sets - 1) : sets;
    return t + active + (st.rest_sec ?? 45) * restPeriods;
  }, 0);
}

/**
 * W3.4 — bound TOTAL session time.
 *
 * R501 sizes the exercise COUNT from the budget, but the +1 set for advanced
 * athletes (expSetMod) and the ×2.5 strength rest (GOAL_REST_MULT) are not
 * budget-aware, and R574 appends a 15–40 minute march after the count is spent.
 * Nothing bounded the sum: every advanced persona overran by 20–30 minutes.
 * R592 could not help — it only fires with an explicit check-in time_budget.
 *
 * This runs after assembly, so it sees every step that will be shown. It trims
 * one set at a time from the step with the most sets (floor 2), and only then
 * drops the last droppable exercise (floor 2 steps). It never touches a
 * prescription (coach blueprint, R574 march, R598 measurement, a fixed_sets
 * protocol, the R555 interval run) or a step added by a rule that traced it
 * (R534/R541 pelvic floor, R525, R561). Coach blueprints are budgeted by their
 * own rules and skipped entirely.
 */
function _fitToBudget(ctx, steps, protectedIds, keepIds = new Set()) {
  if (ctx.unlimited || !ctx.budget || ctx.slot_type === 'rest' || steps.length === 0) return steps;
  if (ctx.runProgramOverride || ctx.crossTrainingOverride || ctx.cyclingProgramOverride || ctx.militaryProgramOverride) return steps;
  const limit = ctx.budget * 60;
  const before = _estimateSessionSec(steps);
  if (before <= limit) return steps;

  const byId = new Map(ctx.exercises.map(e => [e.id, e]));
  const fixedSets = (st) => { try { return !!JSON.parse(byId.get(st.exercise_id)?.metrics_json || '{}').fixed_sets; } catch { return false; } };
  const isProtected = (st) => protectedIds.has(st.exercise_id) || st.max_effort;
  let out = steps.slice();
  let trimmed = 0;
  let dropped = 0;

  while (_estimateSessionSec(out) > limit) {
    const cands = out.filter(st => !isProtected(st) && !fixedSets(st) && (st.sets ?? 1) > 2);
    if (!cands.length) break;
    const maxSets = Math.max(...cands.map(st => st.sets));
    const pick = cands.filter(st => st.sets === maxSets).pop();
    // Superset members must agree on set count (R592), so a pair is trimmed together.
    const group = pick.group_id ? out.filter(st => st.group_id === pick.group_id) : [pick];
    for (const st of group) { st.sets -= 1; trimmed++; }
  }
  while (_estimateSessionSec(out) > limit && out.length > 2) {
    let idx = -1;
    // W4.4 — a pinned exercise may lose sets like any pick, but is never dropped.
    for (let i = out.length - 1; i >= 0; i--) if (!isProtected(out[i]) && !keepIds.has(out[i].exercise_id)) { idx = i; break; }
    if (idx < 0) break;
    const gone = out[idx];
    out.splice(idx, 1);
    if (gone.group_id) {
      const partner = out.find(st => st.group_id === gone.group_id);
      if (partner) delete partner.group_id;
    }
    dropped++;
  }

  if (trimmed || dropped) {
    const after = _estimateSessionSec(out);
    ctx.trace.push(`R595 — Session fitted to your ${ctx.budget}-min budget: ${trimmed} set(s) trimmed`
      + (dropped ? `, ${dropped} exercise(s) dropped` : '')
      + ` (~${Math.ceil(before / 60)} → ~${Math.ceil(after / 60)} min)`);
  }
  return out;
}

/**
 * R592 — superset pairing (C-F10).
 *
 * Pairs strength steps that do NOT share a primary muscle, so the second exercise
 * is genuinely resting the first. Pairing two pushes together would just be a drop
 * set with extra steps and would compromise both.
 *
 * Only fires when a time budget exists and the session overruns it. Cardio, runs,
 * mobility, pelvic-floor and warm-up-carrying heavy lifts are never paired — heavy
 * work needs full rest, and the rest is where the adaptation is.
 */
function _applySupersets(ctx, steps) {
  const budget = ctx.checkIn?.time_budget ?? ctx.checkIn?.checkin_json?.time_budget ?? null;
  if (!budget || steps.length < 4) return steps;

  const estMin = steps.reduce((m, s) => {
    const sets = s.sets ?? 3;
    const work = s.target_duration_sec ?? ((s.target_reps ?? 10) * 3);
    return m + (sets * (work + (s.rest_sec ?? 60))) / 60;
  }, 0);
  if (estMin <= budget) return steps;

  const pairable = (s) => {
    const tags = (() => { try { return JSON.parse(s.tags_json ?? '[]'); } catch { return []; } })();
    if (s.warmup_sets) return false;                         // heavy lifts keep their rest
    if (s.category === 'cardio' || s.category === 'mobility' || s.category === 'recovery') return false;
    return !tags.some(t => ['run_interval', 'cardio', 'pelvic_floor', 'breathing', 'mobility'].includes(t));
  };

  const musclesOf = (s) => {
    try { return new Set(JSON.parse(s.primary_muscles_json ?? '[]')); } catch { return new Set(); }
  };

  const used = new Set();
  let groupSeq = 0;
  const out = [];
  for (let i = 0; i < steps.length; i++) {
    if (used.has(i)) continue;
    const a = steps[i];
    out.push(a);
    used.add(i);
    if (!pairable(a)) continue;
    const ma = musclesOf(a);
    for (let j = i + 1; j < steps.length; j++) {
      if (used.has(j)) continue;
      const b = steps[j];
      if (!pairable(b)) continue;
      const mb = musclesOf(b);
      const overlaps = [...ma].some(m => mb.has(m));
      if (overlaps) continue;
      const gid = `ss${++groupSeq}`;
      a.group_id = gid;
      b.group_id = gid;
      // Members must agree on set count or the cycle cannot close cleanly.
      const sets = Math.min(a.sets ?? 3, b.sets ?? 3);
      a.sets = sets; b.sets = sets;
      out.push(b);
      used.add(j);
      ctx.trace.push(`R592 — superset ${gid}: ${a.name} + ${b.name} (no shared primary muscle)`);
      break;
    }
  }

  if (groupSeq > 0) {
    const saved = Math.round(groupSeq * (steps[0]?.rest_sec ?? 60) * (steps[0]?.sets ?? 3) / 60);
    _addNote(ctx, `Supersets aan — ${groupSeq} paar gecombineerd om binnen ${budget} minuten te blijven` + (saved > 0 ? ` (±${saved} min korter)` : ''));
  }
  return out;
}

// ── Orchestrator ──────────────────────────────────────────────────────────────
//
// Stages 1–4 register every pool guard for this athlete today. They are split
// out so the user-authored path (W4.1) evaluates exactly the guards the engine
// would have applied, instead of keeping a second, drifting list of checks.
export function buildPlannerGuardContext(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
  cycleContext, pregnancyContext, bonusSession, progressionState, isPro = false,
  cyclingWorkouts = [], cyclingTsb = null, cyclingSessionsLast7 = 0, runSessionsLast7 = 0,
  crossRunsLast7 = 0, militaryTemplateItems = null, runPrograms = null, opts = {}) {
  const ctx = _initPlannerContext(
    date, checkIn, exercises, prefs, templates, completedIds, bodyProfile,
    cycleContext, pregnancyContext, bonusSession, progressionState, isPro,
    cyclingWorkouts, cyclingTsb, cyclingSessionsLast7, runSessionsLast7,
    crossRunsLast7, militaryTemplateItems, runPrograms, opts
  );
  _applySafetyPolicies(ctx);
  _applyBodyModePolicies(ctx);
  _selectCoachBlueprint(ctx);
  return ctx;
}

export function runPlanner(...args) {
  const ctx = buildPlannerGuardContext(...args);
  _selectExercises(ctx);
  return _assembleSession(ctx);
}

// ── W4.1 — user-authored sessions ─────────────────────────────────────────────
//
// "Being able to adapt to the user's preferences or circumstances is the core
// value of the app." The planner is a default, not a gate: a user can replace
// today's session with one they built from the library. Client step bodies are
// never trusted — only `exercise_id` and four clamped numbers are read; every
// other field is rebuilt from the library row by _stepFor, so a custom step is
// shaped exactly like an engine step and routes to progression the same way.

export const CUSTOM_STEP_LIMITS = {
  sets:                [1, 10],
  target_reps:         [1, 100],
  target_duration_sec: [5, 7200],
  rest_sec:            [0, 600],
};
export const MAX_CUSTOM_STEPS = 20;
export const MAX_PINS = 3;
export const USER_PLAN_TRACE = 'USER — Je hebt deze sessie zelf samengesteld';

function _clampInt(v, [lo, hi]) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

/** Shape-only check, cheap enough to run before any database work. */
export function customStepsShapeError(raw) {
  if (!Array.isArray(raw)) return 'custom_steps must be an array';
  if (raw.length < 1) return 'custom_steps is empty';
  if (raw.length > MAX_CUSTOM_STEPS) return `custom_steps has more than ${MAX_CUSTOM_STEPS} steps`;
  for (const [i, st] of raw.entries()) {
    if (!st || typeof st !== 'object') return `custom_steps[${i}] is not an object`;
    const id = st.exercise_id;
    if ((typeof id !== 'string' && typeof id !== 'number') || String(id).trim() === '') {
      return `custom_steps[${i}].exercise_id is missing`;
    }
  }
  return null;
}

/** Shape-only check for W4.4 pins. */
export function pinnedIdsShapeError(raw) {
  if (!Array.isArray(raw)) return 'pinned_exercise_ids must be an array';
  if (raw.length < 1 || raw.length > MAX_PINS) return `pinned_exercise_ids takes 1–${MAX_PINS} ids`;
  if (raw.some(id => (typeof id !== 'string' && typeof id !== 'number') || String(id).trim() === '')) {
    return 'pinned_exercise_ids contains an empty id';
  }
  return null;
}

/**
 * W4.1 — PROTECT THE OVERRIDE. An automatic regeneration (app open, check-in,
 * retry) must never replace a session the user wrote. Replacing it is an
 * explicit action that carries `replace_user_plan: true`.
 */
export function preservesUserPlan(existingRow, body) {
  return existingRow?.generated_by === 'user' && body?.replace_user_plan !== true;
}

/**
 * Build today's plan from user-supplied steps.
 *
 * `ctx` comes from buildPlannerGuardContext, so the advisory pass sees the very
 * guards the engine registered. Returns { status, body } for a 400/409, or
 * { status: 200, plan, safety_notes, assessment_offer }.
 *
 *   400  unknown or inactive exercise_id, or a malformed body
 *   409  a blocking note (R539 clearance, pregnancy hard contraindication)
 *        without `safetyAck` — the client asks, then re-sends with the ack
 */
export function assembleCustomSession(ctx, rawSteps, { safetyAck = false, includeAssessment = false, nowMs = 0, sessionName = null } = {}) {
  const shapeErr = customStepsShapeError(rawSteps);
  if (shapeErr) return { status: 400, body: { ok: false, error: 'invalid_custom_steps', detail: shapeErr } };

  // ctx.exercises is the ACTIVE library plus the user's own gym exercises — the
  // same set the engine may choose from. Anything else does not exist for them.
  const byId = new Map(ctx.exercises.map(e => [String(e.id), e]));
  const unknown = [...new Set(rawSteps.map(st => String(st.exercise_id)).filter(id => !byId.has(id)))];
  if (unknown.length) {
    return { status: 400, body: { ok: false, error: 'unknown_exercise', unknown_exercise_ids: unknown } };
  }

  const L = CUSTOM_STEP_LIMITS;
  const steps = rawSteps.map((raw) => {
    const ex = byId.get(String(raw.exercise_id));
    let m = {};
    try { m = JSON.parse(ex.metrics_json || '{}') ?? {}; } catch { /* unknown metrics */ }
    const supportsReps = (m.supports ?? []).includes('reps');
    let reps = _clampInt(raw.target_reps, L.target_reps);
    let dur  = _clampInt(raw.target_duration_sec, L.target_duration_sec);
    // Reps OR duration, never both: the client's estimateMins and WorkoutView
    // both read duration first, so a step carrying both would time one and
    // display the other. The exercise's own metric decides.
    if (reps != null && dur != null) { if (supportsReps) dur = null; else reps = null; }
    if (reps == null && dur == null) {
      if (supportsReps) reps = 10;
      else dur = _clampInt(m.base_duration_sec ?? 30, L.target_duration_sec);
    }
    return _stepFor(ex, {
      target_reps:         reps ?? undefined,
      target_duration_sec: dur ?? undefined,
      sets:                _clampInt(raw.sets, L.sets) ?? _clampInt(m.fixed_sets ?? 3, L.sets),
      rest_sec:            _clampInt(raw.rest_sec, L.rest_sec) ?? _clampInt(getDefaultRest(ex, 'main'), L.rest_sec),
    });
  });

  // R598 — never inserted silently into a session the user wrote. When due it
  // is OFFERED; `includeAssessment` (the user tapped "Zelfmeting toevoegen")
  // appends the two measurement sets, chosen through the same _safePool.
  let assessmentOffer = false;
  let assessmentPlanned = false;
  const dcp = _dcpMeasurementDue(ctx);
  if (dcp && includeAssessment) {
    for (const [ex, measures] of [[dcp.pushEx, 'dcp_pushups'], [dcp.situpEx, 'dcp_situps']]) {
      steps.push(_stepFor(ex, {
        sets: 1, target_reps: undefined, target_duration_sec: DCP_WINDOW_SEC,
        rest_sec: _clampInt(getDefaultRest(ex, 'main'), L.rest_sec),
        max_effort: true, measures, measure_window_sec: DCP_WINDOW_SEC,
      }));
    }
    assessmentPlanned = true;
  } else if (dcp) {
    assessmentOffer = true;
  }

  // Advisory pass: evaluate, collect, do not mutate.
  const safetyNotes = _adviseSteps(ctx, steps);
  if (ctx.slot_type === 'rest' && ctx.trace.some(t => String(t).startsWith('R514'))) {
    // Not a pool guard but the same intent: the check-in reported pain.
    safetyNotes.push({ step_index: null, exercise_id: null, exercise_slug: null, code: 'R514', guard: 'pain_rest', blocking: false });
  }
  const blocking = safetyNotes.some(n => n.blocking);
  if (blocking && safetyAck !== true) {
    return { status: 409, body: { ok: false, error: 'safety_ack_required', safety_notes: safetyNotes } };
  }

  // eslint-disable-next-line no-control-regex
  const name = typeof sessionName === 'string' ? sessionName.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60) : '';
  const pc = ctx.pregnancyContext;
  const plan = {
    date:             ctx.date,
    slot_type:        'main',
    intensity:        'moderate',
    session_name:     name || 'Mijn training',
    template_slug:    null,
    target_category:  null,
    session_notes:    null,
    pregnancy_week:   pc?.week ?? null,
    trimester:        pc?.trimester ?? null,
    postnatal_phase:  pc?.postnatal_phase ?? null,
    steps,
    experience_level: ctx.expLevel ?? 'intermediate',
    coach_priority:   COACH_PRIORITY,
    assessment_planned: assessmentPlanned,
    rule_trace:       [USER_PLAN_TRACE],
    run_program:      null,
    cycling_program:  null,
    cross_training_run: null,
    military_program: null,
    authored_by_user: true,
    safety_notes:     safetyNotes,
    safety_ack_ms:    blocking ? nowMs : null,
    assessment_offer: assessmentOffer,
  };
  return { status: 200, plan, safety_notes: safetyNotes, assessment_offer: assessmentOffer };
}

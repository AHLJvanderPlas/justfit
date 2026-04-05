export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session } = body;

    if (!date) {
      return Response.json({ error: 'date required' }, { status: 400 });
    }

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

    const plan = runPlanner(date, effectiveCheckin, allExercises, prefs, allTemplates, completed_exercise_ids, bodyProfile, resolvedCycleContext, pregnancyContext, bonus_session);

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
  fat_loss:     'cardio',
  muscle_gain:  'strength',
  endurance:    'cardio',
  strength:     'strength',
  health:       'strength',
  mobility:     'mobility',
  mixed:        'strength',
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
};

// ---------------------------------------------------------------------------
// Goal → base sets for a normal main session
// ---------------------------------------------------------------------------
const GOAL_SETS_BASE = {
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
  strength:     1.50, // full recovery for max effort
  health:       1.00,
  mobility:     0.80, // brief pause between stretches
  mixed:        1.00,
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
};

// Gym equipment recognised when gym_today is true
const GYM_EQUIPMENT = ['none','dumbbell','barbell','cable','machine','pull_up_bar',
  'bench','kettlebell','resistance_band','exercise_bike','rowing_machine','treadmill',
  'indoor_bike','running_shoes'];

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

function hasAllTags(exercise, ...tags) {
  const t = JSON.parse(exercise.tags_json || '[]');
  return tags.every(tag => t.includes(tag));
}

// ---------------------------------------------------------------------------
// Rest duration helper — used per step in the plan
// ---------------------------------------------------------------------------
function getDefaultRest(exercise, slotType) {
  const tags = JSON.parse(exercise?.tags_json || '[]');
  if (slotType === 'micro') return 20;
  if (tags.includes('pelvic_floor')) return 30;
  if (tags.includes('mobility')) return 20;
  if (tags.includes('cardio')) return 30;
  if (tags.includes('bodyweight')) return 45;
  return 60;
}

// ---------------------------------------------------------------------------
// Core planner — pure function, no DB calls
// ---------------------------------------------------------------------------
function runPlanner(date, checkIn, exercises, prefs, templates, completedIds, bodyProfile, cycleContext, pregnancyContext, bonusSession) {
  const trace = [];
  const goal = prefs?.training_goal ?? 'health';
  const expLevel = prefs?.experience_level ?? 'intermediate';

  // Starting intensity comes from the user's goal — rules below may override downward
  let intensity = GOAL_INTENSITY[goal] ?? 'moderate';
  trace.push(`R500 — Goal: ${goal} → initial intensity: ${intensity}`);

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

  // ------------------------------------------------------------------
  // R511: Sleep Intensity Cap
  // ------------------------------------------------------------------
  if ((checkIn?.sleep_hours ?? 8) <= 5) {
    intensity = 'low';
    trace.push('R511 — Poor sleep → intensity capped at low');
  }

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
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.every(e => e === 'none' || userEquip.includes(e));
    });
    trace.push(`R516 — Equipment filter from profile → ${pool.length} exercises remain`);
  }

  // ------------------------------------------------------------------
  // R517: Mood adjustment
  // ------------------------------------------------------------------
  const mood = checkIn?.mood ?? null;
  if (mood !== null) {
    if (mood <= 4) {
      // Low mood (UI score ≤2) — pull toward recovery
      if (intensity === 'high') intensity = 'moderate';
      else if (intensity === 'moderate') intensity = 'low';
      trace.push(`R517 — Low mood (${mood}/10) → intensity reduced, recovery bias`);
    } else if (mood <= 6) {
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
    trace.push(`R518 — Gym today → gym equipment unlocked (${pool.length} exercises available)`);
  }

  // ------------------------------------------------------------------
  // BMI — calculated here so R545/R546 and cycle rules can both use it
  const weightKg = bodyProfile?.weight_kg ?? null;
  const heightCm = bodyProfile?.height_cm ?? null;
  const bmi = (weightKg && heightCm && heightCm > 0)
    ? weightKg / ((heightCm / 100) ** 2)
    : null;

  let volumeMultiplier = 1.0;
  let sessionNotes = null;

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

  if (bmi !== null && bmi >= 30 && slot_type !== 'rest') {
    const hasPain     = (checkIn?.pain_level ?? 0) >= 1;
    const isNovice    = expLevel === 'beginner';
    // Strict tier: BMI ≥ 35, OR BMI ≥ 30 with pain or knee-injury signal
    const strictMode  = bmi >= 35 || (bmi >= 30 && hasPain);
    // Moderate tier: BMI 30–35, no pain, not a complete novice to running
    const moderateMode = !strictMode && bmi >= 30;

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
      const note = bmi >= 35
        ? `BMI ${bmi.toFixed(0)}+: Running is removed from today's plan. Cycling, rowing, and brisk walking deliver excellent cardio with far less joint load. Build leg and glute strength first — that's the real foundation for running.`
        : `BMI ${bmi.toFixed(0)} + current discomfort: Swapping running for low-impact cardio today. Listen to your body — pain that changes your gait is a signal to stop.`;
      sessionNotes = (sessionNotes ? sessionNotes + ' ' : '') + note;
      if (intensity === 'high') intensity = 'moderate';
      trace.push(`R545 — BMI ${bmi.toFixed(1)} (strict) — running filtered out (${beforeCount - pool.length} removed), low-impact cardio preferred`);
    } else if (moderateMode) {
      // R546 — Keep running but cap intensity + add gradual build-up note
      if (intensity === 'high') intensity = 'moderate';
      const note = isNovice
        ? `BMI ${bmi.toFixed(0)}: Starting with walk-run intervals is the smart play. Aim to increase total running by no more than 10% per week. Strength work for your calves, quads, and glutes will make every run easier.`
        : `BMI ${bmi.toFixed(0)}: Build gradually — no more than 10% more running per week. A run-walk plan works well at this stage. Strength training alongside running significantly reduces injury risk.`;
      sessionNotes = (sessionNotes ? sessionNotes + ' ' : '') + note;
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
    if (week >= 16) {
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
      sessionNotes = 'Gentle movement only today. Listen to your body — rest is always the right choice.';
      trace.push('R535 — Nausea today → breathing/recovery focus');
    }

    // R536 — T3 breathlessness adaptation
    if (trimester === 3 && breathlessToday) {
      volumeMultiplier = 0.8;
      sessionNotes = (sessionNotes ? sessionNotes + ' ' : '') + 'Shorter intervals today — pause when you need to breathe.';
      trace.push('R536 — T3 breathlessness → volume ×0.8');
    }

    // R537 — Post-due-date flag
    if (pregnancyContext.past_due) {
      sessionNotes = (sessionNotes ? sessionNotes + ' ' : '') + 'When your baby arrives, switch to postnatal mode in Settings.';
      trace.push('R537 — Past due date: postnatal transition prompt added');
    }
  }

  // ==================================================================
  // POSTNATAL RULES (R540–R544)
  // ==================================================================
  if (pregnancyContext?.mode === 'postnatal') {
    const postnatalPhase = pregnancyContext.postnatal_phase ?? 'immediate';
    const birthType = pregnancyContext.postnatal_birth_type ?? null;
    const isCaesarean = birthType === 'caesarean';

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
      sessionNotes = 'Check for abdominal separation (diastasis recti) if you haven\'t already — speak to your physiotherapist.';
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
        sessionNotes = 'Running clearance: ensure you\'ve completed a pelvic floor physio assessment before returning to running.';
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

  // ------------------------------------------------------------------
  // Determine target category from goal + rules
  // ------------------------------------------------------------------
  let targetCategory;
  const inSpecialMode = pregnancyContext?.mode === 'pregnant' || pregnancyContext?.mode === 'postnatal';

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
  let filtered = pool.filter(ex => ex.category === targetCategory);
  if (!filtered.length) filtered = pool;
  if (!filtered.length) filtered = [...exercises];
  const shuffled = seededShuffle(filtered, date);

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
  const selection = shuffled.slice(0, count);

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

  const steps = slot_type === 'rest' ? [] : selection.map(ex => {
    const metrics = JSON.parse(ex.metrics_json || '{}');
    const supportsReps = metrics.supports?.includes('reps');
    // base_duration_sec lets conditioning exercises specify their own duration (e.g. 1200 = 20 min)
    const baseDuration = metrics.base_duration_sec ?? 30;
    let reps = supportsReps ? 10 : undefined;
    let duration = !supportsReps ? baseDuration : undefined;

    // Long cardio blocks (>5 min) are a single continuous effort — 1 set regardless
    const isLongCardio = !supportsReps && baseDuration > 300;

    // Sets: goal base + experience offset, clamped [1, 5]
    let sets;
    if (slot_type === 'micro' || isGentleMode || isLongCardio) {
      sets = 1;
    } else {
      sets = Math.max(1, Math.min(5, goalSetsBase + setOffset));
    }

    // R512: Low energy → volume × 0.6
    if ((checkIn?.energy ?? 10) <= 3) {
      if (reps)     { reps     = Math.floor(reps     * 0.6); trace.push(`R512 — Low energy → ${ex.name} reps ×0.6`); }
      if (duration) { duration = Math.floor(duration * 0.6); trace.push(`R512 — Low energy → ${ex.name} duration ×0.6`); }
    }

    // R502: Experience level scales reps AND duration
    if (repScale !== 1.0) {
      if (reps)     reps     = Math.round(reps     * repScale);
      if (duration && !isLongCardio) duration = Math.round(duration * repScale);
    }

    // Apply volume multiplier (R521, R536)
    if (volumeMultiplier !== 1.0) {
      if (reps)     reps     = Math.round(reps     * volumeMultiplier);
      if (duration) duration = Math.round(duration * volumeMultiplier);
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
      target_reps: reps,
      target_duration_sec: duration,
      sets,
      rest_sec: adjustedRest,
      instructions_json: ex.instructions_json ?? null,
      alternatives_json: ex.alternatives_json ?? null,
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
  if (sex === 'female' && slot_type === 'main' && steps.length && isStandardMode) {
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
    steps,
    rule_trace: trace,
  };
}

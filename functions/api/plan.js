export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, checkin } = body;

    if (!user_id || !date) {
      return Response.json({ error: 'user_id and date required' }, { status: 400 });
    }

    // Fetch exercises from DB
    const exResult = await env.DB.prepare(
      `SELECT id, slug, name, category, tags_json, equipment_required_json, metrics_json
       FROM exercises WHERE is_active = 1`
    ).all();
    const allExercises = exResult.results;

    // Run planner rules
    const plan = runPlanner(date, checkin, allExercises);

    // Save to day_plans
    const id = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(`
      INSERT INTO day_plans (id, user_id, date, plan_status, plan_json, generated_by, engine_version, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, 'final', ?, 'engine', 'v1.5.0', ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        plan_json = excluded.plan_json,
        updated_at_ms = excluded.updated_at_ms
    `).bind(id, user_id, date, JSON.stringify(plan), now, now).run();

    return Response.json({ ok: true, plan: { id, ...plan } });
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

function runPlanner(date, checkIn, exercises) {
  const trace = [];
  let intensity = 'moderate';
  let slot_type = 'main';
  let pool = [...exercises];
  const budget = checkIn?.time_budget ?? 30;

  // R510: Time Budget Clamp
  if (budget <= 10 || checkIn?.no_time) {
    slot_type = 'micro';
    trace.push('R510 — Time ≤10 min or No Time → micro session');
  } else if (budget <= 20) {
    trace.push('R510 — Short session (10–20 min)');
  } else {
    trace.push('R510 — Normal session (20+ min)');
  }

  // R511: Sleep Intensity Cap
  if (checkIn?.sleep_hours <= 5) {
    intensity = 'low';
    trace.push('R511 — Poor sleep → intensity capped at low');
    if (checkIn?.stress >= 7) trace.push('R511 — High stress + poor sleep → recovery bias');
  }

  // R513: Stress Recovery Bias
  if (checkIn?.stress >= 7) {
    intensity = 'low';
    trace.push('R513 — High stress → recovery bias');
  }

  // R514: Pain Safety Override
  if (checkIn?.pain_level >= 2) {
    slot_type = 'rest';
    trace.push('R514 — Moderate/severe pain → rest session');
  }

  // R515: No Clothing Filter
  if (checkIn?.no_clothing) {
    pool = pool.filter(ex => {
      const tags = JSON.parse(ex.tags_json || '[]');
      return tags.includes('low_impact') && !tags.includes('floor') && !tags.includes('high_impact');
    });
    trace.push('R515 — No clothing → stealth mode (no floor, low impact)');
  }

  // R516: No Gear / Travel
  if (checkIn?.no_gear || checkIn?.traveling) {
    pool = pool.filter(ex => {
      const equip = JSON.parse(ex.equipment_required_json || '["none"]');
      return equip.includes('none');
    });
    trace.push('R516 — No gear → bodyweight only');
  }

  // Select exercises
  const targetCategory = (checkIn?.stress >= 7) ? 'mobility' : 'strength';
  const filtered = pool.filter(ex => ex.category === targetCategory);
  const count = slot_type === 'micro' ? 1 : budget > 30 ? 4 : 3;
  const selection = filtered.slice(0, count);

  const steps = slot_type === 'rest' ? [] : selection.map(ex => {
    const metrics = JSON.parse(ex.metrics_json || '{}');
    const supportsReps = metrics.supports?.includes('reps');
    let reps = supportsReps ? 10 : undefined;
    let duration = !supportsReps ? 30 : undefined;

    // R512: Energy Volume Reduction
    if (checkIn?.energy <= 3) {
      if (reps) reps = Math.floor(reps * 0.6);
      if (duration) duration = Math.floor(duration * 0.6);
      trace.push(`R512 — Low energy → volume reduced for ${ex.name}`);
    }

    return {
      exercise_id: ex.id,
      exercise_slug: ex.slug,
      name: ex.name,
      target_reps: reps,
      target_duration: duration,
      sets: slot_type === 'micro' ? 1 : 3
    };
  });

  const names = { main: 'Daily Training', micro: 'Micro Session', rest: 'Active Rest' };

  return {
    date, slot_type, intensity,
    session_name: names[slot_type],
    steps, rule_trace: trace
  };
}

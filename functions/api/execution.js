export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { user_id, date, day_plan_id, session_type, steps, perceived_exertion, duration_sec } = body;

    if (!user_id || !date) {
      return Response.json({ error: 'user_id and date required' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    // Insert execution
    await env.DB.prepare(`
      INSERT INTO executions 
        (id, user_id, date, day_plan_id, execution_type, status,
         total_duration_sec, perceived_exertion, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
    `).bind(
      id, user_id, date,
      day_plan_id ?? null,
      session_type ?? 'workout',
      duration_sec ?? null,
      perceived_exertion ?? null,
      now, now
    ).run();

    // Batch insert steps using D1 batch API
    if (steps?.length) {
      const stmts = steps.map((step, i) =>
        env.DB.prepare(`
          INSERT INTO execution_steps
            (id, execution_id, step_index, step_type, exercise_id,
             prescribed_json, actual_json, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'exercise', ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          id,
          i,
          step.exercise_id ?? null,
          JSON.stringify(step.prescribed ?? {}),
          JSON.stringify(step.actual ?? {}),
          now, now
        )
      );
      await env.DB.batch(stmts);
    }

    return Response.json({ ok: true, execution_id: id });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');
    const limit = parseInt(url.searchParams.get('limit') ?? '30');

    if (!user_id) return Response.json({ error: 'user_id required' }, { status: 400 });

    const result = await env.DB.prepare(
      `SELECT id, date, execution_type, status, total_duration_sec, 
              perceived_exertion, created_at_ms
       FROM executions 
       WHERE user_id = ? 
       ORDER BY created_at_ms DESC 
       LIMIT ?`
    ).bind(user_id, limit).all();

    return Response.json({ executions: result.results });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

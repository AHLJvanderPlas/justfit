// CRUD /api/trainer/programs — program templates (P1E)
import { requireGymContext } from '../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) {
      const prog = await env.DB.prepare(`SELECT * FROM programs WHERE id = ? AND gym_id = ?`).bind(id, gymId).first();
      if (!prog) return Response.json({ error: 'Not found' }, { status: 404 });
      const sessions = await env.DB.prepare(
        `SELECT * FROM program_sessions WHERE program_id = ? ORDER BY week_number, day_in_week, order_in_day`
      ).bind(id).all();
      return Response.json({ ...prog, sessions: sessions.results ?? [] });
    }
    const rows = await env.DB.prepare(
      `SELECT id, name, description, goal, duration_weeks, sessions_per_week, is_template, visibility, created_at_ms
       FROM programs WHERE gym_id = ? ORDER BY created_at_ms DESC`
    ).bind(gymId).all();
    return Response.json(rows.results ?? []);
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { name, description, goal, duration_weeks, sessions_per_week, phase_structure,
            rule_constraints, equipment_scope, sessions } = body;
    if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 });

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO programs (id, gym_id, created_by_user_id, name, description, goal,
       duration_weeks, sessions_per_week, phase_structure_json, rule_constraints_json,
       equipment_scope_json, is_template, visibility, created_at_ms, updated_at_ms)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,1,'private',?,?)`
    ).bind(id, gymId, user.userId, name.trim(), description ?? null, goal ?? null,
           duration_weeks ?? 4, sessions_per_week ?? 3,
           phase_structure ? JSON.stringify(phase_structure) : null,
           rule_constraints ? JSON.stringify(rule_constraints) : null,
           equipment_scope ? JSON.stringify(equipment_scope) : null,
           now, now).run();

    // Insert sessions if provided
    if (sessions?.length) {
      const stmts = sessions.map(s => env.DB.prepare(
        `INSERT INTO program_sessions (id, program_id, week_number, day_in_week, name, structure_json, order_in_day, created_at_ms, updated_at_ms)
         VALUES (?,?,?,?,?,?,?,?,?)`
      ).bind(crypto.randomUUID(), id, s.week_number, s.day_in_week, s.name ?? null,
             JSON.stringify(s.structure ?? {}), s.order_in_day ?? 0, now, now));
      await env.DB.batch(stmts);
    }

    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.PROGRAM_CREATED,
      targetType: 'program', targetId: id, request, env });
    return Response.json({ ok: true, id });
  }

  if (request.method === 'PUT') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const existing = await env.DB.prepare(`SELECT gym_id FROM programs WHERE id = ?`).bind(id).first();
    if (!existing || existing.gym_id !== gymId) return Response.json({ error: 'Not found' }, { status: 404 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const now = Date.now();
    await env.DB.prepare(
      `UPDATE programs SET name=COALESCE(?,name), description=COALESCE(?,description),
       goal=COALESCE(?,goal), duration_weeks=COALESCE(?,duration_weeks),
       sessions_per_week=COALESCE(?,sessions_per_week),
       rule_constraints_json=COALESCE(?,rule_constraints_json), updated_at_ms=? WHERE id=?`
    ).bind(body.name ?? null, body.description ?? null, body.goal ?? null,
           body.duration_weeks ?? null, body.sessions_per_week ?? null,
           body.rule_constraints ? JSON.stringify(body.rule_constraints) : null,
           now, id).run();

    if (body.sessions) {
      // Replace all sessions
      await env.DB.prepare(`DELETE FROM program_sessions WHERE program_id = ?`).bind(id).run();
      if (body.sessions.length) {
        const stmts = body.sessions.map(s => env.DB.prepare(
          `INSERT INTO program_sessions (id, program_id, week_number, day_in_week, name, structure_json, order_in_day, created_at_ms, updated_at_ms)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), id, s.week_number, s.day_in_week, s.name ?? null,
               JSON.stringify(s.structure ?? {}), s.order_in_day ?? 0, now, now));
        await env.DB.batch(stmts);
      }
    }
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.PROGRAM_UPDATED,
      targetType: 'program', targetId: id, request, env });
    return Response.json({ ok: true });
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    const existing = await env.DB.prepare(`SELECT gym_id FROM programs WHERE id = ?`).bind(id).first();
    if (!existing || existing.gym_id !== gymId) return Response.json({ error: 'Not found' }, { status: 404 });
    await env.DB.prepare(`DELETE FROM programs WHERE id = ?`).bind(id).run();
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.PROGRAM_DELETED,
      targetType: 'program', targetId: id, request, env });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

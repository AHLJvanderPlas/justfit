// POST /api/trainer/programs/:id/assign — assign a program template to a client (P1E)
import { requireGymContext } from '../../../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../../../lib/audit.js';

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;
  const programId = params.id;

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { client_user_id, start_date, customizations } = body;
  if (!client_user_id || !start_date) return Response.json({ error: 'client_user_id and start_date required' }, { status: 400 });

  // Validate program belongs to gym
  const prog = await env.DB.prepare(`SELECT * FROM programs WHERE id = ? AND gym_id = ?`).bind(programId, gymId).first();
  if (!prog) return Response.json({ error: 'Program not found' }, { status: 404 });

  // Validate client is connected to gym
  const disc = await env.DB.prepare(`SELECT 1 FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`).bind(client_user_id, gymId).first();
  if (!disc) return Response.json({ error: 'Client not connected to this gym' }, { status: 404 });

  // Run P1F contraindication check
  const intake = await env.DB.prepare(
    `SELECT contraindications_json, injuries_json FROM client_intake WHERE user_id = ? AND gym_id = ? LIMIT 1`
  ).bind(client_user_id, gymId).first();
  const clientContras = intake?.contraindications_json ? JSON.parse(intake.contraindications_json) : [];
  const clientInjuries = intake?.injuries_json ? JSON.parse(intake.injuries_json) : [];

  // Get all sessions for this program
  const sessionsResult = await env.DB.prepare(
    `SELECT * FROM program_sessions WHERE program_id = ? ORDER BY week_number, day_in_week, order_in_day`
  ).bind(programId).all();
  const sessions = sessionsResult.results ?? [];

  // Check contraindications across all program exercises
  const hardFails = [];
  for (const sess of sessions) {
    const structure = sess.structure_json ? JSON.parse(sess.structure_json) : {};
    const blocks = structure.blocks ?? [];
    for (const block of blocks) {
      for (const ex of (block.exercises ?? [])) {
        const contraindications = ex.contraindications ?? [];
        for (const c of clientContras) {
          if (contraindications.includes(c.tag)) {
            hardFails.push({ exercise: ex.exercise_id, contraindication: c.tag, session: sess.name });
          }
        }
        for (const inj of clientInjuries) {
          if (inj.active && contraindications.includes(inj.area)) {
            hardFails.push({ exercise: ex.exercise_id, contraindication: inj.area, session: sess.name, injury: true });
          }
        }
      }
    }
  }

  const override = body.override_contraindications;
  if (hardFails.length && !override) {
    return Response.json({ error: 'contraindication_hard_fail', fails: hardFails }, { status: 422 });
  }

  // Create assignment
  const assignmentId = crypto.randomUUID();
  const now = Date.now();
  const endDate = prog.duration_weeks ? addDays(start_date, prog.duration_weeks * 7 - 1) : null;

  await env.DB.prepare(
    `INSERT INTO program_assignments (id, program_id, client_user_id, assigned_by_trainer_id, gym_id,
     start_date, end_date, status, customizations_json, adherence_pct, created_at_ms, updated_at_ms)
     VALUES (?,?,?,?,?,?,?,'active',?,0,?,?)`
  ).bind(assignmentId, programId, client_user_id, user.userId, gymId, start_date, endDate,
         customizations ? JSON.stringify(customizations) : null, now, now).run();

  // Generate assigned_sessions for full program duration
  const assignedSessions = [];
  for (const sess of sessions) {
    const weekOffset = (sess.week_number - 1) * 7;
    const dayOffset = (sess.day_in_week - 1);
    const scheduledDate = addDays(start_date, weekOffset + dayOffset);
    assignedSessions.push(env.DB.prepare(
      `INSERT INTO assigned_sessions (id, program_assignment_id, scheduled_date, session_template_id,
       status, created_at_ms, updated_at_ms) VALUES (?,?,?,?,'scheduled',?,?)`
    ).bind(crypto.randomUUID(), assignmentId, scheduledDate, sess.id, now, now));
  }
  if (assignedSessions.length) await env.DB.batch(assignedSessions);

  await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.PROGRAM_ASSIGNED,
    targetType: 'program_assignment', targetId: assignmentId,
    payload: { program_id: programId, client_user_id, start_date,
               override_contraindications: override ? true : undefined,
               override_reason: body.override_reason },
    request, env });

  return Response.json({ ok: true, assignment_id: assignmentId, sessions_created: assignedSessions.length });
}

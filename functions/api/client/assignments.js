// GET /api/client/assignments — client fetches their program assignments + sessions (P1E)
import { getUser } from '../_shared/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'active';
  const gymId = url.searchParams.get('gymId');

  let where = `pa.client_user_id = ? AND pa.status = ?`;
  const bind = [user.userId, status];
  if (gymId) { where += ` AND pa.gym_id = ?`; bind.push(gymId); }

  const assignments = await env.DB.prepare(
    `SELECT pa.*, p.name AS program_name, p.goal, p.duration_weeks, p.sessions_per_week,
            g.name AS gym_name
     FROM program_assignments pa
     JOIN programs p ON p.id = pa.program_id
     JOIN gyms g ON g.id = pa.gym_id
     WHERE ${where}
     ORDER BY pa.start_date DESC`
  ).bind(...bind).all();

  if (!assignments.results?.length) return Response.json([]);

  // Attach assigned_sessions for each
  const result = await Promise.all((assignments.results ?? []).map(async (a) => {
    const sessions = await env.DB.prepare(
      `SELECT asgn.*, ps.name AS session_name, ps.structure_json
       FROM assigned_sessions asgn
       LEFT JOIN program_sessions ps ON ps.id = asgn.session_template_id
       WHERE asgn.program_assignment_id = ?
       ORDER BY asgn.scheduled_date`
    ).bind(a.id).all();
    return { ...a, sessions: sessions.results ?? [] };
  }));

  return Response.json(result);
}

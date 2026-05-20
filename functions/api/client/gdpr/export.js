// POST /api/client/gdpr/export — request GDPR data export (P1I)
// Returns a JSON bundle with all user data (ZIP generation via Cloudflare Queue is Phase 2).
import { getUser } from '../../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = user.userId;

  // Parallel fetch of all user data
  const [profile, prefs, checkins, executions, disclosures, intakes, assignments] = await Promise.all([
    env.DB.prepare(`SELECT * FROM users WHERE id = ?`).bind(userId).first(),
    env.DB.prepare(`SELECT * FROM user_preferences WHERE user_id = ?`).bind(userId).first(),
    env.DB.prepare(`SELECT id, date, mood, energy, sleep_hours, stress, created_at_ms FROM daily_checkins WHERE user_id = ? ORDER BY date DESC LIMIT 500`).bind(userId).all(),
    env.DB.prepare(`SELECT id, date, execution_type, status, total_duration_sec, perceived_exertion, created_at_ms FROM executions WHERE user_id = ? ORDER BY date DESC LIMIT 1000`).bind(userId).all(),
    env.DB.prepare(`SELECT id, gym_id, level, display_name, share_training_history, share_checkins, consented_at_ms FROM trainer_disclosures WHERE user_id = ?`).bind(userId).all(),
    env.DB.prepare(`SELECT id, gym_id, experience_level, completed_at_ms FROM client_intake WHERE user_id = ?`).bind(userId).all(),
    env.DB.prepare(`SELECT id, program_id, gym_id, start_date, status, adherence_pct FROM program_assignments WHERE client_user_id = ? LIMIT 200`).bind(userId).all(),
  ]);

  await writeAudit({ gymId: null, actorUserId: userId, action: ACTIONS.GDPR_EXPORT_REQUESTED,
    targetType: 'user', targetId: userId, request, env });

  const bundle = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile: profile ?? null,
    preferences: prefs ?? null,
    check_ins: checkins.results ?? [],
    executions: executions.results ?? [],
    trainer_disclosures: disclosures.results ?? [],
    client_intakes: intakes.results ?? [],
    program_assignments: assignments.results ?? [],
    note: 'Encrypted PII fields (billing, contact) are not included in this export for security. Contact support to request full decrypted personal data.',
  };

  return Response.json(bundle, {
    headers: { 'Content-Disposition': 'attachment; filename="justfit-data-export.json"' },
  });
}

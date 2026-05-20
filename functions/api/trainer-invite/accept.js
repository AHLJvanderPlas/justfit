// POST /api/trainer-invite/accept — accept or decline a trainer email invite
import { getUser } from '../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { token, action = 'accept' } = body;
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });
  if (!['accept', 'decline'].includes(action)) return Response.json({ error: 'Invalid action' }, { status: 400 });

  const now = Date.now();
  const invite = await env.DB.prepare(
    `SELECT ti.*, g.name AS gym_name
     FROM trainer_invites ti
     JOIN gyms g ON g.id = ti.gym_id
     WHERE ti.invite_token = ? AND ti.status = 'pending' AND ti.expires_at > ?`
  ).bind(token, now).first();
  if (!invite) return Response.json({ error: 'Invite not found or expired' }, { status: 404 });

  if (action === 'decline') {
    await env.DB.prepare(
      `UPDATE trainer_invites SET status='declined', user_id=? WHERE invite_token=?`
    ).bind(user.userId, token).run();
    return Response.json({ ok: true, declined: true });
  }

  // Accept: upsert gym_memberships to active
  const membershipId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO gym_memberships (id, gym_id, user_id, role, status, invited_at_ms, joined_at_ms, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, 'client', 'active', ?, ?, ?, ?)
       ON CONFLICT(gym_id, user_id) DO UPDATE SET
         status='active', joined_at_ms=excluded.joined_at_ms, updated_at_ms=excluded.updated_at_ms`
    ).bind(membershipId, invite.gym_id, user.userId, now, now, now, now),
    env.DB.prepare(
      `UPDATE trainer_invites SET status='accepted', user_id=? WHERE invite_token=?`
    ).bind(user.userId, token),
  ]);

  await writeAudit({
    gymId: invite.gym_id, actorUserId: user.userId, action: ACTIONS.MEMBER_CONNECTED ?? 'member.connected',
    targetType: 'gym_membership', targetId: invite.gym_id,
    payload: { via: 'email_invite', invite_token: token }, request, env,
  }).catch(() => {});

  return Response.json({ ok: true, gym_id: invite.gym_id, gym_name: invite.gym_name });
}

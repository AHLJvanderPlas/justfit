// GET /api/trainer-invite?t=<invite_token> — look up a trainer invite (public, no auth required)
import { getUser } from './_shared/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const url = new URL(request.url);
  const token = url.searchParams.get('t');
  if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

  const now = Date.now();
  const invite = await env.DB.prepare(
    `SELECT ti.id, ti.gym_id, ti.email, ti.status, ti.expires_at,
            g.name AS gym_name,
            tp.display_name AS trainer_name,
            tp.photo_r2_key AS trainer_photo_r2_key
     FROM trainer_invites ti
     JOIN gyms g ON g.id = ti.gym_id
     JOIN gym_memberships gm ON gm.gym_id = ti.gym_id AND gm.role = 'owner' AND gm.status = 'active'
     LEFT JOIN trainer_profiles tp ON tp.user_id = gm.user_id
     WHERE ti.invite_token = ? AND ti.status = 'pending' AND ti.expires_at > ?
     LIMIT 1`
  ).bind(token, now).first();

  if (!invite) return Response.json({ error: 'Invite not found or expired' }, { status: 404 });

  // Optionally check if the requesting user is already connected (informational, not blocking)
  const user = await getUser(request, env);
  let alreadyConnected = false;
  if (user) {
    const existing = await env.DB.prepare(
      `SELECT status FROM gym_memberships WHERE gym_id = ? AND user_id = ? AND status = 'active'`
    ).bind(invite.gym_id, user.userId).first();
    alreadyConnected = !!existing;
  }

  return Response.json({
    gym_id:           invite.gym_id,
    gym_name:         invite.gym_name,
    trainer_name:     invite.trainer_name,
    trainer_photo_url: invite.trainer_photo_r2_key
      ? `https://assets.justfit.cc/${invite.trainer_photo_r2_key}` : null,
    email:            invite.email,
    already_connected: alreadyConnected,
  });
}

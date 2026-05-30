// GET  /api/connect?t=<trainer_token> — look up gym by trainer_token or FIT-XXXXXX short code
// POST /api/connect — submit a connection request (requires auth)
import { getUser } from './_shared/auth.js';

/** Strip "FIT-" prefix if present; return raw token string. */
function normaliseToken(t) {
  return t?.toUpperCase().startsWith('FIT-') ? t.slice(4) : t;
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const raw = url.searchParams.get('t');
    if (!raw) return Response.json({ error: 'Token required' }, { status: 400 });
    const token = normaliseToken(raw).toLowerCase();

    const gym = await env.DB.prepare(
      `SELECT g.id, g.name,
              u.display_name AS trainer_name,
              u.photo_r2_key AS trainer_photo_r2_key
       FROM gyms g
       JOIN gym_memberships gm ON gm.gym_id = g.id AND gm.role = 'owner' AND gm.status = 'active'
       JOIN users u ON u.id = gm.user_id
       WHERE LOWER(g.trainer_token) LIKE ? || '%'
       LIMIT 1`
    ).bind(token).first();

    if (!gym) return Response.json({ error: 'Code not found' }, { status: 404 });

    return Response.json({
      gym_id:            gym.id,
      gym_name:          gym.name,
      trainer_name:      gym.trainer_name,
      trainer_photo_url: gym.trainer_photo_r2_key
        ? `https://assets.justfit.cc/${gym.trainer_photo_r2_key}` : null,
    });
  }

  if (request.method === 'POST') {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { body = {}; }
    const rawToken = body.trainer_token;
    if (!rawToken) return Response.json({ error: 'trainer_token required' }, { status: 400 });
    const token = normaliseToken(rawToken).toLowerCase();

    const gym = await env.DB.prepare(
      `SELECT id, name, sub_status, sub_ends_at_ms, sub_tier, free_tier_client_limit FROM gyms WHERE LOWER(trainer_token) LIKE ? || '%' LIMIT 1`
    ).bind(token).first();
    if (!gym) return Response.json({ error: 'Trainer code not found' }, { status: 404 });

    const now = Date.now();
    const existing = await env.DB.prepare(
      `SELECT id, status FROM gym_memberships WHERE gym_id = ? AND user_id = ?`
    ).bind(gym.id, user.userId).first();

    if (existing?.status === 'active') {
      return Response.json({ error: 'already_connected', gym_id: gym.id, gym_name: gym.name }, { status: 409 });
    }

    // T-E11: enforce client limit for starter tier gyms
    if (gym.sub_tier === 'starter') {
      const countRow = await env.DB.prepare(
        `SELECT COUNT(*) AS cnt FROM gym_memberships WHERE gym_id = ? AND role = 'client' AND status = 'active'`
      ).bind(gym.id).first();
      const limit = gym.free_tier_client_limit ?? 3;
      if ((countRow?.cnt ?? 0) >= limit) {
        return Response.json({
          error: 'gym_client_limit_reached',
          limit,
          message: 'Deze trainer heeft het maximale aantal klanten bereikt voor dit abonnement.',
        }, { status: 409 });
      }
    }

    if (existing) {
      await env.DB.prepare(
        `UPDATE gym_memberships SET status='pending', updated_at_ms=? WHERE gym_id=? AND user_id=?`
      ).bind(now, gym.id, user.userId).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO gym_memberships (id, gym_id, user_id, role, status, invited_at_ms, created_at_ms, updated_at_ms)
         VALUES (?, ?, ?, 'client', 'pending', ?, ?, ?)`
      ).bind(crypto.randomUUID(), gym.id, user.userId, now, now, now).run();
    }

    // If gym has an active B2B subscription, grant the user Pro immediately so they
    // don't have to wait for the next Mollie payment webhook to fire.
    if (gym.sub_status === 'active' && gym.sub_ends_at_ms) {
      const hasEntitlement = await env.DB.prepare(
        `SELECT id FROM entitlements WHERE user_id = ? AND source = 'trainer_grant' AND status IN ('active','grace') LIMIT 1`
      ).bind(user.userId).first();
      if (!hasEntitlement) {
        await env.DB.prepare(
          `INSERT INTO entitlements (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, created_at_ms, updated_at_ms)
           VALUES (?,?,?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), user.userId, 'pro_consumer', 'trainer_grant', 'active', now, gym.sub_ends_at_ms, now, now).run();
      }
    }

    return Response.json({ ok: true, gym_id: gym.id, gym_name: gym.name });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

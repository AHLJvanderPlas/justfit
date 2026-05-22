// POST /api/client/support-request   — submit a new support request
// GET  /api/client/support-request/active — get active support request (handled in active.js)

import { getUser } from '../_shared/auth.js';

const AVAIL_TTL_MS = 4 * 60 * 60 * 1000;

function isAvailable(status, updatedAtMs) {
  if (!status || status === 'offline') return false;
  if (!updatedAtMs || Date.now() - updatedAtMs > AVAIL_TTL_MS) return false;
  return true;
}

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { message, broadcast = false } = body ?? {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'message required' }, { status: 400 });
    }
    if (message.length > 500) {
      return Response.json({ error: 'message too long' }, { status: 400 });
    }

    // Get client membership
    const membership = await env.DB.prepare(`
      SELECT gm.gym_id, gm.assigned_trainer_user_id,
             g.model AS gym_model
      FROM gym_memberships gm
      JOIN gyms g ON g.id = gm.gym_id
      WHERE gm.user_id = ? AND gm.role = 'client' AND gm.status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership) {
      return Response.json({ error: 'not_in_gym' }, { status: 400 });
    }

    const gymId = membership.gym_id;
    const now = Date.now();

    // Check for existing active support request
    const existing = await env.DB.prepare(`
      SELECT id FROM support_requests
      WHERE client_user_id = ? AND status IN ('open','accepted')
      LIMIT 1
    `).bind(user.userId).first();

    if (existing) {
      return Response.json({ error: 'active_request_exists', requestId: existing.id }, { status: 409 });
    }

    // Check that at least one trainer is available/busy
    const trainers = await env.DB.prepare(`
      SELECT user_id, availability_status, availability_updated_at_ms
      FROM gym_memberships
      WHERE gym_id = ? AND role IN ('trainer','owner') AND status = 'active'
    `).bind(gymId).all();

    const availableTrainers = (trainers?.results ?? []).filter(t =>
      isAvailable(t.availability_status, t.availability_updated_at_ms)
    );

    if (availableTrainers.length === 0) {
      return Response.json({ error: 'no_trainers_available' }, { status: 400 });
    }

    // ZZP non-broadcast: primary trainer must be available
    if (membership.gym_model === 'zzp' && !broadcast) {
      const primaryAvail = availableTrainers.some(
        t => t.user_id === membership.assigned_trainer_user_id
      );
      if (!primaryAvail && membership.assigned_trainer_user_id) {
        return Response.json({ error: 'primary_trainer_unavailable' }, { status: 400 });
      }
    }

    const requestId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO support_requests
        (id, gym_id, client_user_id, message, broadcast, status, created_at_ms)
      VALUES (?, ?, ?, ?, ?, 'open', ?)
    `).bind(requestId, gymId, user.userId, message.trim(), broadcast ? 1 : 0, now).run();

    return Response.json({ ok: true, requestId });
  } catch (e) {
    console.error('POST /api/client/support-request', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/client/switch-request — submit trainer switch request

import { getUser } from '../_shared/auth.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { to_trainer_user_id, message } = body ?? {};
    if (!to_trainer_user_id) return Response.json({ error: 'to_trainer_user_id required' }, { status: 400 });

    // Get client membership
    const membership = await env.DB.prepare(`
      SELECT gm.gym_id, gm.assigned_trainer_user_id,
             g.model AS gym_model, g.switch_auto_approve
      FROM gym_memberships gm
      JOIN gyms g ON g.id = gm.gym_id
      WHERE gm.user_id = ? AND gm.role = 'client' AND gm.status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership) return Response.json({ error: 'not_in_gym' }, { status: 400 });

    const gymId = membership.gym_id;

    if (to_trainer_user_id === membership.assigned_trainer_user_id) {
      return Response.json({ error: 'already_assigned_to_trainer' }, { status: 400 });
    }

    // Validate target trainer is active member of gym
    const targetTrainer = await env.DB.prepare(`
      SELECT user_id FROM gym_memberships
      WHERE gym_id = ? AND user_id = ? AND role IN ('trainer','owner') AND status = 'active'
      LIMIT 1
    `).bind(gymId, to_trainer_user_id).first();

    if (!targetTrainer) return Response.json({ error: 'trainer_not_found' }, { status: 404 });

    // Check gym has at least 2 trainers
    const trainerCount = await env.DB.prepare(`
      SELECT COUNT(*) AS cnt FROM gym_memberships
      WHERE gym_id = ? AND role IN ('trainer','owner') AND status = 'active'
    `).bind(gymId).first();

    if ((trainerCount?.cnt ?? 0) < 2) {
      return Response.json({ error: 'only_one_trainer' }, { status: 400 });
    }

    // Check no pending switch request already exists
    const existing = await env.DB.prepare(`
      SELECT id FROM trainer_switch_requests
      WHERE client_user_id = ? AND status = 'pending'
      LIMIT 1
    `).bind(user.userId).first();

    if (existing) {
      return Response.json({ error: 'pending_request_exists', requestId: existing.id }, { status: 409 });
    }

    const now = Date.now();
    const requestId = crypto.randomUUID();

    // Auto-approve if staff + switch_auto_approve=1
    if (membership.gym_model === 'staff' && membership.switch_auto_approve === 1) {
      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO trainer_switch_requests
            (id, gym_id, client_user_id, from_trainer_user_id, to_trainer_user_id,
             initiated_by, client_message, status, decided_by_user_id, decided_at_ms, created_at_ms)
          VALUES (?, ?, ?, ?, ?, 'client', ?, 'approved', NULL, ?, ?)
        `).bind(requestId, gymId, user.userId, membership.assigned_trainer_user_id,
                to_trainer_user_id, message ?? null, now, now),
        env.DB.prepare(`
          UPDATE gym_memberships SET assigned_trainer_user_id = ?, updated_at_ms = ?
          WHERE user_id = ? AND gym_id = ? AND role = 'client'
        `).bind(to_trainer_user_id, now, user.userId, gymId),
      ]);
      return Response.json({ ok: true, status: 'approved', requestId });
    }

    await env.DB.prepare(`
      INSERT INTO trainer_switch_requests
        (id, gym_id, client_user_id, from_trainer_user_id, to_trainer_user_id,
         initiated_by, client_message, status, created_at_ms)
      VALUES (?, ?, ?, ?, ?, 'client', ?, 'pending', ?)
    `).bind(requestId, gymId, user.userId, membership.assigned_trainer_user_id,
            to_trainer_user_id, message ?? null, now).run();

    return Response.json({ ok: true, status: 'pending', requestId });
  } catch (e) {
    console.error('POST /api/client/switch-request', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

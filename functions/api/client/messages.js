// GET    /api/client/messages      — fetch message thread with assigned trainer
// POST   /api/client/messages      — send message to trainer
// PATCH  /api/client/messages/read — mark all trainer messages as read

import { getUser } from '../_shared/auth.js';

const MAX_BODY = 1000;

async function getMembership(env, userId) {
  return env.DB.prepare(`
    SELECT gym_id, assigned_trainer_user_id
    FROM gym_memberships
    WHERE user_id = ? AND role = 'client' AND status = 'active'
    LIMIT 1
  `).bind(userId).first();
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await getMembership(env, user.userId);
    if (!membership?.assigned_trainer_user_id) return Response.json({ messages: [] });

    const { gym_id, assigned_trainer_user_id: trainerId } = membership;

    const rows = await env.DB.prepare(`
      SELECT id, sender_user_id, body, sent_at_ms, read_at_ms
      FROM trainer_messages
      WHERE gym_id = ?
        AND (
          (sender_user_id = ? AND recipient_user_id = ?)
          OR (sender_user_id = ? AND recipient_user_id = ?)
        )
      ORDER BY sent_at_ms ASC
      LIMIT 100
    `).bind(gym_id, user.userId, trainerId, trainerId, user.userId).all();

    const messages = (rows.results ?? []).map(r => ({
      id: r.id,
      sender_user_id: r.sender_user_id,
      body: r.body,
      sent_at_ms: r.sent_at_ms,
      read_at_ms: r.read_at_ms ?? null,
      is_mine: r.sender_user_id === user.userId,
    }));

    return Response.json({ messages });
  } catch (e) {
    console.error('GET /api/client/messages', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await getMembership(env, user.userId);
    if (!membership?.assigned_trainer_user_id) {
      return Response.json({ error: 'Geen trainer gekoppeld' }, { status: 400 });
    }

    const { gym_id, assigned_trainer_user_id: trainerId } = membership;

    let body;
    try { body = (await request.json()).body; } catch {
      return Response.json({ error: 'Ongeldige invoer' }, { status: 400 });
    }

    if (typeof body !== 'string' || !body.trim()) {
      return Response.json({ error: 'Bericht mag niet leeg zijn' }, { status: 400 });
    }
    if (body.length > MAX_BODY) {
      return Response.json({ error: `Bericht te lang (max ${MAX_BODY} tekens)` }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = Date.now();

    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO trainer_messages (id, gym_id, sender_user_id, recipient_user_id, body, sent_at_ms)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(id, gym_id, user.userId, trainerId, body.trim(), now),
      // increment unread for trainer, update last msg timestamp on both memberships
      env.DB.prepare(`
        UPDATE gym_memberships
        SET conv_unread_trainer = conv_unread_trainer + 1, conv_last_msg_at_ms = ?
        WHERE user_id = ? AND gym_id = ? AND role IN ('trainer','owner')
      `).bind(now, trainerId, gym_id),
      env.DB.prepare(`
        UPDATE gym_memberships SET conv_last_msg_at_ms = ?
        WHERE user_id = ? AND gym_id = ? AND role = 'client'
      `).bind(now, user.userId, gym_id),
    ]);

    return Response.json({
      ok: true,
      message: { id, sender_user_id: user.userId, body: body.trim(), sent_at_ms: now, read_at_ms: null, is_mine: true },
    });
  } catch (e) {
    console.error('POST /api/client/messages', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await getMembership(env, user.userId);
    if (!membership) return Response.json({ ok: true });

    const { gym_id, assigned_trainer_user_id: trainerId } = membership;
    const now = Date.now();

    await env.DB.batch([
      env.DB.prepare(`
        UPDATE gym_memberships SET conv_unread_client = 0
        WHERE user_id = ? AND gym_id = ? AND role = 'client'
      `).bind(user.userId, gym_id),
      env.DB.prepare(`
        UPDATE trainer_messages SET read_at_ms = ?
        WHERE recipient_user_id = ? AND sender_user_id = ? AND gym_id = ? AND read_at_ms IS NULL
      `).bind(now, user.userId, trainerId, gym_id),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/client/messages/read', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

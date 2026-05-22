// ─── PUSH SUBSCRIPTION API ────────────────────────────────────────────────────
// GET  /api/subscribe-push  → { ok, vapid_public_key, subscribed }
// POST /api/subscribe-push  → { action: 'subscribe', subscription } — store subscription
// DELETE /api/subscribe-push → { endpoint } — remove subscription
//
// Actual push dispatch requires a Cron Worker (CF Pages Functions cannot be scheduled).
// This endpoint only stores/removes the subscription objects in D1.
// Required env var: VAPID_PUBLIC_KEY (base64url-encoded uncompressed EC public key)

import { getUser } from './_shared/auth.js';

export async function onRequestGet(ctx) {
  try {
    const user = await getUser(ctx.request, ctx.env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const vapidPublicKey = ctx.env.VAPID_PUBLIC_KEY ?? null;
    if (!vapidPublicKey) return Response.json({ error: 'Push not configured' }, { status: 503 });

    const sub = await ctx.env.DB.prepare(
      `SELECT id FROM push_subscriptions WHERE user_id = ? LIMIT 1`
    ).bind(user.userId).first();

    return Response.json({ ok: true, vapid_public_key: vapidPublicKey, subscribed: !!sub });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost(ctx) {
  try {
    const user = await getUser(ctx.request, ctx.env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await ctx.request.json();
    if (body.action !== 'subscribe' || !body.subscription?.endpoint) {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { endpoint, keys } = body.subscription;
    const p256dh = keys?.p256dh ?? '';
    const auth = keys?.auth ?? '';
    if (!p256dh || !auth) return Response.json({ error: 'Missing subscription keys' }, { status: 400 });

    const now = Date.now();
    const db = ctx.env.DB;
    await db.prepare(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, endpoint) DO UPDATE SET p256dh=excluded.p256dh, auth=excluded.auth, updated_at_ms=excluded.updated_at_ms`
    ).bind(
      crypto.randomUUID(), user.userId, endpoint, p256dh, auth,
      ctx.request.headers.get('User-Agent') ?? null,
      now, now
    ).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestDelete(ctx) {
  try {
    const user = await getUser(ctx.request, ctx.env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await ctx.request.json().catch(() => ({}));
    const endpoint = body.endpoint;
    if (!endpoint) {
      // Remove all subscriptions for this user
      await ctx.env.DB.prepare('DELETE FROM push_subscriptions WHERE user_id = ?').bind(user.userId).run();
    } else {
      await ctx.env.DB.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?').bind(user.userId, endpoint).run();
    }

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

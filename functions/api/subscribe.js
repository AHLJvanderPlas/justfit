// functions/api/subscribe.js
// Consumer Pro subscription management via Mollie.
// POST   — initiate checkout (creates Mollie customer + mandate payment)
// GET    — return current entitlement state
// DELETE — cancel active subscription

import { getUser } from './_shared/auth.js';
import { createCustomer, createMandatePayment, cancelSubscription } from '../lib/mollie.js';

const EARLY_BIRD_CAP = 200;

const PLANS = {
  pro_monthly_eb: { amount: 4.99,  interval: '1 month', days: 31  },
  pro_annual_eb:  { amount: 48.00, interval: '1 year',  days: 366 },
  pro_monthly:    { amount: 6.99,  interval: '1 month', days: 31  },
  pro_annual:     { amount: 59.99, interval: '1 year',  days: 366 },
};

// ─── POST /api/subscribe ──────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 5 checkout initiations per IP per hour
    const ip     = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
    const bucket = `subscribe_checkout:${ip}`;
    const now    = Date.now();
    const cutoff = now - 3_600_000;
    await env.DB.prepare(`
      INSERT INTO auth_rate_limits (bucket, count, window_start_ms)
      VALUES (?, 1, ?)
      ON CONFLICT(bucket) DO UPDATE SET
        count           = CASE WHEN window_start_ms <= ? THEN 1 ELSE count + 1 END,
        window_start_ms = CASE WHEN window_start_ms <= ? THEN ? ELSE window_start_ms END
    `).bind(bucket, now, cutoff, cutoff, now).run();
    const rlRow = await env.DB.prepare(`SELECT count FROM auth_rate_limits WHERE bucket = ?`).bind(bucket).first();
    if ((rlRow?.count ?? 1) > 5) return Response.json({ error: 'too_many_requests' }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const { plan } = body;
    if (!PLANS[plan]) return Response.json({ error: 'invalid_plan' }, { status: 400 });

    // Guard: already subscribed
    const existing = await env.DB.prepare(
      `SELECT id FROM entitlements WHERE user_id = ? AND status IN ('active','trialing','grace') AND ends_at_ms > ? LIMIT 1`
    ).bind(user.userId, Date.now()).first();
    if (existing) return Response.json({ error: 'already_subscribed' }, { status: 409 });

    // Guard: early bird cap
    if (plan.endsWith('_eb')) {
      const { cnt } = await env.DB.prepare(
        `SELECT COUNT(*) as cnt FROM entitlements WHERE source = 'mollie_sub' AND product_code LIKE '%_eb'`
      ).first();
      if ((cnt ?? 0) >= EARLY_BIRD_CAP) {
        return Response.json({ error: 'early_bird_sold_out' }, { status: 409 });
      }
    }

    // Fetch user email for Mollie customer
    const userRow = await env.DB.prepare(`SELECT primary_email FROM users WHERE id = ? LIMIT 1`).bind(user.userId).first();
    const email = userRow?.primary_email ?? user.email ?? '';

    // Create Mollie customer
    const customer = await createCustomer(
      { name: email, email, metadata: { userId: user.userId } },
      env.MOLLIE_API_KEY
    );

    const planCfg = PLANS[plan];

    // Create first-mandate payment (redirects user to Mollie checkout; subscription created on paid webhook)
    const payment = await createMandatePayment({
      customerId: customer.id,
      amount: planCfg.amount,
      description: `JustFit Pro — ${plan}`,
      redirectUrl: 'https://app.justfit.cc/upgrade/success',
      webhookUrl: 'https://app.justfit.cc/api/webhooks/mollie-consumer',
      metadata: {
        userId: user.userId,
        plan,
        customerId: customer.id,
        interval: planCfg.interval,
        days: planCfg.days,
      },
    }, env.MOLLIE_API_KEY);

    // Log billing event
    await env.DB.prepare(
      `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
    ).bind(
      crypto.randomUUID(), user.userId, 'sub_created', plan, payment.id,
      JSON.stringify({ customerId: customer.id, plan }), Date.now()
    ).run();

    return Response.json({ checkout_url: payment._links.checkout.href });
  } catch (e) {
    console.error('[subscribe POST]', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── GET /api/subscribe ───────────────────────────────────────────────────────
export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await env.DB.prepare(
      `SELECT status, product_code, ends_at_ms, source, mollie_customer_id, mollie_sub_id
       FROM entitlements WHERE user_id = ? ORDER BY ends_at_ms DESC LIMIT 1`
    ).bind(user.userId).first();

    const isPro = !!(row && ['active', 'trialing', 'grace'].includes(row.status) && (row.ends_at_ms ?? 0) > Date.now());

    // Early bird remaining
    const { cnt: ebUsed } = await env.DB.prepare(
      `SELECT COUNT(*) as cnt FROM entitlements WHERE source = 'mollie_sub' AND product_code LIKE '%_eb'`
    ).first();
    const early_bird_remaining = Math.max(0, EARLY_BIRD_CAP - (ebUsed ?? 0));

    return Response.json({
      isPro,
      status: row?.status ?? null,
      product_code: row?.product_code ?? null,
      ends_at_ms: row?.ends_at_ms ?? null,
      source: row?.source ?? null,
      early_bird_remaining,
    });
  } catch (e) {
    console.error('[subscribe GET]', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE /api/subscribe ────────────────────────────────────────────────────
export async function onRequestDelete({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const row = await env.DB.prepare(
      `SELECT id, mollie_customer_id, mollie_sub_id, ends_at_ms FROM entitlements
       WHERE user_id = ? AND status = 'active' AND source = 'mollie_sub' LIMIT 1`
    ).bind(user.userId).first();

    if (!row) return Response.json({ error: 'no_active_subscription' }, { status: 404 });

    // Cancel in Mollie if we have the IDs
    if (row.mollie_customer_id && row.mollie_sub_id) {
      try {
        await cancelSubscription(row.mollie_customer_id, row.mollie_sub_id, env.MOLLIE_API_KEY);
      } catch { /* Mollie cancel failure — still mark canceled locally */ }
    }

    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE entitlements SET status = 'canceled', updated_at_ms = ? WHERE id = ?`
      ).bind(now, row.id),
      env.DB.prepare(
        `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
      ).bind(crypto.randomUUID(), user.userId, 'sub_canceled', null, row.mollie_sub_id, null, now),
    ]);

    return Response.json({ ok: true, access_until_ms: row.ends_at_ms });
  } catch (e) {
    console.error('[subscribe DELETE]', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

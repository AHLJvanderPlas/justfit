// POST /api/webhooks/mollie-consumer
// Mollie webhook for consumer Pro subscription payments.
// Mollie always sends payment ID in form body; we re-fetch the payment to get current status.

import { verifyWebhook, createSubscription } from '../../lib/mollie.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('OK', { status: 200 });
  if (!env.MOLLIE_API_KEY) return new Response('OK', { status: 200 });

  let payment;
  try {
    payment = await verifyWebhook(request.clone(), env.MOLLIE_API_KEY);
  } catch (e) {
    console.error('[mollie-consumer] verify failed:', e.message);
    return new Response('OK', { status: 200 }); // Always 200 to Mollie
  }

  const now = Date.now();
  const meta = payment.metadata ?? {};
  const userId = meta.userId;
  const plan = meta.plan;
  const customerId = meta.customerId ?? payment.customerId;
  const interval = meta.interval;
  const days = Number(meta.days ?? 31);

  if (!userId) return new Response('OK', { status: 200 });

  const status = payment.status;         // paid | failed | expired | canceled
  const seqType = payment.sequenceType;  // first | recurring | oneoff

  // ── First mandate payment paid → create recurring subscription + write entitlement ──
  if (status === 'paid' && seqType === 'first') {
    // Guard against duplicate webhook fires: skip if subscription already created for this user.
    const existingEnt = await env.DB.prepare(
      `SELECT id FROM entitlements WHERE user_id = ? AND source = 'mollie_sub' AND mollie_sub_id IS NOT NULL LIMIT 1`
    ).bind(userId).first();
    if (existingEnt) return new Response('OK', { status: 200 });

    // Start date = tomorrow
    const startDate = new Date(now + 86400000).toISOString().split('T')[0];

    let subId = null;
    try {
      // Use payment.id as idempotency key so Mollie deduplicates on its side too.
      const sub = await createSubscription({
        customerId,
        amount: payment.amount.value,
        interval,
        description: `JustFit Pro — ${plan}`,
        startDate,
        webhookUrl: 'https://app.justfit.cc/api/webhooks/mollie-consumer',
        metadata: { userId, plan, customerId },
      }, env.MOLLIE_API_KEY, payment.id);
      subId = sub.id;
    } catch (e) {
      console.error('[mollie-consumer] createSubscription failed:', e.message);
    }

    const ends_at_ms = now + days * 86400000;
    const entitlementId = crypto.randomUUID();

    await env.DB.batch([
      // Remove any existing canceled/expired entitlement for this user
      env.DB.prepare(`DELETE FROM entitlements WHERE user_id = ? AND status IN ('canceled','expired','trialing')`).bind(userId),
      // Write new active entitlement
      env.DB.prepare(
        `INSERT OR REPLACE INTO entitlements
         (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, mollie_customer_id, mollie_sub_id, created_at_ms, updated_at_ms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(entitlementId, userId, plan, 'mollie_sub', 'active', now, ends_at_ms, customerId, subId, now, now),
      // Log billing event
      env.DB.prepare(
        `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
      ).bind(crypto.randomUUID(), userId, 'payment_paid', plan, payment.id, JSON.stringify({ seq: 'first', subId }), now),
    ]);
  }

  // ── Recurring payment paid → extend entitlement ──
  else if (status === 'paid' && seqType === 'recurring') {
    const subId = payment.subscriptionId ?? meta.subId;
    const ent = await env.DB.prepare(
      `SELECT id, ends_at_ms, product_code FROM entitlements WHERE user_id = ? AND source = 'mollie_sub' LIMIT 1`
    ).bind(userId).first();

    if (ent) {
      const planCfg = { '1 month': 31, '1 year': 366 }[interval] ?? days;
      const base = Math.max(ent.ends_at_ms ?? now, now);
      const new_ends = base + planCfg * 86400000;

      await env.DB.batch([
        env.DB.prepare(`UPDATE entitlements SET status='active', ends_at_ms=?, updated_at_ms=? WHERE id=?`).bind(new_ends, now, ent.id),
        env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), userId, 'payment_paid', ent.product_code, payment.id, JSON.stringify({ seq: 'recurring', new_ends }), now),
      ]);
    }
  }

  // ── Payment failed → grace period ──
  else if (status === 'failed') {
    const ent = await env.DB.prepare(
      `SELECT id, product_code FROM entitlements WHERE user_id = ? AND source = 'mollie_sub' LIMIT 1`
    ).bind(userId).first();
    if (ent) {
      const grace_ends = now + 7 * 86400000;
      await env.DB.batch([
        env.DB.prepare(`UPDATE entitlements SET status='grace', ends_at_ms=?, updated_at_ms=? WHERE id=?`).bind(grace_ends, now, ent.id),
        env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), userId, 'payment_failed', ent.product_code, payment.id, null, now),
      ]);
      // Fire-and-forget grace alert email
      if (env.RESEND_API_KEY) {
        const authUser = await env.DB.prepare(
          `SELECT email FROM auth_users WHERE user_id = ? AND provider = 'email' LIMIT 1`
        ).bind(userId).first().catch(() => null);
        if (authUser?.email) {
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'JustFit.cc <noreply@justfit.cc>',
              to: authUser.email,
              subject: 'Betaling mislukt — je Pro-abonnement loopt nog 7 dagen',
              html: `<p>Hoi,</p><p>Je betaling voor JustFit Pro is niet gelukt. Je hebt nog 7 dagen toegang terwijl we het opnieuw proberen.</p><p>Controleer je betaalgegevens in de app (Instellingen → Account → Abonnement) om je abonnement te behouden.</p><p>— JustFit</p>`,
            }),
          }).catch(() => {});
        }
      }
    }
  }

  // ── Payment expired → cancel ──
  else if (status === 'expired') {
    const ent = await env.DB.prepare(
      `SELECT id, product_code FROM entitlements WHERE user_id = ? AND source = 'mollie_sub' LIMIT 1`
    ).bind(userId).first();
    if (ent) {
      await env.DB.batch([
        env.DB.prepare(`UPDATE entitlements SET status='expired', updated_at_ms=? WHERE id=?`).bind(now, ent.id),
        env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), userId, 'payment_failed', ent.product_code, payment.id, JSON.stringify({ reason: 'expired' }), now),
      ]);
    }
  }

  // ── Subscription canceled (via Mollie dashboard or API) ──
  else if (status === 'canceled') {
    const ent = await env.DB.prepare(
      `SELECT id, product_code, ends_at_ms FROM entitlements WHERE user_id = ? AND source = 'mollie_sub' LIMIT 1`
    ).bind(userId).first();
    if (ent) {
      await env.DB.batch([
        env.DB.prepare(`UPDATE entitlements SET status='canceled', updated_at_ms=? WHERE id=?`).bind(now, ent.id),
        env.DB.prepare(
          `INSERT INTO billing_events (id, user_id, event_type, product_code, mollie_id, payload_json, created_at_ms) VALUES (?,?,?,?,?,?,?)`
        ).bind(crypto.randomUUID(), userId, 'sub_canceled', ent.product_code, payment.id, null, now),
      ]);
    }
  }

  return new Response('OK', { status: 200 });
}

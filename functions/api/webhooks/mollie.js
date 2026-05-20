// POST /api/webhooks/mollie — Mollie payment webhook handler (P1G)
import { verifyWebhook } from '../../lib/mollie.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  if (!env.MOLLIE_API_KEY) return new Response('OK', { status: 200 }); // no-op if not configured

  let payment;
  try {
    payment = await verifyWebhook(request.clone(), env.MOLLIE_API_KEY);
  } catch (e) {
    console.error('[mollie webhook] verify failed:', e.message);
    return new Response('OK', { status: 200 }); // Always 200 to Mollie
  }

  const paymentId = payment.id;
  const status = payment.status; // 'paid' | 'failed' | 'canceled' | 'expired'
  const now = Date.now();

  // Find invoice by mollie_payment_id
  const inv = await env.DB.prepare(
    `SELECT id, gym_id_ref, status AS inv_status FROM trainer_invoices WHERE mollie_payment_id = ? LIMIT 1`
  ).bind(paymentId).first();

  if (!inv) {
    console.warn('[mollie webhook] no invoice found for payment', paymentId);
    return new Response('OK', { status: 200 });
  }

  if (status === 'paid' && inv.inv_status !== 'paid') {
    await env.DB.prepare(
      `UPDATE trainer_invoices SET status='paid', paid_at_ms=?, updated_at_ms=? WHERE id=?`
    ).bind(now, now, inv.id).run();
    await writeAudit({ gymId: inv.gym_id_ref, actorUserId: null,
      action: ACTIONS.INVOICE_PAID, targetType: 'invoice', targetId: inv.id,
      payload: { mollie_payment_id: paymentId, mollie_status: status }, request, env });
  }

  return new Response('OK', { status: 200 });
}

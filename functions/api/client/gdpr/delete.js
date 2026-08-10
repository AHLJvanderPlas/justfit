// POST /api/client/gdpr/delete — initiate or cancel GDPR deletion (P1I)
// 30-day grace period; after expiry, PII is wiped but aggregate data is retained anonymized.
import { getUser } from '../../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

const GRACE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// GDPR Art. 12: the data subject must be informed of action taken on their request.
// Fire-and-forget; guests (no email) are skipped.
async function sendDeletionEmail(env, userId, kind, expiresAtMs) {
  if (!env.RESEND_API_KEY) return;
  const row = await env.DB.prepare(`SELECT primary_email FROM users WHERE id = ? LIMIT 1`)
    .bind(userId).first().catch(() => null);
  if (!row?.primary_email) return;

  const isRequest = kind === 'requested';
  const subject = isRequest
    ? 'JustFit.cc — Account deletion scheduled'
    : 'JustFit.cc — Account deletion cancelled';
  const body = isRequest
    ? `<p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 16px;">We received your request to delete your JustFit account. Your account is scheduled for deletion on <strong style="color:#f8fafc;">${new Date(expiresAtMs).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.</p>
       <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0;">Until then you can cancel the deletion at any time from Settings &rarr; Privacy. If you did not request this, sign in and cancel it immediately, then change your password.</p>`
    : `<p style="color:#64748b;font-size:15px;line-height:1.7;margin:0;">Your JustFit account deletion has been cancelled. Your account and data remain active and unchanged.</p>`;
  const html = `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#020617;color:#f8fafc;padding:40px 32px;border-radius:16px;">
    <h1 style="font-size:20px;font-weight:900;margin:0 0 16px;">${subject.replace('JustFit.cc — ', '')}</h1>
    ${body}
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'JustFit.cc <noreply@justfit.cc>', to: [row.primary_email], subject, html }),
  }).catch(() => {});
}

export async function onRequest(context) {
  const { request, env } = context;
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  if (request.method === 'POST' && action === 'cancel') {
    await env.DB.prepare(
      `UPDATE users SET status='active', deletion_requested_at_ms=NULL, updated_at_ms=? WHERE id=?`
    ).bind(Date.now(), user.userId).run().catch(() => {});
    await writeAudit({ gymId: null, actorUserId: user.userId, action: ACTIONS.GDPR_DELETE_CANCELLED,
      targetType: 'user', targetId: user.userId, request, env });
    context.waitUntil(sendDeletionEmail(env, user.userId, 'cancelled'));
    return Response.json({ ok: true, cancelled: true });
  }

  if (request.method === 'POST') {
    const expiresAt = Date.now() + GRACE_MS;
    // Store deletion request on users row (add column if not exists — guarded update)
    await env.DB.prepare(
      `UPDATE users SET status='pending_deletion', updated_at_ms=? WHERE id=?`
    ).bind(Date.now(), user.userId).run().catch(() => {});

    await writeAudit({ gymId: null, actorUserId: user.userId, action: ACTIONS.GDPR_DELETE_REQUESTED,
      targetType: 'user', targetId: user.userId,
      payload: { expires_at_ms: expiresAt, grace_days: 30 }, request, env });

    context.waitUntil(sendDeletionEmail(env, user.userId, 'requested', expiresAt));

    return Response.json({
      ok: true,
      expires_at_ms: expiresAt,
      expires_at: new Date(expiresAt).toISOString(),
      message: 'Your account is scheduled for deletion in 30 days. You can cancel this at any time before then.',
    });
  }

  if (request.method === 'GET') {
    const u = await env.DB.prepare(`SELECT status, updated_at_ms FROM users WHERE id = ?`).bind(user.userId).first();
    return Response.json({
      status: u?.status ?? 'active',
      pending_deletion: u?.status === 'pending_deletion',
    });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

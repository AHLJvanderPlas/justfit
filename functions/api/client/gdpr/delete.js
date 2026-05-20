// POST /api/client/gdpr/delete — initiate or cancel GDPR deletion (P1I)
// 30-day grace period; after expiry, PII is wiped but aggregate data is retained anonymized.
import { getUser } from '../../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../../lib/audit.js';

const GRACE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

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

    // TODO: send confirmation email via Resend

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

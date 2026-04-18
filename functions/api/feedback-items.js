// PATCH /api/feedback-items — update status or flagged on a feedback item.
// Auth: session cookie or X-Admin-Key.

import { isAdminAuthorized, unauthorized } from './_shared/adminAuth.js';

const VALID_STATUSES = ['new', 'discard', 'react', 'fix', 'roadmap', 'resolved'];

export async function onRequestPatch({ request, env }) {
  try {
    if (!await isAdminAuthorized(request, env)) {
      return unauthorized();
    }

    const body = await request.json();
    const { id, status, flagged } = body;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const now = Date.now();
    const stmts = [];

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return Response.json({ error: 'Invalid status' }, { status: 400 });
      }
      stmts.push(
        env.DB.prepare(
          'UPDATE feedback_items SET status = ?, updated_at_ms = ? WHERE id = ?'
        ).bind(status, now, id)
      );
    }

    if (flagged !== undefined) {
      stmts.push(
        env.DB.prepare(
          'UPDATE feedback_items SET flagged = ?, updated_at_ms = ? WHERE id = ?'
        ).bind(flagged ? 1 : 0, now, id)
      );
    }

    if (!stmts.length) return Response.json({ error: 'Nothing to update' }, { status: 400 });

    await env.DB.batch(stmts);
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

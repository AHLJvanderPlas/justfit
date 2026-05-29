// GET /api/client/consent — returns DPA consent state for client's active gym membership
// POST /api/client/consent — sign DPA consent

import { getUser } from '../_shared/auth.js';

const DPA_VERSION = '1.0';

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await env.DB.prepare(`
      SELECT consent_json, assigned_trainer_user_id
      FROM gym_memberships
      WHERE user_id = ? AND role = 'client' AND status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership || !membership.assigned_trainer_user_id) {
      return Response.json({ consent_required: false, signed: false });
    }

    let consentData = null;
    try { consentData = JSON.parse(membership.consent_json || 'null'); } catch { /* ignore */ }

    return Response.json({
      consent_required: true,
      signed: !!(consentData?.dpa_signed_at_ms),
      signed_at_ms: consentData?.dpa_signed_at_ms ?? null,
      version: consentData?.dpa_version ?? null,
      current_version: DPA_VERSION,
    });
  } catch (e) {
    console.error('GET /api/client/consent', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const membership = await env.DB.prepare(`
      SELECT id, assigned_trainer_user_id
      FROM gym_memberships
      WHERE user_id = ? AND role = 'client' AND status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership || !membership.assigned_trainer_user_id) {
      return Response.json({ error: 'Geen actief trainer lidmaatschap gevonden' }, { status: 400 });
    }

    const now = Date.now();
    const consentJson = JSON.stringify({ dpa_signed_at_ms: now, dpa_version: DPA_VERSION });

    await env.DB.prepare(`
      UPDATE gym_memberships SET consent_json = ? WHERE id = ?
    `).bind(consentJson, membership.id).run();

    return Response.json({ ok: true, signed_at_ms: now, version: DPA_VERSION });
  } catch (e) {
    console.error('POST /api/client/consent', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

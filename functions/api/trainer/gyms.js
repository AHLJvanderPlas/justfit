// GET/PUT /api/trainer/gyms — read and update the caller's gym settings (P1A)
import { requireGymContext } from '../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';
import { ensureGymKey } from '../../lib/crypto.js';

export async function onRequest(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner', 'trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId, gym } = ctx;

  if (request.method === 'GET') {
    // Ensure a real encryption key exists (lazy-generate for backfilled gyms)
    if (gym.encryption_key_enc === 'PENDING_KEY_GENERATION' && env.GYM_MASTER_KEK) {
      await ensureGymKey(gym, env);
    }
    return Response.json({
      id: gym.id,
      slug: gym.slug,
      name: gym.name,
      type: gym.type,
      kvk_number: gym.kvk_number,
      vat_number: gym.vat_number,
      iban: gym.iban,
      address_json: gym.address_json ? JSON.parse(gym.address_json) : null,
      kor_active: !!gym.kor_active,
      subscription_tier: gym.subscription_tier,
      dpa_acknowledged_at_ms: gym.dpa_acknowledged_at_ms,
      dpa_version: gym.dpa_version,
    });
  }

  if (request.method === 'PUT') {
    if (ctx.role !== 'owner') {
      return Response.json({ error: 'Only owners can update gym settings' }, { status: 403 });
    }
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { name, kvk_number, vat_number, iban, address, kor_active } = body;
    const now = Date.now();
    await env.DB.prepare(
      `UPDATE gyms SET name=COALESCE(?,name), kvk_number=COALESCE(?,kvk_number),
       vat_number=COALESCE(?,vat_number), iban=COALESCE(?,iban),
       address_json=COALESCE(?,address_json), kor_active=COALESCE(?,kor_active),
       updated_at_ms=? WHERE id=?`
    ).bind(name ?? null, kvk_number ?? null, vat_number ?? null, iban ?? null,
           address ? JSON.stringify(address) : null,
           kor_active != null ? (kor_active ? 1 : 0) : null,
           now, gymId).run();

    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.GYM_UPDATED, targetType: 'gym', targetId: gymId, request, env });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

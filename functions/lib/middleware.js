// functions/lib/middleware.js
// requireGymContext — verifies JWT and gym membership.
// Returns { user, gymId, role, gym } on success, or a Response on failure.

import { getUser } from '../api/_shared/auth.js';

/**
 * @param {Request} request
 * @param {object} env
 * @param {string[]} allowedRoles - e.g. ['owner','trainer']
 * @param {string|null} gymIdOverride - if null, reads from X-Gym-Id header or ?gymId= query param
 * @returns {Promise<{user, gymId, role, gym} | Response>}
 */
export async function requireGymContext(request, env, allowedRoles = ['owner', 'trainer']) {
  const user = await getUser(request, env);
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const gymId = request.headers.get('X-Gym-Id') ?? url.searchParams.get('gymId');
  if (!gymId) {
    return Response.json({ error: 'gym_context_required', detail: 'X-Gym-Id header missing' }, { status: 403 });
  }

  const membership = await env.DB.prepare(
    `SELECT gm.role, gm.status, g.id, g.slug, g.name, g.type, g.owner_user_id,
            g.kvk_number, g.vat_number, g.iban, g.address_json, g.encryption_key_enc,
            g.kor_active, g.subscription_tier, g.dpa_acknowledged_at_ms, g.dpa_version
     FROM gym_memberships gm
     JOIN gyms g ON g.id = gm.gym_id
     WHERE gm.gym_id = ? AND gm.user_id = ? AND gm.status = 'active'
     LIMIT 1`
  ).bind(gymId, user.userId).first();

  if (!membership) {
    return Response.json({ error: 'gym_context_required', detail: 'No active membership for this gym' }, { status: 403 });
  }

  if (!allowedRoles.includes(membership.role)) {
    return Response.json({
      error: 'insufficient_role',
      detail: `Required: ${allowedRoles.join(' or ')}, got: ${membership.role}`,
    }, { status: 403 });
  }

  const gym = {
    id: membership.id,
    slug: membership.slug,
    name: membership.name,
    type: membership.type,
    owner_user_id: membership.owner_user_id,
    kvk_number: membership.kvk_number,
    vat_number: membership.vat_number,
    iban: membership.iban,
    address_json: membership.address_json,
    encryption_key_enc: membership.encryption_key_enc,
    kor_active: membership.kor_active,
    subscription_tier: membership.subscription_tier,
    dpa_acknowledged_at_ms: membership.dpa_acknowledged_at_ms,
    dpa_version: membership.dpa_version,
  };

  return { user, gymId, role: membership.role, gym };
}

/** Convenience: require client membership (role=client). */
export async function requireClientContext(request, env) {
  return requireGymContext(request, env, ['client', 'owner', 'trainer']);
}

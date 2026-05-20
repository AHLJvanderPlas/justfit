// GET/PUT /api/client/disclosures — client manages their own disclosure profiles (P1B)
import { getUser } from '../_shared/auth.js';
import { unwrapGymKey, encryptField } from '../../lib/crypto.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (request.method === 'GET') {
    const url = new URL(request.url);
    const gymId = url.searchParams.get('gymId');
    if (gymId) {
      const disc = await env.DB.prepare(
        `SELECT id, gym_id, level, display_name, photo_r2_key, billing_country,
                share_training_history, share_checkins, share_pain_rpe, share_body_metrics,
                share_detailed_adherence, email_verified, phone_verified,
                consented_at_ms, consent_purpose, updated_at_ms
         FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
      ).bind(user.userId, gymId).first();
      return disc ? Response.json(disc) : Response.json(null, { status: 404 });
    }
    // List all disclosures
    const rows = await env.DB.prepare(
      `SELECT td.id, td.gym_id, g.name AS gym_name, td.level, td.display_name,
              td.share_training_history, td.share_checkins, td.share_pain_rpe,
              td.share_body_metrics, td.share_detailed_adherence,
              td.consented_at_ms, td.updated_at_ms
       FROM trainer_disclosures td
       JOIN gyms g ON g.id = td.gym_id
       WHERE td.user_id = ? ORDER BY td.updated_at_ms DESC`
    ).bind(user.userId).all();
    return Response.json(rows.results ?? []);
  }

  if (request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { gym_id, level, display_name, billing_country, shares,
            real_name_first, real_name_last, billing_name, billing_address,
            billing_postal, billing_city, billing_vat, contact_email, contact_phone } = body;
    if (!gym_id) return Response.json({ error: 'gym_id required' }, { status: 400 });

    // Verify caller is connected to this gym
    const mem = await env.DB.prepare(
      `SELECT 1 FROM gym_memberships WHERE gym_id = ? AND user_id = ? AND status = 'active' LIMIT 1`
    ).bind(gym_id, user.userId).first();
    if (!mem) return Response.json({ error: 'Not a member of this gym' }, { status: 403 });

    // Fetch gym for encryption key
    const gym = await env.DB.prepare(
      `SELECT encryption_key_enc FROM gyms WHERE id = ? LIMIT 1`
    ).bind(gym_id).first();
    if (!gym) return Response.json({ error: 'Gym not found' }, { status: 404 });

    let gymKey = null;
    if (gym.encryption_key_enc !== 'PENDING_KEY_GENERATION' && env.GYM_MASTER_KEK) {
      try { gymKey = await unwrapGymKey(gym.encryption_key_enc, env.GYM_MASTER_KEK); } catch {}
    }

    const now = Date.now();
    // Encrypt PII fields (only if gym key available)
    const enc = async (v) => gymKey && v != null ? encryptField(v, gymKey) : null;

    const [rnfEnc, rnlEnc, bnEnc, baEnc, bpEnc, bcEnc, bvEnc, ceEnc, cpEnc] = await Promise.all([
      enc(real_name_first), enc(real_name_last), enc(billing_name),
      enc(billing_address), enc(billing_postal), enc(billing_city),
      enc(billing_vat), enc(contact_email), enc(contact_phone),
    ]);

    const existing = await env.DB.prepare(
      `SELECT id, level FROM trainer_disclosures WHERE user_id = ? AND gym_id = ? LIMIT 1`
    ).bind(user.userId, gym_id).first();

    if (existing) {
      await env.DB.prepare(
        `UPDATE trainer_disclosures SET
           level=COALESCE(?,level), display_name=COALESCE(?,display_name),
           billing_country=COALESCE(?,billing_country),
           real_name_first_enc=COALESCE(?,real_name_first_enc),
           real_name_last_enc=COALESCE(?,real_name_last_enc),
           billing_name_enc=COALESCE(?,billing_name_enc),
           billing_address_enc=COALESCE(?,billing_address_enc),
           billing_postal_enc=COALESCE(?,billing_postal_enc),
           billing_city_enc=COALESCE(?,billing_city_enc),
           billing_vat_enc=COALESCE(?,billing_vat_enc),
           contact_email_enc=COALESCE(?,contact_email_enc),
           contact_phone_enc=COALESCE(?,contact_phone_enc),
           share_training_history=COALESCE(?,share_training_history),
           share_checkins=COALESCE(?,share_checkins),
           share_pain_rpe=COALESCE(?,share_pain_rpe),
           share_body_metrics=COALESCE(?,share_body_metrics),
           share_detailed_adherence=COALESCE(?,share_detailed_adherence),
           updated_at_ms=? WHERE user_id=? AND gym_id=?`
      ).bind(level ?? null, display_name ?? null, billing_country ?? null,
             rnfEnc, rnlEnc, bnEnc, baEnc, bpEnc, bcEnc, bvEnc, ceEnc, cpEnc,
             shares?.training_history != null ? (shares.training_history ? 1 : 0) : null,
             shares?.checkins != null ? (shares.checkins ? 1 : 0) : null,
             shares?.pain_rpe != null ? (shares.pain_rpe ? 1 : 0) : null,
             shares?.body_metrics != null ? (shares.body_metrics ? 1 : 0) : null,
             shares?.detailed_adherence != null ? (shares.detailed_adherence ? 1 : 0) : null,
             now, user.userId, gym_id).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO trainer_disclosures (id, user_id, gym_id, level, display_name,
         billing_country, real_name_first_enc, real_name_last_enc, billing_name_enc,
         billing_address_enc, billing_postal_enc, billing_city_enc, billing_vat_enc,
         contact_email_enc, contact_phone_enc,
         share_training_history, share_checkins, share_pain_rpe,
         share_body_metrics, share_detailed_adherence,
         consented_at_ms, consent_purpose, created_at_ms, updated_at_ms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(crypto.randomUUID(), user.userId, gym_id, level ?? 'L1',
             display_name ?? `User-${user.userId.slice(-6).toUpperCase()}`,
             billing_country ?? null, rnfEnc, rnlEnc, bnEnc, baEnc, bpEnc, bcEnc, bvEnc, ceEnc, cpEnc,
             shares?.training_history ? 1 : 0, shares?.checkins ? 1 : 0, 1,
             shares?.body_metrics ? 1 : 0, 1,
             now, body.consent_purpose ?? 'client-connection', now, now).run();
    }

    await writeAudit({ gymId: gym_id, actorUserId: user.userId,
      action: existing ? ACTIONS.DISCLOSURE_UPDATED : ACTIONS.DISCLOSURE_CREATED,
      targetType: 'disclosure', targetId: `${user.userId}:${gym_id}`,
      payload: { level: level ?? existing?.level }, request, env });

    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}

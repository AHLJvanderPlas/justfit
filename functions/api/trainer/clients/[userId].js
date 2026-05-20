// GET /api/trainer/clients/:userId — single client detail + Person Card (P1B)
import { requireGymContext } from '../../../lib/middleware.js';
import { unwrapGymKey, decryptField } from '../../../lib/crypto.js';

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId, gym } = ctx;
  const { userId } = params;

  const disc = await env.DB.prepare(
    `SELECT td.*, ci.goals_json, ci.experience_level, ci.injuries_json,
            ci.contraindications_json, ci.completed_at_ms AS intake_completed_at_ms,
            ci.version AS intake_version
     FROM trainer_disclosures td
     LEFT JOIN client_intake ci ON ci.user_id = td.user_id AND ci.gym_id = td.gym_id
     WHERE td.user_id = ? AND td.gym_id = ? LIMIT 1`
  ).bind(userId, gymId).first();

  if (!disc) return Response.json({ error: 'Client not found' }, { status: 404 });

  let gymKey = null;
  if (gym.encryption_key_enc && gym.encryption_key_enc !== 'PENDING_KEY_GENERATION' && env.GYM_MASTER_KEK) {
    try { gymKey = await unwrapGymKey(gym.encryption_key_enc, env.GYM_MASTER_KEK); } catch {}
  }

  const level = disc.level ?? 'L1';
  const card = {
    handle: 'u_' + userId.slice(-6).toLowerCase(),
    user_id: userId,
    display_name: disc.display_name,
    photo_url: disc.photo_r2_key ? `https://assets.justfit.cc/${disc.photo_r2_key}` : null,
    level,
    verified: disc.email_verified === 1 || disc.phone_verified === 1,
    billable: ['L3','L4'].includes(level),
    contact: null,
    billing: null,
    shares: {
      checkins: disc.share_checkins === 1,
      pain_rpe: disc.share_pain_rpe === 1,
      body_metrics: disc.share_body_metrics === 1,
      training_history: disc.share_training_history === 1,
      detailed_adherence: disc.share_detailed_adherence === 1,
    },
    intake: disc.intake_completed_at_ms ? {
      goals: disc.goals_json ? JSON.parse(disc.goals_json) : [],
      experience_level: disc.experience_level,
      injuries: disc.injuries_json ? JSON.parse(disc.injuries_json) : [],
      contraindications: disc.contraindications_json ? JSON.parse(disc.contraindications_json) : [],
      version: disc.intake_version,
      completed_at_ms: disc.intake_completed_at_ms,
    } : null,
  };

  if (gymKey && ['L3','L4'].includes(level)) {
    const [billingName, billingAddr, billingPostal, billingCity, billingVat] = await Promise.all([
      decryptField(disc.billing_name_enc, gymKey),
      decryptField(disc.billing_address_enc, gymKey),
      decryptField(disc.billing_postal_enc, gymKey),
      decryptField(disc.billing_city_enc, gymKey),
      decryptField(disc.billing_vat_enc, gymKey),
    ]);
    card.billing = { name: billingName, address: billingAddr, postal: billingPostal, city: billingCity, country: disc.billing_country, vat: billingVat };
  }

  if (gymKey && level === 'L4') {
    const [email, phone] = await Promise.all([
      decryptField(disc.contact_email_enc, gymKey),
      decryptField(disc.contact_phone_enc, gymKey),
    ]);
    card.contact = { email, phone };
  }

  return Response.json(card);
}

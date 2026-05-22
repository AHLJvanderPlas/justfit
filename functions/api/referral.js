// ─── REFERRAL API ─────────────────────────────────────────────────────────────
// GET  /api/referral        → get or create caller's referral code + stats
// POST /api/referral        → { action: 'redeem', code } — redeem a friend's code
//
// Reward model: referred user + referrer each get 14 days Pro on redeem.
// referral_codes table has a legacy FK bug (references users(user_id) instead of
// users(id)) — FK is not enforced by D1, so plain INSERT/SELECT works fine.

import { getUser } from './_shared/auth.js';

const REWARD_DAYS = 14;
const REWARD_PRODUCT = 'pro_consumer';

// Deterministic referral code from user ID (8 uppercase chars, no confusable chars)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
async function deriveCode(userId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId));
  const bytes = new Uint8Array(buf);
  return 'JF' + Array.from(bytes.slice(0, 6))
    .map(b => CODE_CHARS[b % CODE_CHARS.length])
    .join('');
}

async function getOrCreate(userId, db) {
  let row = await db.prepare('SELECT code FROM referral_codes WHERE user_id = ? LIMIT 1').bind(userId).first();
  if (!row) {
    const code = await deriveCode(userId);
    await db.prepare('INSERT OR IGNORE INTO referral_codes (user_id, code) VALUES (?, ?)').bind(userId, code).run();
    row = { code };
  }
  return row.code;
}

export async function onRequestGet(ctx) {
  try {
    const user = await getUser(ctx.request, ctx.env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = ctx.env.DB;

    const code = await getOrCreate(user.userId, db);

    // Stats: count referrals where this user is the referrer via their code
    const stats = await db.prepare(
      `SELECT status, COUNT(*) AS n FROM referrals WHERE code = ? GROUP BY status`
    ).bind(code).all();
    const counts = {};
    (stats.results ?? []).forEach(r => { counts[r.status] = r.n; });

    return Response.json({
      ok: true,
      code,
      stats: {
        total: Object.values(counts).reduce((s, n) => s + n, 0),
        qualified: (counts.signed_up ?? 0) + (counts.qualified ?? 0),
        rewarded: counts.rewarded ?? 0,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost(ctx) {
  try {
    const user = await getUser(ctx.request, ctx.env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await ctx.request.json();
    const db = ctx.env.DB;

    if (body.action === 'redeem') {
      const code = (body.code ?? '').trim().toUpperCase();
      if (!code) return Response.json({ error: 'Code required' }, { status: 400 });

      // Find the referrer by code
      const codeRow = await db.prepare('SELECT user_id FROM referral_codes WHERE code = ? LIMIT 1').bind(code).first();
      if (!codeRow) return Response.json({ error: 'Invalid referral code' }, { status: 404 });

      const referrerUserId = codeRow.user_id;
      if (referrerUserId === user.userId) {
        return Response.json({ error: 'You cannot use your own referral code' }, { status: 400 });
      }

      // Check if this user has already redeemed any referral code
      const existing = await db.prepare(
        `SELECT id FROM referrals WHERE referred_user_id = ? LIMIT 1`
      ).bind(user.userId).first();
      if (existing) return Response.json({ error: 'You have already redeemed a referral code' }, { status: 409 });

      const now = Date.now();
      const referralId = crypto.randomUUID();
      const rewardEnds = now + REWARD_DAYS * 24 * 60 * 60 * 1000;

      await db.batch([
        // Record the referral
        db.prepare(`INSERT INTO referrals
          (id, referrer_user_id, referred_user_id, code, status, issued_at_ms, signed_up_at_ms, rewarded_at_ms, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, ?, 'rewarded', ?, ?, ?, ?, ?)`)
          .bind(referralId, referrerUserId, user.userId, code, now, now, now, now, now),

        // Grant Pro to referred user
        db.prepare(`INSERT INTO entitlements
          (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'referral', 'active', ?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), user.userId, REWARD_PRODUCT, now, rewardEnds, now, now),

        // Grant Pro to referrer
        db.prepare(`INSERT INTO entitlements
          (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'referral', 'active', ?, ?, ?, ?)`)
          .bind(crypto.randomUUID(), referrerUserId, REWARD_PRODUCT, now, rewardEnds, now, now),
      ]);

      return Response.json({ ok: true, days_added: REWARD_DAYS });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

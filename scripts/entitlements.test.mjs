// isProUser — the one Pro check every Pages Function uses (F8).
// Run: node --test scripts/entitlements.test.mjs
//
// Drives the real query against node:sqlite carrying the LIVE entitlements DDL
// (sqlite_master, 2026-10-04; FK omitted). Each row is a shape the billing code
// writes — see the header of functions/api/_shared/entitlements.js. `source` uses
// values the live CHECK allows; isProUser does not read it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { isProUser } from '../functions/api/_shared/entitlements.js';

const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE "entitlements" (
    id           TEXT    PRIMARY KEY,
    user_id      TEXT    NOT NULL,
    product_code TEXT    NOT NULL,
    source       TEXT    NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other','trial',
                                   'mollie_sub','trainer_grant','manual_grant')),
    status       TEXT    NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','trialing','grace','canceled','expired')),
    starts_at_ms INTEGER NOT NULL,
    ends_at_ms   INTEGER,
    renews_at_ms INTEGER,
    external_ref TEXT,
    meta_json    TEXT,
    mollie_customer_id TEXT,
    mollie_sub_id      TEXT,
    created_at_ms INTEGER NOT NULL,
    updated_at_ms INTEGER NOT NULL,
    CHECK (length(product_code) <= 128),
    CHECK (external_ref IS NULL OR length(external_ref) <= 256),
    CHECK (meta_json IS NULL OR json_valid(meta_json))
  ) STRICT;
`);
const env = {
  DB: {
    prepare(sql) {
      let args = [];
      return {
        bind(...a) { args = a; return this; },
        async first() { return db.prepare(sql).get(...args) ?? null; },
      };
    },
  },
};

const NOW = 1_790_000_000_000;
const DAY = 86_400_000;
// [user, product_code, source, status, ends_at_ms, expected, why]
const CASES = [
  ['paid-monthly',  'pro_monthly',    'other',    'active',    NOW + 30 * DAY, true,  'a paying Mollie subscriber (product_code is the plan key)'],
  ['paid-eb-grace', 'pro_annual_eb',  'other',    'grace',     NOW + 7 * DAY,  true,  'a failed renewal in its 7-day grace window — the email promises access'],
  ['trial-live',    'pro_trial',      'trial',    'trialing',  NOW + 5 * DAY,  true,  'the signup trial'],
  ['referral',      'pro_consumer',   'referral', 'active',    NOW + 14 * DAY, true,  'a referral reward'],
  ['trial-over',    'pro_trial',      'trial',    'trialing',  NOW - DAY,      false, 'a trial that ended'],
  ['grace-over',    'pro_monthly',    'other',    'grace',     NOW - 1,        false, 'grace that ran out'],
  ['ends-now',      'pro_monthly',    'other',    'active',    NOW,            false, 'the window is exclusive at ends_at_ms'],
  ['canceled',      'pro_monthly',    'other',    'canceled',  NOW + 20 * DAY, false, 'canceled, even with time left on the row'],
  ['expired',       'pro_monthly',    'other',    'expired',   NOW + 20 * DAY, false, 'expired'],
  ['guest',         'justfit_trial',  'manual',   'trialing',  null,           false, 'a guest account (no window)'],
  // Behaviour as of F8, not an endorsement: the admin "grant Pro" writes
  // ends_at_ms NULL and therefore does not grant Pro anywhere in this app.
  ['admin-grant',   'pro_consumer',   'manual',   'active',    null,           false, 'an open-ended admin grant (see the F8 report)'],
];
const ins = db.prepare(`INSERT INTO entitlements (id, user_id, product_code, source, status, starts_at_ms, ends_at_ms, created_at_ms, updated_at_ms)
  VALUES (?,?,?,?,?,?,?,?,?)`);
for (const [user, code, source, status, ends] of CASES) ins.run(`ent-${user}`, user, code, source, status, NOW - 40 * DAY, ends, NOW, NOW);

test('isProUser: every entitlement shape the billing code writes', async () => {
  for (const [user, , , , , expected, why] of CASES) {
    assert.equal(await isProUser(env, user, NOW), expected, `${user}: ${why}`);
  }
});

test('isProUser: no user, or a user without rows, is not Pro', async () => {
  assert.equal(await isProUser(env, null, NOW), false);
  assert.equal(await isProUser(env, 'nobody', NOW), false);
});

test('isProUser: any one live row is enough', async () => {
  ins.run('ent-mixed-old', 'mixed', 'pro_trial', 'trial', 'trialing', NOW - 40 * DAY, NOW - 26 * DAY, NOW, NOW);
  ins.run('ent-mixed-new', 'mixed', 'pro_monthly', 'other', 'active', NOW - DAY, NOW + 30 * DAY, NOW, NOW);
  assert.equal(await isProUser(env, 'mixed', NOW), true);
});

// 0121 — the three sources the live writers use must be insertable. The old CHECK
// rejected all three and INSERT OR IGNORE was not in play: a paying Mollie
// customer's first-payment row threw. Control: the pre-0121 CHECK must refuse them,
// so this test fails if someone "simplifies" the DDL above back to the old list.
test('0121: mollie_sub, trainer_grant and manual_grant are insertable; the old CHECK refused them', () => {
  for (const src of ['mollie_sub', 'trainer_grant', 'manual_grant']) {
    ins.run(`ent-0121-${src}`, `u-${src}`, 'pro_monthly', src, 'active', NOW - DAY, NOW + 30 * DAY, NOW, NOW);
  }
  const old = new DatabaseSync(':memory:');
  old.exec(`CREATE TABLE entitlements (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_code TEXT NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('stripe','apple','google','voucher','manual','referral','other','trial')),
    status TEXT NOT NULL, starts_at_ms INTEGER NOT NULL, ends_at_ms INTEGER, created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL) STRICT`);
  const oldIns = old.prepare(`INSERT INTO entitlements VALUES (?,?,?,?,?,?,?,?,?)`);
  for (const src of ['mollie_sub', 'trainer_grant', 'manual_grant']) {
    assert.throws(() => oldIns.run(`x-${src}`, 'u', 'pro_monthly', src, 'active', 1, 2, 1, 1), /CHECK/, `old CHECK should refuse ${src}`);
  }
});


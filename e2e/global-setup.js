/**
 * Playwright globalSetup — runs once before all E2E tests.
 * Applies local D1 schema patches and seeds deterministic fixture data
 * used by journey-extra.spec.js.
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const CWD = '/Users/alexander/Documents/Projects/justfit/justfit-app';

function localSql(sql, label) {
  const f = join(tmpdir(), `jf-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  try {
    writeFileSync(f, sql, 'utf8');
    execSync(`npx wrangler d1 execute justfit-db --local --file ${f}`, {
      cwd: CWD, stdio: 'pipe',
    });
  } catch (e) {
    const out = (e.stderr?.toString() ?? '') + (e.stdout?.toString() ?? '');
    if (out.includes('duplicate column') || out.includes('already exists') || out.includes('table already exists')) return;
    console.warn(`[e2e-setup] ${label}: ${out.slice(0, 400)}`);
  } finally {
    try { unlinkSync(f); } catch { /* ignore */ }
  }
}

export default async function globalSetup() {
  // ── 1. Schema patches (idempotent — errors on dup column are silenced) ───
  localSql(`
    ALTER TABLE gyms ADD COLUMN trainer_token TEXT;
    ALTER TABLE gyms ADD COLUMN sub_status TEXT;
    ALTER TABLE gyms ADD COLUMN sub_tier TEXT;
    ALTER TABLE gyms ADD COLUMN sub_ends_at_ms INTEGER;
  `, 'gyms-cols');

  localSql(`
    CREATE TABLE IF NOT EXISTS trainer_switch_requests (
      id                   TEXT PRIMARY KEY,
      gym_id               TEXT NOT NULL,
      client_user_id       TEXT NOT NULL,
      from_trainer_user_id TEXT,
      to_trainer_user_id   TEXT NOT NULL,
      initiated_by         TEXT NOT NULL DEFAULT 'client',
      client_message       TEXT,
      status               TEXT NOT NULL DEFAULT 'pending',
      decided_by_user_id   TEXT,
      decline_reason       TEXT,
      created_at_ms        INTEGER NOT NULL,
      decided_at_ms        INTEGER
    );
    CREATE TABLE IF NOT EXISTS support_requests (
      id                   TEXT PRIMARY KEY,
      gym_id               TEXT NOT NULL,
      client_user_id       TEXT NOT NULL,
      message              TEXT NOT NULL,
      broadcast            INTEGER NOT NULL DEFAULT 0,
      status               TEXT NOT NULL DEFAULT 'open',
      accepted_by_user_id  TEXT,
      reply_message        TEXT,
      created_at_ms        INTEGER NOT NULL,
      accepted_at_ms       INTEGER,
      resolved_at_ms       INTEGER
    );
  `, 'switch-support-tables');

  localSql(`
    ALTER TABLE gym_memberships ADD COLUMN consent_json TEXT;
    ALTER TABLE gym_memberships ADD COLUMN conv_unread_client INTEGER DEFAULT 0;
    ALTER TABLE gym_memberships ADD COLUMN trainer_message TEXT;
    ALTER TABLE gym_memberships ADD COLUMN trainer_message_sent_at_ms INTEGER;
    ALTER TABLE gym_memberships ADD COLUMN support_trainer_user_id TEXT;
    ALTER TABLE gym_memberships ADD COLUMN goal_override TEXT;
    ALTER TABLE gym_memberships ADD COLUMN intensity_modifier INTEGER DEFAULT 0;
    ALTER TABLE gym_memberships ADD COLUMN training_days_json TEXT;
    ALTER TABLE gym_memberships ADD COLUMN conv_unread_trainer INTEGER DEFAULT 0;
    ALTER TABLE gym_memberships ADD COLUMN conv_last_msg_at_ms INTEGER;
  `, 'gm-cols');

  // ── 1b. Cleanup accumulated test state ───────────────────────────────────
  // Each run of Journey 6 inserts an ACTIVE gym_membership in e2e-gym-open (unique per user).
  // After free_tier_client_limit runs the open gym appears full to Journeys 3 and 5.
  // Journey 2 (guest_signup) hits isRateLimited after 5 runs via the 'guest:ip:unknown' bucket.
  localSql(`
    DELETE FROM gym_memberships WHERE gym_id IN ('e2e-gym-open', 'e2e-gym-full') AND role = 'client';
    DELETE FROM auth_rate_limits WHERE bucket LIKE 'guest:ip:%';
  `, 'cleanup-test-state');

  // ── 2. Seed fixture data ─────────────────────────────────────────────────
  localSql(`
    -- Fixture trainer user
    INSERT OR IGNORE INTO users (id, status, primary_email, created_at_ms, updated_at_ms)
    VALUES ('e2e-trainer-usr', 'active', 'e2e-trainer@justfit.cc', 1, 1);

    -- Trainer profile (needed for consent gate: CoachView only shows gate when assignedTrainer != null)
    INSERT OR IGNORE INTO trainer_profiles (user_id, display_name, updated_at_ms)
    VALUES ('e2e-trainer-usr', 'E2E Trainer', 1);

    -- Gym: open (limit=10, FIT-e2etopen)
    INSERT OR IGNORE INTO gyms (
      id, slug, name, type, owner_user_id,
      trainer_token, sub_tier, sub_status, subscription_tier, subscription_status,
      free_tier_client_limit, model, switch_auto_approve, encryption_key_enc,
      created_at_ms, updated_at_ms
    ) VALUES (
      'e2e-gym-open', 'e2e-gym-open', 'E2E Gym Open', 'solo', 'e2e-trainer-usr',
      'e2etopen', 'starter', 'trialing', 'starter', 'active',
      10, 'staff', 0, 'E2E_PENDING_KEY',
      1, 1
    );
    -- Patch trainer_token in case gym row was inserted before column existed
    UPDATE gyms SET trainer_token='e2etopen', sub_tier='starter', sub_status='trialing'
    WHERE id='e2e-gym-open';

    -- Gym: full (limit=0, FIT-e2etfull)
    INSERT OR IGNORE INTO gyms (
      id, slug, name, type, owner_user_id,
      trainer_token, sub_tier, sub_status, subscription_tier, subscription_status,
      free_tier_client_limit, model, switch_auto_approve, encryption_key_enc,
      created_at_ms, updated_at_ms
    ) VALUES (
      'e2e-gym-full', 'e2e-gym-full', 'E2E Gym Full', 'solo', 'e2e-trainer-usr',
      'e2etfull', 'starter', 'trialing', 'starter', 'active',
      0, 'staff', 0, 'E2E_PENDING_KEY',
      1, 1
    );
    UPDATE gyms SET trainer_token='e2etfull', sub_tier='starter', sub_status='trialing', free_tier_client_limit=0
    WHERE id='e2e-gym-full';

    -- Owner memberships
    INSERT OR IGNORE INTO gym_memberships (
      id, gym_id, user_id, role, status, created_at_ms, updated_at_ms
    ) VALUES
      ('e2e-gm-owner-open', 'e2e-gym-open', 'e2e-trainer-usr', 'owner', 'active', 1, 1),
      ('e2e-gm-owner-full', 'e2e-gym-full', 'e2e-trainer-usr', 'owner', 'active', 1, 1);

    -- Trainer invite: reset to pending on every setup run
    INSERT OR REPLACE INTO trainer_invites (id, gym_id, email, invite_token, status, created_at, expires_at)
    VALUES ('e2e-invite', 'e2e-gym-open', 'e2e-invited@justfit.cc', 'e2einvite12345678', 'pending', 1, 9999999999999);
  `, 'seed-data');

  console.log('[e2e-setup] Schema patches and fixture data applied.');
}

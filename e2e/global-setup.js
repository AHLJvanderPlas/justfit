/**
 * Playwright globalSetup — runs once before all E2E tests.
 * Applies local D1 schema patches and seeds deterministic fixture data
 * used by journey-extra.spec.js.
 */

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
// The repo root, derived from this file — not a hardcoded absolute path. Two review
// agents could not run the e2e gate from a git worktree because this pointed at the
// main checkout: fixtures went into one local D1 while the server read another.
const CWD = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// The e2e suite gets its OWN local D1, wiped and rebuilt from the baseline on
// every run. Until 2026-10-04 it shared the developer's local database, which in
// the main checkout was a months-old artefact carrying columns production does
// not have — so the gate passed there and nowhere else, and tested a schema
// that was not production's. playwright.config.js passes the same path to
// `wrangler pages dev --persist-to`, so the server reads what this seeds.
export const PERSIST = join(CWD, '.wrangler', 'e2e-state');

function localSql(sql, label) {
  const f = join(tmpdir(), `jf-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  try {
    writeFileSync(f, sql, 'utf8');
    execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --file ${f}`, {
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
  // Always start from nothing and build production's schema from the baseline,
  // which scripts/generate-baseline-schema.mjs regenerates from live sqlite_master.
  // If the suite passes here, it passed against production's schema.
  //
  // Reset by SQL, never by deleting files: Playwright starts the web server
  // BEFORE globalSetup, so the server already has this database open. Deleting
  // the directory under it left every journey timing out on its first navigation.
  // Tables are dropped in reverse creation order so children go before parents.
  try {
    const out = execSync(
      `npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --json --command "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf%' ORDER BY rowid DESC"`,
      { cwd: CWD, stdio: 'pipe' }).toString();
    const names = (JSON.parse(out)[0]?.results ?? []).map(r => r.name);
    if (names.length) {
      localSql('PRAGMA foreign_keys = OFF;\n' + names.map(n => `DROP TABLE IF EXISTS "${n}";`).join('\n'), 'drop-all');
      console.log(`[e2e-setup] dropped ${names.length} table(s) from the previous run`);
    }
  } catch { /* an empty database has nothing to drop */ }
  console.log('[e2e-setup] bootstrapping the e2e D1 from migrations/baseline');
  for (const f of ['migrations/baseline/1010_schema_training.sql', 'migrations/baseline/1000_schema_core.sql',
                   'migrations/baseline/1020_seed_exercises.sql', 'migrations/baseline/1030_seed_cycling.sql',
                   'migrations/baseline/1040_seed_military.sql']) {
    execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --file ${f}`, { cwd: CWD, stdio: 'pipe' });
  }

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
      id, slug, name, owner_user_id,
      trainer_token, sub_tier, sub_status,
      free_tier_client_limit, model, switch_auto_approve, encryption_key_enc,
      created_at_ms, updated_at_ms
    ) VALUES (
      'e2e-gym-open', 'e2e-gym-open', 'E2E Gym Open', 'e2e-trainer-usr',
      'e2etopen', 'starter', 'trialing',
      10, 'staff', 0, 'E2E_PENDING_KEY',
      1, 1
    );

    -- Gym: full (limit=0, FIT-e2etfull)
    INSERT OR IGNORE INTO gyms (
      id, slug, name, owner_user_id,
      trainer_token, sub_tier, sub_status,
      free_tier_client_limit, model, switch_auto_approve, encryption_key_enc,
      created_at_ms, updated_at_ms
    ) VALUES (
      'e2e-gym-full', 'e2e-gym-full', 'E2E Gym Full', 'e2e-trainer-usr',
      'e2etfull', 'starter', 'trialing',
      0, 'staff', 0, 'E2E_PENDING_KEY',
      1, 1
    );

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

  console.log('[e2e-setup] Baseline bootstrapped and fixture data applied.');
}

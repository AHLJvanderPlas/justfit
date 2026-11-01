/**
 * Journey 8 (C-E19b): billing gates for free users —
 * (a) a trialing signup may pick Cycling; after the trial expires the tile is Pro-locked
 *     and routes to the ProGate wall (UAT D5);
 * (b) GET /api/subscribe reports the correct free/trial entitlement state.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { signupFresh } from './helpers.js';
import { PERSIST } from './global-setup.js';

const CWD = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// UAT D5 — the entitlement used to be fetched only after an existing profile loaded, so a
// day-1 trial user saw Cycling locked and a paywall saying "Je hebt al een actief abonnement".
test('trial user — Cycling is open on day 1; once the trial expires it shows the Pro lock and the upgrade wall', async ({ page }) => {
  await signupFresh(page, '-bill');

  // Trialing (Pro): the Cycling tile is NOT locked and opens its follow-up.
  const cyclingTile = page.getByRole('button', { name: /CYCLING/i });
  await expect(cyclingTile).toBeVisible({ timeout: 10_000 });
  await expect(cyclingTile).not.toContainText('Pro vereist');
  await cyclingTile.click();
  await expect(page.getByRole('button', { name: /Build fitness/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /Race fitness/ })).toBeVisible();
  await expect(page.getByText(/JUSTFIT\s*PRO/)).toHaveCount(0);

  // Expire the trial in the suite's own local D1 (the one wrangler pages dev serves).
  const uid = await page.evaluate(() => localStorage.getItem('jf_user_id'));
  expect(uid).toMatch(/^[0-9a-f-]{36}$/);
  execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --command "UPDATE entitlements SET ends_at_ms = 1, status = 'expired' WHERE user_id = '${uid}'"`,
    { cwd: CWD, stdio: 'pipe' });
  expect((await (await page.request.get('/api/subscribe')).json()).isPro).toBe(false);
  await page.reload();

  // Known not-Pro: locked, and the tile routes to the ProGate upgrade wall.
  const lockedTile = page.getByRole('button', { name: /CYCLING/i });
  await expect(lockedTile).toContainText('Pro vereist', { timeout: 15_000 });
  await lockedTile.click();
  await expect(page.getByText(/JUSTFIT\s*PRO/)).toBeVisible({ timeout: 10_000 });
});

test('free user — GET /api/subscribe reports non-Pro entitlement state', async ({ page }) => {
  await signupFresh(page, '-sub');

  // Same-origin request from the page context carries the session cookie
  const res = await page.request.get('/api/subscribe');
  expect(res.status()).toBe(200);
  const body = await res.json();
  // Fresh signups get a 14-day trial; isPro must be a boolean and status coherent
  expect(typeof body.isPro).toBe('boolean');
  if (!body.isPro) {
    expect(body.status ?? 'none').not.toBe('active');
  }
});

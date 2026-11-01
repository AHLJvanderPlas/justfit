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
// UAT R6 — the path is chosen on onboarding's goal step; the modal stays for "Change path".
test('trial user — Cycling is open on day 1 in onboarding; once the trial expires it is Pro-locked in onboarding and the path modal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(`e2e-${Date.now()}-bill@justfit.cc`);
  await page.locator('#password').fill('e2e-test-pw');
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');
  await page.getByRole('button', { name: /I Agree/ }).click();

  // Trialing (Pro): the Cycling card on the goal step is NOT locked and opens its follow-up.
  const cyclingCard = page.locator('[data-path="cycling"]');
  await expect(cyclingCard).toBeVisible({ timeout: 10_000 });
  await expect(cyclingCard).not.toContainText('Pro required');
  await cyclingCard.click();
  await expect(page.getByRole('button', { name: /Build fitness/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: /Race fitness/ })).toBeVisible();
  await expect(page.getByText(/JUSTFIT\s*PRO/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Start Training' }).click();
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.jf-pathmodal')).toHaveCount(0);
  expect((await (await page.request.get('/api/profile')).json()).preferences.primary_intent).toBe('cycling');

  // Expire the trial in the suite's own local D1 (the one wrangler pages dev serves).
  const uid = await page.evaluate(() => localStorage.getItem('jf_user_id'));
  expect(uid).toMatch(/^[0-9a-f-]{36}$/);
  execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --command "UPDATE entitlements SET ends_at_ms = 1, status = 'expired' WHERE user_id = '${uid}'"`,
    { cwd: CWD, stdio: 'pipe' });
  expect((await (await page.request.get('/api/subscribe')).json()).isPro).toBe(false);
  await page.reload();

  // Known not-Pro, "Change path": the tile is locked and routes to the ProGate upgrade wall.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();
  await page.getByRole('button', { name: 'Change path →' }).click();
  const lockedTile = page.getByRole('button', { name: /CYCLING/i });
  await expect(lockedTile).toContainText('Pro required', { timeout: 15_000 });
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

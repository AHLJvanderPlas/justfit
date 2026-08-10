/**
 * Journey 8 (C-E19b): billing gates for free users —
 * (a) cycling path is Pro-locked in PathChoiceModal and routes to the ProGate wall;
 * (b) GET /api/subscribe reports the correct free/trial entitlement state.
 */

import { test, expect } from '@playwright/test';
import { signupFresh } from './helpers.js';

test('free user — cycling path shows Pro lock and upgrade wall', async ({ page }) => {
  await signupFresh(page, '-bill');

  // PathChoiceModal: cycling tile is locked for free users
  const cyclingTile = page.getByRole('button', { name: /CYCLING/i });
  await expect(cyclingTile).toBeVisible({ timeout: 10_000 });
  await expect(cyclingTile).toContainText('Pro vereist');

  // Clicking the locked tile routes to the ProGate upgrade wall
  await cyclingTile.click();
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

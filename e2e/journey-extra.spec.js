/**
 * Journey 2-6 (docs/IMPROVEMENT_PLAN.md Phase 3.2):
 *   2 — guest mode
 *   3 — FIT-code connect success
 *   4 — FIT-code connect 409 (gym at capacity)
 *   5 — trainer-invite accept
 *   6 — consent gate block → sign
 *
 * Fixture data is seeded by e2e/global-setup.js before any test runs.
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const CWD = '/Users/alexander/Documents/Projects/justfit/justfit-app';

/** Sign up a fresh user via UI, return {email, password}. Token lands in localStorage. */
async function signupFresh(page, suffix = '') {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  const email = `e2e-${Date.now()}${suffix}@justfit.cc`;
  const password = 'e2e-test-pw';
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');
  // Skip onboarding
  await page.getByRole('button', { name: /I Agree/ }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Skip this step' }).click();
  // Skip check-in
  await page.getByRole('button', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Apply →' }).click();
  return { email, password };
}

// ─── Journey 2: guest mode ───────────────────────────────────────────────────

test('guest mode — banner shown after skipping sign-in', async ({ page }) => {
  await page.goto('/login.html');
  await page.locator('#tab-signup').click(); // #guest-section is hidden until signup tab is active
  await page.locator('#guest-btn').click();
  await page.waitForURL('/');
  await expect(page.getByText('Add your email to keep your data')).toBeVisible({ timeout: 10_000 });
});

// ─── Journey 3: FIT-code connect success ────────────────────────────────────

test('FIT-code connect — request sent to open gym', async ({ page }) => {
  await signupFresh(page, '-connect');
  // Navigate directly to the connect screen with the open gym's FIT-code
  await page.goto('/connect?t=FIT-e2etopen');
  // ConnectScreen resolves gym info then shows "Send request"
  await expect(page.getByRole('button', { name: 'Send request' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Request sent!')).toBeVisible({ timeout: 10_000 });
});

// ─── Journey 4: FIT-code connect 409 ────────────────────────────────────────

test('FIT-code connect — 409 when gym is at capacity', async ({ page }) => {
  await signupFresh(page, '-409');
  await page.goto('/connect?t=FIT-e2etfull');
  await expect(page.getByRole('button', { name: 'Send request' })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: 'Send request' }).click();
  await expect(page.getByText('Deze trainer zit vol.')).toBeVisible({ timeout: 10_000 });
});

// ─── Journey 5: trainer-invite accept ───────────────────────────────────────

test('trainer-invite — accept email invite and see Connected!', async ({ page }) => {
  await signupFresh(page, '-invite');
  await page.goto('/trainer-invite?t=e2einvite12345678');
  const acceptBtn = page.getByRole('button', { name: /Accept/i });
  await expect(acceptBtn).toBeVisible({ timeout: 10_000 });
  await acceptBtn.click();
  await expect(page.getByText('Connected!')).toBeVisible({ timeout: 10_000 });
});

// ─── Journey 6: consent gate block → sign ────────────────────────────────────

test('consent gate — blocks Coach tab then clears after signing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));

  // Sign up
  const email = `e2e-${Date.now()}-consent@justfit.cc`;
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill('e2e-test-pw');
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');

  // Complete onboarding + check-in
  await page.getByRole('button', { name: /I Agree/ }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Apply →' }).click();

  // PathChoiceModal appears after onboarding when primary_intent is unset — pick General
  await expect(page.getByRole('button', { name: /GENERAL/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /GENERAL/i }).click();

  // Capture userId to set up fixture membership
  const userId = await page.evaluate(() => localStorage.getItem('jf_user_id'));

  // Insert gym_membership (assigned_trainer set, no consent_json)
  execSync(
    `npx wrangler d1 execute justfit-db --local --command ` +
    `"INSERT OR REPLACE INTO gym_memberships (id, gym_id, user_id, role, status, assigned_trainer_user_id, created_at_ms, updated_at_ms) ` +
    `VALUES ('e2e-gm-consent-${userId.slice(0,8)}', 'e2e-gym-open', '${userId}', 'client', 'active', 'e2e-trainer-usr', 1, 1)"`,
    { cwd: CWD, stdio: 'pipe' },
  );

  // Reload so trainerData is re-fetched and includes the new membership
  await page.reload();
  await expect(page.getByRole('button', { name: 'Coach' })).toBeVisible({ timeout: 20_000 });

  // Navigate to Coach tab — should show consent gate
  await page.getByRole('button', { name: 'Coach' }).click();
  await expect(page.getByText('Je trainer wil je begeleiden')).toBeVisible({ timeout: 15_000 });

  // Sign consent
  await page.getByRole('button', { name: /Akkoord en doorgaan/ }).click();

  // Consent gate should be gone
  await expect(page.getByText('Je trainer wil je begeleiden')).not.toBeVisible({ timeout: 10_000 });
});

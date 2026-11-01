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
import { PERSIST } from './global-setup.js';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { finishOnboarding, checkInToday } from './helpers.js';
const CWD = resolve(dirname(fileURLToPath(import.meta.url)), '..');   // repo root, not a hardcoded path

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
  // Onboarding (general path by default) → Today → the mood row's one-tap check-in (UAT R6)
  await finishOnboarding(page);
  await checkInToday(page);
  return { email, password };
}

// ─── Journey 2: guest mode ───────────────────────────────────────────────────

test('guest mode — banner shown after skipping sign-in', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.goto('/login.html');
  // UAT R5: the guest button is on the Sign in tab too (the default tab); no tab switch needed.
  await expect(page.locator('#guest-btn')).toBeVisible();
  // C-B33: the guest button needs the same terms + privacy consent as email signup
  await expect(page.locator('#guest-btn')).toBeDisabled();
  await page.locator('#guest-accept-check').check();
  await expect(page.locator('#guest-btn')).toBeEnabled();
  await page.locator('#guest-btn').click();
  await page.waitForURL('/');
  await expect(page.getByText('Add your email to keep your data')).toBeVisible({ timeout: 10_000 });
  // The acceptance was recorded at signup: after onboarding a reload shows no "Updated Policies" gate
  await finishOnboarding(page);
  await checkInToday(page);
  await page.reload();
  await expect(page.getByText('Add your email to keep your data').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Updated Policies')).toHaveCount(0);
});

test('guest mode — the guest button is visible on both tabs', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.goto('/login.html');
  await expect(page.locator('#tab-login')).toHaveClass(/active/);
  await expect(page.locator('#guest-btn')).toBeVisible();
  await page.locator('#tab-signup').click();
  await expect(page.locator('#guest-btn')).toBeVisible();
});

// UAT release 5 — a guest has no email: Settings → Account offers "Add email", not Resend / Enter code.
test('guest mode — Settings → Account shows "Add email", no Resend', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.goto('/login.html');
  await page.locator('#guest-accept-check').check();
  await page.locator('#guest-btn').click();
  await page.waitForURL('/');
  await expect(page.getByText('Add your email to keep your data').first()).toBeVisible({ timeout: 10_000 });
  await finishOnboarding(page);
  await checkInToday(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Account/ }).click();
  await expect(page.getByRole('button', { name: /^Add email/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Resend' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enter code' })).toHaveCount(0);
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

  // Complete onboarding (the path is the goal step's default, general) + the mood-row check-in
  await finishOnboarding(page);
  await checkInToday(page);

  // Capture userId to set up fixture membership
  const userId = await page.evaluate(() => localStorage.getItem('jf_user_id'));

  // Insert gym_membership (assigned_trainer set, no consent_json)
  execSync(
    `npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --command ` +
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

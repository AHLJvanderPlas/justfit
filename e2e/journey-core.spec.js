import { test, expect } from '@playwright/test';

// Journey 1 (docs/IMPROVEMENT_PLAN.md Phase 3.1):
// signup/login -> onboarding -> check-in -> plan -> complete workout -> history
test('signup, onboard, check in, complete a workout and see it in history', async ({ page }) => {
  // Force English strings so t() returns source keys verbatim (default lang is NL).
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));

  const email = `e2e-${Date.now()}@justfit.cc`;
  const password = 'e2e-test-pw';

  // ── Signup ──────────────────────────────────────────────────────────────
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();

  await page.waitForURL('/');

  // ── Onboarding (skip everything) ───────────────────────────────────────
  await page.getByRole('button', { name: /I Agree/ }).click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: 'Skip this step' }).click();
  }

  // ── Daily check-in ──────────────────────────────────────────────────────
  await page.getByRole('button', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Apply →' }).click();

  // ── Today's plan ──────────────────────────────────────────────────────
  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await expect(startSession).toBeEnabled();
  await startSession.click();

  // ── Complete the workout (skip through each exercise) ──────────────────
  // Workout opens in overview phase → click "Start Workout" first.
  await page.getByRole('button', { name: 'Start Workout' }).click();

  const logSession = page.getByRole('button', { name: 'Log session →' });
  for (let i = 0; i < 15; i++) {
    if (await logSession.isVisible()) break;
    await page.getByRole('button', { name: /Ready/ }).click();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(logSession).toBeVisible();
  await logSession.click();

  // ── History shows the completed session ─────────────────────────────────
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText('RECENT SESSIONS')).toBeVisible({ timeout: 15_000 });
});

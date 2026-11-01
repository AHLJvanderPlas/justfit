import { expect } from '@playwright/test';

/** Sign up a fresh user via UI and skip onboarding + check-in. Session lands in the HttpOnly cookie. */
export async function signupFresh(page, suffix = '') {
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
  await page.getByRole('button', { name: /I Agree/ }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Apply →' }).click();
  return { email, password };
}

/** From a fresh signup: resolve the PathChoiceModal with the General path. */
export async function pickGeneralPath(page) {
  const general = page.getByRole('button', { name: /GENERAL/i });
  await expect(general).toBeVisible({ timeout: 10_000 });
  await general.click();
}

/**
 * Wait until today's plan is STORED for this user (a day_plans row with an id).
 * GET /api/plan answers with an in-memory plan while nothing is stored, so a GET
 * fired the instant START SESSION renders can race the app's own storing POST.
 * A 15 s poll alone timed out twice in seven release runs (2026-11-01), on a cold
 * local worker. Now: give the app's POST up to 30 s, then store once explicitly
 * as a last resort (the same POST the app sends) and poll again. The journeys
 * that use this test the builder, not the bootstrap; journey-core covers that.
 */
export async function waitForStoredPlan(page) {
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const storedId = async () => {
    const res = await page.request.get(`/api/plan?date=${today}`);
    if (!res.ok()) return null;
    return (await res.json()).plan?.id ?? null;
  };
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (await storedId()) return;
    await page.waitForTimeout(500);
  }
  const posted = await page.request.post('/api/plan', { data: { date: today } });
  expect(posted.ok(), 'storing today\'s plan explicitly should succeed').toBe(true);
  await expect.poll(storedId, { timeout: 10_000, message: 'the general path should have stored today\'s plan' }).toBeTruthy();
}

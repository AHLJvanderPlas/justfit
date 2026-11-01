import { expect } from '@playwright/test';

/**
 * Sign up a fresh user via UI and finish onboarding. Session lands in the HttpOnly cookie.
 * UAT R6 — the path is chosen on onboarding's goal step (`path`: 'general' by skipping the step,
 * or 'running' / 'military' with the follow-up's defaults), so no path modal follows. Today
 * then shows the first session and the mood row; the check-in is one tap on it ("Good"), or,
 * with `chips`, the sheet opened from the row's "Tell more →".
 * `afterOnboarding(page)` (optional) runs once Today shows its first session, before the check-in.
 * `checkin: false` leaves the day's check-in open.
 */
export async function signupFresh(page, suffix = '', { path = 'general', afterOnboarding, chips = [], checkin = true } = {}) {
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
  await finishOnboarding(page, { path });
  if (afterOnboarding) await afterOnboarding(page);
  if (checkin) await checkInToday(page, chips);
  return { email, password };
}

/** Onboarding from the waiver to the first Today card (UAT R6: the goal step holds the path). */
export async function finishOnboarding(page, { path = 'general' } = {}) {
  await page.getByRole('button', { name: /I Agree/ }).click();
  if (path === 'general') {
    await page.getByRole('button', { name: 'Skip this step' }).click();          // goal → general path by default
  } else {
    await page.locator(`[data-path="${path}"]`).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();   // the follow-up's defaults
  }
  const skip = page.getByRole('button', { name: 'Skip this step' });
  await skip.click();                                                            // about you
  await page.getByRole('button', { name: 'Start Training' }).click();            // equipment & time
  await expect(page.getByRole('button', { name: /START SESSION|Recovery Mode Active/ })).toBeVisible({ timeout: 30_000 });
}

/** Today's check-in: one tap on the mood row, or the sheet with chips. */
export async function checkInToday(page, chips = []) {
  const row = page.getByTestId('mood-row');
  await expect(row).toBeVisible({ timeout: 15_000 });
  if (!chips.length) { await row.getByRole('button', { name: 'Good', exact: true }).click(); return; }
  await row.getByRole('button', { name: /Tell more/ }).click();
  const sheet = page.getByTestId('checkin-sheet');
  await sheet.getByRole('button', { name: 'Good', exact: true }).click();
  for (const chip of chips) await sheet.getByRole('button', { name: chip }).click();
  await sheet.getByRole('button', { name: 'Apply →' }).click();
}

/** Kept for the journeys written before UAT R6: the path is chosen in onboarding now, so no modal follows. */
export async function pickGeneralPath(page) {
  await expect(page.locator('.jf-pathmodal')).toHaveCount(0);
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

/**
 * coach-dcp release 1 (docs/COACH_DCP_PLAN_2026-11.md §Release 1, tests 5–6).
 *
 *  (f) DCP end to end — a fresh user switches the DCP on in Settings → Coaches → NORMEN
 *      (birth year, toggle), is told the measurement is in today's session, finds a max-effort
 *      push-up step in it, does both measurement sets in WorkoutView's max-effort screen, and
 *      Voortgang's DCP card then shows the numbers with the retest button — not "planned".
 *  (g) coach card → Coach view — a running user (coach prefs set through the API before the
 *      check-in, so the first stored plan is the coach's) taps the programme card on Today
 *      and lands on the Coach view, whose header says HARDLOPEN.
 */
import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath, waitForStoredPlan } from './helpers.js';

async function storedPlan(page) {
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const res = await page.request.get(`/api/plan?date=${today}`);
  expect(res.ok()).toBe(true);
  const row = (await res.json()).plan;
  return row?.plan_json ? JSON.parse(row.plan_json) : row;
}

test('coach-dcp (f) — DCP end to end: switch on, measure in today\'s session, the card fills', async ({ page }) => {
  test.setTimeout(150_000);
  await signupFresh(page, '-dcp');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await waitForStoredPlan(page);
  expect((await storedPlan(page)).steps.some((s) => s.max_effort), 'no measurement before the DCP is on').toBe(false);
  // Sex comes from the body profile ("Set your sex under You" otherwise); the norm sentence
  // needs it. Reload so the app state carries it.
  expect((await page.request.post('/api/profile', { data: { sex: 'male' } })).ok()).toBe(true);
  await page.reload();

  // Settings → Coaches → NORMEN: the header button is "Check-in" now, and the sub-view is titled.
  await expect(page.getByRole('button', { name: 'Check-in' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Coaches/ }).click();
  await expect(page.getByRole('heading', { name: 'COACHES' })).toBeVisible();
  await expect(page.getByText('Standards', { exact: true })).toBeVisible();
  const toggle = page.getByRole('button', { name: 'DCP standard · standing' });
  await expect(toggle).toBeDisabled();                        // no birth year yet
  await page.getByLabel('Birth year').fill('1990');
  await expect(page.getByText(/^2 min push-ups, 2 min sit-ups, 12 min run\. Your norm: \d+ · \d+ · [\d.]+ m\./)).toBeVisible();
  await toggle.click();

  // Enabling with no baseline schedules it at once and says so; the app goes to Today.
  await expect(page.getByText("Measurement is in today's session")).toBeVisible({ timeout: 20_000 });
  const plan = await storedPlan(page);
  const measured = plan.steps.filter((s) => s.max_effort);
  expect(plan.assessment_planned).toBe(true);
  expect(measured.map((s) => s.measures).sort()).toEqual(['dcp_pushups', 'dcp_situps']);
  expect(measured.find((s) => s.measures === 'dcp_pushups').exercise_slug).toMatch(/push-up/);

  // The session: skip everything except the two measurement sets, which are counted for real.
  await page.getByRole('button', { name: /START SESSION/ }).click();
  await page.getByRole('button', { name: 'Start Workout' }).click();
  const sessionDone = page.getByText('Session done!');
  const maxScreen = page.getByText('Max reps — time remaining');
  const tapZone = page.getByRole('button', { name: 'TAP TO COUNT REP' });
  const counted = [];
  let instruction = null;
  for (let i = 0; i < 80 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    if (await maxScreen.isVisible()) {
      const n = counted.length === 0 ? 12 : 15;
      for (let k = 0; k < n; k++) await tapZone.click();
      await page.getByRole('button', { name: `Stop — form is going (${n})` }).click();
      counted.push(n);
      continue;
    }
    if (await ready.isVisible()) {
      // The instruction screen names the exercise; only the measurement sets are done for real.
      instruction = (await page.locator('h1').first().textContent())?.trim();
      await ready.click();
      if (!measured.some((s) => s.name === instruction)) await page.getByRole('button', { name: 'Skip', exact: true }).click();
      continue;
    }
    if (await skipRest.isVisible()) { await skipRest.click(); continue; }
    const skip = page.getByRole('button', { name: 'Skip', exact: true });
    if (await skip.isVisible()) { await skip.click(); continue; }
    await page.waitForTimeout(250);
  }
  expect(counted, 'both measurement sets should run on the max-effort screen').toEqual([12, 15]);
  await expect(sessionDone).toBeVisible();
  await page.getByRole('button', { name: 'Log session →' }).click();

  // The execution wrote the baseline (R598 → execution.js recordDcpMeasurement)…
  await expect.poll(async () => (await (await page.request.get('/api/profile')).json()).preferences?.military_coach?.dcp,
    { timeout: 15_000, message: 'the measurement should be stored as dcp.last' }).toMatchObject({ enabled: true, birth_year: 1990, bias_enabled: true, last: { pushups: 12, situps: 15 } });
  // …and Voortgang's card shows the numbers; the one button offers the retest.
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText(/^12 \/ \d+$/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^15 \/ \d+$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Schedule retest' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: "Measurement is in today's session" })).toHaveCount(0);
});

test('coach-dcp (g) — the coach programme card on Today opens the Coach view', async ({ page }) => {
  await signupFresh(page, '-coachcard', {
    beforeCheckIn: async (p) => {
      // Onboarding has saved its profile once the check-in sheet is up; write after it.
      await expect(p.getByRole('button', { name: 'Good' })).toBeVisible();
      const res = await p.request.post('/api/profile', { data: { preferences: {
        primary_intent: 'running',
        run_coach: { enrolled: true, target_km: 5, week: 1, session_in_week: 0 },
        sport_prefs: { sports: ['running'], primary: 'running' },
      } } });
      expect(res.ok()).toBe(true);
    },
  });
  // Dutch from here; a reload also reads the new primary intent (no path-choice modal).
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'nl'));
  await page.reload();
  // The first stored plan is the coach's (prefs were in place before the check-in).
  await waitForStoredPlan(page);
  expect((await storedPlan(page)).run_program, 'the first plan should come from the running coach').toBeTruthy();
  const card = page.getByRole('button', { name: 'Bekijk je coach' });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.click();
  await expect(page.getByText(/^HARDLOPEN · 5km$/)).toBeVisible({ timeout: 15_000 });
});

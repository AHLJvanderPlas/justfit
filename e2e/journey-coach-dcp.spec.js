/**
 * coach-dcp release 1 (docs/COACH_DCP_PLAN_2026-11.md §Release 1, tests 5–6).
 *
 *  (f) DCP end to end — a fresh user switches the DCP on in Settings → Doel & coach → NORMEN
 *      (birth year, toggle), is told the measurement is in today's session, finds a max-effort
 *      push-up step in it, does both measurement sets in WorkoutView's max-effort screen, and
 *      Voortgang's DCP card then shows the numbers with the retest button — not "planned".
 *  (g) coach card → Coach view — a running user (coach prefs set through the API before the
 *      check-in, so the first stored plan is the coach's) taps the programme card on Today
 *      and lands on the Coach view, whose header says HARDLOPEN. R2: the Today pill is the
 *      primary coach only — no "ADD-ON" pill.
 *  (h) Waar sta ik (coach-dcp release 2, fixes 6 + 8) — a military keuring persona (K3 goal,
 *      keuring in 60 days, no Cooper yet): the Today pill reads "MILITAIR · KEURING" and the
 *      coach card "Niveau nog niet gemeten · doel K3" (the self-declared K1 is never shown).
 *      With a Cooper distance of 2.350 m, Voortgang's WAAR STA IK shows the Keuring card —
 *      "2.350 m / 2.200 m" (the K3 Cooper threshold), the countdown, the unmeasured rows — and
 *      the pill shows the measured level.
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

  // Settings → Goal & coach → NORMEN (R2: "Your goal" and "Coaches" are one screen now).
  await expect(page.getByRole('button', { name: 'Check-in' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('button', { name: /^Coaches/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Your goal/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Goal & coach/ }).click();
  await expect(page.getByRole('heading', { name: 'GOAL & COACH' })).toBeVisible();
  // One screen, top to bottom: the path, NORMEN, the other coaches (collapsed), training days.
  await expect(page.getByText('Your path', { exact: true })).toBeVisible();
  await expect(page.getByText('You train with one coach at a time. Standards apply separately.')).toBeVisible();
  await expect(page.getByText('Training days', { exact: true })).toBeVisible();
  // ANDERE COACHES: a row opens that coach's own block with its activate button, and closes
  // again. (Military: a fresh free user without running shoes sees "Add running shoes" in the
  // running block instead of its activate button.)
  const milRow = page.getByRole('button', { name: 'Military', exact: true });
  await expect(milRow).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: /^Activate · Military Coach/ })).toHaveCount(0);
  await milRow.click();
  await expect(milRow).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: /^Activate · Military Coach · K3$/ })).toBeVisible();
  await milRow.click();
  await expect(page.getByRole('button', { name: /^Activate · Military Coach/ })).toHaveCount(0);
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
  let metaChecked = 0;
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
      if (measured.some((s) => s.name === instruction)) {
        // The instruction screen prescribes the protocol window, never the default 10 reps.
        await expect(page.getByText('Max · 2 min', { exact: true })).toBeVisible();
        await expect(page.getByText(/^\d+ reps$/)).toHaveCount(0);
        metaChecked++;
      }
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
  expect(metaChecked, 'both measurement instruction screens read "Max · 2 min"').toBe(2);
  await expect(sessionDone).toBeVisible();
  await page.getByRole('button', { name: 'Log session →' }).click();

  // The execution wrote the baseline (R598 → execution.js recordDcpMeasurement)…
  await expect.poll(async () => (await (await page.request.get('/api/profile')).json()).preferences?.military_coach?.dcp,
    { timeout: 15_000, message: 'the measurement should be stored as dcp.last' }).toMatchObject({ enabled: true, birth_year: 1990, bias_enabled: true, last: { pushups: 12, situps: 15 } });
  // …and Voortgang's card (under WHERE DO I STAND) shows the numbers with both tiers —
  // "12 / 16 (safe 19)" — and the one button offers the retest.
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText('WHERE DO I STAND', { exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^12 \/ \d+ \(safe \d+\)$/)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/^15 \/ \d+ \(safe \d+\)$/)).toBeVisible();
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
  // R2 — one pill on the Today card: the primary coach, no "ADD-ON".
  await expect(page.getByTestId('coach-pill')).toHaveText(/^Hardlopen · 5km$/i);
  await expect(page.getByText(/^add-on$/i)).toHaveCount(0);
  await card.click();
  await expect(page.getByText(/^HARDLOPEN · 5km$/)).toBeVisible({ timeout: 15_000 });
});

test('coach-dcp (h) — Waar sta ik: the keuring card, and the level only once measured', async ({ page }) => {
  test.setTimeout(120_000);
  const today = new Date();
  const inDays = (n) => {
    const d = new Date(today); d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const mil = { active: true, track: 'keuring', mode: 'target', cluster_current: 1, cluster_target: 3,
    target_date: inDays(60), block_session_index: 0, block_number: 1, pack_weights_available_kg: [10, 15] };
  await signupFresh(page, '-waarstaik', {
    beforeCheckIn: async (p) => {
      await expect(p.getByRole('button', { name: 'Good' })).toBeVisible();
      const res = await p.request.post('/api/profile', { data: { sex: 'male', preferences: { primary_intent: 'military', military_coach: mil } } });
      expect(res.ok()).toBe(true);
    },
  });
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'nl'));
  await page.reload();
  await waitForStoredPlan(page);

  // Fix 8 — no Cooper yet: the pill names the track, the card says "not measured · goal K3".
  const pill = page.getByTestId('coach-pill');
  await expect(pill).toHaveText('MILITAIR · KEURING', { timeout: 30_000 });
  await expect(page.getByText(/Niveau nog niet gemeten · doel K3/).first()).toBeVisible();
  await expect(page.getByText(/· K1\b/)).toHaveCount(0);

  // Fix 6 — a Cooper distance (the field the Cooper modal and execution.js write).
  const prof = await (await page.request.get('/api/profile')).json();
  const stored = prof.preferences.military_coach;
  const cooperAt = Date.now() - 3 * 86_400_000;
  expect((await page.request.post('/api/profile', { data: { preferences: { ...prof.preferences,
    military_coach: { ...stored, last_cooper_distance_m: 2350, last_cooper_at_ms: cooperAt } } } })).ok()).toBe(true);
  await page.reload();

  await page.getByRole('button', { name: 'Voortgang', exact: true }).click();
  await expect(page.getByText('WAAR STA IK', { exact: true })).toBeVisible({ timeout: 20_000 });
  const keuring = page.getByTestId('keuring-card');
  await expect(keuring).toBeVisible();
  await expect(keuring.getByText('KEURING K3 · over 60 dagen')).toBeVisible();
  await expect(keuring.getByText('2.350 m / 2.200 m', { exact: true })).toBeVisible();
  await expect(keuring.getByText('— / 27', { exact: true })).toBeVisible();
  await expect(keuring.getByText('nog niet gemeten')).toHaveCount(3);
  await expect(keuring.getByText(/^Cooper \d+ \w+\.?$/)).toBeVisible();
  // The general battery hands over: no "Waar je staat" card while a norm is on.
  await expect(page.getByText('WAAR JE STAAT', { exact: true })).toHaveCount(0);

  // …and the Today pill now shows the measured level (2.350 m reaches K3), still no K1.
  await page.getByRole('button', { name: 'Vandaag', exact: true }).click();
  await expect(pill).toHaveText('MILITAIR · K3', { timeout: 20_000 });
});

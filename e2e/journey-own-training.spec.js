/**
 * Journeys 11–12 (MANUAL_TRAINING_DESIGN.md phase 1): "Eigen training".
 * The gap the Oct 5 build left twice — both sheets driven for real, end to end.
 *
 *  (a) Samenstellen → (v1.3: opens on today's plan, cap line, "opdrukken" finds Push-up) → add push-up →
 *      (v1.4: reorder behind ⋯; TYPE sets 1 and reps 5; two groups are refused) → Starten → Als extra →
 *      WorkoutView prescribes 1 × 5, one set completed → the done card shows the extra and asks "Plan done?", and
 *      today's stored plan is exactly what it was (acceptance 2, end to end).
 *  (b) Registreren → log push-up 3×3 for today → Today shows it completed.
 *  (c) v1.2 — save a template, then Hergebruiken → ⋯ → Bewerken (rename) → Verwijderen.
 *  (d) v1.2 — Vastzetten from the chooser: a free user pins push-up, today's plan holds it.
 *  (e) v1.5 — Dutch names: switch to nl → the Today card shows a plan step's Dutch name;
 *      Samenstellen → "opdrukken" → Opdrukken → Starten → Als extra → the WorkoutView header is "Opdrukken".
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

async function todaysPlan(page) {
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const res = await page.request.get(`/api/plan?date=${today}`);
  expect(res.ok()).toBe(true);
  return (await res.json()).plan;
}

async function pickExercise(page, name) {
  await page.getByPlaceholder('Search exercises…').fill(name.toLowerCase());
  await page.locator('.jf-pick__item', { has: page.locator('.jf-pick__name', { hasText: new RegExp(`^${name}$`) }) }).click();
}

// v1.1 — an added exercise lands as the LAST card, fully above the sticky
// footer, and the search stays under the list. Smooth scrolling is async, so poll.
async function addAndCheckLanded(page, query, previous) {
  const input = page.getByPlaceholder('Search exercises…');
  await input.fill(query);
  const before = await page.locator('.jf-sb-step').count();
  await page.locator('.jf-pick__item').first().click();
  const card = page.locator('.jf-sb-step').nth(before);
  await expect(card).toHaveCount(1);
  const viewport = page.viewportSize();
  await expect.poll(async () => {
    const box = await card.boundingBox();
    const footer = await page.locator('.jf-sheet__footer').boundingBox();
    return !!box && !!footer && box.y >= 0 && box.y + box.height <= Math.min(viewport.height, footer.y) + 1;
  }, { timeout: 5_000, message: `the new "${query}" card should be fully visible above the footer` }).toBe(true);
  const box = await card.boundingBox();
  if (previous) expect(box.y, 'the new card sits below the previous one').toBeGreaterThan(previous.y);
  const search = await input.boundingBox();
  expect(search.y, 'the search sits under the last card').toBeGreaterThan(box.y);
  return box;
}

test('own training (a) — build, start as an extra, complete a set; plan stays open', async ({ page }) => {
  await signupFresh(page, '-own-a');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  // GET /api/plan generates an in-memory plan when nothing is stored yet, so a
  // GET fired the instant START SESSION renders can race the app's own storing
  // POST and come back without an id. Poll until the stored row exists.
  await expect.poll(async () => (await todaysPlan(page))?.id, { timeout: 15_000, message: 'the general path should have stored today\'s plan' }).toBeTruthy();
  const before = await todaysPlan(page);

  // The entry: one quiet line, two links (§2).
  await expect(page.getByRole('button', { name: "Can't do this?" })).toBeVisible();
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Build/ }).click();

  // v1.3 — an empty query opens on today's plan, not on the alphabet's Cooper
  // tests, and the list says how much it is not showing.
  const firstGroup = page.locator('.jf-pick__group').first();
  await expect(firstGroup.locator('.jf-pick__sec')).toHaveText('Today in your plan', { timeout: 10_000 });
  const planNames = (JSON.parse(before.plan_json).steps ?? []).map((s) => s.name);
  expect(planNames, 'the first picker row is one of today\'s plan exercises').toContain(await page.locator('.jf-pick__item .jf-pick__name').first().textContent());
  await expect(page.locator('.jf-pick__cap')).toHaveText(/^40 of \d+ — search or pick a category$/);
  // Dutch search: "opdrukken" finds Push-up, ranked first.
  await page.getByPlaceholder('Search exercises…').fill('opdrukken');
  await expect(page.locator('.jf-pick__item .jf-pick__name').first()).toHaveText('Push-up');

  // Samenstellen on a phone: three adds, each landing in view below the last (v1.1).
  await page.setViewportSize({ width: 390, height: 844 });
  let box = await addAndCheckLanded(page, 'push-up', null);
  box = await addAndCheckLanded(page, 'plank', box);
  await addAndCheckLanded(page, 'squat', box);
  // The footer is the two-button row; the secondary one jumps to the search.
  await expect(page.getByRole('button', { name: '+ Add exercise' })).toBeVisible();
  // v1.4 — reorder lives behind "⋯": Up / Down text buttons, disabled at the ends.
  const names = page.locator('.jf-sb-step__name');
  const second = await names.nth(1).textContent();
  await page.getByRole('button', { name: `More ${second}` }).click();
  await page.getByRole('button', { name: 'Up', exact: true }).click();
  await expect(names.first()).toHaveText(second);
  await expect(page.getByRole('button', { name: 'Up', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Down', exact: true }).click();
  await expect(names.nth(1)).toHaveText(second);
  // Keep push-up alone for the run: drop the other two.
  await page.getByRole('button', { name: /^Remove / }).last().click();
  await page.getByRole('button', { name: /^Remove / }).last().click();
  await expect(page.locator('.jf-sb-step')).toHaveCount(1);
  await expect(names.first()).toHaveText('Push-up');

  // v1.4 — the numbers are TYPED into the log sheet's row. A target is one value
  // for all sets: two groups are refused with a hint, and Starten waits.
  const reps = page.getByLabel('Reps · Push-up', { exact: true });
  await reps.fill('3x3, 2x4');
  await expect(page.getByText('In the builder one value applies to all sets — use e.g. 3x12')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start now' })).toBeDisabled();
  await page.getByLabel('Sets · Push-up', { exact: true }).fill('1');
  await reps.fill('5');
  await reps.blur();
  await expect(page.locator('.jf-sb-step__sum')).toContainText('1 set · 5 reps');
  await page.getByRole('button', { name: 'Start now' }).click();

  // Run-mode sheet: als extra is the default (§4).
  await expect(page.getByText('How do you want to do this?')).toBeVisible();
  await page.getByRole('button', { name: /^As an extra/ }).click();

  // WorkoutView prescribes what was typed: 1 × 5 (the overview line), set 1 of 1.
  await expect(page.getByText('1 × 5 reps', { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start Workout' }).click({ timeout: 15_000 });
  const sessionDone = page.getByText('Session done!');
  const tapZone = page.getByRole('button', { name: 'TAP TO COUNT REP' });
  let tapped = false;
  for (let i = 0; i < 40 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) {
      await expect(allDone).toHaveText(/All 5 reps done/);
      await expect(page.getByText('Set 1/1', { exact: true })).toBeVisible();
      if (!tapped && (await tapZone.isVisible())) { await tapZone.click(); await tapZone.click(); tapped = true; }
      await allDone.click();
      continue;
    }
    if (await skipRest.isVisible()) { await skipRest.click(); continue; }
    await page.waitForTimeout(250);
  }
  expect(tapped, 'the push-up set should have been counted in WorkoutView').toBe(true);
  await expect(sessionDone).toBeVisible();
  await page.getByRole('button', { name: 'Log session →' }).click();

  // The done card of the extra: it shows the session and asks, default no (§6).
  await expect(page.getByText('Extra session done')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Today's plan is still open — mark it as done too?")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save as template' })).toBeVisible();
  // Today's plan is still there, unchanged, and still startable.
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible();
  const after = await todaysPlan(page);
  expect(after?.id).toBe(before.id);
  expect(after?.plan_json).toBe(before.plan_json);
  expect(after?.generated_by ?? 'engine').not.toBe('user');
});

test('own training (b) — record push-up 3×3 for today; Today shows it completed', async ({ page }) => {
  await signupFresh(page, '-own-b');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Record/ }).click();

  // The log sheet, today: what, then how much.
  await pickExercise(page, 'Push-up');
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByLabel('Sets 1', { exact: true }).fill('3');
  await page.getByLabel('Reps 1', { exact: true }).fill('3');
  await page.getByRole('button', { name: /^Save for/ }).click();

  await expect(page.getByText('Session Complete')).toBeVisible({ timeout: 15_000 });
  // "Eigen training" stays on the completed Today state (acceptance 1).
  await expect(page.getByRole('button', { name: 'Own training' })).toBeVisible();
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const h = await (await page.request.get('/api/execution?limit=30')).json();
  const logged = (h.executions ?? []).find((e) => e.date === today && e.execution_type === 'logged');
  expect(logged, 'the logged session must be in history, dated today').toBeTruthy();
  expect(JSON.parse(logged.steps[0].actual_json).reps_per_set).toEqual([3, 3, 3]);
});

async function openPlanDay(page, suffix) {
  await signupFresh(page, suffix);
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await todaysPlan(page))?.id, { timeout: 15_000, message: 'today\'s plan should be stored' }).toBeTruthy();
}

test('own training (c) — reuse: edit, rename, delete', async ({ page }) => {
  await openPlanDay(page, '-own-c');

  // Save a template through the builder (no run needed).
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Build/ }).click();
  await pickExercise(page, 'Push-up');
  await pickExercise(page, 'Plank');
  await page.getByRole('button', { name: 'Save as template' }).click();
  await page.getByLabel('Name of your training').fill('Hotel');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved in My trainings.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Hergebruiken: the row names its exercises; ⋯ → Bewerken opens the builder on THIS training.
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Reuse/ }).click();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel$/ })).toBeVisible();
  await expect(page.locator('.jf-tpl-pick__names')).toHaveText('Push-up · Plank');
  await page.getByRole('button', { name: /^More Hotel/ }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.jf-sb-step')).toHaveCount(2);
  await page.getByRole('button', { name: 'Update template' }).click();
  const nameInput = page.getByLabel('Name of your training');
  await expect(nameInput).toHaveValue('Hotel');
  await nameInput.fill('Hotel 2');
  await page.getByRole('button', { name: 'Update template' }).click();
  await expect(page.getByText('Saved in My trainings.')).toBeVisible();
  // Closing the edit builder goes back to Hergebruiken, not out of the sheet.
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel 2$/ })).toBeVisible();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel$/ })).toHaveCount(0);
  await expect(page.locator('.jf-tpl-pick__names')).toHaveText('Push-up · Plank');
  // The rename reached the server, not just App state.
  const stored = await (await page.request.get('/api/my-sessions')).json();
  expect(stored.templates.map((x) => x.name)).toEqual(['Hotel 2']);
  await page.getByRole('button', { name: /^More Hotel 2/ }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Delete this training?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByText('No saved trainings yet — build one via Build.')).toBeVisible();
  const list = await (await page.request.get('/api/my-sessions')).json();
  expect(list.templates).toHaveLength(0);
});

test('own training (d) — pin from the chooser: free user, today\'s plan open', async ({ page }) => {
  await openPlanDay(page, '-own-d');
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Pin/ }).click();
  // The mode toggle is gone: this sheet only pins.
  await expect(page.getByRole('button', { name: 'Build it myself' })).toHaveCount(0);
  await expect(page.getByText('this replaces today\'s plan')).toBeVisible();
  await pickExercise(page, 'Push-up');
  await expect(page.locator('.jf-pick__item', { has: page.getByText('Pinned', { exact: true }) })).toHaveCount(1);
  await page.getByRole('button', { name: 'Let the coach fill in the rest' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 20_000 });

  // The Today card lists it, and the stored plan records the pin.
  const todayCard = page.locator('div', { has: page.getByRole('button', { name: /START SESSION/ }) }).last();
  await expect(todayCard.getByText('Push-up', { exact: true })).toBeVisible();
  const stored = await todaysPlan(page);
  const plan = JSON.parse(stored.plan_json);
  const pushUp = plan.steps.find((st) => st.name === 'Push-up');
  expect(pushUp, 'the pinned push-up is a step of today\'s plan').toBeTruthy();
  expect(plan.pinned).toContain(pushUp.exercise_id);
});

test('own training (e) — Dutch exercise names on Today, in the picker and in WorkoutView', async ({ page }) => {
  await signupFresh(page, '-own-e');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await todaysPlan(page))?.id, { timeout: 15_000, message: 'the general path should have stored today\'s plan' }).toBeTruthy();
  const steps = JSON.parse((await todaysPlan(page)).plan_json).steps ?? [];
  // Every stored step carries both names (makePlanStep, v1.5).
  expect(steps.length).toBeGreaterThan(0);
  for (const s of steps) expect(s.name_nl, `step ${s.exercise_slug} has no name_nl`).toBeTruthy();

  // signupFresh pins jf_lang = en for every load; a later init script runs after it.
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'nl'));
  await page.reload();

  // The Today card lists the first three steps by their Dutch names.
  const shown = steps.slice(0, 3);
  const dutchOnly = shown.find((s) => s.name_nl !== s.name) ?? shown[0];
  await expect(page.getByText(dutchOnly.name_nl, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  if (dutchOnly.name_nl !== dutchOnly.name) await expect(page.getByText(dutchOnly.name, { exact: true })).toHaveCount(0);

  await page.getByRole('button', { name: 'Eigen training' }).click();
  await page.getByRole('button', { name: /^Samenstellen/ }).click();
  await page.getByPlaceholder('Zoek oefeningen…').fill('opdrukken');
  const first = page.locator('.jf-pick__item .jf-pick__name').first();
  await expect(first).toHaveText('Opdrukken', { timeout: 10_000 });
  await first.click();
  await expect(page.locator('.jf-sb-step__name')).toHaveText(['Opdrukken']);
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText('Hoe wil je dit doen?')).toBeVisible();
  await page.getByRole('button', { name: /^Als extra/ }).click();

  // WorkoutView: the overview lists it, the instruction header names it — in Dutch.
  await expect(page.getByText('Opdrukken', { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  await page.getByRole('button', { name: 'Start workout' }).click({ timeout: 15_000 });
  await expect(page.locator('h1')).toHaveText('Opdrukken', { timeout: 10_000 });
});

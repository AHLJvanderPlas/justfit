/**
 * Journey 7 (C-E19a): WorkoutView state machine driven for real —
 * instruction → working (rep taps) → resting (skip) → … → session feedback → history.
 * Unlike journey-core (which skips every exercise), this taps the rep zone,
 * completes sets, and passes through the rest phase.
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

test('workout state machine — rep taps, set completion, rest skip, three-button rating, history', async ({ page }) => {
  await signupFresh(page, '-wk');
  await pickGeneralPath(page);

  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await startSession.click();
  await page.getByRole('button', { name: 'Start Workout' }).click();

  const sessionDone = page.getByText('Session done!');
  const tapZone = page.getByRole('button', { name: 'TAP TO COUNT REP' });
  let repsTapped = false;
  let restLabelChecked = false;
  let workingChecked = false;
  let lastWorkingSet = 0;

  // Drive whatever phase is on screen until the feedback screen appears.
  for (let i = 0; i < 60 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    const skipExercise = page.getByRole('button', { name: 'Skip', exact: true });

    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) {
      // UX review A — the working screen says everything once and has one primary action.
      const name = (await page.locator('.jf-wo-title__name').textContent()).trim();
      const setLabel = (await page.locator('.jf-wo-title__set').textContent()).trim();
      lastWorkingSet = Number(setLabel.match(/Set (\d+) of/)[1]);
      if (!workingChecked) {
        await expect(page.locator('.jf-wo-bar .jf-primary'), 'exactly one primary button in the bottom bar').toHaveCount(1);
        await expect(page.locator('.jf-wo-bar .jf-primary')).toHaveText(/Finish set/);
        await expect(page.getByText(name, { exact: true }), `the exercise name "${name}" occurs once on the working screen`).toHaveCount(1);
        await expect(page.getByText(/^Set \d+ of \d+$/), 'the set is named once').toHaveCount(1);
        await expect(page.getByText(/^Set \d+\/\d+$/), 'no "SET n/m" in the header').toHaveCount(0);
        await expect(page.getByText(/^\d+ of \d+ exercises$/), 'the header carries the exercise progress').toHaveCount(1);
        // the quiet actions keep a 44 px hit area
        for (const label of ['Skip', 'Show alternatives']) {
          const box = await page.locator('.jf-wo-bar').getByRole('button', { name: label, exact: true }).boundingBox();
          expect(box.height, `"${label}" hit area`).toBeGreaterThanOrEqual(44);
        }
        workingChecked = true;
      }
      if (!repsTapped && (await tapZone.isVisible())) {
        // Exercise the rep counter for real on the first rep-based exercise
        await tapZone.click();
        await tapZone.click();
        repsTapped = true;
      }
      await allDone.click();
      continue;
    }
    if (await skipRest.isVisible()) {
      // The rest screen names the set just finished. currentSet only increments
      // when rest ENDS, so the label must read the same number the header does —
      // "Set 0 of 3 complete" after the first set was a live off-by-one.
      const label = await page.getByText(/Set \d+ of \d+ complete/).textContent();
      const n = Number(label.match(/Set (\d+) of/)[1]);
      expect(n, `rest label "${label}" must name a completed set (never 0)`).toBeGreaterThanOrEqual(1);
      expect(n, `rest label "${label}" must agree with the set just worked (${lastWorkingSet})`).toBe(lastWorkingSet);
      await expect(page.getByText(/^Set \d+\/\d+$/), 'the rest header does not repeat the set').toHaveCount(0);
      restLabelChecked = true;
      await skipRest.click(); continue;
    }
    if (await skipExercise.isVisible()) { await skipExercise.click(); continue; }
    await page.waitForTimeout(250);
  }

  expect(repsTapped, 'at least one rep-based exercise should have been tapped').toBe(true);
  expect(restLabelChecked, 'the rest phase should have been seen at least once').toBe(true);
  await expect(sessionDone).toBeVisible();

  expect(workingChecked, 'the working screen should have been inspected').toBe(true);

  // Session rating (UX review A): three big buttons, no slider, nothing pre-selected, save disabled until one is chosen
  await expect(page.locator('.jf-rate__btn')).toHaveCount(3);
  await expect(page.locator('input[type="range"]'), 'no RPE slider').toHaveCount(0);
  await expect(page.getByText(/RPE/), 'no RPE jargon').toHaveCount(0);
  for (const label of ['Too easy', 'Just right', 'Too hard']) {
    const btn = page.getByRole('button', { name: label, exact: true });
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect((await btn.boundingBox()).height, `"${label}" is >= 56 px tall`).toBeGreaterThanOrEqual(56);
  }
  const logBtn = page.getByRole('button', { name: 'Log session →' });
  await expect(logBtn).toBeDisabled();
  await expect(page.getByPlaceholder('Add a note (optional)'), 'the note hides behind a link').toHaveCount(0);
  await page.getByRole('button', { name: 'Add a note', exact: true }).click();
  await expect(page.getByPlaceholder('Add a note (optional)')).toBeVisible();
  await page.getByRole('button', { name: 'Too hard', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Too hard', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(logBtn).toBeEnabled();
  await page.getByRole('button', { name: 'Just right', exact: true }).click();
  await logBtn.click();

  // (d) UAT release 2 — the done card: three controls by default instead of seventeen
  //     (the UAT count). Guard: at most 6 buttons inside the card; "Log extra activity"
  //     is ONE row that opens the activity chips in a sheet.
  const doneCard = page.getByTestId('done-card');
  await expect(doneCard).toBeVisible({ timeout: 15_000 });
  await expect(doneCard.getByText('Session Complete')).toBeVisible();
  const doneButtons = await doneCard.getByRole('button').count();
  expect(doneButtons, `the done card renders ${doneButtons} buttons by default — at most 6`).toBeLessThanOrEqual(6);
  await expect(doneCard.getByRole('button', { name: 'Run', exact: true }), 'the activity chips are not on the card').toHaveCount(0);
  await doneCard.getByRole('button', { name: 'Log extra activity' }).click();
  const sheet = page.getByRole('dialog', { name: 'Log extra activity' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('button', { name: 'Run', exact: true }).click();
  await sheet.getByRole('button', { name: '30m', exact: true }).click();
  await sheet.getByRole('button', { name: 'Log it →' }).click();
  await expect(sheet).toHaveCount(0);
  await expect(doneCard.getByText('Activity logged')).toBeVisible();

  // The rating is stored as the value the server reads (Just right = 5), not a 1–10 slider number.
  const saved = await (await page.request.get('/api/execution?limit=30')).json();
  expect((saved.executions ?? []).some((e) => e.perceived_exertion === 5), 'the "Just right" session is stored with perceived_exertion 5').toBe(true);

  // Completed session shows up in Progress
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText('RECENT SESSIONS')).toBeVisible({ timeout: 15_000 });
});

// UAT D1 — the cancel overlay rendered <Glass> without importing it: "← Cancel" →
// ReferenceError → the error boundary replaced the whole app and the session was gone.
test('workout cancel — "← Cancel" → "Quit workout?" → Quit returns to Today, no crash (UAT D1)', async ({ page }) => {
  await signupFresh(page, '-cancel');
  await pickGeneralPath(page);
  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await startSession.click();
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await page.getByRole('button', { name: '← Cancel' }).click();
  await expect(page.getByText('Quit workout?')).toBeVisible();
  await page.getByRole('button', { name: 'Quit', exact: true }).click();
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
});

// (c) UAT release 2 — a safe stop. One set done → "← Cancel" offers "Stop and save"; the
//     sets done are saved as status 'abandoned' with execution_json.stopped_after, and
//     Today shows "Stopped after 1 of N exercises".
test('workout stop and save — one set done → "Stop and save" → Today shows the stopped card, history has it abandoned', async ({ page }) => {
  await signupFresh(page, '-stop');
  await pickGeneralPath(page);
  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await startSession.click();
  await page.getByRole('button', { name: 'Start Workout' }).click();

  // Complete exactly one set of the first exercise, whatever its kind.
  let setDone = false;
  for (let i = 0; i < 40 && !setDone; i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const startTimer = page.getByRole('button', { name: 'Start', exact: true });
    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) { await allDone.click(); setDone = true; break; }
    if (await startTimer.isVisible()) {
      await startTimer.click();
      await page.getByRole('button', { name: /Done early/ }).click();
      setDone = true; break;
    }
    await page.waitForTimeout(250);
  }
  expect(setDone, 'one set of the first exercise should have been completed').toBe(true);
  const total = Number((await page.getByText(/^\d+ of \d+ exercises$/).first().textContent()).match(/of (\d+)/)[1]);

  await page.getByRole('button', { name: '← Cancel' }).click();
  await expect(page.getByText('Quit workout?')).toBeVisible();
  await expect(page.getByText("Your progress won't be saved.")).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Discard' })).toBeVisible();
  await page.getByRole('button', { name: 'Stop and save' }).click();

  const doneCard = page.getByTestId('done-card');
  await expect(doneCard).toBeVisible({ timeout: 15_000 });
  await expect(doneCard.getByText(`Stopped after 1 of ${total} exercises`)).toBeVisible();

  const history = await (await page.request.get('/api/execution?limit=30')).json();
  const stopped = (history.executions ?? []).find((e) => e.status === 'abandoned');
  expect(stopped, `GET /api/execution should hold an abandoned execution, got ${JSON.stringify((history.executions ?? []).map((e) => e.status))}`).toBeTruthy();
  expect(stopped.stopped_after).toEqual({ exercises_done: 1, exercises_total: total });
  // Principle 1 — the stopped day counts as showing up.
  const score = await (await page.request.get('/api/score')).json();
  expect(score.breakdown?.activeDays, 'a stopped session with a set done counts for the consistency score').toBe(1);
});

// UX review A, finding 2 — without the Wake Lock API the amber tip is ONE dismissible line inside the
// first instruction screen: it does not push the header, goes away on ×, and does not come back that day.
test('wake-lock tip — one dismissible line, below the header, not again the same day (UX review A)', async ({ page }) => {
  await page.addInitScript(() => { try { delete Navigator.prototype.wakeLock; } catch { /* keep the real one */ } });
  await signupFresh(page, '-waketip');
  await pickGeneralPath(page);
  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await startSession.click();
  await page.getByRole('button', { name: 'Start Workout' }).click();

  const tip = page.getByTestId('wake-tip');
  await expect(tip).toBeVisible();
  const head = await page.locator('.jf-wo-head').boundingBox();
  const tipBox = await tip.boundingBox();
  expect(head.y, 'the header is not pushed down by the tip').toBeLessThanOrEqual(1);
  expect(tipBox.y, 'the tip sits below the header').toBeGreaterThanOrEqual(head.y + head.height);
  const x = tip.getByRole('button', { name: 'Close' });
  const xb = await x.boundingBox();
  expect(Math.min(xb.width, xb.height), 'the × is a 44 px target').toBeGreaterThanOrEqual(44);
  await x.click();
  await expect(tip).toHaveCount(0);
  await page.getByRole('button', { name: /Ready/ }).click();
  await expect(tip).toHaveCount(0);
  // not again that day: leave the workout, start it again
  await page.getByRole('button', { name: '← Cancel' }).click();
  await page.getByRole('button', { name: 'Quit', exact: true }).click();
  await page.getByRole('button', { name: /START SESSION/ }).click();
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await expect(page.getByRole('button', { name: /Ready/ })).toBeVisible();
  await expect(page.getByTestId('wake-tip')).toHaveCount(0);
});

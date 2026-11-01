/**
 * Journey 7 (C-E19a): WorkoutView state machine driven for real —
 * instruction → working (rep taps) → resting (skip) → … → session feedback → history.
 * Unlike journey-core (which skips every exercise), this taps the rep zone,
 * completes sets, and passes through the rest phase.
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

test('workout state machine — rep taps, set completion, rest skip, RPE, history', async ({ page }) => {
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

  // Drive whatever phase is on screen until the feedback screen appears.
  for (let i = 0; i < 60 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    const skipExercise = page.getByRole('button', { name: 'Skip', exact: true });

    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) {
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
      const header = await page.getByText(/^Set \d+\/\d+$/).textContent();
      const n = Number(label.match(/Set (\d+) of/)[1]);
      const h = Number(header.match(/Set (\d+)\//)[1]);
      expect(n, `rest label "${label}" must name a completed set (never 0)`).toBeGreaterThanOrEqual(1);
      expect(n, `rest label "${label}" must agree with the header "${header}"`).toBe(h);
      restLabelChecked = true;
      await skipRest.click(); continue;
    }
    if (await skipExercise.isVisible()) { await skipExercise.click(); continue; }
    await page.waitForTimeout(250);
  }

  expect(repsTapped, 'at least one rep-based exercise should have been tapped').toBe(true);
  expect(restLabelChecked, 'the rest phase should have been seen at least once').toBe(true);
  await expect(sessionDone).toBeVisible();

  // RPE feedback screen → log the session
  await page.getByRole('button', { name: 'Log session →' }).click();

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

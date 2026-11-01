import { test, expect } from '@playwright/test';
import { signupFresh } from './helpers.js';

// C-B32 — Trainingsdagen reaches the planner. Settings → Goal & coach → 2x, two training
// days logged earlier this ISO week → today is a rest day, and the why-panel says it is the
// weekly target that changed today. English suite (jf_lang=en): t() returns the keys.
//
// The rule is weekday-bound and the server only accepts sessions for today … today−6, so
// "today" is chosen from the real date: Wed–Sun → today itself (trained the two days
// before); Tuesday → tomorrow (trained Monday and today); Monday → yesterday, a Sunday
// (trained Friday and Saturday). The browser clock is fixed to that day only after the
// setup, so the plan stored at onboarding (for the real today) is either that day — and
// dropped by the target change — or another day.

const DAY = 86_400_000;
const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

function scenario(nowMs = Date.now()) {
  const wd = ((new Date(nowMs).getUTCDay() + 6) % 7) + 1;   // 1 = Monday … 7 = Sunday
  const shift = wd >= 3 ? 0 : wd === 2 ? 1 : -1;
  const todayMs = nowMs + shift * DAY;
  return { today: iso(todayMs), trained: [iso(todayMs - DAY), iso(todayMs - 2 * DAY)] };
}

test('weekly target 2x met → today is a rest day with the reason in "Why this plan?" (C-B32)', async ({ page }) => {
  await signupFresh(page, '-wt');
  const { today, trained } = scenario();

  // Two training days earlier this week (the same POST the "log a training" sheet sends).
  for (const date of trained) {
    const res = await page.request.post('/api/execution', { data: { date, session_type: 'run', duration_sec: 1800 } });
    expect(res.ok(), `logging ${date}`).toBe(true);
  }

  // Settings → Goal & coach → TRAINING DAYS 2x. It shows no chip lit until a target is set.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();
  await expect(page.getByText('No weekly target — the planner plans a session every day.')).toBeVisible({ timeout: 10_000 });
  const saved = page.waitForResponse((r) => r.url().includes('/api/profile') && r.request().method() === 'POST');
  await page.getByRole('button', { name: '2x', exact: true }).click();
  expect((await saved).ok()).toBe(true);
  await expect(page.getByRole('button', { name: '2x', exact: true })).toHaveAttribute('aria-pressed', 'true');

  // The chosen day, with its check-in already answered so Today loads the plan directly.
  await page.clock.setFixedTime(new Date(`${today}T10:00:00Z`));
  await page.evaluate((d) => { localStorage.setItem('jf_checkin_date', d); localStorage.setItem('jf_quick_checkin', d); }, today);
  const planned = page.waitForResponse((r) => r.url().includes('/api/plan') && r.request().method() === 'POST', { timeout: 30_000 });
  await page.reload();
  const body = await (await planned).json();
  expect(body.plan?.date).toBe(today);
  expect(body.plan?.slot_type, 'two of two training days done → rest').toBe('rest');
  expect((body.plan?.rule_trace ?? []).some((l) => l.startsWith('R599')), 'R599 in the trace').toBe(true);

  // Today: the rest card names the weekly target, and the why-panel lists it under "Changed today".
  await expect(page.getByRole('button', { name: 'Recovery Mode Active' })).toBeVisible({ timeout: 30_000 });
  const reason = 'Your weekly target (2x) is reached — rest today.';
  await expect(page.getByText(reason)).toBeVisible();
  await page.getByRole('button', { name: 'Why this plan?' }).click();
  const panel = page.getByTestId('why-panel');
  await expect(panel.getByText('Changed today')).toBeVisible();
  await expect(panel.getByText(reason)).toBeVisible();
  // A rest day is advice: your own training stays one tap away.
  await expect(page.getByRole('button', { name: 'Own training' })).toBeVisible();
});

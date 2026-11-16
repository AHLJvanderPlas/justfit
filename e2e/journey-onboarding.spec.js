/**
 * UX review E (finding 13): onboarding on a 320 × 568 phone. The scroll area ends above the footer, a fade says
 * when more follows, nothing selectable hides behind Terug / Doorgaan, session length comes before equipment,
 * "More equipment" holds the rest, and "Skip this step" survives only where skipping differs from continuing.
 */
import { test, expect } from '@playwright/test';

/**
 * Every control of the step: scroll the body to its end and check that (a) the scroll area ends above the
 * footer, (b) each control can be brought fully into the visible scroll box, (c) nothing sits under the footer
 * at the end. Returns the problems.
 */
async function auditStep(page) {
  return page.evaluate(async () => {
    const body = document.querySelector('.jf-ob__body'), foot = document.querySelector('.jf-ob__foot');
    const out = [];
    if (!body || !foot) return ['no onboarding body/footer'];
    const f = foot.getBoundingClientRect();
    const controls = [...body.querySelectorAll('button, input, select, textarea, a')];
    for (const el of controls) {
      el.scrollIntoView({ block: 'nearest' });
      await new Promise((r) => requestAnimationFrame(r));
      const b = body.getBoundingClientRect(), r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      const name = (el.innerText || el.getAttribute('aria-label') || el.id || el.tagName).trim().slice(0, 30);
      if (r.top < b.top - 1 || r.bottom > b.bottom + 1) out.push(`not fully inside the scroll box: ${name}`);
      if (r.bottom > f.top + 1) out.push(`under the footer: ${name}`);
    }
    body.scrollTop = body.scrollHeight;
    await new Promise((r) => requestAnimationFrame(r));
    const b = body.getBoundingClientRect();
    if (b.bottom > f.top + 1) out.push('the scroll area runs under the footer');
    const last = controls.filter((e) => e.getBoundingClientRect().height > 0).pop();
    if (last && last.getBoundingClientRect().bottom > b.bottom + 1) out.push('the last control is cut off at the end of the scroll');
    body.scrollTop = 0;
    return out;
  });
}

async function startOnboarding(page, suffix) {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(`e2e-ob-${Date.now()}${suffix}@justfit.cc`);
  await page.locator('#password').fill('e2e-test-pw');
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');
}

test('onboarding at 320 × 568: nothing hides under the footer, length before equipment, More equipment, one skip', async ({ page }) => {
  await startOnboarding(page, '-a');
  // waiver
  await expect(page.locator('.jf-ob__body')).toBeVisible({ timeout: 20_000 });
  expect(await auditStep(page)).toEqual([]);
  await page.getByRole('button', { name: /I Agree/ }).click();

  // goal — a goal answers the step; Continue keeps the default; no skip link (it would do the same)
  await expect(page.locator('[data-goal="health"]')).toBeVisible();
  expect(await auditStep(page)).toEqual([]);
  await expect(page.getByRole('button', { name: 'Skip this step' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // about you — name, sex and the three experience chips fit the first screen without scrolling
  await expect(page.getByRole('heading', { name: 'About you' })).toBeVisible();
  const fits = await page.evaluate(() => {
    const body = document.querySelector('.jf-ob__body').getBoundingClientRect();
    const inView = (el) => { const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= body.top - 1 && r.bottom <= body.bottom + 1; };
    const chips = [...document.querySelectorAll('.jf-ob__exp .jf-ob__opt')];
    return {
      name: inView(document.getElementById('jf-ob-name')),
      sex: [...document.querySelectorAll('.jf-ob__grid2 .jf-ob__opt')].every(inView),
      chips: chips.length, chipsInView: chips.every(inView), oneRow: new Set(chips.map((c) => Math.round(c.getBoundingClientRect().top))).size === 1,
      desc: inView(document.querySelector('.jf-ob__exp-desc')),
    };
  });
  expect(fits).toEqual({ name: true, sex: true, chips: 3, chipsInView: true, oneRow: true, desc: true });
  await expect(page.locator('.jf-ob__exp .jf-ob__opt')).toHaveText(['Beginner', 'Intermediate', 'Advanced']);
  await page.getByRole('button', { name: 'Advanced', exact: true }).click();
  await expect(page.locator('.jf-ob__exp-desc')).toContainText('Training for 2+ years');
  expect(await auditStep(page)).toEqual([]);
  // the one step that keeps "Skip this step": nothing is pre-answered here (name, sex, weight, height)
  await expect(page.getByRole('button', { name: 'Skip this step' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();

  // equipment & time — length first (default 45 min pre-selected), four options, the rest behind "More equipment"
  await expect(page.getByRole('heading', { name: /Equipment & time/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Skip this step' })).toHaveCount(0);
  const order = await page.evaluate(() => ({
    timeBottom: Math.max(...[...document.querySelectorAll('.jf-ob__time')].map((e) => e.getBoundingClientRect().bottom)),
    equipTop: document.querySelector('.jf-ob__stack .jf-ob__opt').getBoundingClientRect().top,
    on: document.querySelector('.jf-ob__time--on')?.textContent,
  }));
  expect(order.timeBottom).toBeLessThanOrEqual(order.equipTop);
  expect(order.on).toBe('45m');
  const stack = page.locator('.jf-ob__stack .jf-ob__opt');
  await expect(stack).toHaveCount(4);
  await expect(stack).toHaveText([/No equipment/, /Dumbbells/, /Resistance bands/, /Pull-up bar/]);
  expect(await auditStep(page)).toEqual([]);
  const more = page.getByRole('button', { name: 'More equipment' });
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await more.click();
  await expect(stack).toHaveCount(8);
  await expect(page.getByRole('button', { name: /Rowing machine/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Less equipment' })).toHaveAttribute('aria-expanded', 'true');
  expect(await auditStep(page)).toEqual([]);

  // pick something from the hidden part, finish, and check what was stored
  await page.getByRole('button', { name: /Rowing machine/ }).click();
  await page.getByRole('button', { name: 'Start Training' }).click();
  await expect(page.getByRole('button', { name: /START SESSION|Recovery Mode Active/ })).toBeVisible({ timeout: 30_000 });
  const profile = await (await page.request.get('/api/profile')).json();
  expect(profile.preferences.available_equipment).toContain('rowing_machine');
  expect(profile.experience_level ?? profile.preferences?.experience_level).toBe('advanced');
  expect(profile.session_duration_min).toBe(45);
});

test('a re-done onboarding opens "More equipment" when something in it is already selected', async ({ page }) => {
  await startOnboarding(page, '-b');
  await page.getByRole('button', { name: /I Agree/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'More equipment' }).click();
  await page.getByRole('button', { name: /Treadmill/ }).click();
  await page.getByRole('button', { name: 'Start Training' }).click();
  await expect(page.getByRole('button', { name: /START SESSION|Recovery Mode Active/ })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^You/ }).click();
  await page.getByRole('button', { name: 'Re-do onboarding' }).click();
  await page.getByRole('button', { name: /I Agree/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Equipment & time/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Less equipment' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Treadmill/ })).toHaveAttribute('aria-pressed', 'true');
});

test('the fade shows only while more content follows', async ({ page }) => {
  await startOnboarding(page, '-c');
  await page.getByRole('button', { name: /I Agree/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'More equipment' }).click();
  const fade = page.locator('.jf-ob__fade');
  await expect(fade).toHaveCSS('opacity', '1');                      // sports are still below
  await page.locator('.jf-ob__body').evaluate((el) => { el.scrollTop = el.scrollHeight; });
  await expect(fade).toHaveCSS('opacity', '0');
});

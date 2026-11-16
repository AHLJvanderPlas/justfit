/**
 * UX review C — accessibility journey (keyboard + screen-reader attributes). No axe library is
 * installed, so the specific attributes are asserted: Tab reaches START SESSION and Enter starts it;
 * a sheet traps focus, Escape closes it and focus returns to the opener; the nav marks the current
 * tab; <html lang> follows the language; one h1 and a main landmark; live regions exist; icon-only
 * buttons are named; every svg is hidden from the accessibility tree; no input is under 16 px.
 */
import { test, expect } from '@playwright/test';
import { signupFresh } from './helpers.js';

test('keyboard journey, dialogs, landmarks and live regions', async ({ page }) => {
  await signupFresh(page, '-a11y');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  // landmarks and headings
  await expect(page.locator('[role="main"], main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('nav[aria-label]')).toHaveCount(1);
  await expect(page.locator('nav button[aria-current="page"]')).toHaveCount(1);
  await expect(page.getByTestId('announcer')).toHaveAttribute('aria-live', 'polite');

  // decorative svgs are hidden; icon-only buttons are named
  const exposedSvgs = await page.locator('svg:not([aria-hidden="true"]):not([role]):not([aria-label])').count();
  expect(exposedSvgs).toBe(0);
  const unnamed = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !b.innerText.trim() && !b.getAttribute('aria-label') && !b.getAttribute('aria-labelledby') && !b.title).length);
  expect(unnamed).toBe(0);

  // a visible focus ring: 2 px outline on the focused control
  const start = page.getByRole('button', { name: /START SESSION/ });
  await start.focus();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  const ring = await start.evaluate((el) => { const cs = getComputedStyle(el); return { w: cs.outlineWidth, s: cs.outlineStyle }; });
  expect(ring).toEqual({ w: '2px', s: 'solid' });

  // Tab reaches START SESSION from the top of the page and Enter activates it
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  let reached = false;
  for (let i = 0; i < 40 && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await start.evaluate((el) => el === document.activeElement);
  }
  expect(reached).toBe(true);

  // the check-in sheet: focus moves in, Tab is trapped, Escape closes, focus returns to the opener
  const opener = page.getByRole('button', { name: /Check-in/ }).first();
  await opener.focus();
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('aria-modal', 'true');
  await expect(sheet).toHaveAttribute('aria-label', /.+/);
  expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('Tab');
    expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Shift+Tab');
  expect(await sheet.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await opener.evaluate((el) => el === document.activeElement)).toBe(true);

  // START SESSION by keyboard, then the cancel confirm is a dialog too
  await start.focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('button', { name: /Cancel/ }).click();
  const confirm = page.getByRole('dialog', { name: 'Quit workout?' });
  await expect(confirm).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(confirm).toHaveCount(0);

  // rep counter is a live region; the set announces itself
  await page.getByRole('button', { name: /Ready/ }).click();
  const count = page.locator('.jf-wo-count');
  await expect(count).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: 'TAP TO COUNT REP' }).click();
  await page.getByRole('button', { name: /All \d+ reps done/ }).click();
  await expect(page.getByTestId('announcer')).toContainText(/Set 1 of \d+ done|Rest: \d+ seconds/);
});

test('login page: names, autocomplete, 16 px fields, language', async ({ page }) => {
  await page.goto('/login.html');
  await expect(page.locator('html')).toHaveAttribute('lang', /^(nl|en)$/);
  await expect(page.locator('h1')).toHaveCount(1);
  for (const id of ['email', 'magic-email', 'password']) {
    const input = page.locator(`#${id}`);
    await expect(page.locator(`label[for="${id}"]`)).toHaveCount(1);
    expect(parseFloat(await input.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
  }
  await expect(page.locator('#email')).toHaveAttribute('autocomplete', 'email');
  await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'current-password');
  await expect(page.locator('#tab-login')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#tab-signup').click();
  await expect(page.locator('#tab-signup')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#password')).toHaveAttribute('autocomplete', 'new-password');
  for (const sel of ['#tab-login', '#tab-signup', '#guest-btn']) {
    const box = await page.locator(sel).boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
  }
});

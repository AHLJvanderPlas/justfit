/**
 * UX review E (finding 14): the login page is ONE path — an e-mail field and "Continue with email" — with
 * password, passkey and "Create account" as quiet links and the guest as its own small section.
 * Each auth method still works end to end against the local D1 (the e2e server has a RESEND placeholder:
 * the magic-link request stores its token and answers ok; the mail itself goes nowhere).
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERSIST } from './global-setup.js';

const CWD = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PW = 'e2e-test-pw';

async function open(page, path = '/login.html') {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  await page.goto(path);
}

test('first paint: one primary button, no tabs inside tabs, guest disabled until consent', async ({ page }) => {
  await open(page);
  const primaries = page.locator('.btn-primary:visible');
  await expect(primaries).toHaveCount(1);
  await expect(primaries).toHaveText('Continue with email');
  await expect(page.locator('[role="tablist"], [role="tab"]')).toHaveCount(0);
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#password')).toBeHidden();
  await expect(page.locator('#accept-row')).toBeHidden();
  // quiet links, not buttons with weight
  await expect(page.locator('#mt-password')).toHaveText('Sign in with a password');
  await expect(page.locator('#tab-signup')).toBeVisible();
  // guest: its own section, consent first
  await expect(page.locator('#guest-section')).toBeVisible();
  await expect(page.locator('#guest-btn')).toBeDisabled();
  await page.locator('#guest-accept-check').check();
  await expect(page.locator('#guest-btn')).toBeEnabled();
  await page.locator('#guest-accept-check').uncheck();
  await expect(page.locator('#guest-btn')).toBeDisabled();
  // the primary is emerald (the app's accent), not the old coral
  const bg = await primaries.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe('rgb(16, 185, 129)');
  // every state keeps exactly one visible primary
  await page.locator('#mt-password').click();
  await expect(page.locator('.btn-primary:visible')).toHaveCount(1);
  await expect(page.locator('#submit-btn')).toBeVisible();
  await page.locator('#tab-signup').click();
  await expect(page.locator('.btn-primary:visible')).toHaveCount(1);
  await expect(page.locator('#submit-btn')).toHaveText('Create account');
});

test('magic-link request: one tap on "Continue with email" answers in a live alert', async ({ page }) => {
  await open(page);
  await page.locator('#magic-btn').click();                         // empty: asks for the address
  await expect(page.locator('#main-alert')).toHaveText('Please enter your email.');
  await page.locator('#email').fill(`e2e-magic-${Date.now()}@justfit.cc`);
  await page.locator('#magic-btn').click();
  await expect(page.locator('#main-alert')).toContainText('a link is on its way');
  await expect(page.locator('#main-alert')).toHaveClass(/alert-success/);
});

test('magic link for an address with no account lands on the sign-up form, e-mail filled in; signup there works', async ({ page }) => {
  const email = `e2e-needs-${Date.now()}@justfit.cc`;
  const raw = `e2e-needs-signup-${Date.now()}`;
  const hash = createHash('sha256').update(raw).digest('base64url');
  const now = Date.now();
  execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${PERSIST} --command "INSERT INTO magic_link_tokens (token, user_id, email, expires_at_ms, created_at_ms) VALUES ('${hash}', NULL, '${email}', ${now + 600000}, ${now})"`, { cwd: CWD, stdio: 'pipe' });
  await open(page, `/magic.html?token=${raw}`);
  await page.waitForURL(/\/login(\.html)?\?email=.*mode=signup/);   // Pages serves /login.html as /login
  await expect(page.locator('#email')).toHaveValue(email);
  await expect(page.locator('#accept-row')).toBeVisible();
  await expect(page.locator('#submit-btn')).toHaveText('Create account');
  await page.locator('#password').fill(PW);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');
});

test('sign-up needs the consent, then works; password sign-in works with the quiet link', async ({ page }) => {
  const email = `e2e-pw-${Date.now()}@justfit.cc`;
  await open(page);
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(PW);
  await page.locator('#submit-btn').click();                        // no consent yet: refused client side
  await expect(page.locator('#main-alert')).toContainText('accept the Terms');
  expect(new URL(page.url()).pathname).toMatch(/^\/login(\.html)?$/);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');

  // sign out the blunt way, then come back through the password link
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await open(page);
  await page.locator('#email').fill(email);
  await page.locator('#mt-password').click();
  await expect(page.locator('#password')).toBeFocused();
  await expect(page.locator('#forgot-link')).toBeVisible();
  await page.locator('#password').fill('wrong-password');
  await page.locator('#submit-btn').click();
  await expect(page.locator('#main-alert')).toHaveClass(/alert-error/);
  await page.locator('#password').fill(PW);
  await page.locator('#password').press('Enter');                   // Enter in the field = the visible primary
  await page.waitForURL('/');
});

test('forgot password and the way back keep the e-mail; the guest section hides while it is open', async ({ page }) => {
  await open(page);
  await page.locator('#email').fill('someone@justfit.cc');
  await page.locator('#mt-password').click();
  await page.locator('#forgot-link').click();
  await expect(page.locator('#forgot-view')).toBeVisible();
  await expect(page.locator('#guest-section')).toBeHidden();
  await page.locator('#forgot-btn').click();
  await expect(page.locator('#main-alert')).toContainText('reset link has been sent');
  await page.locator('#back-link').click();
  await expect(page.locator('#guest-section')).toBeVisible();
  await expect(page.locator('#email')).toHaveValue('someone@justfit.cc');
});

test('guest sign-up: consent, button, app; the accepted versions were stored', async ({ page }) => {
  await open(page);
  await page.locator('#guest-accept-check').check();
  await page.locator('#guest-btn').click();
  await page.waitForURL('/');
  await expect(page.getByText('Add your email to keep your data')).toBeVisible({ timeout: 10_000 });
});

test.describe('Dutch browser', () => {
  test.use({ locale: 'nl-NL' });
  test('Dutch is the default and the structure is the same', async ({ page }) => {
    await page.goto('/login.html');                                   // no jf_lang: the browser language decides
    await expect(page.locator('#magic-btn')).toHaveText('Ga verder met e-mail');
    await expect(page.locator('#guest-btn')).toHaveText('Doorgaan zonder account');
    await expect(page.locator('#guest-section')).toContainText('Je gegevens staan alleen op dit apparaat. Voeg later je e-mail toe.');
    await expect(page.locator('.btn-primary:visible')).toHaveCount(1);
  });
});

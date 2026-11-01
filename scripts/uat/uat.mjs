// UAT runner — 30 personas × their first-week flows, against the local build on :8788.
// Usage: node scripts/uat/uat.mjs <personaId> [...]   (no args = all). Output: .uat-out/<id>/{NN-*.png, log.json}
// Needs the local server: npx wrangler pages dev packages/client-app/dist --port 8788 --persist-to .wrangler/e2e-state (see e2e/).
// Gate (UAT release 6): personas marked `gate: true` (p01-sanne, p11-peter, p30-erik) must show 0 clipped titles,
// 0 text under 11 px (award names excepted), ≤ 10 taps from "Doorgaan zonder account" / signup to the first Today
// card with a session, no page or console errors, no crash and no failed flow. Any gated failure → exit code 1.
import { chromium, devices } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PERSONAS } from './personas.mjs';

const OUT = new URL('../../.uat-out/', import.meta.url).pathname;
const BASE = 'http://localhost:8788';
const re = (s) => new RegExp(s, 'i');

class Run {
  constructor(persona) { this.p = persona; this.dir = `${OUT}${persona.id}/`; mkdirSync(this.dir, { recursive: true }); this.n = 0; this.log = { persona: persona.id, flows: [], audits: [] }; this.flow = null; }
  start(name) { this.flow = { name, taps: 0, screens: 0, ok: true, notes: [], t0: Date.now() }; this.log.flows.push(this.flow); }
  note(s) { (this.flow ?? this.log).notes?.push?.(s) ?? (this.log.notes = [...(this.log.notes ?? []), s]); console.log(`  [${this.p.id}] ${s}`); }
  fail(s) { if (this.flow) { this.flow.ok = false; } this.note(`FAIL ${s}`); }
  end() { if (this.flow) { this.flow.ms = Date.now() - this.flow.t0; this.flow = null; } }
  async shot(page, name, full = false) { this.n += 1; const f = `${this.dir}${String(this.n).padStart(2, '0')}-${name}.png`; await page.screenshot({ path: f, fullPage: full }); if (this.flow) this.flow.screens += 1; await this.audit(page, name); }
  tap() { if (this.flow) this.flow.taps += 1; }
  async audit(page, screen) {
    const a = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'; };
      const ctrls = [...document.querySelectorAll('button, a, input, [role=button]')].filter(vis);
      const small = ctrls.filter((el) => { const r = el.getBoundingClientRect(); return (r.height < 40 || r.width < 40) && r.top < innerHeight && r.bottom > 0; }).map((el) => ({ text: (el.innerText || el.getAttribute('aria-label') || el.placeholder || el.tagName).trim().slice(0, 40), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
      // Text under 11 px anywhere on the page (not only the viewport — screenshots are full-page), at its RENDERED
      // size: SVG text is scaled by its viewBox. Award names are exempt by design (data-award-name).
      const tiny = []; const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) {
        const t = node.textContent.trim(); if (t.length < 2) continue; const el = node.parentElement; if (!el || !vis(el)) continue;
        if (el.closest('[data-award-name]')) continue;
        let fs = parseFloat(getComputedStyle(el).fontSize);
        if (el instanceof SVGElement && el.getScreenCTM) { const m = el.getScreenCTM(); if (m) fs *= Math.hypot(m.a, m.b); }
        if (fs < 10.95) tiny.push({ text: t.slice(0, 40), px: Math.round(fs * 10) / 10 });
      }
      // Clipped titles: a heading or display-sized line whose text is wider than its box, or that runs off the screen.
      const clipped = [];
      for (const el of document.querySelectorAll('h1, h2, h3, [class*="title"], [data-testid$="title"], div, span')) {
        if (!vis(el)) continue;
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1); if (!own) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        const titleLike = /^H[1-3]$/.test(el.tagName) || /title/.test(el.className?.baseVal ?? el.className ?? '') || fs >= 20;
        if (!titleLike) continue;
        const r = el.getBoundingClientRect();
        const overflowX = el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0;
        const offScreen = r.right > innerWidth + 1 || r.left < -1;
        if (overflowX || offScreen) clipped.push({ text: el.textContent.trim().slice(0, 40), px: fs, sw: el.scrollWidth, cw: el.clientWidth });
      }
      const overflow = document.documentElement.scrollWidth > innerWidth + 1;
      const nav = document.querySelector('nav, [class*="nav"], footer'); const navTop = nav ? nav.getBoundingClientRect().top : innerHeight;
      const underNav = ctrls.filter((el) => { const r = el.getBoundingClientRect(); return nav && !nav.contains(el) && r.top < innerHeight && r.bottom > navTop && r.top < navTop && r.bottom - navTop > 8; }).map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40));
      return { small: small.slice(0, 12), smallCount: small.length, tiny: tiny.slice(0, 8), tinyCount: tiny.length, clipped: clipped.slice(0, 6), clippedCount: clipped.length, overflow, underNav: underNav.slice(0, 6), vw: innerWidth, vh: innerHeight };
    });
    this.log.audits.push({ screen, flow: this.flow?.name ?? null, ...a });
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
async function click(run, loc, label, timeout = 12_000) {
  try { await loc.first().click({ timeout }); run.tap(); return true; } catch (e) { try { const pg = loc.page(); await pg.screenshot({ path: `${run.dir}/fail-${label.replace(/[^a-z]/gi, "")}.png` }); run.note("blocker: " + await pg.evaluate(() => { const n = [...document.querySelectorAll("nav button")]; const b = n[1]; if (!b) return "no nav"; const r = b.getBoundingClientRect(); const out = []; for (let e = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); e && out.length < 10; e = e.parentElement) out.push(e.tagName + "." + (e.className || "") + (getComputedStyle(e).position === "fixed" ? "[fixed z" + getComputedStyle(e).zIndex + "]" : "")); return out.join(" < "); })); } catch {} run.fail(`cannot tap "${label}": ${String(e.message).split("\n").filter(l => /intercepts|outside|not visible|resolved/.test(l)).slice(0, 3).join(" | ")}`); return false; }
}
async function fill(run, loc, value, label) { try { await loc.first().fill(value, { timeout: 8000 }); run.tap(); return true; } catch { run.fail(`cannot fill "${label}"`); return false; } }
const btn = (page, s) => page.getByRole('button', { name: re(s) });
// A person does not tap an option that is already selected: skip it when aria-pressed is true.
async function choose(run, loc, label) { const el = loc.first(); if (!(await visible(el, 800))) { run.note(`option "${label}" not found`); return false; } if ((await el.getAttribute('aria-pressed')) === 'true') return true; return click(run, el, label); }
// Scroll to the end and check that no control is left behind the fixed nav (the bottom padding is --nav-total).
async function scrollEndCheck(run, page, name) {
  const under = await page.evaluate(async () => {
    window.scrollTo(0, document.documentElement.scrollHeight); await new Promise((r) => setTimeout(r, 250));
    const nav = document.querySelector('nav'); if (!nav) return [];
    const navTop = nav.getBoundingClientRect().top;
    const out = [...document.querySelectorAll('button, a, input, [role=button]')].filter((el) => { const r = el.getBoundingClientRect(); return !nav.contains(el) && r.height > 0 && r.bottom > navTop + 1 && r.top < innerHeight; }).map((el) => (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40));
    window.scrollTo(0, 0); return out;
  });
  run.log.audits.push({ screen: `${name}-scrolled-end`, flow: run.flow?.name ?? null, underNavAtEnd: under, small: [], tiny: [], clipped: [], underNav: [] });
  if (under.length) run.note(`under the nav at the end of ${name}: ${under.join(' | ')}`);
}
const visible = async (loc, ms = 1500) => loc.first().isVisible({ timeout: ms }).catch(() => false);
// isVisible() does not wait; this does (a fresh plan takes a few seconds).
const waitVisible = async (loc, ms) => loc.first().waitFor({ state: 'visible', timeout: ms }).then(() => true).catch(() => false);
async function dismissSheets(page) { for (let i = 0; i < 2; i++) { const close = page.locator('.jf-sheet__head .jf-icon-btn'); if (await visible(close, 300)) { await close.first().click().catch(() => {}); } } }

async function crashed(run, page, where) {
  const reload = btn(page, 'Reload app|App herladen|Opnieuw laden');
  if (await visible(reload, 300)) { run.fail(`CRASH (error boundary) at ${where}`); await reload.first().click().catch(() => page.reload()); await page.waitForTimeout(2500); await dismissCheckin(run, page); return true; }
  return false;
}
async function dismissCheckin(run, page) { const good = btn(page, '^(Good|Goed)$'); if (await visible(good, 1200)) { await good.first().click().catch(() => {}); const ap = btn(page, 'Apply|Toepassen'); if (await visible(ap, 800)) await ap.first().click().catch(() => {}); await page.waitForTimeout(1200); } }
const doneScreen = (page) => page.getByText(re('Sessie klaar|Session done|Nice work|Goed gedaan'));
async function leaveWorkout(run, page) {
  // guarantee we are back on the app shell: nav visible, no overlay
  for (let i = 0; i < 3; i++) {
    if (await crashed(run, page, 'leaveWorkout')) return;
    if (await visible(btn(page, '^(VANDAAG|TODAY)$'), 600)) return;
    const cancel = btn(page, 'Annuleren|Cancel'); if (await visible(cancel, 400)) { await cancel.first().click().catch(() => {}); await page.waitForTimeout(400); }
    const quit = btn(page, '^(Stoppen|Quit|Weggooien|Discard|Ja|Yes)$'); if (await visible(quit, 600)) { await quit.first().click().catch(() => {}); await page.waitForTimeout(800); continue; }
    const skip = btn(page, 'Beoordeling overslaan|Skip rating|Sessie opslaan|Log session'); if (await visible(skip, 400)) { await skip.first().click().catch(() => {}); await page.waitForTimeout(1200); continue; }
    const back = btn(page, '^(Terug|Back|← Terug|← Back)'); if (await visible(back, 400)) { await back.first().click().catch(() => {}); await page.waitForTimeout(600); continue; }
    await dismissSheets(page); await page.waitForTimeout(400);
  }
  if (!(await visible(btn(page, '^(VANDAAG|TODAY)$'), 600))) { run.fail('stuck in overlay — reloading'); await page.reload(); await page.waitForTimeout(2500); await dismissCheckin(run, page); }
}

// ── flows ────────────────────────────────────────────────────────────────────
const GOAL_KEYS = ['fat_loss', 'strength', 'health', 'mobility', 'pregnancy'];
export async function flowSignup(run, page) {
  const p = run.p; run.start('signup');
  await page.goto('/login.html');
  await run.shot(page, 'login');
  if (!p.guest) {
    await click(run, page.locator('#tab-signup'), 'signup tab');
    await fill(run, page.locator('#email'), `uat-${p.id}-${Date.now()}@justfit.cc`, 'email');
    await fill(run, page.locator('#password'), 'uat-test-pw', 'password');
    await click(run, page.locator('#accept-check'), 'accept');
  }
  run.end();
  // UAT R6 — counted from "Doorgaan zonder account" / the signup submit to the first Today card with a session.
  run.start('onboarding');
  if (p.guest) { await run.shot(page, 'login-guest'); if (!(await click(run, page.locator('#guest-accept-check'), 'guest-accept')) || !(await click(run, page.locator('#guest-btn'), 'guest'))) return run.end(); }
  else if (!(await click(run, page.locator('#submit-btn'), 'submit'))) return run.end();
  await page.waitForURL('/', { timeout: 20_000 }).catch(() => run.fail('no redirect to app'));
  await page.waitForTimeout(1200);
  await run.shot(page, 'onboarding-0-waiver');
  if (!(await click(run, btn(page, 'I Agree|Akkoord'), 'I Agree'))) return run.end();
  await page.waitForTimeout(400);
  await run.shot(page, 'onboarding-1-goal');
  const next = async () => { const c = btn(page, '^(Continue|Doorgaan)$'); if (await visible(c, 800)) return click(run, c, 'Continue'); run.fail('no Continue button'); return false; };
  const path = p.path ?? 'general';
  if (path === 'general') {
    const goal = p.goal ?? GOAL_KEYS[p.goalIdx ?? 2] ?? 'health';
    if (!(await click(run, page.locator(`[data-goal="${goal}"]`), `goal ${goal}`))) return run.end();
  } else {
    if (!(await click(run, page.locator(`[data-path="${path}"]`), `path ${path}`))) return run.end();
    await page.waitForTimeout(400); await run.shot(page, `onboarding-1b-${path}`);
    if (path === 'running') await choose(run, page.locator('button').filter({ hasText: re('^10\\s*km$') }), '10 km');
    if (path === 'cycling') await choose(run, page.locator('button').filter({ hasText: re('Build fitness|Conditie') }), 'sub-goal');
    if (path === 'military') {
      await choose(run, page.locator('button').filter({ hasText: re('^Keuring') }), 'Keuring');
      const date = page.locator('input[type=date]'); if (await visible(date, 800)) { await date.first().fill(new Date(Date.now() + 70 * 86_400_000).toISOString().slice(0, 10)); run.tap(); }
    }
    if (!(await next())) return run.end();
  }
  await page.waitForTimeout(400); await run.shot(page, 'onboarding-2-about-you');
  if (p.name) await fill(run, page.getByPlaceholder(re('What should we call you|Hoe mogen we je noemen')), p.name, 'name');
  await choose(run, page.locator('button').filter({ hasText: re(p.sex === 'female' ? '^(Female|Vrouw)$' : '^(Male|Man)$') }), 'sex');
  await choose(run, page.locator('.jf-ob__opt--row').nth(p.expIdx ?? 0), 'experience');
  if (!(await next())) return run.end();
  await page.waitForTimeout(400); await run.shot(page, 'onboarding-3-equipment-time');
  for (const eq of (p.equipment ?? [])) await choose(run, page.locator('.jf-ob__opt').filter({ hasText: re(eq) }), `equipment ${eq}`);
  if (p.minutes) await choose(run, page.locator('.jf-ob__time').filter({ hasText: re(`^${p.minutes}\\s*(m|min)?$`) }), `${p.minutes} min`);
  if (!(await click(run, btn(page, 'Start Training|Start met trainen'), 'Start Training'))) return run.end();
  // The first Today card with a session — and no path modal after onboarding (the goal was asked once).
  const card = btn(page, 'START SESSI|Herstelmodus|Recovery Mode');
  if (!(await waitVisible(card, 30_000))) run.fail('no Today card with a session after onboarding');
  if (await visible(page.locator('.jf-pathmodal'), 1500)) run.fail('the path modal reappeared after onboarding');
  run.note(`onboarding → Today in ${run.flow.taps} taps; mood row=${await visible(page.getByTestId('mood-row'), 300)}`);
  await run.shot(page, 'today-first');
  await crashed(run, page, 'after onboarding');
  run.end();
}

export async function flowCheckin(run, page, signals = [], detail = null) {
  run.start('check-in');
  await page.waitForTimeout(800);
  const row = page.getByTestId('mood-row');
  const moodRe = run.p.mood ?? '^(Good|Goed)$';
  if (!signals.length && !detail) {
    // UAT R6 — the day's check-in is one tap on the mood row on Today.
    if (!(await waitVisible(row, 8000))) { run.note('mood row not shown'); return run.end(); }
    await run.shot(page, 'checkin-mood-row');
    await click(run, row.getByRole('button', { name: re(moodRe) }), 'mood');
    await page.waitForTimeout(1500);
    return run.end();
  }
  // Signals: the sheet, from the mood row's "Meer vertellen" (or the header Check-in).
  const more = (await visible(row, 3000)) ? row.getByRole('button', { name: re('Tell more|Meer vertellen') }) : btn(page, '^CHECK-IN$');
  if (!(await click(run, more, 'open check-in sheet'))) return run.end();
  await page.waitForTimeout(500); await run.shot(page, 'checkin-1-mood');
  const sheet = page.getByTestId('checkin-sheet');   // the mood row stays under the sheet: scope every tap
  await click(run, btn(sheet, moodRe), 'mood');
  await page.waitForTimeout(300); await run.shot(page, 'checkin-2-signals');
  for (const s of signals) { const c = btn(sheet, s); if (await visible(c, 800)) await click(run, c, s); else run.fail(`signal chip "${s}" not found`); }
  await click(run, btn(sheet, 'Apply|Toepassen'), 'Apply');
  await page.waitForTimeout(400);
  if (detail) { await run.shot(page, 'checkin-3-detail'); for (const d of detail) { const c = btn(sheet, d); if (await visible(c, 800)) await click(run, c, d); } const ap = btn(sheet, 'Apply|Toepassen'); if (await visible(ap, 800)) await click(run, ap, 'Apply detail'); }
  await page.waitForTimeout(1500);
  run.end();
}

export async function flowPath(run, page, path) {
  run.start('path-choice');
  const card = btn(page, path === 'running' ? 'RUNNING|HARDLOPEN' : path === 'cycling' ? 'CYCLING|FIETSEN' : path === 'military' ? 'MILITARY|MILITAIR' : 'GENERAL|ALGEMENE');
  if (!(await visible(page.locator('.jf-pathmodal'), 3000)) || !(await visible(card, 1000))) { run.note('path modal not shown (the path is chosen in onboarding)'); return run.end(); }
  await run.shot(page, 'path-modal');
  await click(run, card, path);
  await page.waitForTimeout(500);
  if (path !== 'general') {
    await run.shot(page, `path-${path}-followup`);
    if (path === 'running') { const km = page.locator('button').filter({ hasText: re('^10\\s*km$|^10$') }); if (await visible(km, 800)) { await km.first().click(); run.tap(); } }
    if (path === 'military') {
      const kb = page.locator('button').filter({ hasText: re('Keuring') }); if (await visible(kb, 800)) { await kb.first().click(); run.tap(); }
      const tgt = page.locator('button').filter({ hasText: re('Target date|Datum|Assessment') }); if (await visible(tgt, 800)) { await tgt.first().click(); run.tap(); }
      const date = page.locator('input[type=date]'); if (await visible(date, 800)) { await date.first().fill(new Date(Date.now() + 70 * 86_400_000).toISOString().slice(0, 10)); run.tap(); }
    }
    if (path === 'cycling') { const sg = page.locator('button').filter({ hasText: re('Build fitness|Conditie') }); if (await visible(sg, 800)) { await sg.first().click(); run.tap(); } }
    const start = btn(page, 'Start .*coach');
    if (await visible(start, 1500)) await click(run, start, 'start coach'); else run.fail('no start button in follow-up');
  }
  await page.waitForTimeout(1500);
  run.end();
}

export async function flowToday(run, page) {
  run.start('today');
  const start = btn(page, 'START SESSI|Herstelmodus|Recovery Mode|Complete the daily|check-in');
  if (!(await waitVisible(start, 30_000))) run.fail('Today card did not settle');
  await page.waitForTimeout(600);
  await run.shot(page, 'today', true);
  await scrollEndCheck(run, page, 'today');
  const whyNot = btn(page, "Lukt dit niet|Can't do this");
  const own = btn(page, 'Eigen training|Own training');
  run.note(`Today: start=${await visible(btn(page, 'START SESSI'), 300)} own=${await visible(own, 300)} whyNot=${await visible(whyNot, 300)} coachCard=${await visible(btn(page, 'Bekijk je coach|View your coach'), 300)}`);
  run.end();
}

export async function flowWorkout(run, page, { complete = false, maxExercises = 2, alternatives = false } = {}) {
  run.start(complete ? 'workout-complete' : 'workout-first-set');
  if (!(await click(run, btn(page, 'START SESSI'), 'START SESSIE', 20_000))) return run.end();
  await page.waitForTimeout(1500);
  await run.shot(page, 'workout-overview', true);
  if (!(await click(run, btn(page, 'Start training|Start Workout'), 'Start training'))) return run.end();
  await page.waitForTimeout(1200);
  await run.shot(page, 'workout-instruction');
  if (alternatives) { const alt = btn(page, 'Alternatieven|alternatives|voelt niet goed|doesn.t feel right'); if (await visible(alt, 800)) { await click(run, alt, 'alternatives'); await page.waitForTimeout(800); await run.shot(page, 'workout-alternatives'); await dismissSheets(page); const back = btn(page, 'Terug|Back|Sluiten|Close'); if (await visible(back, 400)) await back.first().click().catch(() => {}); } }
  let sets = 0, exercises = 0, timers = 0, tapped = false, altDone = false;
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (await visible(doneScreen(page), 200)) break;
    if (await crashed(run, page, 'workout loop')) break;
    const ready = btn(page, 'Klaar — laten we gaan|Ready'); const allDone = btn(page, 'Alle .* (klaar|herhalingen)|All \\d+ reps done|Set afronden|Set done'); const skipRest = btn(page, 'Rust overslaan|Skip rest'); const tapZone = btn(page, 'TIK OM REP|TAP TO COUNT');
    if (await visible(ready, 200)) { await ready.first().click(); run.tap(); exercises += 1; if (exercises === 1) { await page.waitForTimeout(600); await run.shot(page, 'workout-working'); } if (!complete && exercises > maxExercises) break; continue; }
    if (alternatives && !altDone && await visible(btn(page, 'Alternatieven tonen|Show alternatives|voelt niet goed|doesn.t feel right'), 200)) { altDone = true; await click(run, btn(page, 'Alternatieven tonen|Show alternatives|voelt niet goed|doesn.t feel right'), 'Alternatieven tonen'); await page.waitForTimeout(1500); await run.shot(page, 'workout-alternatives'); const pickAlt = page.getByRole('button', { name: re('Probeer deze|Try this') }); if (await visible(pickAlt, 800)) { await click(run, pickAlt, 'Probeer deze'); await page.waitForTimeout(800); await run.shot(page, 'workout-after-alternative'); } else { await dismissSheets(page); const cl = btn(page, 'Sluiten|Close|Terug|Back'); if (await visible(cl, 400)) await cl.first().click().catch(() => {}); } continue; }
    if (await visible(tapZone, 200) && !tapped) { await tapZone.first().click(); await tapZone.first().click(); run.tap(); run.tap(); tapped = true; }
    if (await visible(allDone, 200)) { await allDone.first().click(); run.tap(); sets += 1; if (sets === 1) { await page.waitForTimeout(700); await run.shot(page, 'workout-rest'); } continue; }
    if (await visible(skipRest, 200)) { await skipRest.first().click(); run.tap(); continue; }
    const startTimer = btn(page, '^(Start|Start timer)$'); if (await visible(startTimer, 200)) {
      if (timers === 0) {
        // UAT R6 (D9) — before Start: neutral countdown, and the Start control above the fixed action bar.
        await run.shot(page, 'workout-timer-idle');
        const fit = await page.evaluate(() => { const b = document.querySelector('.jf-timer__start'); const bar = document.querySelector('.jf-wo-bar'); const c = document.querySelector('.jf-timer__count'); if (!b) return null; return { startBottom: Math.round(b.getBoundingClientRect().bottom), barTop: bar ? Math.round(bar.getBoundingClientRect().top) : innerHeight, idle: !!c && c.className.includes('--idle'), text: c?.textContent }; });
        if (fit && fit.startBottom > fit.barTop) run.fail(`timed set: Start (bottom ${fit.startBottom}) under the action bar (top ${fit.barTop})`);
        if (fit && !fit.idle) run.fail(`timed set: countdown "${fit.text}" is not neutral before Start`);
        if (fit) run.note(`timed set before Start: "${fit.text}" idle=${fit.idle}, Start bottom ${fit.startBottom} ≤ bar ${fit.barTop}`);
      }
      await startTimer.first().click(); run.tap(); timers += 1; if (timers === 1) { await page.waitForTimeout(800); await run.shot(page, 'workout-timer'); } continue; }
    const early = btn(page, 'Done early|Vroeg klaar|Eerder klaar'); if (await visible(early, 200)) { await early.first().click(); run.tap(); continue; }
    await page.waitForTimeout(250);
  }
  if (complete) {
    if (await visible(doneScreen(page), 2000)) { await run.shot(page, 'workout-feedback', true); await click(run, btn(page, 'Sessie opslaan|Log session|Save session'), 'Sessie opslaan'); await page.waitForTimeout(2500); if (!(await crashed(run, page, 'after save'))) await run.shot(page, 'today-after-session', true); }
    else run.fail(`session did not reach the done screen in 90 s (exercises=${exercises} sets=${sets} timers=${timers})`);
  } else {
    const cancel = btn(page, 'Annuleren|Cancel'); if (await visible(cancel, 500)) { await click(run, cancel, 'cancel'); await page.waitForTimeout(600); if (!(await crashed(run, page, 'tap ← Annuleren'))) { await run.shot(page, 'workout-cancel-confirm'); const yes = btn(page, '^(Stoppen|Quit|Weggooien|Discard|Ja|Yes)$'); if (await visible(yes, 800)) await click(run, yes, 'confirm cancel'); } }
    await page.waitForTimeout(800);
  }
  await leaveWorkout(run, page);
  run.note(`workout: exercises=${exercises} sets=${sets} timers=${timers}`);
  run.end();
}

export async function flowWhyNot(run, page, option) {
  run.start(`why-not:${option}`);
  await crashed(run, page, `before why-not`);
  if (!(await click(run, btn(page, "Lukt dit niet|Can't do this"), 'Lukt dit niet?'))) return run.end();
  await page.waitForTimeout(500); await run.shot(page, 'whynot');
  if (await click(run, btn(page, option), option)) { await page.waitForTimeout(2500); await run.shot(page, `today-after-${option.replace(/[^a-z]/gi, '')}`, true); }
  run.end();
}

export async function flowOwnTraining(run, page, kind) {
  run.start(`own:${kind}`);
  await crashed(run, page, `before own:${kind}`);
  if (!(await visible(btn(page, 'Eigen training|Own training'), 1500))) { const home = btn(page, '^(VANDAAG|TODAY)$'); if (await visible(home, 800)) { await click(run, home, 'Vandaag'); run.note('went back to Vandaag to find Eigen training'); await page.waitForTimeout(1000); } }
  if (!(await click(run, btn(page, 'Eigen training|Own training'), 'Eigen training'))) return run.end();
  await page.waitForTimeout(500); await run.shot(page, 'own-chooser');
  const row = page.locator('.jf-own-row', { hasText: re(kind === 'log' ? 'Registreren|Record' : kind === 'reuse' ? 'Hergebruiken|Reuse' : kind === 'pin' ? 'Vastzetten|Pin' : 'Samenstellen|Build') });
  if (!(await click(run, row, kind))) return run.end();
  await page.waitForTimeout(800);
  const pick = async (q, exact) => { if (!(await fill(run, page.locator('.jf-pick__input'), q, 'search'))) return; const item = page.locator('.jf-pick__item', { has: page.locator('.jf-pick__name', { hasText: re(`^${exact}$`) }) }); if (await visible(item, 1500)) { await item.first().click(); run.tap(); } else run.fail(`"${exact}" not found for "${q}"`); };
  if (kind === 'build') {
    await run.shot(page, 'own-build-empty');
    await pick('opdrukken', 'Opdrukken|Push-up'); await pick('plank', 'Plank');
    await page.waitForTimeout(300); await run.shot(page, 'own-build-2');
    if (run.p.saveTemplate) { await click(run, page.locator('.jf-sb-quiet'), 'Bewaar als sjabloon'); await fill(run, page.locator('.jf-sb-tpl__input'), 'Hotel sessie', 'template name'); await click(run, page.locator('.jf-sb-tpl__actions button').first(), 'Opslaan'); await page.waitForTimeout(800); await run.shot(page, 'own-build-saved'); }
    if (await click(run, page.locator('.jf-sheet__footer .jf-primary'), 'Starten')) { await page.waitForTimeout(1500); await run.shot(page, 'own-run-mode'); const extra = page.locator('.jf-own-row', { hasText: re('Als extra|As an extra') }); if (await visible(extra, 3000)) { await click(run, extra, 'Als extra'); await page.waitForTimeout(2500); await run.shot(page, 'own-workout-overview', true); const cancel = btn(page, 'Terug|Back'); if (await visible(cancel, 500)) await cancel.first().click().catch(() => {}); } }
  } else if (kind === 'log') {
    await run.shot(page, 'own-log-1');
    await pick('opdrukken', 'Opdrukken|Push-up');
    await click(run, page.locator('.jf-sheet__footer .jf-primary'), 'Verder');
    await page.waitForTimeout(400); await run.shot(page, 'own-log-2');
    await fill(run, page.locator('.jf-log-card').first().locator('.jf-log-val--value').first(), '3x8', 'sets');
    await page.locator('.jf-log-card').first().locator('.jf-log-val--value').first().press('Tab');
    await page.waitForTimeout(300);
    await click(run, page.locator('.jf-sheet__footer .jf-primary'), 'Opslaan');
    await page.waitForTimeout(1500); await run.shot(page, 'today-after-log', true);
  } else if (kind === 'reuse') {
    await run.shot(page, 'own-reuse');
    const first = page.locator('.jf-tpl-item, .jf-tpl-pick').first();
    if (await visible(first, 1500)) { await click(run, first, 'template'); await page.waitForTimeout(1200); await run.shot(page, 'own-reuse-run-mode'); }
    else run.note('no templates to reuse (expected for a new user)');
  } else if (kind === 'pin') {
    await run.shot(page, 'own-pin');
    await pick('opdrukken', 'Opdrukken|Push-up');
    await click(run, page.locator('.jf-sheet__footer .jf-primary'), 'Laat de coach');
    await page.waitForTimeout(3000); await run.shot(page, 'today-after-pin', true);
  }
  await dismissSheets(page);
  run.end();
}

export async function flowNav(run, page, tab, name) {
  run.start(`view:${name}`);
  await crashed(run, page, `before ${name}`);
  if (await click(run, btn(page, `^${tab}$`), tab)) { await page.waitForTimeout(1000); await run.shot(page, name, true); await scrollEndCheck(run, page, name); }
  run.end();
}

export async function flowSettings(run, page, sub, actions = []) {
  run.start(`settings:${sub}`);
  await crashed(run, page, `before settings:${sub}`);
  await click(run, btn(page, '^(INSTELLINGEN|SETTINGS)$'), 'Instellingen');
  await page.waitForTimeout(600);
  if (run.flow.screens === 0) { await run.shot(page, 'settings-landing'); await scrollEndCheck(run, page, 'settings-landing'); }
  const rowBtn = page.getByRole('button', { name: re(sub) });
  const row = (await visible(rowBtn, 800)) ? rowBtn.first() : page.getByText(re(sub)).first();
  if (!(await click(run, row, sub))) return run.end();
  await page.waitForTimeout(900);
  await run.shot(page, `settings-${sub.replace(/[^a-z]/gi, '').toLowerCase()}`, true);
  for (const a of actions) {
    if (a.fill) { await fill(run, page.getByRole('textbox', { name: re(a.fill[0]) }), a.fill[1], a.fill[0]); continue; }
    if (a.tap) { const t = page.getByRole('button', { name: re(a.tap) }); if (await visible(t, 1500)) { await click(run, t, a.tap); await page.waitForTimeout(a.wait ?? 800); if (a.shot) await run.shot(page, a.shot, true); } else run.fail(`"${a.tap}" not found`); }
    if (a.text) { const t = page.getByText(re(a.text)); if (await visible(t, 1500)) { await click(run, t, a.text); await page.waitForTimeout(a.wait ?? 800); if (a.shot) await run.shot(page, a.shot, true); } else run.fail(`"${a.text}" not found`); }
  }
  const back = page.locator('button').filter({ hasText: re('^‹$') });
  if (await visible(back, 400)) { await back.first().click(); run.tap(); }
  run.end();
}

export async function flowDezeWeek(run, page) {
  run.start('deze-week-log-past');
  await click(run, btn(page, 'DEZE\\s*WEEK|THIS\\s*WEEK'), 'Deze week');
  await page.waitForTimeout(1000); await run.shot(page, 'deze-week', true);
  const logBtn = page.locator('.jf-logday__btn').first();
  if (await visible(logBtn, 1500)) { await click(run, logBtn, 'log past day'); await page.waitForTimeout(800); await run.shot(page, 'deze-week-log-sheet'); await dismissSheets(page); } else run.note('no past-day log button visible');
  run.end();
}

export async function flowConnect(run, page) {
  run.start('trainer-connect');
  await page.goto('/connect?t=FIT-e2etopen');
  await page.waitForTimeout(1500); await run.shot(page, 'connect-screen', true);
  const ok = btn(page, 'Verbind|Connect|Verstuur|Send|Akkoord|Accept');
  if (await visible(ok, 2000)) { await click(run, ok, 'connect'); await page.waitForTimeout(1500); await run.shot(page, 'connect-result', true); }
  await page.goto('/'); await page.waitForTimeout(1500);
  const coachTab = btn(page, '^Coach$'); run.note(`Coach tab in nav after connect: ${await visible(coachTab, 1500)}`);
  if (await visible(coachTab, 300)) { await click(run, coachTab, 'Coach tab'); await page.waitForTimeout(1000); await run.shot(page, 'coach-tab-trainer', true); }
  run.end();
}

// ── persona setup via API (after signup, before onboarding completes) ──────
export async function applyApiSetup(run, page) {
  const s = run.p.api; if (!s) return;
  const r = await page.request.post('/api/profile', { data: s });
  run.note(`api setup → ${r.status()}`);
}

export async function flowTap(run, page, label, shotName) {
  run.start(`tap:${shotName}`);
  if (await click(run, btn(page, label), label)) { await page.waitForTimeout(1200); await run.shot(page, shotName, true); }
  run.end();
}

// Return-to-training: executions N days ago in the local D1, today's plan cleared, reload.
import { execSync } from 'node:child_process';
const MAIN = new URL('../../', import.meta.url).pathname.replace(/\/$/, '');
export async function flowSqlReturn(run, page, daysAgo) {
  run.start(`return-after-${daysAgo}d`);
  const uid = await page.evaluate(() => localStorage.getItem('jf_user_id'));
  const d = (n) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
  const ms = (n) => Date.now() - n * 86_400_000;
  const sql = [daysAgo, daysAgo + 2, daysAgo + 4].map((n, i) => `INSERT INTO executions (id, user_id, date, execution_type, status, total_duration_sec, created_at_ms, updated_at_ms) VALUES ('uat-${run.p.id}-${i}', '${uid}', '${d(n)}', 'workout', 'completed', 1200, ${ms(n)}, ${ms(n)});`).join(' ') + ` DELETE FROM day_plans WHERE user_id = '${uid}';`;
  try { execSync(`npx wrangler d1 execute justfit-db --local --persist-to ${MAIN}/.wrangler/e2e-state --command "${sql.replace(/"/g, '\\"')}"`, { cwd: MAIN, stdio: 'pipe' }); run.note('inserted 3 executions, cleared today\'s plan'); }
  catch (e) { run.fail(`sql: ${String(e.stderr ?? e.message).slice(0, 160)}`); }
  await page.reload(); await page.waitForTimeout(3000);
  run.end();
}

const STEPS = {
  signup: flowSignup,
  api: applyApiSetup,
  reload: async (run, page) => { run.start('reload'); await page.reload(); await page.waitForTimeout(2500); const good = btn(page, '^(Good|Goed)$'); if (await visible(good, 1500)) { await click(run, good, 'mood'); await click(run, btn(page, 'Apply|Toepassen'), 'Apply'); await page.waitForTimeout(1500); } run.end(); },
  checkin: flowCheckin,
  path: flowPath,
  today: flowToday,
  workout: flowWorkout,
  whynot: flowWhyNot,
  own: flowOwnTraining,
  nav: flowNav,
  settings: flowSettings,
  dezeweek: flowDezeWeek,
  connect: flowConnect,
  tap: flowTap,
  sqlReturn: flowSqlReturn,
};

// ── gate (UAT release 6) ───────────────────────────────────────────────────
const TAP_LIMIT = 10;
export function gateResult(log) {
  const audits = log.audits ?? [];
  const clipped = audits.flatMap((a) => (a.clipped ?? []).map((c) => `${a.screen}: "${c.text}"`));
  const tiny = audits.flatMap((a) => (a.tiny ?? []).map((t) => `${a.screen}: "${t.text}" ${t.px}px`));
  const underNavAtEnd = audits.flatMap((a) => (a.underNavAtEnd ?? []).map((u) => `${a.screen}: "${u}"`));
  const onboarding = log.flows.find((f) => f.name === 'onboarding');
  const notes = log.flows.flatMap((f) => f.notes.map((n) => `${f.name}: ${n}`)).concat(log.notes ?? []);
  const errors = notes.filter((n) => /PAGEERROR|CONSOLE|CRASH/.test(n));
  const failed = log.flows.filter((f) => !f.ok).map((f) => `${f.name}: ${f.notes.filter((n) => n.startsWith('FAIL')).join(' · ')}`);
  const checks = {
    'clipped titles': clipped, 'text < 11 px': tiny, 'controls under the nav at the end of a page': underNavAtEnd,
    [`onboarding taps ≤ ${TAP_LIMIT}`]: !onboarding ? ['no onboarding flow'] : onboarding.taps > TAP_LIMIT ? [`${onboarding.taps} taps`] : [],
    'page/console errors': errors, 'failed flows': failed,
  };
  return { taps: onboarding?.taps ?? null, checks, pass: Object.values(checks).every((v) => v.length === 0) };
}

// ── main ─────────────────────────────────────────────────────────────────────
const ids = process.argv.slice(2);
const list = ids.length ? PERSONAS.filter((p) => ids.includes(p.id)) : PERSONAS;
const browser = await chromium.launch();
const gated = [];
for (const p of list) {
  const run = new Run(p);
  console.log(`\n=== ${p.id} — ${p.who}`);
  const ctx = await browser.newContext({ ...devices[p.device ?? 'iPhone 13'], baseURL: BASE, locale: p.lang === 'en' ? 'en-GB' : 'nl-NL', colorScheme: 'dark' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => run.note(`PAGEERROR ${String(e.message).split('\n')[0].slice(0, 200)}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404 |net::|Failed to load resource/.test(m.text())) run.note(`CONSOLE ${m.text().slice(0, 200)}`); });
  await page.addInitScript((lang) => { if (!localStorage.getItem('jf_lang')) localStorage.setItem('jf_lang', lang); }, p.lang ?? 'nl');
  try {
    for (const [name, ...args] of p.flows) {
      const fn = STEPS[name];
      if (!fn) { run.fail(`unknown step ${name}`); continue; }
      try { await fn(run, page, ...args); } catch (e) { run.fail(`${run.flow?.name ?? name}: ${e.message.split('\n')[0].slice(0, 120)}`); run.end(); }
    }
  } finally {
    writeFileSync(`${run.dir}log.json`, JSON.stringify(run.log, null, 1));
    await ctx.close();
  }
  if (p.gate) gated.push({ id: p.id, ...gateResult(run.log) });
}
await browser.close();
if (gated.length) {
  console.log('\n=== UAT gate (release 6) ===');
  for (const g of gated) {
    console.log(`${g.pass ? 'PASS' : 'FAIL'}  ${g.id}  onboarding taps=${g.taps}`);
    for (const [name, list] of Object.entries(g.checks)) console.log(`   ${list.length ? '✗' : '✓'} ${name}${list.length ? `: ${list.length}` : ''}${list.length ? '\n      ' + list.slice(0, 8).join('\n      ') : ''}`);
  }
  writeFileSync(`${OUT}gate.json`, JSON.stringify(gated, null, 1));
  process.exitCode = gated.every((g) => g.pass) ? 0 : 1;
}

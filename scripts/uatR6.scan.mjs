// UAT release 6 — small phones and the first five minutes (offline source scan, run by smoke).
// Prints one line per broken rule; exit 1 when any rule is broken.
//
//  1. No text below 11 px (builder v1.4 floor): no `fontSize: <11` in client JSX / tokens.js and no
//     `font-size: <11px` in styles.css. (SVG text attributes are not scanned: their rendered size
//     depends on the viewBox; the UAT runner measures those at their rendered size.)
//  2. The nav is laid out from --nav-h, its labels are ≥ 11 px, and the page container pads by the
//     same custom property — one mechanism, no per-view numbers. Nav.jsx has no inline style.
//  3. Every sheet's close "×" is a 44 px box (.jf-sheet-close), and the sheets use it.
//  4. One check-in payload builder (checkinQuick.js) for the sheet and the mood row; the sheet does
//     not open by itself on the onboarding day.
//  5. Onboarding and PathChoiceModal store the path through the same call (pathPrefs.savePath).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'packages/client-app/src');
const rd = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const errs = [];

// 1 — the 11 px floor
const jsx = [...fs.readdirSync(SRC).filter((f) => f.endsWith('.jsx')), ...fs.readdirSync(path.join(SRC, 'settings')).filter((f) => f.endsWith('.jsx')).map((f) => `settings/${f}`), 'tokens.js'];
for (const f of jsx) {
  const lines = rd(f).split('\n');
  lines.forEach((l, i) => {
    for (const m of l.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)\b/g)) if (Number(m[1]) < 11) errs.push(`${f}:${i + 1} fontSize ${m[1]} < 11`);
    for (const m of l.matchAll(/\bmono\((\d+(?:\.\d+)?)\)/g)) if (Number(m[1]) < 11) errs.push(`${f}:${i + 1} mono(${m[1]}) < 11`);
  });
}
const css = rd('styles.css');
css.split('\n').forEach((l, i) => {
  for (const m of l.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) if (Number(m[1]) < 11) errs.push(`styles.css:${i + 1} font-size ${m[1]}px < 11`);
});

// 2 — one nav height, used by the nav and the page
const rule = (sel) => { const i = css.indexOf(`${sel} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const px = (block, prop) => { const m = block.match(new RegExp(`(?:^|[\\s;{])${prop}:\\s*(\\d+(?:\\.\\d+)?)px`)); return m ? Number(m[1]) : null; };
if (!/--nav-h:\s*\d+px/.test(css)) errs.push('styles.css: no --nav-h custom property');
if (!/height:\s*var\(--nav-h\)/.test(rule('.jf-nav__row'))) errs.push('.jf-nav__row is not laid out from var(--nav-h)');
if (!/var\(--nav-total\)/.test(rule('.jf-page')) || !/--nav-total:\s*calc\(var\(--nav-h\)/.test(css)) errs.push('.jf-page does not pad by var(--nav-total) (= --nav-h + safe area)');
const labelPx = px(rule('.jf-nav__label'), 'font-size');
if (labelPx == null || labelPx < 11) errs.push(`.jf-nav__label font-size ${labelPx}px < 11`);
if ((px(rule('.jf-nav__item'), 'min-height') ?? 0) < 44) errs.push('.jf-nav__item min-height < 44px');
const nav = rd('Nav.jsx');
if (/style=\{\{/.test(nav)) errs.push('Nav.jsx has inline styles again');
if (!/className="jf-nav"/.test(nav)) errs.push('Nav.jsx does not use .jf-nav');
if (!/className="jf-page"/.test(rd('App.jsx'))) errs.push('App.jsx page container is not .jf-page');

// 3 — sheet close 44 px
const close = rule('.jf-sheet-close, .jf-sheet__head .jf-icon-btn');
if ((px(close, 'width') ?? 0) < 44 || (px(close, 'height') ?? 0) < 44) errs.push('.jf-sheet-close is not a 44 × 44 px box');
for (const [f, re] of [['sessionSheet.jsx', /onClick=\{onClose\} className="[^"]*jf-sheet-close/], ['CheckInModal.jsx', /onClick=\{onClose\}[^>]*className="jf-sheet-close"/], ['CoachView.jsx', /setMsgSheet\(false\)\}[^>]*className="jf-sheet-close"/]]) {
  if (!re.test(rd(f))) errs.push(`${f}: the sheet close does not use .jf-sheet-close`);
}

// 4 — one check-in payload; no sheet on the onboarding day
const cim = rd('CheckInModal.jsx');
if (!/buildCheckinPayload\(/.test(cim) || /moodMap\s*=/.test(cim)) errs.push('CheckInModal builds its own payload (use checkinQuick.buildCheckinPayload)');
const app = rd('App.jsx');
if (!/autoOpenCheckin\(/.test(app)) errs.push('App.jsx decides the auto check-in without checkinQuick.autoOpenCheckin');
if (!/QUICK_CHECKIN_KEY,\s*today\)/.test(app)) errs.push('App.jsx does not mark the onboarding day for the mood row');
if (!/onQuickCheckin=\{\(feeling\) => handleCheckIn\(buildCheckinPayload\(/.test(app)) errs.push('the mood row does not go through handleCheckIn(buildCheckinPayload(...))');
if (!/<MoodRow /.test(rd('Dashboard.jsx'))) errs.push('Dashboard does not render the mood row');

// 5 — one path writer
for (const f of ['OnboardingModal.jsx', 'PathChoiceModal.jsx']) if (!/savePath\(api, token,/.test(rd(f))) errs.push(`${f} does not store the path through pathPrefs.savePath`);
if (/api\.saveProfile\(token, \{ preferences: \{ primary_intent/.test(rd('PathChoiceModal.jsx'))) errs.push('PathChoiceModal writes primary_intent by hand again');

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }

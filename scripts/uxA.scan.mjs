// UX review A — the exercise screen (offline source scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Working phase: ONE primary button in the bottom bar, and it is the widest/tallest control there.
//  2. The header does not print the exercise name or the set (they live in the body, once).
//  3. The session rating is three buttons — no range input, no "RPE" in the UI, nothing pre-selected —
//     and the three values are exactly the ones the server consumers read (3 / 5 / 8).
//  4. The wake-lock tip is not rendered above the header and is dismissible with a 44 px ×.
//  5. Hit areas of the new controls are >= 44 px (rating buttons >= 56 px).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wv = rd('packages/client-app/src/WorkoutView.jsx');
const css = rd('packages/client-app/src/styles.css');
const errs = [];
const between = (src, a, b) => { const i = src.indexOf(a); const j = src.indexOf(b, i + 1); return i < 0 || j < 0 ? '' : src.slice(i, j); };

// 1 — one primary in the bar
const bar = between(wv, 'className="jf-wo-bar"', '{/* ── RESTING PHASE');
if (!bar) errs.push('WorkoutView: the working-phase bottom bar (.jf-wo-bar) is missing');
const primaries = (bar.match(/className="[^"]*\bjf-primary\b/g) ?? []).length;
if (primaries !== 1) errs.push(`WorkoutView: the bottom bar has ${primaries} primary (.jf-primary) buttons, expected exactly 1`);
if (/background:\s*C\.emerald|accent/i.test(bar.replace(/jf-primary/g, ''))) errs.push('WorkoutView: the bottom bar styles a second control in the accent colour');

// 2 — header says neither name nor set
const head = between(wv, 'className="jf-wo-head"', '{/* ── OVERVIEW PHASE');
if (!head) errs.push('WorkoutView: header (.jf-wo-head) missing');
if (/exerciseName\(/.test(head)) errs.push('WorkoutView: the header prints the exercise name again');
if (/Set \{current\}|Set \{n\}/.test(head)) errs.push('WorkoutView: the header prints the set again');
if (!/\{n\} of \{total\} exercises/.test(head)) errs.push('WorkoutView: the header lost "n of m exercises"');

// 3 — rating
if (/type="range"/.test(wv)) errs.push('WorkoutView: a range input is back on the feedback screen');
const fb = between(wv, 'phase === "sessionFeedback" && (', '{/* ── ALTERNATIVES BOTTOM SHEET');
if (/RPE/.test(fb)) errs.push('WorkoutView: "RPE" is shown on the feedback screen');
if (!/\[rating, setRating\] = useState\(null\)/.test(wv)) errs.push('WorkoutView: a rating is pre-selected (the state must start null)');
if (!/RATINGS\.map/.test(fb)) errs.push('WorkoutView: the feedback screen does not render RATINGS');
const sr = rd('packages/client-app/src/sessionRating.js');
const vals = [...sr.matchAll(/exertion:\s*(\d+)/g)].map((m) => Number(m[1]));
if (vals.join(',') !== '3,5,8') errs.push(`sessionRating.js: values are ${vals.join(',')}, the consumers read 3,5,8`);
const ex = rd('functions/api/execution.js');
if (!/\{\s*3:\s*0\.85,\s*5:\s*1\.0,\s*8:\s*1\.15\s*\}/.test(ex)) errs.push('execution.js: the TSS RPE modifier no longer keys on 3/5/8 — revisit sessionRating.js');
if (!/perceivedExertion === 3/.test(ex) || !/perceivedExertion === 8/.test(ex)) errs.push('execution.js: R576 no longer keys on 3 and 8 — revisit sessionRating.js');

// 4 — the tip
const tipAt = wv.indexOf('Tip: disable auto-lock');
if (tipAt < 0 || tipAt < wv.indexOf('className="jf-wo-head"')) errs.push('WorkoutView: the wake-lock tip renders above the header');
if (wv.split('Tip: disable auto-lock').length - 1 !== 1) errs.push('WorkoutView: the wake-lock tip is rendered more than once');
if (!/onClick=\{dismissWakeTip\}/.test(wv)) errs.push('WorkoutView: the wake-lock tip cannot be dismissed');

// 5 — hit areas
const rule = (sel) => { const i = css.indexOf(`${sel} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
const px = (block, prop) => { const m = block.match(new RegExp(`(?:^|[\\s;{])${prop}:\\s*(\\d+(?:\\.\\d+)?)px`)); return m ? Number(m[1]) : 0; };
for (const [sel, prop, min] of [
  ['.jf-rate__btn', 'min-height', 56], ['.jf-wo-bar__primary', 'height', 56], ['.jf-wo-bar__link', 'min-height', 44],
  ['.jf-wo-tip__x', 'height', 44], ['.jf-wo-tip__x', 'width', 44], ['.jf-wo-step__btn', 'height', 44], ['.jf-wo-step__btn', 'width', 44],
  ['.jf-wo-link', 'min-height', 44], ['.jf-wo-head__btn', 'min-height', 44], ['.jf-wo-quiet', 'min-height', 44],
]) if (px(rule(sel), prop) < min) errs.push(`styles.css: ${sel} ${prop} < ${min}px`);

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }

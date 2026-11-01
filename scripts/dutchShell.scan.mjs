// Builder v1.6 — the Dutch-shell source scan. The literals the assessment
// photographed (finding X1) must only appear inside a t("…") / t('…') / t(`…`)
// call in the files that frame the builder. A bare occurrence is an English
// string a Dutch reader would see.  Usage: node scripts/dutchShell.scan.mjs
import { readFileSync } from 'node:fs';

const ROOT = new URL('../packages/client-app/src/', import.meta.url);
const FILES = ['Dashboard.jsx', 'WorkoutView.jsx', 'CoachView.jsx', 'App.jsx'];
// coach-dcp R2 (fix 7) — the coach surfaces: the literals photographed in
// COACH_DCP_UX_ASSESSMENT_2026-11 §0 finding 9, in the four files that frame them.
const COACH_FILES = ['PathChoiceModal.jsx', 'SettingsView.jsx', 'HistoryView.jsx', 'CoachView.jsx'];
const COACH_LITERALS = [
  'PICK YOUR', 'TRAINING PATH', 'ACTIVE COACH', 'Change path', 'TRAINING FOCUS',
  'Physical Assessment', 'Log test', 'Save changes', 'Room to grow', 'WHERE YOU ARE',
  'Not measured yet', 'Fitness Profile', 'Target on', '12-WEEK PROGRESSION', 'any 3 days you train',
];
const LITERALS = [
  'TODAY ·', 'START SESSION', 'moves', 'Why this plan?', 'THIS WEEK',
  'Start workout', 'Start Workout', 'RECALIBRATE', 'Recalibrate',
  'Consistent daily training', '+ {n} more', 'more ·',
];
// coach-dcp R1 — words that are gone, not merely translated: the header button
// opens the check-in and says "Check-in". These may not appear even inside t(),
// in any of the files above (comments are blanked first).
const GONE = ['Recalibrate', 'RECALIBRATE', 'Herijken', 'HERIJKEN'];

// Blank out comments and report the string literals of one line:
// [{ from, to, inT }] where inT means the literal is the first argument of t(.
function scanLine(line, inBlock) {
  const lits = [];
  const keep = line.split('');
  let i = 0, quote = null, start = -1;
  while (i < line.length) {
    const c = line[i], two = line.slice(i, i + 2);
    if (inBlock) { keep[i] = ' '; if (two === '*/') { keep[i + 1] = ' '; i++; inBlock = false; } i++; continue; }
    if (quote) {
      if (c === '\\') { i += 2; continue; }
      if (c === quote) { lits.push({ from: start, to: i, inT: /\bt\(\s*$/.test(line.slice(0, start)) }); quote = null; }
      i++; continue;
    }
    if (two === '/*') { inBlock = true; keep[i] = keep[i + 1] = ' '; i += 2; continue; }
    if (two === '//') { for (let j = i; j < line.length; j++) keep[j] = ' '; break; }
    if (c === '"' || c === "'" || c === '`') { quote = c; start = i; }
    i++;
  }
  return { text: keep.join(''), lits, inBlock };
}

// UAT release 4 — Dutch sweep 3. Settings → Jij / Account / Privacy, Deze week, Voortgang, the Trophy
// room, the body-mode banners and the guest banner, the instruction why-line and the three orphan
// screens: the literals the personas photographed (docs/UAT_PERSONAS_2026-11.md D8, D10) may only
// sit inside t(). Award NAMES stay English by design and are not listed; "View on Strava" stays
// English on purpose (Strava brand guidelines).
const R4 = [
  ['SettingsView.jsx', [
    'Daily Planning', 'Available time per session', 'Time overhead', 'Available equipment',
    'Sports & Activities', 'Sport-aware training bias', 'Polarised Training', 'Daily Adaptive Replan', 'Known Injuries',
    'Your profile', 'Display name', 'Re-do onboarding', 'Set values to default', 'What we store', 'Integration data',
    'Your controls', 'Export your data', 'Download my data (JSON)', 'Delete your account', 'Go to Account settings',
    'Email address', 'Not verified', 'Enter code', 'Account ID', 'Privacy Centre', 'Submit feedback',
    'Controls when the Daily Intelligence Prompt appears.', 'Delete Account', 'Your unique identifier',
  ]],
  ['PlanWeekView.jsx', ['This will permanently remove', 'Delete session']],
  ['HistoryView.jsx', [
    'Fresh start', 'Strong week', 'Lighter week', 'Share progress', 'My JustFit Progress', 'Recalculates progression scores',
  ]],
  ['AwardsView.jsx', ['Trophy Room', 'Showing up', 'Far horizon', 'Reveal all', 'Next up']],
  ['App.jsx', [
    'Perimenopause mode', 'Add your email to keep your data', "Without email, you can't",
    'Sign out instead', 'Updated Policies', 'Cooper Test Complete',
  ]],
  ['ConnectScreen.jsx', ['Request sent!', 'Send request', 'CONNECT TO TRAINER', 'Go to JustFit', 'Could not load trainer info']],
  ['TrainerInviteScreen.jsx', ['Connected!', 'Declined', 'This invite link has expired', 'Already connected', 'TRAINER INVITE', 'Open JustFit']],
  ['ErrorBoundary.jsx', ['Something went wrong', 'Reload app', 'unexpected error']],
  ['CheckInModal.jsx', ['Skip', 'A bit more', 'Pain detail']],
  ['Dashboard.jsx', ['Your check-in reported significant pain']],
];
// Patterns that may not appear at all (comments blanked): a display path that bypasses t(), or a
// stand-in that fakes a name.
const R4_BAD = [
  ['SettingsView.jsx', '{doc.title}', 'the Information list shows the English title; use t(doc.title)'],
  ['SettingsView.jsx', '{doc.subtitle}', 'the Information list shows the English subtitle; use t(doc.subtitle)'],
  ['SettingsView.jsx', '?? "Custom"} \u2014', 'accent-colour sentence built outside t()'],
  ['WorkoutView.jsx', 'return instr.why;', 'the seeded why-line is English; it goes through t()'],
  ['HistoryView.jsx', '"en-GB"', 'recent-session dates use the Dutch date helper (fmtDateShort)'],
  ['PlanWeekView.jsx', 'toLocaleDateString("en"', 'the delete sentence uses longDate(), not a hard-coded English locale'],
  ['ConnectScreen.jsx', "'your trainer'", 'never name the trainer "your trainer"'],
  ['ConnectScreen.jsx', "?? 'Trainer'", 'never show a stand-in as the trainer name'],
  ['TrainerInviteScreen.jsx', "'your trainer'", 'never name the trainer "your trainer"'],
  ['TrainerInviteScreen.jsx', "'Your trainer'", 'never show a stand-in as the trainer name'],
  ['ErrorBoundary.jsx', 'style={{', 'the error boundary is on classes (.jf-orphan), no inline styles'],
  ['ConnectScreen.jsx', 'style={{', 'the connect screen is on classes (.jf-orphan), no inline styles'],
  ['TrainerInviteScreen.jsx', 'style={{', 'the invite screen is on classes (.jf-orphan), no inline styles'],
];

const bad = [];
const scan = (f, literals, gone) => {
  const lines = readFileSync(new URL(f, ROOT), 'utf8').split('\n');
  let inBlock = false;
  lines.forEach((raw, n) => {
    const r = scanLine(raw, inBlock);
    inBlock = r.inBlock;
    for (const lit of gone) if (r.text.includes(lit)) bad.push(`${f}:${n + 1}  "${lit}" is retired (coach-dcp R1: the header says Check-in)  →  ${raw.trim().slice(0, 100)}`);
    for (const lit of literals) {
      for (let at = r.text.indexOf(lit); at >= 0; at = r.text.indexOf(lit, at + 1)) {
        if (!r.lits.some((l) => l.inT && at > l.from && at < l.to)) bad.push(`${f}:${n + 1}  "${lit}" outside t()  →  ${raw.trim().slice(0, 100)}`);
      }
    }
  });
};
for (const f of FILES) scan(f, LITERALS, GONE);
for (const f of COACH_FILES) scan(f, COACH_LITERALS, []);
for (const [f, lits] of R4) scan(f, lits, []);
for (const [f, text, why] of R4_BAD) {
  let inBlock = false;
  readFileSync(new URL(f, ROOT), 'utf8').split('\n').forEach((raw, n) => {
    const r = scanLine(raw, inBlock);
    inBlock = r.inBlock;
    if (r.text.includes(text)) bad.push(`${f}:${n + 1}  ${text}  — ${why}  →  ${raw.trim().slice(0, 100)}`);
  });
}
const R4_COUNT = R4.reduce((n, [, l]) => n + l.length, 0);
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log(`ok — ${LITERALS.length} literals checked in ${FILES.length} files and ${COACH_LITERALS.length} coach literals in ${COACH_FILES.length} files, none outside t(); ${R4_COUNT} release-4 literals in ${R4.length} files and ${R4_BAD.length} forbidden patterns clean; ${GONE.length} retired words absent`);

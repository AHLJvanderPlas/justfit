// UX review D — Today and chrome (offline source scan, run by smoke). One line per broken rule; exit 1.
//
//  1. Header (finding 11): the logo row + CHECK-IN (TodayHeader) is mounted once in App.jsx, only for
//     view === "today"; App.jsx renders no <header> and no check-in button of its own.
//  2. Back (finding 15): one BackLink; the views that had their own arrow use it; no stray "← " /
//     "‹" back buttons outside the allow-list (in-session "← Cancel" / "← Prev", onboarding "← Log out",
//     wizard-step backs, the document reader's close, the assessment's "← Close").
//  3. Sign-out (finding 15): no sign-out control in App.jsx's page chrome; Settings has one, in the
//     Account sub-view, which asks for the confirmation (onSignOut), never a bare logout().
//  4. Today (finding 10): one week card (a single THIS WEEK title in Dashboard.jsx), no Training goal card.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = 'packages/client-app/src';
const rd = (f) => fs.readFileSync(path.join(ROOT, `${SRC}/${f}`), 'utf8');
const errs = [];
const count = (s, re) => (s.match(re) ?? []).length;

// 1 — header
const app = rd('App.jsx');
const mounts = app.match(/^.*<TodayHeader\b.*$/gm) ?? [];
if (mounts.length !== 1) errs.push(`App.jsx: TodayHeader must be mounted exactly once (found ${mounts.length})`);
else if (!/view === "today"/.test(mounts[0])) errs.push('App.jsx: TodayHeader must be gated by view === "today"');
if (/<header\b/.test(app)) errs.push('App.jsx: no page <header> in the shell — the view title is the header (TodayHeader is Today only)');
if (/t\("Check-in"\)/.test(app)) errs.push('App.jsx: the CHECK-IN button lives in TodayHeader only');
const th = rd('TodayHeader.jsx');
if (!/t\("Check-in"\)/.test(th)) errs.push('TodayHeader.jsx: lost its CHECK-IN button');
for (const f of fs.readdirSync(path.join(ROOT, SRC)).filter((x) => x.endsWith('.jsx') && x !== 'TodayHeader.jsx')) {
  if (/t\("Check-in"\)/.test(rd(f)) && !['CheckInModal.jsx', 'Dashboard.jsx', 'MoodRow.jsx', 'SettingsView.jsx'].includes(f)) errs.push(`${f}: a "Check-in" control outside Today`);
}

// 2 — one back pattern
if (!/aria-label=\{t\(/.test(rd('BackLink.jsx'))) errs.push('BackLink.jsx: the accessible name must come from t()');
for (const f of ['CoachView.jsx', 'AwardsView.jsx', 'SettingsView.jsx', 'WorkoutView.jsx', 'ProGate.jsx']) {
  const s = rd(f);
  if (!/import BackLink from "\.\/BackLink\.jsx"/.test(s) || !/<BackLink /.test(s)) errs.push(`${f}: back must be the shared BackLink`);
  if (/jf-back-btn/.test(s)) errs.push(`${f}: jf-back-btn is gone — use BackLink`);
}
const ARROW_OK = { 'WorkoutView.jsx': ['← Cancel', '← Prev'], 'OnboardingModal.jsx': ['← Log out'], 'AssessmentView.jsx': ['← Close'], 'SettingsView.jsx': ['← Back'],
  'EigenTraining.jsx': ['←'], 'PathChoiceModal.jsx': ['← Back'] };
for (const f of fs.readdirSync(path.join(ROOT, SRC)).filter((x) => x.endsWith('.jsx'))) {
  const lines = rd(f).split('\n');
  lines.forEach((l, i) => {
    if (!/[>"'`{(]\s*←|←\s*[{A-Za-z]/.test(l)) return;
    if (/^\s*(\/\/|\{?\/\*)/.test(l)) return;
    if ((ARROW_OK[f] ?? []).some((a) => l.includes(a))) return;
    errs.push(`${f}:${i + 1}: a hand-made "←" back control — use BackLink`);
  });
}

// 3 — sign-out
if (/jf-signout\b|setShowSignOutConfirm\(true\)/.test(app.replace(/onSignOut=\{\(\) => setShowSignOutConfirm\(true\)\}/, ''))) errs.push('App.jsx: no sign-out button in the page chrome — it sits at the bottom of Settings → Account');
const set = rd('SettingsView.jsx');
if (count(set, /jf-signout-row/g) !== 1) errs.push('SettingsView.jsx: exactly one sign-out row (class jf-signout-row)');
if (!/jf-signout-row" onClick=\{\(\) => onSignOut/.test(set)) errs.push('SettingsView.jsx: the sign-out row must ask for the confirmation (onSignOut), not call logout()');
const acct = set.indexOf('{subView === "account" && (\n      <div style={{marginTop:24');
if (acct < 0 || set.indexOf('jf-signout-row') < acct) errs.push('SettingsView.jsx: the sign-out row belongs at the bottom of the Account sub-view');

// 4 — Today
const dash = rd('Dashboard.jsx');
if (count(dash, /t\("THIS WEEK"\)/g) !== 1) errs.push('Dashboard.jsx: exactly one THIS WEEK card on Today');
if (/t\("Training goal"\)/.test(dash)) errs.push('Dashboard.jsx: no static Training goal card on Today (it lives in Settings → Goal & coach)');
if (/weekSummary/.test(dash)) errs.push('Dashboard.jsx: the second week card (weekSummary) is gone — one week line from weekStatus.js');
if (/Today's session:/.test(rd('messagePolicy.js').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/"Today's session: \{name\}\."/g, ''))) errs.push('messagePolicy.js: the coach sentence must not fall back to restating the title');

process.stdout.write(errs.join('\n') + (errs.length ? '\n' : ''));
process.exit(errs.length ? 1 : 0);

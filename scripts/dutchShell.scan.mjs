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
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log(`ok — ${LITERALS.length} literals checked in ${FILES.length} files and ${COACH_LITERALS.length} coach literals in ${COACH_FILES.length} files, none outside t(); ${GONE.length} retired words absent`);

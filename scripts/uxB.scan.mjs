#!/usr/bin/env node
/**
 * UX review release B (docs/UI_UX_REVIEW_2026-11-16.md findings 3, 5, 6, 12) — offline guards,
 * run by scripts/smoke.sh. Prints nothing and exits 0 when clean; one line per finding otherwise.
 *
 *   B4 data   the baseline + every instructions-NL migration (0126 …) loaded into sqlite: every
 *             row carrying steps_nl has valid JSON and as many Dutch steps and cues as English
 *             ones, a Dutch note only beside an English one, 💡 prefixes kept; ≥ 60 rows; the
 *             migration's slugs are exactly the fixture's (it was generated from it).
 *   B4 code   instructions reach the screen only through exerciseInstructions() (i18n.js).
 *   B2        one formatter for a set (src/setFormat.js): no "0 min" / "× 0s" literals in the
 *             week and progress views, and they import the formatter.
 *   B3        Deze week is the ISO week: PlanWeekView takes its strip from weekBounds(), the
 *             "last 7 days" subtitle is gone.
 *
 * Env overrides for the guard-break test: UXB_BASELINE (dir), UXB_MIGRATIONS (comma-separated), UXB_SRC (dir).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const BASE = process.env.UXB_BASELINE ?? 'migrations/baseline';
const SRC = process.env.UXB_SRC ?? 'packages/client-app/src';
const MIGS = process.env.UXB_MIGRATIONS?.split(',')
  ?? readdirSync('migrations').filter(f => /^0\d{3}_exercise_instructions_nl.*\.sql$/.test(f)).sort().map(f => `migrations/${f}`);
const errs = [];
const read = (f) => readFileSync(f, 'utf8');

// ── B4 data ──
if (!MIGS.length) errs.push('B4 no migrations/0NNN_exercise_instructions_nl*.sql found');
const db = new DatabaseSync(':memory:');
for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) db.exec(read(`${BASE}/${f}`));
for (const m of MIGS) {
  try { db.exec(read(m)); } catch (e) { errs.push(`B4 ${m} fails on the baseline: ${e.message}`); }
}
const bulb = (s) => (String(s).match(/^(💡\s*)+/)?.[0] ?? '').replace(/\s+/g, ' ');
let translated = 0;
for (const r of db.prepare("SELECT slug, instructions_json FROM exercises WHERE instructions_json LIKE '%steps_nl%'").all()) {
  let j;
  try { j = JSON.parse(r.instructions_json); } catch { errs.push(`B4 ${r.slug}: instructions_json is not valid JSON`); continue; }
  if (!Array.isArray(j.steps_nl)) continue;
  translated++;
  for (const [en, nl] of [['steps', 'steps_nl'], ['cues', 'cues_nl']]) {
    const a = j[en] ?? [], b = j[nl] ?? [];
    if (!Array.isArray(b) || a.length !== b.length) errs.push(`B4 ${r.slug}: ${nl} ${Array.isArray(b) ? b.length : typeof b} vs ${en} ${a.length}`);
    else b.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errs.push(`B4 ${r.slug}: empty ${nl}[${i}]`);
      else if (bulb(s) !== bulb(a[i])) errs.push(`B4 ${r.slug}: ${nl}[${i}] lost the 💡 prefix`);
    });
  }
  for (const k of ['pregnancy_note', 'postnatal_note']) if (j[`${k}_nl`] && !j[k]) errs.push(`B4 ${r.slug}: ${k}_nl without an English ${k}`);
}
if (translated < 60) errs.push(`B4 only ${translated} exercises carry Dutch instructions (≥ 60 required)`);
if (!process.env.UXB_MIGRATIONS) {
  const fixture = Object.keys(JSON.parse(read('scripts/fixtures/exercise-instructions-nl.json')).exercises).sort();
  const inSql = [...new Set(MIGS.flatMap(m => [...read(m).matchAll(/^UPDATE exercises SET instructions_json .*? WHERE slug = '([^']+)'/gm)].map(x => x[1])))].sort();
  if (JSON.stringify(fixture) !== JSON.stringify(inSql)) errs.push('B4 the migration does not match scripts/fixtures/exercise-instructions-nl.json — regenerate it (node scripts/generate-instructions-nl-migration.mjs)');
}

// ── B4 code ──
for (const f of readdirSync(SRC).filter(f => /\.(jsx?|mjs)$/.test(f))) {
  if (f === 'i18n.js') continue;
  const s = read(`${SRC}/${f}`);
  if (/JSON\.parse\([^)]*instructions_json/.test(s)) errs.push(`B4 ${f} parses instructions_json itself — use exerciseInstructions() from i18n.js`);
}

// ── B2 ──
{
  const src = (f) => { try { return read(`${SRC}/${f}`); } catch { return ''; } };
  for (const f of ['PlanWeekView.jsx', 'HistoryView.jsx']) {
    const s = src(f);
    if (!/from "\.\/setFormat\.js"/.test(s)) errs.push(`B2 ${f} does not use the one set formatter (setFormat.js)`);
    if (/total_duration_sec \/ 60\)/.test(s)) errs.push(`B2 ${f} rounds a session duration itself (prints "0 min") — use sessionMinutes()`);
    if (/\}min`|\$\{avgVal\}s|\$\{avgVal\} reps/.test(s)) errs.push(`B2 ${f} formats a set value itself — use stepResult()/formatSets()`);
  }
  const dash = src('Dashboard.jsx');
  if (!/todayStripLabel\(/.test(dash) || /\$\{streak\}d/.test(dash)) errs.push('B2 Dashboard.jsx: the Today strip must say "Reeks n dagen · Score n" (todayStripLabel)');
  if (/t\("SESSIONS"\)/.test(src('HistoryView.jsx'))) errs.push('B2 HistoryView.jsx: the week card counts training days — label it TRAINING DAYS, not SESSIONS');
}

process.stdout.write(errs.join('\n') + (errs.length ? '\n' : ''));
process.exit(errs.length ? 1 : 0);

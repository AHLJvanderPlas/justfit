#!/usr/bin/env node
/**
 * Finding 0 (docs/UI_UX_REVIEW_2026-11-16.md) — two offline guards, run by scripts/smoke.sh.
 *
 *   I1  one load model: no file under functions/ tests a `loads_*` tag itself. Only
 *       functions/api/_shared/injuryLoad.js may — R563 once read the tags directly and
 *       every exercise added after migration 0021 slipped through.
 *   I2  the data: the baseline plus every injury-load migration (0125 …) loaded into
 *       sqlite. Every active strength/cardio/mixed/skill exercise carries a loads_* tag
 *       or is on the fixture's loads_nothing list; every active exercise carries the
 *       areas loadAreas() derives (data and code agree); every active exercise offers
 *       ≥ 2 substitutions that exist and are active (fixture no_substitute excepted).
 *
 * The migration only appends behind NOT EXISTS guards, so it is still valid once the
 * baseline has been regenerated with it applied.
 *
 * Env overrides for the guard-break test: INJURY_SCAN_FUNCTIONS (dir), INJURY_SCAN_BASELINE (dir),
 * INJURY_SCAN_MIGRATIONS (comma-separated files).
 * Exit 0 and one summary line when clean; exit 1 and the findings otherwise.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { loadAreas, INJURY_AREAS } from '../functions/api/_shared/injuryLoad.js';

const FUNCS = process.env.INJURY_SCAN_FUNCTIONS ?? 'functions';
const BASE = process.env.INJURY_SCAN_BASELINE ?? 'migrations/baseline';
const MIGS = process.env.INJURY_SCAN_MIGRATIONS?.split(',')
  ?? readdirSync('migrations').filter(f => /^0\d{3}_injury_load.*\.sql$/.test(f)).sort().map(f => `migrations/${f}`);
const FIXTURE = JSON.parse(readFileSync('scripts/fixtures/exercise-injury-load.json', 'utf8'));
const errs = [];

// ── I1 ──
const walk = (d) => readdirSync(d).flatMap(f => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const offenders = [];
for (const f of walk(FUNCS).filter(f => f.endsWith('.js'))) {
  if (f.endsWith(path.join('_shared', 'injuryLoad.js'))) continue;
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (/['"`]loads_/.test(line)) offenders.push(`${f}:${i + 1}`);
  });
}
if (offenders.length) errs.push(`I1 a loads_* tag is tested outside _shared/injuryLoad.js (use loadAreas/loadsAny): ${offenders.join(', ')}`);

// ── I2 ──
if (!MIGS.length) errs.push('I2 no migrations/0NNN_injury_load*.sql found');
const db = new DatabaseSync(':memory:');
for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) db.exec(readFileSync(`${BASE}/${f}`, 'utf8'));
for (const m of MIGS) {
  try { db.exec(readFileSync(m, 'utf8')); } catch (e) { errs.push(`I2 ${m} fails on the baseline: ${e.message}`); }
}
const rows = db.prepare('SELECT * FROM exercises WHERE is_active = 1 AND gym_id IS NULL').all();
const active = new Set(rows.map(r => r.slug));
const arr = (s) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const undecided = [], disagree = [], fewSubs = [];
for (const r of rows) {
  const explicit = new Set(arr(r.tags_json).filter(t => t.startsWith('loads_')).map(t => t.slice(6)));
  if (['strength', 'cardio', 'mixed', 'skill'].includes(r.category) && !explicit.size && !FIXTURE.loads_nothing[r.slug]) undecided.push(r.slug);
  const derived = loadAreas(r);
  const missing = INJURY_AREAS.filter(a => derived.has(a) && !explicit.has(a));
  if (missing.length) disagree.push(`${r.slug}(${missing})`);
  let subs = [];
  try { subs = JSON.parse(r.alternatives_json || '{}')?.substitutions ?? []; } catch { subs = []; }
  const ok = new Set(subs.filter(s => active.has(s) && s !== r.slug));
  if (ok.size < 2 && !FIXTURE.no_substitute[r.slug]) fewSubs.push(`${r.slug}(${ok.size})`);
}
const head = (a) => a.slice(0, 8).join(', ') + (a.length > 8 ? ` … +${a.length - 8}` : '');
if (!rows.length) errs.push('I2 the baseline loaded no active exercises');
if (undecided.length) errs.push(`I2 ${undecided.length} strength/cardio row(s) with no loads_* tag and not on loads_nothing: ${head(undecided)}`);
if (disagree.length) errs.push(`I2 ${disagree.length} row(s) whose loads_* tags miss what loadAreas() derives: ${head(disagree)}`);
if (fewSubs.length) errs.push(`I2 ${fewSubs.length} row(s) with fewer than 2 active substitutions: ${head(fewSubs)}`);

if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
console.log(`I1 one load model; I2 ${rows.length} active rows after ${MIGS.map(m => path.basename(m)).join(', ')}: every strength/cardio row decided, tags = loadAreas(), ≥ 2 substitutions each`);

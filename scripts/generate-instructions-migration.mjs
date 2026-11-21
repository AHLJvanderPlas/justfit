#!/usr/bin/env node
/**
 * Generate migrations/0129_exercise_instructions_all.sql and docs/exercise-instructions.md from
 * scripts/fixtures/exercise-instructions.json (text 1, 2026-11-21: every exercise has a complete
 * instruction in English and Dutch; closes ROADMAP C-B36).
 *
 * Fixture: { _about, exercises: { <slug>: { steps?, cues?, en_reason?, steps_nl, cues_nl,
 * pregnancy_note_nl? } } }. `steps`/`cues` are present only where the English was rewritten;
 * a slug without them keeps the English as stored. Storage is unchanged from 0126: keys inside
 * instructions_json (steps, cues, steps_nl, cues_nl, pregnancy_note_nl).
 *
 * Each UPDATE is guarded on the English the text was written from (step and cue counts, first
 * step), so a row edited live since the baseline is left alone — and the assert at the end then
 * fails the whole file. The assert covers EVERY active global exercise, not only the listed ones.
 *
 * Usage:
 *   node scripts/generate-instructions-migration.mjs           # writes migration + review table
 *   node scripts/generate-instructions-migration.mjs --check   # … then dry-runs it on the baseline
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const SRC = 'scripts/fixtures/exercise-instructions.json';
const OUT = 'migrations/0129_exercise_instructions_all.sql';
const DOC = 'docs/exercise-instructions.md';
const STAMP = 1795305600000;   // 2026-11-21, fixed so a regeneration is byte-identical
export const STEP_MAX = 140;

// 0129 was generated from the library as it stood after 0128. Frozen, like every applied migration.
function baselineDb() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) db.exec(readFileSync(`migrations/baseline/${f}`, 'utf8'));
  return db;
}
const bulb = (s) => (String(s).match(/^(💡\s*)+/)?.[0] ?? '').replace(/\s+/g, ' ');

/** Problems of one exercise's text; `en` is the English that will be stored. Shared with the test. */
export function textErrors(slug, en, nl) {
  const errs = [];
  if (!(en.steps ?? []).length) errs.push(`${slug}: no English steps`);
  if (!(en.cues ?? []).length) errs.push(`${slug}: no English cues`);
  for (const [k, kn] of [['steps', 'steps_nl'], ['cues', 'cues_nl']]) {
    const a = en[k] ?? [], b = nl[kn] ?? [];
    if (a.length !== b.length) errs.push(`${slug}: ${kn} has ${b.length} items, English ${k} ${a.length}`);
    a.forEach((s, i) => { if (typeof s !== 'string' || !s.trim()) errs.push(`${slug}: empty ${k}[${i}]`); });
    b.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errs.push(`${slug}: empty ${kn}[${i}]`);
      else if (bulb(s) !== bulb(a[i] ?? '')) errs.push(`${slug}: ${kn}[${i}] does not keep the 💡 prefix of the English`);
    });
  }
  return errs;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = JSON.parse(readFileSync(SRC, 'utf8'));
  const db = baselineDb();
  const errs = [];
  const rows = [];
  const all = db.prepare('SELECT slug, name, name_nl, category, instructions_json FROM exercises WHERE is_active = 1 AND gym_id IS NULL ORDER BY category, slug').all();
  const known = new Set(all.map((r) => r.slug));
  // After 0129 is applied and the baseline regenerated, a rerun would rewrite the migration as an
  // empty one. Applied history is frozen: refuse.
  if (all.every((r) => Array.isArray(JSON.parse(r.instructions_json).steps_nl))) {
    console.log('the baseline already carries Dutch steps for every exercise: 0129 is applied history, nothing written');
    process.exit(0);
  }
  for (const slug of Object.keys(fixture.exercises)) if (!known.has(slug)) errs.push(`${slug}: not an active global row in the baseline`);
  for (const row of all) {
    const fx = fixture.exercises[row.slug];
    if (!fx) { errs.push(`${row.slug}: missing from the fixture`); continue; }
    const base = JSON.parse(row.instructions_json);
    const en = { steps: fx.steps ?? base.steps ?? [], cues: fx.cues ?? base.cues ?? [] };
    errs.push(...textErrors(row.slug, en, fx));
    if (fx.steps) fx.steps.forEach((s, i) => { if (s.length > STEP_MAX) errs.push(`${row.slug}: rewritten steps[${i}] is ${s.length} characters (max ${STEP_MAX})`); });
    if (!!base.pregnancy_note !== !!fx.pregnancy_note_nl) errs.push(`${row.slug}: pregnancy_note_nl ${fx.pregnancy_note_nl ? 'without' : 'missing for'} an English pregnancy_note`);
    const same = (a, b) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
    const enChanged = !same(en.steps, base.steps) || !same(en.cues, base.cues);
    const nlChanged = !same(fx.steps_nl, base.steps_nl) || !same(fx.cues_nl, base.cues_nl) || (fx.pregnancy_note_nl ?? null) !== (base.pregnancy_note_nl ?? null);
    rows.push({ slug: row.slug, row, base, en, nl: fx, enChanged, nlChanged });
  }
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  const jarr = (a) => `json(${q(JSON.stringify(a))})`;
  const where = ({ slug, base }) => `slug = ${q(slug)} AND gym_id IS NULL AND is_active = 1 AND json_valid(instructions_json)`
    + ` AND json_array_length(instructions_json, '$.steps') = ${(base.steps ?? []).length}`
    + ` AND COALESCE(json_array_length(instructions_json, '$.cues'), 0) = ${(base.cues ?? []).length}`
    + ` AND json_extract(instructions_json, '$.steps[0]') = ${q(base.steps[0])}`;
  const update = (r) => {
    const sets = [
      ...(r.enChanged ? [`'$.steps', ${jarr(r.en.steps)}`, `'$.cues', ${jarr(r.en.cues)}`] : []),
      `'$.steps_nl', ${jarr(r.nl.steps_nl)}`, `'$.cues_nl', ${jarr(r.nl.cues_nl)}`,
      ...(r.nl.pregnancy_note_nl ? [`'$.pregnancy_note_nl', ${q(r.nl.pregnancy_note_nl)}`] : []),
    ];
    return `UPDATE exercises SET instructions_json = json_set(instructions_json, ${sets.join(', ')}), updated_at_ms = ${STAMP} WHERE ${where(r)};`;
  };
  const touched = rows.filter((r) => r.enChanged || r.nlChanged);
  const nEn = rows.filter((r) => r.enChanged).length;
  const nNewNl = rows.filter((r) => !r.base.steps_nl).length;

  const sql = `-- 0129 — every exercise has a complete instruction in English and Dutch (text 1, closes C-B36).
--
-- GENERATED by scripts/generate-instructions-migration.mjs from
-- scripts/fixtures/exercise-instructions.json; the review table docs/exercise-instructions.md is
-- built from the same JSON. Do not hand-edit: change the JSON, regenerate, and ship the change as
-- a NEW migration (this one is applied history once applied).
--
-- Library: ${rows.length} active global exercises. Written: ${touched.length} rows — Dutch steps and cues new for
-- ${nNewNl}, English rewritten for ${nEn} (fragments, missing start or return, bookkeeping as a step).
-- Storage as 0126: keys inside instructions_json; no schema change.
--
-- Each UPDATE only touches a row that still carries the English the text was written from (step
-- and cue counts, first step). The assert at the end fails the whole file unless EVERY active
-- global exercise ends with valid JSON, at least one step and one cue, and as many Dutch steps
-- and cues as English ones.
${touched.map(update).join('\n')}

CREATE TABLE _0129_assert (ok INTEGER NOT NULL CHECK (ok = 1)) STRICT;
INSERT INTO _0129_assert (ok) SELECT CASE WHEN (SELECT COUNT(*) FROM exercises WHERE gym_id IS NULL AND is_active = 1
  AND NOT (json_valid(instructions_json)
    AND COALESCE(json_array_length(instructions_json, '$.steps'), 0) >= 1
    AND COALESCE(json_array_length(instructions_json, '$.cues'), 0) >= 1
    AND COALESCE(json_array_length(instructions_json, '$.steps_nl'), -1) = json_array_length(instructions_json, '$.steps')
    AND COALESCE(json_array_length(instructions_json, '$.cues_nl'), -1) = json_array_length(instructions_json, '$.cues'))) = 0 THEN 1 ELSE 0 END;
DROP TABLE _0129_assert;
`;
  writeFileSync(OUT, sql);

  const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const doc = [
    '# Exercise instructions, English and Dutch — review table',
    '',
    `GENERATED by \`scripts/generate-instructions-migration.mjs\` from \`${SRC}\` (migration \`${OUT}\`).`,
    'Corrections: edit the JSON and regenerate as a NEW migration; never edit this file or the SQL.',
    '',
    `${rows.length} exercises. Dutch new for ${nNewNl}; English rewritten for ${nEn} (marked ✎, with the reason and the old text).`,
    '',
    ...rows.flatMap(({ slug, row, base, en, nl, enChanged }) => [
      `## ${cell(row.name_nl ?? row.name)} (\`${slug}\`, ${row.category})${enChanged ? ' ✎' : ''}`,
      '',
      ...(enChanged ? [`English rewritten: ${cell(nl.en_reason ?? 'no reason recorded')}. Was: ${cell((base.steps ?? []).join(' / '))}`, ''] : []),
      '| | English | Nederlands |',
      '|---|---|---|',
      ...en.steps.map((s, i) => `| stap ${i + 1} | ${cell(s)} | ${cell(nl.steps_nl[i])} |`),
      ...en.cues.map((s, i) => `| tip ${i + 1} | ${cell(s)} | ${cell(nl.cues_nl[i])} |`),
      ...(base.pregnancy_note ? [`| pregnancy_note | ${cell(base.pregnancy_note)} | ${cell(nl.pregnancy_note_nl)} |`] : []),
      '',
    ]),
  ].join('\n');
  writeFileSync(DOC, doc);
  console.log(`wrote ${OUT} (${touched.length} UPDATE statements; Dutch new ${nNewNl}, English rewritten ${nEn}) and ${DOC}`);

  if (process.argv.includes('--check')) {
    db.exec(sql);
    const bad = db.prepare(`SELECT COUNT(*) AS n FROM exercises WHERE gym_id IS NULL AND is_active = 1 AND COALESCE(json_array_length(instructions_json, '$.steps_nl'), -1) <> json_array_length(instructions_json, '$.steps')`).get().n;
    if (bad) { console.error(`dry run: ${bad} exercises without aligned Dutch steps`); process.exit(1); }
    console.log(`dry run on the baseline OK: ${rows.length} exercises complete, assert passed`);
  }
}

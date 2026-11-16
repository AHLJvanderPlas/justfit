#!/usr/bin/env node
/**
 * Generate migrations/0126_exercise_instructions_nl.sql and docs/exercise-instructions-nl.md
 * from scripts/fixtures/exercise-instructions-nl.json (UX review 2026-11-16, finding 3).
 *
 * Storage: keys INSIDE instructions_json — steps_nl, cues_nl, pregnancy_note_nl,
 * postnatal_note_nl — next to the English steps/cues. No column, no schema change: every
 * reader that passes instructions_json through (plan steps, /api/exercises, the trainer
 * portal and admin, which only JSON.parse it and read steps/cues) keeps working; the client
 * picks the language through exerciseInstructions() in i18n.js.
 *
 * Each UPDATE is guarded: the row must still carry the English the translation was made
 * from (same number of steps and cues, same first step). A row edited live since the
 * baseline is left alone — and the assert at the end then fails the whole file, so the
 * manager learns about it instead of shipping a half-translated row.
 *
 * Checks before writing: every fixture slug exists in the baseline; steps_nl / cues_nl have
 * exactly as many items as the English; 💡 prefixes kept; a note only where the English
 * has one; no empty strings. --check also dry-runs the SQL on the baseline in node:sqlite.
 *
 * Usage:
 *   node scripts/generate-instructions-nl-migration.mjs           # writes migration + review table
 *   node scripts/generate-instructions-nl-migration.mjs --check   # … then dry-runs it
 *   node scripts/generate-instructions-nl-migration.mjs --rank    # the selection: most-prescribed
 *                                                                 # exercises, general path, baseline library
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const SRC = 'scripts/fixtures/exercise-instructions-nl.json';
const OUT = 'migrations/0126_exercise_instructions_nl.sql';
const DOC = 'docs/exercise-instructions-nl.md';
const STAMP = 1794873600000;   // 2026-11-16, fixed so a regeneration is byte-identical
const NOTES = [['pregnancy_note', 'pregnancy_note_nl'], ['postnatal_note', 'postnatal_note_nl']];

export function baselineDb() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) db.exec(readFileSync(`migrations/baseline/${f}`, 'utf8'));
  return db;
}

if (process.argv.includes('--rank')) {
  const { runPlanner } = await import('../functions/api/plan.js');
  const ex = baselineDb().prepare('SELECT * FROM exercises WHERE is_active = 1 AND gym_id IS NULL').all();
  const counts = new Map();
  let plans = 0;
  for (const goal of ['health', 'fat_loss', 'strength', 'muscle_gain', 'mobility', 'endurance'])
    for (const exp of ['beginner', 'intermediate', 'advanced'])
      for (const budget of [20, 30, 45])
        for (const eq of [['none'], ['none', 'dumbbell']])
          for (let i = 0; i < 28; i++) {
            const d = new Date(Date.UTC(2026, 10, 16) + i * 86400000).toISOString().slice(0, 10);
            const prefs = { training_goal: goal, experience_level: exp, session_duration_min: budget,
              preferences: { primary_intent: 'general', available_equipment: eq, sport_prefs: { bias_enabled: false } } };
            const o = runPlanner(d, null, ex, prefs, [], [], { sex: 'female', weight_kg: 70, height_cm: 170 }, null, null, false, null, false, [], null, 0, 0, 0, null, null, {});
            plans++;
            for (const s of o.steps ?? []) counts.set(s.exercise_slug, (counts.get(s.exercise_slug) ?? 0) + 1);
          }
  console.log(`${plans} plans, ${counts.size} distinct exercises`);
  [...counts].sort((a, b) => b[1] - a[1]).forEach(([slug, n], i) => console.log(`${i + 1}\t${n}\t${slug}`));
  process.exit(0);
}

const fixture = JSON.parse(readFileSync(SRC, 'utf8'));
const entries = Object.entries(fixture.exercises);
const db = baselineDb();
const errs = [];
const rows = [];
const bulb = (s) => (String(s).match(/^(💡\s*)+/)?.[0] ?? '').replace(/\s+/g, ' ');
for (const [slug, nl] of entries) {
  const row = db.prepare('SELECT slug, name, name_nl, instructions_json FROM exercises WHERE slug = ? AND is_active = 1 AND gym_id IS NULL').get(slug);
  if (!row) { errs.push(`${slug}: not an active global row in the baseline`); continue; }
  let en;
  try { en = JSON.parse(row.instructions_json); } catch { errs.push(`${slug}: baseline instructions_json is not JSON`); continue; }
  for (const [k, kn] of [['steps', 'steps_nl'], ['cues', 'cues_nl']]) {
    const a = en[k] ?? [], b = nl[kn] ?? [];
    if (a.length !== b.length) errs.push(`${slug}: ${kn} has ${b.length} items, English ${k} ${a.length}`);
    b.forEach((s, i) => {
      if (typeof s !== 'string' || !s.trim()) errs.push(`${slug}: empty ${kn}[${i}]`);
      else if (bulb(s) !== bulb(a[i] ?? '')) errs.push(`${slug}: ${kn}[${i}] does not keep the 💡 prefix of the English`);
    });
  }
  for (const [k, kn] of NOTES) if (!!en[k] !== !!nl[kn]) errs.push(`${slug}: ${kn} ${nl[kn] ? 'without' : 'missing for'} an English ${k}`);
  rows.push({ slug, row, en, nl });
}
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const jarr = (a) => `json(${q(JSON.stringify(a))})`;
const where = ({ slug, en }) => `slug = ${q(slug)} AND gym_id IS NULL AND is_active = 1 AND json_valid(instructions_json)`
  + ` AND json_array_length(instructions_json, '$.steps') = ${(en.steps ?? []).length}`
  + ` AND COALESCE(json_array_length(instructions_json, '$.cues'), 0) = ${(en.cues ?? []).length}`
  + ((en.steps ?? []).length ? ` AND json_extract(instructions_json, '$.steps[0]') = ${q(en.steps[0])}` : '');
const update = (r) => {
  const sets = [`'$.steps_nl', ${jarr(r.nl.steps_nl ?? [])}`, `'$.cues_nl', ${jarr(r.nl.cues_nl ?? [])}`,
    ...NOTES.filter(([, kn]) => r.nl[kn]).map(([, kn]) => `'$.${kn}', ${q(r.nl[kn])}`)];
  return `UPDATE exercises SET instructions_json = json_set(instructions_json, ${sets.join(', ')}), updated_at_ms = ${STAMP} WHERE ${where(r)};`;
};
const slugList = rows.map((r) => q(r.slug)).join(', ');
const nSteps = rows.reduce((n, r) => n + (r.nl.steps_nl ?? []).length, 0);
const nCues = rows.reduce((n, r) => n + (r.nl.cues_nl ?? []).length, 0);
const nNotes = rows.reduce((n, r) => n + NOTES.filter(([, kn]) => r.nl[kn]).length, 0);

const sql = `-- 0126 — Dutch instruction steps and cues for the ${rows.length} most-prescribed exercises.
--
-- GENERATED by scripts/generate-instructions-nl-migration.mjs from
-- scripts/fixtures/exercise-instructions-nl.json; the review table docs/exercise-instructions-nl.md
-- is built from the same JSON. Do not hand-edit: change the JSON, regenerate, and ship the
-- change as a NEW migration (this one is applied history once applied).
--
-- Finding 3 (docs/UI_UX_REVIEW_2026-11-16.md): names were Dutch (0124) but the steps and cues
-- under them were English. Storage: keys inside instructions_json (steps_nl, cues_nl,
-- pregnancy_note_nl, postnatal_note_nl) — no schema change; the English keys are untouched.
-- Selection: ${fixture.selection}
-- Written: ${rows.length} rows, ${nSteps} steps, ${nCues} cues, ${nNotes} notes.
--
-- Each UPDATE only touches a row that still carries the English the translation was made from
-- (step and cue counts, first step). The assert at the end fails the whole file unless every
-- listed row ends with valid JSON and as many Dutch steps and cues as English ones.
${rows.map(update).join('\n')}

CREATE TABLE _0126_assert (ok INTEGER NOT NULL CHECK (ok = 1)) STRICT;
INSERT INTO _0126_assert (ok) SELECT CASE WHEN (SELECT COUNT(*) FROM exercises WHERE gym_id IS NULL AND is_active = 1 AND slug IN (${slugList})
  AND json_valid(instructions_json)
  AND json_array_length(instructions_json, '$.steps_nl') = json_array_length(instructions_json, '$.steps')
  AND json_array_length(instructions_json, '$.cues_nl') = COALESCE(json_array_length(instructions_json, '$.cues'), 0)) = ${rows.length} THEN 1 ELSE 0 END;
DROP TABLE _0126_assert;
`;
writeFileSync(OUT, sql);

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const doc = [
  '# Dutch exercise instructions — review table',
  '',
  `GENERATED by \`scripts/generate-instructions-nl-migration.mjs\` from \`${SRC}\` (migration \`${OUT}\`).`,
  'Corrections: edit the JSON and regenerate as a NEW migration; never edit this file or the SQL.',
  '',
  `Selection: ${fixture.selection}`,
  '',
  `${rows.length} exercises · ${nSteps} steps · ${nCues} cues · ${nNotes} notes.`,
  '',
  ...rows.flatMap(({ slug, row, en, nl }) => [
    `## ${cell(row.name_nl ?? row.name)} (\`${slug}\`, prescribed ${fixture.exercises[slug].prescribed}×)`,
    '',
    '| | English | Nederlands |',
    '|---|---|---|',
    ...(en.steps ?? []).map((s, i) => `| stap ${i + 1} | ${cell(s)} | ${cell(nl.steps_nl[i])} |`),
    ...(en.cues ?? []).map((s, i) => `| tip ${i + 1} | ${cell(s)} | ${cell(nl.cues_nl[i])} |`),
    ...NOTES.filter(([k]) => en[k]).map(([k, kn]) => `| ${k} | ${cell(en[k])} | ${cell(nl[kn])} |`),
    '',
  ]),
].join('\n');
writeFileSync(DOC, doc);
console.log(`wrote ${OUT} (${rows.length} UPDATE statements) and ${DOC}`);

if (process.argv.includes('--check')) {
  db.exec(sql);
  const done = db.prepare(`SELECT COUNT(*) AS n FROM exercises WHERE json_extract(instructions_json, '$.steps_nl') IS NOT NULL`).get().n;
  if (done !== rows.length) { console.error(`dry run: ${done} rows carry steps_nl, expected ${rows.length}`); process.exit(1); }
  console.log(`dry run on the baseline OK: ${done} rows translated, assert passed`);
}

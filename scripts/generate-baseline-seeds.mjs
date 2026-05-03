#!/usr/bin/env node
/**
 * JustFit — Baseline Seed Generator
 *
 * Queries the live production D1 database and writes executable SQL seed
 * snapshots for migrations/baseline/1020_*, 1030_*, 1040_*.
 *
 * Run from the justfit/ project root:
 *   node scripts/generate-baseline-seeds.mjs
 *
 * Requirements:
 *   wrangler must be logged in to the correct account (ahljvanderplas@gmail.com)
 *   Verify with: npx wrangler whoami
 *
 * Run this script after every migration that adds/updates seed data so the
 * baseline files stay current. See docs/database-bootstrap.md for policy.
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

const DB = 'justfit-db';

// ── helpers ─────────────────────────────────────────────────────────────────

function query(sql) {
  const raw = execSync(
    `npx wrangler d1 execute ${DB} --remote --json --command ${JSON.stringify(sql)}`,
    { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
  );
  // wrangler prepends a version banner before JSON output
  const jsonStart = raw.indexOf('[');
  if (jsonStart === -1) throw new Error(`No JSON in wrangler output:\n${raw.slice(0, 500)}`);
  const data = JSON.parse(raw.slice(jsonStart));
  if (!data[0]?.success) throw new Error(`Query failed:\n${JSON.stringify(data[0], null, 2)}`);
  return data[0].results ?? [];
}

/**
 * Convert a JS value to a SQL literal.
 * Single quotes inside strings are escaped by doubling.
 */
function lit(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

/**
 * Generate INSERT OR IGNORE statements for a table.
 * One statement per row for simplicity and debuggability.
 */
function inserts(table, rows, cols) {
  if (!rows.length) return `-- (no rows in ${table})\n`;
  return rows
    .map(r =>
      `INSERT OR IGNORE INTO ${table} (${cols.join(', ')}) VALUES\n` +
      `  (${cols.map(c => lit(r[c])).join(', ')});`
    )
    .join('\n') + '\n';
}

const stamp = new Date().toISOString();

// ── 1020: exercises, session_templates, awards ───────────────────────────

console.log('Querying exercises…');
const exercises = query('SELECT * FROM exercises ORDER BY created_at_ms, slug');
console.log(`  → ${exercises.length} rows`);

console.log('Querying session_templates…');
const templates = query('SELECT * FROM session_templates ORDER BY created_at_ms, id');
console.log(`  → ${templates.length} rows`);

console.log('Querying awards…');
const awards = query('SELECT * FROM awards ORDER BY created_at_ms, id');
console.log(`  → ${awards.length} rows`);

const exerciseCols = [
  'id','slug','name','category',
  'primary_muscles_json','secondary_muscles_json','tags_json',
  'equipment_required_json','equipment_advised_json',
  'instructions_json','media_json','metrics_json','alternatives_json',
  'is_active','created_at_ms','updated_at_ms',
];
const templateCols = [
  'id','slug','name','description','session_type','difficulty',
  'duration_min','template_json','is_active','created_at_ms','updated_at_ms',
];
const awardCols = [
  'id','slug','name','description','category','icon',
  'criteria_json','is_active','created_at_ms','updated_at_ms',
];

const seed1020 = `\
-- =============================================================================
-- JustFit — Exercise Library Seed (Executable Snapshot)
-- File: migrations/baseline/1020_seed_exercises.sql
-- Generated: ${stamp}
--
-- Bootstrap order: run AFTER 1010_schema_training.sql and 1000_schema_core.sql
--
-- Canonical current state of:
--   exercises         : ${exercises.length} rows (general library + military exercises from
--                       migrations 0004/0010/0012/0015/0016/0020/0029/0031/0045)
--   session_templates : ${templates.length} rows (migrations 0005, 0011)
--   awards            : ${awards.length} rows (migrations 0002, 0033)
--
-- Uses INSERT OR IGNORE — idempotent on a fresh or existing DB.
-- Military exercise_aliases, program_templates, and program_template_items
-- are in 1040_seed_military.sql.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- exercises (${exercises.length} rows)
-- ---------------------------------------------------------------------------

${inserts('exercises', exercises, exerciseCols)}
-- ---------------------------------------------------------------------------
-- session_templates (${templates.length} rows)
-- ---------------------------------------------------------------------------

${inserts('session_templates', templates, templateCols)}
-- ---------------------------------------------------------------------------
-- awards (${awards.length} rows)
-- ---------------------------------------------------------------------------

${inserts('awards', awards, awardCols)}
`;

writeFileSync('migrations/baseline/1020_seed_exercises.sql', seed1020);
console.log('Written: migrations/baseline/1020_seed_exercises.sql');

// ── 1030: cycling_workouts ─────────────────────────────────────────────────

console.log('Querying cycling_workouts…');
const cws = query('SELECT * FROM cycling_workouts ORDER BY id');
console.log(`  → ${cws.length} rows`);

const cwCols = [
  'id','slug','name','sub_goal','workout_type',
  'tss_estimate','duration_min','intervals_json','is_active',
];

const seed1030 = `\
-- =============================================================================
-- JustFit — Cycling Workouts Seed (Executable Snapshot)
-- File: migrations/baseline/1030_seed_cycling.sql
-- Generated: ${stamp}
--
-- Bootstrap order: run AFTER 1010_schema_training.sql
--
-- Canonical current state of:
--   cycling_workouts : ${cws.length} rows
--   (migrations 0035 initial 23 workouts + 0037 Phase 3a 6 new + 3 updated)
--
-- Uses INSERT OR IGNORE — idempotent on a fresh or existing DB.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- cycling_workouts (${cws.length} rows)
-- ---------------------------------------------------------------------------

${inserts('cycling_workouts', cws, cwCols)}
`;

writeFileSync('migrations/baseline/1030_seed_cycling.sql', seed1030);
console.log('Written: migrations/baseline/1030_seed_cycling.sql');

// ── 1040: exercise_aliases, program_templates, program_template_items ──────

console.log('Querying exercise_aliases…');
const aliases = query('SELECT * FROM exercise_aliases ORDER BY created_at_ms, alias');
console.log(`  → ${aliases.length} rows`);

console.log('Querying program_templates…');
const pts = query('SELECT * FROM program_templates ORDER BY created_at_ms, slug');
console.log(`  → ${pts.length} rows`);

console.log('Querying program_template_items…');
const ptis = query(
  'SELECT * FROM program_template_items ' +
  'ORDER BY program_template_id, block_week, day_index, session_order'
);
console.log(`  → ${ptis.length} rows`);

const aliasCols = ['id','exercise_id','alias','created_at_ms','updated_at_ms'];
const ptCols = [
  'id','slug','name','coach_type','sport','level','block_length',
  'metadata_json','is_active','created_at_ms','updated_at_ms',
];
const ptiCols = [
  'id','program_template_id','block_week','day_index','session_order',
  'item_type','exercise_id','protocol_id','notes_json',
  'created_at_ms','updated_at_ms',
];

const seed1040 = `\
-- =============================================================================
-- JustFit — Military Programme Seed (Executable Snapshot)
-- File: migrations/baseline/1040_seed_military.sql
-- Generated: ${stamp}
--
-- Bootstrap order: run AFTER 1020_seed_exercises.sql
-- (exercise_aliases.exercise_id references exercises seeded in 1020)
--
-- Canonical current state of:
--   exercise_aliases       : ${aliases.length} rows (migration 0046)
--   program_templates      : ${pts.length} rows (migration 0047)
--   program_template_items : ${ptis.length} rows (migration 0047)
--
-- Deferred — excluded from this snapshot (pending migration 0048):
--   optillen-vanaf-de-grond                    — load completely unspecified
--   til-draagtest-full-exercise                — load/object unspecified
--   til-draagtest-gewicht-plaatsen-naar-heupen — load weight unspecified
--   hardlopen-zone-3-5-minuten                 — data conflict (source 2 min vs name 5 min)
--   52 program_template_items referencing those 4 exercises — also excluded
--   Resolution: trainer must supply missing parameters → migration 0048
--
-- Uses INSERT OR IGNORE — idempotent on a fresh or existing DB.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- exercise_aliases (${aliases.length} rows)
-- ---------------------------------------------------------------------------

${inserts('exercise_aliases', aliases, aliasCols)}
-- ---------------------------------------------------------------------------
-- program_templates (${pts.length} rows)
-- ---------------------------------------------------------------------------

${inserts('program_templates', pts, ptCols)}
-- ---------------------------------------------------------------------------
-- program_template_items (${ptis.length} rows)
-- Excludes 52 items referencing the 4 deferred exercises.
-- ---------------------------------------------------------------------------

${inserts('program_template_items', ptis, ptiCols)}
`;

writeFileSync('migrations/baseline/1040_seed_military.sql', seed1040);
console.log('Written: migrations/baseline/1040_seed_military.sql');

console.log('\nDone. Verify row counts match production before committing.');

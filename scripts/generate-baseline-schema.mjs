#!/usr/bin/env node
/**
 * Regenerate migrations/baseline/1000_schema_core.sql from the LIVE database.
 *
 * Why this exists. The schema baseline used to be maintained by hand and had
 * drifted from production by three tables and six columns; the e2e fixture
 * inserted columns production does not have; and the e2e gate only passed in
 * the main checkout because its local D1 was a months-old artefact that
 * happened to carry those columns. A baseline that is generated from
 * sqlite_master cannot drift: it IS what production has.
 *
 * What it writes. Every table and index from sqlite_master, in creation
 * (rowid) order, with the exact DDL text production holds — STRICT, CHECKs,
 * defaults, FKs. Excluded: sqlite_* internals and Cloudflare's _cf_KV.
 * schema_migrations is INCLUDED so a bootstrapped environment can run
 * scripts/migrate.mjs immediately.
 *
 * 1010_schema_training.sql is kept as an empty, documented file so the
 * documented bootstrap order (1010 → 1000 → seeds) stays valid without a
 * second source of truth. SQLite does not require an FK's target table to
 * exist at CREATE time, so creation order needs no partitioning.
 *
 * Usage (read-only against D1):
 *   node scripts/generate-baseline-schema.mjs            # writes the two files
 *   node scripts/generate-baseline-schema.mjs --check    # exits 1 if the file
 *                                                        # on disk differs
 * Also refreshes scripts/fixtures/live-columns.json, which smoke uses to
 * assert the baseline matches production without touching the network.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const DB = 'justfit-db';
const OUT_CORE = 'migrations/baseline/1000_schema_core.sql';
const OUT_TRAIN = 'migrations/baseline/1010_schema_training.sql';
const OUT_COLS = 'scripts/fixtures/live-columns.json';
const CHECK = process.argv.includes('--check');

// Credentials: the house pattern — the Claude settings file carries the account
// id and token; fall back to whatever the shell already has.
try {
  const env = JSON.parse(readFileSync('.claude/settings.local.json', 'utf8')).env ?? {};
  for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = String(v);
} catch { /* rely on the shell */ }

function query(sql) {
  const out = execSync(
    `npx wrangler d1 execute ${DB} --remote --json --command ${JSON.stringify(sql)}`,
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024 });
  return JSON.parse(out)[0].results;
}

// Filtering in JS, not SQL: an ESCAPE clause does not survive the shell quoting
// that execSync + JSON.stringify apply to the command.
const rows = query('SELECT type, name, tbl_name, sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY rowid')
  .filter(r => !r.name.startsWith('sqlite_') && !r.name.startsWith('_cf'));
const tables = rows.filter(r => r.type === 'table');
const indexes = rows.filter(r => r.type === 'index');
const others = rows.filter(r => !['table', 'index'].includes(r.type));
if (others.length) throw new Error(`unexpected sqlite_master types: ${others.map(o => o.type + ':' + o.name).join(', ')}`);

const stamp = new Date().toISOString();
const header = (title, body) => `-- =============================================================================
-- JustFit — ${title}
-- Generated: ${stamp}  by scripts/generate-baseline-schema.mjs (read-only SELECT
-- against live ${DB}). DO NOT HAND-EDIT: regenerate instead.
--
${body}
-- =============================================================================
`;

const core = header('Schema Baseline (every table and index, exactly as production holds it)', `-- Canonical current state of live D1 at generation time:
--   tables  : ${tables.length}
--   indexes : ${indexes.length}
-- Creation order preserved (sqlite_master rowid). Includes schema_migrations so
-- a bootstrapped environment can run scripts/migrate.mjs immediately.
-- Bootstrap order: 1010 (empty) → THIS FILE → 1020/1030/1040 seeds.`)
  + '\n' + [...tables, ...indexes].map(r => r.sql.trim().replace(/;?$/, ';')).join('\n\n') + '\n';

const train = header('Training Schema Baseline (superseded)', `-- All schema — training tables included — is in 1000_schema_core.sql, generated
-- from live sqlite_master. This file is kept, empty, so the documented bootstrap
-- order (run 1010 first, then 1000) stays valid without a second source of truth.
-- It must stay free of DDL: a second definition here would be a second place to
-- drift. The single SELECT exists because wrangler refuses a statement-less file.`)
  + "\nSELECT 'superseded: all schema is in 1000_schema_core.sql';\n";

// Columns per table, for the offline smoke guard.
const mem = new DatabaseSync(':memory:');
for (const t of tables) mem.exec(t.sql);
const columns = {};
for (const t of tables) columns[t.name] = mem.prepare(`PRAGMA table_info("${t.name}")`).all().map(c => c.name);
const colsJson = JSON.stringify({ generated: stamp, regenerate: 'node scripts/generate-baseline-schema.mjs', columns }, null, 1) + '\n';

const strip = (s) => s.replace(/^-- Generated:.*$/m, '');
if (CHECK) {
  const same = existsSync(OUT_CORE) && strip(readFileSync(OUT_CORE, 'utf8')) === strip(core);
  process.stdout.write(same ? 'OK\n' : `${OUT_CORE} differs from live sqlite_master — run node scripts/generate-baseline-schema.mjs\n`);
  process.exit(same ? 0 : 1);
}
writeFileSync(OUT_CORE, core);
writeFileSync(OUT_TRAIN, train);
writeFileSync(OUT_COLS, colsJson);
console.log(`Written: ${OUT_CORE} (${tables.length} tables, ${indexes.length} indexes), ${OUT_TRAIN} (empty by design), ${OUT_COLS}`);

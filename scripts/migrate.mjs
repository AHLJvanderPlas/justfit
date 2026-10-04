#!/usr/bin/env node
/**
 * JustFit — migration tool. The ONLY way a migration reaches the remote D1.
 *
 *   node scripts/migrate.mjs apply migrations/NNNN_name.sql [--allow-empty --note "why"] [--via-command]
 *   node scripts/migrate.mjs status [--quiet]
 *   node scripts/migrate.mjs baseline [--dry-run]
 *
 * Why: `_migrations` never held a row; the only record of what was applied was a
 * sentence in two CLAUDE.md files. Migration 0033 "applied" in April and inserted
 * nothing — INSERT OR IGNORE swallowed a CHECK violation — and nothing compared
 * intent with outcome for six months. This tool records every apply in the
 * `schema_migrations` table (migration 0118) and refuses what the docs could only
 * ask for:
 *
 *   apply     refuses a filename already recorded; refuses to run at all while any
 *             recorded file's sha256 differs from disk (append-only, enforced);
 *             refuses to skip an older unrecorded file or reuse a number; records
 *             D1's rows_written; exits 1 when a file containing an INSERT wrote 0
 *             rows (unless --allow-empty --note "reason", which is recorded).
 *   status    every migrations/0*.sql vs the table — ok / CHANGED / UNRECORDED /
 *             MISSING-FILE. Exit 1 on any drift, or when the table does not exist.
 *   baseline  one time only: records every file numbered below 0118 as applied
 *             (checksum from disk, rows_written NULL, note 'baseline 2026-10-04').
 *             Refuses if the table holds any row other than 0118's own.
 *
 *   --local   any subcommand against the local (miniflare) D1 instead of remote —
 *             a rehearsal; local D1 reports no row counts, so the zero-row check
 *             is skipped there.
 *
 * Exit codes: 0 ok · 1 refused / drift / zero-row seed · 2 usage or wrangler error.
 *
 * Decision logic lives in the exported pure functions below and is tested by
 * scripts/migrate.test.mjs (`node --test scripts/migrate.test.mjs`, no wrangler).
 * The wrangler calls at the bottom are a thin shell around them.
 *
 * Credentials: wrangler reads CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID /
 * XDG_CONFIG_HOME from the environment. When CLOUDFLARE_API_TOKEN is unset this
 * script fills the missing ones from the `env` block of .claude/settings.local.json
 * (repo root, or the main checkout when run from a .claude/worktrees/ worktree).
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DB = 'justfit-db';
export const LEDGER_TABLE = 'schema_migrations';
export const LEDGER_FILE = '0118_schema_migrations.sql';
export const BASELINE_NOTE = 'baseline 2026-10-04';
export const BOOTSTRAP_NOTE = 'bootstrap: this migration creates the ledger it is recorded in';
const MIGRATION_RE = /^(\d{4})[a-z]?_[A-Za-z0-9_.-]+\.sql$/;

// ── pure decision logic ─────────────────────────────────────────────────────

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/** 4-digit numeric prefix of a migration filename, or null. */
export function migrationNumber(filename) {
  const m = MIGRATION_RE.exec(filename);
  return m ? Number(m[1]) : null;
}

/** SQL with comments and string/identifier literals blanked out. */
export function stripSqlNoise(sql) {
  return sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\/|'(?:[^']|'')*'|"(?:[^"]|"")*"/g, ' ');
}

/** True when the file inserts rows (INSERT …, or REPLACE INTO …) outside comments/strings. */
export function containsInsert(sql) {
  const code = stripSqlNoise(sql);
  return /\bINSERT\b/i.test(code) || /\bREPLACE\s+INTO\b/i.test(code);
}

/** Parse wrangler --json stdout (tolerates a banner before the JSON). */
export function parseWranglerJson(raw) {
  const text = String(raw ?? '').trim();
  try { return JSON.parse(text); } catch { /* fall through */ }
  const starts = [text.indexOf('['), text.indexOf('{')].filter(i => i >= 0);
  if (!starts.length) throw new Error(`no JSON in wrangler output:\n${text.slice(0, 500)}`);
  return JSON.parse(text.slice(Math.min(...starts)));
}

/**
 * Summarise a parsed wrangler response. Handles both shapes:
 *   --command  → [{ results, success, meta: { rows_read, rows_written } }, …] (one per statement)
 *   --file     → [{ results: [{ 'Rows written': n, … }], success, meta: { rows_read, rows_written } }]
 *   error      → { error: { text, notes: [{ text }] } }
 * rowsWritten/rowsRead are null when the response carries no count at all.
 */
export function summarizeExecution(parsed) {
  if (!Array.isArray(parsed)) {
    const err = parsed?.error;
    const msg = err
      ? [err.text, ...(err.notes ?? []).map(n => n.text)].filter(Boolean).join(' — ')
      : `unexpected wrangler response: ${JSON.stringify(parsed).slice(0, 300)}`;
    return { success: false, rowsWritten: null, rowsRead: null, statements: 0, error: msg };
  }
  let rw = 0, rr = 0, rwKnown = false, rrKnown = false, success = parsed.length > 0;
  for (const r of parsed) {
    if (r?.success !== true) success = false;
    const w = typeof r?.meta?.rows_written === 'number' ? r.meta.rows_written : r?.results?.[0]?.['Rows written'];
    const rd = typeof r?.meta?.rows_read === 'number' ? r.meta.rows_read : r?.results?.[0]?.['Rows read'];
    if (typeof w === 'number') { rw += w; rwKnown = true; }
    if (typeof rd === 'number') { rr += rd; rrKnown = true; }
  }
  return {
    success,
    rowsWritten: rwKnown ? rw : null,
    rowsRead: rrKnown ? rr : null,
    statements: parsed.length,
    error: success ? null : 'wrangler reported success=false',
  };
}

/** True when a wrangler error says the ledger table is not there. */
export function isMissingLedgerError(message) {
  return new RegExp(`no such table:?\\s*${LEDGER_TABLE}\\b`, 'i').test(String(message ?? ''));
}

/** Recorded rows whose file is gone or whose checksum no longer matches disk. */
export function ledgerDrift(ledger, diskShas) {
  const out = [];
  for (const row of ledger) {
    const disk = diskShas.get(row.filename);
    if (disk === undefined) out.push({ filename: row.filename, state: 'MISSING-FILE' });
    else if (disk !== row.sha256) out.push({ filename: row.filename, state: 'CHANGED' });
  }
  return out;
}

/**
 * Decide whether `filename` may be applied.
 *   ledger   null when schema_migrations does not exist, else [{ filename, sha256 }]
 *   diskShas Map filename → sha256 of every migrations/0*.sql
 * Returns { action: 'apply' | 'bootstrap' } or { action: 'refuse', reasons: [...] }.
 */
export function decideApply({ filename, ledger, diskShas }) {
  const num = migrationNumber(filename);
  if (num === null) {
    return { action: 'refuse', reasons: [`${filename} is not a migration filename (expected migrations/NNNN_name.sql)`] };
  }
  if (!diskShas.has(filename)) {
    return { action: 'refuse', reasons: [`${filename} is not in migrations/ — apply only files that live there`] };
  }
  if (ledger === null) {
    return filename === LEDGER_FILE
      ? { action: 'bootstrap' }
      : { action: 'refuse', reasons: [`${LEDGER_TABLE} does not exist — apply the ledger first: node scripts/migrate.mjs apply migrations/${LEDGER_FILE}`] };
  }
  const reasons = [];
  for (const d of ledgerDrift(ledger, diskShas)) {
    reasons.push(d.state === 'CHANGED'
      ? `${d.filename} was edited after it was applied (sha256 differs from the recorded one) — applied migrations are append-only; restore the file and put the change in a new migration`
      : `${d.filename} is recorded as applied but no longer exists in migrations/ — restore it`);
  }
  const recorded = new Set(ledger.map(r => r.filename));
  if (recorded.has(filename)) {
    reasons.push(`${filename} is already recorded as applied — never apply a migration twice; write a new one`);
  } else {
    const sameNumber = ledger.filter(r => migrationNumber(r.filename) === num).map(r => r.filename);
    if (sameNumber.length) reasons.push(`number ${String(num).padStart(4, '0')} is already used by ${sameNumber.join(', ')} — use the next free number`);
    const maxRecorded = Math.max(-1, ...ledger.map(r => migrationNumber(r.filename) ?? -1));
    if (num < maxRecorded) reasons.push(`${filename} is older than the newest applied migration (${String(maxRecorded).padStart(4, '0')}) — migrations apply in order`);
    const skipped = [...diskShas.keys()].filter(f => !recorded.has(f) && f !== filename && (migrationNumber(f) ?? Infinity) < num).sort();
    if (skipped.length) reasons.push(`older migrations are not recorded: ${skipped.join(', ')} — apply them first (or run baseline once at release)`);
  }
  return reasons.length ? { action: 'refuse', reasons } : { action: 'apply' };
}

/**
 * Judge the outcome. A file that contains an INSERT and wrote zero rows is the
 * 0033 failure mode and fails unless --allow-empty was given with a note.
 * Returns { ok, message, note } — `note` is what to record in the ledger.
 */
export function judgeRowCount({ filename, sql, rowsWritten, allowEmpty = false, note = null }) {
  if (rowsWritten === null || rowsWritten === undefined) {
    return { ok: false, message: `${filename}: wrangler's response carried no rows_written — the outcome cannot be verified`, note: note ?? 'rows_written unknown' };
  }
  if (rowsWritten > 0 || !containsInsert(sql)) return { ok: true, message: null, note };
  if (allowEmpty) return { ok: true, message: null, note: `allow-empty: ${note}` };
  return {
    ok: false,
    message: `${filename} contains an INSERT but wrote 0 rows — the seed inserted nothing. ` +
      'Look for a CHECK/UNIQUE violation hidden by INSERT OR IGNORE, or a WHERE that matched no row. ' +
      'The apply is recorded (it ran); fix forward in a new migration. If a no-op was intended, the flag is --allow-empty --note "why".',
    note: 'ZERO ROWS: contains INSERT, wrote 0 rows',
  };
}

/**
 * The whole post-apply judgement from wrangler's raw stdout, exactly as cmdApply
 * uses it: parse → summarise → judge. Returns { summary, judgement }; when D1
 * reported failure, judgement is null (nothing ran, nothing is recorded).
 */
export function evaluateApplyOutput({ filename, sql, stdout, allowEmpty = false, note = null, local = false }) {
  const summary = summarizeExecution(parseWranglerJson(stdout));
  if (!summary.success) return { summary, judgement: null };
  // Local D1 (miniflare) reports no row counts at all; only a rehearsal runs there.
  if (local && summary.rowsWritten === null) {
    return { summary, judgement: { ok: true, message: null, note: 'local rehearsal: row count not reported by local D1' } };
  }
  return { summary, judgement: judgeRowCount({ filename, sql, rowsWritten: summary.rowsWritten, allowEmpty, note }) };
}

/** Every file on disk and every recorded row, with its state. */
export function computeStatus({ ledger, diskShas }) {
  const byName = new Map(ledger.map(r => [r.filename, r]));
  const names = [...new Set([...diskShas.keys(), ...byName.keys()])].sort();
  const rows = names.map(filename => {
    const rec = byName.get(filename);
    const disk = diskShas.get(filename);
    const state = !rec ? 'UNRECORDED' : disk === undefined ? 'MISSING-FILE' : disk === rec.sha256 ? 'ok' : 'CHANGED';
    return { filename, state, rows_written: rec?.rows_written ?? null, note: rec?.note ?? null };
  });
  return { rows, drift: rows.filter(r => r.state !== 'ok') };
}

/**
 * The one-time baseline: every file numbered below the ledger migration that is
 * not yet recorded. Refuses when the table is missing or holds anything other
 * than the ledger migration's own bootstrap row.
 */
export function planBaseline({ ledger, diskShas }) {
  if (ledger === null) {
    return { refuse: `${LEDGER_TABLE} does not exist — apply migrations/${LEDGER_FILE} first` };
  }
  const others = ledger.filter(r => r.filename !== LEDGER_FILE);
  if (others.length) {
    return { refuse: `${LEDGER_TABLE} already has ${others.length} row(s) besides ${LEDGER_FILE} — baseline runs exactly once` };
  }
  const cutoff = migrationNumber(LEDGER_FILE);
  const recorded = new Set(ledger.map(r => r.filename));
  const files = [...diskShas.keys()].sort();
  const rows = files
    .filter(f => !recorded.has(f) && (migrationNumber(f) ?? Infinity) < cutoff)
    .map(f => ({ filename: f, sha256: diskShas.get(f), rows_written: null, note: BASELINE_NOTE }));
  const left = files.filter(f => !recorded.has(f) && (migrationNumber(f) ?? Infinity) >= cutoff);
  return { rows, left };
}

export function sqlLiteral(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error(`non-finite number ${v}`);
    return String(Math.trunc(v));
  }
  return "'" + String(v).replace(/'/g, "''") + "'";
}

/** One multi-row INSERT for the ledger. Plain INSERT: a duplicate must fail, not vanish. */
export function buildInsertSql(rows, { appliedAtMs, appliedBy }) {
  if (!rows.length) throw new Error('buildInsertSql: no rows');
  const values = rows.map(r =>
    `(${[r.filename, r.sha256, r.rows_written, appliedAtMs, appliedBy, r.note].map(sqlLiteral).join(', ')})`);
  return `INSERT INTO ${LEDGER_TABLE} (filename, sha256, rows_written, applied_at_ms, applied_by, note) VALUES\n${values.join(',\n')};`;
}

export function formatTable(rows, cols) {
  const cell = v => (v === null || v === undefined ? '—' : String(v));
  const widths = cols.map(c => Math.max(c.length, ...rows.map(r => cell(r[c]).length)));
  const line = vals => vals.map((v, i) => v.padEnd(widths[i])).join('  ').trimEnd();
  return [line(cols), line(widths.map(w => '─'.repeat(w))), ...rows.map(r => line(cols.map(c => cell(r[c]))))].join('\n');
}

// ── thin shell: filesystem + wrangler ───────────────────────────────────────

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATIONS_DIR = path.join(ROOT, 'migrations');

class Exit extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function readDiskShas() {
  const map = new Map();
  for (const f of readdirSync(MIGRATIONS_DIR).filter(f => /^0.*\.sql$/.test(f)).sort()) {
    map.set(f, sha256(readFileSync(path.join(MIGRATIONS_DIR, f))));
  }
  return map;
}

function loadCredentials() {
  if (process.env.CLOUDFLARE_API_TOKEN) return;
  const candidates = [path.join(ROOT, '.claude', 'settings.local.json')];
  const wt = ROOT.split(`${path.sep}.claude${path.sep}worktrees${path.sep}`);
  if (wt.length > 1) candidates.push(path.join(wt[0], '.claude', 'settings.local.json'));
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      const env = JSON.parse(readFileSync(file, 'utf8')).env ?? {};
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = String(v);
      if (process.env.CLOUDFLARE_API_TOKEN) return;
    } catch { /* unreadable settings file: let wrangler report auth */ }
  }
}

let TARGET = '--remote';

function wrangler(args) {
  const res = spawnSync('npx', ['wrangler', 'd1', 'execute', DB, TARGET, '--json', ...args], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: process.env,
  });
  if (res.error) throw new Exit(2, `could not run wrangler: ${res.error.message}`);
  let parsed;
  try { parsed = parseWranglerJson(res.stdout); } catch (e) {
    throw new Exit(2, `wrangler exited ${res.status}; ${e.message}\n${(res.stderr || '').slice(0, 500)}`);
  }
  return { stdout: res.stdout, parsed, summary: summarizeExecution(parsed) };
}

function query(sql) {
  const { parsed, summary } = wrangler(['--command', sql]);
  if (!summary.success) return { error: summary.error };
  return { rows: parsed.flatMap(r => r.results ?? []) };
}

/** null when the table does not exist. */
function readLedger() {
  const r = query(`SELECT filename, sha256, rows_written, applied_at_ms, applied_by, note FROM ${LEDGER_TABLE} ORDER BY filename`);
  if (r.error) {
    if (isMissingLedgerError(r.error)) return null;
    throw new Exit(2, `could not read ${LEDGER_TABLE}: ${r.error}`);
  }
  return r.rows;
}

function appliedBy() {
  return process.env.MIGRATE_APPLIED_BY || `${os.userInfo().username}@${os.hostname()}`;
}

function writeLedger(rows) {
  const sql = buildInsertSql(rows, { appliedAtMs: Date.now(), appliedBy: appliedBy() });
  const { summary } = wrangler(['--command', sql]);
  if (!summary.success) return summary.error;
  // Each ledger row is one table write plus its PK index entry; fewer than one
  // write per row means rows went missing.
  if (summary.rowsWritten !== null && summary.rowsWritten < rows.length) {
    return `expected at least ${rows.length} rows written, D1 reported ${summary.rowsWritten}`;
  }
  return null;
}

function cmdStatus({ quiet }) {
  const ledger = readLedger();
  if (ledger === null) {
    throw new Exit(1, `no migration ledger: table ${LEDGER_TABLE} does not exist in ${DB} — apply migrations/${LEDGER_FILE} with migrate.mjs, then run baseline`);
  }
  const { rows, drift } = computeStatus({ ledger, diskShas: readDiskShas() });
  const shown = quiet ? drift : rows;
  if (shown.length) console.log(formatTable(shown, ['filename', 'state', 'rows_written', 'note']));
  const counts = rows.reduce((a, r) => ((a[r.state] = (a[r.state] ?? 0) + 1), a), {});
  const summary = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ');
  if (drift.length) throw new Exit(1, `migration ledger drift: ${summary}`);
  console.log(`migration ledger matches migrations/: ${summary}`);
}

function cmdApply(file, { allowEmpty, note, viaCommand }) {
  if (!file) throw new Exit(2, 'usage: migrate.mjs apply migrations/NNNN_name.sql [--allow-empty --note "why"] [--via-command]');
  if (allowEmpty && !note) throw new Exit(2, '--allow-empty needs --note "why this migration legitimately writes nothing"');
  const abs = path.resolve(file);
  if (path.dirname(abs) !== MIGRATIONS_DIR) throw new Exit(1, `refused: ${file} is not directly in ${path.relative(process.cwd(), MIGRATIONS_DIR) || 'migrations'}/`);
  if (!existsSync(abs)) throw new Exit(2, `no such file: ${file}`);
  const filename = path.basename(abs);
  const bytes = readFileSync(abs);
  const diskShas = readDiskShas();

  const ledger = readLedger();
  const decision = decideApply({ filename, ledger, diskShas });
  if (decision.action === 'refuse') {
    throw new Exit(1, `refused ${filename}:\n  - ${decision.reasons.join('\n  - ')}`);
  }

  console.log(`applying ${filename} (sha256 ${diskShas.get(filename).slice(0, 12)}…)${decision.action === 'bootstrap' ? ' — bootstrap: creating the ledger' : ''}`);
  const sql = bytes.toString('utf8');
  const { stdout } = wrangler(viaCommand ? ['--command', sql] : ['--file', abs]);
  const { summary, judgement } = evaluateApplyOutput({ filename, sql, stdout, allowEmpty, note, local: TARGET === '--local' });
  if (!judgement) {
    throw new Exit(2, `${filename} FAILED in D1 and was NOT recorded: ${summary.error}`);
  }
  console.log(`  D1: ${summary.statements} result(s), ${summary.rowsRead ?? '?'} rows read, ${summary.rowsWritten ?? '?'} rows written`);

  const recordNote = [decision.action === 'bootstrap' ? BOOTSTRAP_NOTE : null, judgement.note].filter(Boolean).join('; ') || null;
  const err = writeLedger([{ filename, sha256: diskShas.get(filename), rows_written: summary.rowsWritten, note: recordNote }]);
  if (err) {
    throw new Exit(2, `${filename} WAS APPLIED but recording it failed (${err}). Record it by hand before anything else:\n` +
      buildInsertSql([{ filename, sha256: diskShas.get(filename), rows_written: summary.rowsWritten, note: recordNote }], { appliedAtMs: Date.now(), appliedBy: appliedBy() }));
  }
  console.log(`  recorded in ${LEDGER_TABLE}${recordNote ? ` (note: ${recordNote})` : ''}`);
  if (!judgement.ok) throw new Exit(1, judgement.message);
}

function cmdBaseline({ dryRun }) {
  const ledger = readLedger();
  const plan = planBaseline({ ledger, diskShas: readDiskShas() });
  if (plan.refuse) throw new Exit(1, `refused baseline: ${plan.refuse}`);
  console.log(`${dryRun ? 'would record' : 'recording'} ${plan.rows.length} file(s) as applied (rows_written NULL, note '${BASELINE_NOTE}'):`);
  console.log(formatTable(plan.rows.map(r => ({ filename: r.filename, sha256: r.sha256.slice(0, 16) + '…' })), ['filename', 'sha256']));
  if (plan.left.length) console.log(`not baselined (numbered ${LEDGER_FILE.slice(0, 4)}+, must go through apply): ${plan.left.join(', ')}`);
  if (dryRun) { console.log('dry run — nothing written'); return; }
  if (!plan.rows.length) throw new Exit(1, 'nothing to baseline');
  const err = writeLedger(plan.rows);
  if (err) throw new Exit(2, `baseline write failed: ${err}`);
  console.log(`baseline recorded: ${plan.rows.length} rows. Run: node scripts/migrate.mjs status`);
}

export function parseArgs(argv) {
  const [cmd, ...rest] = argv;
  const opts = { positional: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--allow-empty') opts.allowEmpty = true;
    else if (a === '--dry-run') opts.dryRun = true;
    else if (a === '--quiet') opts.quiet = true;
    else if (a === '--via-command') opts.viaCommand = true;
    else if (a === '--local') opts.local = true;
    else if (a === '--note') opts.note = rest[++i];
    else if (a.startsWith('--note=')) opts.note = a.slice(7);
    else if (a.startsWith('--')) throw new Exit(2, `unknown option ${a}`);
    else opts.positional.push(a);
  }
  return { cmd, opts };
}

function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));
  if (opts.local) TARGET = '--local';
  else loadCredentials();
  if (cmd === 'status') return cmdStatus(opts);
  if (cmd === 'apply') return cmdApply(opts.positional[0], opts);
  if (cmd === 'baseline') return cmdBaseline(opts);
  throw new Exit(2, 'usage: migrate.mjs <apply FILE [--allow-empty --note "why"] [--via-command] | status [--quiet] | baseline [--dry-run]> [--local]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (e) {
    if (e instanceof Exit) {
      console.error(e.message);
      process.exit(e.code);
    }
    throw e;
  }
}

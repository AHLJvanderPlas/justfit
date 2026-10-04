// Decision logic of scripts/migrate.mjs — no wrangler, no database.
// Run: node --test scripts/migrate.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  sha256, migrationNumber, containsInsert, parseWranglerJson, summarizeExecution,
  isMissingLedgerError, decideApply, judgeRowCount, evaluateApplyOutput, computeStatus,
  planBaseline, buildInsertSql, sqlLiteral, LEDGER_FILE, BASELINE_NOTE,
} from './migrate.mjs';

const disk = entries => new Map(entries);
const rec = (filename, sha) => ({ filename, sha256: sha });

// Fake wrangler stdout, in the exact shapes wrangler 4.76 prints with --json.
const fileResponse = (rowsWritten, rowsRead = 5) => JSON.stringify([{
  results: [{ 'Total queries executed': 5, 'Rows read': rowsRead, 'Rows written': rowsWritten, 'Database size (MB)': '3.21' }],
  success: true, finalBookmark: 'x', meta: { rows_read: rowsRead, rows_written: rowsWritten, duration: 1, size_after: 3211264 },
}]);
const commandResponse = writes => JSON.stringify(writes.map(w => ({
  results: [], success: true, meta: { rows_read: 1, rows_written: w, changes: w },
})));
const errorResponse = text => JSON.stringify({ error: { text: 'A request to the Cloudflare API failed.', notes: [{ text }], kind: 'error', code: 7500 } });

const SEED_0033 = `-- seed 5 running awards
INSERT OR IGNORE INTO awards (id, slug, category) VALUES ('a1', 'run-5k', 'running');`;

// ── the 0033 failure mode ───────────────────────────────────────────────────

test('row-count: fake wrangler --file response with rows_written 0 for an INSERT file is refused', () => {
  const { summary, judgement } = evaluateApplyOutput({
    filename: '0033_running_milestone_awards.sql', sql: SEED_0033, stdout: fileResponse(0),
  });
  assert.equal(summary.success, true);
  assert.equal(summary.rowsWritten, 0);
  assert.equal(judgement.ok, false);
  assert.match(judgement.message, /0033_running_milestone_awards\.sql contains an INSERT but wrote 0 rows — the seed inserted nothing/);
  assert.match(judgement.note, /ZERO ROWS/);
});

test('row-count: per-statement --command response summing to 0 is refused too', () => {
  const { judgement } = evaluateApplyOutput({ filename: '0200_x.sql', sql: SEED_0033, stdout: commandResponse([0, 0]) });
  assert.equal(judgement.ok, false);
});

test('row-count: INSERT that wrote rows passes', () => {
  const { judgement } = evaluateApplyOutput({ filename: '0200_x.sql', sql: SEED_0033, stdout: fileResponse(10) });
  assert.equal(judgement.ok, true);
});

test('row-count: --allow-empty lets a zero-row INSERT through and records the note', () => {
  const j = judgeRowCount({ filename: '0200_x.sql', sql: SEED_0033, rowsWritten: 0, allowEmpty: true, note: 'rows already present in prod' });
  assert.equal(j.ok, true);
  assert.equal(j.note, 'allow-empty: rows already present in prod');
});

test('row-count: a file without INSERT may write 0 rows (pure UPDATE/DDL no-op is not judged)', () => {
  assert.equal(judgeRowCount({ filename: 'f', sql: "UPDATE exercises SET name = 'INSERT' WHERE 0;", rowsWritten: 0 }).ok, true);
});

test('row-count: no rows_written in the response at all is a failure, not a pass', () => {
  const j = judgeRowCount({ filename: 'f', sql: 'CREATE TABLE t (a);', rowsWritten: null });
  assert.equal(j.ok, false);
  assert.match(j.message, /cannot be verified/);
});

test('row-count: a remote response without counts fails; only a --local rehearsal may skip the check', () => {
  const noCounts = JSON.stringify([{ results: [], success: true, meta: { duration: 1 } }]);
  assert.equal(evaluateApplyOutput({ filename: 'f', sql: SEED_0033, stdout: noCounts }).judgement.ok, false);
  assert.equal(evaluateApplyOutput({ filename: 'f', sql: SEED_0033, stdout: noCounts, local: true }).judgement.ok, true);
  // a local response that DOES carry a zero count is still judged
  assert.equal(evaluateApplyOutput({ filename: 'f', sql: SEED_0033, stdout: fileResponse(0), local: true }).judgement.ok, false);
});

test('D1 failure is not judged and not recorded', () => {
  const { summary, judgement } = evaluateApplyOutput({ filename: 'f', sql: SEED_0033, stdout: errorResponse('CHECK constraint failed: category') });
  assert.equal(judgement, null);
  assert.equal(summary.success, false);
  assert.match(summary.error, /CHECK constraint failed/);
});

// ── containsInsert ──────────────────────────────────────────────────────────

test('containsInsert sees INSERT / REPLACE INTO, ignores comments, strings and replace()', () => {
  assert.equal(containsInsert('insert into t values (1);'), true);
  assert.equal(containsInsert('REPLACE INTO t VALUES (1);'), true);
  assert.equal(containsInsert('-- INSERT later\nCREATE TABLE t (a);'), false);
  assert.equal(containsInsert('/* INSERT */ CREATE TABLE t (a);'), false);
  assert.equal(containsInsert("UPDATE t SET a = 'INSERT INTO x';"), false);
  assert.equal(containsInsert("UPDATE t SET a = replace(a, 'x', 'y');"), false);
  assert.equal(containsInsert("UPDATE t SET a = 'it''s'; INSERT INTO t VALUES (1);"), true);
});

// ── apply decisions ─────────────────────────────────────────────────────────

const DISK = disk([['0116_a.sql', 'h116'], ['0117_b.sql', 'h117'], [LEDGER_FILE, 'h118'], ['0119_c.sql', 'h119']]);
const LEDGER = [rec('0116_a.sql', 'h116'), rec('0117_b.sql', 'h117'), rec(LEDGER_FILE, 'h118')];

test('apply: a new, next file is allowed', () => {
  assert.deepEqual(decideApply({ filename: '0119_c.sql', ledger: LEDGER, diskShas: DISK }), { action: 'apply' });
});

test('apply: already recorded filename is refused', () => {
  const d = decideApply({ filename: '0117_b.sql', ledger: LEDGER, diskShas: DISK });
  assert.equal(d.action, 'refuse');
  assert.match(d.reasons.join('\n'), /0117_b\.sql is already recorded as applied/);
});

test('apply: any recorded file whose checksum changed blocks every apply', () => {
  const edited = new Map(DISK).set('0116_a.sql', 'EDITED');
  const d = decideApply({ filename: '0119_c.sql', ledger: LEDGER, diskShas: edited });
  assert.equal(d.action, 'refuse');
  assert.match(d.reasons.join('\n'), /0116_a\.sql was edited after it was applied .* append-only/);
});

test('apply: a recorded file deleted from disk blocks every apply', () => {
  const gone = new Map(DISK); gone.delete('0116_a.sql');
  const d = decideApply({ filename: '0119_c.sql', ledger: LEDGER, diskShas: gone });
  assert.match(d.reasons.join('\n'), /0116_a\.sql is recorded as applied but no longer exists/);
});

test('apply: reusing a recorded number is refused', () => {
  const d = decideApply({ filename: '0117_other.sql', ledger: LEDGER, diskShas: new Map(DISK).set('0117_other.sql', 'z') });
  assert.match(d.reasons.join('\n'), /number 0117 is already used by 0117_b\.sql/);
});

test('apply: skipping an older unrecorded file is refused', () => {
  const d = decideApply({ filename: '0120_d.sql', ledger: LEDGER, diskShas: new Map(DISK).set('0120_d.sql', 'z') });
  assert.match(d.reasons.join('\n'), /older migrations are not recorded: 0119_c\.sql/);
});

test('apply: missing table → only 0118 may bootstrap', () => {
  assert.deepEqual(decideApply({ filename: LEDGER_FILE, ledger: null, diskShas: DISK }), { action: 'bootstrap' });
  const d = decideApply({ filename: '0119_c.sql', ledger: null, diskShas: DISK });
  assert.equal(d.action, 'refuse');
  assert.match(d.reasons[0], /schema_migrations does not exist — apply the ledger first/);
});

test('apply: non-migration filenames and files outside migrations/ are refused', () => {
  assert.equal(decideApply({ filename: 'notes.sql', ledger: LEDGER, diskShas: DISK }).action, 'refuse');
  assert.equal(decideApply({ filename: '0300_nowhere.sql', ledger: LEDGER, diskShas: DISK }).action, 'refuse');
});

// ── status ──────────────────────────────────────────────────────────────────

test('status: all recorded and matching → no drift', () => {
  const s = computeStatus({ ledger: [...LEDGER, rec('0119_c.sql', 'h119')], diskShas: DISK });
  assert.equal(s.drift.length, 0);
  assert.equal(s.rows.length, 4);
});

test('status: reports CHANGED, UNRECORDED and MISSING-FILE as drift', () => {
  const d = new Map(DISK).set('0116_a.sql', 'EDITED');
  const s = computeStatus({ ledger: [...LEDGER, rec('0099_gone.sql', 'h99')], diskShas: d });
  const states = Object.fromEntries(s.drift.map(r => [r.filename, r.state]));
  assert.deepEqual(states, { '0099_gone.sql': 'MISSING-FILE', '0116_a.sql': 'CHANGED', '0119_c.sql': 'UNRECORDED' });
});

test('missing-table error is recognised from the real wrangler error shape', () => {
  const s = summarizeExecution(parseWranglerJson(errorResponse('no such table: schema_migrations: SQLITE_ERROR [code: 7500]')));
  assert.equal(isMissingLedgerError(s.error), true);
  assert.equal(isMissingLedgerError('no such table: exercises'), false);
});

// ── baseline ────────────────────────────────────────────────────────────────

test('baseline: refuses when the table is missing', () => {
  assert.match(planBaseline({ ledger: null, diskShas: DISK }).refuse, /does not exist/);
});

test('baseline: refuses when anything besides the 0118 bootstrap row is recorded', () => {
  assert.match(planBaseline({ ledger: LEDGER, diskShas: DISK }).refuse, /already has 2 row\(s\) besides/);
});

test('baseline: records every file before 0118, leaves 0118+ for apply', () => {
  const p = planBaseline({ ledger: [rec(LEDGER_FILE, 'h118')], diskShas: DISK });
  assert.equal(p.refuse, undefined);
  assert.deepEqual(p.rows.map(r => r.filename), ['0116_a.sql', '0117_b.sql']);
  assert.ok(p.rows.every(r => r.rows_written === null && r.note === BASELINE_NOTE));
  assert.deepEqual(p.left, ['0119_c.sql']);
});

// ── plumbing ────────────────────────────────────────────────────────────────

test('sha256 / migrationNumber / literals / insert SQL', () => {
  assert.equal(sha256(Buffer.from('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(migrationNumber('0032a_enrich.sql'), 32);
  assert.equal(migrationNumber('baseline.sql'), null);
  assert.equal(sqlLiteral("it's"), "'it''s'");
  assert.equal(sqlLiteral(null), 'NULL');
  const sql = buildInsertSql([{ filename: "0119_o'k.sql", sha256: 'h', rows_written: null, note: null }], { appliedAtMs: 5, appliedBy: 'me' });
  assert.match(sql, /^INSERT INTO schema_migrations \(/);
  assert.doesNotMatch(sql, /OR IGNORE/);
  assert.match(sql, /\('0119_o''k\.sql', 'h', NULL, 5, 'me', NULL\);$/);
});

test('parseWranglerJson tolerates a banner before the JSON', () => {
  assert.deepEqual(parseWranglerJson(' ⛅️ wrangler 4.76.0\n[{"success":true}]'), [{ success: true }]);
});

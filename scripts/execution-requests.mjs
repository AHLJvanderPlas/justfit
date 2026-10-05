// Request-level guard for need C — "log something done elsewhere" (POST /api/execution).
//
// Drives the real onRequestPost / onRequestGet of functions/api/execution.js against
// an in-memory SQLite carrying the production DDL of executions, execution_steps,
// user_progression, user_progression_events (and users), taken verbatim from
// migrations/baseline/1000_schema_core.sql. Logged sessions go through the real
// client path — packages/client-app/src/logSession.js builds the steps,
// apiClient.logSession sends them through a fetch stub — so the payload under test
// is the one the builder sends. No network, no wrangler. Same pattern as
// scripts/plan-override-requests.mjs and scripts/my-sessions-requests.mjs.
//
// Contract (scripts/smoke.sh depends on it): stdout is exactly "OK", or a
// "; "-joined list of failures with a non-zero exit.
//
//   node --no-warnings scripts/execution-requests.mjs
//
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as execution from '../functions/api/execution.js';
import api from '../packages/client-app/src/apiClient.js';
import { loggedStep, parseSetList } from '../packages/client-app/src/logSession.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const rows = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/planner-exercises.json'), 'utf8'));

// ── D1-shaped adapter over node:sqlite ─────────────────────────────────────────
const db = new DatabaseSync(':memory:');
const missing = (e) => /no such table/.test(String(e?.message));
const D1 = {
  prepare(sql) {
    let args = [];
    const stmt = () => { try { return db.prepare(sql); } catch (e) { if (missing(e)) return null; throw e; } };
    return {
      bind(...a) { args = a.map(v => (v === undefined ? null : v)); return this; },
      async first() { const s = stmt(); return s ? (s.get(...args) ?? null) : null; },
      async all() { const s = stmt(); return { results: s ? s.all(...args) : [] }; },
      async run() {
        const s = stmt();
        if (!s) throw new Error(`write to a table this harness does not model: ${sql.slice(0, 60)}`);
        const r = s.run(...args);
        return { success: true, meta: { changes: Number(r.changes) } };
      },
    };
  },
  async batch(stmts) { const out = []; for (const s of stmts) out.push(await s.run()); return out; },
};

// ── Production DDL, verbatim from the baseline ────────────────────────────────
const baseline = fs.readFileSync(path.join(root, 'migrations/baseline/1000_schema_core.sql'), 'utf8');
function ddl(table) {
  const m = new RegExp(`CREATE TABLE "?${table}"? \\(`).exec(baseline);
  if (!m) throw new Error(`baseline has no CREATE TABLE ${table}`);
  const end = baseline.indexOf(';\n', m.index);
  return baseline.slice(m.index, end + 1);
}
const indexes = (table) => (baseline.match(new RegExp(`CREATE (?:UNIQUE )?INDEX [^;]+ON ${table}\\([^;]+;`, 'g')) ?? []).join('\n');

// exercises is modelled minimally (as in the sibling harnesses); FK parents of the
// production exercises row (gyms) are out of scope here.
db.exec(`CREATE TABLE exercises (
  id TEXT PRIMARY KEY, slug TEXT, name TEXT, category TEXT, tags_json TEXT,
  primary_muscles_json TEXT, is_active INTEGER NOT NULL DEFAULT 1) STRICT;`);
for (const t of ['users', 'executions', 'execution_steps', 'user_progression', 'user_progression_events']) {
  db.exec(ddl(t));
  db.exec(indexes(t));
}

const insEx = db.prepare('INSERT INTO exercises (id, slug, name, category, tags_json, primary_muscles_json) VALUES (?,?,?,?,?,?)');
const idOf = {};
rows.forEach((r, i) => { insEx.run('ex' + i, r.slug, r.name, r.category, r.tags_json, r.primary_muscles_json ?? '[]'); idOf[r.slug] = 'ex' + i; });
for (const s of ['push-up', 'incline-push-up', 'sit-up']) if (!idOf[s]) throw new Error(`fixture has no exercise "${s}"`);

const T0 = Date.now();
for (const id of ['alice', 'bob', 'carol', 'dave', 'erin']) {
  db.prepare('INSERT INTO users (id, created_at_ms, updated_at_ms) VALUES (?,?,?)').run(id, T0, T0);
}

// ── Real session cookies, signed the way _shared/auth.js verifies them ────────
const SECRET = 'execution-guard-secret';
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
async function cookieFor(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 3600 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`)));
  return `__Host-jf_session=${encodeURIComponent(`${header}.${body}.${sig}`)}`;
}
const env = { DB: D1, JWT_SECRET: SECRET };

async function call(handler, user, { method = 'GET', query = '', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (user) headers.Cookie = await cookieFor(user);
  const req = new Request(`https://app.test/api/execution${query}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const res = await handler({ request: req, env });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const POST = (user, body) => call(execution.onRequestPost, user, { method: 'POST', body });
const HISTORY = (user) => call(execution.onRequestGet, user, { query: '?limit=30' });

// The builder's path: logSession.loggedStep → apiClient.logSession → onRequestPost.
async function logAs(user, date, opts) {
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url, 'https://app.test');
    if (u.pathname !== '/api/execution' || init.method !== 'POST') throw new Error(`logSession called ${init.method} ${u.pathname}`);
    const req = new Request(u, { ...init, headers: { ...(init.headers ?? {}), Cookie: await cookieFor(user) } });
    return execution.onRequestPost({ request: req, env });
  };
  try { return await api.logSession(date, opts); } finally { globalThis.fetch = orig; }
}

const DAY = 86_400_000;
const today = new Date(T0).toISOString().slice(0, 10);
const dayOff = (n) => new Date(T0 - n * DAY).toISOString().slice(0, 10);
const events = (user) => db.prepare('SELECT * FROM user_progression_events WHERE user_id = ? ORDER BY rowid').all(user);
const execRow = (id) => db.prepare('SELECT * FROM executions WHERE id = ?').get(id);
const stepsOf = (id) => db.prepare('SELECT * FROM execution_steps WHERE execution_id = ? ORDER BY step_index').all(id)
  .map(s => ({ ...s, actual: JSON.parse(s.actual_json), prescribed: JSON.parse(s.prescribed_json) }));
const pushStep = (sets = 3) => ({ exercise_id: idOf['push-up'], prescribed: { sets, reps: 10, rest_sec: 45 },
  actual: { sets_completed: sets, reps_per_set: Array(sets).fill(10), rest_taken_seconds: [], skipped: false } });

const errs = [];
const check = (cond, msg) => { if (!cond) errs.push(msg); };

try {

// 1. Today still works, exactly as before: the in-app payload, progression credited now.
{
  const before = Date.now();
  const r = await POST('alice', { date: today, day_plan_id: null, session_type: 'workout', duration_sec: 900, perceived_exertion: 5, steps: [pushStep(3)] });
  const after = Date.now();
  check(r.status === 200 && r.body?.ok && r.body.execution_id, `a session for today must save, got ${r.status} ${JSON.stringify(r.body)}`);
  const row = r.body?.execution_id ? execRow(r.body.execution_id) : null;
  check(row?.date === today && row?.execution_type === 'workout' && row?.status === 'completed', `today's row is wrong: ${JSON.stringify(row)}`);
  const ev = events('alice')[0];
  check(ev && ev.created_at_ms >= before && ev.created_at_ms <= after, `today's progression event must be stamped now, got ${ev?.created_at_ms}`);
  const stim = ev ? JSON.parse(ev.stimulus_json) : {};
  // 3 completed push-up sets must earn push power — the request carries `actual` as an object.
  check(stim.push?.power > 0, `3 completed push-up sets earned no push stimulus: ${ev?.stimulus_json}`);
}

// 2. The window: today−6 saves; today−7 and tomorrow are 400 with the window; nothing written.
{
  const win = { from: dayOff(6), to: today };
  const ok6 = await POST('bob', { date: dayOff(6), session_type: 'logged', steps: [pushStep(2)] });
  check(ok6.status === 200 && ok6.body?.ok, `today−6 (${dayOff(6)}) must save, got ${ok6.status} ${JSON.stringify(ok6.body)}`);
  const n = db.prepare('SELECT COUNT(*) AS n FROM executions').get().n;
  const old = await POST('bob', { date: dayOff(7), session_type: 'logged', steps: [pushStep(2)] });
  check(old.status === 400 && old.body?.error === 'date_out_of_range' && old.body.window?.from === win.from && old.body.window?.to === win.to,
    `today−7 (${dayOff(7)}) must be 400 date_out_of_range with window ${JSON.stringify(win)}, got ${old.status} ${JSON.stringify(old.body)}`);
  const fut = await POST('bob', { date: dayOff(-1), session_type: 'logged', steps: [pushStep(2)] });
  check(fut.status === 400 && fut.body?.error === 'date_out_of_range', `tomorrow (${dayOff(-1)}) must be 400 date_out_of_range, got ${fut.status} ${JSON.stringify(fut.body)}`);
  const junk = await POST('bob', { date: '2026-02-31', session_type: 'logged', steps: [] });
  check(junk.status === 400, `an impossible date must be 400, got ${junk.status}`);
  check(db.prepare('SELECT COUNT(*) AS n FROM executions').get().n === n, 'a rejected date wrote an execution');
}

// 3. A backfilled session is credited on ITS day, and does not wind a newer stimulus clock back.
{
  const d3 = dayOff(3);
  const r = await logAs('carol', d3, { steps: [loggedStep({ exerciseId: idOf['push-up'], setsText: '10, 10, 8', restSec: 60 })] });
  check(r.status === 200 && r.data?.ok, `a session logged for ${d3} must save, got ${r.status} ${JSON.stringify(r.data)}`);
  const ev = events('carol').at(-1);
  const evDay = ev ? new Date(ev.created_at_ms).toISOString().slice(0, 10) : null;
  check(evDay === d3, `the progression event of a session logged for ${d3} is dated ${evDay} — credit must fall on the session's day`);
  const scores = ev ? JSON.parse(ev.scores_after_json) : {};
  check(new Date(scores.push?.last_power_stimulus_at_ms ?? 0).toISOString().slice(0, 10) === d3,
    `the push stimulus clock of a backfilled session must read ${d3}, got ${scores.push?.last_power_stimulus_at_ms}`);
  const row = execRow(r.data?.execution_id);
  check(row?.date === d3 && row?.execution_type === 'logged', `the logged row must carry date ${d3} and type 'logged', got ${row?.date}/${row?.execution_type}`);

  // Train today, then log yesterday: the push clock stays at today.
  await POST('dave', { date: today, session_type: 'workout', steps: [pushStep(3)] });
  const todayClock = JSON.parse(events('dave').at(-1).scores_after_json).push.last_power_stimulus_at_ms;
  await logAs('dave', dayOff(1), { steps: [loggedStep({ exerciseId: idOf['push-up'], setsText: '5,5' })] });
  const clock = JSON.parse(db.prepare('SELECT scores_json FROM user_progression WHERE user_id = ?').get('dave').scores_json).push.last_power_stimulus_at_ms;
  check(clock === todayClock, `logging yesterday moved today's push stimulus clock back: ${todayClock} → ${clock}`);
}

// 4. A skipped step stays in the record and adds nothing.
{
  const r = await logAs('erin', dayOff(1), { steps: [loggedStep({ exerciseId: idOf['push-up'], setsText: '10,10,10', skipped: true })] });
  check(r.status === 200, `a session of one skipped step must save, got ${r.status}`);
  const ev = events('erin').at(-1);
  const stim = ev ? JSON.parse(ev.stimulus_json) : null;
  check(ev && !(stim?.push?.power > 0) && !(stim?.push?.endurance > 0), `a skipped push-up step added stimulus: ${ev?.stimulus_json}`);
  const st = r.data?.execution_id ? stepsOf(r.data.execution_id) : [];
  check(st.length === 1 && st[0].actual.skipped === true && st[0].actual.sets_completed === 0, `the skipped step was not kept as skipped: ${JSON.stringify(st[0]?.actual)}`);
  // The flag itself decides, not an empty set count: a step marked skipped that still
  // carries sets (abandoned mid-exercise in the app) earns nothing either.
  const flagged = { ...pushStep(3), actual: { ...pushStep(3).actual, skipped: true } };
  const r2 = await POST('erin', { date: today, session_type: 'workout', steps: [flagged] });
  const stim2 = JSON.parse(events('erin').at(-1)?.stimulus_json ?? '{}');
  check(r2.status === 200 && !(stim2.push?.power > 0), `a step with skipped:true and 3 sets_completed added push stimulus: ${JSON.stringify(stim2)}`);
}

// 5. The owner's session, verbatim, and its read-back — reps, rest, skip, note, RPE.
{
  const note = 'Buikspieren beurs, sit-ups overgeslagen.';
  check(JSON.stringify(parseSetList('3x3, 2x4').values) === '[3,3,3,4,4]', `"3x3, 2x4" must read as [3,3,3,4,4], got ${JSON.stringify(parseSetList('3x3, 2x4'))}`);
  const steps = [
    loggedStep({ exerciseId: idOf['push-up'], setsText: '3, 3, 3, 4, 4', restSec: 60 }),
    loggedStep({ exerciseId: idOf['incline-push-up'], setsText: '12, 12, 12', restSec: 60 }),
    loggedStep({ exerciseId: idOf['sit-up'], setsText: '', skipped: true }),
  ];
  const r = await logAs('alice', dayOff(1), { steps, perceivedExertion: 5, notes: `  ${note}  ` });
  check(r.status === 200 && r.data?.ok, `the owner's session must save, got ${r.status} ${JSON.stringify(r.data)}`);
  const id = r.data?.execution_id;
  const st = id ? stepsOf(id) : [];
  check(st.length === 3, `the owner's session must keep all three exercises, got ${st.length}`);
  const [pu, inc, sit] = st;
  check(pu?.exercise_id === idOf['push-up'] && JSON.stringify(pu.actual.reps_per_set) === '[3,3,3,4,4]' && pu.actual.sets_completed === 5,
    `push-ups read back as ${JSON.stringify(pu?.actual)}`);
  check(JSON.stringify(pu?.actual.rest_taken_seconds) === '[60,60,60,60]', `push-up rest must be [60,60,60,60], got ${JSON.stringify(pu?.actual.rest_taken_seconds)}`);
  check(inc?.exercise_id === idOf['incline-push-up'] && JSON.stringify(inc.actual.reps_per_set) === '[12,12,12]' && inc.actual.sets_completed === 3,
    `incline push-ups read back as ${JSON.stringify(inc?.actual)}`);
  check(sit?.exercise_id === idOf['sit-up'] && sit.actual.skipped === true && sit.actual.sets_completed === 0, `sit-ups must read back skipped, got ${JSON.stringify(sit?.actual)}`);
  check(st.every(s => JSON.stringify(s.prescribed) === '{}'), `a logged step's prescribed must be {}, got ${st.map(s => s.prescribed_json).join(' | ')}`);
  const keys = 'sets_completed,reps_per_set,rest_taken_seconds,target_adjusted,target_original,target_final,adjustment_direction,exercise_substituted,original_exercise_id,substitute_exercise_id,skipped,completed_at_ms';
  check(st.every(s => Object.keys(s.actual).join(',') === keys), `a logged step's actual is not the stepsActualRef shape: ${Object.keys(pu?.actual ?? {}).join(',')}`);
  const row = execRow(id);
  check(row?.notes === note, `notes must round-trip (trimmed), got ${JSON.stringify(row?.notes)}`);
  check(row?.perceived_exertion === 5, `RPE must be stored, got ${row?.perceived_exertion}`);
  const h = await HISTORY('alice');
  const e = h.body?.executions?.find(x => x.id === id);
  check(e?.execution_type === 'logged' && e?.notes === note && e?.date === dayOff(1), `history must return the logged session with its note, got ${JSON.stringify(e)?.slice(0, 200)}`);
  check(e?.steps?.length === 3 && JSON.parse(e.steps[2].actual_json).skipped === true, 'history lost the skipped sit-up');
  const ev = events('alice').at(-1);
  check(JSON.parse(ev?.stimulus_json ?? '{}').push?.power > 0, `the owner's push-ups earned no push stimulus: ${ev?.stimulus_json}`);
}

} catch (e) {
  errs.push(`harness aborted: ${e?.message ?? e}`);
}

process.stdout.write(errs.length ? errs.join('; ') : 'OK');
if (errs.length) process.exitCode = 1;

// Request-level guard for W4.3 — saved trainings ("Mijn trainingen").
//
// Drives the real handlers in functions/api/my-sessions.js against an
// in-memory SQLite that carries the table exactly as migration 0117 creates it
// (the migration file itself is executed), and drives the real client function
// apiClient.useMySession through a fetch stub into the real POST /api/plan —
// so "using a template" is proven to be the W4.1 custom_steps contract, not a
// second install path. No network, no wrangler. Same pattern as
// scripts/plan-override-requests.mjs.
//
// Contract (scripts/smoke.sh depends on it): stdout is exactly "OK", or a
// "; "-joined list of failures with a non-zero exit.
//
//   node --no-warnings scripts/my-sessions-requests.mjs
//
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as mySessions from '../functions/api/my-sessions.js';
import { onRequestPost as planPost, CUSTOM_STEP_LIMITS } from '../functions/api/plan.js';
import api from '../packages/client-app/src/apiClient.js';
import { estimateMins } from '../packages/client-app/src/planUtils.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const rows = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/planner-exercises.json'), 'utf8'));
const idOf = (slug) => {
  const i = rows.findIndex(r => r.slug === slug);
  if (i < 0) throw new Error(`fixture has no exercise "${slug}"`);
  return 'ex' + i;
};

// ── D1-shaped adapter over node:sqlite (run() reports meta.changes like D1) ──
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
};

db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, token_invalidated_at_ms INTEGER) STRICT;
  CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY, units TEXT, training_goal TEXT, experience_level TEXT,
    intensity_pref INTEGER, session_duration_min INTEGER, days_per_week_target INTEGER,
    preferences_json TEXT, sex TEXT, weight_kg REAL, height_cm REAL) STRICT;
  CREATE TABLE exercises (
    id TEXT PRIMARY KEY, slug TEXT, name TEXT, category TEXT, tags_json TEXT,
    equipment_required_json TEXT, metrics_json TEXT, media_json TEXT, instructions_json TEXT,
    alternatives_json TEXT, primary_muscles_json TEXT, secondary_muscles_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1, gym_id TEXT, instructions_markdown TEXT) STRICT;
  CREATE TABLE day_plans (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
    plan_status TEXT NOT NULL DEFAULT 'draft' CHECK (plan_status IN ('draft','final','skipped','archived')),
    plan_json TEXT NOT NULL, generated_by TEXT NOT NULL DEFAULT 'engine', engine_version TEXT, seed TEXT,
    created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL,
    CHECK (json_valid(plan_json))) STRICT;
  CREATE UNIQUE INDEX idx_day_plans_user_date ON day_plans(user_id, date);
`);
// The table under test comes from the migration itself, so a broken 0117 fails here.
db.exec(fs.readFileSync(path.join(root, 'migrations/0117_user_session_templates.sql'), 'utf8'));

const insEx = db.prepare(`INSERT INTO exercises (id, slug, name, category, tags_json, equipment_required_json, metrics_json,
  primary_muscles_json, alternatives_json, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)`);
rows.forEach((r, i) => insEx.run('ex' + i, r.slug, r.name, r.category, r.tags_json, r.equipment_required_json,
  r.metrics_json, r.primary_muscles_json ?? '[]', r.alternatives_json ?? null, 1));
insEx.run('ex-retired', 'retired-move', 'Retired move', 'strength', '[]', '["none"]', '{"supports":["reps"]}', '[]', null, 0);

const DATE = '2026-10-05';
for (const id of ['alice', 'bob', 'carol']) {
  db.prepare('INSERT INTO users (id) VALUES (?)').run(id);
  db.prepare(`INSERT INTO user_preferences (user_id, training_goal, experience_level, session_duration_min,
    preferences_json, sex, weight_kg, height_cm) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, 'health', 'intermediate', 40, JSON.stringify({ primary_intent: 'general', available_equipment: ['none'] }), 'male', 75, 178);
}

// ── Real session cookies, signed the way _shared/auth.js verifies them ────────
const SECRET = 'my-sessions-guard-secret';
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
  const req = new Request(`https://app.test/api/my-sessions${query}`, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body),
  });
  const res = await handler({ request: req, env });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}
const GET = (user) => call(mySessions.onRequestGet, user);
const POST = (user, body) => call(mySessions.onRequestPost, user, { method: 'POST', body });
const DEL = (user, id) => call(mySessions.onRequestDelete, user, { method: 'DELETE', query: `?id=${encodeURIComponent(id)}` });
const count = (user) => db.prepare('SELECT COUNT(*) AS n FROM user_session_templates WHERE user_id = ?').get(user).n;

// ── Assertions ───────────────────────────────────────────────────────────────
const errs = [];
const check = (cond, msg) => { if (!cond) errs.push(msg); };
const S = (slug, extra = {}) => ({ exercise_id: idOf(slug), ...extra });

// A throw (a broken handler, a missing row) is a failure with a message, not a stack trace.
try {

// 1. No session, no access — all three verbs.
{
  const g = await GET(null);
  const p = await POST(null, { name: 'x', steps: [S('push-up')] });
  const d = await DEL(null, 'whatever');
  check(g.status === 401 && p.status === 401 && d.status === 401,
    `without a session every verb must be 401, got GET ${g.status} / POST ${p.status} / DELETE ${d.status}`);
  check(count('alice') + count('bob') === 0, 'an unauthenticated POST wrote a template');
}

// 2. Never trust the client: unknown and retired ids are 400, nothing is written.
{
  const r1 = await POST('alice', { name: 'Hotel', steps: [S('push-up'), { exercise_id: 'does-not-exist' }] });
  check(r1.status === 400 && r1.body?.error === 'unknown_exercise' && r1.body.unknown_exercise_ids?.[0] === 'does-not-exist',
    `an unknown exercise_id must be 400 unknown_exercise, got ${r1.status} ${JSON.stringify(r1.body)}`);
  const r2 = await POST('alice', { name: 'Hotel', steps: [{ exercise_id: 'ex-retired' }] });
  check(r2.status === 400 && r2.body?.error === 'unknown_exercise', `an inactive exercise must be rejected like an unknown one, got ${r2.status}`);
  const r3 = await POST('alice', { name: '', steps: [S('push-up')] });
  const r4 = await POST('alice', { name: 'x'.repeat(61), steps: [S('push-up')] });
  check(r3.status === 400 && r4.status === 400, `name must be 1–60 characters, got ${r3.status}/${r4.status}`);
  const r5 = await POST('alice', { name: 'Big', steps: Array.from({ length: 21 }, () => S('push-up')) });
  check(r5.status === 400 && r5.body?.error === 'invalid_steps', `more than 20 steps must be 400, got ${r5.status}`);
  check(count('alice') === 0, 'a rejected template was written');
}

// 3. Create: stored clamped, estimated like the client estimates it.
let aliceTpl;
{
  const L = CUSTOM_STEP_LIMITS;
  const steps = [S('push-up', { sets: 50, target_reps: 500, rest_sec: 9999 }), S('plank', { sets: 2, target_duration_sec: 45, rest_sec: 30 }), S('dead-bug')];
  const r = await POST('alice', { name: '  Hotelbank  ', steps });
  aliceTpl = r.body?.template;
  check(r.status === 200 && aliceTpl?.id && aliceTpl.name === 'Hotelbank', `a valid template must save, got ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  const s0 = aliceTpl?.steps?.[0];
  check(s0?.sets === L.sets[1] && s0?.target_reps === L.target_reps[1] && s0?.rest_sec === L.rest_sec[1],
    `out-of-range values were stored raw: ${JSON.stringify(s0)}`);
  check(aliceTpl?.est_minutes === estimateMins({ slot_type: 'main', steps: aliceTpl?.steps ?? [] }),
    `est_minutes ${aliceTpl?.est_minutes} differs from the client's estimateMins ${estimateMins({ slot_type: 'main', steps: aliceTpl?.steps ?? [] })}`);
  const list = await GET('alice');
  check(list.status === 200 && list.body?.templates?.length === 1 && list.body.templates[0].id === aliceTpl?.id,
    `GET must list the user's own template, got ${JSON.stringify(list.body).slice(0, 160)}`);
}

// 4. Another user's template cannot be read, updated or deleted.
{
  const before = db.prepare('SELECT * FROM user_session_templates WHERE id = ?').get(aliceTpl.id);
  const bobList = await GET('bob');
  check(bobList.status === 200 && (bobList.body?.templates ?? []).every(tp => tp.id !== aliceTpl.id),
    'GET leaked another user\'s template');
  const up = await POST('bob', { id: aliceTpl.id, name: 'Stolen', steps: [S('sit-up')] });
  check(up.status === 404, `updating another user's template must be 404, got ${up.status}`);
  const del = await DEL('bob', aliceTpl.id);
  check(del.status === 404, `deleting another user's template must be 404, got ${del.status}`);
  const after = db.prepare('SELECT * FROM user_session_templates WHERE id = ?').get(aliceTpl.id);
  check(after && after.name === before.name && after.steps_json === before.steps_json && after.user_id === 'alice',
    `another user changed or removed the template: ${JSON.stringify(after)}`);
  check(count('bob') === 0, 'a cross-user update created a row instead of failing');
  // The owner can update.
  const own = await POST('alice', { id: aliceTpl.id, name: 'Hotelbank 2', steps: [S('sit-up'), S('push-up')] });
  check(own.status === 200 && own.body?.template?.name === 'Hotelbank 2' && own.body.template.steps.length === 2,
    `the owner could not update their template: ${own.status}`);
  aliceTpl = own.body?.template ?? aliceTpl;
}

// 5. Max 30 per user — atomic with the insert; updates still work at the cap.
{
  for (let i = count('carol'); i < mySessions.MAX_TEMPLATES; i++) {
    const r = await POST('carol', { name: `T${i}`, steps: [S('push-up')] });
    if (r.status !== 200) { errs.push(`template ${i + 1} of ${mySessions.MAX_TEMPLATES} was refused: ${r.status}`); break; }
  }
  const over = await POST('carol', { name: 'one too many', steps: [S('push-up')] });
  check(over.status === 400 && over.body?.error === 'template_limit', `template 31 must be 400 template_limit, got ${over.status} ${JSON.stringify(over.body)}`);
  check(count('carol') === 30, `the cap is 30, carol has ${count('carol')}`);
  const anyId = db.prepare('SELECT id FROM user_session_templates WHERE user_id = ? LIMIT 1').get('carol').id;
  const upd = await POST('carol', { id: anyId, name: 'renamed at cap', steps: [S('push-up')] });
  check(upd.status === 200, `updating at the cap must still work, got ${upd.status}`);
}

// 6. Delete: 204 for the owner, 404 after.
{
  const tmp = await POST('alice', { name: 'Tmp', steps: [S('push-up')] });
  const d1 = await DEL('alice', tmp.body.template.id);
  const d2 = await DEL('alice', tmp.body.template.id);
  check(d1.status === 204 && d2.status === 404, `delete must be 204 then 404, got ${d1.status} / ${d2.status}`);
}

// 7. useMySession is the W4.1 contract: a user-authored plan with the template's exercises, in order.
{
  const orig = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(url, 'https://app.test');
    if (u.pathname !== '/api/plan') throw new Error(`useMySession called ${u.pathname}, not POST /api/plan`);
    const req = new Request(u, { ...init, headers: { ...(init.headers ?? {}), Cookie: await cookieFor('alice') } });
    return planPost({ request: req, env });
  };
  try {
    const { templates } = (await GET('alice')).body;
    const tpl = templates.find(tp => tp.id === aliceTpl.id);
    const r = await api.useMySession(tpl, DATE);
    const row = db.prepare('SELECT * FROM day_plans WHERE user_id = ? AND date = ?').get('alice', DATE);
    const stored = row ? JSON.parse(row.plan_json) : null;
    check(r.status === 200 && r.data?.ok && r.data.saved === true, `useMySession must install today's plan, got ${r.status} ${JSON.stringify(r.data).slice(0, 160)}`);
    check(row?.generated_by === 'user', `a used template must be stored as generated_by='user', got ${row?.generated_by}`);
    const want = tpl.steps.map(s => String(s.exercise_id)).join(',');
    const got = (stored?.steps ?? []).map(s => String(s.exercise_id)).join(',');
    check(got === want, `the installed plan's exercises differ from the template: want ${want}, got ${got}`);
    check(stored?.session_name === tpl.name, `the installed plan is not named after the template: ${stored?.session_name}`);
  } finally {
    globalThis.fetch = orig;
  }
}

} catch (e) {
  errs.push(`harness aborted: ${e?.message ?? e}`);
}

process.stdout.write(errs.length ? errs.join('; ') : 'OK');
if (errs.length) process.exitCode = 1;

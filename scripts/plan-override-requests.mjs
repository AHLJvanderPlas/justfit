// Request-level guard for the user override (Wave 4: W4.1 + W4.4).
//
// planner-behaviour.mjs proves what the PLANNER does with custom steps and pins.
// It cannot prove what the ENDPOINT does: that a 400 is a 400, that the upsert
// really rewrites generated_by, that a user-authored plan survives the next
// automatic regeneration. Those are database facts, so this drives the real
// onRequestPost from functions/api/plan.js against an in-memory SQLite that
// carries the production day_plans DDL (STRICT, json_valid, the unique
// (user_id, date) index the upsert depends on). No network, no wrangler.
//
// Contract (scripts/smoke.sh depends on it): stdout is exactly "OK", or a
// "; "-joined list of failures with a non-zero exit.
//
//   node --no-warnings scripts/plan-override-requests.mjs
//
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequestPost, CUSTOM_STEP_LIMITS } from '../functions/api/plan.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const rows = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/planner-exercises.json'), 'utf8'));
const idOf = (slug) => {
  const i = rows.findIndex(r => r.slug === slug);
  if (i < 0) throw new Error(`fixture has no exercise "${slug}"`);
  return 'ex' + i;
};

// ── A D1-shaped adapter over node:sqlite ─────────────────────────────────────
// Tables the planner reads but this guard does not care about (cycling,
// programmes, executions, gyms …) are simply absent: a read of a missing table
// answers "nothing", exactly as an empty table would. A WRITE to one throws, so
// the harness cannot pass by writing somewhere it never checks.
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
      async run() { const s = stmt(); if (!s) throw new Error(`write to a table this harness does not model: ${sql.slice(0, 60)}`); s.run(...args); return { success: true }; },
    };
  },
};

db.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, token_invalidated_at_ms INTEGER) STRICT;
  CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY, units TEXT, training_goal TEXT, experience_level TEXT,
    intensity_pref INTEGER, session_duration_min INTEGER, days_per_week_target INTEGER,
    preferences_json TEXT, sex TEXT, weight_kg REAL, height_cm REAL) STRICT;
  CREATE TABLE entitlements (id TEXT PRIMARY KEY, user_id TEXT, status TEXT, ends_at_ms INTEGER) STRICT;
  CREATE TABLE cycle_profile (
    user_id TEXT PRIMARY KEY, tracking_mode TEXT, cycle_length_days INTEGER, last_period_start TEXT,
    mode TEXT, pregnancy_due_date TEXT, postnatal_birth_date TEXT, postnatal_birth_type TEXT,
    postnatal_cleared_for_exercise INTEGER) STRICT;
  CREATE TABLE exercises (
    id TEXT PRIMARY KEY, slug TEXT, name TEXT, category TEXT, tags_json TEXT,
    equipment_required_json TEXT, metrics_json TEXT, media_json TEXT, instructions_json TEXT,
    alternatives_json TEXT, primary_muscles_json TEXT, secondary_muscles_json TEXT,
    is_active INTEGER NOT NULL DEFAULT 1, gym_id TEXT, instructions_markdown TEXT) STRICT;
  -- Verbatim shape of migrations/baseline/1000_schema_core.sql (FK omitted).
  CREATE TABLE day_plans (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL, date TEXT NOT NULL,
    plan_status TEXT NOT NULL DEFAULT 'draft' CHECK (plan_status IN ('draft','final','skipped','archived')),
    plan_json TEXT NOT NULL, generated_by TEXT NOT NULL DEFAULT 'engine', engine_version TEXT, seed TEXT,
    created_at_ms INTEGER NOT NULL, updated_at_ms INTEGER NOT NULL,
    CHECK (json_valid(plan_json))) STRICT;
  CREATE UNIQUE INDEX idx_day_plans_user_date ON day_plans(user_id, date);
`);
const insEx = db.prepare(`INSERT INTO exercises (id, slug, name, category, tags_json, equipment_required_json, metrics_json,
  primary_muscles_json, alternatives_json, is_active) VALUES (?,?,?,?,?,?,?,?,?,?)`);
rows.forEach((r, i) => insEx.run('ex' + i, r.slug, r.name, r.category, r.tags_json, r.equipment_required_json,
  r.metrics_json, r.primary_muscles_json ?? '[]', r.alternatives_json ?? null, 1));
insEx.run('ex-retired', 'retired-move', 'Retired move', 'strength', '[]', '["none"]', '{"supports":["reps"]}', '[]', null, 0);
// A gym-private row (gym_id set). No gyms/gym_memberships tables exist in this
// harness, so NOBODY is a member here: the row must be invisible to the planner,
// to pins and to custom_steps. Only the base query's `gym_id IS NULL` keeps it out.
db.prepare(`INSERT INTO exercises (id, slug, name, category, tags_json, equipment_required_json, metrics_json,
  primary_muscles_json, alternatives_json, is_active, gym_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  .run('ex-gym-private', 'gym-private-press', 'Gym private press', 'strength', '["strength"]', '["none"]',
       '{"supports":["reps"]}', '["chest"]', null, 1, 'gym-someone-else');

const DATE = '2026-10-05';
const users = {
  pro:  { goal: 'strength' },
  free: { goal: 'health' },
  preg: { goal: 'health', sex: 'female' },
  // DCP switched on, never measured → R598 is due (F8 item 6).
  dcp:  { goal: 'health', prefs: { military_coach: { active: false, dcp: { enabled: true, bias_enabled: true, birth_year: 1989 } } } },
  // MANUAL_TRAINING_DESIGN phase 1 — "als extra" (block 10).
  xfree: { goal: 'health' },
  xnone: { goal: 'health' },
  pain:  { goal: 'health' },
};
for (const [id, u] of Object.entries(users)) {
  db.prepare('INSERT INTO users (id) VALUES (?)').run(id);
  db.prepare(`INSERT INTO user_preferences (user_id, training_goal, experience_level, session_duration_min,
    preferences_json, sex, weight_kg, height_cm) VALUES (?,?,?,?,?,?,?,?)`)
    .run(id, u.goal, 'intermediate', 40, JSON.stringify({ primary_intent: 'general', available_equipment: ['none'], ...(u.prefs ?? {}) }),
      u.sex ?? 'male', 75, 178);
}
db.prepare(`INSERT INTO entitlements VALUES ('ent-pro','pro','active',?)`).run(Date.now() + 86400000 * 30);
// Due date 140 days after DATE → pregnancy week 20, trimester 2.
const due = new Date(Date.parse(DATE + 'T12:00:00Z') + 140 * 86400000).toISOString().slice(0, 10);
db.prepare(`INSERT INTO cycle_profile (user_id, mode, pregnancy_due_date) VALUES ('preg','pregnant',?)`).run(due);

// ── Real session cookies, signed the way _shared/auth.js verifies them ────────
const SECRET = 'override-guard-secret';
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
async function cookieFor(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + 3600 }));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${header}.${body}`)));
  return `__Host-jf_session=${encodeURIComponent(`${header}.${body}.${sig}`)}`;
}
const env = { DB: D1, JWT_SECRET: SECRET };
async function post(user, payload) {
  const req = new Request('https://app.test/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: await cookieFor(user) },
    body: JSON.stringify({ date: DATE, ...payload }),
  });
  const res = await onRequestPost({ request: req, env });
  return { status: res.status, body: await res.json() };
}
const row = (user) => db.prepare('SELECT * FROM day_plans WHERE user_id = ? AND date = ?').get(user, DATE) ?? null;
const stored = (user) => { const r = row(user); return r ? JSON.parse(r.plan_json) : null; };

// ── Assertions ───────────────────────────────────────────────────────────────
const errs = [];
const check = (cond, msg) => { if (!cond) errs.push(msg); };
const S = (slug, extra = {}) => ({ exercise_id: idOf(slug), ...extra });

// 1. Never trust the client: unknown and retired ids are 400, nothing is written.
{
  const r1 = await post('pro', { custom_steps: [S('push-up'), { exercise_id: 'does-not-exist' }] });
  check(r1.status === 400 && r1.body.error === 'unknown_exercise' && r1.body.unknown_exercise_ids?.[0] === 'does-not-exist',
    `unknown exercise_id must be 400 unknown_exercise, got ${r1.status} ${JSON.stringify(r1.body)}`);
  const r2 = await post('pro', { custom_steps: [{ exercise_id: 'ex-retired' }] });
  check(r2.status === 400, `an inactive exercise must be rejected like an unknown one, got ${r2.status}`);
  const r3 = await post('pro', { custom_steps: Array.from({ length: 21 }, () => S('push-up')) });
  check(r3.status === 400, `more than 20 custom steps must be 400, got ${r3.status}`);
  const r4 = await post('pro', { custom_steps: [S('push-up')], adapt_mode: true });
  check(r4.status === 400, `custom_steps with adapt_mode must be 400, got ${r4.status}`);
  check(row('pro') === null, 'a rejected custom session wrote a day_plans row');
}

// 2. Persist, clamped, labelled 'user'.
{
  const L = CUSTOM_STEP_LIMITS;
  const r = await post('pro', { session_name: 'Hotelbank', custom_steps: [
    S('push-up', { sets: 50, target_reps: 500, rest_sec: 9999 }),
    S('sit-up', { sets: -3, target_reps: 0 }),
  ] });
  check(r.status === 200 && r.body.saved === true, `a valid custom session must save, got ${r.status} ${JSON.stringify(r.body).slice(0, 200)}`);
  const db1 = row('pro');
  const p = stored('pro');
  check(db1?.generated_by === 'user' && db1?.engine_version === 'user-authored',
    `a custom session must be stored as generated_by=user / engine_version=user-authored, got ${db1?.generated_by}/${db1?.engine_version}`);
  check(p?.steps?.[0]?.sets === L.sets[1] && p.steps[0].target_reps === L.target_reps[1] && p.steps[0].rest_sec === L.rest_sec[1],
    `out-of-range values were stored raw: ${JSON.stringify(p?.steps?.[0] && { sets: p.steps[0].sets, reps: p.steps[0].target_reps, rest: p.steps[0].rest_sec })}`);
  check(p?.steps?.[1]?.sets === L.sets[0] && p.steps[1].target_reps === L.target_reps[0], 'low out-of-range values were stored raw');
  check(p?.authored_by_user === true && p?.session_name === 'Hotelbank', 'stored plan lacks authored_by_user / the chosen name');
}

// 3. The override survives every automatic regeneration.
{
  const before = row('pro').plan_json;
  const auto = await post('pro', {});
  check(auto.body.preserved === true && auto.body.plan?.authored_by_user === true,
    `an auto-generate replaced a user-authored plan: ${JSON.stringify(auto.body).slice(0, 160)}`);
  await post('pro', { checkin: { energy: 3, sleep_hours: 5 } });
  await post('pro', { adapt_mode: true, base_plan: JSON.parse(before), checkin: { energy: 2 } });
  await post('pro', { force_assessment: true });
  check(row('pro').generated_by === 'user' && row('pro').plan_json === before,
    `a regeneration (check-in / adapt / force_assessment) overwrote the user-authored plan (now ${row('pro').generated_by})`);
}

// 4. An explicit replacement works — and relabels the row (the upsert trap).
{
  const r = await post('pro', { replace_user_plan: true });
  check(r.status === 200 && !r.body.preserved, `replace_user_plan must regenerate, got ${JSON.stringify(r.body).slice(0, 120)}`);
  check(row('pro').generated_by === 'engine' && row('pro').engine_version === 'v1.9.0' && !stored('pro').authored_by_user,
    `the engine overwrote a user plan but the row still says generated_by=${row('pro').generated_by}, engine_version=${row('pro').engine_version} — every check on that column now lies`);
  // The adapt path has its own upsert; it must relabel the row too.
  await post('pro', { adapt_mode: true, base_plan: stored('pro'), checkin: { energy: 2 } });
  check(row('pro').generated_by === 'adapt_free',
    `the adapt upsert left generated_by=${row('pro').generated_by} on an adapted plan`);
  await post('pro', { custom_steps: [S('dead-bug')] });
  check(row('pro').generated_by === 'user', `a user plan over an engine row kept generated_by=${row('pro').generated_by}`);
}

// 5. C-G4: a free user may always author their own session, and pin into one.
{
  const eng = await post('free', {});
  check(row('free')?.generated_by === 'engine', `free user's first plan not stored (${eng.status})`);
  const capped = await post('free', {});
  check(capped.body.plan?.capped === true, 'the C-G4 free cap no longer applies to an engine re-roll');
  // F8 — the client saves the workout with api.saveExecution(userId, plan?.id, …).
  check(typeof capped.body.plan?.id === 'string' && capped.body.plan.id === row('free')?.id,
    `a capped plan must carry the stored row id, got ${capped.body.plan?.id} (row ${row('free')?.id})`);
  // F8 — a check-in adapt is not a re-roll: it scales the SAME session. Before
  // F8 the cap answered first and a free user's check-in did nothing once a plan
  // existed. The base_plan sent is a decoy: the stored session is what is adapted.
  const engineIds = stored('free').steps.map(st => st.exercise_id).join(',');
  const adapted = await post('free', { adapt_mode: true, checkin: { energy: 2 },
    base_plan: { session_name: 'Decoy', steps: [S('burpee', { sets: 9, target_reps: 99 })] } });
  check(adapted.status === 200 && adapted.body.plan?.capped !== true
    && (adapted.body.plan?.rule_trace ?? []).includes('adapt:free_tier') && row('free')?.generated_by === 'adapt_free',
    `a free user's check-in adapt must not be capped, got ${adapted.status} capped=${adapted.body.plan?.capped} row=${row('free')?.generated_by}`);
  check(adapted.body.plan?.steps?.map(st => st.exercise_id).join(',') === engineIds && adapted.body.plan?.id === row('free')?.id,
    `the adapt must scale the stored session (${engineIds}), got ${adapted.body.plan?.steps?.map(st => st.exercise_id).join(',')}`);
  const mine = await post('free', { custom_steps: [S('push-up')] });
  check(mine.status === 200 && !mine.body.plan?.capped && row('free')?.generated_by === 'user',
    `custom_steps must be exempt from the C-G4 cap, got ${mine.status} capped=${mine.body.plan?.capped} row=${row('free')?.generated_by}`);
  const kept = await post('free', {});
  check(kept.body.preserved === true, 'a free user\'s own session did not survive the next auto-generate');
  // Decided 2026-10-04: pins are exempt from the cap too. Pinning the two
  // exercises your physio gave you is telling the coach what you need, not
  // re-rolling for a nicer plan. replace_user_plan is sent because the row is
  // user-authored at this point; the thing under test is `capped`.
  const pinned = await post('free', { pinned_exercise_ids: [S('push-up').exercise_id], replace_user_plan: true });
  check(pinned.status === 200 && pinned.body.plan?.capped !== true && (pinned.body.plan?.pinned ?? []).length === 1,
    `pins must be exempt from the C-G4 cap, got ${pinned.status} capped=${pinned.body.plan?.capped} pinned=${JSON.stringify(pinned.body.plan?.pinned)}`);
}

// 6. Blocking notes need an explicit acknowledgement; advisory ones never block.
{
  const steps = [S('burpee'), S('glute-bridge'), S('wall-push-up')];
  const r = await post('preg', { custom_steps: steps });
  check(r.status === 409 && r.body.error === 'safety_ack_required', `pregnancy hard contraindication without ack must be 409, got ${r.status}`);
  check((r.body.safety_notes ?? []).some(n => n.code === 'R532' && n.blocking) && (r.body.safety_notes ?? []).some(n => n.code === 'R531' && !n.blocking),
    `409 must carry the notes so the client can ask: ${JSON.stringify(r.body.safety_notes)}`);
  check(row('preg') === null, 'a 409 still wrote the plan');
  const ok = await post('preg', { custom_steps: steps, safety_ack: true });
  const p = stored('preg');
  check(ok.status === 200 && typeof p?.safety_ack_ms === 'number' && p.safety_ack_ms > 0,
    `an acknowledged session must store safety_ack_ms, got ${ok.status} ${p?.safety_ack_ms}`);
  check(p?.steps?.map(s => s.exercise_slug).join(',') === 'burpee,glute-bridge,wall-push-up',
    `the acknowledged session was rewritten: ${p?.steps?.map(s => s.exercise_slug).join(',')}`);
}

// 7. W4.4 — pins: validated, engine-built, labelled engine, listed in the plan.
{
  const bad = await post('pro', { pinned_exercise_ids: ['nope'], replace_user_plan: true });
  check(bad.status === 400, `an unknown pin must be 400, got ${bad.status}`);
  const four = await post('pro', { pinned_exercise_ids: ['ex1', 'ex2', 'ex3', 'ex4'], replace_user_plan: true });
  check(four.status === 400, `four pins must be 400, got ${four.status}`);
  const r = await post('pro', { pinned_exercise_ids: [idOf('dead-bug')], replace_user_plan: true });
  check(r.status === 200 && (r.body.plan?.pinned ?? []).includes(idOf('dead-bug'))
    && r.body.plan.steps.some(s => s.exercise_slug === 'dead-bug'),
    `a safe pin must be in the session and in plan.pinned: ${JSON.stringify(r.body.plan?.pinned)}`);
  check(row('pro').generated_by === 'engine', `a pinned plan is engine-built and must say so, got ${row('pro').generated_by}`);
}

// 10. The check-in reaches the safety rules IN THE SHAPE THE SHEET SENDS. The sheet
//     nests every toggle inside checkin_json and sends only the numeric columns
//     top-level; the safety stage read top-level only, so on the full-regenerate
//     (Pro) path a general-pain check-in produced a full session instead of rest.
//     The matrix never caught it because its personas hand runPlanner flat
//     objects. This drives the REQUEST, with the sheet's exact payload.
{
  const sheet = { mood: 6, energy: 6, sleep_hours: 7, stress: 4,
                  checkin_json: { pain_level: 3, pain_scope: 'general', feeling: 2 } };
  const pro = await post('pro', { checkin: sheet, replace_user_plan: true });
  check(pro.status === 200 && pro.body.plan?.slot_type === 'rest' && (pro.body.plan?.rule_trace ?? []).some(t => /R514/.test(t)),
    `Pro full-regenerate with the sheet's nested pain check-in must rest (R514), got slot=${pro.body.plan?.slot_type} R514=${(pro.body.plan?.rule_trace ?? []).some(t => /R514/.test(t))}`);
  // and no_gear must bite the same way. The harness users own no equipment, so
  // R516 says "Bodyweight only (profile …)" regardless — give this user a gym
  // first, so the only way to a bodyweight pool is the nested toggle.
  db.prepare(`UPDATE user_preferences SET preferences_json = json_set(preferences_json, '$.available_equipment', json('["dumbbell","barbell","pull_up_bar"]')) WHERE user_id = 'pro'`).run();
  const gear = await post('pro', { checkin: { mood: 6, energy: 6, sleep_hours: 7, stress: 4, checkin_json: { no_gear: true } }, replace_user_plan: true });
  const r516 = (gear.body.plan?.rule_trace ?? []).filter(t => /R516/.test(t)).join(' | ');
  check(gear.status === 200 && /Bodyweight only/.test(r516) && /no_gear|geen materiaal|gear/i.test(r516),
    `nested no_gear must reach R516 as the REASON (user owns dumbbells), trace: ${r516 || 'none'}`);
  db.prepare(`UPDATE user_preferences SET preferences_json = json_set(preferences_json, '$.available_equipment', json('["none"]')) WHERE user_id = 'pro'`).run();
}

// 9. A client-written preferences.isPro grants NOTHING. The blob is stored as
//    sent, and until 2026-10-04 the planner honoured it — any user could POST
//    {"preferences":{"isPro":true}} and skip the daily cap. Pro is an
//    entitlement row and nothing else.
{
  db.prepare(`UPDATE user_preferences SET preferences_json = json_set(COALESCE(preferences_json,'{}'), '$.isPro', 1) WHERE user_id = ?`).run('free');
  await post('free', { replace_user_plan: true });          // first plan of the day
  const again = await post('free', { replace_user_plan: true });
  check(again.body.plan?.capped === true,
    `a free user with a self-written preferences.isPro flag skipped the C-G4 cap: capped=${again.body.plan?.capped}`);
  db.prepare(`UPDATE user_preferences SET preferences_json = json_remove(preferences_json, '$.isPro') WHERE user_id = ?`).run('free');
}

// 8. Gym-private exercises never reach a non-member — not via pins, not via
//    custom_steps, not in the engine's pool. Latent today (all 482 live rows are
//    global); a leak the day a trainer creates one.
{
  const pin = await post('pro', { pinned_exercise_ids: ['ex-gym-private'], replace_user_plan: true });
  check(pin.status === 400 && (pin.body.unknown_exercise_ids ?? []).includes('ex-gym-private'),
    `a non-member pinned another gym's private exercise: ${pin.status} ${JSON.stringify(pin.body.unknown_exercise_ids)}`);
  const own = await post('pro', { custom_steps: [{ exercise_id: 'ex-gym-private', sets: 3, target_reps: 10 }], replace_user_plan: true });
  check(own.status === 400 && (own.body.unknown_exercise_ids ?? []).includes('ex-gym-private'),
    `a non-member authored a session with another gym's private exercise: ${own.status}`);
  const eng = await post('pro', { replace_user_plan: true });
  const leaked = (eng.body.plan?.steps ?? []).some(st => st.exercise_id === 'ex-gym-private');
  check(!leaked, 'the engine put another gym\'s private exercise in a non-member\'s session');
}

// 9. F8 — the measurement offer travels on the stored plan. A one-tap install
//    (custom_steps, as useMySession sends it) answers with assessment_offer ON
//    the plan, which is what the Today card reads; re-installing the same steps
//    with include_assessment schedules it and clears the offer.
{
  const steps = [S('push-up', { sets: 3, target_reps: 10 }), S('glute-bridge', { sets: 3, target_reps: 12 })];
  const once = await post('dcp', { custom_steps: steps, session_name: 'Hotelbank' });
  check(once.status === 200 && once.body.plan?.assessment_offer === true && stored('dcp')?.assessment_offer === true && !once.body.plan?.assessment_planned,
    `a due measurement must be offered on the user plan itself, got ${once.status} offer=${once.body.plan?.assessment_offer} stored=${stored('dcp')?.assessment_offer}`);
  const added = await post('dcp', { custom_steps: steps, session_name: 'Hotelbank', include_assessment: true });
  const m = (added.body.plan?.steps ?? []).filter(st => st.max_effort);
  check(added.status === 200 && added.body.plan?.assessment_planned === true && added.body.plan?.assessment_offer === false && m.length === 2
    && row('dcp')?.generated_by === 'user',
    `"Zelfmeting toevoegen" must re-install the session with both measurement sets, got ${added.status} planned=${added.body.plan?.assessment_planned} sets=${m.length}`);
}

// 10. MANUAL_TRAINING_DESIGN §4 — "als extra": custom_steps + bonus_session.
//     The same assembly and advisory pass as a replacing session, returned in
//     memory; today's day_plans row is never created, changed or relabelled.
{
  const steps = [S('push-up', { sets: 3, target_reps: 10 }), S('glute-bridge', { sets: 3, target_reps: 12 })];
  const eng = await post('xfree', {});
  const before = row('xfree');
  check(before?.generated_by === 'engine', `xfree's first plan not stored (${eng.status})`);
  // A free user who already has today's plan: the extra is not capped and stores nothing.
  const extra = await post('xfree', { custom_steps: steps, bonus_session: true, session_name: 'Hotelbank' });
  check(extra.status === 200 && extra.body.bonus === true && extra.body.saved === false && extra.body.plan?.bonus === true
    && extra.body.plan?.authored_by_user === true && extra.body.plan?.capped !== true && extra.body.plan?.session_name === 'Hotelbank'
    && extra.body.plan?.steps?.length === 2 && Array.isArray(extra.body.safety_notes),
    `an extra own session must answer 200 { bonus: true, saved: false, plan: { authored_by_user, bonus } } uncapped, got ${extra.status} ${JSON.stringify(extra.body).slice(0, 200)}`);
  check(extra.body.plan?.id == null, `an extra must not carry a plan id (no day_plans row exists for it), got ${extra.body.plan?.id}`);
  check(JSON.stringify(row('xfree')) === JSON.stringify(before),
    `an extra own session changed today's day_plans row: ${before?.generated_by}/${before?.updated_at_ms} → ${row('xfree')?.generated_by}/${row('xfree')?.updated_at_ms}`);
  // The same free user may replace instead — that one IS stored, as 'user'.
  const repl = await post('xfree', { custom_steps: steps });
  check(repl.status === 200 && repl.body.saved === true && !repl.body.bonus && row('xfree')?.generated_by === 'user' && repl.body.plan?.id === row('xfree')?.id,
    `a replacing own session must be stored as generated_by=user, got ${repl.status} saved=${repl.body.saved} row=${row('xfree')?.generated_by}`);
  // An extra over the user's OWN session leaves that one alone too.
  const own = row('xfree');
  const extra2 = await post('xfree', { custom_steps: [S('dead-bug')], bonus_session: true });
  check(extra2.status === 200 && JSON.stringify(row('xfree')) === JSON.stringify(own), 'an extra replaced the user-authored session of today');
  // No plan yet today: an extra creates none.
  const none = await post('xnone', { custom_steps: steps, bonus_session: true });
  check(none.status === 200 && row('xnone') === null, `an extra on a day without a plan wrote a day_plans row (${none.status})`);
  // Acceptance 6 — the advisory pass runs on an extra: a pain day keeps its amber note.
  const pain = await post('pain', { custom_steps: steps, bonus_session: true, checkin: { pain_level: 3 } });
  check(pain.status === 200 && (pain.body.safety_notes ?? []).some(n => n.code === 'R514' && !n.blocking)
    && (pain.body.plan?.safety_notes ?? []).some(n => n.code === 'R514'),
    `an extra session on a pain day must carry the R514 advisory note, got ${pain.status} ${JSON.stringify(pain.body.safety_notes)}`);
  check(row('pain') === null, 'the pain-day extra wrote a day_plans row');
  // A hard contraindication blocks an extra exactly as it blocks a replacing session.
  const pregBefore = row('preg');
  const blocked = await post('preg', { custom_steps: [S('burpee')], bonus_session: true });
  check(blocked.status === 409 && blocked.body.error === 'safety_ack_required', `a blocking note on an extra must be 409 without ack, got ${blocked.status}`);
  const acked = await post('preg', { custom_steps: [S('burpee')], bonus_session: true, safety_ack: true });
  check(acked.status === 200 && acked.body.bonus === true && typeof acked.body.plan?.safety_ack_ms === 'number',
    `an acknowledged extra must answer 200 with safety_ack_ms, got ${acked.status}`);
  check(JSON.stringify(row('preg')) === JSON.stringify(pregBefore), 'an (acknowledged) extra changed the pregnant user\'s stored plan');
  // R598 — offered on an extra too, never inserted silently.
  const dcpBefore = row('dcp');
  const dcp = await post('dcp', { custom_steps: steps, bonus_session: true });
  check(dcp.status === 200 && dcp.body.assessment_offer === true && !(dcp.body.plan?.steps ?? []).some(st => st.max_effort),
    `a due measurement must be offered (not inserted) on an extra, got offer=${dcp.body.assessment_offer}`);
  check(JSON.stringify(row('dcp')) === JSON.stringify(dcpBefore), 'an extra changed the dcp user\'s stored plan');
}

process.stdout.write(errs.length ? errs.join('; ') : 'OK');
if (errs.length) process.exitCode = 1;

#!/usr/bin/env node
/**
 * Generate migrations/0125_injury_load_tags.sql (finding 0, docs/UI_UX_REVIEW_2026-11-16.md)
 * from scripts/fixtures/exercise-injury-load.json, and the review table
 * docs/injury-load-tags.md from the same JSON — the name_nl precedent (0124).
 *
 * The JSON is the reviewed source for two things:
 *
 *   tags           { slug: { add: [area…], why } } — the `loads_*` tags every active global
 *                  exercise is missing. They MUST equal what loadAreas()
 *                  (functions/api/_shared/injuryLoad.js) infers minus what the row already
 *                  carries, so after the migration the data and the code agree. A reviewer who
 *                  disagrees changes the inference in code, not the JSON (the check below fails
 *                  on any difference).
 *   loads_nothing  { slug: reason } — strength/cardio/mixed/skill rows that load no area, said
 *                  out loud (smoke checks every such row is either tagged or listed here).
 *   substitutions  { slug: [slug…] } — appended to alternatives_json.substitutions so every
 *                  active row offers at least 2 (0115 format; reciprocal where the target has
 *                  room and the reverse swap is not a heavier load).
 *   no_substitute  { slug: reason } — rows that keep fewer than 2 by decision (the Cooper test).
 *
 * Usage:
 *   node scripts/generate-injury-load-migration.mjs --propose   # (re)builds the JSON from the
 *                                                               # baseline + the code, for review
 *   node scripts/generate-injury-load-migration.mjs             # JSON → migration + review table
 *   node scripts/generate-injury-load-migration.mjs --check     # … then dry-runs it on the baseline
 *
 * The migration only APPENDS (json_insert … '$[#]'), each statement guarded by NOT EXISTS, so a
 * row edited live since the baseline keeps its edits; a final assert table fails the whole file
 * when the post-conditions do not hold (0121 precedent) — plain UPDATEs, no INSERT OR IGNORE.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { loadAreas, explainLoadAreas, INJURY_AREAS } from '../functions/api/_shared/injuryLoad.js';
import { movementFamily } from '../functions/api/plan.js';

const SRC = 'scripts/fixtures/exercise-injury-load.json';
const OUT = 'migrations/0125_injury_load_tags.sql';
const DOC = 'docs/injury-load-tags.md';
const DECIDED = new Set(['strength', 'cardio', 'mixed', 'skill']);
const MAX_SUBS = 5;
const MIN_SUBS = 2;
const STAMP = 1794787200000;   // 2026-11-16T00:00:00Z — fixed so regenerating is byte-stable

const args = new Set(process.argv.slice(2));

// ── the baseline as it is today ─────────────────────────────────────────────
export function loadBaseline() {
  const db = new DatabaseSync(':memory:');
  for (const f of ['1010_schema_training.sql', '1000_schema_core.sql', '1020_seed_exercises.sql']) {
    db.exec(readFileSync(`migrations/baseline/${f}`, 'utf8'));
  }
  return db;
}
const db = loadBaseline();
const rows = db.prepare('SELECT * FROM exercises WHERE is_active = 1 AND gym_id IS NULL ORDER BY category, slug').all();
const bySlug = new Map(rows.map(r => [r.slug, r]));
const arr = (s) => { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : []; } catch { return []; } };
const tagsOf = (r) => arr(r.tags_json);
const explicitOf = (r) => new Set(tagsOf(r).filter(t => t.startsWith('loads_')).map(t => t.slice(6)));
const subsOf = (r) => { try { return JSON.parse(r.alternatives_json || '{}')?.substitutions ?? []; } catch { return []; } };
const validSubs = (r) => [...new Set(subsOf(r))].filter(s => bySlug.has(s) && s !== r.slug);
const isProtocol = (r) => tagsOf(r).includes('protocol');
const ABBR = { shoulder: 'schouder', knee: 'knie', lower_back: 'onderrug', ankle: 'enkel' };

function inferredAdd(r) {
  const ex = explicitOf(r);
  return INJURY_AREAS.filter(a => loadAreas(r).has(a) && !ex.has(a));
}
function whyText(r, areas) {
  const why = explainLoadAreas(r);
  return areas.map(a => `${a}: ${[...new Set(why.get(a).filter(x => !x.startsWith('tag loads_')))].slice(0, 3).join(', ')}`).join('; ');
}

// ── substitution proposals ──────────────────────────────────────────────────
const PATTERNS = {
  push: (t, s) => t.includes('push') || /push-up|bench-press|overhead-press|shoulder-press|chest-press|floor-press|arnold-press|strict-press|dip|fly/.test(s),
  pull: (t, s) => t.includes('pull') || /row|pull|chin|curl/.test(s),
  squat: (t, s) => t.includes('squat') || /squat|wall-sit|leg-press|hack/.test(s),
  lunge: (t, s) => t.includes('lunge') || /lunge|split|step-up/.test(s),
  hinge: (t, s) => t.includes('hinge') || t.includes('posterior_chain') || /deadlift|rdl|bridge|thrust|swing|good-morning/.test(s),
  core: (t, s) => t.includes('core') || t.some(x => x.startsWith('anti_')) || /plank|crunch|sit-up|dead-bug|hollow|v-up|leg-raise|flutter/.test(s),
  carry: (t, s) => t.includes('carry') || /carry|farmers/.test(s),
  calf: (t, s) => t.includes('calf') || t.includes('shin') || /calf|tibialis|heel|toe/.test(s),
  run: (t, s) => t.includes('running') || /run|jog|sprint|hardlopen|stride/.test(s),
  walk: (t, s) => t.includes('walking') || t.includes('march') || /walk|march|hike|marsen/.test(s),
  cycle: (t, s) => t.includes('cycling') || /cycl|bike/.test(s),
  rowing: (t, s) => /rowing/.test(s),
  jump: (t, s) => t.includes('plyometric') || /jump|hop|skater|burpee|jack/.test(s),
  breathing: (t) => t.includes('breathing'),
  pelvic: (t) => t.includes('pelvic_floor'),
  stretch: (t, s) => t.includes('stretch') || /stretch|pose|fold|twist|opener/.test(s),
  foam: (t, s) => /foam|massage/.test(s),
  relax: (t, s) => /meditation|grounding|visualization|reflection|savasana|relaxation|body-check|rest|palming/.test(s),
  boxing: (t, s) => /box|punch|bag/.test(s),
  conditioning: (t) => t.includes('hiit') || t.includes('conditioning'),
};
const patternsOf = (r) => { const t = tagsOf(r); return new Set(Object.keys(PATTERNS).filter(k => PATTERNS[k](t, r.slug))); };
const kitOf = (r) => new Set(arr(r.equipment_required_json).filter(e => e !== 'none' && e !== 'chair'));
const musclesOf = (r) => new Set(arr(r.primary_muscles_json).map(m => String(m).toLowerCase()));
const subset = (a, b) => [...a].every(x => b.has(x));

// No difficulty column is filled, so "equal or lower load" also needs a coarse effort rank:
// a substitute is never harder, never higher-impact, never a higher level or a heavier pack.
const HARD_TAGS = ['high_impact', 'plyometric', 'hiit', 'high_intensity', 'power', 'max-effort', 'weighted', 'olympic'];
const HARD_WORDS = /diamond|plyo|pistol|single-leg|weighted|explosive|jump|tuck|burpee|sprint|nordic|handstand|pike|renegade|snatch|clean|turkish|hill|tempo|fartlek|interval|v-up|hanging|dragon/;
const EASY_TAGS = ['beginner_friendly', 'no_sweat', 'pregnancy_safe', 'postnatal_safe'];
const EASY_WORDS = /wall-|knee-push|incline|assisted|modified|supported|seated|bent-knee|low-impact|march|walk|easy|gentle|zone1|warmup|cooldown/;
function effort(r) {
  const t = tagsOf(r);
  let d = 2;
  if (t.some(x => HARD_TAGS.includes(x))) d += 1;
  if (HARD_WORDS.test(r.slug)) d += 1;
  if (t.some(x => EASY_TAGS.includes(x))) d -= 1;
  if (EASY_WORDS.test(r.slug)) d -= 1;
  return d;
}
const IMPACT = ['high_impact', 'plyometric'];
const num = (re, s) => { const m = s.match(re); return m ? Number(m[1]) : null; };
function notHeavier(r, c) {
  if (effort(c) > effort(r)) return false;
  const ti = tagsOf(r), tc = tagsOf(c);
  if (tc.some(x => IMPACT.includes(x)) && !ti.some(x => IMPACT.includes(x))) return false;
  const lr = num(/level-(\d+)/, r.slug), lc = num(/level-(\d+)/, c.slug);
  if (lr !== null && lc !== null && r.slug.replace(/\d+$/, '') === c.slug.replace(/\d+$/, '') && lc > lr) return false;
  const zr = num(/zone-(\d)/, r.slug), zc = num(/zone-(\d)/, c.slug);
  if (zr !== null && zc !== null && zc > zr) return false;
  const kr = num(/(\d+)kg/, r.slug), kc = num(/(\d+)kg/, c.slug);
  if (kc !== null && (kr === null || kc > kr)) return false;
  return true;
}

function score(r, c) {
  const pr = patternsOf(r), pc = patternsOf(c);
  const sharedP = [...pr].filter(x => pc.has(x)).length;
  const mr = musclesOf(r), mc = musclesOf(c);
  const sharedM = [...mr].filter(x => mc.has(x)).length;
  if (!sharedP && !sharedM) return -Infinity;
  let s = 4 * sharedP + 3 * sharedM;
  s += subset(kitOf(c), kitOf(r)) ? 3 : -4;            // no extra kit needed
  if (!kitOf(c).size) s += 1;                          // bodyweight is always available
  if (movementFamily(c.slug) === movementFamily(r.slug)) s += 2;
  s -= loadAreas(c).size * 0.5;                        // prefer lighter
  s -= 1.5 * effort(c);                                // … and easier
  return s;
}
function eligible(r, c) {
  if (c.slug === r.slug || c.category !== r.category) return false;
  if (isProtocol(c) !== isProtocol(r)) return false;  // 0115/0116: protocol work stays with protocol work
  if (!notHeavier(r, c)) return false;
  if (c.slug === '12-minute-cooper-test') return false;
  return subset(loadAreas(c), loadAreas(r));          // equal or lower load, area by area
}

// Hand-reviewed where the scorer's first choice was not a sensible swap (review 2026-11-16).
// Validated like every other substitution (exists, active, same category, not heavier).
const REVIEWED = {
  'plyo-push-up': ['push-up', 'knee-push-up'],
  'diamond-push-up': ['incline-push-up', 'knee-push-up'],
  'cooldown-walk': ['march-in-place', 'heel-dig-march'],
  'easy-jog-warmup': ['march-in-place', 'cooldown-walk'],
  'squat-pulse': ['march-in-place', 'step-touch'],
  'box-step-up': ['stair-climb-simulation', 'march-in-place'],
  'walking-lunges': ['reverse-lunge', 'split-squat'],
  'dumbbell-farmers-walk': ['kettlebell-farmers-carry', 'dumbbell-suitcase-carry'],
  'bird-dog': ['dead-bug', 'superman-hold'],
  'sphinx-hold': ['superman-hold', 'cobra-press-up'],
  'wall-chest-stretch': ['cross-body-shoulder-stretch', 'chest-opener-arms'],
  'standing-side-stretch': ['thread-the-needle', 'cross-body-shoulder-stretch'],
  'cross-body-shoulder-stretch': ['shoulder-roll-stretch', 'thread-the-needle'],
  'forearm-wrist-stretch': ['wrist-flexor-stretch', 'neck-stretch'],
  'glute-piriformis-stretch': ['supine-figure-four', 'standing-figure-four'],
  'neck-stretch': ['neck-half-circles', 'forearm-wrist-stretch'],
  'jump-rope-simulation': ['jumping-jack', 'high-knees'],
  'jump-rope-basic': ['jumping-jack', 'jump-rope-simulation'],
  'jump-rope-intervals': ['jump-rope-basic', 'jumping-jack'],
  'outdoor-bike-zone2': ['cycling-outdoor-easy', 'cooldown-walk'],
  'outdoor-bike-hiit': ['outdoor-bike-zone2', 'cycling-outdoor-easy'],
  'static-bike-zone2': ['stationary-bike-steady', 'cooldown-walk'],
  'static-bike-hiit': ['static-bike-zone2', 'stationary-bike-steady'],
  'run-interval-level-1': ['easy-jog-warmup', 'brisk-walk'],
  // No candidate passed the automatic rules (effort, kit or category) — chosen by hand.
  'hardlopen-zone-1-5-minuten-warmup': ['hardlopen-zone-1-7-minuten', 'hardlopen-zone-1-1x5-minuten'],
  'cooling-down': ['body-scan-meditation', 'box-breathing'],
  'warming-up': ['leg-swings-front-back', 'leg-swings-lateral'],
  'gentle-hip-circles': ['supine-knee-to-chest', 'happy-baby-pose'],
  'neck-shoulder-self-massage': ['shoulder-roll-stretch', 'neck-half-circles'],
  'self-massage-feet': ['ankle-pumps', 'foam-roll-calves'],
  'supported-side-lying-rest': ['savasana', 'body-scan-meditation'],
  'graaftest': ['til-draagtest-full-exercise', 'optillen-vanaf-de-grond'],
  'til-draagtest-full-exercise': ['til-draagtest-gewicht-plaatsen-naar-heupen', 'optillen-vanaf-de-grond'],
  'til-draagtest-gewicht-plaatsen-naar-heupen': ['til-draagtest-full-exercise', 'optillen-vanaf-de-grond'],
  'optillen-vanaf-de-grond': ['til-draagtest-gewicht-plaatsen-naar-heupen', 'graaftest'],
  'optillen-vanaf-de-grond-rugzak': ['optillen-vanaf-de-grond', 'til-draagtest-full-exercise'],
  'dumbbell-front-raise': ['dumbbell-lateral-raise', 'dumbbell-incline-chest-press'],
  'leg-curl-machine': ['leg-extension-machine', 'nordic-hamstring-curl'],
  'leg-extension-machine': ['leg-press', 'wall-sit'],
  'mat-hip-bridge-march': ['glute-bridge', 'bench-hip-thrust-bodyweight'],
  'stability-ball-dead-bug': ['dead-bug', 'band-dead-bug'],
  'wall-sit': ['sumo-squat', 'supported-wall-squat'],
};

function propose() {
  const NO_SUB = { '12-minute-cooper-test': 'A standardised test has no substitute (0113): the result is only comparable when the test itself is done. "Deze oefening overslaan" is the way out.' };
  const tags = {}, nothing = {};
  for (const r of rows) {
    const add = inferredAdd(r);
    if (add.length) tags[r.slug] = { add, why: whyText(r, add) };
    if (DECIDED.has(r.category) && !loadAreas(r).size) {
      nothing[r.slug] = `no joint-loading muscle, tag, equipment or word: ${arr(r.primary_muscles_json).join(', ') || 'no muscles listed'}`;
    }
  }
  const lists = new Map(rows.map(r => [r.slug, validSubs(r)]));
  const added = new Map();
  const push = (from, to) => { lists.get(from).push(to); if (!added.has(from)) added.set(from, []); added.get(from).push(to); };
  for (const r of rows) {
    if (NO_SUB[r.slug]) continue;
    const have = lists.get(r.slug);
    if (have.length >= MIN_SUBS) continue;
    if (REVIEWED[r.slug]) { for (const s of REVIEWED[r.slug]) if (!have.includes(s)) push(r.slug, s); continue; }
    // First pass: substitutes that need no kit the original does not need; then any kit.
    for (const kitOk of [true, false]) {
      const cands = rows.filter(c => !have.includes(c.slug) && eligible(r, c) && (!kitOk || subset(kitOf(c), kitOf(r))))
        .map(c => ({ c, s: score(r, c) })).filter(x => x.s > -Infinity)
        .sort((a, b) => b.s - a.s || a.c.slug.localeCompare(b.c.slug));
      for (const { c } of cands.slice(0, Math.max(0, MIN_SUBS - have.length))) push(r.slug, c.slug);
    }
  }
  // Reciprocity (0115): the target offers the way back when it has room and the way back is
  // not a heavier load for it.
  for (const [from, tos] of [...added]) {
    for (const to of tos) {
      const t = lists.get(to), f = bySlug.get(from), tr = bySlug.get(to);
      if (NO_SUB[to] || REVIEWED[to] || t.includes(from) || t.length >= MAX_SUBS) continue;
      if (!eligible(tr, f)) continue;
      if (![...patternsOf(tr)].some(p => patternsOf(f).has(p))) continue;   // same movement pattern only
      if (!subset(kitOf(f), kitOf(tr))) continue;                         // and no extra kit
      push(to, from);
    }
  }
  const substitutions = Object.fromEntries([...added].sort((a, b) => a[0].localeCompare(b[0])));
  const out = {
    about: 'Reviewed source for migrations/0125_injury_load_tags.sql and docs/injury-load-tags.md. Generated with --propose, reviewed row by row, regenerated SQL with the default mode. tags.add must equal what functions/api/_shared/injuryLoad.js infers.',
    tags, loads_nothing: nothing, substitutions, no_substitute: NO_SUB,
  };
  writeFileSync(SRC, JSON.stringify(out, null, 2) + '\n');
  console.log(`wrote ${SRC}: ${Object.keys(tags).length} rows get tags, ${Object.keys(nothing).length} load nothing, ${Object.keys(substitutions).length} rows get substitutions`);
}

if (args.has('--propose')) { propose(); process.exit(0); }

// ── JSON → SQL ──────────────────────────────────────────────────────────────
const fx = JSON.parse(readFileSync(SRC, 'utf8'));
const errs = [];
for (const r of rows) {
  const want = inferredAdd(r);
  const got = fx.tags[r.slug]?.add ?? [];
  if (want.join() !== [...got].sort((a, b) => INJURY_AREAS.indexOf(a) - INJURY_AREAS.indexOf(b)).join()) {
    errs.push(`${r.slug}: fixture adds [${got}] but the code infers [${want}] — change the code or regenerate with --propose`);
  }
  if (DECIDED.has(r.category) && !loadAreas(r).size && !fx.loads_nothing[r.slug]) errs.push(`${r.slug}: loads nothing and is not on loads_nothing`);
  const total = new Set([...validSubs(r), ...(fx.substitutions[r.slug] ?? [])]);
  if (total.size < MIN_SUBS && !fx.no_substitute[r.slug]) errs.push(`${r.slug}: ${total.size} substitution(s)`);
}
for (const [slug, subs] of Object.entries(fx.substitutions)) {
  const r = bySlug.get(slug);
  if (!r) { errs.push(`substitutions: ${slug} is not an active global row`); continue; }
  for (const s of subs) {
    const c = bySlug.get(s);
    if (!c) errs.push(`substitutions: ${slug} → ${s} is not an active global row`);
    else if (!subset(loadAreas(c), loadAreas(r))) errs.push(`substitutions: ${slug} → ${s} loads more (${[...loadAreas(c)]} vs ${[...loadAreas(r)]})`);
    else if (isProtocol(c) !== isProtocol(r)) errs.push(`substitutions: ${slug} → ${s} crosses protocol/civilian`);
  }
  if (new Set([...validSubs(r), ...subs]).size > MAX_SUBS) errs.push(`substitutions: ${slug} would exceed ${MAX_SUBS}`);
}
for (const s of [...Object.keys(fx.tags), ...Object.keys(fx.loads_nothing)]) if (!bySlug.has(s)) errs.push(`${s}: not an active global row`);
if (errs.length) { console.error(errs.join('\n')); process.exit(1); }

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const tagRows = Object.entries(fx.tags).sort((a, b) => a[0].localeCompare(b[0]));
const subRows = Object.entries(fx.substitutions).sort((a, b) => a[0].localeCompare(b[0]));
const areaCount = Object.fromEntries(INJURY_AREAS.map(a => [a, tagRows.filter(([, v]) => v.add.includes(a)).length]));
const subLinks = subRows.reduce((n, [, v]) => n + v.length, 0);
const nothingList = Object.keys(fx.loads_nothing).sort();
const noSubList = Object.keys(fx.no_substitute).sort();
const decidedIn = [...DECIDED].map(q).join(', ');
const where = (slug) => `slug = ${q(slug)} AND gym_id IS NULL AND is_active = 1`;

const sql = `-- 0125 — injury load tags for every active exercise; at least two substitutions each.
--
-- GENERATED by scripts/generate-injury-load-migration.mjs from
-- scripts/fixtures/exercise-injury-load.json; the review table docs/injury-load-tags.md is
-- built from the same JSON. Do not hand-edit: change the inference in
-- functions/api/_shared/injuryLoad.js (or the JSON's substitutions), regenerate, and ship the
-- change as a NEW migration (this one is applied history once applied).
--
-- Finding 0 (docs/UI_UX_REVIEW_2026-11-16.md): R563 filtered on loads_* tags that migration
-- 0021 added to the library as it was then. 284 of 480 active rows carried none — among them
-- plyo-push-up, prescribed to a user with a chronic shoulder complaint who reported shoulder
-- pain. The planner now derives the load (injuryLoad.js loadAreas = tags ∪ what the row shows);
-- this migration writes the same answer into the data so the two agree.
--
-- Tags added (${tagRows.length} rows): shoulder ${areaCount.shoulder}, knee ${areaCount.knee}, lower_back ${areaCount.lower_back}, ankle ${areaCount.ankle}.
-- Substitutions added: ${subLinks} links on ${subRows.length} rows (reciprocal where the target had room and
-- the way back is not a heavier load; never across protocol/civilian; never heavier than the
-- exercise they replace, area by area). Rows that load nothing by decision: ${nothingList.length}.
-- Rows that keep fewer than ${MIN_SUBS} substitutions by decision: ${noSubList.join(', ') || 'none'}.
--
-- Every statement APPENDS and is guarded by NOT EXISTS, so a row edited live since the
-- baseline keeps its edits and re-running changes nothing. The assert at the end fails the
-- whole file when a post-condition does not hold.

-- ── loads_* tags ──
${tagRows.flatMap(([slug, v]) => v.add.map(a =>
  `UPDATE exercises SET tags_json = json_insert(tags_json, '$[#]', 'loads_${a}'), updated_at_ms = ${STAMP} WHERE ${where(slug)} AND NOT EXISTS (SELECT 1 FROM json_each(exercises.tags_json) WHERE value = 'loads_${a}');`)).join('\n')}

-- ── substitutions ──
${subRows.flatMap(([slug, subs]) => subs.map(s =>
  `UPDATE exercises SET alternatives_json = json_set(COALESCE(NULLIF(alternatives_json, ''), '{"substitutions":[]}'), '$.substitutions[#]', ${q(s)}), updated_at_ms = ${STAMP} WHERE ${where(slug)} AND NOT EXISTS (SELECT 1 FROM json_each(COALESCE(NULLIF(exercises.alternatives_json, ''), '{"substitutions":[]}'), '$.substitutions') WHERE value = ${q(s)});`)).join('\n')}

-- ── post-conditions ──
CREATE TABLE _0125_assert (ok INTEGER NOT NULL CHECK (ok = 1)) STRICT;
-- every row this file names exists, is global and active
INSERT INTO _0125_assert (ok) SELECT CASE WHEN (SELECT COUNT(*) FROM exercises WHERE gym_id IS NULL AND is_active = 1 AND slug IN (${[...new Set([...tagRows.map(([s]) => s), ...subRows.map(([s]) => s)])].map(q).join(', ')})) = ${new Set([...tagRows.map(([s]) => s), ...subRows.map(([s]) => s)]).size} THEN 1 ELSE 0 END;
-- every strength/cardio/mixed/skill row carries a loads_* tag or is on the loads-nothing list
INSERT INTO _0125_assert (ok) SELECT CASE WHEN (SELECT COUNT(*) FROM exercises e WHERE e.gym_id IS NULL AND e.is_active = 1 AND e.category IN (${decidedIn})
  AND NOT EXISTS (SELECT 1 FROM json_each(e.tags_json) WHERE value LIKE 'loads\\_%' ESCAPE '\\')
  AND e.slug NOT IN (${nothingList.map(q).join(', ') || "''"})) = 0 THEN 1 ELSE 0 END;
-- every active row offers at least ${MIN_SUBS} substitutions that exist and are active
INSERT INTO _0125_assert (ok) SELECT CASE WHEN (SELECT COUNT(*) FROM exercises e WHERE e.gym_id IS NULL AND e.is_active = 1
  AND e.slug NOT IN (${noSubList.map(q).join(', ') || "''"})
  AND (SELECT COUNT(DISTINCT j.value) FROM json_each(COALESCE(NULLIF(e.alternatives_json, ''), '{"substitutions":[]}'), '$.substitutions') j
       JOIN exercises t ON t.slug = j.value AND t.is_active = 1 AND t.gym_id IS NULL) < ${MIN_SUBS}) = 0 THEN 1 ELSE 0 END;
DROP TABLE _0125_assert;
`;
writeFileSync(OUT, sql);

// ── review table ────────────────────────────────────────────────────────────
const CAT_NL = { strength: 'Kracht', cardio: 'Cardio', mixed: 'Gemengd', skill: 'Vaardigheid', mobility: 'Mobiliteit', recovery: 'Herstel' };
const nm = (r) => `${r.name}${r.name_nl && r.name_nl !== r.name ? ` · ${r.name_nl}` : ''}`.replace(/\|/g, '/');
let md = `# Injury load tags and substitutions — review table (migration 0125)

Generated by \`scripts/generate-injury-load-migration.mjs\` from \`scripts/fixtures/exercise-injury-load.json\`
(do not edit by hand). Finding 0 of \`docs/UI_UX_REVIEW_2026-11-16.md\`.

**What this is.** The planner keeps exercises that load an injured area out of the session (R563).
It used to read only the \`loads_*\` tags that migration 0021 put on the library as it was then; 284 of 480
active rows had none, \`plyo-push-up\` among them. The planner now derives the load in code
(\`functions/api/_shared/injuryLoad.js\` — the inference table is in its header) and this migration writes
the same answer into the data. **When unsure, an exercise loads the area**: a wrongly excluded exercise
costs variety, a wrongly included one can hurt someone.

**How to review.** Read the "why" column. If an area is wrong, the fix is a change to the inference in
\`injuryLoad.js\` (the generator refuses a JSON that disagrees with the code), regenerated as a new migration.

Totals: ${tagRows.length} rows get tags — shoulder ${areaCount.shoulder}, knee ${areaCount.knee}, lower back ${areaCount.lower_back}, ankle ${areaCount.ankle}.
${subLinks} substitution links on ${subRows.length} rows. ${nothingList.length} strength/cardio rows load nothing (listed below).

`;
for (const cat of ['strength', 'cardio', 'mixed', 'skill', 'mobility', 'recovery']) {
  const list = tagRows.filter(([s]) => bySlug.get(s).category === cat);
  if (!list.length) continue;
  md += `## ${CAT_NL[cat]} — tags added (${list.length})\n\n| slug | name | areas added | why |\n|---|---|---|---|\n`;
  for (const [slug, v] of list) md += `| \`${slug}\` | ${nm(bySlug.get(slug))} | ${v.add.map(a => ABBR[a]).join(', ')} | ${v.why.replace(/\|/g, '/')} |\n`;
  md += '\n';
}
md += `## Loads nothing (strength / cardio / mixed / skill, ${nothingList.length})\n\n| slug | name | why |\n|---|---|---|\n`;
for (const s of nothingList) md += `| \`${s}\` | ${nm(bySlug.get(s))} | ${fx.loads_nothing[s]} |\n`;
md += `\n## Substitutions added (${subRows.length} rows, ${subLinks} links)\n\nEach substitute loads no area the original does not load, needs no protocol/civilian crossing, and is the\nsame category. Reciprocal links (0115 convention) are included.\n\n| slug | name | substitutes added |\n|---|---|---|\n`;
for (const [slug, subs] of subRows) md += `| \`${slug}\` | ${nm(bySlug.get(slug))} | ${subs.map(s => `\`${s}\``).join(', ')} |\n`;
md += `\n## Kept below two substitutions by decision\n\n| slug | why |\n|---|---|\n`;
for (const s of noSubList) md += `| \`${s}\` | ${fx.no_substitute[s]} |\n`;
writeFileSync(DOC, md);
console.log(`wrote ${OUT} (${tagRows.reduce((n, [, v]) => n + v.add.length, 0)} tag + ${subLinks} substitution statements) and ${DOC}`);

if (args.has('--check')) {
  const d2 = loadBaseline();
  d2.exec(sql);
  const after = d2.prepare('SELECT * FROM exercises WHERE is_active = 1 AND gym_id IS NULL').all();
  const bad = after.filter(r => {
    const ex = explicitOf(r);
    return INJURY_AREAS.some(a => loadAreas(r).has(a) !== ex.has(a));
  });
  console.log(`dry run on the baseline: ${after.length} active rows; rows where explicit tags ≠ loadAreas(): ${bad.length}`);
  if (bad.length) { console.log('  ' + bad.slice(0, 10).map(r => r.slug).join(', ')); process.exit(1); }
  d2.exec(sql);   // idempotent: a second run must not fail or change anything
  console.log('second run OK (idempotent); dry run OK');
}

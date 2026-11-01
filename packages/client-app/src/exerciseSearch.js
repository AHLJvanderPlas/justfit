// ─── Exercise search — what the picker lists, in which order, and why it may be empty ──
//
// Pure: ExercisePicker (sessionSheet.jsx) renders; the decisions live here so
// tests/exerciseSearch.test.js can pin them. One pipeline (BUILDER_UX_PLAN §3):
//   category + kit filter → query (with Dutch synonyms) → order → cap (reported).
// v1.1's miss message (emptyMessage) is computed after the synonyms.

import { t, exerciseName } from "./i18n.js";

export const ALWAYS_OWNED = ["none", "chair"];
export const CAP = 40;
const parse = (s, d) => {
  if (Array.isArray(s)) return s;
  try { return JSON.parse(s || d) ?? JSON.parse(d); } catch { return JSON.parse(d); }
};
export const equipOf = (ex) => parse(ex?.equipment_required_json, '["none"]');
export const tagsOf = (ex) => parse(ex?.tags_json, "[]");

// ── Categories: the chips, and the library's sections after the context ones ──
// skill and mixed (and anything unknown) fall under Kracht.
export const CATEGORY_CHIPS = [
  { key: "all", label: "All types" },
  { key: "strength", label: "Strength" },
  { key: "cardio", label: "Cardio" },
  { key: "mobility", label: "Mobility" },
  { key: "recovery", label: "Recovery" },
];
export const categoryGroup = (ex) => (["cardio", "mobility", "recovery"].includes(ex?.category) ? ex.category : "strength");

// Test protocols go to the last section and carry the TEST marker. `measurable`
// is NOT a test: it marks ordinary exercises the self-assessment can measure
// (Push-up, Knee Push-up, Sit-up), and labelling those TEST misled the review.
export const isProtocol = (ex) => tagsOf(ex).some((g) => g === "protocol" || g === "assessment");
export const isTest = isProtocol;

// Alphabetical on the DISPLAYED name (v1.5: Dutch for a Dutch user), digit-led
// names after letters ("12-Minute Cooper Test" is not where a list starts).
const digitLed = (ex) => (/^\d/.test(exerciseName(ex)) ? 1 : 0);
export const byName = (a, b) => digitLed(a) - digitLed(b) || exerciseName(a).localeCompare(exerciseName(b));

// ── Dutch synonyms (R4, first half) — Dutch token → the English tokens the names use.
// The table IS the test (tests/exerciseSearch.test.js). Since v1.5 a row's own
// Dutch name (name_nl) matches too; the synonyms still reach English-only rows.
export const SYNONYMS = {
  opdrukken: ["push-up"],
  optrekken: ["pull-up", "chin-up"],
  kniebuiging: ["squat"], kniebuigingen: ["squat"],
  uitvalspas: ["lunge"], uitvalspassen: ["lunge"],
  buikspieren: ["sit-up", "crunch"],
  rugspieren: ["row", "superman"],
  schouder: ["shoulder"], schouders: ["shoulder"],
  benen: ["leg", "squat"],
  billen: ["glute", "bridge"],
  kuiten: ["calf"],
  plank: ["plank"],
  burpee: ["burpee"],
  touwtjespringen: ["jump rope"],
  hardlopen: ["run"], rennen: ["run"],
  wandelen: ["walk"],
  fietsen: ["bike", "cycling"],
  roeien: ["rowing"],
  rekken: ["stretch"], stretchen: ["stretch"],
  ademhaling: ["breathing"],
  heup: ["hip"],
  rug: ["back"],
  borst: ["chest"],
  armen: ["arm", "curl", "press"],
  dip: ["dip"],
  brug: ["bridge"],
  klimmen: ["climber"],
  springen: ["jump"],
  zwaaien: ["swing"],
  halter: ["dumbbell"], halters: ["dumbbell"],
  gewicht: ["weight"],
  band: ["band"],
  bal: ["ball"],
  bank: ["bench"],
  trap: ["step"],
  zit: ["seated"],
  lig: ["lying"],
  staand: ["standing"],
};

// The query plus the English tokens its Dutch words stand for. A token expands
// when it IS a key, or (while typing) when it is ≥ 5 letters and starts a key.
export function expandQuery(query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];
  const out = [q];
  for (const tok of q.split(/\s+/)) {
    const keys = SYNONYMS[tok] ? [tok] : tok.length >= 5 ? Object.keys(SYNONYMS).filter((k) => k.startsWith(tok)) : [];
    for (const k of keys) for (const s of SYNONYMS[k]) if (!out.includes(s)) out.push(s);
  }
  return out;
}

// `term` at a word start in `text` ("arm" finds "Arm Circles", not "Warm-up").
function atWordStart(text, term) {
  for (let i = text.indexOf(term); i !== -1; i = text.indexOf(term, i + 1)) {
    if (i === 0 || !/[a-z0-9]/.test(text[i - 1])) return true;
  }
  return false;
}

// Rank of a row for the expanded terms: 0 a name IS the term · 1 a name starts
// with it · 2 a name contains it · 3 slug contains it · -1 no match. "A name" is
// the English name or the Dutch one (v1.5), whichever language the user reads —
// so "opdrukken" puts Push-up ("Opdrukken") above "Opdrukken verhoogd" for an
// English reader too. The typed query matches as a substring (v1.1); a synonym
// only at a word start.
export function matchRank(ex, terms) {
  const names = [ex?.name, ex?.name_nl].filter(Boolean).map((n) => n.toLowerCase());
  const slug = ex?.slug ?? "";
  let best = -1;
  terms.forEach((term, i) => {
    const has = (s, x) => (i === 0 ? s.includes(x) : atWordStart(s, x));
    const r = names.includes(term) ? 0 : names.some((n) => n.startsWith(term)) ? 1 : names.some((n) => has(n, term)) ? 2
      : has(slug, term.replace(/\s+/g, "-")) ? 3 : -1;
    if (r !== -1 && (best === -1 || r < best)) best = r;
  });
  return best;
}

// ── Ordering ──────────────────────────────────────────────────────────────────
// ctx = { planIds, recentIds, templateIds }. Empty query → sections in this
// order, each alphabetical (digits after letters); a row appears only in the
// first section it qualifies for; protocol/assessment rows always go last.
// A query → one ranked list (stable, alphabetical within a rank). The cap is
// applied across sections and reported: { sections, shown, total }.
const SECTION_LABELS = {
  plan: "Today in your plan", recent: "Recently done", templates: "From your trainings",
  strength: "Strength", cardio: "Cardio", mobility: "Mobility", recovery: "Recovery", tests: "Tests & protocols",
};
export function orderLibrary(rows, ctx = {}, { query = "", cap = CAP } = {}) {
  const list = [...(rows ?? [])].sort(byName);
  const terms = expandQuery(query);
  let groups;
  if (terms.length) {
    const ranked = list.map((ex) => [matchRank(ex, terms), ex]).filter(([r]) => r !== -1);
    groups = [{ key: "results", label: null, rows: ranked.sort((a, b) => a[0] - b[0]).map(([, ex]) => ex) }];
  } else {
    const sets = { plan: new Set(ctx.planIds ?? []), recent: new Set(ctx.recentIds ?? []), templates: new Set(ctx.templateIds ?? []) };
    const keys = ["plan", "recent", "templates", "strength", "cardio", "mobility", "recovery", "tests"];
    const by = Object.fromEntries(keys.map((k) => [k, []]));
    for (const ex of list) {
      const key = isProtocol(ex) ? "tests" : ["plan", "recent", "templates"].find((k) => sets[k].has(ex.id)) ?? categoryGroup(ex);
      by[key].push(ex);
    }
    groups = keys.map((key) => ({ key, label: SECTION_LABELS[key], rows: by[key] }));
  }
  const total = groups.reduce((n, g) => n + g.rows.length, 0);
  let left = cap;
  const sections = [];
  for (const g of groups) {
    const take = g.rows.slice(0, Math.max(0, left));
    left -= take.length;
    if (take.length) sections.push({ ...g, rows: take });
  }
  return { sections, shown: Math.min(total, cap), total };
}

// ── The kit for this sheet ────────────────────────────────────────────────────
// `chips` are the toggleable kit values (EQUIPMENT_OPTIONS minus the always-
// owned); the profile pre-selects them. Profile items without a chip stay owned.
// Nothing here writes the profile.
export const chipsOnFor = (profileKit, chips) => chips.filter((c) => (profileKit ?? ["none"]).includes(c));
export function sheetKit(profileKit, chips, on) {
  const kept = (profileKit ?? ["none"]).filter((e) => !chips.includes(e));
  return new Set([...kept, ...on, ...ALWAYS_OWNED]);
}

// `owned` is a Set (or array) of the equipment the sheet has; none and chair
// are always owned. Returns what to list and what the query found anywhere:
//   matchedAny   — some exercise in the (category's) library fits the query
//   matchedOwned — some exercise that fits the query is also inside the kit
export function filterLibrary(library, { query = "", owned = [], showAll = false, category = "all", context = {} } = {}) {
  const kit = new Set([...owned, ...ALWAYS_OWNED]);
  const terms = expandQuery(query);
  const inCat = (library ?? []).filter((ex) => category === "all" || categoryGroup(ex) === category);
  const matches = terms.length ? inCat.filter((ex) => matchRank(ex, terms) !== -1) : inCat;
  const inKit = (ex) => equipOf(ex).every((e) => kit.has(e));
  const listed = matches.filter((ex) => showAll || inKit(ex));
  const { sections, shown, total } = orderLibrary(listed, context, { query });
  return { results: sections.flatMap((s) => s.rows), sections, shown, total, matchedAny: matches.length > 0, matchedOwned: matches.some(inKit) };
}

// The (translated) text for an empty list.
// A kit message is only true when something DID match outside the kit.
export function emptyMessage({ query = "", showAll = false, matchedAny = false, matchedOwned = false } = {}) {
  const q = String(query ?? "").trim();
  if (q && !matchedAny) return t("No exercise found for '{q}'", { q });
  if (!showAll && matchedAny && !matchedOwned) return t("Nothing matches your equipment — try Show all.");
  return t("Nothing found.");
}

// ── Context: what the user is most likely to want (EigenTraining, PlanWeekView) ──
// recentIds = exercises of executions dated today or in the 14 days before.
const dayNum = (d) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86400000);
export function pickerContextFrom({ plan = null, history = [], templates = [], today } = {}) {
  const ids = (steps) => (steps ?? []).map((s) => s?.exercise_id).filter(Boolean);
  const now = dayNum(today ?? new Date().toISOString().slice(0, 10));
  const recent = (history ?? []).filter((e) => { const d = dayNum(e?.date); return d <= now && d >= now - 14; });
  return {
    planIds: [...new Set(ids(plan?.steps))],
    recentIds: [...new Set(recent.flatMap((e) => ids(e.steps)))],
    templateIds: [...new Set((templates ?? []).flatMap((tp) => ids(tp?.steps)))],
  };
}

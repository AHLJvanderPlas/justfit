// v1.1 — the picker's miss message; v1.3 — order, sections, synonyms, cap report, kit chips. A kit message is only true when something DID
// match outside the kit; "opdrukken" with nothing in the library must never blame
// the user's equipment.
import { describe, it, expect, beforeAll, vi } from 'vitest';
import fs from 'node:fs';

// i18n.js reads localStorage at import; Dutch is its default.
let filterLibrary, emptyMessage, orderLibrary, expandQuery, SYNONYMS, sheetKit, chipsOnFor, pickerContextFrom, isTest;
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  ({ filterLibrary, emptyMessage, orderLibrary, expandQuery, SYNONYMS, sheetKit, chipsOnFor, pickerContextFrom, isTest } = await import('../src/exerciseSearch.js'));
});
const ex = (slug, name, equipment = ['none']) => ({ id: slug, slug, name, equipment_required_json: JSON.stringify(equipment) });
const lib = [ex('push-up', 'Push-up'), ex('plank', 'Plank'), ex('barbell-squat', 'Barbell Squat', ['barbell']), ex('air-squat', 'Air Squat')];

describe('filterLibrary', () => {
  it('lists the kit by default, alphabetical', () => {
    const r = filterLibrary(lib, { query: '', owned: ['none'], showAll: false });
    expect(r.results.map((e) => e.name)).toEqual(['Air Squat', 'Plank', 'Push-up']);
  });
  it('a query matching only outside the kit: no results, matchedAny but not matchedOwned', () => {
    const r = filterLibrary(lib, { query: 'barbell', owned: ['none'], showAll: false });
    expect(r).toMatchObject({ results: [], matchedAny: true, matchedOwned: false });
  });
  it('Toon alles lifts the kit', () => {
    expect(filterLibrary(lib, { query: 'barbell', owned: ['none'], showAll: true }).results).toHaveLength(1);
  });
  it('a query matching nothing at all', () => {
    expect(filterLibrary(lib, { query: 'xyz', owned: ['none'] })).toMatchObject({ results: [], matchedAny: false, matchedOwned: false });
  });
  it('caps at 40', () => {
    const many = Array.from({ length: 60 }, (_, i) => ex(`e${i}`, `Ex ${String(i).padStart(2, '0')}`));
    expect(filterLibrary(many, { owned: ['none'] }).results).toHaveLength(40);
  });
});

describe('emptyMessage', () => {
  const table = [
    ['nothing matches the query (kit on)', { query: 'opdrukken', showAll: false, matchedAny: false, matchedOwned: false }, "Geen oefening gevonden voor 'opdrukken'"],
    ['nothing matches the query (show all)', { query: 'opdrukken', showAll: true, matchedAny: false, matchedOwned: false }, "Geen oefening gevonden voor 'opdrukken'"],
    ['matches exist, none in the kit', { query: 'barbell', showAll: false, matchedAny: true, matchedOwned: false }, 'Niets past bij je uitrusting — probeer Toon alles.'],
    ['empty query, nothing in the kit', { query: '', showAll: false, matchedAny: true, matchedOwned: false }, 'Niets past bij je uitrusting — probeer Toon alles.'],
    ['show all, empty library', { query: '', showAll: true, matchedAny: false, matchedOwned: false }, 'Niets gevonden.'],
  ];
  for (const [name, input, want] of table) it(name, () => expect(emptyMessage(input)).toBe(want));

  it('"opdrukken" with nothing matching never mentions the kit', () => {
    for (const showAll of [false, true]) {
      expect(emptyMessage({ query: 'opdrukken', showAll, matchedAny: false, matchedOwned: false })).not.toMatch(/uitrusting/i);
    }
  });
  it('wired to filterLibrary end to end', () => {
    const miss = filterLibrary(lib, { query: 'xyz', owned: ['none'] });
    expect(emptyMessage({ query: 'xyz', showAll: false, ...miss })).toBe("Geen oefening gevonden voor 'xyz'");
    const kit = filterLibrary(lib, { query: 'barbell', owned: ['none'] });
    expect(emptyMessage({ query: 'barbell', showAll: false, ...kit })).toMatch(/uitrusting/);
  });
});

// ── v1.3 ──────────────────────────────────────────────────────────────────────
const row = (slug, name, category, { tags = [], equipment = ['none'] } = {}) =>
  ({ id: slug, slug, name, category, tags_json: JSON.stringify(tags), equipment_required_json: JSON.stringify(equipment) });
const mini = [
  row('12-min-cooper', '12-Minute Cooper Test', 'cardio', { tags: ['protocol', 'measurable'] }),
  row('air-squat', 'Air Squat', 'strength'),
  row('90-90-stretch', '90-90 Stretch', 'mobility'),
  row('hip-flexor-stretch', 'Hip Flexor Stretch', 'mobility'),
  row('plank', 'Plank', 'strength'),
  row('push-up', 'Push-up', 'strength'),
  row('pike-push-up', 'Pike Push-up', 'strength'),
  row('box-breathing', 'Box Breathing', 'recovery'),
  row('jumping-jacks', 'Jumping Jacks', 'cardio'),
  row('handstand', 'Handstand', 'skill'),
  row('ruck-test', 'Assessment Ruck', 'cardio', { tags: ['assessment'] }),
];
const names = (r) => r.sections.map((s) => [s.key, s.rows.map((e) => e.name)]);

describe('orderLibrary — empty query', () => {
  const ctx = { planIds: ['pike-push-up'], recentIds: ['push-up', 'pike-push-up'], templateIds: ['plank', 'push-up'] };
  let r; beforeAll(() => { r = orderLibrary(mini, ctx); });
  it('plan first, then recent, then trainings, then the library by category, tests last', () => {
    expect(names(r)).toEqual([
      ['plan', ['Pike Push-up']],
      ['recent', ['Push-up']],
      ['templates', ['Plank']],
      ['strength', ['Air Squat', 'Handstand']],
      ['cardio', ['Jumping Jacks']],
      ['mobility', ['Hip Flexor Stretch', '90-90 Stretch']],
      ['recovery', ['Box Breathing']],
      ['tests', ['Assessment Ruck', '12-Minute Cooper Test']],
    ]);
  });
  it('a row in the plan does not repeat in "recent" (first section wins)', () => {
    const all = r.sections.flatMap((s) => s.rows.map((e) => e.id));
    expect(all.filter((id) => id === 'pike-push-up')).toHaveLength(1);
    expect(new Set(all).size).toBe(all.length);
  });
  it('protocol rows go last even when alphabetically first, and even when in the plan', () => {
    const p = orderLibrary(mini, { planIds: ['12-min-cooper'] });
    expect(p.sections[0].rows[0].name).not.toMatch(/Cooper/);
    expect(p.sections.at(-1).key).toBe('tests');
    expect(p.sections.at(-1).rows.map((e) => e.name)).toContain('12-Minute Cooper Test');
  });
  it('digit-led names after letters within a category', () => {
    expect(r.sections.find((s) => s.key === 'mobility').rows.map((e) => e.name)).toEqual(['Hip Flexor Stretch', '90-90 Stretch']);
  });
  it('skill (and mixed) fall under Kracht', () => {
    expect(r.sections.find((s) => s.key === 'strength').rows.map((e) => e.name)).toContain('Handstand');
  });
  it('the cap is applied across sections and reported', () => {
    const c = orderLibrary(mini, ctx, { cap: 4 });
    expect(c).toMatchObject({ shown: 4, total: mini.length });
    expect(c.sections.flatMap((s) => s.rows)).toHaveLength(4);
  });
});

describe('orderLibrary — a query collapses the sections to one ranked list', () => {
  it('name starts with → contains → slug contains', () => {
    const lib2 = [row('wall-push', 'Wall Press', 'strength'), row('pike-push-up', 'Pike Push-up', 'strength'), row('push-up', 'Push-up', 'strength'), row('push-up-hold', 'Push-up Hold', 'strength')];
    const r = orderLibrary(lib2, { planIds: ['pike-push-up'] }, { query: 'push' });
    expect(names(r)).toEqual([['results', ['Push-up', 'Push-up Hold', 'Pike Push-up', 'Wall Press']]]);
    expect(r.sections[0].label).toBeNull();
  });
});

describe('expandQuery — the synonym table', () => {
  const table = [
    ['opdrukken', ['push-up']], ['optrekken', ['pull-up', 'chin-up']], ['kniebuiging', ['squat']], ['uitvalspas', ['lunge']],
    ['buikspieren', ['sit-up', 'crunch']], ['rugspieren', ['row', 'superman']], ['schouders', ['shoulder']], ['benen', ['leg', 'squat']],
    ['billen', ['glute', 'bridge']], ['kuiten', ['calf']], ['plank', ['plank']], ['burpee', ['burpee']], ['touwtjespringen', ['jump rope']],
    ['hardlopen', ['run']], ['rennen', ['run']], ['wandelen', ['walk']], ['fietsen', ['bike', 'cycling']], ['roeien', ['rowing']],
    ['rekken', ['stretch']], ['stretchen', ['stretch']], ['ademhaling', ['breathing']], ['heup', ['hip']], ['rug', ['back']],
    ['borst', ['chest']], ['armen', ['arm', 'curl', 'press']], ['dip', ['dip']], ['brug', ['bridge']], ['klimmen', ['climber']],
    ['springen', ['jump']], ['zwaaien', ['swing']], ['halter', ['dumbbell']], ['gewicht', ['weight']], ['band', ['band']],
    ['bal', ['ball']], ['bank', ['bench']], ['trap', ['step']], ['zit', ['seated']], ['lig', ['lying']], ['staand', ['standing']],
  ];
  for (const [nl, en] of table) it(`${nl} → ${en.join(', ')}`, () => expect(SYNONYMS[nl]).toEqual(en));
  it('at least forty entries, every value non-empty English', () => {
    expect(Object.keys(SYNONYMS).length).toBeGreaterThanOrEqual(40);
    for (const v of Object.values(SYNONYMS)) expect(v.length).toBeGreaterThan(0);
  });
  it('the query itself comes first, then its synonyms; case and spaces do not matter', () => {
    expect(expandQuery('  Opdrukken ')).toEqual(['opdrukken', 'push-up']);
    expect(expandQuery('plank')).toEqual(['plank']);
    expect(expandQuery('')).toEqual([]);
    expect(expandQuery('halter bank')).toEqual(['halter bank', 'dumbbell', 'bench']);
  });
  it('while typing: a ≥5-letter prefix of a key expands, a short one does not', () => {
    expect(expandQuery('opdruk')).toEqual(['opdruk', 'push-up']);
    expect(expandQuery('opd')).toEqual(['opd']);
  });
  it('a synonym matches at a word start only ("armen" does not find Warm-up)', () => {
    const r = orderLibrary([row('easy-jog-warm-up', 'Easy Jog Warm-up', 'cardio'), row('arm-circles', 'Arm Circles', 'mobility')], {}, { query: 'armen' });
    expect(r.sections[0].rows.map((e) => e.name)).toEqual(['Arm Circles']);
  });
});

describe('the fixture library (scripts/fixtures/planner-exercises.json)', () => {
  const fixture = JSON.parse(fs.readFileSync(new URL('../../../scripts/fixtures/planner-exercises.json', import.meta.url), 'utf8'))
    .map((e) => ({ ...e, id: e.slug }));
  it('"opdrukken" ranks Push-up first', () => {
    const r = filterLibrary(fixture, { query: 'opdrukken', owned: ['none'] });
    expect(r.results[0].name).toBe('Push-up');
  });
  it('a bodyweight profile: 40 shown of 117 (the fixture has 183 rows, not the live 482)', () => {
    expect(fixture).toHaveLength(183);
    const r = filterLibrary(fixture, { owned: ['none'] });
    expect(r).toMatchObject({ shown: 40, total: 117 });
    expect(r.results).toHaveLength(40);
  });
  it('the Cooper test does not lead an empty-query list; tests are the last section', () => {
    const r = filterLibrary(fixture, { owned: ['none'], showAll: true });
    expect(r.results[0].name).not.toMatch(/cooper/i);
    const all = orderLibrary(fixture, {}, { cap: 1000 });
    expect(all.sections.at(-1).key).toBe('tests');
    expect(all.sections.at(-1).rows.some((e) => /cooper/i.test(e.name))).toBe(true);
  });
  it('a category chip narrows to that category', () => {
    const r = filterLibrary(fixture, { owned: ['none'], category: 'mobility', context: { planIds: ['push-up'] } });
    expect(r.results.every((e) => e.category === 'mobility')).toBe(true);
    expect(r.sections.map((s) => s.key)).not.toContain('plan');
  });
});

describe('kit chips — this sheet only', () => {
  const chips = ['dumbbell', 'resistance_bands', 'pull_up_bar'];
  const lib3 = [row('push-up', 'Push-up', 'strength'), row('db-row', 'Dumbbell Row', 'strength', { equipment: ['dumbbell'] }),
    row('kb-swing', 'Kettlebell Swing', 'strength', { equipment: ['kettlebell'] }), row('chair-dip', 'Chair Dip', 'strength', { equipment: ['chair'] })];
  const listed = (on, profile = ['none']) => filterLibrary(lib3, { owned: sheetKit(profile, chips, on) }).results.map((e) => e.name);
  it('the profile pre-selects the chips it owns', () => {
    expect(chipsOnFor(['none', 'dumbbell', 'kettlebell'], chips)).toEqual(['dumbbell']);
    expect(chipsOnFor(undefined, chips)).toEqual([]);
  });
  it('a bodyweight sheet: none and chair only', () => expect(listed([])).toEqual(['Chair Dip', 'Push-up']));
  it('Dumbbell on for today → dumbbell rows appear', () => expect(listed(['dumbbell'])).toEqual(['Chair Dip', 'Dumbbell Row', 'Push-up']));
  it('switching a profile chip off narrows; a profile item without a chip stays owned', () => {
    const profile = ['none', 'dumbbell', 'kettlebell'];
    expect(listed(['dumbbell'], profile)).toEqual(['Chair Dip', 'Dumbbell Row', 'Kettlebell Swing', 'Push-up']);
    expect(listed([], profile)).toEqual(['Chair Dip', 'Kettlebell Swing', 'Push-up']);
  });
  it('the profile array is never mutated', () => {
    const profile = ['none', 'dumbbell'];
    sheetKit(profile, chips, []);
    expect(profile).toEqual(['none', 'dumbbell']);
  });
});

describe('TEST marker and context', () => {
  it('protocol, assessment and measurable rows are marked TEST', () => {
    expect(isTest(row('a', 'A', 'cardio', { tags: ['protocol'] }))).toBe(true);
    expect(isTest(row('a', 'A', 'cardio', { tags: ['assessment'] }))).toBe(true);
    expect(isTest(row('a', 'A', 'strength', { tags: ['measurable'] }))).toBe(true);
    expect(isTest(row('a', 'A', 'strength', { tags: ['bodyweight'] }))).toBe(false);
  });
  it('pickerContextFrom: plan steps, the last 14 days of history, saved trainings', () => {
    const ctx = pickerContextFrom({
      today: '2026-10-31',
      plan: { steps: [{ exercise_id: 'p1' }, { exercise_id: 'p1' }, { name: 'no id' }] },
      history: [
        { date: '2026-10-31', steps: [{ exercise_id: 'r1' }] },
        { date: '2026-10-17', steps: [{ exercise_id: 'r2' }, { exercise_id: null }] },
        { date: '2026-10-16', steps: [{ exercise_id: 'old' }] },
        { date: '2026-11-01', steps: [{ exercise_id: 'future' }] },
        { date: '2026-10-20' },
      ],
      templates: [{ steps: [{ exercise_id: 't1' }, { exercise_id: 't2' }] }, { steps: [] }],
    });
    expect(ctx).toEqual({ planIds: ['p1'], recentIds: ['r1', 'r2'], templateIds: ['t1', 't2'] });
  });
  it('pickerContextFrom without data is empty, never throws', () => {
    expect(pickerContextFrom({ plan: null, history: null, templates: null, today: '2026-10-31' })).toEqual({ planIds: [], recentIds: [], templateIds: [] });
  });
});

// v1.1 — the picker's miss message. A kit message is only true when something DID
// match outside the kit; "opdrukken" with nothing in the library must never blame
// the user's equipment.
import { describe, it, expect, beforeAll, vi } from 'vitest';

// i18n.js reads localStorage at import; Dutch is its default.
let filterLibrary, emptyMessage;
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {}, removeItem: () => {} });
  ({ filterLibrary, emptyMessage } = await import('../src/exerciseSearch.js'));
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
    expect(filterLibrary(lib, { query: 'opdrukken', owned: ['none'] })).toMatchObject({ results: [], matchedAny: false, matchedOwned: false });
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
    const miss = filterLibrary(lib, { query: 'opdrukken', owned: ['none'] });
    expect(emptyMessage({ query: 'opdrukken', showAll: false, ...miss })).toBe("Geen oefening gevonden voor 'opdrukken'");
    const kit = filterLibrary(lib, { query: 'barbell', owned: ['none'] });
    expect(emptyMessage({ query: 'barbell', showAll: false, ...kit })).toMatch(/uitrusting/);
  });
});

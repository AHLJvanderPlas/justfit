import { describe, it, expect } from 'vitest';
import {
  RUN_PROGRAMS,
  RUN_WARMUP_TAG,
  buildRunProgramsFromTemplates,
} from '../functions/api/_shared/running.js';

// ── RUN_PROGRAMS ──────────────────────────────────────────────────────────────

describe('RUN_PROGRAMS', () => {
  const standardDistances = [5, 10, 15, 20, 30];
  const extendedDistances = [10.5, 21.1, 25, 35, 40, 42.2, 45, 50];

  it('has all standard distances', () => {
    for (const d of standardDistances) {
      expect(RUN_PROGRAMS[d]).toBeDefined();
    }
  });

  it('has extended distances', () => {
    for (const d of extendedDistances) {
      expect(RUN_PROGRAMS[d]).toBeDefined();
    }
  });

  it('all programmes are non-empty arrays', () => {
    for (const [km, weeks] of Object.entries(RUN_PROGRAMS)) {
      expect(Array.isArray(weeks)).toBe(true);
      expect(weeks.length).toBeGreaterThan(0, `${km}km programme is empty`);
    }
  });

  it('each week entry has hiit and zone2 numeric fields', () => {
    for (const [km, weeks] of Object.entries(RUN_PROGRAMS)) {
      for (const [i, week] of weeks.entries()) {
        expect(typeof week.hiit).toBe('number', `${km}km week ${i} missing hiit`);
        expect(typeof week.zone2).toBe('number', `${km}km week ${i} missing zone2`);
      }
    }
  });

  it('hiit and zone2 levels are positive integers', () => {
    for (const [, weeks] of Object.entries(RUN_PROGRAMS)) {
      for (const week of weeks) {
        expect(week.hiit).toBeGreaterThan(0);
        expect(week.zone2).toBeGreaterThan(0);
        expect(Number.isInteger(week.hiit)).toBe(true);
        expect(Number.isInteger(week.zone2)).toBe(true);
      }
    }
  });

  it('zone2 levels stay at or below 21 (max exercise level in DB)', () => {
    for (const [km, weeks] of Object.entries(RUN_PROGRAMS)) {
      for (const [i, week] of weeks.entries()) {
        expect(week.zone2).toBeLessThanOrEqual(21, `${km}km week ${i} zone2=${week.zone2} exceeds DB max`);
      }
    }
  });

  it('longer distance programmes have more weeks', () => {
    expect(RUN_PROGRAMS[30].length).toBeGreaterThan(RUN_PROGRAMS[5].length);
    expect(RUN_PROGRAMS[42.2].length).toBeGreaterThan(RUN_PROGRAMS[10].length);
  });

  it('5km programme is at least 8 weeks', () => {
    expect(RUN_PROGRAMS[5].length).toBeGreaterThanOrEqual(8);
  });

  it('zone2 levels generally increase across weeks for standard distances', () => {
    for (const d of standardDistances) {
      const weeks = RUN_PROGRAMS[d];
      let increasedAtLeastOnce = false;
      for (let i = 1; i < weeks.length; i++) {
        if (weeks[i].zone2 > weeks[i - 1].zone2) { increasedAtLeastOnce = true; break; }
      }
      expect(increasedAtLeastOnce).toBe(true, `${d}km zone2 levels never increase`);
    }
  });
});

// ── RUN_WARMUP_TAG ────────────────────────────────────────────────────────────

describe('RUN_WARMUP_TAG', () => {
  it('is a non-empty string', () => {
    expect(typeof RUN_WARMUP_TAG).toBe('string');
    expect(RUN_WARMUP_TAG.length).toBeGreaterThan(0);
  });
});

// ── buildRunProgramsFromTemplates ─────────────────────────────────────────────

describe('buildRunProgramsFromTemplates', () => {
  const mockRows = [
    { program_template_id: 'run-5km', block_week: 1, session_order: 1, slug: 'run-interval-level-2' },
    { program_template_id: 'run-5km', block_week: 1, session_order: 2, slug: 'run-continuous-level-7' },
    { program_template_id: 'run-5km', block_week: 2, session_order: 1, slug: 'run-interval-level-3' },
    { program_template_id: 'run-5km', block_week: 2, session_order: 2, slug: 'run-continuous-level-8' },
    { program_template_id: 'run-10km', block_week: 1, session_order: 1, slug: 'run-interval-level-3' },
    { program_template_id: 'run-10km', block_week: 1, session_order: 2, slug: 'run-continuous-level-8' },
  ];

  it('returns an empty object for empty rows', () => {
    expect(buildRunProgramsFromTemplates([])).toEqual({});
  });

  it('groups rows by distance', () => {
    const result = buildRunProgramsFromTemplates(mockRows);
    expect(result[5]).toBeDefined();
    expect(result[10]).toBeDefined();
  });

  it('each distance has the correct number of weeks', () => {
    const result = buildRunProgramsFromTemplates(mockRows);
    expect(result[5]).toHaveLength(2);
    expect(result[10]).toHaveLength(1);
  });

  it('extracts hiit level from session_order 1', () => {
    const result = buildRunProgramsFromTemplates(mockRows);
    expect(result[5][0].hiit).toBe(2); // run-interval-level-2
  });

  it('extracts zone2 level from session_order 2', () => {
    const result = buildRunProgramsFromTemplates(mockRows);
    expect(result[5][0].zone2).toBe(7); // run-continuous-level-7
  });

  it('levels increase across weeks matching mock data', () => {
    const result = buildRunProgramsFromTemplates(mockRows);
    expect(result[5][1].hiit).toBe(3);
    expect(result[5][1].zone2).toBe(8);
  });

  it('handles fractional km distances (e.g. 21.1 for half marathon)', () => {
    const halfRows = [
      { program_template_id: 'run-21.1km', block_week: 1, session_order: 1, slug: 'run-interval-level-5' },
      { program_template_id: 'run-21.1km', block_week: 1, session_order: 2, slug: 'run-continuous-level-10' },
    ];
    const result = buildRunProgramsFromTemplates(halfRows);
    expect(result[21.1]).toBeDefined();
    expect(result[21.1][0].hiit).toBe(5);
  });
});

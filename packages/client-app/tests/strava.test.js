import { describe, it, expect } from 'vitest';
import {
  EXERCISE_TYPE_BY_SLUG,
  exerciseTypeFor,
  isUploadableCategory,
  rankMuscles,
  muscleLabel,
} from '../../../functions/api/_shared/strava-exercises.js';
import {
  SPORT_CATEGORY,
  EXEC_TYPE_FOR,
  categorise,
  hasScope,
  readRateLimit,
  CACHE_TTL_MS,
  apiBase,
} from '../../../functions/api/_shared/strava.js';
import STRAVA_EXERCISE_TYPES from './strava-exercise-types.json';

const VALID = new Set(STRAVA_EXERCISE_TYPES);

// ── Exercise-type enum conformance ────────────────────────────────────────────
// Strava rejects an upload outright if any set carries an exercise_type outside
// its published enum, and the failure surfaces only at upload time. This guard
// turns that into a build-time failure instead.

describe('Strava exercise_type mapping', () => {
  it('only emits identifiers from the published Strava enum', () => {
    const invalid = Object.entries(EXERCISE_TYPE_BY_SLUG)
      .filter(([, type]) => !VALID.has(type))
      .map(([slug, type]) => `${slug} → ${type}`);
    expect(invalid).toEqual([]);
  });

  it('falls back to a valid enum member for every category', () => {
    for (const category of ['strength', 'cardio', 'mixed', 'skill', 'mobility', 'recovery']) {
      const type = exerciseTypeFor({ slug: 'does-not-exist-anywhere', category });
      expect(VALID.has(type), `${category} → ${type}`).toBe(true);
    }
  });

  it('falls back to a valid enum member for a null exercise', () => {
    expect(VALID.has(exerciseTypeFor(null))).toBe(true);
    expect(VALID.has(exerciseTypeFor(undefined))).toBe(true);
  });

  it('prefers the specific mapping over the category fallback', () => {
    expect(exerciseTypeFor({ slug: 'wall-sit', category: 'strength' })).toBe('WALL_SIT');
    expect(exerciseTypeFor({ slug: 'diamond-push-up', category: 'strength' })).toBe('DIAMOND_PUSH_UP');
  });

  it('excludes breathwork and meditation from uploads', () => {
    expect(isUploadableCategory('recovery')).toBe(false);
    expect(isUploadableCategory('strength')).toBe(true);
    expect(isUploadableCategory('cardio')).toBe(true);
    expect(isUploadableCategory('mobility')).toBe(true);
  });
});

// ── Muscle summary (the text stand-in for the muscle map) ─────────────────────

describe('muscle summary', () => {
  it('ranks muscles by set volume, heaviest first', () => {
    const ranked = rankMuscles([
      { muscles: ['chest', 'triceps'], sets: 4 },
      { muscles: ['quads'], sets: 1 },
      { muscles: ['chest'], sets: 3 },
    ]);
    expect(ranked[0].label).toBe('Chest');
    expect(ranked[0].score).toBe(7);
    expect(ranked.map((r) => r.label)).toContain('Quads');
  });

  it('caps the list at the requested length', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({ muscles: [`m${i}`], sets: 1 }));
    expect(rankMuscles(entries, 6)).toHaveLength(6);
  });

  it('handles entries with no muscles recorded', () => {
    expect(rankMuscles([{ muscles: undefined, sets: 2 }])).toEqual([]);
    expect(rankMuscles([])).toEqual([]);
  });

  it('humanises unknown muscle keys rather than dropping them', () => {
    expect(muscleLabel('rotator_cuff')).toBe('Rotator Cuff');
    expect(muscleLabel('quads')).toBe('Quads');
  });
});

// ── Sport classification ──────────────────────────────────────────────────────

describe('sport classification', () => {
  it('covers the sport types Strava added on 2026-04-30', () => {
    for (const t of ['Basketball', 'Cricket', 'Dance', 'Padel', 'PhysicalTherapy', 'Volleyball']) {
      expect(SPORT_CATEGORY[t], t).toBeDefined();
    }
  });

  it('maps every category to a known execution type', () => {
    for (const category of new Set(Object.values(SPORT_CATEGORY))) {
      expect(EXEC_TYPE_FOR[category], category).toMatch(/^strava_/);
    }
  });

  it('prefers sport_type over the legacy type field', () => {
    expect(categorise({ sport_type: 'GravelRide', type: 'Ride' }).sportType).toBe('GravelRide');
    expect(categorise({ sport_type: 'GravelRide' }).category).toBe('cycling');
  });

  it('degrades an unknown sport to fitness rather than throwing', () => {
    const r = categorise({ sport_type: 'UnderwaterBasketWeaving' });
    expect(r.category).toBe('fitness');
    expect(r.execType).toBe('strava_workout');
  });
});

// ── Scope handling (§7.2 — honour what was actually granted) ──────────────────

describe('granted scopes', () => {
  it('reads space-delimited scopes as Strava returns them', () => {
    const conn = { scope_granted: 'read,activity:read_all activity:write' };
    expect(hasScope(conn, 'activity:write')).toBe(true);
    expect(hasScope(conn, 'activity:read_all')).toBe(true);
  });

  it('denies a scope that was not granted', () => {
    expect(hasScope({ scope_granted: 'activity:read_all' }, 'activity:write')).toBe(false);
  });

  it('denies everything when no scope is recorded', () => {
    expect(hasScope({ scope_granted: null }, 'activity:write')).toBe(false);
    expect(hasScope(null, 'activity:write')).toBe(false);
  });

  it('does not match on a substring', () => {
    expect(hasScope({ scope_granted: 'activity:read' }, 'activity:read_all')).toBe(false);
  });
});

// ── Rate limits and retention ─────────────────────────────────────────────────

describe('rate limit parsing', () => {
  const headers = (map) => ({ headers: { get: (k) => map[k] ?? null } });

  it('prefers the read-specific headers', () => {
    const r = readRateLimit(headers({
      'X-ReadRateLimit-Limit': '100,1000',
      'X-ReadRateLimit-Usage': '50,200',
      'X-RateLimit-Limit': '200,2000',
      'X-RateLimit-Usage': '10,20',
    }));
    expect(r.limit).toEqual({ short: 100, daily: 1000 });
    expect(r.shortPct).toBeCloseTo(0.5);
  });

  it('falls back to the overall headers', () => {
    const r = readRateLimit(headers({
      'X-RateLimit-Limit': '200,2000',
      'X-RateLimit-Usage': '20,400',
    }));
    expect(r.usage).toEqual({ short: 20, daily: 400 });
    expect(r.dailyPct).toBeCloseTo(0.2);
  });

  it('returns null when Strava sends no usage headers', () => {
    expect(readRateLimit(headers({}))).toBeNull();
  });
});

describe('retention and configuration', () => {
  it('caps the cache at the seven days §6.2 allows', () => {
    expect(CACHE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('defaults to the current API base and honours the override', () => {
    expect(apiBase({})).toBe('https://www.strava.com/api/v3');
    expect(apiBase({ STRAVA_API_BASE: 'https://api-v3.strava.com/' })).toBe('https://api-v3.strava.com');
  });
});

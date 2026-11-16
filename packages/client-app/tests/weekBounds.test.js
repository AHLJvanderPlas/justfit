// UX review 2026-11-16, finding 12 — "Deze week" is the ISO week (Mon → Sun) everywhere.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { weekBounds, weekRangeLabel, selectedDay, dayRowKind } from '../src/weekPlan.js';
import { isoWeekStart } from '../../../functions/api/_shared/weekTarget.js';

describe('weekBounds', () => {
  it('Monday → Sunday around today, whatever the weekday', () => {
    for (const today of ['2026-11-16', '2026-11-18', '2026-11-22']) {
      const { start, end, days } = weekBounds(today);
      expect(start).toBe('2026-11-16');
      expect(end).toBe('2026-11-22');
      expect(days).toHaveLength(7);
      expect(days).toContain(today);
      expect(start).toBe(isoWeekStart(today));            // the same week the pill and the target count
    }
  });
  it('‹ › move by whole weeks, across a month and a year', () => {
    expect(weekBounds('2026-11-16', -1).start).toBe('2026-11-09');
    expect(weekBounds('2026-11-16', 1).days).toEqual(['2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28', '2026-11-29']);
    expect(weekBounds('2026-12-31').start).toBe('2026-12-28');
    expect(weekBounds('2026-12-31').end).toBe('2027-01-03');
  });
  it('today is selected by default; past days of the week can be logged, future ones are upcoming', () => {
    const { days } = weekBounds('2026-11-18');
    expect(selectedDay(days, '2026-11-18')).toBe('2026-11-18');
    expect(dayRowKind('2026-11-16', '2026-11-18', false)).toBe('log');
    expect(dayRowKind('2026-11-20', '2026-11-18', false)).toBe('upcoming');
  });
});

describe('weekRangeLabel', () => {
  it('names the week, Dutch and English', () => {
    expect(weekRangeLabel('2026-11-16', '2026-11-22', 'nl')).toBe('ma 16 – zo 22 nov');
    expect(weekRangeLabel('2026-11-16', '2026-11-22', 'en')).toBe('Mon 16 – Sun 22 Nov');
    expect(weekRangeLabel('2026-11-30', '2026-12-06', 'nl')).toBe('ma 30 nov – zo 6 dec');
  });
});

describe('PlanWeekView takes its strip from weekBounds', () => {
  it('no rolling "last 7 days" window or subtitle left', () => {
    const src = readFileSync(fileURLToPath(new URL('../src/PlanWeekView.jsx', import.meta.url)), 'utf8');
    expect(src).toMatch(/weekBounds\(today, weekOffset\)/);
    expect(src).not.toMatch(/Your last 7 days at a glance/);
    expect(src).not.toMatch(/getDate\(\) - 6 \+ i/);
  });
});

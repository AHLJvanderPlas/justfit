// UX review 2026-11-16, finding 5 — every number has a label; nothing unrecorded prints as 0.
// The suite runs in Dutch, the default.
import { describe, it, expect } from 'vitest';
import { formatSeconds, formatSetValue, formatSets, stepResult, sessionMinutes, todayStripLabel } from '../src/setFormat.js';

const step = (prescribed, actual) => ({
  prescribed_json: prescribed ? JSON.stringify(prescribed) : null,
  actual_json: actual ? JSON.stringify(actual) : null,
});

describe('formatSeconds / formatSetValue / formatSets', () => {
  it('seconds under a minute, minutes above, never 0', () => {
    expect(formatSeconds(30)).toBe('30s');
    expect(formatSeconds(60)).toBe('1 min');
    expect(formatSeconds(90)).toBe('1:30 min');
    expect(formatSeconds(0)).toBeNull();
    expect(formatSeconds(null)).toBeNull();
  });
  it('a value is reps or seconds, with its unit', () => {
    expect(formatSetValue(10, false)).toBe('10 herhalingen');
    expect(formatSetValue(30, true)).toBe('30s');
    expect(formatSetValue(0, true)).toBeNull();
  });
  it('sets × value; the value is left out when it is unknown', () => {
    expect(formatSets(3, 10, false)).toBe('3 sets × 10 herhalingen');
    expect(formatSets(1, 30, true)).toBe('1 set × 30s');
    expect(formatSets(1, 0, true)).toBe('1 set');
    expect(formatSets(0, 10, false)).toBeNull();
  });
});

describe('stepResult — one line for Deze week and Voortgang', () => {
  it('a 30 s hold reads 30s, not "1min" (Voortgang rounded it to a minute)', () => {
    expect(stepResult(step({ sets: 1, duration_sec: 30 }, { sets_completed: 1, reps_per_set: [30] }))).toBe('1 set × 30s');
  });
  it('a timed set recorded as 0 s (before release A) is "1 set", never "× 0s"', () => {
    expect(stepResult(step({ sets: 1, duration_sec: 30 }, { sets_completed: 1, reps_per_set: [0] }))).toBe('1 set');
  });
  it('averages only the recorded values', () => {
    expect(stepResult(step({ sets: 3, reps: 10 }, { sets_completed: 3, reps_per_set: [10, 0, 8] }))).toBe('3 sets × 9 herhalingen');
  });
  it('skipped and not completed are words', () => {
    expect(stepResult(step({ sets: 3, reps: 10 }, { sets_completed: 0, skipped: true }))).toBe('overgeslagen');
    expect(stepResult(step({ sets: 3, reps: 10 }, { sets_completed: 0, reps_per_set: [] }))).toBe('niet afgerond');
  });
  it('falls back to the prescription when nothing was recorded', () => {
    expect(stepResult(step({ sets: 3, reps: 12 }, null))).toBe('3 sets × 12 herhalingen');
    expect(stepResult(step({ sets: 2, duration_sec: 45 }, null))).toBe('2 sets × 45s');
  });
});

describe('sessionMinutes', () => {
  it('omits an unknown or sub-half-minute duration instead of "0 min"', () => {
    expect(sessionMinutes(null)).toBeNull();
    expect(sessionMinutes(0)).toBeNull();
    expect(sessionMinutes(20)).toBeNull();
    expect(sessionMinutes(40)).toBe('1 min');
    expect(sessionMinutes(725)).toBe('12 min');
  });
});

describe('todayStripLabel', () => {
  it('nothing on day one rather than a bare "0"', () => {
    expect(todayStripLabel(0, 0)).toBeNull();
    expect(todayStripLabel(0, null)).toBeNull();
  });
  it('labels both numbers', () => {
    expect(todayStripLabel(1, 10)).toBe('Reeks 1 dag · Score 10');
    expect(todayStripLabel(3, 40)).toBe('Reeks 3 dagen · Score 40');
    expect(todayStripLabel(0, 30)).toBe('Score 30');
    expect(todayStripLabel(2, 0)).toBe('Reeks 2 dagen · Score 0');
  });
});

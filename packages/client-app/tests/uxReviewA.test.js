// UX review A — the exercise screen: the three-button rating and the wake-lock tip.
import { describe, it, expect } from 'vitest';
import { RATINGS, ratingToExertion, exertionToRating, canSaveRating } from '../src/sessionRating.js';
import { wakeTipDay, wakeTipSeenToday, markWakeTipSeen, wakeTipVisible } from '../src/wakeTip.js';
import { t } from '../src/i18n.js';

const memStore = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m }; };

describe('session rating → perceived_exertion', () => {
  it('maps the three buttons to the values the server reads: 3 / 5 / 8', () => {
    expect(ratingToExertion('easy')).toBe(3);
    expect(ratingToExertion('right')).toBe(5);
    expect(ratingToExertion('hard')).toBe(8);
    expect(RATINGS.map((r) => r.exertion)).toEqual([3, 5, 8]);
  });
  it('no rating (or an unknown key) saves null — "Beoordeling overslaan"', () => {
    expect(ratingToExertion(null)).toBe(null);
    expect(ratingToExertion(undefined)).toBe(null);
    expect(ratingToExertion('maybe')).toBe(null);
  });
  it('save is enabled only once one of the three is chosen', () => {
    expect(canSaveRating(null)).toBe(false);
    expect(canSaveRating('maybe')).toBe(false);
    for (const r of RATINGS) expect(canSaveRating(r.key)).toBe(true);
  });
  it('old slider values land in the nearest bucket; null stays null', () => {
    expect([1, 3, 4].map(exertionToRating)).toEqual(['easy', 'easy', 'easy']);
    expect([5, 6].map(exertionToRating)).toEqual(['right', 'right']);
    expect([7, 8, 10].map(exertionToRating)).toEqual(['hard', 'hard', 'hard']);
    expect(exertionToRating(null)).toBe(null);
  });
  it('the stored values are the ones every consumer keys on', () => {
    // score.js resilience bonus counts <= 4; execution.js TSS modifier {3,5,8}; R576 drift === 3 / === 8
    const [easy, right, hard] = RATINGS.map((r) => r.exertion);
    expect(easy <= 4).toBe(true);
    expect(right <= 4).toBe(false);
    expect(hard <= 4).toBe(false);
    expect({ 3: 0.85, 5: 1.0, 8: 1.15 }[easy]).toBe(0.85);
    expect({ 3: 0.85, 5: 1.0, 8: 1.15 }[hard]).toBe(1.15);
  });
  it('has no "RPE" in its labels, in either language', () => {
    for (const r of RATINGS) { expect(r.label).not.toMatch(/RPE/i); expect(t(r.label)).not.toMatch(/RPE/i); }
  });
});

describe('Dutch strings of the new screen', () => {
  it('reads Te licht / Net goed / Te zwaar and "Hoe zwaar was dit?"', () => {
    expect(RATINGS.map((r) => t(r.label))).toEqual(['Te licht', 'Net goed', 'Te zwaar']);
    expect(t('How hard was this?')).toBe('Hoe zwaar was dit?');
    expect(t('Add a note')).toBe('Notitie toevoegen');
    expect(t('Skip rating')).toBe('Beoordeling overslaan');
    expect(t('Finish set →')).toBe('Set afronden →');
    expect(t('Log session →')).toBe('Sessie opslaan →');
  });
});

describe('wake-lock tip', () => {
  const day = new Date(2026, 10, 16, 12);
  it('is keyed by the local day', () => { expect(wakeTipDay(day)).toBe('2026-11-16'); });
  it('is unseen until marked, then seen for that day only', () => {
    const s = memStore();
    expect(wakeTipSeenToday(s, day)).toBe(false);
    markWakeTipSeen(s, day);
    expect(wakeTipSeenToday(s, day)).toBe(true);
    expect(wakeTipSeenToday(s, new Date(2026, 10, 17, 9))).toBe(false);
  });
  it('survives a storage that throws (private window): never shown-forever, never a crash', () => {
    const bad = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(wakeTipSeenToday(bad, day)).toBe(false);
    expect(() => markWakeTipSeen(bad, day)).not.toThrow();
    expect(wakeTipSeenToday(undefined, day)).toBe(false);
  });
  it('shows only when denied + undismissed, on the first exercise instruction screen', () => {
    const base = { denied: true, open: true, phase: 'instruction', exIdx: 0 };
    expect(wakeTipVisible(base)).toBe(true);
    expect(wakeTipVisible({ ...base, denied: false })).toBe(false);
    expect(wakeTipVisible({ ...base, open: false })).toBe(false);
    for (const phase of ['working', 'resting', 'sessionFeedback', 'overview']) expect(wakeTipVisible({ ...base, phase })).toBe(false);
    expect(wakeTipVisible({ ...base, exIdx: 1 })).toBe(false);
  });
});

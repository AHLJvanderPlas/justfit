// UAT release 3 — Progress and the week, gated on data. The three-session gate, the
// strongest/weakest guard, the week pill, the body-mode numbers, the single "log" row of
// Deze week and what the Coach view prints.
import { describe, it, expect } from 'vitest';
import { INSIGHT_MIN_SESSIONS, insightsUnlocked, strongestWeakest } from '../src/progressGate.js';
import { weekPill, weekdayMondayFirst } from '../src/weekStatus.js';
import { pregnancyWeek, postnatalWeek, postnatalDays, postnatalLabel, pregnancyMilestone, postnatalMilestone } from '../src/bodyBanner.js';
import { selectedDay, dayRowKind, upcomingShown } from '../src/weekPlan.js';
import { ftpEntered, noSessionYet } from '../src/coachDisplay.js';

describe('progress gate — the insight blocks wait for three sessions', () => {
  it('opens at exactly three sessions that showed up', () => {
    expect(INSIGHT_MIN_SESSIONS).toBe(3);
    expect([0, 1, 2].map(insightsUnlocked)).toEqual([false, false, false]);
    expect([3, 4, 40].map(insightsUnlocked)).toEqual([true, true, true]);
    expect(insightsUnlocked(undefined)).toBe(false);
  });
});

describe('strongestWeakest — never "STERKSTE Duwen · 0" next to "ZWAKSTE Duwen · 0"', () => {
  const day1 = { strongest: { axis: 'push', score: 0 }, weakest: { axis: 'push', score: 0 } };
  const zeros = { push: 0, pull: 0, legs: 0, core: 0, conditioning: 0, mobility: 0 };
  it('hides both while every axis is 0', () => {
    expect(strongestWeakest(day1, zeros)).toEqual([]);
    expect(strongestWeakest({ strongest: { axis: 'push', score: 0 }, weakest: { axis: 'pull', score: 0 } }, zeros)).toEqual([]);
    // the radar shows 0 on every axis, so a pair from another basis would contradict it
    expect(strongestWeakest({ strongest: { axis: 'push', score: 40 }, weakest: { axis: 'pull', score: 10 } }, zeros)).toEqual([]);
  });
  it('hides both when they are the same axis, or carry the same score', () => {
    const scores = { push: 30, pull: 30, legs: 30, core: 30, conditioning: 30, mobility: 30 };
    expect(strongestWeakest({ strongest: { axis: 'push', score: 30 }, weakest: { axis: 'push', score: 30 } }, scores)).toEqual([]);
    expect(strongestWeakest({ strongest: { axis: 'push', score: 30 }, weakest: { axis: 'pull', score: 30 } }, scores)).toEqual([]);
  });
  it('shows the pair when they differ', () => {
    const scores = { push: 62, pull: 20, legs: 40, core: 40, conditioning: 40, mobility: 40 };
    const pair = strongestWeakest({ strongest: { axis: 'push', score: 62 }, weakest: { axis: 'pull', score: 20 } }, scores);
    expect(pair.map((p) => [p.key, p.axis, p.score])).toEqual([['strongest', 'push', 62], ['weakest', 'pull', 20]]);
  });
  it('shows a pair when only the weakest axis is zero', () => {
    const scores = { push: 40, pull: 0, legs: 10, core: 10, conditioning: 10, mobility: 10 };
    expect(strongestWeakest({ strongest: { axis: 'push', score: 40 }, weakest: { axis: 'pull', score: 0 } }, scores)).toHaveLength(2);
  });
  it('missing insights are an empty pair, not a crash', () => {
    expect(strongestWeakest(null, zeros)).toEqual([]);
    expect(strongestWeakest({ strongest: null, weakest: null })).toEqual([]);
  });
});

describe('weekPill — neutral until it has earned a verdict', () => {
  const pill = (target, done, weekday, daysSinceFirst) => weekPill({ target, done, weekday, daysSinceFirst });
  it('a met target is on track', () => {
    expect(pill(3, 3, 2, 30).kind).toBe('on-track');
    expect(pill(3, 5, 7, 0).kind).toBe('on-track');
  });
  it('the first seven days are never red, whatever the weekday', () => {
    expect(pill(3, 1, 7, 0)).toEqual({ kind: 'togo', toGo: 2 });
    expect(pill(4, 0, 4, 6)).toEqual({ kind: 'togo', toGo: 4 });
  });
  it('on pace for the days elapsed is neutral "n to go"', () => {
    expect(pill(3, 0, 2, 40)).toEqual({ kind: 'togo', toGo: 3 });   // Tuesday, nothing expected yet
    expect(pill(3, 2, 6, 40)).toEqual({ kind: 'togo', toGo: 1 });   // Saturday: floor(3*6/7) = 2
  });
  it('Monday to Wednesday is never red from week two either', () => {
    expect(pill(4, 0, 3, 40).kind).toBe('togo');
  });
  it('red only from the second week, Thursday or later, and behind', () => {
    expect(pill(3, 0, 4, 8).kind).toBe('behind');
    expect(pill(4, 1, 5, 40).kind).toBe('behind');
    expect(pill(4, 3, 7, 40).kind).toBe('building');   // 3/4 ≥ 60 % but pace says 4 — amber, not red
  });
  it('week 8 is the boundary: day 6 is still the first week, day 7 is not', () => {
    expect(pill(3, 0, 5, 6).kind).toBe('togo');
    expect(pill(3, 0, 5, 7).kind).toBe('behind');
  });
  it('weekday is Monday-first', () => {
    expect(weekdayMondayFirst(new Date('2026-11-02T12:00:00'))).toBe(1);   // Monday
    expect(weekdayMondayFirst(new Date('2026-11-01T12:00:00'))).toBe(7);   // Sunday
    expect(weekdayMondayFirst(new Date('2026-11-05T12:00:00'))).toBe(4);   // Thursday
  });
});

describe('body-mode numbers — one source (UAT D6)', () => {
  it('pregnancyWeek matches the server: 1-based, due date 280 days after the start', () => {
    // due 2027-03-01 → start 2026-05-25. 2026-11-01 is day 160 → week 23.
    expect(pregnancyWeek('2027-03-01', '2026-11-01')).toBe(23);
    expect(pregnancyWeek('2027-03-01', '2026-05-25')).toBe(1);
    expect(pregnancyWeek('2027-03-01', '2026-05-31')).toBe(1);
    expect(pregnancyWeek('2027-03-01', '2026-06-01')).toBe(2);
    expect(pregnancyWeek('2027-03-01', '2027-03-01')).toBe(41);
    expect(pregnancyWeek('2027-03-01', '2027-06-01')).toBe(42);   // capped
    expect(pregnancyWeek('2027-03-01', '2026-05-24')).toBe(null); // before the start
    expect(pregnancyWeek(null, '2026-11-01')).toBe(null);
  });
  it('the header week and the milestone label cannot disagree: the label is the helper\'s number', () => {
    const week = pregnancyWeek('2027-03-17', '2026-11-01');   // the UAT case: week 21
    expect(week).toBe(21);
    expect(pregnancyMilestone(week)).toMatchObject({ week: 20 });
    expect(pregnancyMilestone(week).msg).not.toMatch(/^Week \d/);   // no literal number in the message
  });
  it('postnatalWeek counts completed weeks: day 56 is week 8, not "Week 6"', () => {
    expect(postnatalDays('2026-09-06', '2026-11-01')).toBe(56);
    expect(postnatalWeek('2026-09-06', '2026-11-01')).toBe(8);
    expect(postnatalWeek('2026-09-20', '2026-11-01')).toBe(6);   // day 42
    expect(postnatalWeek('2026-10-30', '2026-11-01')).toBe(0);
    expect(postnatalWeek('2026-11-02', '2026-11-01')).toBe(null);
    expect(postnatalWeek(null, '2026-11-01')).toBe(null);
  });
  it('the label is a day count in the first week and a week count after it', () => {
    expect(postnatalLabel(5)).toEqual({ key: 'Day {n}', n: 5 });
    expect(postnatalLabel(56)).toEqual({ key: 'Week {n}', n: 8 });
  });
  it('the midwife / GP clearance prompt shows only while no clearance is recorded', () => {
    expect(postnatalMilestone(56, false).clearance).toBe(true);
    expect(postnatalMilestone(56, true)).toBe(null);
    expect(postnatalMilestone(100, true).msg).toMatch(/Core rebuilding/);
    expect(postnatalMilestone(2, false)).toBe(null);
  });
});

describe('Deze week — one row for the selected day', () => {
  const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01'];
  const today = '2026-11-01';
  it('defaults to today, follows a tap, falls back when the pick is out of view', () => {
    expect(selectedDay(days, today)).toBe(today);
    expect(selectedDay(days, today, '2026-10-29')).toBe('2026-10-29');
    expect(selectedDay(days, today, '2026-09-01')).toBe(today);
    expect(selectedDay(['2026-11-02', '2026-11-03'], today)).toBe('2026-11-03');
  });
  it('offers "log" for one empty day in the window, never a row per day', () => {
    const kinds = days.map((d) => dayRowKind(d, today, false));
    expect(kinds.every((k) => k === 'log')).toBe(true);        // each day could be logged…
    expect(dayRowKind(today, today, true)).toBe('done');       // …but only the selected one renders a row
    expect(dayRowKind('2026-10-20', today, false)).toBe('none'); // outside the 6-day window
    expect(dayRowKind('2026-11-02', today, false)).toBe('upcoming');
    expect(dayRowKind(today, today, false, false)).toBe('none'); // no onLogged handler
  });
  it('Aankomend shows two days until the whole week is asked for', () => {
    const list = Array.from({ length: 7 }, (_, i) => ({ date: `d${i}` }));
    expect(upcomingShown(list, false).map((x) => x.date)).toEqual(['d0', 'd1']);
    expect(upcomingShown(list, true)).toHaveLength(7);
    expect(upcomingShown(null, false)).toEqual([]);
  });
});

describe('Coach view — print only what is true', () => {
  it('"Sessie 0 van 3" is "no session yet"', () => {
    expect(noSessionYet(0)).toBe(true);
    expect(noSessionYet(undefined)).toBe(true);
    expect(noSessionYet(1)).toBe(false);
  });
  it('FTP 200 W is the default until an FTP was entered or tested', () => {
    expect(ftpEntered({ ftp_watts: 200 })).toBe(false);
    expect(ftpEntered({})).toBe(false);
    expect(ftpEntered({ ftp_watts: null })).toBe(false);
    expect(ftpEntered({ ftp_watts: 230 })).toBe(true);
    expect(ftpEntered({ ftp_watts: 200, ftp_tested_at_ms: 1700000000000 })).toBe(true);
    expect(ftpEntered({ ftp_watts: 200, ftp_history: [{ ftp_watts: 200 }] })).toBe(true);
  });
});
